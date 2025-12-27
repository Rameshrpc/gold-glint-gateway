import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Wallet, Calculator, IndianRupee, 
  Package, CheckCircle, AlertTriangle, FileText,
  Coins, Printer, Download, Plus, Trash2, Clock
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { RedemptionReceiptPDF } from '@/components/print/documents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow';
import { ApprovalBadge } from '@/components/approvals';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  calculateRedemptionAmount,
  formatIndianCurrency,
  calculateRebateAtRedemption,
} from '@/lib/interestCalculations';

import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { checkRepledgeStatus, showRepledgeWarning } from '@/hooks/useRepledgeCheck';
import { generateRedemptionVoucher } from '@/hooks/useVoucherGeneration';

interface LoanWithDetails {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  shown_principal: number;
  actual_principal: number;
  differential_capitalized: number | null;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  status: string;
  last_interest_paid_date: string | null;
  total_interest_paid: number;
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

interface GoldItem {
  id: string;
  item_type: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface Redemption {
  id: string;
  redemption_number: string;
  redemption_date: string;
  outstanding_principal: number;
  interest_due: number;
  penalty_amount: number;
  rebate_amount: number;
  total_settlement: number;
  amount_received: number;
  payment_mode: string;
  gold_released: boolean;
  approval_status: string | null;
  loan: {
    loan_number: string;
    customer: {
      full_name: string;
      customer_code: string;
    };
  };
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cheque', label: 'Cheque' },
];

interface PaymentEntry {
  id: string;
  mode: string;
  amount: string;
  reference: string;
  sourceType: 'cash' | 'company' | 'employee';
  sourceBankId: string;
  sourceAccountId: string;
  selectedLoyaltyId: string;
}

const createEmptyPaymentEntry = (initialAmount: string = ''): PaymentEntry => ({
  id: crypto.randomUUID(),
  mode: 'cash',
  amount: initialAmount,
  reference: '',
  sourceType: 'cash',
  sourceBankId: '',
  sourceAccountId: '',
  selectedLoyaltyId: '',
});

export default function Redemption() {
  const { client, profile, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const { settings: printSettings } = useEffectivePrintSettings(currentBranch?.id);
  const { checkApprovalRequired, canAutoApprove, submitForApproval } = useApprovalWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LoanWithDetails[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected loan for redemption
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  
  // Payment entries (multiple payment modes)
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([createEmptyPaymentEntry()]);
  const [remarks, setRemarks] = useState('');
  
  // Verification
  const [identityVerified, setIdentityVerified] = useState(false);
  const [goldReleased, setGoldReleased] = useState(false);
  const [releasedTo, setReleasedTo] = useState('');
  
  // Processing
  const [submitting, setSubmitting] = useState(false);
  
  // Recent redemptions
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);

  const canProcessRedemption = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchRecentRedemptions();
    }
  }, [client]);

  const fetchRecentRedemptions = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch loan details separately
      const redemptionsWithLoans = await Promise.all((data || []).map(async (red) => {
        const { data: loanData } = await supabase
          .from('loans')
          .select('loan_number, customer:customers(full_name, customer_code)')
          .eq('id', red.loan_id)
          .single();
        return {
          ...red,
          loan: loanData as { loan_number: string; customer: { full_name: string; customer_code: string; } } | null,
        };
      }));
      
