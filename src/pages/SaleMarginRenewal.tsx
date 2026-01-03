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

interface AgreementWithDetails {
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

interface MarginPayment {
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

export default function SaleMarginRenewal() {
  const { client, profile, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const { settings: printSettings } = useEffectivePrintSettings(currentBranch?.id);
  const [agreements, setAgreements] = useState<AgreementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  
  // Collection dialog state
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementWithDetails | null>(null);
  const [marginCalc, setMarginCalc] = useState<DualRateInterest | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentAllocation, setPaymentAllocation] = useState<PaymentAllocation | null>(null);
  
  // Source account tracking
  const sourceAccount = useSourceAccount();
  
  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<MarginPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Receipt dialog state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    loan: AgreementWithDetails;
    payment: MarginPayment;
    allocation: PaymentAllocation;
  } | null>(null);

  const canCollect = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchAgreements();
    }
  }, [client]);

  const fetchAgreements = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days)
        `)
        .eq('client_id', client.id)
        .eq('transaction_type', 'sale_agreement')
        .in('status', ['active', 'overdue'])
        .order('loan_date', { ascending: false });

      if (error) throw error;
      setAgreements(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch sale agreements');
    } finally {
      setLoading(false);
    }
  };

  // Calculate margin status for each agreement
  const agreementsWithStatus = useMemo(() => {
    const today = new Date();
    
    return agreements.map(agreement => {
      const lastPaidDate = agreement.last_interest_paid_date 
        ? parseISO(agreement.last_interest_paid_date) 
        : parseISO(agreement.loan_date);
      
      const daysSincePayment = differenceInDays(today, lastPaidDate);
      const gracePeriod = agreement.scheme.grace_period_days || 7;
      const dueDate = addDays(lastPaidDate, 30);
      const overdueDate = addDays(dueDate, gracePeriod);
      
      let marginStatus: 'paid' | 'due' | 'upcoming' | 'overdue' = 'upcoming';
      let daysUntilDue = differenceInDays(dueDate, today);
      
      if (daysSincePayment <= 7) {
        marginStatus = 'paid';
      } else if (isAfter(today, overdueDate)) {
        marginStatus = 'overdue';
      } else if (isAfter(today, dueDate) || daysUntilDue <= 0) {
        marginStatus = 'due';
      } else if (daysUntilDue <= 7) {
        marginStatus = 'upcoming';
      }

      const scheme = {
        id: agreement.scheme.id,
        scheme_name: agreement.scheme.scheme_name,
        shown_rate: agreement.scheme.shown_rate || 18,
        effective_rate: agreement.scheme.effective_rate || agreement.scheme.interest_rate * 12,
        minimum_days: agreement.scheme.minimum_days || 30,
        penalty_rate: agreement.scheme.penalty_rate || 2,
        grace_period_days: agreement.scheme.grace_period_days || 7,
        advance_interest_months: 3,
      };

      const marginDue = calculateDualRateInterest(
        agreement.actual_principal || agreement.principal_amount,
        scheme,
        daysSincePayment,
        gracePeriod
      );

      return {
        ...agreement,
        marginStatus,
        daysSincePayment,
        dueDate: format(dueDate, 'dd MMM yyyy'),
        marginDue,
      };
    });
  }, [agreements]);

  // Filter agreements based on tab
  const filteredAgreements = useMemo(() => {
    let filtered = agreementsWithStatus;
    
    if (filterTab === 'due') {
      filtered = filtered.filter(a => a.marginStatus === 'due' || a.marginStatus === 'overdue');
    } else if (filterTab === 'overdue') {
      filtered = filtered.filter(a => a.marginStatus === 'overdue');
    } else if (filterTab === 'upcoming') {
      filtered = filtered.filter(a => a.marginStatus === 'upcoming');
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.loan_number.toLowerCase().includes(query) ||
        a.customer.full_name.toLowerCase().includes(query) ||
        a.customer.customer_code.toLowerCase().includes(query) ||
        a.customer.phone.includes(query)
      );
    }
    
    return filtered;
  }, [agreementsWithStatus, filterTab, searchQuery]);

  // Dashboard stats
  const stats = useMemo(() => {
    const due = agreementsWithStatus.filter(a => a.marginStatus === 'due');
    const overdue = agreementsWithStatus.filter(a => a.marginStatus === 'overdue');
    const upcoming = agreementsWithStatus.filter(a => a.marginStatus === 'upcoming');
    
    const totalDueAmount = [...due, ...overdue].reduce((sum, a) => sum + a.marginDue.totalDue, 0);
    const overdueAmount = overdue.reduce((sum, a) => sum + a.marginDue.totalDue, 0);
    
    return {
      dueCount: due.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      totalDueAmount,
      overdueAmount,
    };
  }, [agreementsWithStatus]);

  const openCollectionDialog = (agreement: typeof agreementsWithStatus[0]) => {
    setSelectedAgreement(agreement);
    setMarginCalc(agreement.marginDue);
    setPaymentAmount(agreement.marginDue.totalDue.toString());
    setPaymentMode('cash');
    setRemarks('');
    setPaymentAllocation(null);
    sourceAccount.resetSourceAccount();
    setCollectionDialogOpen(true);
  };

  // Update allocation when payment amount changes
  useEffect(() => {
    if (selectedAgreement && marginCalc && paymentAmount) {
      const amount = parseFloat(paymentAmount) || 0;
      const allocation = processInterestPayment(
        amount,
        marginCalc,
        selectedAgreement.actual_principal || selectedAgreement.principal_amount
      );
      setPaymentAllocation(allocation);
    }
  }, [paymentAmount, selectedAgreement, marginCalc]);

  const handleCollectMargin = async () => {
    if (!selectedAgreement || !marginCalc || !paymentAllocation || !client || !profile) return;
    
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
      
      const receiptNumber = `MRG${format(new Date(), 'yyMMdd')}${String((receiptCount.count || 0) + 1).padStart(5, '0')}`;
      
      const lastPaidDate = selectedAgreement.last_interest_paid_date || selectedAgreement.loan_date;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get source account data
      const sourceData = sourceAccount.getSourceAccountData(paymentMode);

      // Insert payment record
      const paymentData = {
        loan_id: selectedAgreement.id,
        client_id: client.id,
        branch_id: selectedAgreement.branch_id,
        payment_date: today,
        payment_mode: paymentMode,
        receipt_number: receiptNumber,
        amount_paid: amount,
        shown_interest: paymentAllocation.interestPaid,
        actual_interest: marginCalc.actualInterest,
        differential_capitalized: 0,
        principal_reduction: paymentAllocation.totalPrincipalReduction,
        days_covered: marginCalc.days,
        period_from: lastPaidDate,
        period_to: today,
        overdue_days: Math.max(0, marginCalc.days - 30),
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

      // Update agreement record
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          actual_principal: paymentAllocation.newActualPrincipal,
          last_interest_paid_date: today,
          next_interest_due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          total_interest_paid: (selectedAgreement.total_interest_paid || 0) + amount,
        })
        .eq('id', selectedAgreement.id);

      if (updateError) throw updateError;

      // Generate accounting voucher
      await generateInterestVoucher({
        clientId: client.id,
        branchId: selectedAgreement.branch_id,
        paymentId: paymentResult.id,
        loanNumber: selectedAgreement.loan_number,
        amountPaid: amount,
        interestAmount: paymentAllocation.interestPaid,
        penaltyAmount: paymentAllocation.penalty,
        principalReduction: paymentAllocation.totalPrincipalReduction,
        paymentMode: paymentMode,
      });

      toast.success(`Margin payment collected. Receipt: ${receiptNumber}`);
      
      // Show receipt
      setReceiptData({
        loan: selectedAgreement,
        payment: paymentResult,
        allocation: paymentAllocation,
      });
      setCollectionDialogOpen(false);
      setReceiptDialogOpen(true);
      
      fetchAgreements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPaymentHistory = async (agreementId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('interest_payments')
        .select('*')
        .eq('loan_id', agreementId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch payment history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryDialog = (agreement: AgreementWithDetails) => {
    setSelectedAgreement(agreement);
    fetchPaymentHistory(agreement.id);
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
            <h1 className="text-2xl font-bold">Margin Renewal</h1>
            <p className="text-muted-foreground">Collect margin payments for sale agreements & extend option periods</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Margin Due</p>
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
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcomingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due in 7 days</p>
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
                  <p className="text-sm text-muted-foreground">Active Agreements</p>
                  <p className="text-2xl font-bold text-green-600">{agreements.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total open</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({agreementsWithStatus.length})</TabsTrigger>
                  <TabsTrigger value="due" className="text-amber-600">Due ({stats.dueCount})</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-red-600">Overdue ({stats.overdueCount})</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-blue-600">Upcoming ({stats.upcomingCount})</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agreement, seller..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreements Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredAgreements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No sale agreements found</div>
            ) : (
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agreement #</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Purchase Amount</TableHead>
                      <TableHead>Days Open</TableHead>
                      <TableHead>Margin Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.map((agreement) => (
                      <TableRow key={agreement.id}>
                        <TableCell className="font-medium">{agreement.loan_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{agreement.customer.full_name}</p>
                            <p className="text-xs text-muted-foreground">{agreement.customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatIndianCurrency(agreement.principal_amount)}</TableCell>
                        <TableCell>{agreement.daysSincePayment} days</TableCell>
                        <TableCell className="font-medium">{formatIndianCurrency(agreement.marginDue.totalDue)}</TableCell>
                        <TableCell>{getStatusBadge(agreement.marginStatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openHistoryDialog(agreement)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              History
                            </Button>
                            {canCollect && (
                              <Button
                                size="sm"
                                onClick={() => openCollectionDialog(agreement)}
                              >
                                <Receipt className="h-4 w-4 mr-1" />
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
            )}
          </CardContent>
        </Card>

        {/* Collection Dialog */}
        <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Collect Margin Payment</DialogTitle>
            </DialogHeader>
            
            {selectedAgreement && marginCalc && (
              <div className="space-y-6">
                {/* Agreement Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Agreement</p>
                    <p className="font-medium">{selectedAgreement.loan_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <p className="font-medium">{selectedAgreement.customer.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Amount</p>
                    <p className="font-medium">{formatIndianCurrency(selectedAgreement.actual_principal || selectedAgreement.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days Since Last Payment</p>
                    <p className="font-medium">{marginCalc.days} days</p>
                  </div>
                </div>

                {/* Margin Breakdown */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-medium">Margin Calculation</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">Trade Margin (Shown):</p>
                    <p className="text-right">{formatIndianCurrency(marginCalc.shownInterest)}</p>
                    <p className="text-muted-foreground">Actual Margin:</p>
                    <p className="text-right">{formatIndianCurrency(marginCalc.actualInterest)}</p>
                    {marginCalc.penalty > 0 && (
                      <>
                        <p className="text-muted-foreground text-red-600">Penalty:</p>
                        <p className="text-right text-red-600">{formatIndianCurrency(marginCalc.penalty)}</p>
                      </>
                    )}
                    <Separator className="col-span-2" />
                    <p className="font-medium">Total Due:</p>
                    <p className="text-right font-bold">{formatIndianCurrency(marginCalc.totalDue)}</p>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Amount</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_MODES.map(mode => (
                            <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {paymentMode !== 'cash' && client && (
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

                  {paymentAllocation && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                      <h5 className="font-medium text-green-700 mb-2">Payment Allocation</h5>
                      <div className="space-y-1">
                        <p>Trade Margin: {formatIndianCurrency(paymentAllocation.interestPaid)}</p>
                        {paymentAllocation.penalty > 0 && <p>Penalty: {formatIndianCurrency(paymentAllocation.penalty)}</p>}
                        {paymentAllocation.totalPrincipalReduction > 0 && (
                          <p className="text-green-700">Surplus reduces purchase amount by: {formatIndianCurrency(paymentAllocation.totalPrincipalReduction)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Any notes..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCollectMargin} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Collect Payment'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment History - {selectedAgreement?.loan_number}</DialogTitle>
            </DialogHeader>
            
            {historyLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payment history</div>
            ) : (
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Days Covered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                        <TableCell>{format(parseISO(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{formatIndianCurrency(payment.amount_paid)}</TableCell>
                        <TableCell className="capitalize">{payment.payment_mode}</TableCell>
                        <TableCell>{payment.days_covered} days</TableCell>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            {receiptData && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <p className="text-lg font-semibold text-green-700">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground mt-1">Receipt: {receiptData.payment.receipt_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">Agreement:</p>
                  <p className="font-medium">{receiptData.loan.loan_number}</p>
                  <p className="text-muted-foreground">Seller:</p>
                  <p className="font-medium">{receiptData.loan.customer.full_name}</p>
                  <p className="text-muted-foreground">Amount Paid:</p>
                  <p className="font-medium">{formatIndianCurrency(receiptData.payment.amount_paid)}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>Close</Button>
                  <Button onClick={async () => {
                    // TODO: Print receipt
                    toast.info('Receipt printing coming soon');
                  }}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
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
