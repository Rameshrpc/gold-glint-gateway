-- Update initialize_system_accounts function to add missing accounts
CREATE OR REPLACE FUNCTION public.initialize_system_accounts(p_client_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cash_bank_id UUID;
  v_receivables_id UUID;
  v_payables_id UUID;
  v_bank_borrowings_id UUID;
  v_interest_income_id UUID;
  v_fee_income_id UUID;
  v_commission_exp_id UUID;
  v_operating_exp_id UUID;
  v_equity_id UUID;
  v_other_income_id UUID;
BEGIN
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM accounts WHERE client_id = p_client_id) THEN
    RETURN;
  END IF;

  -- Get group IDs
  SELECT id INTO v_cash_bank_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'CASH_BANK';
  SELECT id INTO v_receivables_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'RECEIVABLES';
  SELECT id INTO v_payables_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'PAYABLES';
  SELECT id INTO v_bank_borrowings_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'BANK_BORROWINGS';
  SELECT id INTO v_interest_income_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'INTEREST_INCOME';
  SELECT id INTO v_fee_income_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'FEE_INCOME';
  SELECT id INTO v_commission_exp_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'COMMISSION_EXP';
  SELECT id INTO v_operating_exp_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'OPERATING_EXP';
  SELECT id INTO v_equity_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'EQUITY';
  SELECT id INTO v_other_income_id FROM account_groups WHERE client_id = p_client_id AND group_code = 'OTHER_INCOME';

  -- Create system accounts
  -- Cash & Bank accounts
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES (p_client_id, v_cash_bank_id, 'CASH-001', 'Cash Counter', 'asset', true, 'Physical cash transactions');

  -- Receivables
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_receivables_id, 'LOAN-RECV', 'Loan Principal Receivable', 'asset', true, 'Outstanding loan principals'),
    (p_client_id, v_receivables_id, 'INT-RECV', 'Interest Receivable', 'asset', true, 'Accrued interest'),
    (p_client_id, v_receivables_id, 'GOLD-STOCK', 'Gold Stock (at LTV)', 'asset', true, 'Gold items held as collateral at loan value');

  -- Payables
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_payables_id, 'ADV-INT-LIAB', 'Advance Interest Collected', 'liability', true, 'Advance interest liability'),
    (p_client_id, v_payables_id, 'ADV-INT-SHOWN', 'Advance Interest (Shown Rate)', 'liability', true, 'Advance interest at shown rate'),
    (p_client_id, v_payables_id, 'ADV-INT-DIFF', 'Advance Interest (Differential)', 'liability', true, 'Differential interest liability'),
    (p_client_id, v_payables_id, 'AGENT-COMM-PAY', 'Agent Commission Payable', 'liability', true, 'Pending agent commissions'),
    (p_client_id, v_payables_id, 'SURPLUS-PAY', 'Surplus Payable', 'liability', true, 'Auction surplus to return');

  -- Bank Borrowings
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES (p_client_id, v_bank_borrowings_id, 'BANK-LOAN-PAY', 'Bank Loan Payable (Repledge)', 'liability', true, 'Repledge bank loans');

  -- Interest Income
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_interest_income_id, 'INT-INC-SHOWN', 'Interest Income (Shown Rate)', 'income', true, 'Interest at displayed rate'),
    (p_client_id, v_interest_income_id, 'INT-INC-DIFF', 'Interest Income (Differential)', 'income', true, 'Difference between actual & shown'),
    (p_client_id, v_interest_income_id, 'PENALTY-INC', 'Penalty Income', 'income', true, 'Late payment penalties');

  -- Fee Income
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_fee_income_id, 'PROC-FEE-INC', 'Processing Fee Income', 'income', true, 'Processing fees'),
    (p_client_id, v_fee_income_id, 'DOC-CHARGE-INC', 'Document Charges Income', 'income', true, 'Document charges');

  -- Commission Expenses
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES (p_client_id, v_commission_exp_id, 'AGENT-COMM-EXP', 'Agent Commission Expense', 'expense', true, 'Agent commissions');

  -- Operating Expenses
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_operating_exp_id, 'REBATE-EXP', 'Rebate Expense', 'expense', true, 'Early redemption rebates'),
    (p_client_id, v_operating_exp_id, 'BANK-INT-EXP', 'Bank Interest Expense', 'expense', true, 'Interest paid on bank loans');

  -- Equity
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES (p_client_id, v_equity_id, 'CAPITAL', 'Capital Account', 'equity', true, 'Owner capital');
END;
$function$;

-- Add missing accounts to existing clients (run once for each client)
DO $$
DECLARE
  v_client_id UUID;
  v_payables_id UUID;
  v_receivables_id UUID;
BEGIN
  FOR v_client_id IN SELECT DISTINCT client_id FROM account_groups LOOP
    -- Get group IDs
    SELECT id INTO v_payables_id FROM account_groups WHERE client_id = v_client_id AND group_code = 'PAYABLES';
    SELECT id INTO v_receivables_id FROM account_groups WHERE client_id = v_client_id AND group_code = 'RECEIVABLES';
    
    -- Add missing accounts if they don't exist
    IF v_payables_id IS NOT NULL THEN
      INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
      SELECT v_client_id, v_payables_id, 'ADV-INT-SHOWN', 'Advance Interest (Shown Rate)', 'liability', true, 'Advance interest at shown rate'
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE client_id = v_client_id AND account_code = 'ADV-INT-SHOWN');
      
      INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
      SELECT v_client_id, v_payables_id, 'ADV-INT-DIFF', 'Advance Interest (Differential)', 'liability', true, 'Differential interest liability'
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE client_id = v_client_id AND account_code = 'ADV-INT-DIFF');
    END IF;
    
    IF v_receivables_id IS NOT NULL THEN
      INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
      SELECT v_client_id, v_receivables_id, 'GOLD-STOCK', 'Gold Stock (at LTV)', 'asset', true, 'Gold items held as collateral at loan value'
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE client_id = v_client_id AND account_code = 'GOLD-STOCK');
    END IF;
  END LOOP;
END $$;