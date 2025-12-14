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
  Search, RefreshCw, Calculator, IndianRupee, 
  Package, CheckCircle, AlertTriangle, FileText,
  ArrowRight, ArrowUp, ArrowDown, Coins, Plus, Trash2, Camera
} from 'lucide-react';
import ImageCapture from '@/components/loans/ImageCapture';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, addDays, addMonths } from 'date-fns';
import {
  calculateRedemptionAmount,
  calculateAdvanceInterest,
  formatIndianCurrency,
} from '@/lib/interestCalculations';

import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { useSourceAccount } from '@/hooks/useSourceAccount';
import { checkRepledgeStatus, showRepledgeWarning } from '@/hooks/useRepledgeCheck';
import { generateReloanVoucher } from '@/hooks/useVoucherGeneration';

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
  item_id?: string;
  item_group_id?: string;
  description: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  stone_weight_grams: number;
  market_rate_per_gram: number;
  appraised_value: number;
}

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  interest_rate: number;
  shown_rate: number;
  effective_rate: number;
  minimum_days: number;
  advance_interest_months: number;
  ltv_percentage: number;
  min_amount: number;
  max_amount: number;
  min_tenure_days: number;
  max_tenure_days: number;
  processing_fee_percentage: number | null;
  document_charges: number | null;
  rate_18kt: number | null;
  rate_22kt: number | null;
}

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  commission_percentage: number;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cheque', label: 'Cheque' },
];

const PURITY_MAP: Record<string, number> = {
  '24k': 99.9,
  '22k': 91.6,
  '20k': 83.3,
  '18k': 75.0,
  '14k': 58.5,
};

