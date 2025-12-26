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

export async function generateVoucher(params: VoucherParams): Promise<{ success: boolean; voucherNumber?: string; voucherId?: string; error?: string }> {
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

    return { success: true, voucherNumber, voucherId: voucher.id };
  } catch (error: any) {
    console.error('Voucher generation failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get or create bank account
export async function getOrCreateBankAccount(clientId: string, bankId: string, bankName: string, bankCode: string): Promise<string | null> {
  const accountCode = `BANK-${bankCode}`;
  
  // Check if account exists
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('client_id', clientId)
    .eq('account_code', accountCode)
    .single();

  if (existingAccount) {
    return existingAccount.id;
  }

  // Get Cash & Bank group
  const { data: cashBankGroup } = await supabase
    .from('account_groups')
    .select('id')
    .eq('client_id', clientId)
    .eq('group_code', 'CASH_BANK')
    .single();

  if (!cashBankGroup) return null;

  // Create bank account
  const { data: newAccount, error } = await supabase
    .from('accounts')
    .insert({
      client_id: clientId,
      account_group_id: cashBankGroup.id,
      account_code: accountCode,
      account_name: `${bankName} A/C`,
      account_type: 'asset',
      is_bank_account: true,
      is_system_account: false,
      linked_bank_id: bankId,
      description: `Bank account for ${bankName}`,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create bank account:', error);
    return null;
  }

  return newAccount?.id || null;
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
    accountCode: 'CASH-001',
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

// Helper function to generate redemption voucher with multiple payment entries
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
  paymentEntries?: Array<{
    mode: string;
    amount: number;
    sourceBankId?: string;
  }>;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit entries for each payment mode
  if (params.paymentEntries && params.paymentEntries.length > 0) {
    for (const payment of params.paymentEntries) {
      if (payment.amount <= 0) continue;
      
      if (payment.mode === 'cash') {
        entries.push({
          accountCode: 'CASH-001',
          debitAmount: payment.amount,
          creditAmount: 0,
          narration: `Cash payment for ${params.loanNumber}`,
        });
      } else if (payment.sourceBankId) {
        // Get bank info to create proper account code
        const { data: bank } = await supabase
          .from('banks_nbfc')
          .select('bank_code, bank_name')
          .eq('id', payment.sourceBankId)
          .single();
        
        if (bank) {
          const accountCode = `BANK-${bank.bank_code}`;
          // Ensure the bank account exists
          await getOrCreateBankAccount(params.clientId, payment.sourceBankId, bank.bank_name, bank.bank_code);
          entries.push({
            accountCode,
            debitAmount: payment.amount,
            creditAmount: 0,
            narration: `${payment.mode.toUpperCase()} payment for ${params.loanNumber}`,
          });
        } else {
          // Fallback to cash if bank not found
          entries.push({
            accountCode: 'CASH-001',
            debitAmount: payment.amount,
            creditAmount: 0,
            narration: `${payment.mode.toUpperCase()} payment for ${params.loanNumber}`,
          });
        }
      } else {
        // Non-cash without specific bank - use cash account as fallback
        entries.push({
          accountCode: 'CASH-001',
          debitAmount: payment.amount,
          creditAmount: 0,
          narration: `${payment.mode.toUpperCase()} payment for ${params.loanNumber}`,
        });
      }
    }
  } else {
    // Fallback: single cash entry (backward compatibility)
    entries.push({
      accountCode: 'CASH-001',
      debitAmount: params.amountReceived,
      creditAmount: 0,
      narration: `Redemption payment for ${params.loanNumber}`,
    });
  }

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

// Helper function to generate agent commission payment voucher
export async function generateAgentCommissionVoucher(params: {
  clientId: string;
  branchId: string;
  commissionIds: string[];
  totalAmount: number;
  paymentMode: string;
  agentName: string;
}): Promise<{ success: boolean; voucherNumber?: string; voucherId?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Agent Commission Expense
  entries.push({
    accountCode: 'AGENT-COMM-EXP',
    debitAmount: params.totalAmount,
    creditAmount: 0,
    narration: `Commission payment to ${params.agentName}`,
  });

  // Credit: Cash/Bank (payment made)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: 0,
    creditAmount: params.totalAmount,
    narration: `Commission paid - ${params.paymentMode}`,
  });

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'agent_commission',
    referenceType: 'agent_commission_payment',
    referenceId: params.commissionIds.join(','),
    narration: `Agent commission payment to ${params.agentName}`,
    entries,
  });
}

