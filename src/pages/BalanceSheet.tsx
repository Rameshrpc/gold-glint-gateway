import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports, BalanceSheetEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import { PDFViewerDialog } from '@/components/receipts/PDFViewerDialog';
import { BalanceSheetPDF } from '@/components/reports/BalanceSheetPDF';
import { FileText, RefreshCw, Building2, Wallet, PiggyBank, Scale, ExternalLink } from 'lucide-react';

// Map account codes to their source pages
const accountSourceMap: Record<string, { label: string; href: string }> = {
  'LOAN-RECV': { label: 'View Active Loans', href: '/loans' },
  'CASH-001': { label: 'View Day Book', href: '/day-book' },
  'GOLD-STOCK': { label: 'View Gold Vault', href: '/gold-vault' },
  'BANK-LOAN-PAY': { label: 'View Repledge Packets', href: '/gold-vault' },
  'SURPLUS-PAY': { label: 'View Auctions', href: '/auction' },
  'ADV-INT-SHOWN': { label: 'View Loans', href: '/loans' },
  'ADV-INT-DIFF': { label: 'View Loans', href: '/loans' },
  'AGENT-COMM-PAY': { label: 'View Agent Commissions', href: '/agent-commissions' },
};

export default function BalanceSheet() {
  const navigate = useNavigate();
  const { profile, client } = useAuth();
  const { getBalanceSheet } = useFinancialReports();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assets, setAssets] = useState<BalanceSheetEntry[]>([]);
  const [liabilities, setLiabilities] = useState<BalanceSheetEntry[]>([]);
  const [equity, setEquity] = useState<BalanceSheetEntry[]>([]);
  const [totals, setTotals] = useState({ assets: 0, liabilities: 0, equity: 0, retainedEarnings: 0 });
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
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
    titleClass: string
  ) => (
    <Card>
      <CardHeader className={bgClass}>
        <CardTitle className={`${titleClass} flex items-center gap-2`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No entries</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groups).map(([groupName, groupEntries]) => {
                const groupTotal = groupEntries.reduce((s, e) => s + e.balance, 0);
                return (
                  <>
                    <TableRow key={`grp-${groupName}`} className="bg-muted/30">
                      <TableCell className="font-medium">{groupName}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatCurrency(groupTotal)}
                      </TableCell>
                    </TableRow>
                    {groupEntries.map(entry => (
                      <TableRow key={entry.account_id} className="group hover:bg-muted/50">
                        <TableCell className="pl-6 flex items-center gap-2">
                          {entry.account_name}
                          {accountSourceMap[entry.account_code] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => navigate(accountSourceMap[entry.account_code].href)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span className="text-xs">{accountSourceMap[entry.account_code].label}</span>
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
              <TableRow className={`${bgClass} font-bold`}>
                <TableCell>Total {title}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Balance Sheet</h1>
            <p className="text-muted-foreground">Financial position snapshot</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowPDF(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-48">
                <Label htmlFor="asOfDate">As of Date</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchData} disabled={loading}>
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Check */}
        <Card className={isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Scale className={`h-6 w-6 ${isBalanced ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className={`font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                    {isBalanced ? 'Books are Balanced' : 'Books are NOT Balanced'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Assets = Liabilities + Equity
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Assets</p>
                  <p className="font-bold">{formatCurrency(totals.assets)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">=</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Liabilities + Equity</p>
                  <p className="font-bold">{formatCurrency(totals.liabilities + totals.equity)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Column */}
          <div className="space-y-6">
            {renderSection(
              'Assets',
              <Building2 className="h-5 w-5" />,
              assetGroups,
              totals.assets,
              'bg-blue-50',
              'text-blue-700'
            )}
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-6">
            {renderSection(
              'Liabilities',
              <Wallet className="h-5 w-5" />,
              liabilityGroups,
              totals.liabilities,
              'bg-orange-50',
              'text-orange-700'
            )}

            <Card>
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-700 flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Equity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(equityGroups).map(([groupName, groupEntries]) => (
                        <>
                          <TableRow key={`eq-grp-${groupName}`} className="bg-muted/30">
                            <TableCell colSpan={2} className="font-medium">{groupName}</TableCell>
                          </TableRow>
                          {groupEntries.map(entry => (
                            <TableRow key={entry.account_id}>
                              <TableCell className="pl-6">{entry.account_name}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                      {totals.retainedEarnings !== 0 && (
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-medium">Retained Earnings (P&L)</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(totals.retainedEarnings)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-purple-100 font-bold">
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totals.equity)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Grand Total */}
            <Card className="bg-gradient-to-r from-orange-100 to-purple-100">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total Liabilities + Equity</span>
                  <span className="font-bold text-lg font-mono">
                    {formatCurrency(totals.liabilities + totals.equity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PDFViewerDialog
        open={showPDF}
        onOpenChange={setShowPDF}
        title="Balance Sheet"
        fileName={`balance-sheet-${asOfDate}.pdf`}
        document={
          <BalanceSheetPDF
            assets={assets}
            liabilities={liabilities}
            equity={equity}
            asOfDate={asOfDate}
            companyName={client?.company_name || ''}
            totalAssets={totals.assets}
            totalLiabilities={totals.liabilities}
            totalEquity={totals.equity}
            retainedEarnings={totals.retainedEarnings}
          />
        }
      />
    </DashboardLayout>
  );
}
