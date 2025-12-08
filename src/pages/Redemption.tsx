import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Wallet, Calculator, IndianRupee, 
  Package, CheckCircle, AlertTriangle, FileText,
  Coins
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  calculateRedemptionAmount,
  formatIndianCurrency,
  calculateRebateAtRedemption,
} from '@/lib/interestCalculations';
import { PDFViewerDialog } from '@/components/receipts/PDFViewerDialog';
import { RedemptionReceiptPDF } from '@/components/receipts/RedemptionReceiptPDF';
import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { useSourceAccount } from '@/hooks/useSourceAccount';
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

export default function Redemption() {
  const { client, profile, isPlatformAdmin, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LoanWithDetails[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected loan for redemption
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  
  // Payment form
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Source account tracking
  const sourceAccount = useSourceAccount();
  
  // Verification
  const [identityVerified, setIdentityVerified] = useState(false);
  const [goldReleased, setGoldReleased] = useState(false);
  const [releasedTo, setReleasedTo] = useState('');
  
  // Processing
  const [submitting, setSubmitting] = useState(false);
  
  // Recent redemptions
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  
  // PDF Dialog
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [redemptionForPdf, setRedemptionForPdf] = useState<any>(null);

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
      showRepledgeWarning(repledgeStatus.packetNumber!);
      return;
    }
    
    setSelectedLoan(loan);
    setSearchResults([]);
    setSearchQuery('');
    setReleasedTo(loan.customer.full_name);
    sourceAccount.resetSourceAccount();
    
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
    const daysSinceLoan = differenceInDays(new Date(), parseISO(selectedLoan.loan_date));
    
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

    setSubmitting(true);
    try {
      // Generate redemption number
      const redemptionCount = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);
      
      const redemptionNumber = `RED${format(new Date(), 'yyMMdd')}${String((redemptionCount.count || 0) + 1).padStart(5, '0')}`;
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get source account data
      const sourceData = sourceAccount.getSourceAccountData(paymentMode);

      // Create redemption record
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
        amount_received: redemptionCalc.breakdown.total,
        payment_mode: paymentMode,
        payment_reference: paymentReference || null,
        gold_released: goldReleased,
        gold_released_date: today,
        released_to: releasedTo,
        released_by: profile.id,
        identity_verified: identityVerified,
        processed_by: profile.id,
        remarks: remarks || null,
        source_type: sourceData.source_type,
        source_bank_id: sourceData.source_bank_id,
        source_account_id: sourceData.source_account_id,
      };

      const { data: redemptionResult, error: redemptionError } = await supabase
        .from('redemptions')
        .insert(redemptionData)
        .select()
        .single();

      if (redemptionError) throw redemptionError;

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

      // Generate accounting voucher
      await generateRedemptionVoucher({
        clientId: client.id,
        branchId: selectedLoan.branch_id,
        redemptionId: redemptionResult.id,
        loanNumber: selectedLoan.loan_number,
        amountReceived: redemptionCalc.breakdown.total,
        principalAmount: redemptionCalc.breakdown.principal,
        interestDue: redemptionCalc.breakdown.interest,
        penaltyAmount: redemptionCalc.breakdown.penalty,
        rebateAmount: redemptionCalc.breakdown.rebate,
      });

      toast.success(`Loan ${selectedLoan.loan_number} redeemed successfully`);

      // Prepare data for PDF
      const pdfData = {
        company: {
          name: client.company_name,
          address: (client as any).address || '',
          phone: (client as any).phone || '',
          email: (client as any).email || '',
        },
        redemption: {
          number: redemptionNumber,
          date: today,
          paymentMode: paymentMode,
          paymentReference: paymentReference || undefined,
        },
        customer: {
          name: selectedLoan.customer.full_name,
          code: selectedLoan.customer.customer_code,
          phone: selectedLoan.customer.phone,
        },
        loan: {
          number: selectedLoan.loan_number,
          date: selectedLoan.loan_date,
          originalPrincipal: selectedLoan.principal_amount,
          tenureDays: selectedLoan.tenure_days,
          daysSinceLoan: differenceInDays(new Date(), parseISO(selectedLoan.loan_date)),
        },
        settlement: {
          outstandingPrincipal: redemptionCalc.breakdown.principal,
          interestDue: redemptionCalc.breakdown.interest,
          penalty: redemptionCalc.breakdown.penalty,
          rebateAmount: redemptionCalc.breakdown.rebate,
          totalSettlement: redemptionCalc.breakdown.total,
          amountReceived: redemptionCalc.breakdown.total,
        },
        goldRelease: {
          releasedTo: releasedTo,
          releaseDate: today,
          identityVerified: identityVerified,
        },
      };

      setRedemptionForPdf(pdfData);
      setPdfDialogOpen(true);

      // Reset form
      setSelectedLoan(null);
      setGoldItems([]);
      setPaymentMode('cash');
      setPaymentReference('');
      setRemarks('');
      setIdentityVerified(false);
      setGoldReleased(false);
      setReleasedTo('');
      sourceAccount.resetSourceAccount();
      
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
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
                    <div className="space-y-2">
                      <Label>Reference (Optional)</Label>
                      <Input
                        placeholder="Transaction ID"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      placeholder="Add any notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                    />
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
                disabled={submitting || !identityVerified || !goldReleased || !canProcessRedemption}
                className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {submitting ? (
                  'Processing...'
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Process Redemption ({formatIndianCurrency(redemptionCalc.breakdown.total)})
                  </>
                )}
              </Button>
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
                    <TableHead>Gold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRedemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-medium">{redemption.redemption_number}</TableCell>
                      <TableCell>{format(parseISO(redemption.redemption_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{redemption.loan?.loan_number || '-'}</TableCell>
                      <TableCell>{redemption.loan?.customer?.full_name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatIndianCurrency(redemption.total_settlement)}</TableCell>
                      <TableCell>
                        {redemption.gold_released ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Released
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Dialog */}
      {redemptionForPdf && (
        <PDFViewerDialog
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
          title="Redemption Receipt"
          document={<RedemptionReceiptPDF {...redemptionForPdf} />}
          fileName={`redemption-${redemptionForPdf.redemption.number}`}
        />
      )}
    </DashboardLayout>
  );
}