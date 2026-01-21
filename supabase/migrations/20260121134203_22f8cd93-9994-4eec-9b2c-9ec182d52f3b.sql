-- Set opening balance of 1 Crore (10000000) for Loan Principal Receivable account
UPDATE accounts 
SET 
  opening_balance = 10000000,
  current_balance = current_balance + 10000000
WHERE 
  client_id = '2abc571d-ce56-4e32-ac8e-0761fafe8999' 
  AND account_code = 'LOAN-RECV';