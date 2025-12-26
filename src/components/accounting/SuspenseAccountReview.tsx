import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SuspenseEntry {
  id: string;
  voucher_id: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  voucher: {
    voucher_number: string;
    voucher_date: string;
    voucher_type: string;
    narration: string;
    reference_type: string | null;
  };
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
}

export function SuspenseAccountReview() {
  const { profile } = useAuth();
  const [suspenseAccount, setSuspenseAccount] = useState<{ id: string; current_balance: number } | null>(null);
  const [entries, setEntries] = useState<SuspenseEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SuspenseEntry | null>(null);
  const [targetAccountId, setTargetAccountId] = useState('');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get suspense account
      const { data: suspenseData, error: suspenseError } = await supabase
        .from('accounts')
        .select('id, current_balance')
        .eq('client_id', profile?.client_id)
        .eq('account_code', 'SUSPENSE')
        .single();

      if (suspenseError) throw suspenseError;
      setSuspenseAccount(suspenseData);

      // Get all suspense entries with voucher details
      const { data: entriesData, error: entriesError } = await supabase
        .from('voucher_entries')
        .select(`
          id,
          voucher_id,
          debit_amount,
          credit_amount,
          narration,
          voucher:vouchers(voucher_number, voucher_date, voucher_type, narration, reference_type)
        `)
        .eq('account_id', suspenseData.id)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;
      setEntries((entriesData as any) || []);

      // Get all accounts for transfer
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_code, account_name')
        .eq('client_id', profile?.client_id)
        .eq('is_active', true)
        .neq('account_code', 'SUSPENSE')
        .order('account_code');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);
    } catch (error: any) {
      toast.error('Failed to fetch suspense data', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedEntry || !targetAccountId) {
      toast.error('Please select target account');
      return;
    }

    setIsProcessing(true);
    try {
      const amount = selectedEntry.debit_amount || selectedEntry.credit_amount;
      const isDebit = selectedEntry.debit_amount > 0;

      // Create correcting journal voucher
      const { data: voucherNumber, error: numError } = await supabase.rpc('generate_voucher_number', {
        p_client_id: profile?.client_id,
        p_voucher_type: 'journal'
      });
      if (numError) throw numError;

      // Create the voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .insert({
          client_id: profile?.client_id,
          branch_id: profile?.branch_id,
          voucher_number: voucherNumber,
          voucher_date: format(new Date(), 'yyyy-MM-dd'),
          voucher_type: 'journal',
          narration: `Suspense clearance for ${selectedEntry.voucher?.voucher_number || 'adjustment'}`,
          total_debit: amount,
          total_credit: amount,
          is_posted: true,
        })
        .select()
        .single();

      if (voucherError) throw voucherError;

      // Create entries - reverse suspense and post to target account
      const entries = isDebit
        ? [
            { voucher_id: voucher.id, account_id: suspenseAccount!.id, debit_amount: 0, credit_amount: amount, narration: 'Suspense clearance' },
            { voucher_id: voucher.id, account_id: targetAccountId, debit_amount: amount, credit_amount: 0, narration: 'From suspense' },
          ]
        : [
            { voucher_id: voucher.id, account_id: suspenseAccount!.id, debit_amount: amount, credit_amount: 0, narration: 'Suspense clearance' },
            { voucher_id: voucher.id, account_id: targetAccountId, debit_amount: 0, credit_amount: amount, narration: 'From suspense' },
          ];

      const { error: entriesError } = await supabase.from('voucher_entries').insert(entries);
      if (entriesError) throw entriesError;

      // Update account balances
      const targetAccount = accounts.find(a => a.id === targetAccountId);
      
      // Update suspense balance (reverse the original entry)
      await supabase
        .from('accounts')
        .update({ 
          current_balance: suspenseAccount!.current_balance - (isDebit ? amount : -amount)
        })
        .eq('id', suspenseAccount!.id);

      toast.success('Suspense entry cleared', { description: `Transferred to ${targetAccount?.account_name}` });
      setIsTransferDialogOpen(false);
      setSelectedEntry(null);
      setTargetAccountId('');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to transfer', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVoucherTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loan_disbursement: 'bg-amber-100 text-amber-800',
      interest_collection: 'bg-emerald-100 text-emerald-800',
      redemption: 'bg-teal-100 text-teal-800',
      auction: 'bg-orange-100 text-orange-800',
      journal: 'bg-blue-100 text-blue-800',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Group entries by voucher type for analysis
  const groupedByType = entries.reduce((acc, entry) => {
    const type = entry.voucher?.voucher_type || 'unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, debit: 0, credit: 0 };
    }
    acc[type].count++;
    acc[type].debit += entry.debit_amount;
    acc[type].credit += entry.credit_amount;
    return acc;
  }, {} as Record<string, { count: number; debit: number; credit: number }>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={suspenseAccount?.current_balance === 0 ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {suspenseAccount?.current_balance === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              )}
              <div>
                <CardTitle>Suspense Account Review</CardTitle>
                <CardDescription>
                  {entries.length} adjustment entries • Balance: {formatCurrency(suspenseAccount?.current_balance || 0)}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Type-wise breakdown */}
          {Object.keys(groupedByType).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(groupedByType).map(([type, data]) => (
                <div key={type} className="p-3 rounded-lg bg-background border">
                  <div className="text-xs text-muted-foreground capitalize mb-1">{type.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-semibold">{data.count} entries</div>
                  <div className="text-xs text-muted-foreground">
                    Dr: {formatCurrency(data.debit)} | Cr: {formatCurrency(data.credit)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">No pending suspense entries</p>
              <p className="text-sm">All accounts are properly reconciled</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Original Voucher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.slice(0, 50).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {entry.voucher?.voucher_date ? format(new Date(entry.voucher.voucher_date), 'dd MMM yy') : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.voucher?.voucher_number || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getVoucherTypeBadge(entry.voucher?.voucher_type || '')}>
                          {entry.voucher?.voucher_type?.replace(/_/g, ' ') || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {entry.narration || entry.voucher?.narration || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsTransferDialogOpen(true);
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {entries.length > 50 && (
                <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                  Showing 50 of {entries.length} entries
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Suspense Entry</DialogTitle>
            <DialogDescription>
              Transfer this suspense entry to the correct account
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voucher:</span>
                  <span className="font-mono">{selectedEntry.voucher?.voucher_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    {selectedEntry.debit_amount > 0 
                      ? `Dr ${formatCurrency(selectedEntry.debit_amount)}`
                      : `Cr ${formatCurrency(selectedEntry.credit_amount)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original:</span>
                  <span className="text-xs">{selectedEntry.voucher?.narration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Transfer to Account</label>
                <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target account" />
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
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={!targetAccountId || isProcessing}>
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Clear Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
