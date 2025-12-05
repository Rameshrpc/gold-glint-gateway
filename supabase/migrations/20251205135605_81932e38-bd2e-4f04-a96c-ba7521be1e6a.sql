-- Create redemptions table for loan closures
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  client_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  redemption_number VARCHAR NOT NULL,
  redemption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Outstanding at closure
  outstanding_principal DECIMAL NOT NULL,
  interest_due DECIMAL NOT NULL DEFAULT 0,
  penalty_amount DECIMAL DEFAULT 0,
  rebate_amount DECIMAL DEFAULT 0,
  
  -- Settlement
  total_settlement DECIMAL NOT NULL,
  amount_received DECIMAL NOT NULL,
  payment_mode VARCHAR NOT NULL DEFAULT 'cash',
  payment_reference VARCHAR,
  
  -- Gold release
  gold_released BOOLEAN DEFAULT FALSE,
  gold_released_date DATE,
  released_to VARCHAR,
  released_by UUID,
  
  -- Verification
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  
  -- Audit
  processed_by UUID,
  approved_by UUID,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for redemptions
CREATE POLICY "Users can view redemptions in their client"
ON public.redemptions
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage redemptions"
ON public.redemptions
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND
  (has_role(auth.uid(), 'tenant_admin') OR 
   has_role(auth.uid(), 'branch_manager') OR 
   has_role(auth.uid(), 'loan_officer'))
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND
  (has_role(auth.uid(), 'tenant_admin') OR 
   has_role(auth.uid(), 'branch_manager') OR 
   has_role(auth.uid(), 'loan_officer'))
);

CREATE POLICY "Platform admins can manage all redemptions"
ON public.redemptions
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_redemptions_updated_at
BEFORE UPDATE ON public.redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate redemption number
CREATE OR REPLACE FUNCTION public.generate_redemption_number(p_client_id uuid)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_number VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM redemptions 
  WHERE client_id = p_client_id;
  
  v_number := 'RED' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 5, '0');
  RETURN v_number;
END;
$$;