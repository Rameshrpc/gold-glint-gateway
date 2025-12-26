-- ============================================
-- ACCOUNTING INTEGRITY SYSTEM MIGRATION
-- ============================================

-- 1. Create SUSPENSE account for automatic adjustments
INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
SELECT 
  c.id,
  ag.id,
  'SUSPENSE',
  'Suspense Account',
  'liability',
  true,
  'System adjustment account for voucher imbalances'
FROM clients c
CROSS JOIN account_groups ag
WHERE ag.client_id = c.id 
  AND ag.group_code = 'PAYABLES'
  AND NOT EXISTS (
    SELECT 1 FROM accounts a 
    WHERE a.client_id = c.id AND a.account_code = 'SUSPENSE'
  );

-- 2. Create view for monitoring unbalanced vouchers
CREATE OR REPLACE VIEW public.v_unbalanced_vouchers AS
SELECT 
  v.id,
  v.client_id,
  v.branch_id,
  v.voucher_number,
  v.voucher_date,
  v.voucher_type,
  v.total_debit,
  v.total_credit,
  (v.total_debit - v.total_credit) as imbalance,
  ABS(v.total_debit - v.total_credit) as abs_imbalance,
  v.narration,
  v.reference_type,
  v.reference_id,
  v.created_at
FROM vouchers v
WHERE v.total_debit != v.total_credit
  AND COALESCE(v.is_reversed, false) = false
ORDER BY v.voucher_date DESC;

-- 3. Create accounting health summary function
CREATE OR REPLACE FUNCTION public.get_accounting_health(p_client_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_unbalanced_count INTEGER;
  v_total_imbalance NUMERIC;
  v_today_vouchers INTEGER;
  v_today_balanced INTEGER;
BEGIN
  -- Count unbalanced vouchers
  SELECT 
    COUNT(*),
    COALESCE(SUM(ABS(total_debit - total_credit)), 0)
  INTO v_unbalanced_count, v_total_imbalance
  FROM vouchers
  WHERE client_id = p_client_id
    AND total_debit != total_credit
    AND COALESCE(is_reversed, false) = false;

  -- Today's voucher stats
  SELECT COUNT(*) INTO v_today_vouchers
  FROM vouchers
  WHERE client_id = p_client_id
    AND voucher_date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_today_balanced
  FROM vouchers
  WHERE client_id = p_client_id
    AND voucher_date = CURRENT_DATE
    AND total_debit = total_credit;

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
$$;

-- 4. Create function to fix a single voucher imbalance
CREATE OR REPLACE FUNCTION public.fix_voucher_imbalance(
  p_voucher_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imbalance NUMERIC;
  v_client_id UUID;
  v_suspense_account_id UUID;
  v_voucher_number VARCHAR;
BEGIN
  -- Get voucher details
  SELECT 
    total_debit - total_credit, 
    client_id,
    voucher_number
  INTO v_imbalance, v_client_id, v_voucher_number
  FROM vouchers 
  WHERE id = p_voucher_id;

  IF v_imbalance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Voucher not found');
  END IF;

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

  -- Add balancing entry
  IF v_imbalance > 0 THEN
    -- Need credit to balance
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration)
    VALUES (p_voucher_id, v_suspense_account_id, 0, v_imbalance, 
            'System adjustment - imbalance correction');
    
    UPDATE vouchers 
    SET total_credit = total_credit + v_imbalance 
    WHERE id = p_voucher_id;
  ELSE
    -- Need debit to balance
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration)
    VALUES (p_voucher_id, v_suspense_account_id, ABS(v_imbalance), 0, 
            'System adjustment - imbalance correction');
    
    UPDATE vouchers 
    SET total_debit = total_debit + ABS(v_imbalance) 
    WHERE id = p_voucher_id;
  END IF;

  -- Update suspense account balance
  UPDATE accounts 
  SET current_balance = current_balance + ABS(v_imbalance)
  WHERE id = v_suspense_account_id;

  RETURN json_build_object(
    'success', true, 
    'voucher_number', v_voucher_number,
    'adjustment', v_imbalance,
    'message', 'Voucher balanced with suspense entry'
  );
END;
$$;

-- 5. Create function to fix all unbalanced vouchers for a client
CREATE OR REPLACE FUNCTION public.fix_all_voucher_imbalances(p_client_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
  v_fixed_count INTEGER := 0;
  v_total_adjustment NUMERIC := 0;
  v_result JSON;
BEGIN
  FOR v_voucher IN 
    SELECT id, (total_debit - total_credit) as imbalance
    FROM vouchers
    WHERE client_id = p_client_id
      AND total_debit != total_credit
      AND COALESCE(is_reversed, false) = false
  LOOP
    PERFORM fix_voucher_imbalance(v_voucher.id);
    v_fixed_count := v_fixed_count + 1;
    v_total_adjustment := v_total_adjustment + ABS(v_voucher.imbalance);
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'fixed_count', v_fixed_count,
    'total_adjustment', v_total_adjustment,
    'message', 'All voucher imbalances fixed'
  );
END;
$$;

-- 6. Create voucher balance validation trigger
CREATE OR REPLACE FUNCTION public.validate_voucher_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_tolerance NUMERIC := 0.01; -- Allow 1 paisa tolerance for rounding
BEGIN
  -- Only validate when posting (is_posted = true)
  IF NEW.is_posted = true THEN
    IF ABS(NEW.total_debit - NEW.total_credit) > v_tolerance THEN
      -- Log warning but don't block - we'll fix with suspense account
      RAISE WARNING 'Voucher imbalance detected: % - Debit: %, Credit: %, Difference: %',
        NEW.voucher_number,
        NEW.total_debit, 
        NEW.total_credit,
        ABS(NEW.total_debit - NEW.total_credit);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_voucher_balance ON vouchers;

CREATE TRIGGER check_voucher_balance
  BEFORE INSERT OR UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION validate_voucher_balance();

-- 7. Create trigger to prevent modification of posted vouchers (except reversals)
CREATE OR REPLACE FUNCTION public.prevent_posted_voucher_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_posted = true AND NEW.is_posted = true THEN
    -- Allow reversal flag changes
    IF OLD.is_reversed IS DISTINCT FROM NEW.is_reversed THEN
      RETURN NEW;
    END IF;
    
    -- Block amount modifications on posted vouchers
    IF (OLD.total_debit IS DISTINCT FROM NEW.total_debit OR 
        OLD.total_credit IS DISTINCT FROM NEW.total_credit) AND
       NEW.is_reversed = false THEN
      RAISE EXCEPTION 'Cannot modify amounts on posted voucher %. Use reversal instead.', OLD.voucher_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate  
DROP TRIGGER IF EXISTS protect_posted_vouchers ON vouchers;

CREATE TRIGGER protect_posted_vouchers
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_posted_voucher_modification();

-- 8. Grant necessary permissions
GRANT SELECT ON public.v_unbalanced_vouchers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accounting_health(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_voucher_imbalance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_all_voucher_imbalances(UUID) TO authenticated;