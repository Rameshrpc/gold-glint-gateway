import { supabase } from '@/integrations/supabase/client';

interface VoucherEntry {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

interface VoucherParams {
  clientId: string;
  branchId: string;
  voucherType: string;
  referenceType: string;
  referenceId: string;
  narration: string;
  entries: VoucherEntry[];
}

interface AccountMap {
  [accountCode: string]: string; // accountCode -> accountId
}

export async function generateVoucher(params: VoucherParams): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  try {
    // Get account IDs for the entries
    const accountCodes = params.entries.map(e => e.accountCode);
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, account_code')
      .eq('client_id', params.clientId)
      .in('account_code', accountCodes);

    if (accountsError) throw accountsError;

    // Create a map of account code to account id
    const accountMap: AccountMap = {};
    accounts?.forEach(acc => {
      accountMap[acc.account_code] = acc.id;
    });

    // Check if all accounts exist
    const missingAccounts = accountCodes.filter(code => !accountMap[code]);
    if (missingAccounts.length > 0) {
      console.warn('Missing accounts for voucher:', missingAccounts);
      // Skip voucher generation if accounts don't exist yet
      return { success: true, voucherNumber: 'SKIPPED' };
    }

    // Calculate totals
    const totalDebit = params.entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
    const totalCredit = params.entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);

    // Generate voucher number
    const { data: voucherNumber, error: numError } = await supabase.rpc('generate_voucher_number', {
      p_client_id: params.clientId,
      p_voucher_type: params.voucherType
    });
    if (numError) throw numError;

    // Create voucher
    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .insert({
        client_id: params.clientId,
        branch_id: params.branchId,
        voucher_number: voucherNumber,
        voucher_date: new Date().toISOString().split('T')[0],
        voucher_type: params.voucherType,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        narration: params.narration,
        total_debit: totalDebit,
        total_credit: totalCredit,
        is_posted: true,
      })
      .select()
      .single();

    if (voucherError) throw voucherError;

    // Create voucher entries
    const entries = params.entries
      .filter(e => e.debitAmount > 0 || e.creditAmount > 0)
      .map(entry => ({
        voucher_id: voucher.id,
        account_id: accountMap[entry.accountCode],
        debit_amount: entry.debitAmount || 0,
        credit_amount: entry.creditAmount || 0,
        narration: entry.narration || null,
      }));

    const { error: entriesError } = await supabase.from('voucher_entries').insert(entries);
    if (entriesError) throw entriesError;

    // Update account balances
    for (const entry of params.entries) {
      if (!accountMap[entry.accountCode]) continue;
      
      const { data: account } = await supabase
        .from('accounts')
        .select('current_balance, account_type')
        .eq('id', accountMap[entry.accountCode])
        .single();

      if (account) {
        const isDebitNature = ['asset', 'expense'].includes(account.account_type);
        const balanceChange = isDebitNature
          ? (entry.debitAmount - entry.creditAmount)
          : (entry.creditAmount - entry.debitAmount);

        await supabase
          .from('accounts')
          .update({ current_balance: (account.current_balance || 0) + balanceChange })
          .eq('id', accountMap[entry.accountCode]);
      }
    }