// Helper function to generate loan disbursement voucher
export async function generateLoanDisbursementVoucher(params: {
  clientId: string;
  branchId: string;
  loanId: string;
  loanNumber: string;
  principalAmount: number;
  actualPrincipal: number; // Principal on Record (includes capitalized differential)
  netDisbursed: number;
  processingFee: number;
  documentCharges: number;
  advanceInterestShown: number;
  advanceInterestActual: number;
  paymentMode: string;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Loan Principal Receivable (actual principal = principal on record)
  // This includes the capitalized differential interest, ensuring the voucher balances
  entries.push({
    accountCode: 'LOAN-RECV',
    debitAmount: params.actualPrincipal,
    creditAmount: 0,
    narration: `Loan principal for ${params.loanNumber}`,
  });

  // Credit: Cash/Bank (net amount disbursed)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: 0,
    creditAmount: params.netDisbursed,
    narration: `Net disbursement - ${params.paymentMode}`,
  });

  // Credit: Processing Fee Income
  if (params.processingFee > 0) {
    entries.push({
      accountCode: 'PROC-FEE-INC',
      debitAmount: 0,
      creditAmount: params.processingFee,
      narration: 'Processing fee',
    });
  }

  // Credit: Document Charges Income
  if (params.documentCharges > 0) {
    entries.push({
      accountCode: 'DOC-CHARGE-INC',
      debitAmount: 0,
      creditAmount: params.documentCharges,
      narration: 'Document charges',
    });
  }

  // Credit: Advance Interest (Shown Rate) - liability
  if (params.advanceInterestShown > 0) {
    entries.push({
      accountCode: 'ADV-INT-SHOWN',
      debitAmount: 0,
      creditAmount: params.advanceInterestShown,
      narration: 'Advance interest collected (shown rate)',
    });
  }

  // Credit: Advance Interest (Differential) - liability for the difference
  const differential = params.advanceInterestActual - params.advanceInterestShown;
  if (differential > 0) {
    entries.push({
      accountCode: 'ADV-INT-DIFF',
      debitAmount: 0,
      creditAmount: differential,
      narration: 'Advance interest differential',
    });
  }

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'loan_disbursement',
    referenceType: 'loan',
    referenceId: params.loanId,
    narration: `Loan disbursement - ${params.loanNumber}`,
    entries,
  });
}

