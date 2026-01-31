-- Add sale_agreement_company_name column to print_settings table
ALTER TABLE public.print_settings 
ADD COLUMN IF NOT EXISTS sale_agreement_company_name VARCHAR(255);