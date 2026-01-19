import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  IndianRupee, Calendar, Clock, AlertTriangle, 
  Search, Receipt, Calculator, FileText,
  TrendingUp, Printer, Download
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { InterestReceiptPDF } from '@/components/print/documents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { toast } from 'sonner';
import { format, differenceInDays, addDays, isAfter, parseISO } from 'date-fns';
import {
  calculateDualRateInterest,
  processInterestPayment,
  formatIndianCurrency,
  type DualRateInterest,
  type PaymentAllocation,
} from '@/lib/interestCalculations';
import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { useSourceAccount } from '@/hooks/useSourceAccount';
import { generateInterestVoucher } from '@/hooks/useVoucherGeneration';

interface LoanWithDetails {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  shown_principal: number;
  actual_principal: number;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  status: string;
  next_interest_due_date: string | null;
  last_interest_paid_date: string | null;
  total_interest_paid: number;
  advance_interest_shown: number;
  advance_interest_actual: number;
  differential_capitalized: number;
  customer: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
  };
  scheme: {
    id: string;
    scheme_code: string;
    scheme_name: string;
    interest_rate: number;
    shown_rate: number;
    effective_rate: number;
    minimum_days: number;
    penalty_rate: number | null;
    grace_period_days: number | null;
  };
  branch_id: string;
}

interface InterestPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  payment_mode: string;
  receipt_number: string;
  amount_paid: number;
  shown_interest: number;
  actual_interest: number;
  differential_capitalized: number;
  principal_reduction: number;
  days_covered: number;
  period_from: string;
  period_to: string;
  overdue_days: number;
  penalty_amount: number;
  remarks: string | null;
  created_at: string;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
];

