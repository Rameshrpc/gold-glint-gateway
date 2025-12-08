-- Add credit_account_id column to track which loyalty bank account receives the bank credit
ALTER TABLE public.repledge_packets 
ADD COLUMN credit_account_id UUID REFERENCES public.loyalty_bank_accounts(id);