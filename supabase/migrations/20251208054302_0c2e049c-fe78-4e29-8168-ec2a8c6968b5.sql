-- Add source account tracking columns to loan_disbursements
ALTER TABLE loan_disbursements
ADD COLUMN source_type VARCHAR CHECK (source_type IN ('company', 'employee', 'cash')),
ADD COLUMN source_bank_id UUID REFERENCES banks_nbfc(id),
ADD COLUMN source_account_id UUID REFERENCES loyalty_bank_accounts(id);