import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useBackfillVouchers } from '@/hooks/useBackfillVouchers';
import { toast } from 'sonner';
import { 
  Database, 
  RefreshCw, 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  FileText,
  Receipt,
  Gavel,
  Building2,
  Loader2
} from 'lucide-react';

interface Summary {
  loans: { total: number; backfilled: number };
  interestPayments: { total: number; backfilled: number };
  redemptions: { total: number; backfilled: number };
  auctions: { total: number; backfilled: number };
  repledgePackets: { total: number; backfilled: number };
}

export default function BackfillVouchers() {
  const { profile } = useAuth();
  const { isRunning, progress, getSummary, backfillAll, setOpeningBalances } = useBackfillVouchers();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingBalances, setSettingBalances] = useState(false);

  const fetchSummary = async () => {
    if (!profile?.client_id) return;
    setLoading(true);
    try {
      const data = await getSummary(profile.client_id);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      fetchSummary();
    }
  }, [profile?.client_id]);

  const handleBackfill = async () => {
    if (!profile?.client_id) return;
    
    const result = await backfillAll(profile.client_id);
    
    if (result.success) {
      toast.success('Backfill completed', { 
        description: `${result.completed} vouchers generated` 
      });
      fetchSummary();
    } else {
      toast.error('Backfill failed', { description: result.error });
    }
  };

  const handleSetOpeningBalances = async () => {
    if (!profile?.client_id) return;
    
    setSettingBalances(true);
    const result = await setOpeningBalances(profile.client_id);
    setSettingBalances(false);
    
    if (result.success) {
      toast.success('Opening balances set successfully', {
        description: 'Cash Counter and Capital Account set to ₹5,00,000'
      });
    } else {
      toast.error('Failed to set opening balances', { description: result.error });
    }
  };

  const totalTransactions = summary
    ? summary.loans.total + summary.interestPayments.total + 
      summary.redemptions.total + summary.auctions.total + summary.repledgePackets.total
    : 0;

  const totalBackfilled = summary
    ? summary.loans.backfilled + summary.interestPayments.backfilled + 
      summary.redemptions.backfilled + summary.auctions.backfilled + summary.repledgePackets.backfilled
    : 0;

  const pendingVouchers = totalTransactions - totalBackfilled;

  const summaryRows = summary ? [
    { 
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      label: 'Loan Disbursements', 
      total: summary.loans.total, 
      backfilled: summary.loans.backfilled,
      pending: summary.loans.total - summary.loans.backfilled
    },
    { 
      icon: <Receipt className="h-4 w-4 text-green-600" />,
      label: 'Interest Payments', 
      total: summary.interestPayments.total, 
      backfilled: summary.interestPayments.backfilled,
      pending: summary.interestPayments.total - summary.interestPayments.backfilled
    },
    { 
      icon: <Wallet className="h-4 w-4 text-purple-600" />,
      label: 'Redemptions', 
      total: summary.redemptions.total, 
      backfilled: summary.redemptions.backfilled,
      pending: summary.redemptions.total - summary.redemptions.backfilled
    },
    { 
      icon: <Gavel className="h-4 w-4 text-orange-600" />,
      label: 'Auctions', 
      total: summary.auctions.total, 
      backfilled: summary.auctions.backfilled,
      pending: summary.auctions.total - summary.auctions.backfilled
    },
    { 
      icon: <Building2 className="h-4 w-4 text-cyan-600" />,
      label: 'Repledge Packets', 
      total: summary.repledgePackets.total, 
      backfilled: summary.repledgePackets.backfilled,
      pending: summary.repledgePackets.total - summary.repledgePackets.backfilled
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backfill Vouchers</h1>
            <p className="text-muted-foreground">
              Generate missing accounting vouchers for historical transactions
            </p>
          </div>
          <Button variant="outline" onClick={fetchSummary} disabled={loading || isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">With Vouchers</p>
                  <p className="text-2xl font-bold text-green-700">{totalBackfilled}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className={pendingVouchers > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${pendingVouchers > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    Pending
                  </p>
                  <p className={`text-2xl font-bold ${pendingVouchers > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {pendingVouchers}
                  </p>
                </div>
                {pendingVouchers > 0 ? (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
            <CardDescription>
              Overview of transactions and their voucher status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">With Vouchers</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryRows.map(row => (
                    <TableRow key={row.label}>
                      <TableCell className="flex items-center gap-2">
                        {row.icon}
                        {row.label}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.total}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{row.backfilled}</TableCell>
                      <TableCell className="text-right font-mono text-amber-600">{row.pending}</TableCell>
                      <TableCell className="text-right">
                        {row.pending === 0 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700">Complete</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700">{row.pending} Missing</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{totalTransactions}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{totalBackfilled}</TableCell>
                    <TableCell className="text-right font-mono text-amber-600">{pendingVouchers}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Backfill Progress */}
        {isRunning && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                Backfill in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={(progress.completed / progress.total) * 100} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing: {progress.current}</span>
                <span className="font-medium">{progress.completed} / {progress.total}</span>
              </div>
              {progress.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Errors ({progress.errors.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="text-sm mt-2 space-y-1">
                      {progress.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {progress.errors.length > 5 && (
                        <li>...and {progress.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Tools to initialize and fix your accounting data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleBackfill} 
                disabled={isRunning || pendingVouchers === 0}
                className="flex-1"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {isRunning ? 'Processing...' : `Generate ${pendingVouchers} Missing Vouchers`}
              </Button>
              <Button 
                variant="outline"
                onClick={handleSetOpeningBalances}
                disabled={settingBalances}
                className="flex-1"
              >
                {settingBalances ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                Set Opening Balances (₹5L)
              </Button>
            </div>

            {pendingVouchers === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">All Caught Up!</AlertTitle>
                <AlertDescription className="text-green-600">
                  All transactions have corresponding voucher entries. Your books are ready for financial reports.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