      setRecentRedemptions(redemptionsWithLoans as any);
    } catch (error: any) {
      console.error('Failed to fetch redemptions:', error);
    }
  };

  const handleSearch = async () => {
    if (!client) return;
    
    const query = searchQuery.trim();
    if (query.length < 4) {
      toast.error('Please enter at least 4 characters to search');
      return;
    }
    
    setSearching(true);
    try {
      // First, search customers by name/phone to get matching customer IDs
      const { data: matchingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('client_id', client.id)
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);

      const customerIds = matchingCustomers?.map(c => c.id) || [];

      // Build loans query
      let loansQuery = supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days)
        `)
        .eq('client_id', client.id)
        .eq('status', 'active');

      // Search by loan_number OR by matching customer IDs
      if (customerIds.length > 0) {
        loansQuery = loansQuery.or(`loan_number.ilike.%${query}%,customer_id.in.(${customerIds.join(',')})`);
      } else {
        loansQuery = loansQuery.ilike('loan_number', `%${query}%`);
      }

      const { data, error } = await loansQuery.limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectLoan = async (loan: LoanWithDetails) => {
    // Check if loan is repledged
    const repledgeStatus = await checkRepledgeStatus(loan.id);
    if (repledgeStatus.isRepledged) {
      showRepledgeWarning(repledgeStatus);
      return;
    }
    
    setSelectedLoan(loan);
    setSearchResults([]);
    setSearchQuery('');
    setReleasedTo(loan.customer.full_name);
    
    // Fetch gold items
    const { data } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', loan.id);
    setGoldItems(data || []);
  };

  // Calculate redemption amount
  const redemptionCalc = useMemo(() => {
    if (!selectedLoan) return null;

    const scheme = {
      id: selectedLoan.scheme.id,
      scheme_name: selectedLoan.scheme.scheme_name,
      shown_rate: selectedLoan.scheme.shown_rate || 18,
      effective_rate: selectedLoan.scheme.effective_rate || selectedLoan.scheme.interest_rate * 12,
      minimum_days: selectedLoan.scheme.minimum_days || 30,
      advance_interest_months: 3,
      penalty_rate: selectedLoan.scheme.penalty_rate || 2,
      grace_period_days: selectedLoan.scheme.grace_period_days || 7,
    };

    const lastPaidDate = selectedLoan.last_interest_paid_date || selectedLoan.loan_date;
    const daysSincePayment = differenceInDays(new Date(), parseISO(lastPaidDate));
    
    // Use new slab-based rebate calculation with differential_capitalized
    const differentialCapitalized = selectedLoan.differential_capitalized || 0;

    return calculateRedemptionAmount(
      selectedLoan.actual_principal || selectedLoan.principal_amount,
      scheme,
      daysSincePayment,
      selectedLoan.tenure_days,
      differentialCapitalized
    );
  }, [selectedLoan]);

  // Calculate total collected from payment entries
  const totalCollected = useMemo(() => {
    return paymentEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  }, [paymentEntries]);

  // Check if payment is matched to settlement
  const isPaymentMatched = useMemo(() => {
    if (!redemptionCalc) return false;
    return Math.abs(totalCollected - redemptionCalc.breakdown.total) < 0.01;
  }, [totalCollected, redemptionCalc]);

  const paymentDifference = useMemo(() => {
    if (!redemptionCalc) return 0;
    return totalCollected - redemptionCalc.breakdown.total;
  }, [totalCollected, redemptionCalc]);

  // Payment entry handlers
  const updatePaymentEntry = useCallback((id: string, field: keyof PaymentEntry, value: string) => {
    setPaymentEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  }, []);

  const addPaymentEntry = useCallback(() => {
    setPaymentEntries(prev => [...prev, createEmptyPaymentEntry()]);
  }, []);

  const removePaymentEntry = useCallback((id: string) => {
    setPaymentEntries(prev => prev.length > 1 ? prev.filter(entry => entry.id !== id) : prev);
  }, []);

  const handleProcessRedemption = async () => {
    if (!selectedLoan || !redemptionCalc || !client || !profile) return;
    
    if (!identityVerified || !goldReleased) {
      toast.error('Please verify identity and confirm gold release');
      return;
    }
    
    if (!releasedTo.trim()) {
      toast.error('Please enter the name of person receiving gold');
      return;
    }

    // Validate payment amounts
    if (!isPaymentMatched) {
      if (paymentDifference < 0) {
        toast.error(`Payment short by ${formatIndianCurrency(Math.abs(paymentDifference))}. Full settlement required.`);
        return;
      }
    }

    // Validate each payment entry has amount
    const invalidEntries = paymentEntries.filter(e => parseFloat(e.amount) <= 0);
    if (invalidEntries.length > 0) {
      toast.error('Each payment entry must have a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      // Check if approval is required
      const { required: approvalRequired, workflow } = await checkApprovalRequired('redemption', redemptionCalc.breakdown.total);
      const userCanAutoApprove = await canAutoApprove('redemption');
      const needsApproval = approvalRequired && !userCanAutoApprove;

      // Generate redemption number
      const redemptionCount = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);
      
      const redemptionNumber = `RED${format(new Date(), 'yyMMdd')}${String((redemptionCount.count || 0) + 1).padStart(5, '0')}`;
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get primary payment info (first entry)
      const primaryPayment = paymentEntries[0];

      // Build payment breakdown for remarks
      const paymentBreakdown = paymentEntries.length > 1 
        ? `\nPayment Breakdown:\n${paymentEntries.map(p => `${p.mode.toUpperCase()}: ${formatIndianCurrency(parseFloat(p.amount) || 0)}${p.reference ? ` (Ref: ${p.reference})` : ''}`).join('\n')}`
        : '';

      // Create redemption record - if approval needed, don't release gold yet
      const redemptionData = {
        loan_id: selectedLoan.id,
        client_id: client.id,
        branch_id: selectedLoan.branch_id,
        redemption_number: redemptionNumber,
        redemption_date: today,
        outstanding_principal: redemptionCalc.breakdown.principal,
        interest_due: redemptionCalc.breakdown.interest,
        penalty_amount: redemptionCalc.breakdown.penalty,
        rebate_amount: redemptionCalc.breakdown.rebate,
        total_settlement: redemptionCalc.breakdown.total,
        amount_received: totalCollected,
        payment_mode: primaryPayment.mode,
        payment_reference: primaryPayment.reference || null,
        gold_released: needsApproval ? false : goldReleased,
        gold_released_date: needsApproval ? null : today,
        released_to: releasedTo,
        released_by: needsApproval ? null : profile.id,
        identity_verified: identityVerified,
        processed_by: profile.id,
        remarks: (remarks || '') + paymentBreakdown,
        source_type: primaryPayment.sourceType !== 'cash' ? primaryPayment.sourceType : null,
        source_bank_id: primaryPayment.sourceBankId || null,
        source_account_id: primaryPayment.sourceAccountId || null,
        approval_status: needsApproval ? 'pending' : 'approved',
      };

      const { data: redemptionResult, error: redemptionError } = await supabase
        .from('redemptions')
        .insert(redemptionData)
        .select()
        .single();

      if (redemptionError) throw redemptionError;

      // If approval is needed, submit for approval and don't close loan yet
      if (needsApproval) {
        await submitForApproval({
          workflowType: 'redemption',
          entityType: 'redemption',
          entityId: redemptionResult.id,
          entityNumber: redemptionNumber,
          branchId: selectedLoan.branch_id,
          amount: redemptionCalc.breakdown.total,
          description: `Redemption for loan ${selectedLoan.loan_number} - Customer: ${selectedLoan.customer.full_name}`,
          metadata: {
            loan_number: selectedLoan.loan_number,
            customer_name: selectedLoan.customer.full_name,
            principal: redemptionCalc.breakdown.principal,
            interest: redemptionCalc.breakdown.interest,
          },
        });

        toast.success(`Redemption ${redemptionNumber} submitted for approval. Gold will be released after approval.`);
      } else {
        // Update loan status to closed
        const { error: loanError } = await supabase
          .from('loans')
          .update({
            status: 'closed',
            closed_date: today,
            closure_type: 'redeemed',
          })
          .eq('id', selectedLoan.id);

        if (loanError) throw loanError;

        // Generate accounting voucher with payment entries
        await generateRedemptionVoucher({
          clientId: client.id,
          branchId: selectedLoan.branch_id,
          redemptionId: redemptionResult.id,
          loanNumber: selectedLoan.loan_number,
          amountReceived: totalCollected,
          principalAmount: redemptionCalc.breakdown.principal,
          interestDue: redemptionCalc.breakdown.interest,
          penaltyAmount: redemptionCalc.breakdown.penalty,
          rebateAmount: redemptionCalc.breakdown.rebate,
          paymentEntries: paymentEntries.map(e => ({
            mode: e.mode,
            amount: parseFloat(e.amount) || 0,
            sourceBankId: e.sourceBankId || undefined,
          })),
        });

        toast.success(`Loan ${selectedLoan.loan_number} redeemed successfully`);
      }

      // Reset form
      setSelectedLoan(null);
      setGoldItems([]);
      setPaymentEntries([createEmptyPaymentEntry()]);
      setRemarks('');
      setIdentityVerified(false);
      setGoldReleased(false);
      setReleasedTo('');
      
      fetchRecentRedemptions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process redemption');
    } finally {
      setSubmitting(false);
    }
  };

  const totalGoldWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loan Redemption</h1>
            <p className="text-muted-foreground">Process loan closures and gold release</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by loan number, customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_number}</TableCell>
                        <TableCell>{loan.customer.full_name}</TableCell>
                        <TableCell>{formatIndianCurrency(loan.principal_amount)}</TableCell>
                        <TableCell>{format(parseISO(loan.loan_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => selectLoan(loan)}>
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Loan Details */}
        {selectedLoan && redemptionCalc && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Loan & Gold Details */}
            <div className="space-y-6">
              {/* Loan Details */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Customer</Label>
                      <p className="font-medium">{selectedLoan.customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedLoan.customer.customer_code}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedLoan.customer.phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Loan Number</Label>
                      <p className="font-medium">{selectedLoan.loan_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Loan Date</Label>
                      <p className="font-medium">{format(parseISO(selectedLoan.loan_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Original Principal</Label>
                      <p className="font-medium">{formatIndianCurrency(selectedLoan.principal_amount)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Outstanding</Label>
                      <p className="font-medium text-primary">{formatIndianCurrency(selectedLoan.actual_principal || selectedLoan.principal_amount)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Scheme</Label>
                      <p className="font-medium">{selectedLoan.scheme.scheme_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Days Since Loan</Label>
                      <p className="font-medium">{differenceInDays(new Date(), parseISO(selectedLoan.loan_date))} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gold Items */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-600" />
                    Pledged Gold Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Weight (g)</TableHead>
                          <TableHead>Purity</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goldItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="capitalize">{item.item_type}</TableCell>
                            <TableCell className="text-right">{item.gross_weight_grams.toFixed(2)}</TableCell>
                            <TableCell className="uppercase">{item.purity}</TableCell>
                            <TableCell className="text-right">{formatIndianCurrency(item.appraised_value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Total Gold Weight</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{totalGoldWeight.toFixed(2)} grams</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settlement & Payment */}
            <div className="space-y-6">
              {/* Settlement Calculator */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Settlement Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Outstanding Principal</span>
                      <span className="font-medium">{formatIndianCurrency(redemptionCalc.breakdown.principal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Interest Due</span>
                      <span className="font-medium">{formatIndianCurrency(redemptionCalc.breakdown.interest)}</span>
                    </div>
                    {redemptionCalc.breakdown.penalty > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Penalty</span>
                        <span className="font-medium">{formatIndianCurrency(redemptionCalc.breakdown.penalty)}</span>
                      </div>
                    )}
                    {redemptionCalc.breakdown.rebate > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Less: Early Release Benefit</span>
                        <span className="font-medium">- {formatIndianCurrency(redemptionCalc.breakdown.rebate)}</span>
                      </div>
                    )}
                    {redemptionCalc.rebate.eligible && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {redemptionCalc.rebate.reason}
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                      <span className="font-semibold text-lg">Total Settlement</span>
                      <span className="font-bold text-lg text-primary">{formatIndianCurrency(redemptionCalc.breakdown.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Collection */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                    Payment Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Entries */}
                  <div className="space-y-3">
                    {paymentEntries.map((entry, index) => (
                      <div key={entry.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Payment {index + 1}</span>
                          {paymentEntries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePaymentEntry(entry.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Mode</Label>
                            <Select 
                              value={entry.mode} 
                              onValueChange={(v) => updatePaymentEntry(entry.id, 'mode', v)}
                            >
                              <SelectTrigger className="h-9">
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
                          <div className="space-y-1">
                            <Label className="text-xs">Amount (₹)</Label>
                            <Input
                              type="number"
                              value={entry.amount}
                              onChange={(e) => updatePaymentEntry(entry.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Reference</Label>
                            <Input
                              value={entry.reference}
                              onChange={(e) => updatePaymentEntry(entry.id, 'reference', e.target.value)}
                              placeholder={entry.mode === 'cash' ? 'N/A' : 'Txn ID'}
                              className="h-9"
                              disabled={entry.mode === 'cash'}
                            />
                          </div>
                        </div>
                        {entry.mode !== 'cash' && client && (
                          <SourceAccountSelector
                            clientId={client.id}
                            paymentMode={entry.mode}
                            sourceType={entry.sourceType}
                            setSourceType={(v) => updatePaymentEntry(entry.id, 'sourceType', v)}
                            sourceBankId={entry.sourceBankId}
                            setSourceBankId={(v) => updatePaymentEntry(entry.id, 'sourceBankId', v)}
                            sourceAccountId={entry.sourceAccountId}
                            setSourceAccountId={(v) => updatePaymentEntry(entry.id, 'sourceAccountId', v)}
                            selectedLoyaltyId={entry.selectedLoyaltyId}
                            setSelectedLoyaltyId={(v) => updatePaymentEntry(entry.id, 'selectedLoyaltyId', v)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Payment Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentEntry}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Mode
                  </Button>

                  {/* Payment Tally */}
                  <div className={`p-3 rounded-lg border-2 ${
                    isPaymentMatched 
                      ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' 
                      : paymentDifference < 0 
                        ? 'border-red-500/50 bg-red-50 dark:bg-red-950/20'
                        : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Settlement</p>
                        <p className="font-semibold">{formatIndianCurrency(redemptionCalc.breakdown.total)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Collected</p>
                        <p className="font-semibold">{formatIndianCurrency(totalCollected)}</p>
                      </div>
                      <div className="text-right">
                        {isPaymentMatched ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Matched
                          </Badge>
                        ) : paymentDifference < 0 ? (
                          <Badge variant="destructive">
                            Short: {formatIndianCurrency(Math.abs(paymentDifference))}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Excess: {formatIndianCurrency(paymentDifference)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      placeholder="Add any notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Verification */}
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    Verification & Gold Release
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="identity"
                      checked={identityVerified}
                      onCheckedChange={(checked) => setIdentityVerified(checked as boolean)}
                    />
                    <Label htmlFor="identity" className="cursor-pointer">
                      Identity Verified (ID proof checked)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="goldRelease"
                      checked={goldReleased}
                      onCheckedChange={(checked) => setGoldReleased(checked as boolean)}
                    />
                    <Label htmlFor="goldRelease" className="cursor-pointer">
                      Gold Released (All items handed over)
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Released To *</Label>
                    <Input
                      placeholder="Name of person receiving gold"
                      value={releasedTo}
                      onChange={(e) => setReleasedTo(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Process Button */}
              <Button
                onClick={handleProcessRedemption}
                disabled={submitting || !identityVerified || !goldReleased || !canProcessRedemption || !isPaymentMatched}
                className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {submitting ? (
                  'Processing...'
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Process Redemption ({formatIndianCurrency(totalCollected)})
                  </>
                )}
              </Button>
              {!isPaymentMatched && paymentDifference < 0 && (
                <p className="text-sm text-destructive text-center mt-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Payment is short by {formatIndianCurrency(Math.abs(paymentDifference))}. Full settlement required.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Redemptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Recent Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRedemptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No redemptions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Redemption #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Loan #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Settlement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRedemptions.map((redemption) => (
                    <TableRow 
                      key={redemption.id}
                      className={`${redemption.approval_status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''} ${redemption.approval_status === 'rejected' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{redemption.redemption_number}</span>
                          {redemption.approval_status && redemption.approval_status !== 'approved' && (
                            <ApprovalBadge status={redemption.approval_status} size="sm" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(redemption.redemption_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{redemption.loan?.loan_number || '-'}</TableCell>
                      <TableCell>{redemption.loan?.customer?.full_name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatIndianCurrency(redemption.total_settlement)}</TableCell>
                      <TableCell>
                        {redemption.approval_status === 'pending' ? (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Awaiting Approval
                          </Badge>
                        ) : redemption.gold_released ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Released
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending Release
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            if (!client) return;
                            const blob = await pdf(
                              <RedemptionReceiptPDF
                                redemption={{
                                  redemption_number: redemption.redemption_number,
                                  redemption_date: redemption.redemption_date,
                                  payment_mode: redemption.payment_mode,
                                }}
                                loan={{
                                  loan_number: redemption.loan?.loan_number || '',
                                  loan_date: '',
                                  principal_amount: redemption.outstanding_principal,
                                }}
                                customer={{
                                  full_name: redemption.loan?.customer?.full_name || '',
                                  customer_code: redemption.loan?.customer?.customer_code || '',
                                  phone: '',
                                }}
                                breakdown={{
                                  principal: redemption.outstanding_principal,
                                  interest: redemption.interest_due,
                                  penalty: redemption.penalty_amount,
                                  rebate: redemption.rebate_amount,
                                  total: redemption.total_settlement,
                                }}
                                goldItems={[]}
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
                            a.download = `redemption-${redemption.redemption_number}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  );
}