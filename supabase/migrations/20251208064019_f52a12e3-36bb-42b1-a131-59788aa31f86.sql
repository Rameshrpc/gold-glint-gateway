
-- Create account_groups table for Chart of Accounts categories
CREATE TABLE public.account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  group_code VARCHAR NOT NULL,
  group_name VARCHAR NOT NULL,
  group_type VARCHAR NOT NULL CHECK (group_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_group_id UUID REFERENCES public.account_groups(id),
  is_system_group BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, group_code)
);

-- Create accounts table (Ledger Accounts)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  branch_id UUID,
  account_group_id UUID NOT NULL REFERENCES public.account_groups(id),
  account_code VARCHAR NOT NULL,
  account_name VARCHAR NOT NULL,
  description TEXT,
  account_type VARCHAR NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_system_account BOOLEAN DEFAULT false,
  is_bank_account BOOLEAN DEFAULT false,
  linked_bank_id UUID,
  linked_loyalty_account_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, account_code)
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  voucher_number VARCHAR NOT NULL,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_type VARCHAR NOT NULL CHECK (voucher_type IN (
    'receipt', 'payment', 'contra', 'journal',
    'loan_disbursement', 'interest_collection', 'redemption', 
    'reloan', 'auction', 'repledge_credit', 'repledge_redemption',
    'agent_commission'
  )),
  reference_type VARCHAR,
  reference_id UUID,
  narration TEXT NOT NULL,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  is_posted BOOLEAN DEFAULT true,
  is_reversed BOOLEAN DEFAULT false,
  reversed_voucher_id UUID REFERENCES public.vouchers(id),
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, voucher_number)
);

-- Create voucher_entries table (Journal Lines)
CREATE TABLE public.voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent_commissions table
CREATE TABLE public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  commission_percentage NUMERIC NOT NULL,
  loan_principal NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  voucher_id UUID REFERENCES public.vouchers(id),
  payment_date DATE,
  payment_mode VARCHAR,
  payment_reference VARCHAR,
  source_type VARCHAR,
  source_bank_id UUID,
  source_account_id UUID,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_groups
CREATE POLICY "Users can view account groups in their client"
ON public.account_groups FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage account groups"
ON public.account_groups FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- RLS Policies for accounts
CREATE POLICY "Users can view accounts in their client"
ON public.accounts FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage accounts"
ON public.accounts FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- RLS Policies for vouchers
CREATE POLICY "Users can view vouchers in their client"
ON public.vouchers FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage vouchers"
ON public.vouchers FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND (
  has_role(auth.uid(), 'tenant_admin') OR 
  has_role(auth.uid(), 'branch_manager') OR 
  has_role(auth.uid(), 'loan_officer')
)) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND (
  has_role(auth.uid(), 'tenant_admin') OR 
  has_role(auth.uid(), 'branch_manager') OR 
  has_role(auth.uid(), 'loan_officer')
)) OR is_platform_admin(auth.uid()));

-- RLS Policies for voucher_entries
CREATE POLICY "Users can view voucher entries via vouchers"
ON public.voucher_entries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vouchers v 
  WHERE v.id = voucher_entries.voucher_id 
  AND v.client_id = get_user_client_id(auth.uid())
));

CREATE POLICY "Branch staff can manage voucher entries"
ON public.voucher_entries FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.vouchers v 
  WHERE v.id = voucher_entries.voucher_id 
  AND v.client_id = get_user_client_id(auth.uid())
  AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))
) OR is_platform_admin(auth.uid()))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vouchers v 
  WHERE v.id = voucher_entries.voucher_id 
  AND v.client_id = get_user_client_id(auth.uid())
  AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))
) OR is_platform_admin(auth.uid()));

-- RLS Policies for agent_commissions
CREATE POLICY "Users can view agent commissions in their client"
ON public.agent_commissions FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage agent commissions"
ON public.agent_commissions FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND (
  has_role(auth.uid(), 'tenant_admin') OR 
  has_role(auth.uid(), 'branch_manager') OR 
  has_role(auth.uid(), 'loan_officer')
)) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND (
  has_role(auth.uid(), 'tenant_admin') OR 
  has_role(auth.uid(), 'branch_manager') OR 
  has_role(auth.uid(), 'loan_officer')
)) OR is_platform_admin(auth.uid()));

-- Function to generate voucher number
CREATE OR REPLACE FUNCTION public.generate_voucher_number(p_client_id uuid, p_voucher_type varchar)
RETURNS varchar
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_prefix VARCHAR;
  v_number VARCHAR;
