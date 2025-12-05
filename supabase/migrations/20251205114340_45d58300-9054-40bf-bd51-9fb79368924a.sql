-- Create enums for Phase 2
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.id_proof_type AS ENUM ('aadhaar', 'pan', 'voter_id', 'passport', 'driving_license');
CREATE TYPE public.gold_item_type AS ENUM ('necklace', 'chain', 'bangle', 'ring', 'earring', 'pendant', 'coin', 'bar', 'other');
CREATE TYPE public.gold_purity AS ENUM ('24k', '22k', '20k', '18k', '14k');
CREATE TYPE public.loan_status AS ENUM ('active', 'closed', 'overdue', 'auctioned');
CREATE TYPE public.closure_type AS ENUM ('redeemed', 'auctioned', 'written_off');

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_code VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  alternate_phone VARCHAR,
  email VARCHAR,
  date_of_birth DATE,
  gender gender_type,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  pincode VARCHAR,
  id_type id_proof_type,
  id_number VARCHAR,
  id_proof_url TEXT,
  photo_url TEXT,
  occupation VARCHAR,
  monthly_income DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, customer_code)
);

-- Create schemes table
CREATE TABLE public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  scheme_code VARCHAR NOT NULL,
  scheme_name VARCHAR NOT NULL,
  description TEXT,
  interest_rate DECIMAL(5,2) NOT NULL, -- Monthly interest rate percentage
  min_amount DECIMAL(12,2) NOT NULL DEFAULT 1000,
  max_amount DECIMAL(12,2) NOT NULL DEFAULT 10000000,
  min_tenure_days INTEGER NOT NULL DEFAULT 30,
  max_tenure_days INTEGER NOT NULL DEFAULT 365,
  ltv_percentage DECIMAL(5,2) NOT NULL DEFAULT 75, -- Loan to Value ratio
  processing_fee_percentage DECIMAL(5,2) DEFAULT 0,
  penalty_rate DECIMAL(5,2) DEFAULT 2, -- For overdue
  grace_period_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, scheme_code)
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
  loan_number VARCHAR NOT NULL,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  tenure_days INTEGER NOT NULL,
  maturity_date DATE NOT NULL,
  processing_fee DECIMAL(12,2) DEFAULT 0,
  net_disbursed DECIMAL(12,2) NOT NULL,
  status loan_status NOT NULL DEFAULT 'active',
  closed_date DATE,
  closure_type closure_type,
  remarks TEXT,
  created_by UUID REFERENCES public.profiles(id),
  appraised_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, loan_number)
);

-- Create gold_items table
CREATE TABLE public.gold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  item_type gold_item_type NOT NULL,
  description VARCHAR,
  gross_weight_grams DECIMAL(10,3) NOT NULL,
  net_weight_grams DECIMAL(10,3) NOT NULL,
  purity gold_purity NOT NULL,
  purity_percentage DECIMAL(5,2) NOT NULL,
  stone_weight_grams DECIMAL(10,3) DEFAULT 0,
  market_rate_per_gram DECIMAL(10,2) NOT NULL,
  appraised_value DECIMAL(12,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_items ENABLE ROW LEVEL SECURITY;

-- Create helper function to check branch access
CREATE OR REPLACE FUNCTION public.user_has_branch_access(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = _user_id
      AND (p.branch_id = _branch_id OR p.branch_id IS NULL)
      AND p.client_id = (SELECT client_id FROM branches WHERE id = _branch_id)
  )
$$;

-- RLS Policies for customers
CREATE POLICY "Platform admins can manage all customers"
ON public.customers FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view customers in their client"
ON public.customers FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage customers in their branch"
ON public.customers FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    has_role(auth.uid(), 'loan_officer') OR
    has_role(auth.uid(), 'appraiser')
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    has_role(auth.uid(), 'loan_officer') OR
    has_role(auth.uid(), 'appraiser')
  )
);

-- RLS Policies for schemes
CREATE POLICY "Platform admins can manage all schemes"
ON public.schemes FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view schemes in their client"
ON public.schemes FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Tenant admins can manage schemes"
ON public.schemes FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) AND
  has_role(auth.uid(), 'tenant_admin')
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) AND
  has_role(auth.uid(), 'tenant_admin')
);

-- RLS Policies for loans
CREATE POLICY "Platform admins can manage all loans"
ON public.loans FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view loans in their client"
ON public.loans FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage loans"
ON public.loans FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    has_role(auth.uid(), 'loan_officer')
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    has_role(auth.uid(), 'loan_officer')
  )
);

-- RLS Policies for gold_items
CREATE POLICY "Platform admins can manage all gold items"
ON public.gold_items FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view gold items for loans in their client"
ON public.gold_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = gold_items.loan_id
      AND l.client_id = get_user_client_id(auth.uid())
  )
);

CREATE POLICY "Branch staff can manage gold items"
ON public.gold_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = gold_items.loan_id
      AND l.client_id = get_user_client_id(auth.uid())
      AND (
        has_role(auth.uid(), 'tenant_admin') OR
        has_role(auth.uid(), 'branch_manager') OR
        has_role(auth.uid(), 'loan_officer') OR
        has_role(auth.uid(), 'appraiser')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = gold_items.loan_id
      AND l.client_id = get_user_client_id(auth.uid())
      AND (
        has_role(auth.uid(), 'tenant_admin') OR
        has_role(auth.uid(), 'branch_manager') OR
        has_role(auth.uid(), 'loan_officer') OR
        has_role(auth.uid(), 'appraiser')
      )
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schemes_updated_at
BEFORE UPDATE ON public.schemes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_customers_client_id ON public.customers(client_id);
CREATE INDEX idx_customers_branch_id ON public.customers(branch_id);
CREATE INDEX idx_schemes_client_id ON public.schemes(client_id);
CREATE INDEX idx_loans_client_id ON public.loans(client_id);
CREATE INDEX idx_loans_branch_id ON public.loans(branch_id);
CREATE INDEX idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_gold_items_loan_id ON public.gold_items(loan_id);