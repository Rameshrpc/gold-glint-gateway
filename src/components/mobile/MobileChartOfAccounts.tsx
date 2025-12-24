import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, FileText, ChevronRight, RefreshCw, Building2, Plus } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccountGroup {
  id: string;
  group_code: string;
  group_name: string;
  group_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_group_id: string | null;
  is_system_group: boolean;
}

interface Account {
  id: string;
  account_group_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  is_system_account: boolean;
  is_bank_account: boolean;
}

const groupTypeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  income: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
};

export default function MobileChartOfAccounts() {
  const { profile } = useAuth();
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const [groupsRes, accountsRes] = await Promise.all([
        supabase
          .from('account_groups')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('display_order', { ascending: true }),
        supabase
          .from('accounts')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('account_code', { ascending: true }),
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (accountsRes.error) throw accountsRes.error;

      const groups = (groupsRes.data || []) as AccountGroup[];
      setAccountGroups(groups);
      setAccounts((accountsRes.data || []) as Account[]);
      
      // Open main groups by default
      setOpenGroups(groups.filter(g => !g.parent_group_id).map(g => g.id));
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
  };

  const getChildGroups = (parentId: string | null) => {
    return accountGroups.filter(g => g.parent_group_id === parentId);
  };

  const getAccountsForGroup = (groupId: string) => {
    return accounts.filter(a => a.account_group_id === groupId);
  };

  const renderGroupTree = (group: AccountGroup, level: number = 0) => {
    const childGroups = getChildGroups(group.id);
    const groupAccounts = getAccountsForGroup(group.id);
    const isOpen = openGroups.includes(group.id);
    const hasChildren = childGroups.length > 0 || groupAccounts.length > 0;

    return (
      <div key={group.id} className={cn('border-l-2 border-muted', level > 0 && 'ml-3')}>
        <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2.5 active:bg-muted/50 transition-colors">
            {hasChildren ? (
              <ChevronRight className={cn('h-4 w-4 transition-transform shrink-0', isOpen && 'rotate-90')} />
            ) : (
              <div className="w-4" />
            )}
            <FolderOpen className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium flex-1 text-left text-sm truncate">{group.group_name}</span>
            <Badge variant="outline" className={cn('text-xs shrink-0', groupTypeColors[group.group_type])}>
              {group.group_type}
            </Badge>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="ml-4 space-y-0.5">
              {/* Child Groups */}
              {childGroups.map(child => renderGroupTree(child, level + 1))}

              {/* Accounts in this group */}
              {groupAccounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground shrink-0">{account.account_code}</span>
                  <span className="flex-1 text-sm truncate">{account.account_name}</span>
                  <span className={cn(
                    'text-sm font-medium shrink-0',
                    account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(account.current_balance)}
                  </span>
                  {account.is_bank_account && (
                    <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const mainGroups = accountGroups.filter(g => !g.parent_group_id);

  // Summary stats
  const totalAssets = accounts.filter(a => a.account_type === 'asset').reduce((s, a) => s + a.current_balance, 0);
  const totalLiabilities = accounts.filter(a => a.account_type === 'liability').reduce((s, a) => s + a.current_balance, 0);
  const totalIncome = accounts.filter(a => a.account_type === 'income').reduce((s, a) => s + a.current_balance, 0);
  const totalExpenses = accounts.filter(a => a.account_type === 'expense').reduce((s, a) => s + a.current_balance, 0);

  return (
    <MobileLayout>
      <MobileSimpleHeader title="Chart of Accounts" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Account Tree */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">Account Structure</h2>
            <p className="text-xs text-muted-foreground">{accountGroups.length} groups, {accounts.length} accounts</p>
          </div>
          
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : mainGroups.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No accounts yet</p>
              </div>
            ) : (
              mainGroups.map(group => renderGroupTree(group))
            )}
          </div>
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>
    </MobileLayout>
  );
}
