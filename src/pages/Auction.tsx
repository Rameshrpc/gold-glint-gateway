import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, Gavel, AlertTriangle, Package, IndianRupee, 
  Calendar, User, CheckCircle, XCircle, FileText, TrendingUp, TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { 
  calculateDualRateInterest, 
  getDaysBetween, 
  formatIndianCurrency 
} from '@/lib/interestCalculations';
import { PrintReceiptDialog, AuctionReceipt } from '@/components/print';
import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { useSourceAccount } from '@/hooks/useSourceAccount';
import { checkRepledgeStatus, showRepledgeWarning } from '@/hooks/useRepledgeCheck';
import { generateAuctionVoucher } from '@/hooks/useVoucherGeneration';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address: string | null;
}

interface Scheme {
  id: string;
  scheme_name: string;
  shown_rate: number;
  effective_rate: number | null;
  penalty_rate: number | null;
  grace_period_days: number | null;
  minimum_days: number;
}

interface GoldItem {
  id: string;
  item_type: string;
  purity: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  appraised_value: number;
}

interface EligibleLoan {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  actual_principal: number | null;
  status: string;
  customer: Customer;
  scheme: Scheme;
  gold_items: GoldItem[];
  branch_id: string;
  client_id: string;
  differential_capitalized: number | null;
}

interface Auction {
  id: string;
  auction_lot_number: string;
  auction_date: string;
  outstanding_principal: number;
  outstanding_interest: number;
  outstanding_penalty: number;
  total_outstanding: number;
  total_gold_weight_grams: number;
  total_appraised_value: number;
  reserve_price: number;
  sold_price: number | null;
  buyer_name: string | null;
  surplus_amount: number;
  shortfall_amount: number;
  status: string;
  loan: {
    loan_number: string;
    customer: Customer;
  };
}

