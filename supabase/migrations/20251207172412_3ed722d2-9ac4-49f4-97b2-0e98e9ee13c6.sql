-- Create auctions table for managing overdue/matured loan auctions
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  
  -- Auction identification
  auction_lot_number VARCHAR NOT NULL,
  auction_date DATE NOT NULL,
  
  -- Outstanding at time of auction
  outstanding_principal NUMERIC NOT NULL,
  outstanding_interest NUMERIC NOT NULL DEFAULT 0,
  outstanding_penalty NUMERIC NOT NULL DEFAULT 0,
  total_outstanding NUMERIC NOT NULL,
  
  -- Gold details at auction
  total_gold_weight_grams NUMERIC NOT NULL,
  total_appraised_value NUMERIC NOT NULL,
  reserve_price NUMERIC NOT NULL,
  
  -- Sale details
  sold_price NUMERIC,
  buyer_name VARCHAR,
  buyer_contact VARCHAR,
  buyer_address TEXT,
  payment_mode VARCHAR DEFAULT 'cash',
  payment_reference VARCHAR,
  
  -- Settlement
  surplus_amount NUMERIC DEFAULT 0,
  shortfall_amount NUMERIC DEFAULT 0,
  surplus_returned BOOLEAN DEFAULT false,
  surplus_returned_date DATE,
  surplus_returned_to VARCHAR,
  
  -- Status tracking
  status VARCHAR DEFAULT 'scheduled',
  customer_notified BOOLEAN DEFAULT false,
  customer_notified_date DATE,
  gold_verified BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  processed_by UUID REFERENCES profiles(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Branch staff can manage auctions"
ON public.auctions
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR 
    has_role(auth.uid(), 'branch_manager') OR 
    has_role(auth.uid(), 'loan_officer')))
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR 
    has_role(auth.uid(), 'branch_manager') OR 
    has_role(auth.uid(), 'loan_officer')))
);

CREATE POLICY "Platform admins can manage all auctions"
ON public.auctions
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view auctions in their client"
ON public.auctions
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_auctions_updated_at
BEFORE UPDATE ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate auction lot number
CREATE OR REPLACE FUNCTION public.generate_auction_lot_number(p_client_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_lot_number VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM auctions 
  WHERE client_id = p_client_id;
  
  v_lot_number := 'AUC' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_lot_number;
END;
$$;