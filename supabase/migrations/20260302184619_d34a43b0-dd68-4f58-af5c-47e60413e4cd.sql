
-- Add WAHA API columns to client_notification_settings
ALTER TABLE public.client_notification_settings 
  ADD COLUMN IF NOT EXISTS waha_api_url text,
  ADD COLUMN IF NOT EXISTS waha_api_key text,
  ADD COLUMN IF NOT EXISTS waha_session_name text DEFAULT 'default';

-- Disable the old Make.com outbound trigger (no longer needed with direct WAHA calls)
DROP TRIGGER IF EXISTS trg_whatsapp_outbound_to_make ON public.whatsapp_messages;
