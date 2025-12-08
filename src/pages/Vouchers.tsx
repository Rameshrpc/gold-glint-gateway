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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Eye, RefreshCw, CalendarIcon, Trash2, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  voucher_type: string;
  reference_type: string | null;
  reference_id: string | null;
  narration: string;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  is_reversed: boolean;
  created_at: string;
  created_by: string | null;
}

interface VoucherEntry {
  id: string;
  voucher_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  account?: { account_code: string; account_name: string };
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface JournalLine {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  narration: string;
}

const voucherTypeLabels: Record<string, string> = {
  receipt: 'Receipt',
  payment: 'Payment',
  contra: 'Contra',
  journal: 'Journal',
  loan_disbursement: 'Loan Disbursement',
  interest_collection: 'Interest Collection',
  redemption: 'Redemption',
  reloan: 'Reloan',
  auction: 'Auction',
  repledge_credit: 'Repledge Credit',
  repledge_redemption: 'Repledge Redemption',
  agent_commission: 'Agent Commission',
};

const voucherTypeColors: Record<string, string> = {
  receipt: 'bg-green-100 text-green-800',
  payment: 'bg-red-100 text-red-800',
  contra: 'bg-purple-100 text-purple-800',
  journal: 'bg-blue-100 text-blue-800',
  loan_disbursement: 'bg-amber-100 text-amber-800',
  interest_collection: 'bg-emerald-100 text-emerald-800',
  redemption: 'bg-teal-100 text-teal-800',
  reloan: 'bg-cyan-100 text-cyan-800',
  auction: 'bg-orange-100 text-orange-800',
  repledge_credit: 'bg-indigo-100 text-indigo-800',
  repledge_redemption: 'bg-violet-100 text-violet-800',
  agent_commission: 'bg-pink-100 text-pink-800',
};

const manualVoucherTypes = ['receipt', 'payment', 'contra', 'journal'];

export default function Vouchers() {
  const { profile, currentBranch } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherEntries, setVoucherEntries] = useState<VoucherEntry[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New voucher form
  const [voucherType, setVoucherType] = useState('journal');
  const [voucherDate, setVoucherDate] = useState<Date>(new Date());
  const [narration, setNarration] = useState('');
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
    { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
  ]);

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id, dateFrom, dateTo, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch vouchers
      let query = supabase
        .from('vouchers')
        .select('*')
        .eq('client_id', profile?.client_id)
        .gte('voucher_date', format(dateFrom, 'yyyy-MM-dd'))
        .lte('voucher_date', format(dateTo, 'yyyy-MM-dd'))
        .order('voucher_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('voucher_type', filterType);
      }

      const { data: vouchersData, error: vouchersError } = await query;
      if (vouchersError) throw vouchersError;
      setVouchers(vouchersData || []);

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_code, account_name, account_type, current_balance')
        .eq('client_id', profile?.client_id)
        .eq('is_active', true)
        .order('account_code');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherEntries = async (voucherId: string) => {
    try {
      const { data, error } = await supabase
        .from('voucher_entries')
        .select('*, account:accounts(account_code, account_name)')
        .eq('voucher_id', voucherId)
        .order('debit_amount', { ascending: false });

      if (error) throw error;
      setVoucherEntries((data as any) || []);
    } catch (error: any) {
      toast.error('Failed to fetch entries', { description: error.message });
    }
  };

