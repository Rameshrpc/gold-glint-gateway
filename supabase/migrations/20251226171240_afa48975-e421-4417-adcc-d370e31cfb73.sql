-- Fix security warnings: Set search_path on trigger functions

-- 1. Fix validate_voucher_balance function
CREATE OR REPLACE FUNCTION public.validate_voucher_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tolerance NUMERIC := 0.01;
BEGIN
  IF NEW.is_posted = true THEN
    IF ABS(NEW.total_debit - NEW.total_credit) > v_tolerance THEN
      RAISE WARNING 'Voucher imbalance detected: % - Debit: %, Credit: %, Difference: %',
        NEW.voucher_number,
        NEW.total_debit, 
        NEW.total_credit,
        ABS(NEW.total_debit - NEW.total_credit);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Fix prevent_posted_voucher_modification function
CREATE OR REPLACE FUNCTION public.prevent_posted_voucher_modification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_posted = true AND NEW.is_posted = true THEN
    IF OLD.is_reversed IS DISTINCT FROM NEW.is_reversed THEN
      RETURN NEW;
    END IF;
    
    IF (OLD.total_debit IS DISTINCT FROM NEW.total_debit OR 
        OLD.total_credit IS DISTINCT FROM NEW.total_credit) AND
       NEW.is_reversed = false THEN
      RAISE EXCEPTION 'Cannot modify amounts on posted voucher %. Use reversal instead.', OLD.voucher_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Fix the view security by using SECURITY INVOKER (recreate without security definer)
DROP VIEW IF EXISTS public.v_unbalanced_vouchers;

CREATE VIEW public.v_unbalanced_vouchers
WITH (security_invoker = on)
AS
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

GRANT SELECT ON public.v_unbalanced_vouchers TO authenticated;