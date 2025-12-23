import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Scale, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinancialReports, TrialBalanceEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import PullToRefreshContainer from './PullToRefreshContainer';
import { vibrateLight } from '@/lib/haptics';

export default function MobileTrialBalance() {
  const { profile } = useAuth();
  const { getTrialBalance } = useFinancialReports();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTrialBalance(asOfDate);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
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
    }).format(amount);
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit_balance, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit_balance, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.account_type]) {
      acc[entry.account_type] = [];
    }
    acc[entry.account_type].push(entry);
    return acc;
  }, {} as Record<string, TrialBalanceEntry[]>);

  const typeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];
  const typeLabels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    income: 'Income',
    expense: 'Expenses'
  };
  const typeColors: Record<string, string> = {
    asset: 'bg-blue-500',
    liability: 'bg-orange-500',
    equity: 'bg-purple-500',
    income: 'bg-green-500',
    expense: 'bg-red-500'
  };

  const toggleType = (type: string) => {
    vibrateLight();
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <MobileLayout hideNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        <MobileSimpleHeader 
          title="Trial Balance" 
          showBack
          rightContent={
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Report Date</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>As of Date</Label>
                    <Input
                      type="date"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => { fetchData(); setFilterOpen(false); }}
                    disabled={loading}
                  >
                    Generate Report
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          }
        />

        <PullToRefreshContainer onRefresh={handleRefresh}>
          <div className="p-4 space-y-4 pb-24">
            {/* Balance Status */}
            <Card className={isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {isBalanced ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                      {isBalanced ? 'Books Balanced' : 'Not Balanced'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      As of {format(new Date(asOfDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Debit</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totalDebit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Credit</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(totalCredit)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Account Groups */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No entries found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {typeOrder.map(type => {
                  const typeEntries = groupedEntries[type] || [];
                  if (typeEntries.length === 0) return null;

                  const typeDebit = typeEntries.reduce((s, e) => s + e.debit_balance, 0);
                  const typeCredit = typeEntries.reduce((s, e) => s + e.credit_balance, 0);
                  const isExpanded = expandedType === type;

                  return (
                    <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleType(type)}>
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <CardContent className="p-4 cursor-pointer active:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${typeColors[type]}`} />
                                <div>
                                  <p className="font-semibold">{typeLabels[type]}</p>
                                  <p className="text-xs text-muted-foreground">{typeEntries.length} accounts</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  {typeDebit > 0 && (
                                    <p className="text-sm font-mono text-green-600">{formatCurrency(typeDebit)}</p>
                                  )}
                                  {typeCredit > 0 && (
                                    <p className="text-sm font-mono text-blue-600">{formatCurrency(typeCredit)}</p>
                                  )}
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 px-4 py-2 space-y-2">
                            {typeEntries.map(entry => (
                              <div key={entry.account_id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{entry.account_name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{entry.account_code}</p>
                                </div>
                                <div className="text-right">
                                  {entry.debit_balance > 0 && (
                                    <p className="text-sm font-mono text-green-600">{formatCurrency(entry.debit_balance)}</p>
                                  )}
                                  {entry.credit_balance > 0 && (
                                    <p className="text-sm font-mono text-blue-600">{formatCurrency(entry.credit_balance)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>
        </PullToRefreshContainer>
      </div>
    </MobileLayout>
  );
}
