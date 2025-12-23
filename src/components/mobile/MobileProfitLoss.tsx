import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFinancialReports, ProfitLossEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import PullToRefreshContainer from './PullToRefreshContainer';
import { vibrateLight } from '@/lib/haptics';

export default function MobileProfitLoss() {
  const { profile } = useAuth();
  const { getProfitLoss } = useFinancialReports();
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [income, setIncome] = useState<ProfitLossEntry[]>([]);
  const [expenses, setExpenses] = useState<ProfitLossEntry[]>([]);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [incomeExpanded, setIncomeExpanded] = useState(true);
  const [expenseExpanded, setExpenseExpanded] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProfitLoss(fromDate, toDate);
      setIncome(data.income);
      setExpenses(data.expenses);
      setNetProfit(data.netProfit);
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

  const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const groupByName = (entries: ProfitLossEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.group_name]) {
        acc[entry.group_name] = [];
      }
      acc[entry.group_name].push(entry);
      return acc;
    }, {} as Record<string, ProfitLossEntry[]>);
  };

  const incomeGroups = groupByName(income);
  const expenseGroups = groupByName(expenses);

  return (
    <MobileLayout hideNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        <MobileSimpleHeader 
          title="Profit & Loss" 
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
                  <SheetTitle>Report Period</SheetTitle>
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
            {/* Net Profit/Loss Card */}
            <Card className={netProfit >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                    </p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(Math.abs(netProfit))}
                    </p>
                  </div>
                  <DollarSign className={`h-10 w-10 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(fromDate), 'dd MMM')} - {format(new Date(toDate), 'dd MMM yyyy')}
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-600">Income</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(totalIncome)}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-3 text-center">
                  <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xs text-red-600">Expenses</p>
                  <p className="text-lg font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Income Section */}
                <Collapsible open={incomeExpanded} onOpenChange={setIncomeExpanded}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer bg-green-50 active:bg-green-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-700">Income</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">{formatCurrency(totalIncome)}</span>
                            {incomeExpanded ? (
                              <ChevronUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-2 space-y-1">
                        {Object.entries(incomeGroups).map(([groupName, groupEntries]) => (
                          <div key={groupName}>
                            <p className="text-xs font-medium text-muted-foreground py-2 border-b">{groupName}</p>
                            {groupEntries.map(entry => (
                              <div key={entry.account_id} className="flex justify-between py-2">
                                <span className="text-sm">{entry.account_name}</span>
                                <span className="font-mono text-sm text-green-600">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Expenses Section */}
                <Collapsible open={expenseExpanded} onOpenChange={setExpenseExpanded}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer bg-red-50 active:bg-red-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-700">Expenses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-700">{formatCurrency(totalExpenses)}</span>
                            {expenseExpanded ? (
                              <ChevronUp className="h-4 w-4 text-red-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-2 space-y-1">
                        {Object.entries(expenseGroups).map(([groupName, groupEntries]) => (
                          <div key={groupName}>
                            <p className="text-xs font-medium text-muted-foreground py-2 border-b">{groupName}</p>
                            {groupEntries.map(entry => (
                              <div key={entry.account_id} className="flex justify-between py-2">
                                <span className="text-sm">{entry.account_name}</span>
                                <span className="font-mono text-sm text-red-600">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </>
            )}
          </div>
        </PullToRefreshContainer>
      </div>
    </MobileLayout>
  );
}
