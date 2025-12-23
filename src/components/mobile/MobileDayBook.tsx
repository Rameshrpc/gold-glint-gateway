import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, RefreshCw, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFinancialReports, DayBookEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import PullToRefreshContainer from './PullToRefreshContainer';
import { vibrateLight } from '@/lib/haptics';

export default function MobileDayBook() {
  const { profile } = useAuth();
  const { getDayBook } = useFinancialReports();
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<DayBookEntry[]>([]);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDayBook(fromDate, toDate);
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

  const voucherTypes = [...new Set(entries.map(e => e.voucher_type))];
  const filteredEntries = voucherTypeFilter === 'all'
    ? entries
    : entries.filter(e => e.voucher_type === voucherTypeFilter);

  const groupedByVoucher = filteredEntries.reduce((acc, entry) => {
    const key = `${entry.voucher_date}-${entry.voucher_number}`;
    if (!acc[key]) {
      acc[key] = {
        voucher_date: entry.voucher_date,
        voucher_number: entry.voucher_number,
        voucher_type: entry.voucher_type,
        narration: entry.narration,
        entries: []
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { voucher_date: string; voucher_number: string; voucher_type: string; narration: string; entries: DayBookEntry[] }>);

  const voucherGroups = Object.values(groupedByVoucher).sort((a, b) => 
    b.voucher_date.localeCompare(a.voucher_date) || b.voucher_number.localeCompare(a.voucher_number)
  );

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit_amount, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit_amount, 0);

  const voucherTypeColors: Record<string, string> = {
    payment: 'bg-destructive/10 text-destructive',
    receipt: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    journal: 'bg-primary/10 text-primary',
    contra: 'bg-secondary text-secondary-foreground'
  };

  const toggleVoucher = (key: string) => {
    vibrateLight();
    setExpandedVoucher(expandedVoucher === key ? null : key);
  };

  return (
    <MobileLayout hideNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        <MobileSimpleHeader 
          title="Day Book" 
          showBack
          rightContent={
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Report Parameters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
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
                  <div>
                    <Label>Voucher Type</Label>
                    <Select value={voucherTypeFilter} onValueChange={setVoucherTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {voucherTypes.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Vouchers</p>
                  <p className="text-lg font-bold">{voucherGroups.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Debit</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(totalDebit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Credit</p>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(totalCredit)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {format(new Date(fromDate), 'dd MMM yyyy')} - {format(new Date(toDate), 'dd MMM yyyy')}
            </div>

            {/* Voucher List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : voucherGroups.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground/70">Try adjusting the date range</p>
              </div>
            ) : (
              <div className="space-y-3">
                {voucherGroups.map((group, index) => {
                  const key = `${group.voucher_number}-${index}`;
                  const isExpanded = expandedVoucher === key;
                  const voucherTotal = group.entries.reduce((s, e) => s + e.debit_amount, 0);

                  return (
                    <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleVoucher(key)}>
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <CardContent className="p-4 cursor-pointer active:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(group.voucher_date), 'dd MMM')}
                                  </span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${voucherTypeColors[group.voucher_type] || 'bg-gray-100 text-gray-700'}`}
                                  >
                                    {group.voucher_type}
                                  </Badge>
                                </div>
                                <p className="font-mono font-medium text-sm">{group.voucher_number}</p>
                                {group.narration && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{group.narration}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm">{formatCurrency(voucherTotal)}</span>
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
                          <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                            {group.entries.map((entry, entryIndex) => (
                              <div key={entryIndex} className="flex justify-between items-center text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{entry.account_name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{entry.account_code}</p>
                                </div>
                                <div className="text-right">
                                  {entry.debit_amount > 0 && (
                                    <p className="text-green-600 font-mono text-sm">Dr {formatCurrency(entry.debit_amount)}</p>
                                  )}
                                  {entry.credit_amount > 0 && (
                                    <p className="text-blue-600 font-mono text-sm">Cr {formatCurrency(entry.credit_amount)}</p>
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
