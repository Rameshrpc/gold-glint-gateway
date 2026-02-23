
-- Add WhatsApp-specific template content and channel type to notification_templates
ALTER TABLE notification_templates 
  ADD COLUMN IF NOT EXISTS template_content_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS channel_type VARCHAR(10) DEFAULT 'both';

-- Add provider tracking columns to notification_logs
ALTER TABLE notification_logs 
  ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS template_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS cost_credits NUMERIC(10,4) DEFAULT 0;
