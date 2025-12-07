-- Add disbursement mode, document charges, and payment reference to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS disbursement_mode VARCHAR(20) DEFAULT 'cash';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS document_charges NUMERIC DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Add default document charges to schemes table
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS document_charges NUMERIC DEFAULT 0;