-- Add sale_agreement_logo_url column to print_settings for Zamin Gold branding
ALTER TABLE print_settings 
ADD COLUMN IF NOT EXISTS sale_agreement_logo_url TEXT DEFAULT NULL;