// Helper function to generate reloan voucher (compound entry: old redemption + new disbursement)
export async function generateReloanVoucher(params: {
  clientId: string;
  branchId: string;
  oldLoanId: string;
  oldLoanNumber: string;
  newLoanId: string;
  newLoanNumber: string;
  // Old loan settlement
  oldPrincipal: number;
  oldInterest: number;
  oldPenalty: number;
  oldRebate: number;
  oldTotalSettlement: number;
  // New loan disbursement
  newPrincipal: number;
  newNetDisbursed: number;
  newProcessingFee: number;
  newDocumentCharges: number;
  newAdvanceInterestShown: number;
  newAdvanceInterestActual: number;
  // Net settlement
  netAmount: number;
  direction: 'to_customer' | 'from_customer';
  paymentEntries?: Array<{
    mode: string;
    amount: number;
    sourceBankId?: string;
  }>;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // --- OLD LOAN SETTLEMENT ---
  // Credit: Old Loan Receivable (principal cleared)
  entries.push({
    accountCode: 'LOAN-RECV',
    debitAmount: 0,
    creditAmount: params.oldPrincipal,
    narration: `Old loan principal cleared - ${params.oldLoanNumber}`,
  });

  // Credit: Interest Income (from old loan)
  if (params.oldInterest > 0) {
    entries.push({
      accountCode: 'INT-INC-SHOWN',
      debitAmount: 0,
      creditAmount: params.oldInterest,
      narration: `Interest from old loan - ${params.oldLoanNumber}`,
    });
  }

  // Credit: Penalty Income (from old loan)
  if (params.oldPenalty > 0) {
    entries.push({
      accountCode: 'PENALTY-INC',
      debitAmount: 0,
      creditAmount: params.oldPenalty,
      narration: `Penalty from old loan - ${params.oldLoanNumber}`,
    });
  }

  // Debit: Rebate Expense (if any)
  if (params.oldRebate > 0) {
    entries.push({
      accountCode: 'REBATE-EXP',
      debitAmount: params.oldRebate,
      creditAmount: 0,
      narration: `Rebate on old loan - ${params.oldLoanNumber}`,
    });
  }

  // --- NEW LOAN DISBURSEMENT ---
  // Debit: New Loan Receivable (principal)
  entries.push({
    accountCode: 'LOAN-RECV',
    debitAmount: params.newPrincipal,
    creditAmount: 0,
    narration: `New loan principal - ${params.newLoanNumber}`,
  });

  // Credit: Processing Fee Income
  if (params.newProcessingFee > 0) {
    entries.push({
      accountCode: 'PROC-FEE-INC',
      debitAmount: 0,
      creditAmount: params.newProcessingFee,
      narration: 'Processing fee on new loan',
    });
  }

  // Credit: Document Charges Income
  if (params.newDocumentCharges > 0) {
    entries.push({
      accountCode: 'DOC-CHARGE-INC',
      debitAmount: 0,
      creditAmount: params.newDocumentCharges,
      narration: 'Document charges on new loan',
    });
  }

  // Credit: Advance Interest (Shown Rate)
  if (params.newAdvanceInterestShown > 0) {
    entries.push({
      accountCode: 'ADV-INT-SHOWN',
      debitAmount: 0,
      creditAmount: params.newAdvanceInterestShown,
      narration: 'Advance interest on new loan',
    });
  }

  // Credit: Advance Interest Differential
  const differential = params.newAdvanceInterestActual - params.newAdvanceInterestShown;
  if (differential > 0) {
    entries.push({
      accountCode: 'ADV-INT-DIFF',
      debitAmount: 0,
      creditAmount: differential,
      narration: 'Advance interest differential on new loan',
    });
  }

  // --- NET SETTLEMENT with multiple payment modes ---
  if (params.paymentEntries && params.paymentEntries.length > 0) {
    for (const payment of params.paymentEntries) {
      if (payment.amount <= 0) continue;
      
      let accountCode = 'CASH-001';
      let narration = '';
      
      if (payment.mode !== 'cash' && payment.sourceBankId) {
        // Get bank info to create proper account code
        const { data: bank } = await supabase
          .from('banks_nbfc')
          .select('bank_code, bank_name')
          .eq('id', payment.sourceBankId)
          .single();
        
        if (bank) {
          accountCode = `BANK-${bank.bank_code}`;
          // Ensure the bank account exists
          await getOrCreateBankAccount(params.clientId, payment.sourceBankId, bank.bank_name, bank.bank_code);
          narration = `${payment.mode.toUpperCase()} ${params.direction === 'to_customer' ? 'disbursed to' : 'received from'} customer via ${bank.bank_name}`;
        }
      } else {
        narration = `Cash ${params.direction === 'to_customer' ? 'disbursed to' : 'received from'} customer`;
      }

      if (params.direction === 'to_customer') {
        // We pay customer: Credit Cash/Bank
        entries.push({
          accountCode,
          debitAmount: 0,
          creditAmount: payment.amount,
          narration,
        });
      } else {
        // Customer pays us: Debit Cash/Bank
        entries.push({
          accountCode,
          debitAmount: payment.amount,
          creditAmount: 0,
          narration,
        });
      }
    }
  } else {
    // Fallback: single cash entry (backward compatibility)
    if (params.direction === 'to_customer') {
      // We pay customer: Credit Cash
      entries.push({
        accountCode: 'CASH-001',
        debitAmount: 0,
        creditAmount: params.netAmount,
        narration: `Net payment to customer - cash`,
      });
    } else {
      // Customer pays us: Debit Cash
      entries.push({
        accountCode: 'CASH-001',
        debitAmount: params.netAmount,
        creditAmount: 0,
        narration: `Net received from customer - cash`,
      });
    }
  }

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'reloan',
    referenceType: 'reloan',
    referenceId: `${params.oldLoanId}:${params.newLoanId}`,
    narration: `Reloan: ${params.oldLoanNumber} → ${params.newLoanNumber}`,
    entries,
  });
}

