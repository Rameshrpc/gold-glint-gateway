

## Plan: WhatsApp Business API Integration with Templates & Automated Reminders

### Overview

Build a complete WhatsApp notification system with two modes:
1. **API mode** -- Automated server-side sending via MSG91 WhatsApp Business API for scheduled reminders
2. **Manual mode** -- wa.me links for one-off messages from staff (current approach, enhanced)

Add WhatsApp/SMS send buttons to Loans, Interest, Redemption, and Auction pages, and build a backend function that automatically sends due-date reminders daily.

---

### Architecture

```text
+------------------+      +-------------------+      +----------+
|  Staff clicks    |----->| QuickSendDialog   |----->| wa.me    |
|  WhatsApp button |      | (manual send)     |      | (browser)|
+------------------+      +-------------------+      +----------+
                                   |
                                   v
                           notification_logs (logged)

+------------------+      +-------------------+      +----------+
|  pg_cron daily   |----->| Edge Function:    |----->| MSG91    |
|  at 9:00 AM      |      | send-reminders    |      | WhatsApp |
+------------------+      +-------------------+      | API      |
                                   |                  +----------+
                                   v
                           notification_logs (with delivery status)
```

---

### Step 1: Add WhatsApp/SMS Send Buttons to Pages

Add the existing `SendButtons` component to customer rows on these pages:

| Page | Where | Template |
|------|-------|----------|
| `src/pages/Loans.tsx` | Loan list table -- actions column | `loan_disbursed` |
| `src/pages/Interest.tsx` | Loan list & after payment success | `interest_reminder`, `payment_received` |
| `src/pages/Redemption.tsx` | After redemption success | `redemption_complete` |
| `src/pages/Auction.tsx` | Auction candidates list | `auction_notice` |

Each button opens the existing `QuickSendDialog` with the right template pre-filled.

---

### Step 2: Template Management Settings Page

Create a new settings tab or section under Settings for managing notification templates.

**New file:** `src/components/settings/NotificationTemplateSettings.tsx`

Features:
- List all templates from `notification_templates` table (already seeded per client)
- Edit template content (both SMS and WhatsApp versions)
- Toggle templates active/inactive
- Preview with sample data
- Add custom templates
- Show template variables as chips (e.g., `{{customer_name}}`, `{{loan_number}}`)

Integrate into `src/pages/Settings.tsx` as a new sidebar tab (only visible when `supports_notifications` is true).

---

### Step 3: Notification Settings Panel

**New file:** `src/components/settings/NotificationSettings.tsx`

Uses existing `client_notification_settings` table to configure:
- MSG91 Auth Key, Sender ID, DLT Entity ID (stored in DB, encrypted)
- WhatsApp template namespace
- Enable/disable SMS and WhatsApp channels
- Daily/monthly SMS limits
- Default send time for automated reminders

---

### Step 4: Edge Function for Automated Reminders

**New file:** `supabase/functions/send-reminders/index.ts`

This edge function:
1. Queries all active clients with `supports_notifications = true` and `whatsapp_enabled = true`
2. For each client, finds loans where `next_interest_due_date` is 7 days, 3 days, or 1 day away
3. Matches to the appropriate template (DUE_REMINDER_7D, DUE_REMINDER_3D, DUE_REMINDER_1D)
4. Also finds overdue loans (past due date) for OVERDUE_NOTICE
5. Sends via MSG91 WhatsApp API using the client's stored `msg91_auth_key`
6. Logs each send to `notification_logs` with provider response and delivery status

**Config:** Add to `supabase/config.toml`:
```toml
[functions.send-reminders]
verify_jwt = false
```

---

### Step 5: Schedule the Cron Job

Use `pg_cron` + `pg_net` to call the edge function daily at 9:00 AM IST:

```sql
SELECT cron.schedule(
  'daily-reminders',
  '30 3 * * *',  -- 3:30 UTC = 9:00 AM IST
  $$ SELECT net.http_post(...) $$
);
```

This will be set up via the insert tool (not migration) since it contains project-specific URLs.

---

### Step 6: Enhanced Notification Logs Page

Update `src/pages/NotificationLogs.tsx` to show:
- Delivery status from API (sent, delivered, failed, read)
- Provider message ID for tracking
- Filter by template type
- Resend failed messages button
- Cost/credits tracking

---

### Step 7: Database Changes

**Migration -- add `whatsapp` channel support to templates:**

```sql
-- Add WhatsApp-specific template content column
ALTER TABLE notification_templates 
  ADD COLUMN IF NOT EXISTS template_content_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS channel_type VARCHAR DEFAULT 'both' 
    CHECK (channel_type IN ('sms', 'whatsapp', 'both'));

-- Seed WhatsApp versions of existing templates
UPDATE notification_templates 
SET template_content_whatsapp = CASE template_code
  WHEN 'DUE_REMINDER_7D' THEN 'Dear *{{customer_name}}*,...(rich WhatsApp format)'
  ...
END
WHERE template_content_whatsapp IS NULL;
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/Loans.tsx` | Add SendButtons to loan table rows |
| `src/pages/Interest.tsx` | Add SendButtons to loan list + post-payment |
| `src/pages/Redemption.tsx` | Add SendButtons post-redemption |
| `src/pages/Auction.tsx` | Add SendButtons to auction candidates |
| `src/components/settings/NotificationTemplateSettings.tsx` | **New** -- Template CRUD UI |
| `src/components/settings/NotificationSettings.tsx` | **New** -- MSG91 config + channel settings |
| `src/pages/Settings.tsx` | Add notification tabs to settings sidebar |
| `src/pages/NotificationLogs.tsx` | Enhance with delivery status, filters, resend |
| `supabase/functions/send-reminders/index.ts` | **New** -- Automated daily reminder sender |
| `supabase/config.toml` | Add send-reminders function config |
| Database migration | Add WhatsApp template content column |
| pg_cron setup | Schedule daily 9 AM IST reminder job |

---

### Security

- MSG91 auth keys stored in `client_notification_settings` table (per-tenant, RLS-protected)
- Edge function validates caller via cron secret or admin JWT
- Rate limiting via `daily_sms_limit` and `monthly_sms_limit` columns
- All sends logged to `notification_logs` for audit trail

### No Breaking Changes

- Existing wa.me manual sending continues to work
- SendButtons are additive UI -- no existing functionality removed
- Templates already seeded via `initialize_notification_templates` function

