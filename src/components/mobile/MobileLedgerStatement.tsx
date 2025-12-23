import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BookOpen, Calendar, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFinancialReports, LedgerEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import PullToRefreshContainer from './PullToRefreshContainer';
import { vibrateLight } from '@/lib/haptics';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

export default function MobileLedgerStatement() {
  const { profile } = useAuth();
  const { getLedgerStatement, getAccounts } = useFinancialReports();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
  };

  const fetchData = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const data = await getLedgerStatement(selectedAccount, fromDate, toDate);
      setEntries(data.entries);
      setOpeningBalance(data.openingBalance);
      setClosingBalance(data.closingBalance);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      fetchAccounts();
    }
  }, [profile?.client_id]);

  const handleRefresh = async () => {
    vibrateLight();
    await fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const selectedAccountDetails = accounts.find(a => a.id === selectedAccount);

  return (
    <MobileLayout hideNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        <MobileSimpleHeader 
          title="Ledger Statement" 
          showBack
          rightContent={
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Report Parameters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Select Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            <span className="font-mono text-xs mr-2">{account.account_code}</span>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => { fetchData(); setFilterOpen(false); }}
                    disabled={loading || !selectedAccount}
                  >
                    Generate Statement
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          }
        />

        <PullToRefreshContainer onRefresh={handleRefresh}>
          <div className="p-4 space-y-4 pb-24">
            {/* Account Selection Prompt or Selected Account */}
            {!selectedAccount ? (
              <Card 
                className="cursor-pointer active:bg-muted/50 transition-colors"
                onClick={() => setFilterOpen(true)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">Select an Account</p>
                        <p className="text-sm text-muted-foreground">Tap to choose account and date range</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ) : selectedAccountDetails && (
              <>
                {/* Selected Account Card */}
                <Card 
                  className="cursor-pointer active:bg-muted/50 transition-colors"
                  onClick={() => setFilterOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-primary">{selectedAccountDetails.account_code}</p>
                        <p className="font-semibold">{selectedAccountDetails.account_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fromDate), 'dd MMM')} - {format(new Date(toDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{selectedAccountDetails.account_type}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Opening Balance</p>
                      <p className={`text-lg font-bold ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(openingBalance)}
                      </p>
                      <p className="text-xs">{openingBalance >= 0 ? 'Dr' : 'Cr'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Closing Balance</p>
                      <p className={`text-lg font-bold ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(closingBalance)}
                      </p>
                      <p className="text-xs">{closingBalance >= 0 ? 'Dr' : 'Cr'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Transactions */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground/70">Try adjusting the date range</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map(entry => (
                      <Card key={entry.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.voucher_date), 'dd MMM')}
                                </span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {entry.voucher_type.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <p className="font-mono text-sm">{entry.voucher_number}</p>
                              {entry.narration && (
                                <p className="text-xs text-muted-foreground truncate mt-1">{entry.narration}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {entry.debit_amount > 0 && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <ArrowUpRight className="h-3 w-3" />
                                  <span className="font-mono text-sm">{formatCurrency(entry.debit_amount)}</span>
                                </div>
                              )}
                              {entry.credit_amount > 0 && (
                                <div className="flex items-center gap-1 text-red-600">
                                  <ArrowDownRight className="h-3 w-3" />
                                  <span className="font-mono text-sm">{formatCurrency(entry.credit_amount)}</span>
                                </div>
                              )}
                              <p className={`text-xs mt-1 ${entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Bal: {formatCurrency(entry.running_balance)} {entry.running_balance >= 0 ? 'Dr' : 'Cr'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </PullToRefreshContainer>
      </div>
    </MobileLayout>
  );
}