// Helper function to generate repledge credit voucher (bank loan received)
export async function generateRepledgeCreditVoucher(params: {
  clientId: string;
  branchId: string;
  packetId: string;
  packetNumber: string;
  bankLoanAmount: number;
  bankName: string;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Cash/Bank (loan received from bank)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: params.bankLoanAmount,
    creditAmount: 0,
    narration: `Repledge credit from ${params.bankName}`,
  });

  // Credit: Bank Loan Payable (liability)
  entries.push({
    accountCode: 'BANK-LOAN-PAY',
    debitAmount: 0,
    creditAmount: params.bankLoanAmount,
    narration: `Bank loan for packet ${params.packetNumber}`,
  });

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'repledge_credit',
    referenceType: 'repledge_packet',
    referenceId: params.packetId,
    narration: `Repledge credit received - ${params.packetNumber}`,
    entries,
  });
}

// Helper function to generate repledge redemption voucher (paying back bank)
export async function generateRepledgeRedemptionVoucher(params: {
  clientId: string;
  branchId: string;
  redemptionId: string;
  packetNumber: string;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  totalSettlement: number;
  bankName: string;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Bank Loan Payable (clear the liability)
  entries.push({
    accountCode: 'BANK-LOAN-PAY',
    debitAmount: params.principalPaid,
    creditAmount: 0,
    narration: `Bank loan principal paid - ${params.packetNumber}`,
  });

  // Debit: Bank Interest Expense
  if (params.interestPaid > 0) {
    entries.push({
      accountCode: 'BANK-INT-EXP',
      debitAmount: params.interestPaid,
      creditAmount: 0,
      narration: `Bank interest paid - ${params.packetNumber}`,
    });
  }

  // Debit: Bank Interest Expense (penalty as additional interest cost)
  if (params.penaltyPaid > 0) {
    entries.push({
      accountCode: 'BANK-INT-EXP',
      debitAmount: params.penaltyPaid,
      creditAmount: 0,
      narration: `Bank penalty paid - ${params.packetNumber}`,
    });
  }

  // Credit: Cash/Bank (payment made)
  entries.push({
    accountCode: 'CASH-001',
    debitAmount: 0,
    creditAmount: params.totalSettlement,
    narration: `Payment to ${params.bankName}`,
  });

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'repledge_redemption',
    referenceType: 'repledge_redemption',
    referenceId: params.redemptionId,
    narration: `Repledge redemption - ${params.packetNumber}`,
    entries,
  });
}

// Helper function to generate agent commission accrual voucher (when loan is created with agent)
export async function generateAgentCommissionAccrualVoucher(params: {
  clientId: string;
  branchId: string;
  loanId: string;
  loanNumber: string;
  commissionAmount: number;
  agentName: string;
}): Promise<{ success: boolean; voucherNumber?: string; error?: string }> {
  const entries: VoucherEntry[] = [];
  
  // Debit: Agent Commission Expense
  entries.push({
    accountCode: 'AGENT-COMM-EXP',
    debitAmount: params.commissionAmount,
    creditAmount: 0,
    narration: `Commission accrued for ${params.agentName}`,
  });

  // Credit: Agent Commission Payable (liability until paid)
  entries.push({
    accountCode: 'AGENT-COMM-PAY',
    debitAmount: 0,
    creditAmount: params.commissionAmount,
    narration: `Commission payable to ${params.agentName}`,
  });

  return generateVoucher({
    clientId: params.clientId,
    branchId: params.branchId,
    voucherType: 'agent_commission_accrual',
    referenceType: 'loan',
    referenceId: params.loanId,
    narration: `Agent commission accrual for loan ${params.loanNumber}`,
    entries,
  });
}