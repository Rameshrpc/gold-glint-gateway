-- Add source account tracking to interest_payments
ALTER TABLE interest_payments
ADD COLUMN IF NOT EXISTS source_type VARCHAR CHECK (source_type IN ('company', 'employee', 'cash')),
ADD COLUMN IF NOT EXISTS source_bank_id UUID REFERENCES banks_nbfc(id),
ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES loyalty_bank_accounts(id);

-- Add source account tracking to redemptions
ALTER TABLE redemptions
ADD COLUMN IF NOT EXISTS source_type VARCHAR CHECK (source_type IN ('company', 'employee', 'cash')),
ADD COLUMN IF NOT EXISTS source_bank_id UUID REFERENCES banks_nbfc(id),
ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES loyalty_bank_accounts(id);

-- Add source account tracking to auctions
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS source_type VARCHAR CHECK (source_type IN ('company', 'employee', 'cash')),
ADD COLUMN IF NOT EXISTS source_bank_id UUID REFERENCES banks_nbfc(id),
ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES loyalty_bank_accounts(id);

-- Create repledge_redemptions table for packet closures
CREATE TABLE IF NOT EXISTS repledge_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  packet_id UUID NOT NULL REFERENCES repledge_packets(id),
  redemption_number VARCHAR NOT NULL,
  redemption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Bank loan settlement
  bank_principal_outstanding NUMERIC NOT NULL,
  bank_interest_due NUMERIC DEFAULT 0,
  bank_penalty NUMERIC DEFAULT 0,
  bank_total_settlement NUMERIC NOT NULL,
  
  -- Payment details
  payment_mode VARCHAR NOT NULL DEFAULT 'neft',
  payment_reference VARCHAR,
  source_type VARCHAR CHECK (source_type IN ('company', 'employee', 'cash')),
  source_bank_id UUID REFERENCES banks_nbfc(id),
  source_account_id UUID REFERENCES loyalty_bank_accounts(id),
  
  -- Processing
  processed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  remarks TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on repledge_redemptions
ALTER TABLE repledge_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for repledge_redemptions
CREATE POLICY "Branch staff can manage repledge redemptions"
ON repledge_redemptions FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR 
    has_role(auth.uid(), 'branch_manager') OR 
    has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR 
    has_role(auth.uid(), 'branch_manager') OR 
    has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view repledge redemptions in their client"
ON repledge_redemptions FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Create function to generate repledge redemption number
CREATE OR REPLACE FUNCTION generate_repledge_redemption_number(p_client_id uuid)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM repledge_redemptions 
  WHERE client_id = p_client_id;
  
  v_number := 'RPR' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;