import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, Wallet, PiggyBank, Scale, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFinancialReports, BalanceSheetEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import PullToRefreshContainer from './PullToRefreshContainer';
import { vibrateLight } from '@/lib/haptics';

export default function MobileBalanceSheet() {
  const { profile } = useAuth();
  const { getBalanceSheet } = useFinancialReports();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assets, setAssets] = useState<BalanceSheetEntry[]>([]);
  const [liabilities, setLiabilities] = useState<BalanceSheetEntry[]>([]);
  const [equity, setEquity] = useState<BalanceSheetEntry[]>([]);
  const [totals, setTotals] = useState({ assets: 0, liabilities: 0, equity: 0, retainedEarnings: 0 });
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [liabilitiesExpanded, setLiabilitiesExpanded] = useState(true);
  const [equityExpanded, setEquityExpanded] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getBalanceSheet(asOfDate);
      setAssets(data.assets);
      setLiabilities(data.liabilities);
      setEquity(data.equity);
      setTotals({
        assets: data.totalAssets,
        liabilities: data.totalLiabilities,
        equity: data.totalEquity,
        retainedEarnings: data.retainedEarnings
      });
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

  const isBalanced = Math.abs(totals.assets - (totals.liabilities + totals.equity)) < 0.01;

  const groupByName = (entries: BalanceSheetEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.group_name]) {
        acc[entry.group_name] = [];
      }
      acc[entry.group_name].push(entry);
      return acc;
    }, {} as Record<string, BalanceSheetEntry[]>);
  };

  const assetGroups = groupByName(assets);
  const liabilityGroups = groupByName(liabilities);
  const equityGroups = groupByName(equity);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    groups: Record<string, BalanceSheetEntry[]>,
    total: number,
    bgClass: string,
    textClass: string,
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    retainedEarnings?: number
  ) => (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardContent className={`p-4 cursor-pointer ${bgClass} active:opacity-80 transition-opacity`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <span className={`font-semibold ${textClass}`}>{title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${textClass}`}>{formatCurrency(total)}</span>
                {expanded ? (
                  <ChevronUp className={`h-4 w-4 ${textClass}`} />
                ) : (
                  <ChevronDown className={`h-4 w-4 ${textClass}`} />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 py-2 space-y-1">
            {Object.entries(groups).map(([groupName, groupEntries]) => {
              const groupTotal = groupEntries.reduce((s, e) => s + e.balance, 0);
              return (
                <div key={groupName}>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-xs font-medium text-muted-foreground">{groupName}</span>
                    <span className="text-xs font-mono text-muted-foreground">{formatCurrency(groupTotal)}</span>
                  </div>
                  {groupEntries.map(entry => (
                    <div key={entry.account_id} className="flex justify-between py-2 pl-2">
                      <span className="text-sm">{entry.account_name}</span>
                      <span className="font-mono text-sm">{formatCurrency(entry.balance)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {retainedEarnings !== undefined && retainedEarnings !== 0 && (
              <div className="flex justify-between py-2 bg-muted/50 px-2 rounded mt-2">
                <span className="text-sm font-medium">Retained Earnings (P&L)</span>
                <span className="font-mono text-sm font-medium">{formatCurrency(retainedEarnings)}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  return (
    <MobileLayout hideNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        <MobileGradientHeader title="Balance Sheet" showBack variant="minimal">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Calendar className="h-5 w-5" />
              </Button>
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
        </MobileGradientHeader>

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
                  <div className="flex-1">
                    <p className={`font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                      {isBalanced ? 'Books Balanced' : 'Not Balanced'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      As of {format(new Date(asOfDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="bg-white/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Assets</p>
                    <p className="font-bold">{formatCurrency(totals.assets)}</p>
                  </div>
                  <div className="bg-white/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Liab + Equity</p>
                    <p className="font-bold">{formatCurrency(totals.liabilities + totals.equity)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {renderSection(
                  'Assets',
                  <Building2 className="h-5 w-5 text-blue-600" />,
                  assetGroups,
                  totals.assets,
                  'bg-blue-50',
                  'text-blue-700',
                  assetsExpanded,
                  setAssetsExpanded
                )}
                {renderSection(
                  'Liabilities',
                  <Wallet className="h-5 w-5 text-orange-600" />,
                  liabilityGroups,
                  totals.liabilities,
                  'bg-orange-50',
                  'text-orange-700',
                  liabilitiesExpanded,
                  setLiabilitiesExpanded
                )}
                {renderSection(
                  'Equity',
                  <PiggyBank className="h-5 w-5 text-purple-600" />,
                  equityGroups,
                  totals.equity,
                  'bg-purple-50',
                  'text-purple-700',
                  equityExpanded,
                  setEquityExpanded,
                  totals.retainedEarnings
                )}
              </div>
            )}
          </div>
        </PullToRefreshContainer>
      </div>
    </MobileLayout>
  );
}
