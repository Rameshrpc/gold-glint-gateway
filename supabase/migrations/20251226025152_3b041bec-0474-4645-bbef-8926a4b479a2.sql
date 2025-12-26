
-- =============================================
-- PRODUCTION READINESS FIXES (Reordered)
-- =============================================

-- 1. FIX VOUCHER TYPE CONSTRAINT - Add missing 'agent_commission_accrual'
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_voucher_type_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_voucher_type_check 
CHECK (voucher_type IN (
  'receipt', 'payment', 'contra', 'journal',
  'loan_disbursement', 'interest_collection', 'redemption',
  'reloan', 'auction', 'repledge_credit', 'repledge_redemption',
  'agent_commission', 'agent_commission_accrual'
));

-- 2. FIX BRANCH STAFF WITHOUT BRANCH - Must happen BEFORE role assignment
-- Assign main branch to user with existing branch roles
UPDATE profiles 
SET branch_id = 'e7c6a4f5-0bf1-4ad3-9251-fd0e7bdee92e'
WHERE user_id = '98272144-8050-4d73-a049-206d0942ce6e';

-- Assign branches to users in client 28036932... BEFORE adding branch roles
UPDATE profiles 
SET branch_id = '4b1a128d-70f8-43b7-afa4-6574513ecedc'
WHERE user_id IN ('9a222892-b11b-4d16-8a45-9f9011a0b1fe', '591065fe-fed7-4de6-ac66-2d02fa093733', '97244659-a667-4583-bb23-c67b6562e5c4');

-- 3. FIX USERS WITHOUT ROLES - Now assign roles AFTER branches are set
INSERT INTO user_roles (user_id, role) VALUES
  ('9a222892-b11b-4d16-8a45-9f9011a0b1fe', 'loan_officer'),
  ('319feddd-06e9-45d8-ab8f-dbf705b43bfc', 'tenant_admin'),
  ('591065fe-fed7-4de6-ac66-2d02fa093733', 'loan_officer'),
  ('97244659-a667-4583-bb23-c67b6562e5c4', 'loan_officer')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. FIX VOUCHER NUMBER RACE CONDITION - Update RPC with locking
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
BEGIN
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

-- 5. SECURITY FIX - Restrict banks_nbfc access
DROP POLICY IF EXISTS "Users can view banks in their client" ON banks_nbfc;
CREATE POLICY "Users can view banks in their client"
ON banks_nbfc FOR SELECT
USING (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    is_any_admin(auth.uid()) 
    OR is_platform_admin(auth.uid())
    OR has_role(auth.uid(), 'branch_manager'::app_role)
    OR has_role(auth.uid(), 'loan_officer'::app_role)
  )
);

-- 6. SECURITY FIX - Restrict loyalty bank accounts access
DROP POLICY IF EXISTS "Users can view loyalty bank accounts" ON loyalty_bank_accounts;
CREATE POLICY "Users can view loyalty bank accounts"
ON loyalty_bank_accounts FOR SELECT
USING (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    is_any_admin(auth.uid()) 
    OR is_platform_admin(auth.uid())
    OR has_role(auth.uid(), 'branch_manager'::app_role)
    OR has_role(auth.uid(), 'loan_officer'::app_role)
  )
);

-- 7. SECURITY FIX - Restrict notification settings to tenant_admin
DROP POLICY IF EXISTS "Admins can manage notification settings" ON client_notification_settings;
DROP POLICY IF EXISTS "Users can view notification settings" ON client_notification_settings;

CREATE POLICY "Tenant admins can manage notification settings"
ON client_notification_settings FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    OR is_platform_admin(auth.uid())
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    OR is_platform_admin(auth.uid())
  )
);

CREATE POLICY "Admins can view notification settings"
ON client_notification_settings FOR SELECT
USING (
  client_id = get_user_client_id(auth.uid()) 
  AND is_any_admin(auth.uid())
);
