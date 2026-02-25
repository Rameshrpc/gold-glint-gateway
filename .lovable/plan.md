

## Plan: Connect WhatsApp via Wasender + Make.com Bridge

### Current State

Your system has:
- **Database tables**: `whatsapp_chats` and `whatsapp_messages` with RLS, realtime enabled
- **UI**: Full GLMS-integrated WhatsApp Inbox at `/whatsapp` with templates, drawer, filters
- **DB function**: `notify_make_outbound_message()` exists but **no trigger attaches it** to the `whatsapp_messages` table -- outbound messages are NOT actually firing to Make.com
- **No inbound webhook**: There is no edge function to receive incoming messages from Wasender via Make.com
- **No Wasender connector**: Wasender is not a built-in connector; the API key must be stored as a secret for Make.com to use (or stored in `client_notification_settings`)

### What Needs to Happen

```text
OUTBOUND (Agent sends message):
  UI → INSERT whatsapp_messages → DB Trigger → HTTP POST to Make.com webhook
       → Make.com → Wasender API → WhatsApp → Customer

INBOUND (Customer replies):
  Customer → WhatsApp → Wasender webhook → Make.com → Edge Function → INSERT whatsapp_messages
       → Realtime subscription → UI updates
```

---

### Step 1: Create the outbound trigger (Database Migration)

The function `notify_make_outbound_message()` already exists but is not attached. Create the trigger:

```sql
CREATE TRIGGER trg_whatsapp_outbound_to_make
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  WHEN (NEW.is_outbound = true)
  EXECUTE FUNCTION public.notify_make_outbound_message();
```

Also add the Make.com webhook URL as a configurable column on `client_notification_settings`:

```sql
ALTER TABLE public.client_notification_settings
  ADD COLUMN IF NOT EXISTS make_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS wasender_api_key TEXT;
```

Update `notify_make_outbound_message()` to read the webhook URL from `client_notification_settings` instead of the hardcoded Make.com URL currently in the function body.

---

### Step 2: Create inbound webhook Edge Function

Create `supabase/functions/whatsapp-inbound/index.ts` -- a public endpoint that Make.com calls when Wasender receives an incoming message:

- Accepts POST with `{ phone, message_text, message_type, client_id, provider_message_id }`
- Finds or creates a `whatsapp_chats` row for that phone number
- Inserts into `whatsapp_messages` with `is_outbound = false, sender_type = 'customer'`
- Updates `last_message_at`, `last_message_preview`, and increments `unread_count` on the chat
- Returns 200 OK

This function uses the service role key (available automatically in edge functions) to bypass RLS.

---

### Step 3: Create delivery status update Edge Function

Create `supabase/functions/whatsapp-status-update/index.ts`:

- Make.com calls this when Wasender reports delivery/read receipts
- Updates `delivery_status` on the matching `whatsapp_messages` row by `provider_message_id`
- Statuses: `sent` → `delivered` → `read`

---

### Step 4: Add WhatsApp Settings section to Settings page

Add a new tab or section in the existing Settings page for WhatsApp configuration:

- **Make.com Webhook URL** input field (stored in `client_notification_settings.make_webhook_url`)
- **Wasender API Key** input field (stored in `client_notification_settings.wasender_api_key`) -- needed by Make.com
- **Test Connection** button that sends a test message
- **Connection status indicator** (green/red)

---

### Step 5: Enable `pg_net` extension

The `notify_make_outbound_message()` function uses `net.http_post` which requires the `pg_net` extension. Ensure it is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

---

### Files Summary

| File | Action |
|------|--------|
| Database migration | Create trigger, add settings columns, enable pg_net |
| `supabase/functions/whatsapp-inbound/index.ts` | New -- receive inbound messages from Make.com |
| `supabase/functions/whatsapp-status-update/index.ts` | New -- delivery status updates |
| `src/pages/Settings.tsx` | Add WhatsApp connection settings section |
| `src/components/settings/WhatsAppSettings.tsx` | New -- settings form component |

### Make.com Setup (Manual, outside Lovable)

After implementation, the user needs to configure two Make.com scenarios:

1. **Outbound Scenario**: Custom Webhook (receives from DB trigger) → HTTP module (POST to Wasender `/api/v1/send-text`) → HTTP module (PATCH delivery status back via the status-update edge function)

2. **Inbound Scenario**: Custom Webhook (receives from Wasender) → HTTP module (POST to the `whatsapp-inbound` edge function URL)

