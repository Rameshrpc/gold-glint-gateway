-- ============================================
-- PHASE 1: Fix Customer Sessions RLS (CRITICAL)
-- ============================================

-- Drop all existing policies on customer_sessions
DROP POLICY IF EXISTS "Allow customer session management" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public to create sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public to read sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Allow public to update sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to read sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Customer sessions are managed by service role only" ON customer_sessions;
DROP POLICY IF EXISTS "customer_sessions_select_policy" ON customer_sessions;
DROP POLICY IF EXISTS "customer_sessions_insert_policy" ON customer_sessions;
DROP POLICY IF EXISTS "customer_sessions_update_policy" ON customer_sessions;
DROP POLICY IF EXISTS "customer_sessions_delete_policy" ON customer_sessions;

-- The table already has RLS enabled, but we need to ensure NO public access
-- Service role key bypasses RLS, so edge functions will still work

-- No policies = no access except via service role (which edge functions use)
-- This is the most secure approach for customer_sessions

-- ============================================
-- PHASE 2: Clean Duplicate Schemes
-- ============================================

-- Delete duplicate sale agreement schemes, keeping only the first one per client
DELETE FROM schemes 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY client_id, scheme_code ORDER BY created_at ASC) as rn
    FROM schemes
    WHERE scheme_type = 'sale_agreement'
  ) sub
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE schemes 
ADD CONSTRAINT schemes_client_scheme_code_unique 
UNIQUE (client_id, scheme_code);

-- ============================================
-- PHASE 3: Add Authorization to SECURITY DEFINER Functions
-- ============================================

-- Update generate_customer_code to validate authorization
CREATE OR REPLACE FUNCTION public.generate_customer_code(p_client_id uuid, p_branch_code character varying)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seq INTEGER;
  v_code VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check: verify caller has access to this client
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

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
$function$;

-- Update generate_receipt_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_receipt VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM interest_payments 
  WHERE client_id = p_client_id;
  
  v_receipt := 'RCP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 5, '0');
  RETURN v_receipt;
END;
$function$;

-- Update generate_redemption_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_redemption_number(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_number VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM redemptions 
  WHERE client_id = p_client_id;
  
  v_number := 'RED' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 5, '0');
  RETURN v_number;
END;
$function$;

-- Update generate_voucher_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_voucher_number(p_client_id uuid, p_voucher_type character varying)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_prefix VARCHAR;
  v_number VARCHAR;
  v_year_month VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  v_prefix := CASE p_voucher_type
    WHEN 'receipt' THEN 'RCV'
    WHEN 'payment' THEN 'PAY'
    WHEN 'contra' THEN 'CTR'
    WHEN 'journal' THEN 'JRN'
    WHEN 'loan_disbursement' THEN 'DISB'
    WHEN 'interest_collection' THEN 'INT'
    WHEN 'redemption' THEN 'REDV'
    WHEN 'reloan' THEN 'RLN'
    WHEN 'auction' THEN 'AUCV'
    WHEN 'repledge_credit' THEN 'RPLC'
    WHEN 'repledge_redemption' THEN 'RPLR'
    WHEN 'agent_commission' THEN 'COMM'
    WHEN 'agent_commission_accrual' THEN 'ACRL'
    ELSE 'VCH'
  END;
  
  v_year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
  
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_client_id::text || p_voucher_type));
  
  SELECT COUNT(*) + 1 INTO v_count 
  FROM vouchers 
  WHERE client_id = p_client_id 
    AND voucher_type = p_voucher_type
    AND TO_CHAR(voucher_date, 'YYMM') = v_year_month;
  
  v_number := v_prefix || '/' || v_year_month || '/' || LPAD(v_count::TEXT, 5, '0');
  RETURN v_number;
END;
$function$;

-- Update generate_auction_lot_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_auction_lot_number(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_lot_number VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM auctions 
  WHERE client_id = p_client_id;
  
  v_lot_number := 'AUC' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_lot_number;
END;
$function$;

-- Update generate_packet_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_packet_number(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_number VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM repledge_packets 
  WHERE client_id = p_client_id;
  
  v_number := 'PKT' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$function$;

-- Update generate_loyalty_code to validate authorization
CREATE OR REPLACE FUNCTION public.generate_loyalty_code(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_code VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM loyalties 
  WHERE client_id = p_client_id;
  
  v_code := 'EMP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$function$;

-- Update generate_repledge_redemption_number to validate authorization
CREATE OR REPLACE FUNCTION public.generate_repledge_redemption_number(p_client_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_number VARCHAR;
  v_caller_client_id UUID;
BEGIN
  -- Authorization check
  v_caller_client_id := get_user_client_id(auth.uid());
  IF v_caller_client_id IS NULL OR (v_caller_client_id != p_client_id AND NOT is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  SELECT COUNT(*) + 1 INTO v_count 
  FROM repledge_redemptions 
  WHERE client_id = p_client_id;
  
  v_number := 'RPR' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$function$;