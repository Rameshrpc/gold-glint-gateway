import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports, ProfitLossEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import { PDFViewerDialog } from '@/components/receipts/PDFViewerDialog';
import { ProfitLossPDF } from '@/components/reports/ProfitLossPDF';
import { FileText, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function ProfitAndLoss() {
  const { profile, client } = useAuth();
  const { getProfitLoss } = useFinancialReports();
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [income, setIncome] = useState<ProfitLossEntry[]>([]);
  const [expenses, setExpenses] = useState<ProfitLossEntry[]>([]);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by group_name
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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profit & Loss Statement</h1>
            <p className="text-muted-foreground">Income vs Expenses for the period</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowPDF(true)} disabled={income.length === 0 && expenses.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-48">
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchData} disabled={loading}>
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Income</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className={netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                  </p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(Math.abs(netProfit))}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Section */}
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Income
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : income.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No income entries</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(incomeGroups).map(([groupName, groupEntries]) => (
                      <>
                        <TableRow key={`inc-grp-${groupName}`} className="bg-muted/30">
                          <TableCell colSpan={2} className="font-medium">{groupName}</TableCell>
                        </TableRow>
                        {groupEntries.map(entry => (
                          <TableRow key={entry.account_id}>
                            <TableCell className="pl-6">{entry.account_name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(entry.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                    <TableRow className="bg-green-100 font-bold">
                      <TableCell>Total Income</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalIncome)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card>
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No expense entries</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(expenseGroups).map(([groupName, groupEntries]) => (
                      <>
                        <TableRow key={`exp-grp-${groupName}`} className="bg-muted/30">
                          <TableCell colSpan={2} className="font-medium">{groupName}</TableCell>
                        </TableRow>
                        {groupEntries.map(entry => (
                          <TableRow key={entry.account_id}>
                            <TableCell className="pl-6">{entry.account_name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(entry.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                    <TableRow className="bg-red-100 font-bold">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalExpenses)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PDFViewerDialog
        open={showPDF}
        onOpenChange={setShowPDF}
        title="Profit & Loss Statement"
        fileName={`profit-loss-${fromDate}-to-${toDate}.pdf`}
        document={
          <ProfitLossPDF
            income={income}
            expenses={expenses}
            fromDate={fromDate}
            toDate={toDate}
            companyName={client?.company_name || ''}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
          />
        }
      />
    </DashboardLayout>
  );
}
