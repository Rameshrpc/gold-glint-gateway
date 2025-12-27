import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  BarChart3, Download, FileSpreadsheet, Calendar as CalendarIcon, 
  Building2, TrendingUp, AlertTriangle, IndianRupee, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel, formatCurrencyForExport, formatDateForExport } from '@/lib/export-utils';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
}

interface DisbursementData {
  branch_id: string;
  branch_name: string;
  loan_count: number;
  total_principal: number;
  total_disbursed: number;
  avg_loan_amount: number;
}

interface CollectionData {
  branch_id: string;
  branch_name: string;
  expected_collections: number;
  actual_collections: number;
  efficiency_percentage: number;
}

interface OverdueData {
  loan_number: string;
  customer_name: string;
  branch_name: string;
  principal: number;
  days_overdue: number;
  aging_bucket: string;
  interest_due: number;
}

interface PortfolioData {
  branch_id: string;
  branch_name: string;
  active_loans: number;
  total_aum: number;
  gold_weight_grams: number;
  avg_interest_rate: number;
}

export default function Reports() {
  const { client, branches: authBranches } = useAuth();
  const [activeTab, setActiveTab] = useState('disbursement');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Filters
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Report data
  const [disbursementData, setDisbursementData] = useState<DisbursementData[]>([]);
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [overdueData, setOverdueData] = useState<OverdueData[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);

  useEffect(() => {
    if (authBranches) {
      setBranches(authBranches);
    }
  }, [authBranches]);

  useEffect(() => {
    if (client) {
      fetchReportData();
    }
  }, [client, activeTab, dateFrom, dateTo, selectedBranch]);

  const fetchReportData = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'disbursement':
          await fetchDisbursementReport();
          break;
        case 'collection':
          await fetchCollectionReport();
          break;
        case 'overdue':
          await fetchOverdueReport();
          break;
        case 'portfolio':
          await fetchPortfolioReport();
          break;
      }
    } catch (error: any) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisbursementReport = async () => {
    let query = supabase
      .from('loans')
      .select(`
        id, principal_amount, net_disbursed, branch_id,
        branch:branches(id, branch_code, branch_name)
      `)
      .eq('client_id', client!.id)
      .gte('loan_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('loan_date', format(dateTo, 'yyyy-MM-dd'));

    if (selectedBranch !== 'all') {
      query = query.eq('branch_id', selectedBranch);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by branch
    const grouped = (data || []).reduce((acc: Record<string, DisbursementData>, loan: any) => {
      const branchId = loan.branch_id;
      const branchName = loan.branch?.branch_name || 'Unknown';
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branch_id: branchId,
          branch_name: branchName,
          loan_count: 0,
          total_principal: 0,
          total_disbursed: 0,
          avg_loan_amount: 0,
        };
      }
      
      acc[branchId].loan_count += 1;
      acc[branchId].total_principal += loan.principal_amount || 0;
      acc[branchId].total_disbursed += loan.net_disbursed || 0;
      return acc;
    }, {});

    const result = Object.values(grouped).map(d => ({
      ...d,
      avg_loan_amount: d.loan_count > 0 ? d.total_principal / d.loan_count : 0,
    }));

    setDisbursementData(result);
  };

  const fetchCollectionReport = async () => {
    // Fetch interest payments within date range
    let query = supabase
      .from('interest_payments')
      .select(`
        id, amount_paid, branch_id, shown_interest,
        branch:branches(id, branch_code, branch_name)
      `)
      .eq('client_id', client!.id)
      .gte('payment_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('payment_date', format(dateTo, 'yyyy-MM-dd'));

    if (selectedBranch !== 'all') {
      query = query.eq('branch_id', selectedBranch);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by branch
    const grouped = (data || []).reduce((acc: Record<string, CollectionData>, payment: any) => {
      const branchId = payment.branch_id;
      const branchName = payment.branch?.branch_name || 'Unknown';
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branch_id: branchId,
          branch_name: branchName,
          expected_collections: 0,
          actual_collections: 0,
          efficiency_percentage: 0,
        };
      }
      
      acc[branchId].expected_collections += payment.shown_interest || 0;
      acc[branchId].actual_collections += payment.amount_paid || 0;
      return acc;
    }, {});

    const result = Object.values(grouped).map(d => ({
      ...d,
      efficiency_percentage: d.expected_collections > 0 
        ? (d.actual_collections / d.expected_collections) * 100 
        : 0,
    }));

    setCollectionData(result);
  };

  const fetchOverdueReport = async () => {
    const today = new Date();
    
    let query = supabase
      .from('loans')
      .select(`
        id, loan_number, principal_amount, actual_principal, maturity_date, loan_date,
        customer:customers(full_name),
        branch:branches(branch_name),
        scheme:schemes(shown_rate)
      `)
      .eq('client_id', client!.id)
      .in('status', ['active', 'overdue'])
      .lt('maturity_date', format(today, 'yyyy-MM-dd'));

    if (selectedBranch !== 'all') {
      query = query.eq('branch_id', selectedBranch);
    }

    const { data, error } = await query;
    if (error) throw error;

    const result = (data || []).map((loan: any) => {
      const daysOverdue = differenceInDays(today, new Date(loan.maturity_date));
      let agingBucket = '0-30 days';
      if (daysOverdue > 180) agingBucket = '180+ days';
      else if (daysOverdue > 90) agingBucket = '91-180 days';
      else if (daysOverdue > 60) agingBucket = '61-90 days';
      else if (daysOverdue > 30) agingBucket = '31-60 days';

      const principal = loan.actual_principal || loan.principal_amount;
      const rate = loan.scheme?.shown_rate || 18;
      const interestDue = (principal * rate * daysOverdue) / (365 * 100);

      return {
        loan_number: loan.loan_number,
        customer_name: loan.customer?.full_name || 'Unknown',
        branch_name: loan.branch?.branch_name || 'Unknown',
        principal,
        days_overdue: daysOverdue,
        aging_bucket: agingBucket,
        interest_due: interestDue,
      };
    });

    setOverdueData(result.sort((a, b) => b.days_overdue - a.days_overdue));
  };

  const fetchPortfolioReport = async () => {
    let query = supabase
      .from('loans')
      .select(`
        id, principal_amount, actual_principal, interest_rate, branch_id,
        branch:branches(id, branch_code, branch_name),
        gold_items(net_weight_grams)
      `)
      .eq('client_id', client!.id)
      .eq('status', 'active');

    if (selectedBranch !== 'all') {
      query = query.eq('branch_id', selectedBranch);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by branch
    const grouped = (data || []).reduce((acc: Record<string, PortfolioData & { totalRate: number }>, loan: any) => {
      const branchId = loan.branch_id;
      const branchName = loan.branch?.branch_name || 'Unknown';
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branch_id: branchId,
          branch_name: branchName,
          active_loans: 0,
          total_aum: 0,
          gold_weight_grams: 0,
          avg_interest_rate: 0,
          totalRate: 0,
        };
      }
      
      acc[branchId].active_loans += 1;
      acc[branchId].total_aum += loan.actual_principal || loan.principal_amount || 0;
      acc[branchId].totalRate += loan.interest_rate || 0;
      acc[branchId].gold_weight_grams += (loan.gold_items || []).reduce((sum: number, item: any) => 
        sum + (item.net_weight_grams || 0), 0);
      
      return acc;
    }, {});

    const result = Object.values(grouped).map(d => ({
      ...d,
      avg_interest_rate: d.active_loans > 0 ? d.totalRate / d.active_loans : 0,
    }));

    setPortfolioData(result);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = (type: 'csv' | 'excel') => {
    const fileName = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (activeTab) {
      case 'disbursement':
        const disbColumns = [
          { key: 'branch_name' as const, header: 'Branch' },
          { key: 'loan_count' as const, header: 'Loan Count' },
          { key: 'total_principal' as const, header: 'Total Principal', formatter: formatCurrencyForExport },
          { key: 'total_disbursed' as const, header: 'Total Disbursed', formatter: formatCurrencyForExport },
          { key: 'avg_loan_amount' as const, header: 'Avg Loan Amount', formatter: formatCurrencyForExport },
        ];
        type === 'csv' 
          ? exportToCSV(disbursementData, disbColumns, fileName)
          : exportToExcel(disbursementData, disbColumns, fileName, 'Disbursement Report');
        break;
        
      case 'collection':
        const collColumns = [
          { key: 'branch_name' as const, header: 'Branch' },
          { key: 'expected_collections' as const, header: 'Expected', formatter: formatCurrencyForExport },
          { key: 'actual_collections' as const, header: 'Collected', formatter: formatCurrencyForExport },
          { key: 'efficiency_percentage' as const, header: 'Efficiency %', formatter: (v: number) => `${v.toFixed(1)}%` },
        ];
        type === 'csv'
          ? exportToCSV(collectionData, collColumns, fileName)
          : exportToExcel(collectionData, collColumns, fileName, 'Collection Report');
        break;
        
      case 'overdue':
        const overdueColumns = [
          { key: 'loan_number' as const, header: 'Loan Number' },
          { key: 'customer_name' as const, header: 'Customer' },
          { key: 'branch_name' as const, header: 'Branch' },
          { key: 'principal' as const, header: 'Principal', formatter: formatCurrencyForExport },
          { key: 'days_overdue' as const, header: 'Days Overdue' },
          { key: 'aging_bucket' as const, header: 'Aging Bucket' },
          { key: 'interest_due' as const, header: 'Interest Due', formatter: formatCurrencyForExport },
        ];
        type === 'csv'
          ? exportToCSV(overdueData, overdueColumns, fileName)
          : exportToExcel(overdueData, overdueColumns, fileName, 'Overdue Report');
        break;
        
      case 'portfolio':
        const portColumns = [
          { key: 'branch_name' as const, header: 'Branch' },
          { key: 'active_loans' as const, header: 'Active Loans' },
          { key: 'total_aum' as const, header: 'Total AUM', formatter: formatCurrencyForExport },
          { key: 'gold_weight_grams' as const, header: 'Gold (grams)', formatter: (v: number) => v.toFixed(2) },
          { key: 'avg_interest_rate' as const, header: 'Avg Rate %', formatter: (v: number) => `${v.toFixed(2)}%` },
        ];
        type === 'csv'
          ? exportToCSV(portfolioData, portColumns, fileName)
          : exportToExcel(portfolioData, portColumns, fileName, 'Portfolio Report');
        break;
    }
    
    toast.success(`Report exported as ${type.toUpperCase()}`);
  };

  // Calculate totals for each report
  const disbursementTotals = useMemo(() => ({
    loans: disbursementData.reduce((s, d) => s + d.loan_count, 0),
    principal: disbursementData.reduce((s, d) => s + d.total_principal, 0),
    disbursed: disbursementData.reduce((s, d) => s + d.total_disbursed, 0),
  }), [disbursementData]);

  const collectionTotals = useMemo(() => ({
    expected: collectionData.reduce((s, d) => s + d.expected_collections, 0),
    actual: collectionData.reduce((s, d) => s + d.actual_collections, 0),
  }), [collectionData]);

  const overdueTotals = useMemo(() => ({
    count: overdueData.length,
    principal: overdueData.reduce((s, d) => s + d.principal, 0),
    interest: overdueData.reduce((s, d) => s + d.interest_due, 0),
  }), [overdueData]);

  const portfolioTotals = useMemo(() => ({
    loans: portfolioData.reduce((s, d) => s + d.active_loans, 0),
    aum: portfolioData.reduce((s, d) => s + d.total_aum, 0),
    gold: portfolioData.reduce((s, d) => s + d.gold_weight_grams, 0),
  }), [portfolioData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">MIS Reports</h1>
            <p className="text-muted-foreground">Business intelligence and performance reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => date && setDateFrom(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => date && setDateTo(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={fetchReportData} className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="disbursement" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Disbursement
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Aging
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          {/* Disbursement Report */}
          <TabsContent value="disbursement" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Loans</CardDescription>
                  <CardTitle className="text-2xl">{disbursementTotals.loans}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Principal</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(disbursementTotals.principal)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Disbursed</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(disbursementTotals.disbursed)}</CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Loans</TableHead>
                          <TableHead className="text-right">Total Principal</TableHead>
                          <TableHead className="text-right">Total Disbursed</TableHead>
                          <TableHead className="text-right">Avg Loan Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disbursementData.map((row) => (
                          <TableRow key={row.branch_id}>
                            <TableCell className="font-medium">{row.branch_name}</TableCell>
                            <TableCell className="text-right">{row.loan_count}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.total_principal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.total_disbursed)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.avg_loan_amount)}</TableCell>
                          </TableRow>
                        ))}
                        {disbursementData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No data for selected period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collection Report */}
          <TabsContent value="collection" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Expected Collections</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(collectionTotals.expected)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Actual Collections</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(collectionTotals.actual)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Overall Efficiency</CardDescription>
                  <CardTitle className="text-2xl">
                    {collectionTotals.expected > 0 
                      ? `${((collectionTotals.actual / collectionTotals.expected) * 100).toFixed(1)}%`
                      : '0%'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Expected</TableHead>
                          <TableHead className="text-right">Collected</TableHead>
                          <TableHead className="text-right">Efficiency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectionData.map((row) => (
                          <TableRow key={row.branch_id}>
                            <TableCell className="font-medium">{row.branch_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.expected_collections)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.actual_collections)}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={cn(
                                row.efficiency_percentage >= 90 
                                  ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                  : row.efficiency_percentage >= 70
                                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                  : 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                              )}>
                                {row.efficiency_percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {collectionData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No data for selected period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Report */}
          <TabsContent value="overdue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Overdue Loans</CardDescription>
                  <CardTitle className="text-2xl text-red-600 dark:text-red-400">{overdueTotals.count}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Outstanding Principal</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(overdueTotals.principal)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Interest Due</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(overdueTotals.interest)}</CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loan #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Principal</TableHead>
                          <TableHead className="text-right">Days Overdue</TableHead>
                          <TableHead>Aging</TableHead>
                          <TableHead className="text-right">Interest Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdueData.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{row.loan_number}</TableCell>
                            <TableCell>{row.customer_name}</TableCell>
                            <TableCell>{row.branch_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                            <TableCell className="text-right text-red-600 dark:text-red-400">{row.days_overdue}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                row.days_overdue > 90 
                                  ? 'border-red-500/50 text-red-600 dark:text-red-400' 
                                  : row.days_overdue > 60
                                  ? 'border-orange-500/50 text-orange-600 dark:text-orange-400'
                                  : 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                              )}>
                                {row.aging_bucket}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(row.interest_due)}</TableCell>
                          </TableRow>
                        ))}
                        {overdueData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No overdue loans found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Report */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Loans</CardDescription>
                  <CardTitle className="text-2xl">{portfolioTotals.loans}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total AUM</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(portfolioTotals.aum)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Gold in Custody</CardDescription>
                  <CardTitle className="text-2xl">{portfolioTotals.gold.toFixed(2)} g</CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Active Loans</TableHead>
                          <TableHead className="text-right">Total AUM</TableHead>
                          <TableHead className="text-right">Gold (grams)</TableHead>
                          <TableHead className="text-right">Avg Interest Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioData.map((row) => (
                          <TableRow key={row.branch_id}>
                            <TableCell className="font-medium">{row.branch_name}</TableCell>
                            <TableCell className="text-right">{row.active_loans}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.total_aum)}</TableCell>
                            <TableCell className="text-right">{row.gold_weight_grams.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{row.avg_interest_rate.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                        {portfolioData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No active loans found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}