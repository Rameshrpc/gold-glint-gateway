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
  Coins, Printer, Download, Plus, Trash2, Clock, ShoppingCart
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

interface AgreementWithDetails {
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

interface Repurchase {
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

export default function SaleRepurchase() {
  const { client, profile, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const { settings: printSettings } = useEffectivePrintSettings(currentBranch?.id);
  const { checkApprovalRequired, canAutoApprove, submitForApproval } = useApprovalWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AgreementWithDetails[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected agreement for repurchase
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementWithDetails | null>(null);
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
  
  // Recent repurchases
  const [recentRepurchases, setRecentRepurchases] = useState<Repurchase[]>([]);

  const canProcessRepurchase = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchRecentRepurchases();
    }
  }, [client]);

  const fetchRecentRepurchases = async () => {
    if (!client) return;
    try {
      // Fetch redemptions where the loan has transaction_type = 'sale_agreement'
      const { data, error } = await supabase
        .from('redemptions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch loan details separately and filter for sale agreements
      const repurchasesWithLoans = await Promise.all((data || []).map(async (red) => {
        const { data: loanData } = await supabase
          .from('loans')
          .select('loan_number, transaction_type, customer:customers(full_name, customer_code)')
          .eq('id', red.loan_id)
          .single();
        
        if (loanData?.transaction_type === 'sale_agreement') {
          return {
            ...red,
            loan: loanData as { loan_number: string; customer: { full_name: string; customer_code: string; } } | null,
          };
        }
        return null;
      }));
      
      setRecentRepurchases(repurchasesWithLoans.filter(Boolean) as any);
    } catch (error: any) {
      console.error('Failed to fetch repurchases:', error);
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

      // Build agreements query - only sale agreements
      let agreementsQuery = supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days, interest_rate_slabs, slab_mode, penalty_slabs)
        `)
        .eq('client_id', client.id)
        .eq('status', 'active')
        .eq('transaction_type', 'sale_agreement');

      // Search by loan_number OR by matching customer IDs
      if (customerIds.length > 0) {
        agreementsQuery = agreementsQuery.or(`loan_number.ilike.%${query}%,customer_id.in.(${customerIds.join(',')})`);
      } else {
        agreementsQuery = agreementsQuery.ilike('loan_number', `%${query}%`);
      }

      const { data, error } = await agreementsQuery.limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectAgreement = async (agreement: AgreementWithDetails) => {
    // Check if loan is repledged
    const repledgeStatus = await checkRepledgeStatus(agreement.id);
    if (repledgeStatus.isRepledged) {
      showRepledgeWarning(repledgeStatus);
      return;
    }
    
    setSelectedAgreement(agreement);
    setSearchResults([]);
    setSearchQuery('');
    setReleasedTo(agreement.customer.full_name);
    
    // Fetch gold items
    const { data } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', agreement.id);
    setGoldItems(data || []);
  };

  // Calculate repurchase amount (strike price)
  const repurchaseCalc = useMemo(() => {
    if (!selectedAgreement) return null;

    const scheme = {
      id: selectedAgreement.scheme.id,
      scheme_name: selectedAgreement.scheme.scheme_name,
      shown_rate: selectedAgreement.scheme.shown_rate || 18,
      effective_rate: selectedAgreement.scheme.effective_rate || selectedAgreement.scheme.interest_rate * 12,
      minimum_days: selectedAgreement.scheme.minimum_days || 30,
      advance_interest_months: 1,
      penalty_rate: selectedAgreement.scheme.penalty_rate || 2,
      grace_period_days: selectedAgreement.scheme.grace_period_days || 7,
      interest_rate_slabs: (selectedAgreement.scheme as any).interest_rate_slabs || [],
      slab_mode: (selectedAgreement.scheme as any).slab_mode || 'prospective',
      penalty_slabs: (selectedAgreement.scheme as any).penalty_slabs || [],
    };

    const lastPaidDate = selectedAgreement.last_interest_paid_date || selectedAgreement.loan_date;
    const daysSincePayment = differenceInDays(new Date(), parseISO(lastPaidDate));
    
    // Days since agreement creation - used for rebate calculation
    const daysSinceAgreement = differenceInDays(new Date(), parseISO(selectedAgreement.loan_date));
    
    const differentialCapitalized = selectedAgreement.differential_capitalized || 0;
    
    // Calculate advance margin days from scheme (default 30 days = 1 month)
    const advanceMarginDays = scheme.advance_interest_months * 30;

    return calculateRedemptionAmount(
      selectedAgreement.actual_principal || selectedAgreement.principal_amount,
      scheme,
      daysSincePayment,       // For margin calculation
      daysSinceAgreement,     // For rebate calculation
      selectedAgreement.tenure_days,
      differentialCapitalized,
      advanceMarginDays       // Exclude advance margin period from billing
    );
  }, [selectedAgreement]);

  // Calculate total collected from payment entries
  const totalCollected = useMemo(() => {
    return paymentEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  }, [paymentEntries]);

  // Check if payment is matched to settlement
  const isPaymentMatched = useMemo(() => {
    if (!repurchaseCalc) return false;
    return Math.abs(totalCollected - repurchaseCalc.breakdown.total) < 0.01;
  }, [totalCollected, repurchaseCalc]);

  const paymentDifference = useMemo(() => {
    if (!repurchaseCalc) return 0;
    return totalCollected - repurchaseCalc.breakdown.total;
  }, [totalCollected, repurchaseCalc]);

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

  const handleProcessRepurchase = async () => {
    if (!selectedAgreement || !repurchaseCalc || !client || !profile) return;
    
    if (!identityVerified || !goldReleased) {
      toast.error('Please verify identity and confirm goods release');
      return;
    }
    
    if (!releasedTo.trim()) {
      toast.error('Please enter the name of person receiving goods');
      return;
    }

    // Validate payment amounts
    if (!isPaymentMatched) {
      if (paymentDifference < 0) {
        toast.error(`Payment short by ${formatIndianCurrency(Math.abs(paymentDifference))}. Full strike price required.`);
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
      const { required: approvalRequired, workflow } = await checkApprovalRequired('repurchase', repurchaseCalc.breakdown.total);
      const userCanAutoApprove = await canAutoApprove('repurchase');
      const needsApproval = approvalRequired && !userCanAutoApprove;

      // Generate repurchase number
      const repurchaseCount = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);
      
      const repurchaseNumber = `RPR${format(new Date(), 'yyMMdd')}${String((repurchaseCount.count || 0) + 1).padStart(5, '0')}`;
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get primary payment info (first entry)
      const primaryPayment = paymentEntries[0];

      // Build payment breakdown for remarks
      const paymentBreakdown = paymentEntries.length > 1 
        ? `\nPayment Breakdown:\n${paymentEntries.map(p => `${p.mode.toUpperCase()}: ${formatIndianCurrency(parseFloat(p.amount) || 0)}${p.reference ? ` (Ref: ${p.reference})` : ''}`).join('\n')}`
        : '';

      // Create repurchase record - if approval needed, don't release goods yet
      const repurchaseData = {
        loan_id: selectedAgreement.id,
        client_id: client.id,
        branch_id: selectedAgreement.branch_id,
        redemption_number: repurchaseNumber,
        redemption_date: today,
        outstanding_principal: repurchaseCalc.breakdown.principal,
        interest_due: repurchaseCalc.breakdown.interest,
        penalty_amount: repurchaseCalc.breakdown.penalty,
        rebate_amount: repurchaseCalc.breakdown.rebate,
        total_settlement: repurchaseCalc.breakdown.total,
        amount_received: totalCollected,
        payment_mode: primaryPayment.mode,
        payment_reference: primaryPayment.reference || null,
        gold_released: needsApproval ? false : goldReleased,
        gold_released_date: needsApproval ? null : today,
        released_to: releasedTo,
        released_by: needsApproval ? null : profile.id,
        identity_verified: identityVerified,
        processed_by: profile.id,
        remarks: (remarks || 'Repurchase transaction') + paymentBreakdown,
        source_type: primaryPayment.sourceType !== 'cash' ? primaryPayment.sourceType : null,
        source_bank_id: primaryPayment.sourceBankId || null,
        source_account_id: primaryPayment.sourceAccountId || null,
        approval_status: needsApproval ? 'pending' : 'approved',
      };

      const { data: repurchaseResult, error: repurchaseError } = await supabase
        .from('redemptions')
        .insert(repurchaseData)
        .select()
        .single();

      if (repurchaseError) throw repurchaseError;

      // If approval is needed, submit for approval and don't close agreement yet
      if (needsApproval) {
        await submitForApproval({
          workflowType: 'repurchase',
          entityType: 'repurchase',
          entityId: repurchaseResult.id,
          entityNumber: repurchaseNumber,
          branchId: selectedAgreement.branch_id,
          amount: repurchaseCalc.breakdown.total,
          description: `Repurchase for agreement ${selectedAgreement.loan_number} - Seller: ${selectedAgreement.customer.full_name}`,
          metadata: {
            loan_number: selectedAgreement.loan_number,
            customer_name: selectedAgreement.customer.full_name,
            customer_code: selectedAgreement.customer.customer_code,
            principal: repurchaseCalc.breakdown.principal,
            interest: repurchaseCalc.breakdown.interest,
            gold_weight: goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0),
          },
        });

        toast.success(`Repurchase ${repurchaseNumber} submitted for approval. Goods will be released after approval.`);
      } else {
        // Update agreement status to closed
        const { error: updateError } = await supabase
          .from('loans')
          .update({
            status: 'closed',
            closed_date: today,
            closure_type: 'redeemed',
          })
          .eq('id', selectedAgreement.id);

        if (updateError) throw updateError;

        // Generate accounting voucher with payment entries
        await generateRedemptionVoucher({
          clientId: client.id,
          branchId: selectedAgreement.branch_id,
          redemptionId: repurchaseResult.id,
          loanNumber: selectedAgreement.loan_number,
          amountReceived: totalCollected,
          principalAmount: repurchaseCalc.breakdown.principal,
          interestDue: repurchaseCalc.breakdown.interest,
          penaltyAmount: repurchaseCalc.breakdown.penalty,
          rebateAmount: repurchaseCalc.breakdown.rebate,
          paymentEntries: paymentEntries.map(e => ({
            mode: e.mode,
            amount: parseFloat(e.amount) || 0,
            sourceBankId: e.sourceBankId || undefined,
          })),
        });

        toast.success(`Agreement ${selectedAgreement.loan_number} repurchased successfully. Goods released.`);
      }

      // Reset form
      setSelectedAgreement(null);
      setGoldItems([]);
      setPaymentEntries([createEmptyPaymentEntry()]);
      setRemarks('');
      setIdentityVerified(false);
      setGoldReleased(false);
      setReleasedTo('');
      
      fetchRecentRepurchases();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process repurchase');
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
            <h1 className="text-2xl font-bold">Repurchase (Buyback)</h1>
            <p className="text-muted-foreground">Exercise repurchase option & return goods to seller</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search & Select Agreement */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Sale Agreement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by agreement #, seller name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agreement #</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Purchase Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((agreement) => (
                        <TableRow key={agreement.id}>
                          <TableCell className="font-medium">{agreement.loan_number}</TableCell>
                          <TableCell>
                            <div>
                              <p>{agreement.customer.full_name}</p>
                              <p className="text-xs text-muted-foreground">{agreement.customer.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatIndianCurrency(agreement.principal_amount)}</TableCell>
                          <TableCell>{format(parseISO(agreement.loan_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => selectAgreement(agreement)}>Select</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Selected Agreement Details */}
              {selectedAgreement && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Selected Agreement</h3>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedAgreement(null);
                      setGoldItems([]);
                    }}>
                      Clear
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Agreement #</p>
                      <p className="font-medium">{selectedAgreement.loan_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seller</p>
                      <p className="font-medium">{selectedAgreement.customer.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Amount</p>
                      <p className="font-medium">{formatIndianCurrency(selectedAgreement.principal_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Scheme</p>
                      <p className="font-medium">{selectedAgreement.scheme.scheme_name}</p>
                    </div>
                  </div>

                  {/* Gold Items */}
                  {goldItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Goods to Return ({goldItems.length} items, {totalGoldWeight.toFixed(2)}g)
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Gross Wt</TableHead>
                              <TableHead>Net Wt</TableHead>
                              <TableHead>Purity</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goldItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="capitalize">{item.item_type}</TableCell>
                                <TableCell>{item.gross_weight_grams}g</TableCell>
                                <TableCell>{item.net_weight_grams}g</TableCell>
                                <TableCell className="uppercase">{item.purity}</TableCell>
                                <TableCell>{formatIndianCurrency(item.appraised_value)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Repurchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Repurchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRepurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent repurchases</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {recentRepurchases.map((repurchase) => (
                      <div key={repurchase.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{repurchase.redemption_number}</p>
                          {repurchase.gold_released ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Released</Badge>
                          ) : (
                            <ApprovalBadge status={repurchase.approval_status || 'pending'} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{repurchase.loan?.customer?.full_name}</p>
                        <p className="text-sm font-medium">{formatIndianCurrency(repurchase.amount_received)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Repurchase Calculation & Payment */}
        {selectedAgreement && repurchaseCalc && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Strike Price Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-medium">Strike Price Breakdown</h4>
                  <div className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Amount (Principal)</span>
                      <span>{formatIndianCurrency(repurchaseCalc.breakdown.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trade Margin</span>
                      <span>{formatIndianCurrency(repurchaseCalc.breakdown.interest)}</span>
                    </div>
                    {repurchaseCalc.breakdown.penalty > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Penalty</span>
                        <span>{formatIndianCurrency(repurchaseCalc.breakdown.penalty)}</span>
                      </div>
                    )}
                    {repurchaseCalc.breakdown.rebate > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rebate (Discount)</span>
                        <span>-{formatIndianCurrency(repurchaseCalc.breakdown.rebate)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Strike Price (Total)</span>
                      <span>{formatIndianCurrency(repurchaseCalc.breakdown.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Collection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Payment Collection</h4>
                    <Button size="sm" variant="outline" onClick={addPaymentEntry}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Entry
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {paymentEntries.map((entry, index) => (
                      <div key={entry.id} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Payment {index + 1}</span>
                          {paymentEntries.length > 1 && (
                            <Button size="sm" variant="ghost" onClick={() => removePaymentEntry(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={entry.mode} onValueChange={(v) => updatePaymentEntry(entry.id, 'mode', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_MODES.map(mode => (
                                <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={entry.amount}
                            onChange={(e) => updatePaymentEntry(entry.id, 'amount', e.target.value)}
                          />
                        </div>
                        {entry.mode !== 'cash' && (
                          <Input
                            placeholder="Reference #"
                            value={entry.reference}
                            onChange={(e) => updatePaymentEntry(entry.id, 'reference', e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between font-medium">
                      <span>Total Collected</span>
                      <span>{formatIndianCurrency(totalCollected)}</span>
                    </div>
                    {!isPaymentMatched && (
                      <div className={`flex justify-between text-sm ${paymentDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{paymentDifference > 0 ? 'Excess' : 'Short'}</span>
                        <span>{formatIndianCurrency(Math.abs(paymentDifference))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Verification & Release</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="identity" 
                      checked={identityVerified} 
                      onCheckedChange={(c) => setIdentityVerified(!!c)} 
                    />
                    <Label htmlFor="identity">Seller identity verified</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="release" 
                      checked={goldReleased} 
                      onCheckedChange={(c) => setGoldReleased(!!c)} 
                    />
                    <Label htmlFor="release">Goods ready for release</Label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Release goods to</Label>
                    <Input
                      value={releasedTo}
                      onChange={(e) => setReleasedTo(e.target.value)}
                      placeholder="Name of person receiving goods"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional notes..."
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedAgreement(null)}>Cancel</Button>
                <Button 
                  onClick={handleProcessRepurchase} 
                  disabled={submitting || !identityVerified || !goldReleased || !isPaymentMatched}
                  className="min-w-32"
                >
                  {submitting ? 'Processing...' : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Process Repurchase
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
