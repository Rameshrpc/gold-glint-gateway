-- Add new columns for simplified Sale Agreement calculation model
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS margin_per_month NUMERIC DEFAULT 0;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS tenure_step INTEGER DEFAULT 30;

-- Add comments
COMMENT ON COLUMN public.schemes.margin_per_month IS 'Trade margin in ₹ per month per ₹1 lakh for sale agreements';
COMMENT ON COLUMN public.schemes.tenure_step IS 'Tenure increment in days (15 for sale agreements, 30 for loans)';

-- Also add to scheme_versions for historical tracking
ALTER TABLE public.scheme_versions ADD COLUMN IF NOT EXISTS margin_per_month NUMERIC DEFAULT 0;
ALTER TABLE public.scheme_versions ADD COLUMN IF NOT EXISTS tenure_step INTEGER DEFAULT 30;

COMMENT ON COLUMN public.scheme_versions.margin_per_month IS 'Trade margin in ₹ per month per ₹1 lakh for sale agreements';
COMMENT ON COLUMN public.scheme_versions.tenure_step IS 'Tenure increment in days (15 for sale agreements, 30 for loans)';