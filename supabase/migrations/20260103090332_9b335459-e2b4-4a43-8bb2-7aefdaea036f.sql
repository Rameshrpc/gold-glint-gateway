-- Task 1: Create sample sale agreement schemes with strike_periods
INSERT INTO schemes (client_id, scheme_code, scheme_name, scheme_type, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, document_charges, strike_periods, is_active)
SELECT 
  c.id,
  'SALE-STD',
  'Standard Sale Agreement',
  'sale_agreement',
  2.0,
  24.0,
  30.0,
  30,
  3,
  75.0,
  5000,
  5000000,
  30,
  365,
  0,
  0,
  '[{"days": 30, "label_en": "0-30 Days", "label_ta": "0-30 நாட்கள்"}, {"days": 60, "label_en": "31-60 Days", "label_ta": "31-60 நாட்கள்"}, {"days": 90, "label_en": "61-90 Days", "label_ta": "61-90 நாட்கள்"}]'::jsonb,
  true
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM schemes s WHERE s.client_id = c.id AND s.scheme_code = 'SALE-STD'
);

INSERT INTO schemes (client_id, scheme_code, scheme_name, scheme_type, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, document_charges, strike_periods, is_active)
SELECT 
  c.id,
  'SALE-PREM',
  'Premium Sale Agreement',
  'sale_agreement',
  1.8,
  22.0,
  26.0,
  30,
  3,
  80.0,
  10000,
  10000000,
  30,
  365,
  0,
  0,
  '[{"days": 30, "label_en": "0-30 Days", "label_ta": "0-30 நாட்கள்"}, {"days": 60, "label_en": "31-60 Days", "label_ta": "31-60 நாட்கள்"}, {"days": 90, "label_en": "61-90 Days", "label_ta": "61-90 நாட்கள்"}, {"days": 120, "label_en": "91-120 Days", "label_ta": "91-120 நாட்கள்"}]'::jsonb,
  true
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM schemes s WHERE s.client_id = c.id AND s.scheme_code = 'SALE-PREM'
);

-- Task 2: Fix customer_sessions security - Remove overly permissive public policies
-- First drop existing public policies
DROP POLICY IF EXISTS "Allow public delete for cleanup" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public insert for OTP requests" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public select for session validation" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public update for OTP verification" ON customer_sessions;

-- Create secure policies that only allow service role access
-- Note: Edge functions use service role which bypasses RLS, 
-- so we create restrictive policies for client-side access
CREATE POLICY "customer_sessions_service_role_only" 
ON customer_sessions FOR ALL 
USING (false) 
WITH CHECK (false);

-- Add comment explaining the security model
COMMENT ON TABLE customer_sessions IS 'Customer OTP sessions - accessed only via edge functions using service role. Direct client access is blocked for security.';

-- Update existing schemes to have strike_periods if they don't have it
UPDATE schemes 
SET strike_periods = '[{"days": 30, "label_en": "0-30 Days", "label_ta": "0-30 நாட்கள்"}, {"days": 60, "label_en": "31-60 Days", "label_ta": "31-60 நாட்கள்"}, {"days": 90, "label_en": "61-90 Days", "label_ta": "61-90 நாட்கள்"}]'::jsonb
WHERE strike_periods IS NULL 
  AND scheme_type = 'sale_agreement';