-- Add template_config column to client_print_settings for storing customization settings
ALTER TABLE client_print_settings ADD COLUMN IF NOT EXISTS 
  template_config JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN client_print_settings.template_config IS 'Stores template customization: header_text_en, header_text_ta, show_customer_details, show_gold_table, show_financial_summary, show_declaration, show_customer_signature, show_staff_signature, footer_text_en, footer_text_ta, show_terms, custom_terms_en, custom_terms_ta, primary_color, secondary_color';