export default function Interest() {
  const { client, profile, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const { settings: printSettings } = useEffectivePrintSettings(currentBranch?.id);
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  
  // Collection dialog state
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [interestCalc, setInterestCalc] = useState<DualRateInterest | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentAllocation, setPaymentAllocation] = useState<PaymentAllocation | null>(null);
  
  // Source account tracking
  const sourceAccount = useSourceAccount();
  
  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<InterestPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Receipt dialog state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    loan: LoanWithDetails;
    payment: InterestPayment;
    allocation: PaymentAllocation;
  } | null>(null);

  const canCollect = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchLoans();
    }
  }, [client]);

  const fetchLoans = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days),
          scheme_version:scheme_versions(id, scheme_name:id, interest_rate, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days)
        `)
        .eq('client_id', client.id)
        .in('status', ['active', 'overdue'])
        .or('transaction_type.is.null,transaction_type.neq.sale_agreement')
        .order('loan_date', { ascending: false });

      if (error) throw error;
      
      // Process loans to use scheme_version data if available
      const processedLoans = (data || []).map(loan => {
        if (loan.scheme_version && loan.scheme_version_id) {
          // Use version data for scheme rates
          return {
            ...loan,
            scheme: {
              ...loan.scheme,
              interest_rate: loan.scheme_version.interest_rate ?? loan.scheme.interest_rate,
              shown_rate: loan.scheme_version.shown_rate ?? loan.scheme.shown_rate,
              effective_rate: loan.scheme_version.effective_rate ?? loan.scheme.effective_rate,
              minimum_days: loan.scheme_version.minimum_days ?? loan.scheme.minimum_days,
              penalty_rate: loan.scheme_version.penalty_rate ?? loan.scheme.penalty_rate,
              grace_period_days: loan.scheme_version.grace_period_days ?? loan.scheme.grace_period_days,
            }
          };
        }
        return loan;
      });
      
      setLoans(processedLoans || []);
    } catch (error: any) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  // Calculate interest status for each loan
  const loansWithStatus = useMemo(() => {
    const today = new Date();
    
    return loans.map(loan => {
      const lastPaidDate = loan.last_interest_paid_date 
        ? parseISO(loan.last_interest_paid_date) 
        : parseISO(loan.loan_date);
      
      const daysSincePayment = differenceInDays(today, lastPaidDate);
      const gracePeriod = loan.scheme.grace_period_days || 7;
      const dueDate = addDays(lastPaidDate, 30);
      const overdueDate = addDays(dueDate, gracePeriod);
      
      let interestStatus: 'paid' | 'due' | 'upcoming' | 'overdue' = 'upcoming';
      let daysUntilDue = differenceInDays(dueDate, today);
      
      if (daysSincePayment <= 7) {
        interestStatus = 'paid';
      } else if (isAfter(today, overdueDate)) {
        interestStatus = 'overdue';
      } else if (isAfter(today, dueDate) || daysUntilDue <= 0) {
        interestStatus = 'due';
      } else if (daysUntilDue <= 7) {
        interestStatus = 'upcoming';
      }

      const scheme = {
        id: loan.scheme.id,
        scheme_name: loan.scheme.scheme_name,
        shown_rate: loan.scheme.shown_rate || 18,
        effective_rate: loan.scheme.effective_rate || loan.scheme.interest_rate * 12,
        minimum_days: loan.scheme.minimum_days || 30,
        penalty_rate: loan.scheme.penalty_rate || 2,
        grace_period_days: loan.scheme.grace_period_days || 7,
        advance_interest_months: 1, // Default 1 month = 30 days advance interest
      };

      // Calculate advance interest days from scheme (default 30 days = 1 month)
      const advanceInterestDays = scheme.advance_interest_months * 30;

      const interestDue = calculateDualRateInterest(
        loan.actual_principal || loan.principal_amount,
        scheme,
        daysSincePayment,
        gracePeriod,
        advanceInterestDays  // Exclude advance interest period from billing
      );

      return {
        ...loan,
        interestStatus,
        daysSincePayment,
        dueDate: format(dueDate, 'dd MMM yyyy'),
        interestDue,
      };
    });
  }, [loans]);

  // Filter loans based on tab
  const filteredLoans = useMemo(() => {
    let filtered = loansWithStatus;
    
    if (filterTab === 'due') {
      filtered = filtered.filter(l => l.interestStatus === 'due' || l.interestStatus === 'overdue');
    } else if (filterTab === 'overdue') {
      filtered = filtered.filter(l => l.interestStatus === 'overdue');
    } else if (filterTab === 'upcoming') {
      filtered = filtered.filter(l => l.interestStatus === 'upcoming');
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.loan_number.toLowerCase().includes(query) ||
        l.customer.full_name.toLowerCase().includes(query) ||
        l.customer.customer_code.toLowerCase().includes(query) ||
        l.customer.phone.includes(query)
      );
    }
    
    return filtered;
  }, [loansWithStatus, filterTab, searchQuery]);

  // Dashboard stats
  const stats = useMemo(() => {
    const due = loansWithStatus.filter(l => l.interestStatus === 'due');
    const overdue = loansWithStatus.filter(l => l.interestStatus === 'overdue');
    const upcoming = loansWithStatus.filter(l => l.interestStatus === 'upcoming');
    
    const totalDueAmount = [...due, ...overdue].reduce((sum, l) => sum + l.interestDue.totalDue, 0);
    const overdueAmount = overdue.reduce((sum, l) => sum + l.interestDue.totalDue, 0);
    
    return {
      dueCount: due.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      totalDueAmount,
      overdueAmount,
    };
  }, [loansWithStatus]);

  const openCollectionDialog = (loan: typeof loansWithStatus[0]) => {
    setSelectedLoan(loan);
    setInterestCalc(loan.interestDue);
    setPaymentAmount(loan.interestDue.totalDue.toString());
    setPaymentMode('cash');
    setRemarks('');
    setPaymentAllocation(null);
    sourceAccount.resetSourceAccount();
    setCollectionDialogOpen(true);
  };

  // Update allocation when payment amount changes
  useEffect(() => {
    if (selectedLoan && interestCalc && paymentAmount) {
      const amount = parseFloat(paymentAmount) || 0;
      const allocation = processInterestPayment(
        amount,
        interestCalc,
        selectedLoan.actual_principal || selectedLoan.principal_amount
      );
      setPaymentAllocation(allocation);
    }
  }, [paymentAmount, selectedLoan, interestCalc]);

  const handleCollectInterest = async () => {
    if (!selectedLoan || !interestCalc || !paymentAllocation || !client || !profile) return;
    
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      // Generate receipt number
      const receiptCount = await supabase
        .from('interest_payments')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);
      
      const receiptNumber = `RCP${format(new Date(), 'yyMMdd')}${String((receiptCount.count || 0) + 1).padStart(5, '0')}`;
      
      const lastPaidDate = selectedLoan.last_interest_paid_date || selectedLoan.loan_date;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get source account data
      const sourceData = sourceAccount.getSourceAccountData(paymentMode);

      // Insert payment record
      const paymentData = {
        loan_id: selectedLoan.id,
        client_id: client.id,
        branch_id: selectedLoan.branch_id,
        payment_date: today,
        payment_mode: paymentMode,
        receipt_number: receiptNumber,
        amount_paid: amount,
        shown_interest: paymentAllocation.interestPaid,
        actual_interest: interestCalc.actualInterest,
        differential_capitalized: 0, // No longer capitalizing, it's paid as part payment
        principal_reduction: paymentAllocation.totalPrincipalReduction,
        days_covered: interestCalc.days,
        period_from: lastPaidDate,
        period_to: today,
        overdue_days: Math.max(0, interestCalc.days - 30),
        penalty_amount: paymentAllocation.penalty,
        collected_by: profile.id,
        remarks: remarks || null,
        source_type: sourceData.source_type,
        source_bank_id: sourceData.source_bank_id,
        source_account_id: sourceData.source_account_id,
      };

      const { data: paymentResult, error: paymentError } = await supabase
        .from('interest_payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update loan record
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          actual_principal: paymentAllocation.newActualPrincipal,
          last_interest_paid_date: today,
          next_interest_due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          total_interest_paid: (selectedLoan.total_interest_paid || 0) + amount,
        })
        .eq('id', selectedLoan.id);

      if (loanError) throw loanError;

      // Generate accounting voucher
      await generateInterestVoucher({
        clientId: client.id,
        branchId: selectedLoan.branch_id,
        paymentId: paymentResult.id,
        loanNumber: selectedLoan.loan_number,
        amountPaid: amount,
        interestAmount: paymentAllocation.interestPaid,
        penaltyAmount: paymentAllocation.penalty,
        principalReduction: paymentAllocation.totalPrincipalReduction,
        paymentMode: paymentMode,
      });

      toast.success(`Payment collected. Receipt: ${receiptNumber}`);
      
      // Show receipt
      setReceiptData({
        loan: selectedLoan,
        payment: paymentResult,
        allocation: paymentAllocation,
      });
      setCollectionDialogOpen(false);
      setReceiptDialogOpen(true);
      
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPaymentHistory = async (loanId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('interest_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch payment history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryDialog = (loan: LoanWithDetails) => {
    setSelectedLoan(loan);
    fetchPaymentHistory(loan.id);
    setHistoryDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20">Paid</Badge>;
      case 'due':
        return <Badge className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20">Due</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20">Overdue</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Interest Servicing</h1>
            <p className="text-muted-foreground">Track dues, collect interest payments & generate receipts</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interest Due</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.dueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatIndianCurrency(stats.totalDueAmount)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatIndianCurrency(stats.overdueAmount)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming (7 days)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcomingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-green-600">{loans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by loan number, customer name, code or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={filterTab} onValueChange={setFilterTab} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({loansWithStatus.length})</TabsTrigger>
                  <TabsTrigger value="due" className="text-amber-600">Due ({stats.dueCount})</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-red-600">Overdue ({stats.overdueCount})</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-blue-600">Upcoming ({stats.upcomingCount})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No loans found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchQuery ? 'No loans match your search criteria' : 'No active loans to service'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <ResponsiveTable minWidth="1000px">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest Due</TableHead>
                        <TableHead className="text-right">Part Payment</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan) => (
                        <TableRow key={loan.id} className={loan.interestStatus === 'overdue' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{loan.loan_number}</p>
                              <p className="text-xs text-muted-foreground">{loan.scheme.scheme_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{loan.customer.full_name}</p>
                              <p className="text-xs text-muted-foreground">{loan.customer.customer_code}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-medium">{formatIndianCurrency(loan.actual_principal || loan.principal_amount)}</p>
                            <p className="text-xs text-muted-foreground">@{loan.scheme.shown_rate}% p.a.</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-bold text-green-600">{formatIndianCurrency(loan.interestDue.shownInterest)}</p>
                            <p className="text-xs text-muted-foreground">{loan.daysSincePayment} days</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-bold text-amber-600">{formatIndianCurrency(loan.interestDue.differential)}</p>
                            <p className="text-xs text-muted-foreground">Principal reduction</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{loan.dueDate}</p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(loan.interestStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openHistoryDialog(loan)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {canCollect && (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                  onClick={() => openCollectionDialog(loan)}
                                >
                                  <IndianRupee className="h-4 w-4 mr-1" />
                                  Collect
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Collection Dialog */}
        <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-600" />
                Collect Interest Payment
              </DialogTitle>
            </DialogHeader>

            {selectedLoan && interestCalc && (
              <div className="space-y-6">
                {/* Loan Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Number</p>
                    <p className="font-semibold">{selectedLoan.loan_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedLoan.customer.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Principal</p>
                    <p className="font-semibold">{formatIndianCurrency(selectedLoan.actual_principal || selectedLoan.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate (Shown)</p>
                    <p className="font-semibold">{selectedLoan.scheme.shown_rate}% p.a.</p>
                  </div>
                </div>

                {/* Interest Calculation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Amount Due Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days Since Last Payment</span>
                      <span className="font-medium">{interestCalc.days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest @ {selectedLoan.scheme.shown_rate}% p.a.</span>
                      <span className="font-medium text-green-600">{formatIndianCurrency(interestCalc.shownInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part Payment (Principal Reduction)</span>
                      <span className="font-medium text-amber-600">{formatIndianCurrency(interestCalc.differential)}</span>
                    </div>
                    {interestCalc.penalty > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Penalty (Overdue)</span>
                        <span className="font-medium">{formatIndianCurrency(interestCalc.penalty)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Due</span>
                      <span className="text-primary">{formatIndianCurrency(interestCalc.totalDue)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Entry */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Amount *</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Source Account Selector */}
                {client && (
                  <SourceAccountSelector
                    clientId={client.id}
                    paymentMode={paymentMode}
                    sourceType={sourceAccount.sourceType}
                    setSourceType={sourceAccount.setSourceType}
                    sourceBankId={sourceAccount.sourceBankId}
                    setSourceBankId={sourceAccount.setSourceBankId}
                    sourceAccountId={sourceAccount.sourceAccountId}
                    setSourceAccountId={sourceAccount.setSourceAccountId}
                    selectedLoyaltyId={sourceAccount.selectedLoyaltyId}
                    setSelectedLoyaltyId={sourceAccount.setSelectedLoyaltyId}
                  />
                )}

                {/* Payment Allocation Preview */}
                {paymentAllocation && (
                  <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700 dark:text-green-400">Payment Allocation (Receipt)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {paymentAllocation.penalty > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Penalty</span>
                          <span>{formatIndianCurrency(paymentAllocation.penalty)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Interest @ {selectedLoan.scheme.shown_rate}%</span>
                        <span>{formatIndianCurrency(paymentAllocation.interestPaid)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Part Payment (Principal Reduction)</span>
                        <span>{formatIndianCurrency(paymentAllocation.partPayment)}</span>
                      </div>
                      {paymentAllocation.excessPaid > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Additional Principal Reduction</span>
                          <span>{formatIndianCurrency(paymentAllocation.excessPaid)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Paid</span>
                        <span>{formatIndianCurrency(parseFloat(paymentAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>New Outstanding Principal</span>
                        <span>{formatIndianCurrency(paymentAllocation.newActualPrincipal)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Remarks (Optional)</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any notes about this payment..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCollectInterest}
                    disabled={submitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {submitting ? 'Processing...' : 'Collect Payment'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History - {selectedLoan?.loan_number}
              </DialogTitle>
            </DialogHeader>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment history found
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Part Payment</TableHead>
                      <TableHead className="text-right">Penalty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.receipt_number}</TableCell>
                        <TableCell>{format(parseISO(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="capitalize">{payment.payment_mode}</TableCell>
                        <TableCell className="text-right">{formatIndianCurrency(payment.shown_interest)}</TableCell>
                        <TableCell className="text-right text-amber-600">{formatIndianCurrency(payment.principal_reduction)}</TableCell>
                        <TableCell className="text-right">{formatIndianCurrency(payment.penalty_amount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatIndianCurrency(payment.amount_paid)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                Payment Receipt
              </DialogTitle>
            </DialogHeader>

            {receiptData && (
              <div className="space-y-4 print:p-4" id="receipt-content">
                <div className="text-center border-b pb-4">
                  <h2 className="text-lg font-bold">INTEREST PAYMENT RECEIPT</h2>
                  <p className="text-sm text-muted-foreground">{receiptData.payment.receipt_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(parseISO(receiptData.payment.payment_date), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Mode</p>
                    <p className="font-medium capitalize">{receiptData.payment.payment_mode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Loan Number</p>
                    <p className="font-medium">{receiptData.loan.loan_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{receiptData.loan.customer.full_name}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Interest Period</span>
                    <span>{receiptData.payment.days_covered} days</span>
                  </div>
                  {receiptData.allocation.penalty > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Penalty</span>
                      <span>{formatIndianCurrency(receiptData.allocation.penalty)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Interest @ {receiptData.loan.scheme.shown_rate}% p.a.</span>
                    <span>{formatIndianCurrency(receiptData.allocation.interestPaid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Part Payment (Principal Reduction)</span>
                    <span>{formatIndianCurrency(receiptData.allocation.partPayment)}</span>
                  </div>
                  {receiptData.allocation.excessPaid > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Additional Principal Reduction</span>
                      <span>{formatIndianCurrency(receiptData.allocation.excessPaid)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span className="text-green-600">{formatIndianCurrency(receiptData.payment.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>New Outstanding</span>
                    <span>{formatIndianCurrency(receiptData.allocation.newActualPrincipal)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 print:hidden">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      if (!receiptData || !client) return;
                      const blob = await pdf(
                        <InterestReceiptPDF
                          payment={{
                            receipt_number: receiptData.payment.receipt_number,
                            payment_date: receiptData.payment.payment_date,
                            payment_mode: receiptData.payment.payment_mode,
                            amount_paid: receiptData.payment.amount_paid,
                            days_covered: receiptData.payment.days_covered,
                            period_from: receiptData.payment.period_from,
                            period_to: receiptData.payment.period_to,
                          }}
                          loan={{
                            loan_number: receiptData.loan.loan_number,
                            principal_amount: receiptData.loan.principal_amount,
                            interest_rate: receiptData.loan.scheme.shown_rate,
                          }}
                          customer={{
                            full_name: receiptData.loan.customer.full_name,
                            customer_code: receiptData.loan.customer.customer_code,
                            phone: receiptData.loan.customer.phone,
                          }}
                          breakdown={{
                            shownInterest: receiptData.allocation.interestPaid,
                            penalty: receiptData.allocation.penalty,
                            partPayment: receiptData.allocation.partPayment,
                            principalReduction: receiptData.allocation.totalPrincipalReduction,
                            newOutstanding: receiptData.allocation.newActualPrincipal,
                          }}
                          companyName={client.company_name}
                          branchName={currentBranch?.branch_name}
                          language={printSettings.language}
                          paperSize={printSettings.paper_size}
                          footerEnglish={printSettings.footer_english}
                          footerTamil={printSettings.footer_tamil}
                          sloganEnglish={printSettings.company_slogan_english}
                          sloganTamil={printSettings.company_slogan_tamil}
                          logoUrl={printSettings.logo_url}
                        />
                      ).toBlob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `interest-receipt-${receiptData.payment.receipt_number}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}