    return { success: true, voucherNumber };
  } catch (error: any) {
    console.error('Voucher generation failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate interest collection voucher
export async function generateInterestVoucher(params: {
  clientId: string;
  branchId: string;
  paymentId: string;
  loanNumber: string;
  amountPaid: number;
  interestAmount: number;
  penaltyAmount: number;
  principalReduction: number;
  paymentMode: string;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Cash/Bank (amount received)
  entries.push({
    accountCode: 'CASH-001', // Or bank account based on payment mode
    debitAmount: params.amountPaid,
    creditAmount: 0,
    narration: `Interest received for ${params.loanNumber}`,
  });

  // Credit: Interest Income
  if (params.interestAmount > 0) {
    entries.push({
      accountCode: 'INT-INC-SHOWN',
      debitAmount: 0,
      creditAmount: params.interestAmount,
      narration: 'Interest income',
    });
  }

  // Credit: Penalty Income
  if (params.penaltyAmount > 0) {
    entries.push({
      accountCode: 'PENALTY-INC',
      debitAmount: 0,
      creditAmount: params.penaltyAmount,
      narration: 'Penalty charges',
    });
  }

  // Credit: Loan Receivable (principal reduction)
  if (params.principalReduction > 0) {
    entries.push({
      accountCode: 'LOAN-RECV',
      debitAmount: 0,
      creditAmount: params.principalReduction,
      narration: 'Principal reduction',
    });
  }

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'interest_collection',
    referenceType: 'interest_payment',
    referenceId: params.paymentId,
    narration: `Interest collection for loan ${params.loanNumber}`,
    entries,
  });
}

// Helper function to generate redemption voucher
export async function generateRedemptionVoucher(params: {
  clientId: string;
  branchId: string;
  redemptionId: string;
  loanNumber: string;
  amountReceived: number;
  principalAmount: number;
  interestDue: number;
  penaltyAmount: number;
  rebateAmount: number;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Cash/Bank (amount received)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: params.amountReceived,
    creditAmount: 0,
    narration: `Redemption payment for ${params.loanNumber}`,
  });

  // Debit: Rebate Expense (if any)
  if (params.rebateAmount > 0) {
    entries.push({
      accountCode: 'REBATE-EXP',
      debitAmount: params.rebateAmount,
      creditAmount: 0,
      narration: 'Early redemption rebate',
    });
  }

  // Credit: Loan Receivable (principal cleared)
  entries.push({
    accountCode: 'LOAN-RECV',
    debitAmount: 0,
    creditAmount: params.principalAmount,
    narration: 'Principal cleared on redemption',
  });

  // Credit: Interest Income
  if (params.interestDue > 0) {
    entries.push({
      accountCode: 'INT-INC-SHOWN',
      debitAmount: 0,
      creditAmount: params.interestDue,
      narration: 'Interest earned on redemption',
    });
  }

  // Credit: Penalty Income
  if (params.penaltyAmount > 0) {
    entries.push({
      accountCode: 'PENALTY-INC',
      debitAmount: 0,
      creditAmount: params.penaltyAmount,
      narration: 'Penalty on redemption',
    });
  }

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'redemption',
    referenceType: 'redemption',
    referenceId: params.redemptionId,
    narration: `Redemption of loan ${params.loanNumber}`,
    entries,
  });
}

// Helper function to generate auction voucher
export async function generateAuctionVoucher(params: {
  clientId: string;
  branchId: string;
  auctionId: string;
  loanNumber: string;
  soldPrice: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  surplusAmount: number;
  shortfallAmount: number;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Cash/Bank (sold price received)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: params.soldPrice,
    creditAmount: 0,
    narration: `Auction proceeds for ${params.loanNumber}`,
  });

  // Credit: Loan Receivable (principal cleared)
  entries.push({
    accountCode: 'LOAN-RECV',
    debitAmount: 0,
    creditAmount: params.principalAmount,
    narration: 'Principal cleared on auction',
  });

  // Credit: Interest Income
  if (params.interestAmount > 0) {
    entries.push({
      accountCode: 'INT-INC-SHOWN',
      debitAmount: 0,
      creditAmount: params.interestAmount,
      narration: 'Interest recovered from auction',
    });
  }

  // Credit: Penalty Income
  if (params.penaltyAmount > 0) {
    entries.push({
      accountCode: 'PENALTY-INC',
      debitAmount: 0,
      creditAmount: params.penaltyAmount,
      narration: 'Penalty recovered from auction',
    });
  }

  // Credit: Surplus Payable (if surplus)
  if (params.surplusAmount > 0) {
    entries.push({
      accountCode: 'SURPLUS-PAY',
      debitAmount: 0,
      creditAmount: params.surplusAmount,
      narration: 'Surplus to return to customer',
    });
  }

  // Note: Shortfall is a loss but we don't create an expense entry here
  // It would require a separate bad debt write-off process

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'auction',
    referenceType: 'auction',
    referenceId: params.auctionId,
    narration: `Auction sale of loan ${params.loanNumber}`,
    entries,
  });
}
