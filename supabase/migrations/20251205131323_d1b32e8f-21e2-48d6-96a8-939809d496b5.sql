-- Add dual-rate columns to schemes table
ALTER TABLE public.schemes 
ADD COLUMN IF NOT EXISTS shown_rate NUMERIC NOT NULL DEFAULT 18,
ADD COLUMN IF NOT EXISTS effective_rate NUMERIC,
ADD COLUMN IF NOT EXISTS minimum_days INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS advance_interest_months INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS rate_per_gram NUMERIC;

-- Set effective_rate from existing interest_rate (annualized)
UPDATE public.schemes SET effective_rate = interest_rate * 12 WHERE effective_rate IS NULL;

-- Add dual-principal and interest tracking columns to loans table
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS shown_principal NUMERIC,
ADD COLUMN IF NOT EXISTS actual_principal NUMERIC,
ADD COLUMN IF NOT EXISTS advance_interest_shown NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_interest_actual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS differential_capitalized NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_interest_due_date DATE,
ADD COLUMN IF NOT EXISTS last_interest_paid_date DATE,
ADD COLUMN IF NOT EXISTS total_interest_paid NUMERIC DEFAULT 0;

-- Set shown_principal and actual_principal for existing loans
UPDATE public.loans SET 
  shown_principal = principal_amount,
  actual_principal = principal_amount
WHERE shown_principal IS NULL;

-- Create payment_mode enum
DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'neft', 'rtgs', 'cheque', 'card', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create interest_payments table
CREATE TABLE IF NOT EXISTS public.interest_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  
  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'cash',
  receipt_number VARCHAR(50) NOT NULL,
  
  -- Dual-rate tracking
  amount_paid NUMERIC NOT NULL,
  shown_interest NUMERIC NOT NULL,
  actual_interest NUMERIC NOT NULL,
  differential_capitalized NUMERIC DEFAULT 0,
  principal_reduction NUMERIC DEFAULT 0,
  
  -- Period covered
  days_covered INTEGER NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  
  -- Penalty (if any)
  overdue_days INTEGER DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  
  -- Tracking
  collected_by UUID REFERENCES public.profiles(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on receipt_number per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_interest_payments_receipt 
ON public.interest_payments(client_id, receipt_number);

-- Enable RLS
ALTER TABLE public.interest_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interest_payments
CREATE POLICY "Users can view interest payments in their client"
ON public.interest_payments
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage interest payments"
ON public.interest_payments
FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), 'branch_manager'::app_role) OR 
    has_role(auth.uid(), 'loan_officer'::app_role)
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), 'branch_manager'::app_role) OR 
    has_role(auth.uid(), 'loan_officer'::app_role)
  )
);

CREATE POLICY "Platform admins can manage all interest payments"
ON public.interest_payments
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_interest_payments_updated_at
BEFORE UPDATE ON public.interest_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_client_id uuid)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_receipt VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM interest_payments 
  WHERE client_id = p_client_id;
  
  v_receipt := 'RCP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 5, '0');
  RETURN v_receipt;
END;
$$;