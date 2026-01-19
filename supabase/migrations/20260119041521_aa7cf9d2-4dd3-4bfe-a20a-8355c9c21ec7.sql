-- Create scheme_versions table to store historical scheme parameters
CREATE TABLE public.scheme_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL means currently active
  
  -- All rate-related fields (snapshot of scheme at this version)
  interest_rate NUMERIC NOT NULL,
  shown_rate NUMERIC NOT NULL DEFAULT 18,
  effective_rate NUMERIC,
  minimum_days INTEGER NOT NULL DEFAULT 30,
  advance_interest_months INTEGER NOT NULL DEFAULT 3,
  rate_per_gram NUMERIC,
  rate_18kt NUMERIC,
  rate_22kt NUMERIC,
  min_amount NUMERIC NOT NULL DEFAULT 1000,
  max_amount NUMERIC NOT NULL DEFAULT 10000000,
  min_tenure_days INTEGER NOT NULL DEFAULT 30,
  max_tenure_days INTEGER NOT NULL DEFAULT 365,
  ltv_percentage NUMERIC NOT NULL DEFAULT 75,
  processing_fee_percentage NUMERIC DEFAULT 0,
  document_charges NUMERIC DEFAULT 0,
  penalty_rate NUMERIC DEFAULT 2,
  grace_period_days INTEGER DEFAULT 7,
  strike_periods JSONB,
  
  -- Audit fields
  client_id UUID NOT NULL REFERENCES public.clients(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  
  UNIQUE(scheme_id, version_number)
);

-- Add scheme_version_id to loans table
ALTER TABLE public.loans 
ADD COLUMN scheme_version_id UUID REFERENCES public.scheme_versions(id);

-- Add current_version_id to schemes table
ALTER TABLE public.schemes 
ADD COLUMN current_version_id UUID REFERENCES public.scheme_versions(id);

-- Enable RLS
ALTER TABLE public.scheme_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheme_versions
CREATE POLICY "Users can view scheme versions for their client"
  ON public.scheme_versions FOR SELECT
  USING (client_id = (SELECT client_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create scheme versions"
  ON public.scheme_versions FOR INSERT
  WITH CHECK (client_id = (SELECT client_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update scheme versions"
  ON public.scheme_versions FOR UPDATE
  USING (client_id = (SELECT client_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_scheme_versions_scheme_id ON public.scheme_versions(scheme_id);
CREATE INDEX idx_scheme_versions_client_id ON public.scheme_versions(client_id);
CREATE INDEX idx_loans_scheme_version_id ON public.loans(scheme_version_id);

-- Migrate existing scheme data to first version
INSERT INTO public.scheme_versions (
  scheme_id, client_id, version_number, effective_from,
  interest_rate, shown_rate, effective_rate, minimum_days,
  advance_interest_months, rate_per_gram, rate_18kt, rate_22kt,
  min_amount, max_amount, min_tenure_days, max_tenure_days,
  ltv_percentage, processing_fee_percentage, document_charges,
  penalty_rate, grace_period_days, strike_periods, change_reason
)
SELECT 
  id, client_id, 1, COALESCE(created_at::date, CURRENT_DATE),
  interest_rate, COALESCE(shown_rate, 18), effective_rate, COALESCE(minimum_days, 30),
  COALESCE(advance_interest_months, 3), rate_per_gram, rate_18kt, rate_22kt,
  COALESCE(min_amount, 1000), COALESCE(max_amount, 10000000), COALESCE(min_tenure_days, 30), COALESCE(max_tenure_days, 365),
  COALESCE(ltv_percentage, 75), COALESCE(processing_fee_percentage, 0), COALESCE(document_charges, 0),
  COALESCE(penalty_rate, 2), COALESCE(grace_period_days, 7), strike_periods, 'Initial version - migrated from existing scheme'
FROM public.schemes;

-- Update schemes with current version reference
UPDATE public.schemes s
SET current_version_id = (
  SELECT id FROM public.scheme_versions sv 
  WHERE sv.scheme_id = s.id 
  ORDER BY version_number DESC LIMIT 1
);

-- Update existing loans with scheme version reference (use latest version for backward compatibility)
UPDATE public.loans l
SET scheme_version_id = (
  SELECT sv.id FROM public.scheme_versions sv 
  WHERE sv.scheme_id = l.scheme_id 
  ORDER BY sv.version_number DESC LIMIT 1
)
WHERE l.scheme_version_id IS NULL;