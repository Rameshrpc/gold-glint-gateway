-- Add GST details to clients table for Bill of Sale documents
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS gstin varchar(20),
ADD COLUMN IF NOT EXISTS state_code varchar(5) DEFAULT '33';

-- Add trading format settings to print_settings
ALTER TABLE public.print_settings
ADD COLUMN IF NOT EXISTS use_trading_format boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS include_bill_of_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bill_of_sale_copies integer DEFAULT 2;

-- Add to print_templates as well
ALTER TABLE public.print_templates
ADD COLUMN IF NOT EXISTS include_bill_of_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bill_of_sale_copies integer DEFAULT 2;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.gstin IS 'GST Identification Number for trading documents';
COMMENT ON COLUMN public.clients.state_code IS 'State code for GST (e.g., 33 for Tamil Nadu)';
COMMENT ON COLUMN public.print_settings.use_trading_format IS 'Use Bill of Sale format instead of Loan Receipt by default';