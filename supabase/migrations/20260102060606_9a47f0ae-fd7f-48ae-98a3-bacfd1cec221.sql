-- Add scheme_type to schemes table (loan vs sale_agreement)
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS scheme_type VARCHAR(20) DEFAULT 'loan' 
  CHECK (scheme_type IN ('loan', 'sale_agreement'));

-- Add strike periods configuration as JSONB array
-- Example: [{"days": 30, "label_en": "0-30 Days", "label_ta": "0-30 நாட்கள்"}, ...]
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS strike_periods JSONB DEFAULT NULL;

-- Add transaction_type to loans table to distinguish loan vs sale agreement
ALTER TABLE loans ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'loan' 
  CHECK (transaction_type IN ('loan', 'sale_agreement'));

-- Add index for filtering by transaction type
CREATE INDEX IF NOT EXISTS idx_loans_transaction_type ON loans(transaction_type);

-- Add index for filtering schemes by type
CREATE INDEX IF NOT EXISTS idx_schemes_scheme_type ON schemes(scheme_type);