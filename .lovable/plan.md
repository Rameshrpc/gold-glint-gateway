

## Plan: WhatsApp Shared Inbox Tables (Periskope-style)

### Context

Your project **already has** the following tables that cover the first two requirements:
- **`customers`** -- Full KYC, phone number, branch/client scoping
- **`loans`** + **`gold_items`** -- Loan ID, principal, interest rate, weights, status

So **no new tables are needed** for customers or gold pledges. We only need to create the two WhatsApp shared inbox tables.

---

### New Tables

#### 1. `whatsapp_chats`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `client_id` | UUID FK → clients | Multi-tenant isolation |
| `customer_id` | UUID FK → customers | Linked customer |
| `customer_phone` | VARCHAR NOT NULL | WhatsApp number (E.164) |
| `status` | VARCHAR DEFAULT 'open' | `open`, `resolved`, `bot_handled` |
| `assigned_to` | UUID FK → profiles(user_id) | Staff agent handling chat |
| `last_message_at` | TIMESTAMPTZ | For sorting inbox |
| `last_message_preview` | TEXT | Snippet for inbox list |
| `unread_count` | INT DEFAULT 0 | Unread messages for agent |
| `tags` | TEXT[] | Labels like "overdue", "payment" |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

Unique constraint on `(client_id, customer_phone)` -- one chat per customer per tenant.

#### 2. `whatsapp_messages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `chat_id` | UUID FK → whatsapp_chats | Parent chat |
| `client_id` | UUID FK → clients | Denormalized for RLS |
| `sender_type` | VARCHAR NOT NULL | `customer`, `bot`, `human` |
| `sender_id` | UUID NULL | Staff user_id if `human` |
| `message_text` | TEXT | |
| `message_type` | VARCHAR DEFAULT 'text' | `text`, `image`, `document`, `template` |
| `media_url` | TEXT NULL | Attachment URL |
| `provider_message_id` | VARCHAR NULL | MSG91/WhatsApp message ID |
| `delivery_status` | VARCHAR DEFAULT 'sent' | `sent`, `delivered`, `read`, `failed` |
| `is_outbound` | BOOLEAN DEFAULT false | true = sent by staff/bot |
| `created_at` | TIMESTAMPTZ | |

Index on `(chat_id, created_at)` for message history queries.

---

### RLS Policies

Both tables use the existing `get_user_client_id()` security definer function for tenant isolation:

```sql
-- whatsapp_chats: Staff can only see their tenant's chats
CREATE POLICY "tenant_isolation" ON whatsapp_chats
  FOR ALL TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

-- whatsapp_messages: Staff can only see their tenant's messages  
CREATE POLICY "tenant_isolation" ON whatsapp_messages
  FOR ALL TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));
```

---

### Realtime

Enable realtime on both tables so the shared inbox updates live when new messages arrive:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
```

---

### What This Does NOT Include (Future Phases)

- **Inbox UI page** -- React component for the shared inbox view (chat list + message thread)
- **Webhook endpoint** -- Edge function to receive incoming WhatsApp messages from MSG91
- **Bot routing logic** -- Auto-reply rules before escalating to human agent
- **Assignment logic** -- Round-robin or manual agent assignment

These can be built incrementally once the schema is in place.

---

### Files to Create/Modify

| File | Change |
|------|--------|
| Database Migration | Create `whatsapp_chats` and `whatsapp_messages` tables with FKs, RLS, indexes, realtime |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

### No Breaking Changes

Additive schema only. No existing tables or code are modified.