  const handleViewVoucher = async (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    await fetchVoucherEntries(voucher.id);
    setIsViewDialogOpen(true);
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter((_, i) => i !== index));
    }
  };

  const updateJournalLine = (index: number, field: keyof JournalLine, value: any) => {
    const updated = [...journalLines];
    updated[index] = { ...updated[index], [field]: value };
    
    // For receipt/payment, auto-clear the opposite amount
    if (field === 'debit_amount' && value > 0) {
      updated[index].credit_amount = 0;
    } else if (field === 'credit_amount' && value > 0) {
      updated[index].debit_amount = 0;
    }
    
    setJournalLines(updated);
  };

  const calculateTotals = () => {
    const totalDebit = journalLines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const handleCreateVoucher = async () => {
    const { totalDebit, totalCredit, isBalanced } = calculateTotals();

    if (!isBalanced) {
      toast.error('Voucher is not balanced', { description: `Debit: ₹${totalDebit}, Credit: ₹${totalCredit}` });
      return;
    }

    if (!narration.trim()) {
      toast.error('Please enter narration');
      return;
    }

    const validLines = journalLines.filter(l => l.account_id && (l.debit_amount > 0 || l.credit_amount > 0));
    if (validLines.length < 2) {
      toast.error('At least 2 valid entries required');
      return;
    }

    try {
      // Generate voucher number
      const { data: voucherNumber, error: numError } = await supabase.rpc('generate_voucher_number', {
        p_client_id: profile?.client_id,
        p_voucher_type: voucherType
      });
      if (numError) throw numError;

      // Create voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .insert({
          client_id: profile?.client_id,
          branch_id: currentBranch?.id,
          voucher_number: voucherNumber,
          voucher_date: format(voucherDate, 'yyyy-MM-dd'),
          voucher_type: voucherType,
          narration: narration.trim(),
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_posted: true,
        })
        .select()
        .single();

      if (voucherError) throw voucherError;

      // Create entries
      const entries = validLines.map(line => ({
        voucher_id: voucher.id,
        account_id: line.account_id,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        narration: line.narration || null,
      }));

      const { error: entriesError } = await supabase.from('voucher_entries').insert(entries);
      if (entriesError) throw entriesError;

      // Update account balances
      for (const line of validLines) {
        const account = accounts.find(a => a.id === line.account_id);
        if (account) {
          const isDebitNature = ['asset', 'expense'].includes(account.account_type);
          const balanceChange = isDebitNature
            ? (line.debit_amount - line.credit_amount)
            : (line.credit_amount - line.debit_amount);

          await supabase
            .from('accounts')
            .update({ current_balance: account.current_balance + balanceChange })
            .eq('id', line.account_id);
        }
      }

      toast.success('Voucher created successfully', { description: voucherNumber });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create voucher', { description: error.message });
    }
  };

  const resetForm = () => {
    setVoucherType('journal');
    setVoucherDate(new Date());
    setNarration('');
    setJournalLines([
      { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
      { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredVouchers = vouchers.filter(v => 
    searchQuery === '' || 
    v.voucher_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.narration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vouchers</h1>
            <p className="text-muted-foreground">
              View and manage accounting vouchers and journal entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Manual Voucher</DialogTitle>
                  <DialogDescription>Create a new accounting voucher with journal entries</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Voucher Header */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Voucher Type *</Label>
                      <Select value={voucherType} onValueChange={setVoucherType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {manualVoucherTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {voucherTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(voucherDate, 'dd MMM yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={voucherDate}
                            onSelect={(date) => date && setVoucherDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className={cn(
                        'h-10 px-3 py-2 rounded-md border text-sm flex items-center gap-2',
                        isBalanced ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                      )}>
                        {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                      </div>
                    </div>
                  </div>

                  {/* Journal Entries */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Journal Entries</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addJournalLine}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Line
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[40%]">Account</TableHead>
                            <TableHead className="text-right w-[20%]">Debit (₹)</TableHead>
                            <TableHead className="text-right w-[20%]">Credit (₹)</TableHead>
                            <TableHead className="w-[15%]">Narration</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journalLines.map((line, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={line.account_id}
                                  onValueChange={(val) => updateJournalLine(index, 'account_id', val)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map(acc => (
                                      <SelectItem key={acc.id} value={acc.id}>
                                        <span className="font-mono text-xs mr-2">{acc.account_code}</span>
                                        {acc.account_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={line.debit_amount || ''}
                                  onChange={(e) => updateJournalLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={line.credit_amount || ''}
                                  onChange={(e) => updateJournalLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={line.narration}
                                  onChange={(e) => updateJournalLine(index, 'narration', e.target.value)}
                                  placeholder="Optional"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeJournalLine(index)}
                                  disabled={journalLines.length <= 2}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Totals Row */}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell className="text-right">Total</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                            <TableCell colSpan={2}>
                              {!isBalanced && (
                                <span className="text-red-600 text-sm">
                                  Diff: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Narration */}
                  <div className="space-y-2">
                    <Label>Narration *</Label>
                    <Textarea
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                      placeholder="Enter voucher narration/description"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVoucher} disabled={!isBalanced}>
                    Create Voucher
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => date && setDateFrom(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => date && setDateTo(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(voucherTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Search</Label>
                <Input
                  placeholder="Search voucher number or narration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Voucher List</CardTitle>
            <CardDescription>
              {filteredVouchers.length} voucher(s) found for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vouchers found for the selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="max-w-[300px]">Narration</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map(voucher => (
                    <TableRow key={voucher.id}>
                      <TableCell className="text-sm">
                        {format(new Date(voucher.voucher_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {voucher.voucher_number}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', voucherTypeColors[voucher.voucher_type])}>
                          {voucherTypeLabels[voucher.voucher_type] || voucher.voucher_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {voucher.narration}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(voucher.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(voucher.total_credit)}
                      </TableCell>
                      <TableCell>
                        {voucher.is_reversed ? (
                          <Badge variant="destructive">Reversed</Badge>
                        ) : voucher.is_posted ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Posted</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewVoucher(voucher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Voucher Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Voucher Details
              </DialogTitle>
              <DialogDescription>
                {selectedVoucher?.voucher_number}
              </DialogDescription>
            </DialogHeader>
            {selectedVoucher && (
              <div className="space-y-6">
                {/* Voucher Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedVoucher.voucher_date), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge className={cn('mt-1', voucherTypeColors[selectedVoucher.voucher_type])}>
                      {voucherTypeLabels[selectedVoucher.voucher_type]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{formatCurrency(selectedVoucher.total_debit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {selectedVoucher.is_reversed ? (
                      <Badge variant="destructive">Reversed</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Posted</Badge>
                    )}
                  </div>
                </div>

                {/* Narration */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Narration</p>
                  <p>{selectedVoucher.narration}</p>
                </div>

                {/* Journal Entries */}
                <div>
                  <h4 className="font-semibold mb-3">Journal Entries</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entry.debit_amount > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-red-600" />
                              )}
                              <div>
                                <p className="font-medium">{entry.account?.account_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{entry.account?.account_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(selectedVoucher.total_debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(selectedVoucher.total_credit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