BEGIN
  -- Get prefix based on voucher type
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
    ELSE 'VCH'
  END;
  
  SELECT COUNT(*) + 1 INTO v_count 
  FROM vouchers 
  WHERE client_id = p_client_id AND voucher_type = p_voucher_type;
  
  v_number := v_prefix || '/' || TO_CHAR(CURRENT_DATE, 'YYMM') || '/' || LPAD(v_count::TEXT, 5, '0');
  RETURN v_number;
END;
$$;

-- Function to initialize default account groups for a client
CREATE OR REPLACE FUNCTION public.initialize_account_groups(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_id UUID;
  v_liability_id UUID;
  v_equity_id UUID;
  v_income_id UUID;
  v_expense_id UUID;
BEGIN
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM account_groups WHERE client_id = p_client_id) THEN
    RETURN;
  END IF;

  -- Create main groups
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, is_system_group, display_order)
  VALUES (p_client_id, 'ASSET', 'Assets', 'asset', true, 1) RETURNING id INTO v_asset_id;
  
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, is_system_group, display_order)
  VALUES (p_client_id, 'LIABILITY', 'Liabilities', 'liability', true, 2) RETURNING id INTO v_liability_id;
  
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, is_system_group, display_order)
  VALUES (p_client_id, 'EQUITY', 'Equity', 'equity', true, 3) RETURNING id INTO v_equity_id;
  
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, is_system_group, display_order)
  VALUES (p_client_id, 'INCOME', 'Income', 'income', true, 4) RETURNING id INTO v_income_id;
  
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, is_system_group, display_order)
  VALUES (p_client_id, 'EXPENSE', 'Expenses', 'expense', true, 5) RETURNING id INTO v_expense_id;

  -- Create sub-groups under Assets
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, parent_group_id, is_system_group, display_order)
  VALUES 
    (p_client_id, 'CASH_BANK', 'Cash & Bank', 'asset', v_asset_id, true, 1),
    (p_client_id, 'RECEIVABLES', 'Receivables', 'asset', v_asset_id, true, 2);

  -- Create sub-groups under Liabilities
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, parent_group_id, is_system_group, display_order)
  VALUES 
    (p_client_id, 'PAYABLES', 'Payables', 'liability', v_liability_id, true, 1),
    (p_client_id, 'BANK_BORROWINGS', 'Bank Borrowings', 'liability', v_liability_id, true, 2);

  -- Create sub-groups under Income
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, parent_group_id, is_system_group, display_order)
  VALUES 
    (p_client_id, 'INTEREST_INCOME', 'Interest Income', 'income', v_income_id, true, 1),
    (p_client_id, 'FEE_INCOME', 'Fee Income', 'income', v_income_id, true, 2),
    (p_client_id, 'OTHER_INCOME', 'Other Income', 'income', v_income_id, true, 3);

  -- Create sub-groups under Expenses
  INSERT INTO account_groups (client_id, group_code, group_name, group_type, parent_group_id, is_system_group, display_order)
  VALUES 
    (p_client_id, 'COMMISSION_EXP', 'Commission Expenses', 'expense', v_expense_id, true, 1),
    (p_client_id, 'OPERATING_EXP', 'Operating Expenses', 'expense', v_expense_id, true, 2);
END;
$$;

-- Function to initialize default system accounts for a client
CREATE OR REPLACE FUNCTION public.initialize_system_accounts(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Create system accounts
  -- Cash & Bank accounts
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES (p_client_id, v_cash_bank_id, 'CASH-001', 'Cash Counter', 'asset', true, 'Physical cash transactions');

  -- Receivables
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_receivables_id, 'LOAN-RECV', 'Loan Principal Receivable', 'asset', true, 'Outstanding loan principals'),
    (p_client_id, v_receivables_id, 'INT-RECV', 'Interest Receivable', 'asset', true, 'Accrued interest');

  -- Payables
  INSERT INTO accounts (client_id, account_group_id, account_code, account_name, account_type, is_system_account, description)
  VALUES 
    (p_client_id, v_payables_id, 'ADV-INT-LIAB', 'Advance Interest Collected', 'liability', true, 'Advance interest liability'),
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
$$;

-- Create updated_at triggers
CREATE TRIGGER update_account_groups_updated_at
BEFORE UPDATE ON public.account_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at
BEFORE UPDATE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_commissions_updated_at
BEFORE UPDATE ON public.agent_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