const Auction = () => {
  const { user, profile, isPlatformAdmin, hasRole } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('eligible');
  const [eligibleLoans, setEligibleLoans] = useState<EligibleLoan[]>([]);
  const [scheduledAuctions, setScheduledAuctions] = useState<Auction[]>([]);
  const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected loan for processing
  const [selectedLoan, setSelectedLoan] = useState<EligibleLoan | null>(null);
  
  // Auction form state
  const [auctionDate, setAuctionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [soldPrice, setSoldPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [customerNotified, setCustomerNotified] = useState(false);
  const [goldVerified, setGoldVerified] = useState(false);
  const [remarks, setRemarks] = useState('');
  
  // Source account tracking
  const sourceAccount = useSourceAccount();
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  
  // PDF state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [auctionForPdf, setAuctionForPdf] = useState<any>(null);

  const canProcessAuction = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    fetchEligibleLoans();
    fetchAuctions();
  }, [profile]);

  const fetchEligibleLoans = async () => {
    if (!profile?.client_id) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch loans that are overdue or past maturity
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          loan_number,
          loan_date,
          maturity_date,
          principal_amount,
          actual_principal,
          status,
          branch_id,
          client_id,
          differential_capitalized,
          customer:customers(id, customer_code, full_name, phone, address),
          scheme:schemes(id, scheme_name, shown_rate, effective_rate, penalty_rate, grace_period_days, minimum_days),
          gold_items(id, item_type, purity, gross_weight_grams, net_weight_grams, appraised_value)
        `)
        .eq('client_id', profile.client_id)
        .in('status', ['active', 'overdue'])
        .lte('maturity_date', today)
        .order('maturity_date', { ascending: true });

      if (error) throw error;
      
      // Transform and calculate days overdue
      const loans = (data || []).map((loan: any) => ({
        ...loan,
        customer: loan.customer,
        scheme: loan.scheme,
        gold_items: loan.gold_items || [],
      }));
      
      setEligibleLoans(loans);
    } catch (error: any) {
      console.error('Error fetching eligible loans:', error);
      toast.error('Failed to fetch eligible loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    if (!profile?.client_id) return;
    
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          loan:loans(
            loan_number,
            customer:customers(id, customer_code, full_name, phone, address)
          )
        `)
        .eq('client_id', profile.client_id)
        .order('auction_date', { ascending: false });

      if (error) throw error;
      
      const auctions = (data || []).map((a: any) => ({
        ...a,
        loan: {
          loan_number: a.loan?.loan_number || '',
          customer: a.loan?.customer || null,
        },
      }));
      
      setScheduledAuctions(auctions.filter((a: Auction) => a.status === 'scheduled'));
      setCompletedAuctions(auctions.filter((a: Auction) => a.status === 'completed'));
    } catch (error: any) {
      console.error('Error fetching auctions:', error);
    }
  };

  const calculateOutstanding = (loan: EligibleLoan) => {
    const daysSinceLoan = getDaysBetween(loan.loan_date, new Date());
    const actualPrincipal = loan.actual_principal || loan.principal_amount;
    
    const scheme = {
      ...loan.scheme,
      effective_rate: loan.scheme.effective_rate || loan.scheme.shown_rate * 1.5,
      advance_interest_months: 3,
    };
    
    const interestCalc = calculateDualRateInterest(
      actualPrincipal,
      scheme,
      daysSinceLoan,
      loan.scheme.grace_period_days || 7
    );
    
    return {
      principal: actualPrincipal,
      interest: interestCalc.shownInterest + interestCalc.differential,
      penalty: interestCalc.penalty,
      total: actualPrincipal + interestCalc.totalDue,
    };
  };

  const selectLoanForAuction = async (loan: EligibleLoan) => {
    // Check if loan is repledged
    const repledgeStatus = await checkRepledgeStatus(loan.id);
    if (repledgeStatus.isRepledged) {
      showRepledgeWarning(repledgeStatus.packetNumber!);
      return;
    }
    
    setSelectedLoan(loan);
    // Reset form
    setAuctionDate(format(new Date(), 'yyyy-MM-dd'));
    setSoldPrice('');
    setBuyerName('');
    setBuyerContact('');
    setBuyerAddress('');
    setPaymentMode('cash');
    setPaymentReference('');
    setCustomerNotified(false);
    setGoldVerified(false);
    setRemarks('');
    sourceAccount.resetSourceAccount();
  };

  const processAuction = async () => {
    if (!selectedLoan || !profile?.client_id || !user) return;
    
    if (!soldPrice || parseFloat(soldPrice) <= 0) {
      toast.error('Please enter a valid sold price');
      return;
    }
    
    if (!buyerName.trim()) {
      toast.error('Please enter buyer name');
      return;
    }
    
    if (!customerNotified) {
      toast.error('Please confirm customer was notified');
      return;
    }
    
    if (!goldVerified) {
      toast.error('Please verify gold items');
      return;
    }
    
    try {
      setProcessing(true);
      
      const outstanding = calculateOutstanding(selectedLoan);
      const soldPriceNum = parseFloat(soldPrice);
      const totalGoldWeight = selectedLoan.gold_items.reduce((sum, item) => sum + item.gross_weight_grams, 0);
      const totalAppraisedValue = selectedLoan.gold_items.reduce((sum, item) => sum + item.appraised_value, 0);
      
      // Calculate surplus or shortfall
      const surplus = soldPriceNum > outstanding.total ? soldPriceNum - outstanding.total : 0;
      const shortfall = soldPriceNum < outstanding.total ? outstanding.total - soldPriceNum : 0;
      
      // Generate auction lot number
      const { data: lotNumber, error: lotError } = await supabase
        .rpc('generate_auction_lot_number', { p_client_id: profile.client_id });
      
      if (lotError) throw lotError;
      
      // Get source account data
      const sourceData = sourceAccount.getSourceAccountData(paymentMode);
      
      // Create auction record
      const auctionData = {
        client_id: profile.client_id,
        branch_id: selectedLoan.branch_id,
        loan_id: selectedLoan.id,
        auction_lot_number: lotNumber,
        auction_date: auctionDate,
        outstanding_principal: outstanding.principal,
        outstanding_interest: outstanding.interest,
        outstanding_penalty: outstanding.penalty,
        total_outstanding: outstanding.total,
        total_gold_weight_grams: totalGoldWeight,
        total_appraised_value: totalAppraisedValue,
        reserve_price: outstanding.total,
        sold_price: soldPriceNum,
        buyer_name: buyerName,
        buyer_contact: buyerContact || null,
        buyer_address: buyerAddress || null,
        payment_mode: paymentMode,
        payment_reference: paymentReference || null,
        surplus_amount: surplus,
        shortfall_amount: shortfall,
        status: 'completed',
        customer_notified: customerNotified,
        gold_verified: goldVerified,
        processed_by: profile.id,
        remarks: remarks || null,
        source_type: sourceData.source_type,
        source_bank_id: sourceData.source_bank_id,
        source_account_id: sourceData.source_account_id,
      };
      
      const { data: auctionResult, error: auctionError } = await supabase
        .from('auctions')
        .insert(auctionData)
        .select()
        .single();
      
      if (auctionError) throw auctionError;
      
      // Update loan status to auctioned
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: 'auctioned',
          closure_type: 'auctioned',
          closed_date: auctionDate,
        })
        .eq('id', selectedLoan.id);
      
      if (loanError) throw loanError;

      // Generate accounting voucher
      await generateAuctionVoucher({
        clientId: profile.client_id,
        branchId: selectedLoan.branch_id,
        auctionId: auctionResult.id,
        loanNumber: selectedLoan.loan_number,
        soldPrice: soldPriceNum,
        principalAmount: outstanding.principal,
        interestAmount: outstanding.interest,
        penaltyAmount: outstanding.penalty,
        surplusAmount: surplus,
        shortfallAmount: shortfall,
      });
      
      toast.success(`Auction completed! Lot #${lotNumber}`);
      
      // Prepare PDF data
      setAuctionForPdf({
        auction: auctionResult,
        loan: selectedLoan,
        customer: selectedLoan.customer,
        goldItems: selectedLoan.gold_items,
        surplus,
        shortfall,
        company: {
          name: 'Your Company Name',
          address: 'Company Address',
        },
      });
      setPdfDialogOpen(true);
      
      // Reset and refresh
      setSelectedLoan(null);
      fetchEligibleLoans();
      fetchAuctions();
      
    } catch (error: any) {
      console.error('Error processing auction:', error);
      toast.error(error.message || 'Failed to process auction');
    } finally {
      setProcessing(false);
    }
  };

  const getDaysOverdue = (maturityDate: string) => {
    return differenceInDays(new Date(), new Date(maturityDate));
  };

  const filteredLoans = eligibleLoans.filter(loan => 
    loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOutstanding = selectedLoan ? calculateOutstanding(selectedLoan) : null;
  const selectedTotalGoldWeight = selectedLoan ? selectedLoan.gold_items.reduce((sum, item) => sum + item.gross_weight_grams, 0) : 0;
  const selectedTotalAppraisedValue = selectedLoan ? selectedLoan.gold_items.reduce((sum, item) => sum + item.appraised_value, 0) : 0;
  
  const soldPriceNum = parseFloat(soldPrice) || 0;
  const surplusAmount = selectedOutstanding && soldPriceNum > selectedOutstanding.total ? soldPriceNum - selectedOutstanding.total : 0;
  const shortfallAmount = selectedOutstanding && soldPriceNum < selectedOutstanding.total && soldPriceNum > 0 ? selectedOutstanding.total - soldPriceNum : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auction Management</h1>
            <p className="text-muted-foreground">Manage overdue loans and gold auctions for recovery</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Gavel className="h-5 w-5 mr-2" />
            {eligibleLoans.length} Eligible for Auction
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="eligible" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Eligible Loans ({eligibleLoans.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled ({scheduledAuctions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedAuctions.length})
            </TabsTrigger>
          </TabsList>

          {/* Eligible Loans Tab */}
          <TabsContent value="eligible" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by loan number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Eligible Loans List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Overdue / Matured Loans
                  </CardTitle>
                  <CardDescription>Select a loan to process auction</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredLoans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No eligible loans for auction
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredLoans.map((loan) => {
                        const daysOverdue = getDaysOverdue(loan.maturity_date);
                        const outstanding = calculateOutstanding(loan);
                        const isSelected = selectedLoan?.id === loan.id;
                        
                        return (
                          <div
                            key={loan.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => selectLoanForAuction(loan)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{loan.loan_number}</p>
                                <p className="text-sm text-muted-foreground">{loan.customer?.full_name}</p>
                              </div>
                              <Badge variant="destructive">
                                {daysOverdue} days overdue
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Principal:</span>{' '}
                                {formatIndianCurrency(outstanding.principal)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Outstanding:</span>{' '}
                                <span className="font-semibold text-destructive">
                                  {formatIndianCurrency(outstanding.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auction Processing Form */}
              {selectedLoan ? (
                <div className="space-y-4">
                  {/* Loan Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Loan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Customer:</span>
                          <p className="font-medium">{selectedLoan.customer?.full_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Loan Number:</span>
                          <p className="font-medium">{selectedLoan.loan_number}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Loan Date:</span>
                          <p className="font-medium">{format(new Date(selectedLoan.loan_date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Maturity Date:</span>
                          <p className="font-medium">{format(new Date(selectedLoan.maturity_date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Overdue:</span>
                          <p className="font-medium text-destructive">{getDaysOverdue(selectedLoan.maturity_date)} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Scheme:</span>
                          <p className="font-medium">{selectedLoan.scheme?.scheme_name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gold Items */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Gold Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Purity</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLoan.gold_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="capitalize">{item.item_type}</TableCell>
                              <TableCell>{item.purity}</TableCell>
                              <TableCell className="text-right">{item.gross_weight_grams}g</TableCell>
                              <TableCell className="text-right">{formatIndianCurrency(item.appraised_value)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-semibold bg-muted/50">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">{selectedTotalGoldWeight.toFixed(2)}g</TableCell>
                            <TableCell className="text-right">{formatIndianCurrency(selectedTotalAppraisedValue)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Outstanding Calculation */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" />
                        Outstanding Calculation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedOutstanding && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal</span>
                            <span>{formatIndianCurrency(selectedOutstanding.principal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Due</span>
                            <span>{formatIndianCurrency(selectedOutstanding.interest)}</span>
                          </div>
                          {selectedOutstanding.penalty > 0 && (
                            <div className="flex justify-between text-destructive">
                              <span>Penalty</span>
                              <span>{formatIndianCurrency(selectedOutstanding.penalty)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Total Outstanding</span>
                            <span className="text-destructive">{formatIndianCurrency(selectedOutstanding.total)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground pt-2">
                            <span>Reserve Price (Minimum)</span>
                            <span>{formatIndianCurrency(selectedOutstanding.total)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Auction Details Form */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        Auction Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Auction Date</Label>
                          <Input
                            type="date"
                            value={auctionDate}
                            onChange={(e) => setAuctionDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sold Price *</Label>
                          <Input
                            type="number"
                            placeholder="Enter sold price"
                            value={soldPrice}
                            onChange={(e) => setSoldPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Buyer Name *</Label>
                          <Input
                            placeholder="Enter buyer name"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Buyer Contact</Label>
                          <Input
                            placeholder="Phone number"
                            value={buyerContact}
                            onChange={(e) => setBuyerContact(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Buyer Address</Label>
                          <Textarea
                            placeholder="Enter buyer address"
                            value={buyerAddress}
                            onChange={(e) => setBuyerAddress(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Mode</Label>
                          <Select value={paymentMode} onValueChange={setPaymentMode}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="neft">NEFT</SelectItem>
                              <SelectItem value="rtgs">RTGS</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Reference</Label>
                          <Input
                            placeholder="Transaction ID / Cheque No."
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Source Account Selector */}
                      {profile?.client_id && (
                        <SourceAccountSelector
                          clientId={profile.client_id}
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

                      {/* Settlement Summary */}
                      {soldPriceNum > 0 && selectedOutstanding && (
                        <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                          <h4 className="font-semibold">Settlement Summary</h4>
                          <div className="flex justify-between">
                            <span>Sold Price</span>
                            <span className="font-medium">{formatIndianCurrency(soldPriceNum)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Outstanding</span>
                            <span>{formatIndianCurrency(selectedOutstanding.total)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            {surplusAmount > 0 ? (
                              <div className="flex justify-between text-green-600 font-bold">
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  Surplus (Return to Customer)
                                </span>
                                <span>{formatIndianCurrency(surplusAmount)}</span>
                              </div>
                            ) : shortfallAmount > 0 ? (
                              <div className="flex justify-between text-destructive font-bold">
                                <span className="flex items-center gap-1">
                                  <TrendingDown className="h-4 w-4" />
                                  Shortfall (Loss)
                                </span>
                                <span>{formatIndianCurrency(shortfallAmount)}</span>
                              </div>
                            ) : (
                              <div className="flex justify-between font-bold">
                                <span>Exact Settlement</span>
                                <span>₹0</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Verification Checkboxes */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="customerNotified"
                            checked={customerNotified}
                            onCheckedChange={(checked) => setCustomerNotified(checked as boolean)}
                          />
                          <Label htmlFor="customerNotified" className="cursor-pointer">
                            Customer was notified about the auction
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="goldVerified"
                            checked={goldVerified}
                            onCheckedChange={(checked) => setGoldVerified(checked as boolean)}
                          />
                          <Label htmlFor="goldVerified" className="cursor-pointer">
                            Gold items verified before auction
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                          placeholder="Any additional notes..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={processAuction}
                        disabled={processing || !canProcessAuction}
                        className="w-full"
                        size="lg"
                      >
                        {processing ? (
                          'Processing...'
                        ) : (
                          <>
                            <Gavel className="h-5 w-5 mr-2" />
                            Complete Auction
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="flex items-center justify-center min-h-[400px]">
                  <CardContent className="text-center text-muted-foreground">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a loan from the list to process auction</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Scheduled Auctions Tab */}
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Auctions</CardTitle>
                <CardDescription>Auctions pending completion</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledAuctions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scheduled auctions
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot #</TableHead>
                        <TableHead>Loan #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Auction Date</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">Reserve Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledAuctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell className="font-medium">{auction.auction_lot_number}</TableCell>
                          <TableCell>{auction.loan?.loan_number}</TableCell>
                          <TableCell>{auction.loan?.customer?.full_name}</TableCell>
                          <TableCell>{format(new Date(auction.auction_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">{formatIndianCurrency(auction.total_outstanding)}</TableCell>
                          <TableCell className="text-right">{formatIndianCurrency(auction.reserve_price)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Scheduled</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Auctions Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Auctions</CardTitle>
                <CardDescription>History of completed auctions</CardDescription>
              </CardHeader>
              <CardContent>
                {completedAuctions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed auctions
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot #</TableHead>
                        <TableHead>Loan #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Auction Date</TableHead>
                        <TableHead className="text-right">Sold For</TableHead>
                        <TableHead className="text-right">Surplus/Shortfall</TableHead>
                        <TableHead>Buyer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedAuctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell className="font-medium">{auction.auction_lot_number}</TableCell>
                          <TableCell>{auction.loan?.loan_number}</TableCell>
                          <TableCell>{auction.loan?.customer?.full_name}</TableCell>
                          <TableCell>{format(new Date(auction.auction_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">{formatIndianCurrency(auction.sold_price || 0)}</TableCell>
                          <TableCell className="text-right">
                            {auction.surplus_amount > 0 ? (
                              <span className="text-green-600 flex items-center justify-end gap-1">
                                <TrendingUp className="h-4 w-4" />
                                +{formatIndianCurrency(auction.surplus_amount)}
                              </span>
                            ) : auction.shortfall_amount > 0 ? (
                              <span className="text-destructive flex items-center justify-end gap-1">
                                <TrendingDown className="h-4 w-4" />
                                -{formatIndianCurrency(auction.shortfall_amount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">₹0</span>
                            )}
                          </TableCell>
                          <TableCell>{auction.buyer_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Dialog */}
      {auctionForPdf && (
        <PDFViewerDialog
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
          title="Auction Settlement Receipt"
          document={<AuctionReceiptPDF data={auctionForPdf} />}
          fileName={`Auction-${auctionForPdf.auction?.auction_lot_number || 'Receipt'}.pdf`}
        />
      )}
    </DashboardLayout>
  );
};

export default Auction;
