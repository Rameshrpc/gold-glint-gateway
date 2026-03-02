

## WAHA API Integration Plan

**Goal**: Replace the current Wasender + Make.com pipeline with direct WAHA (WhatsApp HTTP API) calls, eliminating the middleman and enabling self-hosted WhatsApp messaging.

### Current Architecture
```text
Outbound: DB trigger → Make.com webhook → Wasender API → WhatsApp
Inbound:  WhatsApp → Wasender → Make.com → whatsapp-inbound edge function → DB
```

### New Architecture with WAHA
```text
Outbound: Edge function (whatsapp-send) → WAHA API → WhatsApp
Inbound:  WhatsApp → WAHA webhook → whatsapp-inbound edge function → DB
Status:   WAHA webhook → whatsapp-status-update edge function → DB
```

---

### Changes

#### 1. New Edge Function: `whatsapp-send`
- Called from the frontend via `supabase.functions.invoke('whatsapp-send', ...)` when an agent sends a message
- Reads WAHA URL + API key from `client_notification_settings`
- POSTs to WAHA's `/api/sendText` endpoint
- Stores the WAHA message ID as `provider_message_id` on the `whatsapp_messages` row
- Config: `verify_jwt = false` in `config.toml`

#### 2. Update `whatsapp-inbound` Edge Function
- Accept WAHA's webhook payload format (fields like `from`, `body`, `messageId`, `session`)
- Map WAHA fields to existing DB columns
- Keep backward compatibility with old format via field detection

#### 3. Update `whatsapp-status-update` Edge Function
- Accept WAHA's status webhook format (`ack` field: 1=sent, 2=delivered, 3=read)
- Map WAHA ack values to existing `delivery_status` enum

#### 4. Update WhatsApp Settings UI
- Replace "Make.com Webhook URL" with "WAHA API URL" (e.g. `http://your-server:3000`)
- Replace "Wasender API Key" with "WAHA API Key"
- Update test connection to ping WAHA's `/api/sessions` endpoint
- Update setup instructions for WAHA webhook configuration
- Show the inbound + status webhook URLs for the user to paste into WAHA dashboard

#### 5. Update Frontend Send Flow
- In `WhatsAppInbox.tsx`, after inserting the message into DB, invoke the `whatsapp-send` edge function instead of relying on the DB trigger
- Update `delivery_status` based on the edge function response

#### 6. DB Migration
- Add `waha_api_url` and `waha_api_key` columns to `client_notification_settings` (keep old columns for backward compatibility)
- Optionally disable the `trg_whatsapp_outbound_to_make` trigger (no longer needed when using direct WAHA calls)

---

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/whatsapp-send/index.ts` | **Create** — send messages via WAHA API |
| `supabase/functions/whatsapp-inbound/index.ts` | **Update** — accept WAHA webhook format |
| `supabase/functions/whatsapp-status-update/index.ts` | **Update** — accept WAHA ack format |
| `src/components/settings/WhatsAppSettings.tsx` | **Update** — WAHA config UI |
| `src/pages/WhatsAppInbox.tsx` | **Update** — call whatsapp-send on send |
| `supabase/config.toml` | **Update** — add whatsapp-send function config |
| DB Migration | Add `waha_api_url`, `waha_api_key` columns |