export default function Reloan() {
  const { client, profile, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LoanWithDetails[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected loan for reloan
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  
  // Available schemes & agents
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // New loan configuration
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [tenureDays, setTenureDays] = useState('');
  const [userDocumentChargesPercent, setUserDocumentChargesPercent] = useState('');
  const [approvedLoanAmount, setApprovedLoanAmount] = useState('');
  
  // Payment form
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Source account tracking
  const sourceAccount = useSourceAccount();
  
  // Verification
  const [oldLoanSettled, setOldLoanSettled] = useState(false);
  const [goldVerified, setGoldVerified] = useState(false);
  
  // Processing
  const [submitting, setSubmitting] = useState(false);
  
  // Recent reloans
  const [recentReloans, setRecentReloans] = useState<any[]>([]);

  // Image captures
  const [jewelPhotoUrl, setJewelPhotoUrl] = useState<string | null>(null);
  const [appraiserSheetUrl, setAppraiserSheetUrl] = useState<string | null>(null);

  const canProcessReloan = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchSchemes();
      fetchAgents();
      fetchRecentReloans();
    }
  }, [client]);

  const fetchSchemes = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('schemes')
      .select('id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, document_charges, rate_18kt, rate_22kt')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('scheme_name');
    setSchemes(data || []);
  };

  const fetchAgents = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('agents')
      .select('id, agent_code, full_name, commission_percentage')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');
    setAgents(data || []);
  };

  const fetchRecentReloans = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, principal_amount, is_reloan, previous_loan_id,
          customer:customers(full_name, customer_code)
        `)
        .eq('client_id', client.id)
        .eq('is_reloan', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentReloans(data || []);
    } catch (error: any) {
      console.error('Failed to fetch recent reloans:', error);
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
    sourceAccount.resetSourceAccount();
    
    // Fetch gold items
    const { data } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', loan.id);
    setGoldItems(data || []);
    
    // Set default scheme to current loan's scheme
    setSelectedSchemeId(loan.scheme.id);
    
    // Set default tenure
    const scheme = schemes.find(s => s.id === loan.scheme.id);
    if (scheme) {
      setTenureDays(String(scheme.max_tenure_days));
    }
  };

  // Update gold item rate based on new scheme
  const updateGoldItemRate = (index: number, newRate: number) => {
    setGoldItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newAppraisedValue = item.net_weight_grams * newRate;
        return {
          ...item,
          market_rate_per_gram: newRate,
          appraised_value: newAppraisedValue,
        };
      }
      return item;
    }));
  };

  // Get rate for purity based on selected scheme
  const getRateForPurity = (purity: string, scheme: Scheme) => {
    switch (purity) {
      case '22k': return scheme.rate_22kt || 0;
      case '18k': return scheme.rate_18kt || 0;
      case '24k': return (scheme.rate_22kt || 0) * (24 / 22);
      case '20k': return (scheme.rate_22kt || 0) * (20 / 22);
      case '14k': return (scheme.rate_22kt || 0) * (14 / 22);
      default: return 0;
    }
  };

  // Recalculate gold items when scheme changes
  useEffect(() => {
    if (selectedSchemeId && goldItems.length > 0) {
      const scheme = schemes.find(s => s.id === selectedSchemeId);
      if (scheme) {
        setGoldItems(prev => prev.map(item => {
          const newRate = getRateForPurity(item.purity, scheme);
          const newAppraisedValue = item.net_weight_grams * newRate;
          return {
            ...item,
            market_rate_per_gram: newRate,
            appraised_value: newAppraisedValue,
          };
        }));
        
        // Set default tenure
        setTenureDays(String(scheme.max_tenure_days));
      }
    }
  }, [selectedSchemeId]);

  // Calculate old loan settlement
  const oldLoanCalc = useMemo(() => {
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
    const differentialCapitalized = selectedLoan.differential_capitalized || 0;

    return {
      ...calculateRedemptionAmount(
        selectedLoan.actual_principal || selectedLoan.principal_amount,
        scheme,
        daysSincePayment,
        selectedLoan.tenure_days,
        differentialCapitalized
      ),
      daysSinceLoan,
    };
  }, [selectedLoan]);

  // Calculate new loan
  const newLoanCalc = useMemo(() => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return null;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    const maxLoanAmount = totalAppraisedValue * (scheme.ltv_percentage / 100);
    const loanAmount = Math.round(Math.min(Math.max(maxLoanAmount, scheme.min_amount), scheme.max_amount));
    
    const selectedTenure = tenureDays ? parseInt(tenureDays) : scheme.max_tenure_days;
    
    const advanceCalc = calculateAdvanceInterest(loanAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate || 18,
      effective_rate: scheme.effective_rate || 24,
      minimum_days: scheme.minimum_days || 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    }, selectedTenure);

    const principalOnRecord = advanceCalc.actualPrincipal;
    const maxApprovedAmount = Math.round(principalOnRecord * 1.10);
    const finalApprovedAmount = approvedLoanAmount ? parseFloat(approvedLoanAmount) : principalOnRecord;
    
    const docChargesPercent = userDocumentChargesPercent ? parseFloat(userDocumentChargesPercent) : (scheme.document_charges || 0);
    const documentCharges = Math.round(principalOnRecord * (docChargesPercent / 100));
    const processingFee = Math.round(finalApprovedAmount * ((scheme.processing_fee_percentage || 0) / 100));

    const netCashToCustomer = finalApprovedAmount - advanceCalc.shownInterest - processingFee - documentCharges;

    return {
      totalAppraisedValue,
      loanAmount,
      principalOnRecord,
      maxApprovedAmount,
      finalApprovedAmount,
      processingFee,
      documentCharges,
      documentChargesPercentage: docChargesPercent,
      advanceCalc,
      netCashToCustomer,
      scheme,
      tenure: selectedTenure,
    };
  }, [goldItems, selectedSchemeId, schemes, tenureDays, userDocumentChargesPercent, approvedLoanAmount]);

  // Calculate net settlement
  const netSettlement = useMemo(() => {
    if (!oldLoanCalc || !newLoanCalc) return null;

    const oldSettlement = oldLoanCalc.breakdown.total;
    const newDisbursement = newLoanCalc.netCashToCustomer;
    const netAmount = newDisbursement - oldSettlement;

    return {
      oldSettlement,
      newDisbursement,
      netAmount: Math.abs(netAmount),
      direction: netAmount >= 0 ? 'to_customer' as const : 'from_customer' as const,
    };
  }, [oldLoanCalc, newLoanCalc]);

  const generateLoanNumber = () => {
    const prefix = 'GL';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  };

  const handleProcessReloan = async () => {
    if (!selectedLoan || !oldLoanCalc || !newLoanCalc || !netSettlement || !client || !profile) return;
    
    if (!oldLoanSettled || !goldVerified) {
      toast.error('Please confirm old loan settlement and gold verification');
      return;
    }

    if (!selectedSchemeId) {
      toast.error('Please select a scheme for the new loan');
      return;
    }

    // Validate approved amount
    if (newLoanCalc.finalApprovedAmount > newLoanCalc.maxApprovedAmount) {
      toast.error(`Approved amount cannot exceed ${formatIndianCurrency(newLoanCalc.maxApprovedAmount)}`);
      return;
    }

    setSubmitting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const loanDate = new Date();
      const maturityDate = addDays(loanDate, newLoanCalc.tenure);
      const nextInterestDueDate = addMonths(loanDate, newLoanCalc.scheme.advance_interest_months || 3);
      const newLoanNumber = generateLoanNumber();

      // Generate redemption number
      const { count: redemptionCount } = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);
      
      const redemptionNumber = `RED${format(new Date(), 'yyMMdd')}${String((redemptionCount || 0) + 1).padStart(5, '0')}`;

      // 1. Create redemption record for old loan (is_reloan_redemption = true)
      const { data: redemptionResult, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          loan_id: selectedLoan.id,
          client_id: client.id,
          branch_id: selectedLoan.branch_id,
          redemption_number: redemptionNumber,
          redemption_date: today,
          outstanding_principal: oldLoanCalc.breakdown.principal,
          interest_due: oldLoanCalc.breakdown.interest,
          penalty_amount: oldLoanCalc.breakdown.penalty,
          rebate_amount: oldLoanCalc.breakdown.rebate,
          total_settlement: oldLoanCalc.breakdown.total,
          amount_received: oldLoanCalc.breakdown.total,
          payment_mode: paymentMode,
          payment_reference: paymentReference || null,
          gold_released: false, // Gold is NOT released in reloan
          identity_verified: true,
          processed_by: profile.id,
          remarks: `Reloan - New Loan: ${newLoanNumber}`,
          is_reloan_redemption: true,
        })
        .select()
        .single();

      if (redemptionError) throw redemptionError;

      // 2. Update old loan status to closed
      const { error: oldLoanError } = await supabase
        .from('loans')
        .update({
          status: 'closed',
          closed_date: today,
          closure_type: 'reloaned',
        })
        .eq('id', selectedLoan.id);

      if (oldLoanError) throw oldLoanError;

      // 3. Create new loan (is_reloan = true, previous_loan_id = old loan id)
      const newLoanData = {
        client_id: client.id,
        branch_id: currentBranch?.id || selectedLoan.branch_id,
        customer_id: selectedLoan.customer.id,
        scheme_id: selectedSchemeId,
        agent_id: selectedAgentId || null,
        loan_number: newLoanNumber,
        loan_date: today,
        principal_amount: newLoanCalc.finalApprovedAmount,
        shown_principal: newLoanCalc.loanAmount,
        actual_principal: newLoanCalc.principalOnRecord,
        interest_rate: newLoanCalc.scheme.shown_rate || 18,
        tenure_days: newLoanCalc.tenure,
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        processing_fee: newLoanCalc.processingFee,
        net_disbursed: newLoanCalc.netCashToCustomer,
        advance_interest_shown: newLoanCalc.advanceCalc.shownInterest,
        advance_interest_actual: newLoanCalc.advanceCalc.actualInterest,
        differential_capitalized: newLoanCalc.advanceCalc.differential,
        next_interest_due_date: format(nextInterestDueDate, 'yyyy-MM-dd'),
        last_interest_paid_date: today,
        created_by: profile.id,
        appraised_by: profile.id,
        disbursement_mode: paymentMode,
        document_charges: newLoanCalc.documentCharges,
        payment_reference: paymentReference || null,
        remarks: `Reloan from ${selectedLoan.loan_number}. ${remarks || ''}`.trim(),
        is_reloan: true,
        previous_loan_id: selectedLoan.id,
        jewel_photo_url: jewelPhotoUrl,
        appraiser_sheet_url: appraiserSheetUrl,
      };

      const { data: newLoanResult, error: newLoanError } = await supabase
        .from('loans')
        .insert(newLoanData)
        .select()
        .single();

      if (newLoanError) throw newLoanError;

      // 4. Copy gold items to new loan (with updated values)
      type GoldPurity = '24k' | '22k' | '20k' | '18k' | '14k';
      const newGoldItemsData = goldItems.map(item => ({
        loan_id: newLoanResult.id,
        item_type: item.item_type,
        item_id: item.item_id || null,
        item_group_id: item.item_group_id || null,
        description: item.description,
        gross_weight_grams: item.gross_weight_grams,
        net_weight_grams: item.net_weight_grams,
        purity: item.purity as GoldPurity,
        purity_percentage: item.purity_percentage,
        stone_weight_grams: item.stone_weight_grams,
        market_rate_per_gram: item.market_rate_per_gram,
        appraised_value: item.appraised_value,
      }));

      const { error: goldItemsError } = await supabase
        .from('gold_items')
        .insert(newGoldItemsData);

      if (goldItemsError) throw goldItemsError;

      // 5. Update redemption with new_loan_id
      await supabase
        .from('redemptions')
        .update({ new_loan_id: newLoanResult.id })
        .eq('id', redemptionResult.id);

      // 6. Create disbursement record with source account
      const sourceData = sourceAccount.getSourceAccountData(paymentMode);
      await supabase
        .from('loan_disbursements')
        .insert({
          loan_id: newLoanResult.id,
          payment_mode: paymentMode,
          amount: newLoanCalc.netCashToCustomer,
          reference_number: paymentReference || null,
          source_type: sourceData.source_type,
          source_bank_id: sourceData.source_bank_id,
          source_account_id: sourceData.source_account_id,
        });

      // Generate accounting voucher for reloan
      const voucherResult = await generateReloanVoucher({
        clientId: client.id,
        branchId: currentBranch?.id || selectedLoan.branch_id,
        oldLoanId: selectedLoan.id,
        oldLoanNumber: selectedLoan.loan_number,
        newLoanId: newLoanResult.id,
        newLoanNumber: newLoanNumber,
        oldPrincipal: oldLoanCalc.breakdown.principal,
        oldInterest: oldLoanCalc.breakdown.interest,
        oldPenalty: oldLoanCalc.breakdown.penalty,
        oldRebate: oldLoanCalc.breakdown.rebate,
        oldTotalSettlement: oldLoanCalc.breakdown.total,
        newPrincipal: newLoanCalc.finalApprovedAmount,
        newNetDisbursed: newLoanCalc.netCashToCustomer,
        newProcessingFee: newLoanCalc.processingFee,
        newDocumentCharges: newLoanCalc.documentCharges,
        newAdvanceInterestShown: newLoanCalc.advanceCalc.shownInterest,
        newAdvanceInterestActual: newLoanCalc.advanceCalc.actualInterest,
        netAmount: netSettlement.netAmount,
        direction: netSettlement.direction,
        paymentMode: paymentMode,
      });

      if (!voucherResult.success && voucherResult.error) {
        console.warn('Voucher generation failed:', voucherResult.error);
      }

      toast.success(`Reloan processed: ${selectedLoan.loan_number} → ${newLoanNumber}`);

      // Reset form
      setSelectedLoan(null);
      setGoldItems([]);
      setSelectedSchemeId('');
      setSelectedAgentId('');
      setTenureDays('');
      setUserDocumentChargesPercent('');
      setApprovedLoanAmount('');
      setPaymentMode('cash');
      setPaymentReference('');
      setRemarks('');
      setOldLoanSettled(false);
      setGoldVerified(false);
      setJewelPhotoUrl(null);
      setAppraiserSheetUrl(null);
      sourceAccount.resetSourceAccount();
      
      fetchRecentReloans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process reloan');
    } finally {
      setSubmitting(false);
    }
  };

  const totalGoldWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalGoldValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reloan / Loan Top-Up</h1>
            <p className="text-muted-foreground">Close existing loan and create new loan in one transaction</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Active Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by loan number, customer name or phone (min 4 chars)..."
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

        {/* Selected Loan - Full Reloan Form */}
        {selectedLoan && oldLoanCalc && (
          <>
            {/* Step 1: Current Loan Details */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Customer & Old Loan Info */}
              <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                    Current Loan (To Close)
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
                      <Label className="text-muted-foreground">Loan Number</Label>
                      <p className="font-medium">{selectedLoan.loan_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Loan Date</Label>
                      <p className="font-medium">{format(parseISO(selectedLoan.loan_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Days Active</Label>
                      <p className="font-medium">{oldLoanCalc.daysSinceLoan} days</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Original Principal</Label>
                      <p className="font-medium">{formatIndianCurrency(selectedLoan.principal_amount)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Scheme</Label>
                      <p className="font-medium">{selectedLoan.scheme.scheme_name}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Old Loan Settlement */}
                  <div className="bg-amber-100/50 dark:bg-amber-900/30 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">Settlement Calculation</h4>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding Principal</span>
                      <span className="font-medium">{formatIndianCurrency(oldLoanCalc.breakdown.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Due</span>
                      <span className="font-medium">{formatIndianCurrency(oldLoanCalc.breakdown.interest)}</span>
                    </div>
                    {oldLoanCalc.breakdown.penalty > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Penalty</span>
                        <span className="font-medium">+ {formatIndianCurrency(oldLoanCalc.breakdown.penalty)}</span>
                      </div>
                    )}
                    {oldLoanCalc.breakdown.rebate > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rebate</span>
                        <span className="font-medium">- {formatIndianCurrency(oldLoanCalc.breakdown.rebate)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-amber-800 dark:text-amber-300">
                      <span>Total Settlement</span>
                      <span>{formatIndianCurrency(oldLoanCalc.breakdown.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gold Items - Re-Appraisal */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-600" />
                    Gold Items (Re-Appraisal)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Net Wt</TableHead>
                          <TableHead>Purity</TableHead>
                          <TableHead>Rate/g</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goldItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_type}</TableCell>
                            <TableCell>{item.net_weight_grams.toFixed(2)}g</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.purity}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.market_rate_per_gram}
                                onChange={(e) => updateGoldItemRate(index, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatIndianCurrency(item.appraised_value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Weight</p>
                      <p className="font-bold">{totalGoldWeight.toFixed(2)}g</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Appraised Value</p>
                      <p className="font-bold text-lg">{formatIndianCurrency(totalGoldValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Images */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-600" />
                    Document Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ImageCapture
                      label="Jewel Photo"
                      value={jewelPhotoUrl}
                      onChange={setJewelPhotoUrl}
                      folder="jewel-photos"
                      clientId={client?.id || ''}
                    />
                    <ImageCapture
                      label="Appraiser Sheet"
                      value={appraiserSheetUrl}
                      onChange={setAppraiserSheetUrl}
                      folder="appraiser-sheets"
                      clientId={client?.id || ''}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step 2: New Loan Configuration */}
            <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Plus className="h-5 w-5" />
                  New Loan Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Scheme</Label>
                    <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {schemes.map((scheme) => (
                          <SelectItem key={scheme.id} value={scheme.id}>
                            {scheme.scheme_name} ({scheme.shown_rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tenure (Days)</Label>
                    <Input
                      type="number"
                      value={tenureDays}
                      onChange={(e) => setTenureDays(e.target.value)}
                      placeholder="365"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Agent (Optional)</Label>
                    <Select 
                      value={selectedAgentId || "none"} 
                      onValueChange={(val) => setSelectedAgentId(val === "none" ? "" : val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Agent</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name} ({agent.commission_percentage}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Doc Charges %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={userDocumentChargesPercent}
                      onChange={(e) => setUserDocumentChargesPercent(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {newLoanCalc && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* New Loan Calculation */}
                    <div className="bg-green-100/50 dark:bg-green-900/30 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold text-green-800 dark:text-green-300">New Loan Calculation</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Appraised Value</span>
                        <span className="font-medium">{formatIndianCurrency(newLoanCalc.totalAppraisedValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Loan (LTV {newLoanCalc.scheme.ltv_percentage}%)</span>
                        <span className="font-medium">{formatIndianCurrency(newLoanCalc.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal on Record</span>
                        <span className="font-medium">{formatIndianCurrency(newLoanCalc.principalOnRecord)}</span>
                      </div>

                      <div className="pt-2">
                        <Label>Approved Amount (Max: {formatIndianCurrency(newLoanCalc.maxApprovedAmount)})</Label>
                        <Input
                          type="number"
                          value={approvedLoanAmount}
                          onChange={(e) => setApprovedLoanAmount(e.target.value)}
                          placeholder={String(newLoanCalc.principalOnRecord)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Deductions & Disbursement */}
                    <div className="bg-green-100/50 dark:bg-green-900/30 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold text-green-800 dark:text-green-300">Deductions & Disbursement</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approved Amount</span>
                        <span className="font-medium">{formatIndianCurrency(newLoanCalc.finalApprovedAmount)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Less: Advance Interest</span>
                        <span className="font-medium">- {formatIndianCurrency(newLoanCalc.advanceCalc.shownInterest)}</span>
                      </div>
                      {newLoanCalc.documentCharges > 0 && (
                        <div className="flex justify-between text-amber-600">
                          <span>Less: Document Charges</span>
                          <span className="font-medium">- {formatIndianCurrency(newLoanCalc.documentCharges)}</span>
                        </div>
                      )}
                      {newLoanCalc.processingFee > 0 && (
                        <div className="flex justify-between text-amber-600">
                          <span>Less: Processing Fee</span>
                          <span className="font-medium">- {formatIndianCurrency(newLoanCalc.processingFee)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold text-green-800 dark:text-green-300">
                        <span>Net Disbursement</span>
                        <span>{formatIndianCurrency(newLoanCalc.netCashToCustomer)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Net Settlement */}
            {netSettlement && (
              <Card className={`border-2 ${netSettlement.direction === 'to_customer' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'}`}>
                <CardContent className="py-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-muted-foreground">NET SETTLEMENT</h3>
                    
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">New Disbursement</p>
                        <p className="text-xl font-bold text-green-600">{formatIndianCurrency(netSettlement.newDisbursement)}</p>
                      </div>
                      
                      <ArrowRight className="h-8 w-8 text-muted-foreground" />
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Old Settlement</p>
                        <p className="text-xl font-bold text-amber-600">{formatIndianCurrency(netSettlement.oldSettlement)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-center gap-4">
                      {netSettlement.direction === 'to_customer' ? (
                        <ArrowUp className="h-10 w-10 text-green-600" />
                      ) : (
                        <ArrowDown className="h-10 w-10 text-amber-600" />
                      )}
                      <div>
                        <p className="text-3xl font-bold">
                          {netSettlement.direction === 'to_customer' ? '+' : '-'} {formatIndianCurrency(netSettlement.netAmount)}
                        </p>
                        <p className={`text-sm ${netSettlement.direction === 'to_customer' ? 'text-green-600' : 'text-amber-600'}`}>
                          {netSettlement.direction === 'to_customer' 
                            ? 'Amount to Pay to Customer' 
                            : 'Amount to Collect from Customer'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment & Verification */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Payment & Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
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
                    <Label>Reference Number</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Transaction reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional notes"
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Source Account Selection for non-cash payments */}
                <SourceAccountSelector
                  clientId={client?.id || ''}
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
                <Separator />

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="oldLoanSettled"
                      checked={oldLoanSettled}
                      onCheckedChange={(checked) => setOldLoanSettled(checked === true)}
                    />
                    <Label htmlFor="oldLoanSettled" className="cursor-pointer">
                      Old loan settlement confirmed
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="goldVerified"
                      checked={goldVerified}
                      onCheckedChange={(checked) => setGoldVerified(checked === true)}
                    />
                    <Label htmlFor="goldVerified" className="cursor-pointer">
                      Gold items verified (not releasing)
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedLoan(null);
                      setGoldItems([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcessReloan}
                    disabled={submitting || !oldLoanSettled || !goldVerified || !canProcessReloan}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                    Process Reloan
                    {netSettlement && (
                      <span className="ml-2">
                        ({netSettlement.direction === 'to_customer' ? '+' : '-'}{formatIndianCurrency(netSettlement.netAmount)})
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Reloans */}
        {recentReloans.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Reloans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>New Loan #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReloans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        {loan.loan_number}
                        <Badge variant="outline" className="ml-2 text-purple-600 border-purple-600">
                          Reloan
                        </Badge>
                      </TableCell>
                      <TableCell>{loan.customer?.full_name || '-'}</TableCell>
                      <TableCell>{formatIndianCurrency(loan.principal_amount)}</TableCell>
                      <TableCell>{format(parseISO(loan.loan_date), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}