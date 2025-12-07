
-- Create banks_nbfc table for Bank/NBFC master data
CREATE TABLE public.banks_nbfc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bank_code VARCHAR NOT NULL,
  bank_name VARCHAR NOT NULL,
  bank_type VARCHAR NOT NULL DEFAULT 'bank', -- 'bank', 'nbfc'
  contact_person VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  branch_name VARCHAR,
  ifsc_code VARCHAR,
  account_number VARCHAR,
  interest_rate NUMERIC,
  credit_limit NUMERIC,
  is_active BOOLEAN DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, bank_code)
);

-- Create loyalties table for company employees
CREATE TABLE public.loyalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Employee identification
  loyalty_code VARCHAR NOT NULL,
  employee_id VARCHAR,
  
  -- Personal details (like customers)
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  alternate_phone VARCHAR,
  email VARCHAR,
  date_of_birth DATE,
  gender public.gender_type,
  
  -- Address
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  pincode VARCHAR,
  
  -- Employment details
  designation VARCHAR,
  department VARCHAR,
  joining_date DATE,
  
  -- Document uploads
  photo_url TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  pan_card_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  remarks TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(client_id, loyalty_code)
);

-- Create loyalty_bank_accounts table for multiple bank accounts per employee
CREATE TABLE public.loyalty_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  loyalty_id UUID NOT NULL REFERENCES loyalties(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES banks_nbfc(id) ON DELETE CASCADE,
  
  -- Account details
  account_holder_name VARCHAR NOT NULL,
  account_number VARCHAR NOT NULL,
  ifsc_code VARCHAR,
  account_type VARCHAR DEFAULT 'savings', -- 'savings', 'current', 'overdraft'
  
  -- Limits and rates
  credit_limit NUMERIC,
  interest_rate NUMERIC,
  
  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  remarks TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(loyalty_id, bank_id, account_number)
);

-- Create repledge_packets table for packets sent to banks
CREATE TABLE public.repledge_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  bank_id UUID NOT NULL REFERENCES banks_nbfc(id),
  loyalty_id UUID REFERENCES loyalties(id), -- Employee handling this packet
  
  -- Packet identification
  packet_number VARCHAR NOT NULL,
  packet_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Loan summary (aggregated)
  total_loans INTEGER NOT NULL DEFAULT 0,
  total_principal NUMERIC NOT NULL DEFAULT 0,
  total_gold_weight_grams NUMERIC NOT NULL DEFAULT 0,
  total_appraised_value NUMERIC NOT NULL DEFAULT 0,
  
  -- Bank loan details
  bank_loan_amount NUMERIC,
  bank_interest_rate NUMERIC,
  bank_reference_number VARCHAR,
  bank_loan_date DATE,
  bank_maturity_date DATE,
  
  -- Document uploads (optional, can be added later)
  packet_images TEXT[], -- Array of packet image URLs
  bank_receipt_images TEXT[], -- Array of bank receipt URLs
  
  -- Status tracking
  status VARCHAR DEFAULT 'active', -- 'active', 'partially_released', 'released', 'cancelled'
  released_date DATE,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(client_id, packet_number)
);

-- Create repledge_items table for individual loans in packets
CREATE TABLE public.repledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  packet_id UUID REFERENCES repledge_packets(id) ON DELETE SET NULL, -- NULL = In-Vault
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  
  -- Snapshot at time of repledge
  principal_amount NUMERIC NOT NULL,
  gold_weight_grams NUMERIC NOT NULL,
  appraised_value NUMERIC NOT NULL,
  
  -- Jewel images (optional, can have multiple)
  jewel_images TEXT[],
  
  -- Status
  status VARCHAR DEFAULT 'in_vault', -- 'in_vault', 'repledged', 'released'
  repledged_date DATE,
  released_date DATE,
  
  -- Audit
  added_by UUID REFERENCES profiles(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(loan_id) -- Each loan can only be in one place at a time
);

-- Enable RLS on all tables
ALTER TABLE public.banks_nbfc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repledge_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repledge_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banks_nbfc
CREATE POLICY "Users can view banks in their client"
ON public.banks_nbfc FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage banks"
ON public.banks_nbfc FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

-- RLS Policies for loyalties
CREATE POLICY "Users can view loyalties in their client"
ON public.loyalties FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage loyalties"
ON public.loyalties FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

-- RLS Policies for loyalty_bank_accounts
CREATE POLICY "Users can view loyalty bank accounts in their client"
ON public.loyalty_bank_accounts FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage loyalty bank accounts"
ON public.loyalty_bank_accounts FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

-- RLS Policies for repledge_packets
CREATE POLICY "Users can view repledge packets in their client"
ON public.repledge_packets FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage repledge packets"
ON public.repledge_packets FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
);

-- RLS Policies for repledge_items
CREATE POLICY "Users can view repledge items in their client"
ON public.repledge_items FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage repledge items"
ON public.repledge_items FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
);

-- Create packet number generator function
CREATE OR REPLACE FUNCTION public.generate_packet_number(p_client_id uuid)
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
  FROM repledge_packets 
  WHERE client_id = p_client_id;
  
  v_number := 'PKT' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- Create loyalty code generator function
CREATE OR REPLACE FUNCTION public.generate_loyalty_code(p_client_id uuid)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_code VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM loyalties 
  WHERE client_id = p_client_id;
  
  v_code := 'EMP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_banks_nbfc_updated_at
  BEFORE UPDATE ON public.banks_nbfc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalties_updated_at
  BEFORE UPDATE ON public.loyalties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_bank_accounts_updated_at
  BEFORE UPDATE ON public.loyalty_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repledge_packets_updated_at
  BEFORE UPDATE ON public.repledge_packets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repledge_items_updated_at
  BEFORE UPDATE ON public.repledge_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
