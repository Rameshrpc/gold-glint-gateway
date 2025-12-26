
-- Update fix_voucher_imbalance to ONLY add balancing entries, not modify voucher headers
CREATE OR REPLACE FUNCTION public.fix_voucher_imbalance(p_voucher_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entry_debit NUMERIC;
  v_entry_credit NUMERIC;
  v_imbalance NUMERIC;
  v_client_id UUID;
  v_suspense_account_id UUID;
  v_voucher_number VARCHAR;
BEGIN
  -- Get voucher details and calculate imbalance from ENTRIES (not header)
  SELECT 
    COALESCE(SUM(ve.debit_amount), 0),
    COALESCE(SUM(ve.credit_amount), 0),
    v.client_id,
    v.voucher_number
  INTO v_entry_debit, v_entry_credit, v_client_id, v_voucher_number
  FROM vouchers v
  LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
  WHERE v.id = p_voucher_id
  GROUP BY v.client_id, v.voucher_number;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Voucher not found');
  END IF;

  v_imbalance := v_entry_debit - v_entry_credit;

  IF v_imbalance = 0 THEN
    RETURN json_build_object('success', true, 'message', 'Voucher already balanced');
  END IF;

  -- Get suspense account
  SELECT id INTO v_suspense_account_id
  FROM accounts 
  WHERE client_id = v_client_id AND account_code = 'SUSPENSE';

  IF v_suspense_account_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Suspense account not found');
  END IF;

  -- Add balancing entry ONLY - do not modify voucher header (preserves audit trail)
  IF v_imbalance > 0 THEN
    -- Need credit to balance
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration)
    VALUES (p_voucher_id, v_suspense_account_id, 0, v_imbalance, 
            'System adjustment - imbalance correction');
  ELSE
    -- Need debit to balance
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration)
    VALUES (p_voucher_id, v_suspense_account_id, ABS(v_imbalance), 0, 
            'System adjustment - imbalance correction');
  END IF;

  -- Update suspense account balance
  UPDATE accounts 
  SET current_balance = current_balance + ABS(v_imbalance)
  WHERE id = v_suspense_account_id;

  RETURN json_build_object(
    'success', true, 
    'voucher_number', v_voucher_number,
    'adjustment', v_imbalance,
    'message', 'Voucher balanced with suspense entry (header preserved)'
  );
END;
$function$;

-- Update get_accounting_health to check balance using ENTRIES sum, not header totals
CREATE OR REPLACE FUNCTION public.get_accounting_health(p_client_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
  v_unbalanced_count INTEGER;
  v_total_imbalance NUMERIC;
  v_today_vouchers INTEGER;
  v_today_balanced INTEGER;
BEGIN
  -- Count unbalanced vouchers using ENTRIES sum (not header totals)
  SELECT 
    COUNT(*),
    COALESCE(SUM(ABS(entry_debit - entry_credit)), 0)
  INTO v_unbalanced_count, v_total_imbalance
  FROM (
    SELECT 
      v.id,
      COALESCE(SUM(ve.debit_amount), 0) as entry_debit,
      COALESCE(SUM(ve.credit_amount), 0) as entry_credit
    FROM vouchers v
    LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
    WHERE v.client_id = p_client_id
      AND COALESCE(v.is_reversed, false) = false
    GROUP BY v.id
  ) voucher_balances
  WHERE entry_debit != entry_credit;

  -- Today's voucher stats
  SELECT COUNT(*) INTO v_today_vouchers
  FROM vouchers
  WHERE client_id = p_client_id
    AND voucher_date = CURRENT_DATE;

  -- Today's balanced vouchers (using entries sum)
  SELECT COUNT(*) INTO v_today_balanced
  FROM (
    SELECT v.id
    FROM vouchers v
    LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
    WHERE v.client_id = p_client_id
      AND v.voucher_date = CURRENT_DATE
    GROUP BY v.id
    HAVING COALESCE(SUM(ve.debit_amount), 0) = COALESCE(SUM(ve.credit_amount), 0)
  ) balanced;

  v_result := json_build_object(
    'unbalanced_count', v_unbalanced_count,
    'total_imbalance', v_total_imbalance,
    'today_vouchers', v_today_vouchers,
    'today_balanced', v_today_balanced,
    'health_score', CASE 
      WHEN v_unbalanced_count = 0 THEN 100
      WHEN v_unbalanced_count <= 5 THEN 90
      WHEN v_unbalanced_count <= 20 THEN 70
      WHEN v_unbalanced_count <= 50 THEN 50
      ELSE 30
    END,
    'status', CASE 
      WHEN v_unbalanced_count = 0 THEN 'healthy'
      WHEN v_unbalanced_count <= 5 THEN 'warning'
      ELSE 'critical'
    END,
    'checked_at', NOW()
  );

  RETURN v_result;
END;
$function$;

-- Drop and recreate the view to use ENTRIES sum instead of header totals
DROP VIEW IF EXISTS v_unbalanced_vouchers;

CREATE VIEW v_unbalanced_vouchers AS
SELECT 
  v.id,
  v.client_id,
  v.branch_id,
  v.voucher_number,
  v.voucher_type,
  v.voucher_date,
  v.narration,
  v.reference_type,
  v.reference_id,
  v.created_at,
  v.total_debit as header_debit,
  v.total_credit as header_credit,
  COALESCE(SUM(ve.debit_amount), 0) as total_debit,
  COALESCE(SUM(ve.credit_amount), 0) as total_credit,
  COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0) as imbalance,
  ABS(COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0)) as abs_imbalance
FROM vouchers v
LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
WHERE COALESCE(v.is_reversed, false) = false
GROUP BY v.id, v.client_id, v.branch_id, v.voucher_number, v.voucher_type, 
         v.voucher_date, v.narration, v.reference_type, v.reference_id, 
         v.created_at, v.total_debit, v.total_credit
HAVING COALESCE(SUM(ve.debit_amount), 0) != COALESCE(SUM(ve.credit_amount), 0);
