import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports, TrialBalanceEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import { PDFViewerDialog } from '@/components/receipts/PDFViewerDialog';
import { TrialBalancePDF } from '@/components/reports/TrialBalancePDF';
import { FileText, RefreshCw, Scale } from 'lucide-react';

export default function TrialBalance() {
  const { profile, client } = useAuth();
  const { getTrialBalance } = useFinancialReports();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit_balance, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit_balance, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Group entries by account type
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trial Balance</h1>
            <p className="text-muted-foreground">Verify that books are balanced</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowPDF(true)} disabled={entries.length === 0}>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trial Balance as of {format(new Date(asOfDate), 'dd MMM yyyy')}</CardTitle>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isBalanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No entries found for the selected date</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeOrder.map(type => {
                      const typeEntries = groupedEntries[type] || [];
                      if (typeEntries.length === 0) return null;
                      
                      const typeDebit = typeEntries.reduce((s, e) => s + e.debit_balance, 0);
                      const typeCredit = typeEntries.reduce((s, e) => s + e.credit_balance, 0);

                      return (
                        <>
                          <TableRow key={`header-${type}`} className="bg-muted/50">
                            <TableCell colSpan={5} className="font-semibold text-foreground">
                              {typeLabels[type]}
                            </TableCell>
                          </TableRow>
                          {typeEntries.map(entry => (
                            <TableRow key={entry.account_id}>
                              <TableCell className="font-mono text-sm">{entry.account_code}</TableCell>
                              <TableCell>{entry.account_name}</TableCell>
                              <TableCell className="text-muted-foreground">{entry.group_name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debit_balance > 0 ? formatCurrency(entry.debit_balance) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.credit_balance > 0 ? formatCurrency(entry.credit_balance) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow key={`subtotal-${type}`} className="bg-muted/30">
                            <TableCell colSpan={3} className="text-right font-medium">
                              Subtotal - {typeLabels[type]}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {typeDebit > 0 ? formatCurrency(typeDebit) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {typeCredit > 0 ? formatCurrency(typeCredit) : '-'}
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalCredit)}</TableCell>
                    </TableRow>
                    {!isBalanced && (
                      <TableRow className="bg-destructive/10">
                        <TableCell colSpan={3} className="text-right text-destructive font-medium">
                          Difference
                        </TableCell>
                        <TableCell colSpan={2} className="text-right text-destructive font-mono font-medium">
                          {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PDFViewerDialog
        open={showPDF}
        onOpenChange={setShowPDF}
        title="Trial Balance"
        fileName={`trial-balance-${asOfDate}.pdf`}
        document={
          <TrialBalancePDF
            entries={entries}
            asOfDate={asOfDate}
            companyName={client?.company_name || ''}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />
        }
      />
    </DashboardLayout>
  );
}
