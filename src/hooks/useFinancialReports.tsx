import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TrialBalanceEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  group_name: string;
  debit_balance: number;
  credit_balance: number;
}

export interface ProfitLossEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  group_name: string;
  amount: number;
}

export interface BalanceSheetEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  group_name: string;
  balance: number;
}

export interface LedgerEntry {
  id: string;
  voucher_date: string;
  voucher_number: string;
  voucher_type: string;
  narration: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_type?: string;
  reference_id?: string;
}

export interface DayBookEntry {
  voucher_id: string;
  voucher_date: string;
  voucher_number: string;
  voucher_type: string;
  narration: string;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
}

export function useFinancialReports() {
  const { profile } = useAuth();

  const getTrialBalance = async (asOfDate: string): Promise<TrialBalanceEntry[]> => {
    if (!profile?.client_id) return [];

    // Get all accounts with their balances
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select(`
        id,
        account_code,
        account_name,
        account_type,
        current_balance,
        opening_balance,
        account_group_id,
        account_groups!inner(group_name)
      `)
      .eq('client_id', profile.client_id)
      .eq('is_active', true)
      .order('account_code');

    if (accountsError || !accounts) return [];

    // Get voucher entries up to the as-of date
    const { data: entries, error: entriesError } = await supabase
      .from('voucher_entries')
      .select(`
        account_id,
        debit_amount,
        credit_amount,
        vouchers!inner(voucher_date, is_posted, client_id)
      `)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .lte('vouchers.voucher_date', asOfDate);

    // Calculate balances per account
    const balanceMap: Record<string, { debit: number; credit: number }> = {};
    
    if (entries) {
      entries.forEach(entry => {
        if (!balanceMap[entry.account_id]) {
          balanceMap[entry.account_id] = { debit: 0, credit: 0 };
        }
        balanceMap[entry.account_id].debit += entry.debit_amount || 0;
        balanceMap[entry.account_id].credit += entry.credit_amount || 0;
      });
    }

    return accounts.map(acc => {
      const entryBalance = balanceMap[acc.id] || { debit: 0, credit: 0 };
      const opening = acc.opening_balance || 0;
      
      // For asset/expense accounts: Debit increases, Credit decreases
      // For liability/income/equity: Credit increases, Debit decreases
      let debit_balance = 0;
      let credit_balance = 0;
      
      const netMovement = entryBalance.debit - entryBalance.credit;
      const totalBalance = opening + netMovement;
      
      if (['asset', 'expense'].includes(acc.account_type)) {
        if (totalBalance >= 0) {
          debit_balance = totalBalance;
        } else {
          credit_balance = Math.abs(totalBalance);
        }
      } else {
        if (totalBalance >= 0) {
          credit_balance = totalBalance;
        } else {
          debit_balance = Math.abs(totalBalance);
        }
      }

      return {
        account_id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        group_name: (acc.account_groups as any)?.group_name || 'Ungrouped',
        debit_balance,
        credit_balance
      };
    }).filter(entry => entry.debit_balance !== 0 || entry.credit_balance !== 0);
  };

  const getProfitLoss = async (fromDate: string, toDate: string): Promise<{
    income: ProfitLossEntry[];
    expenses: ProfitLossEntry[];
    netProfit: number;
  }> => {
    if (!profile?.client_id) return { income: [], expenses: [], netProfit: 0 };

    // Get income and expense accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        account_code,
        account_name,
        account_type,
        account_group_id,
        account_groups!inner(group_name)
      `)
      .eq('client_id', profile.client_id)
      .eq('is_active', true)
      .in('account_type', ['income', 'expense'])
      .order('account_code');

    if (error || !accounts) return { income: [], expenses: [], netProfit: 0 };

    // Get voucher entries within the period
    const { data: entries } = await supabase
      .from('voucher_entries')
      .select(`
        account_id,
        debit_amount,
        credit_amount,
        vouchers!inner(voucher_date, is_posted, client_id)
      `)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .gte('vouchers.voucher_date', fromDate)
      .lte('vouchers.voucher_date', toDate);

    // Calculate amounts per account
    const amountMap: Record<string, number> = {};
    
    if (entries) {
      entries.forEach(entry => {
        if (!amountMap[entry.account_id]) {
          amountMap[entry.account_id] = 0;
        }
        // Income: Credit - Debit (credits increase income)
        // Expense: Debit - Credit (debits increase expense)
        amountMap[entry.account_id] += (entry.credit_amount || 0) - (entry.debit_amount || 0);
      });
    }

    const income: ProfitLossEntry[] = [];
    const expenses: ProfitLossEntry[] = [];

    accounts.forEach(acc => {
      const amount = amountMap[acc.id] || 0;
      if (amount === 0) return;

      const entry: ProfitLossEntry = {
        account_id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        group_name: (acc.account_groups as any)?.group_name || 'Ungrouped',
        amount: acc.account_type === 'income' ? amount : -amount
      };

      if (acc.account_type === 'income') {
        income.push(entry);
      } else {
        expenses.push(entry);
      }
    });

    const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses,
      netProfit: totalIncome - totalExpenses
    };
  };

  const getBalanceSheet = async (asOfDate: string): Promise<{
    assets: BalanceSheetEntry[];
    liabilities: BalanceSheetEntry[];
    equity: BalanceSheetEntry[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    retainedEarnings: number;
  }> => {
    if (!profile?.client_id) {
      return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, retainedEarnings: 0 };
    }

    // Get asset, liability, and equity accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        account_code,
        account_name,
        account_type,
        opening_balance,
        account_group_id,
        account_groups!inner(group_name)
      `)
      .eq('client_id', profile.client_id)
      .eq('is_active', true)
      .in('account_type', ['asset', 'liability', 'equity'])
      .order('account_code');

    if (error || !accounts) {
      return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, retainedEarnings: 0 };
    }

    // Get voucher entries up to as-of date
    const { data: entries } = await supabase
      .from('voucher_entries')
      .select(`
        account_id,
        debit_amount,
        credit_amount,
        vouchers!inner(voucher_date, is_posted, client_id)
      `)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .lte('vouchers.voucher_date', asOfDate);

    // Calculate balances
    const balanceMap: Record<string, number> = {};
    
    if (entries) {
      entries.forEach(entry => {
        if (!balanceMap[entry.account_id]) {
          balanceMap[entry.account_id] = 0;
        }
        balanceMap[entry.account_id] += (entry.debit_amount || 0) - (entry.credit_amount || 0);
      });
    }

    // Calculate retained earnings from P&L
    const pl = await getProfitLoss('1900-01-01', asOfDate);
    const retainedEarnings = pl.netProfit;

    const assets: BalanceSheetEntry[] = [];
    const liabilities: BalanceSheetEntry[] = [];
    const equity: BalanceSheetEntry[] = [];

    accounts.forEach(acc => {
      const movement = balanceMap[acc.id] || 0;
      const opening = acc.opening_balance || 0;
      let balance = opening + movement;

      // For liability/equity, balance is credit - debit
      if (['liability', 'equity'].includes(acc.account_type)) {
        balance = -balance;
      }

      if (balance === 0) return;

      const entry: BalanceSheetEntry = {
        account_id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        group_name: (acc.account_groups as any)?.group_name || 'Ungrouped',
        balance
      };

      if (acc.account_type === 'asset') {
        assets.push(entry);
      } else if (acc.account_type === 'liability') {
        liabilities.push(entry);
      } else {
        equity.push(entry);
      }
    });

    return {
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((sum, e) => sum + e.balance, 0),
      totalLiabilities: liabilities.reduce((sum, e) => sum + e.balance, 0),
      totalEquity: equity.reduce((sum, e) => sum + e.balance, 0) + retainedEarnings,
      retainedEarnings
    };
  };

  const getLedgerStatement = async (
    accountId: string,
    fromDate: string,
    toDate: string
  ): Promise<{ entries: LedgerEntry[]; openingBalance: number; closingBalance: number }> => {
    if (!profile?.client_id || !accountId) {
      return { entries: [], openingBalance: 0, closingBalance: 0 };
    }

    // Get account details
    const { data: account } = await supabase
      .from('accounts')
      .select('account_type, opening_balance')
      .eq('id', accountId)
      .single();

    if (!account) return { entries: [], openingBalance: 0, closingBalance: 0 };

    // Calculate opening balance (entries before fromDate)
    const { data: priorEntries } = await supabase
      .from('voucher_entries')
      .select(`
        debit_amount,
        credit_amount,
        vouchers!inner(voucher_date, is_posted, client_id)
      `)
      .eq('account_id', accountId)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .lt('vouchers.voucher_date', fromDate);

    let openingBalance = account.opening_balance || 0;
    if (priorEntries) {
      priorEntries.forEach(e => {
        openingBalance += (e.debit_amount || 0) - (e.credit_amount || 0);
      });
    }

    // For liability/equity/income, reverse the sign
    if (['liability', 'equity', 'income'].includes(account.account_type)) {
      openingBalance = -openingBalance;
    }

    // Get entries within period
    const { data: periodEntries } = await supabase
      .from('voucher_entries')
      .select(`
        id,
        debit_amount,
        credit_amount,
        narration,
        vouchers!inner(voucher_date, voucher_number, voucher_type, narration, is_posted, client_id, reference_type, reference_id)
      `)
      .eq('account_id', accountId)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .gte('vouchers.voucher_date', fromDate)
      .lte('vouchers.voucher_date', toDate)
      .order('vouchers(voucher_date)', { ascending: true });

    let runningBalance = openingBalance;
    const entries: LedgerEntry[] = [];

    if (periodEntries) {
      periodEntries.forEach(e => {
        const debit = e.debit_amount || 0;
        const credit = e.credit_amount || 0;
        
        if (['asset', 'expense'].includes(account.account_type)) {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        entries.push({
          id: e.id,
          voucher_date: (e.vouchers as any).voucher_date,
          voucher_number: (e.vouchers as any).voucher_number,
          voucher_type: (e.vouchers as any).voucher_type,
          narration: e.narration || (e.vouchers as any).narration,
          debit_amount: debit,
          credit_amount: credit,
          running_balance: runningBalance,
          reference_type: (e.vouchers as any).reference_type,
          reference_id: (e.vouchers as any).reference_id
        });
      });
    }

    return {
      entries,
      openingBalance,
      closingBalance: runningBalance
    };
  };

  const getDayBook = async (fromDate: string, toDate: string): Promise<DayBookEntry[]> => {
    if (!profile?.client_id) return [];

    const { data: entries, error } = await supabase
      .from('voucher_entries')
      .select(`
        id,
        debit_amount,
        credit_amount,
        accounts!inner(account_code, account_name),
        vouchers!inner(id, voucher_date, voucher_number, voucher_type, narration, is_posted, client_id)
      `)
      .eq('vouchers.client_id', profile.client_id)
      .eq('vouchers.is_posted', true)
      .gte('vouchers.voucher_date', fromDate)
      .lte('vouchers.voucher_date', toDate)
      .order('vouchers(voucher_date)', { ascending: true });

    if (error || !entries) return [];

    return entries.map(e => ({
      voucher_id: (e.vouchers as any).id,
      voucher_date: (e.vouchers as any).voucher_date,
      voucher_number: (e.vouchers as any).voucher_number,
      voucher_type: (e.vouchers as any).voucher_type,
      narration: (e.vouchers as any).narration,
      account_code: (e.accounts as any).account_code,
      account_name: (e.accounts as any).account_name,
      debit_amount: e.debit_amount || 0,
      credit_amount: e.credit_amount || 0
    }));
  };

  const getAccounts = async () => {
    if (!profile?.client_id) return [];

    const { data } = await supabase
      .from('accounts')
      .select('id, account_code, account_name, account_type')
      .eq('client_id', profile.client_id)
      .eq('is_active', true)
      .order('account_code');

    return data || [];
  };

  return {
    getTrialBalance,
    getProfitLoss,
    getBalanceSheet,
    getLedgerStatement,
    getDayBook,
    getAccounts
  };
}
