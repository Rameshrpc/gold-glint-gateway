-- Add rebate columns to loans table for rebate section in PDFs
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rebate_days INTEGER DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rebate_amount NUMERIC(12,2) DEFAULT 0;