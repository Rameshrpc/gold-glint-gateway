-- Create nominee relation type enum
CREATE TYPE nominee_relation_type AS ENUM (
  'father',
  'mother', 
  'spouse',
  'son',
  'daughter',
  'brother',
  'sister',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'other'
);

-- Drop old columns from customers
ALTER TABLE customers DROP COLUMN IF EXISTS id_type;
ALTER TABLE customers DROP COLUMN IF EXISTS id_number;
ALTER TABLE customers DROP COLUMN IF EXISTS id_proof_url;

-- Add new document columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS aadhaar_front_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS aadhaar_back_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pan_card_url TEXT;

-- Add nominee columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nominee_relation nominee_relation_type;

-- Create customer code sequence table
CREATE TABLE IF NOT EXISTS customer_code_sequences (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  last_sequence INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sequence table
ALTER TABLE customer_code_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policy for sequence table
CREATE POLICY "Users can manage their client sequences"
ON customer_code_sequences FOR ALL
USING (client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code(
  p_client_id UUID, 
  p_branch_code VARCHAR
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INTEGER;
  v_code VARCHAR;
BEGIN
  -- Insert or update the sequence atomically
  INSERT INTO customer_code_sequences (client_id, last_sequence, updated_at)
  VALUES (p_client_id, 1, now())
  ON CONFLICT (client_id) 
  DO UPDATE SET 
    last_sequence = customer_code_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_seq;
  
  -- Generate code: BRANCH_CODE (4 chars) + YYMMDD + 4-digit sequence
  v_code := UPPER(LEFT(COALESCE(p_branch_code, 'CUST'), 4)) || 
            TO_CHAR(CURRENT_DATE, 'YYMMDD') || 
            LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_code;
END;
$$;

-- Create storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload customer documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer-documents');

CREATE POLICY "Authenticated users can view customer documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'customer-documents');

CREATE POLICY "Authenticated users can update customer documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'customer-documents');

CREATE POLICY "Authenticated users can delete customer documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'customer-documents');