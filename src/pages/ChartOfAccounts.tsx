import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronRight, FolderOpen, FileText, RefreshCw, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccountGroup {
  id: string;
  client_id: string;
  group_code: string;
  group_name: string;
  group_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_group_id: string | null;
  is_system_group: boolean;
  display_order: number;
  created_at: string;
}

interface Account {
  id: string;
  client_id: string;
  branch_id: string | null;
  account_group_id: string;
  account_code: string;
  account_name: string;
  description: string | null;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  opening_balance: number;
  current_balance: number;
  is_system_account: boolean;
  is_bank_account: boolean;
  linked_bank_id: string | null;
  linked_loyalty_account_id: string | null;
  is_active: boolean;
}

const groupTypeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  income: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
};

export default function ChartOfAccounts() {
  const { profile, client } = useAuth();
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  // New account form
  const [newAccount, setNewAccount] = useState({
    account_code: '',
    account_name: '',
    description: '',
    account_group_id: '',
    opening_balance: 0,
  });

  // New group form
  const [newGroup, setNewGroup] = useState({
    group_code: '',
    group_name: '',
    group_type: 'expense' as const,
    parent_group_id: '',
  });

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch account groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('account_groups')
        .select('*')
        .eq('client_id', profile?.client_id)
        .order('display_order', { ascending: true });

      if (groupsError) throw groupsError;

      // If no groups exist, initialize them
      if (!groupsData || groupsData.length === 0) {
        await initializeAccountGroups();
        return;
      }

      setAccountGroups(groupsData as AccountGroup[]);
      // Open all main groups by default
      setOpenGroups(groupsData.filter(g => !g.parent_group_id).map(g => g.id));

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('client_id', profile?.client_id)
        .order('account_code', { ascending: true });

      if (accountsError) throw accountsError;
      setAccounts((accountsData || []) as Account[]);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const initializeAccountGroups = async () => {
    try {
      // Call the database function to initialize account groups
      const { error: groupError } = await supabase.rpc('initialize_account_groups', {
        p_client_id: profile?.client_id
      });
      if (groupError) throw groupError;

      // Call the database function to initialize system accounts
      const { error: accountError } = await supabase.rpc('initialize_system_accounts', {
        p_client_id: profile?.client_id
      });
      if (accountError) throw accountError;

      toast.success('Chart of Accounts initialized successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to initialize', { description: error.message });
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.account_code || !newAccount.account_name || !newAccount.account_group_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const group = accountGroups.find(g => g.id === newAccount.account_group_id);
      
      const { error } = await supabase.from('accounts').insert({
        client_id: profile?.client_id,
        account_code: newAccount.account_code,
        account_name: newAccount.account_name,
        description: newAccount.description || null,
        account_group_id: newAccount.account_group_id,
        account_type: group?.group_type || 'expense',
        opening_balance: newAccount.opening_balance,
        current_balance: newAccount.opening_balance,
        is_system_account: false,
      });

      if (error) throw error;

      toast.success('Account created successfully');
      setIsAccountDialogOpen(false);
      setNewAccount({ account_code: '', account_name: '', description: '', account_group_id: '', opening_balance: 0 });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create account', { description: error.message });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.group_code || !newGroup.group_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('account_groups').insert({
        client_id: profile?.client_id,
        group_code: newGroup.group_code.toUpperCase(),
        group_name: newGroup.group_name,
        group_type: newGroup.group_type,
        parent_group_id: newGroup.parent_group_id || null,
        is_system_group: false,
        display_order: accountGroups.length + 1,
      });

      if (error) throw error;

      toast.success('Account group created successfully');
      setIsGroupDialogOpen(false);
      setNewGroup({ group_code: '', group_name: '', group_type: 'expense', parent_group_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create group', { description: error.message });
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderGroupTree = (group: AccountGroup, level: number = 0) => {
    const childGroups = getChildGroups(group.id);
    const groupAccounts = getAccountsForGroup(group.id);
    const isOpen = openGroups.includes(group.id);
    const hasChildren = childGroups.length > 0 || groupAccounts.length > 0;

    return (
      <div key={group.id} className={cn('border-l-2', level > 0 && 'ml-4 border-muted')}>
        <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors">
            {hasChildren ? (
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            ) : (
              <div className="w-4" />
            )}
            <FolderOpen className="h-4 w-4 text-amber-600" />
            <span className="font-medium flex-1 text-left">{group.group_name}</span>
            <Badge variant="outline" className={cn('text-xs', groupTypeColors[group.group_type])}>
              {group.group_type}
            </Badge>
            {group.is_system_group && (
              <Badge variant="secondary" className="text-xs">System</Badge>
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="ml-6 space-y-1">
              {/* Child Groups */}
              {childGroups.map(child => renderGroupTree(child, level + 1))}

              {/* Accounts in this group */}
              {groupAccounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <div className="w-4" />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{account.account_code}</span>
                  <span className="flex-1 text-sm">{account.account_name}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(account.current_balance)}
                  </span>
                  {account.is_system_account && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                  {account.is_bank_account && (
                    <Building2 className="h-4 w-4 text-blue-600" />
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
            <p className="text-muted-foreground">
              Manage your accounting structure and ledger accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Account Group</DialogTitle>
                  <DialogDescription>Add a new account group to organize your ledgers</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Group Code *</Label>
                      <Input
                        value={newGroup.group_code}
                        onChange={e => setNewGroup({ ...newGroup, group_code: e.target.value.toUpperCase() })}
                        placeholder="e.g., BANK_ACC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Type *</Label>
                      <Select
                        value={newGroup.group_type}
                        onValueChange={(value: any) => setNewGroup({ ...newGroup, group_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Group Name *</Label>
                    <Input
                      value={newGroup.group_name}
                      onChange={e => setNewGroup({ ...newGroup, group_name: e.target.value })}
                      placeholder="e.g., Bank Accounts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Group (Optional)</Label>
                    <Select
                      value={newGroup.parent_group_id || "none"}
                      onValueChange={value => setNewGroup({ ...newGroup, parent_group_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Top Level)</SelectItem>
                        {accountGroups.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateGroup}>Create Group</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Ledger Account</DialogTitle>
                  <DialogDescription>Add a new account to track transactions</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Code *</Label>
                      <Input
                        value={newAccount.account_code}
                        onChange={e => setNewAccount({ ...newAccount, account_code: e.target.value.toUpperCase() })}
                        placeholder="e.g., RENT-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Opening Balance</Label>
                      <Input
                        type="number"
                        value={newAccount.opening_balance}
                        onChange={e => setNewAccount({ ...newAccount, opening_balance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name *</Label>
                    <Input
                      value={newAccount.account_name}
                      onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })}
                      placeholder="e.g., Office Rent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Group *</Label>
                    <Select
                      value={newAccount.account_group_id}
                      onValueChange={value => setNewAccount({ ...newAccount, account_group_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountGroups.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.group_name} ({g.group_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newAccount.description}
                      onChange={e => setNewAccount({ ...newAccount, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateAccount}>Create Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
            const typeAccounts = accounts.filter(a => a.account_type === type);
            const total = typeAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{type}s</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(Math.abs(total))}</div>
                  <p className="text-xs text-muted-foreground">{typeAccounts.length} accounts</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Account Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Account Structure</CardTitle>
            <CardDescription>Hierarchical view of all account groups and ledgers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : mainGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No accounts found. Initialize the chart of accounts?</p>
                <Button onClick={initializeAccountGroups}>
                  <Plus className="h-4 w-4 mr-2" />
                  Initialize Chart of Accounts
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {mainGroups.map(group => renderGroupTree(group))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
