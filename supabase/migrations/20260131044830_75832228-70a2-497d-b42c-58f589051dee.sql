-- Add father_name column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);