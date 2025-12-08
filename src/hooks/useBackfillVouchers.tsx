import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateVoucher } from './useVoucherGeneration';

interface BackfillProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

interface BackfillSummary {
  loans: { total: number; backfilled: number };
  interestPayments: { total: number; backfilled: number };
  redemptions: { total: number; backfilled: number };
  auctions: { total: number; backfilled: number };
  repledgePackets: { total: number; backfilled: number };
}

export function useBackfillVouchers() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BackfillProgress>({ total: 0, completed: 0, current: '', errors: [] });

  const getSummary = async (clientId: string): Promise<BackfillSummary> => {
    // Get counts of transactions without vouchers
    const [loansResult, interestResult, redemptionsResult, auctionsResult, packetsResult] = await Promise.all([
      // Loans without vouchers
      supabase
        .from('loans')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId),
      // Interest payments without vouchers  
      supabase
        .from('interest_payments')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId),
      // Redemptions without vouchers
      supabase
        .from('redemptions')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId),
      // Auctions without vouchers
      supabase
        .from('auctions')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('status', 'sold'),
      // Repledge packets without vouchers
      supabase
        .from('repledge_packets')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId),
    ]);

    // Get voucher reference counts
    const { data: voucherRefs } = await supabase
      .from('vouchers')
      .select('reference_type, reference_id')
      .eq('client_id', clientId);

    const existingRefs = new Set((voucherRefs || []).map(v => `${v.reference_type}:${v.reference_id}`));

    // Count loans with vouchers
    const { data: loans } = await supabase.from('loans').select('id').eq('client_id', clientId);
    const loansWithVouchers = (loans || []).filter(l => existingRefs.has(`loan:${l.id}`)).length;

    // Count interest payments with vouchers
    const { data: interestPayments } = await supabase.from('interest_payments').select('id').eq('client_id', clientId);
    const interestWithVouchers = (interestPayments || []).filter(p => existingRefs.has(`interest_payment:${p.id}`)).length;

    // Count redemptions with vouchers
    const { data: redemptions } = await supabase.from('redemptions').select('id').eq('client_id', clientId);
    const redemptionsWithVouchers = (redemptions || []).filter(r => existingRefs.has(`redemption:${r.id}`)).length;

    // Count auctions with vouchers
    const { data: auctions } = await supabase.from('auctions').select('id').eq('client_id', clientId).eq('status', 'sold');
    const auctionsWithVouchers = (auctions || []).filter(a => existingRefs.has(`auction:${a.id}`)).length;

    // Count repledge packets with vouchers
    const { data: packets } = await supabase.from('repledge_packets').select('id').eq('client_id', clientId);
    const packetsWithVouchers = (packets || []).filter(p => existingRefs.has(`repledge_packet:${p.id}`)).length;

    return {
      loans: { total: loansResult.count || 0, backfilled: loansWithVouchers },
      interestPayments: { total: interestResult.count || 0, backfilled: interestWithVouchers },
      redemptions: { total: redemptionsResult.count || 0, backfilled: redemptionsWithVouchers },
      auctions: { total: auctionsResult.count || 0, backfilled: auctionsWithVouchers },
      repledgePackets: { total: packetsResult.count || 0, backfilled: packetsWithVouchers },
    };
  };

  const backfillAll = async (clientId: string) => {
    setIsRunning(true);
    setProgress({ total: 0, completed: 0, current: 'Initializing...', errors: [] });

    try {
      // Get existing voucher references
      const { data: existingVouchers } = await supabase
        .from('vouchers')
        .select('reference_type, reference_id')
        .eq('client_id', clientId);
      
      const existingRefs = new Set((existingVouchers || []).map(v => `${v.reference_type}:${v.reference_id}`));

      // Fetch all transactions that need backfilling
      const [loansData, interestData, redemptionsData, auctionsData, packetsData] = await Promise.all([
        supabase.from('loans').select('*').eq('client_id', clientId),
        supabase.from('interest_payments').select('*').eq('client_id', clientId),
        supabase.from('redemptions').select('*').eq('client_id', clientId),
        supabase.from('auctions').select('*').eq('client_id', clientId).eq('status', 'sold'),
        supabase.from('repledge_packets').select('*').eq('client_id', clientId),
      ]);

      // Filter to only transactions without vouchers
      const loansToBackfill = (loansData.data || []).filter(l => !existingRefs.has(`loan:${l.id}`));
      const interestToBackfill = (interestData.data || []).filter(p => !existingRefs.has(`interest_payment:${p.id}`));
      const redemptionsToBackfill = (redemptionsData.data || []).filter(r => !existingRefs.has(`redemption:${r.id}`));
      const auctionsToBackfill = (auctionsData.data || []).filter(a => !existingRefs.has(`auction:${a.id}`));
      const packetsToBackfill = (packetsData.data || []).filter(p => !existingRefs.has(`repledge_packet:${p.id}`));

      const total = loansToBackfill.length + interestToBackfill.length + 
                    redemptionsToBackfill.length + auctionsToBackfill.length + packetsToBackfill.length;

      setProgress(prev => ({ ...prev, total }));

      let completed = 0;
      const errors: string[] = [];

      // Backfill loan disbursements
      for (const loan of loansToBackfill) {
        setProgress(prev => ({ ...prev, current: `Loan: ${loan.loan_number}` }));
        
        const entries = [
          { accountCode: 'LOAN-RECV', debitAmount: loan.principal_amount, creditAmount: 0, narration: `Loan principal for ${loan.loan_number}` },
          { accountCode: 'CASH-001', debitAmount: 0, creditAmount: loan.net_disbursed, narration: `Net disbursement` },
        ];

        if (loan.processing_fee > 0) {
          entries.push({ accountCode: 'PROC-FEE-INC', debitAmount: 0, creditAmount: loan.processing_fee, narration: 'Processing fee' });
        }
        if (loan.document_charges > 0) {
          entries.push({ accountCode: 'DOC-CHARGE-INC', debitAmount: 0, creditAmount: loan.document_charges, narration: 'Document charges' });
        }
        if (loan.advance_interest_shown > 0) {
          entries.push({ accountCode: 'ADV-INT-SHOWN', debitAmount: 0, creditAmount: loan.advance_interest_shown, narration: 'Advance interest (shown)' });
        }
        const differential = (loan.advance_interest_actual || 0) - (loan.advance_interest_shown || 0);
        if (differential > 0) {
          entries.push({ accountCode: 'ADV-INT-DIFF', debitAmount: 0, creditAmount: differential, narration: 'Advance interest differential' });
        }

        const result = await generateVoucher({
          clientId,
          branchId: loan.branch_id,
          voucherType: 'loan_disbursement',
          referenceType: 'loan',
          referenceId: loan.id,
          narration: `Loan disbursement - ${loan.loan_number}`,
          entries,
        });

        if (!result.success && result.voucherNumber !== 'SKIPPED') {
          errors.push(`Loan ${loan.loan_number}: ${result.error}`);
        }

        // If loan has an agent, generate commission accrual voucher
        if (loan.agent_id) {
          // Get agent details
          const { data: agent } = await supabase
            .from('agents')
            .select('full_name, commission_percentage')
            .eq('id', loan.agent_id)
            .single();

          if (agent && agent.commission_percentage > 0) {
            const commissionAmount = (loan.principal_amount * agent.commission_percentage) / 100;
            
            const commissionResult = await generateVoucher({
              clientId,
              branchId: loan.branch_id,
              voucherType: 'agent_commission_accrual',
              referenceType: 'agent_commission_accrual',
              referenceId: loan.id,
              narration: `Agent commission accrual - ${loan.loan_number}`,
              entries: [
                { accountCode: 'AGENT-COMM-EXP', debitAmount: commissionAmount, creditAmount: 0, narration: `Commission for ${agent.full_name}` },
                { accountCode: 'AGENT-COMM-PAY', debitAmount: 0, creditAmount: commissionAmount, narration: `Payable to ${agent.full_name}` },
              ],
            });

            if (!commissionResult.success && commissionResult.voucherNumber !== 'SKIPPED') {
              errors.push(`Agent commission for ${loan.loan_number}: ${commissionResult.error}`);
            }
          }
        }

        completed++;
        setProgress(prev => ({ ...prev, completed, errors }));
      }

      // Backfill interest payments
      for (const payment of interestToBackfill) {
        setProgress(prev => ({ ...prev, current: `Interest: ${payment.receipt_number}` }));

        const entries = [
          { accountCode: 'CASH-001', debitAmount: payment.amount_paid, creditAmount: 0, narration: `Interest received` },
          { accountCode: 'INT-INC-SHOWN', debitAmount: 0, creditAmount: payment.shown_interest, narration: 'Interest income' },
        ];

        const differential = payment.actual_interest - payment.shown_interest;
        if (differential > 0) {
          entries.push({ accountCode: 'INT-INC-DIFF', debitAmount: 0, creditAmount: differential, narration: 'Interest differential' });
        }
        if (payment.penalty_amount > 0) {
          entries.push({ accountCode: 'PENALTY-INC', debitAmount: 0, creditAmount: payment.penalty_amount, narration: 'Penalty' });
        }
        if (payment.principal_reduction > 0) {
          entries.push({ accountCode: 'LOAN-RECV', debitAmount: 0, creditAmount: payment.principal_reduction, narration: 'Principal reduction' });
        }

        const result = await generateVoucher({
          clientId,
          branchId: payment.branch_id,
          voucherType: 'interest_collection',
          referenceType: 'interest_payment',
          referenceId: payment.id,
          narration: `Interest collection - ${payment.receipt_number}`,
          entries,
        });

        if (!result.success && result.voucherNumber !== 'SKIPPED') {
          errors.push(`Interest ${payment.receipt_number}: ${result.error}`);
        }
        completed++;
        setProgress(prev => ({ ...prev, completed, errors }));
      }

      // Backfill redemptions
      for (const redemption of redemptionsToBackfill) {
        setProgress(prev => ({ ...prev, current: `Redemption: ${redemption.redemption_number}` }));

        const entries = [
          { accountCode: 'CASH-001', debitAmount: redemption.amount_received, creditAmount: 0, narration: `Redemption payment` },
          { accountCode: 'LOAN-RECV', debitAmount: 0, creditAmount: redemption.outstanding_principal, narration: 'Principal cleared' },
        ];

        if (redemption.interest_due > 0) {
          entries.push({ accountCode: 'INT-INC-SHOWN', debitAmount: 0, creditAmount: redemption.interest_due, narration: 'Interest income' });
        }
        if (redemption.penalty_amount > 0) {
          entries.push({ accountCode: 'PENALTY-INC', debitAmount: 0, creditAmount: redemption.penalty_amount, narration: 'Penalty' });
        }
        if (redemption.rebate_amount > 0) {
          entries.push({ accountCode: 'REBATE-EXP', debitAmount: redemption.rebate_amount, creditAmount: 0, narration: 'Rebate given' });
        }

        const result = await generateVoucher({
          clientId,
          branchId: redemption.branch_id,
          voucherType: 'redemption',
          referenceType: 'redemption',
          referenceId: redemption.id,
          narration: `Redemption - ${redemption.redemption_number}`,
          entries,
        });

        if (!result.success && result.voucherNumber !== 'SKIPPED') {
          errors.push(`Redemption ${redemption.redemption_number}: ${result.error}`);
        }
        completed++;
        setProgress(prev => ({ ...prev, completed, errors }));
      }

      // Backfill auctions
      for (const auction of auctionsToBackfill) {
        setProgress(prev => ({ ...prev, current: `Auction: ${auction.auction_lot_number}` }));

        const entries = [
          { accountCode: 'CASH-001', debitAmount: auction.sold_price || 0, creditAmount: 0, narration: 'Auction proceeds' },
          { accountCode: 'LOAN-RECV', debitAmount: 0, creditAmount: auction.outstanding_principal, narration: 'Principal cleared' },
        ];

        if (auction.outstanding_interest > 0) {
          entries.push({ accountCode: 'INT-INC-SHOWN', debitAmount: 0, creditAmount: auction.outstanding_interest, narration: 'Interest recovered' });
        }
        if (auction.outstanding_penalty > 0) {
          entries.push({ accountCode: 'PENALTY-INC', debitAmount: 0, creditAmount: auction.outstanding_penalty, narration: 'Penalty recovered' });
        }
        if (auction.surplus_amount > 0) {
          entries.push({ accountCode: 'SURPLUS-PAY', debitAmount: 0, creditAmount: auction.surplus_amount, narration: 'Surplus payable' });
        }

        const result = await generateVoucher({
          clientId,
          branchId: auction.branch_id,
          voucherType: 'auction',
          referenceType: 'auction',
          referenceId: auction.id,
          narration: `Auction sale - ${auction.auction_lot_number}`,
          entries,
        });

        if (!result.success && result.voucherNumber !== 'SKIPPED') {
          errors.push(`Auction ${auction.auction_lot_number}: ${result.error}`);
        }
        completed++;
        setProgress(prev => ({ ...prev, completed, errors }));
      }

      // Backfill repledge packets
      for (const packet of packetsToBackfill) {
        if (!packet.bank_loan_amount) continue;
        
        setProgress(prev => ({ ...prev, current: `Repledge: ${packet.packet_number}` }));

        const entries = [
          { accountCode: 'CASH-001', debitAmount: packet.bank_loan_amount, creditAmount: 0, narration: 'Bank loan received' },
          { accountCode: 'BANK-LOAN-PAY', debitAmount: 0, creditAmount: packet.bank_loan_amount, narration: 'Bank loan payable' },
        ];

        const result = await generateVoucher({
          clientId,
          branchId: packet.branch_id,
          voucherType: 'repledge_credit',
          referenceType: 'repledge_packet',
          referenceId: packet.id,
          narration: `Repledge bank credit - ${packet.packet_number}`,
          entries,
        });

        if (!result.success && result.voucherNumber !== 'SKIPPED') {
          errors.push(`Repledge ${packet.packet_number}: ${result.error}`);
        }
        completed++;
        setProgress(prev => ({ ...prev, completed, errors }));
      }

      setProgress(prev => ({ ...prev, current: 'Completed!', completed: total }));
      return { success: true, completed, errors };
    } catch (error: any) {
      setProgress(prev => ({ ...prev, errors: [...prev.errors, error.message] }));
      return { success: false, error: error.message };
    } finally {
      setIsRunning(false);
    }
  };

  const setOpeningBalances = async (clientId: string) => {
    try {
      // Set opening balance for Cash Counter
      await supabase
        .from('accounts')
        .update({ opening_balance: 500000, current_balance: 500000 })
        .eq('client_id', clientId)
        .eq('account_code', 'CASH-001');

      // Set opening balance for Capital Account
      await supabase
        .from('accounts')
        .update({ opening_balance: 500000, current_balance: 500000 })
        .eq('client_id', clientId)
        .eq('account_code', 'CAPITAL');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    isRunning,
    progress,
    getSummary,
    backfillAll,
    setOpeningBalances,
  };
}
