
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add WhatsApp config columns to client_notification_settings
ALTER TABLE public.client_notification_settings
  ADD COLUMN IF NOT EXISTS make_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS wasender_api_key TEXT;

-- Update the notify function to read webhook URL from settings
CREATE OR REPLACE FUNCTION public.notify_make_outbound_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_webhook_url TEXT;
  v_phone TEXT;
BEGIN
  IF NEW.is_outbound = true THEN
    -- Get the webhook URL from client settings
    SELECT make_webhook_url INTO v_webhook_url
    FROM public.client_notification_settings
    WHERE client_id = NEW.client_id
    LIMIT 1;

    -- Get customer phone from chat
    SELECT customer_phone INTO v_phone
    FROM public.whatsapp_chats
    WHERE id = NEW.chat_id
    LIMIT 1;

    -- Only fire if webhook URL is configured
    IF v_webhook_url IS NOT NULL AND v_webhook_url != '' THEN
      PERFORM net.http_post(
        url := v_webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'id', NEW.id,
          'chat_id', NEW.chat_id,
          'client_id', NEW.client_id,
          'phone', v_phone,
          'sender_type', NEW.sender_type,
          'sender_id', NEW.sender_id,
          'message_text', NEW.message_text,
          'message_type', NEW.message_type,
          'is_outbound', NEW.is_outbound,
          'created_at', NEW.created_at
        )::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS trg_whatsapp_outbound_to_make ON public.whatsapp_messages;
CREATE TRIGGER trg_whatsapp_outbound_to_make
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  WHEN (NEW.is_outbound = true)
  EXECUTE FUNCTION public.notify_make_outbound_message();
