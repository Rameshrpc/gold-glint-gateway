
-- Fix the view to use SECURITY INVOKER (default) instead of SECURITY DEFINER
DROP VIEW IF EXISTS v_unbalanced_vouchers;

CREATE VIEW v_unbalanced_vouchers 
WITH (security_invoker = true)
AS
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
