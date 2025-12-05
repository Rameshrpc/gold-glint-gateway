import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Search, Eye, Trash2, ChevronDown, ChevronUp, IndianRupee, Calculator, Package, User, Settings, UserPlus, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { calculateAdvanceInterest, formatIndianCurrency, type AdvanceInterestCalculation } from '@/lib/interestCalculations';
import CustomerSummaryCard from '@/components/loans/CustomerSummaryCard';
import InlineCustomerForm from '@/components/loans/InlineCustomerForm';
import ImageCapture from '@/components/loans/ImageCapture';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
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
  rate_18kt: number | null;
}

interface GoldItem {
  id?: string;
  item_type: string;
  description: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  stone_weight_grams: number;
  market_rate_per_gram: number;
  appraised_value: number;
}

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  shown_principal: number | null;
  actual_principal: number | null;
  advance_interest_shown: number | null;
  advance_interest_actual: number | null;
  differential_capitalized: number | null;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  net_disbursed: number;
  status: 'active' | 'closed' | 'overdue' | 'auctioned';
  customer: Customer;
  scheme: {
    id: string;
    scheme_code: string;
    scheme_name: string;
    interest_rate: number;
    shown_rate: number | null;
    effective_rate: number | null;
    ltv_percentage: number;
  };
  branch_id: string;
}

type GoldItemType = 'necklace' | 'chain' | 'bangle' | 'ring' | 'earring' | 'pendant' | 'coin' | 'bar' | 'other';
type GoldPurity = '24k' | '22k' | '20k' | '18k' | '14k';

const PURITY_MAP: Record<string, number> = {
  '24k': 99.9,
  '22k': 91.6,
  '20k': 83.3,
  '18k': 75.0,
  '14k': 58.5,
};

const ITEM_TYPES = ['necklace', 'chain', 'bangle', 'ring', 'earring', 'pendant', 'coin', 'bar', 'other'];

export default function Loans() {
  const { client, currentBranch, branches, profile, isPlatformAdmin, hasRole } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // New loan form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Image captures
  const [jewelPhotoUrl, setJewelPhotoUrl] = useState<string | null>(null);
  const [appraiserSheetUrl, setAppraiserSheetUrl] = useState<string | null>(null);
  
  // Customer creation dialog
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Current gold item being added
  const [currentItem, setCurrentItem] = useState<Partial<GoldItem>>({
    item_type: '',
    description: '',
    gross_weight_grams: 0,
    stone_weight_grams: 0,
    purity: '22k',
  });
  
  // View loan dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [viewingGoldItems, setViewingGoldItems] = useState<GoldItem[]>([]);

  const canManageLoans = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchLoans();
      fetchCustomers();
      fetchSchemes();
    }
  }, [client]);

  useEffect(() => {
    if (currentBranch) {
      setSelectedBranchId(currentBranch.id);
    }
  }, [currentBranch]);

  const fetchLoans = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, ltv_percentage)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('customers')
      .select('id, customer_code, full_name, phone')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');
    setCustomers(data || []);
  };

  const fetchSchemes = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('schemes')
      .select('id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, rate_18kt')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('scheme_name');
    setSchemes(data || []);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedSchemeId('');
    setSelectedBranchId(currentBranch?.id || '');
    setGoldItems([]);
    setTenureDays('');
    setJewelPhotoUrl(null);
    setAppraiserSheetUrl(null);
    setCurrentItem({
      item_type: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
    });
  };

  // Get rate from selected scheme (18kt converted to 24kt equivalent)
  const getRate24kt = () => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (scheme?.rate_18kt) {
      // 18kt is 75% pure, so rate_24kt = rate_18kt / 0.75
      return scheme.rate_18kt / 0.75;
    }
    return 6000; // fallback
  };

  const addGoldItem = () => {
    if (!currentItem.item_type || !currentItem.gross_weight_grams) {
      toast.error('Please fill item type and weight');
      return;
    }

    if (!selectedSchemeId) {
      toast.error('Please select a scheme first');
      return;
    }

    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme?.rate_18kt) {
      toast.error('Selected scheme does not have 18KT rate configured');
      return;
    }

    const netWeight = currentItem.gross_weight_grams! - (currentItem.stone_weight_grams || 0);
    const purityPercent = PURITY_MAP[currentItem.purity || '22k'];
    const rate24kt = getRate24kt();
    const appraisedValue = netWeight * (purityPercent / 100) * rate24kt;

    const newItem: GoldItem = {
      item_type: currentItem.item_type,
      description: currentItem.description || '',
      gross_weight_grams: currentItem.gross_weight_grams!,
      net_weight_grams: netWeight,
      purity: currentItem.purity || '22k',
      purity_percentage: purityPercent,
      stone_weight_grams: currentItem.stone_weight_grams || 0,
      market_rate_per_gram: rate24kt,
      appraised_value: appraisedValue,
    };

    setGoldItems([...goldItems, newItem]);
    setCurrentItem({
      item_type: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
    });
  };

  const removeGoldItem = (index: number) => {
    setGoldItems(goldItems.filter((_, i) => i !== index));
  };

  // Calculate loan with dual-rate system
  const loanCalculation = useMemo(() => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return null;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    const maxLoanAmount = totalAppraisedValue * (scheme.ltv_percentage / 100);
    const loanAmount = Math.round(Math.min(Math.max(maxLoanAmount, scheme.min_amount), scheme.max_amount));
    const processingFee = Math.round(loanAmount * ((scheme.processing_fee_percentage || 0) / 100));
    
    // Calculate dual-rate advance interest
    const advanceCalc = calculateAdvanceInterest(loanAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate || 18,
      effective_rate: scheme.effective_rate || 24,
      minimum_days: scheme.minimum_days || 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    });

    // Net cash to customer = loan amount - shown interest - processing fee
    const netCashToCustomer = loanAmount - advanceCalc.shownInterest - processingFee;

    return {
      totalAppraisedValue,
      loanAmount,
      processingFee,
      advanceCalc,
      netCashToCustomer,
      scheme,
    };
  }, [goldItems, selectedSchemeId, schemes]);

  const generateLoanNumber = () => {
    const prefix = 'GL';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  };

  const handleCreateLoan = async () => {
    if (!client || !selectedBranchId || !selectedCustomerId || !selectedSchemeId || goldItems.length === 0 || !tenureDays || !loanCalculation) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const loanDate = new Date();
      const maturityDate = addDays(loanDate, parseInt(tenureDays));
      const nextInterestDueDate = addMonths(loanDate, loanCalculation.scheme.advance_interest_months || 3);

      const loanData = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        loan_number: generateLoanNumber(),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanCalculation.loanAmount,
        shown_principal: loanCalculation.loanAmount,
        actual_principal: loanCalculation.advanceCalc.actualPrincipal, // Principal + differential
        interest_rate: loanCalculation.scheme.shown_rate || 18,
        tenure_days: parseInt(tenureDays),
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        processing_fee: loanCalculation.processingFee,
        net_disbursed: loanCalculation.netCashToCustomer,
        advance_interest_shown: loanCalculation.advanceCalc.shownInterest,
        advance_interest_actual: loanCalculation.advanceCalc.actualInterest,
        differential_capitalized: loanCalculation.advanceCalc.differential,
        next_interest_due_date: format(nextInterestDueDate, 'yyyy-MM-dd'),
        last_interest_paid_date: format(loanDate, 'yyyy-MM-dd'), // Advance interest counts as paid
        created_by: profile?.id,
        appraised_by: profile?.id,
        jewel_photo_url: jewelPhotoUrl,
        appraiser_sheet_url: appraiserSheetUrl,
      };

      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (loanError) throw loanError;

      // Insert gold items
      const goldItemsData = goldItems.map(item => ({
        loan_id: loanResult.id,
        item_type: item.item_type as GoldItemType,
        description: item.description,
        gross_weight_grams: item.gross_weight_grams,
        net_weight_grams: item.net_weight_grams,
        purity: item.purity as GoldPurity,
        purity_percentage: item.purity_percentage,
        stone_weight_grams: item.stone_weight_grams,
        market_rate_per_gram: item.market_rate_per_gram,
        appraised_value: item.appraised_value,
      }));

      const { error: itemsError } = await supabase
        .from('gold_items')
        .insert(goldItemsData);

      if (itemsError) throw itemsError;

      toast.success(`Loan ${loanResult.loan_number} created successfully`);
      setIsFormOpen(false);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create loan');
    } finally {
      setSubmitting(false);
    }
  };

  const viewLoanDetails = async (loan: Loan) => {
    setViewingLoan(loan);
    const { data } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', loan.id);
    setViewingGoldItems(data || []);
    setViewDialogOpen(true);
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      case 'overdue': return 'bg-red-500';
      case 'auctioned': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.branch_name || 'Unknown';
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loans</h1>
            <p className="text-muted-foreground">Manage gold loans and disbursements</p>
          </div>
          {canManageLoans && (
            <Button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isFormOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isFormOpen ? 'Close Form' : 'New Loan'}
            </Button>
          )}
        </div>

        {/* New Loan Form - Collapsible Single Page */}
        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <CollapsibleContent>
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-600" />
                  Create New Loan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section 1: Customer & Branch */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-amber-600" />
                    Customer & Branch
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer *</Label>
                      <div className="flex gap-2">
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.customer_code} - {customer.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCustomerDialog(true)}
                          className="shrink-0"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch *</Label>
                      <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.filter(b => b.is_active).map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Customer Summary Card */}
                  {selectedCustomerId && (
                    <CustomerSummaryCard customerId={selectedCustomerId} />
                  )}
                </div>

                <Separator />

                {/* Section 2: Scheme Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-amber-600" />
                    Scheme Selection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {schemes.map((scheme) => (
                      <Card 
                        key={scheme.id} 
                        className={`cursor-pointer transition-all ${selectedSchemeId === scheme.id ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-muted/50'}`}
                        onClick={() => { setSelectedSchemeId(scheme.id); setGoldItems([]); }}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{scheme.scheme_name}</p>
                              <p className="text-xs text-muted-foreground">{scheme.scheme_code}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">LTV {scheme.ltv_percentage}%</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Shown Rate</p>
                              <p className="font-medium text-green-600">{scheme.shown_rate}% p.a.</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">18KT Rate</p>
                              <p className="font-medium text-amber-600">{scheme.rate_18kt ? `₹${scheme.rate_18kt}/g` : 'Not set'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Section 3: Gold Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-amber-600" />
                      Gold Item Appraisal
                    </h3>
                    {selectedSchemeId && schemes.find(s => s.id === selectedSchemeId)?.rate_18kt && (
                      <Badge variant="outline" className="text-amber-600">
                        Using 18KT Rate: ₹{schemes.find(s => s.id === selectedSchemeId)?.rate_18kt}/g
                      </Badge>
                    )}
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Item Type *</Label>
                          <Select value={currentItem.item_type} onValueChange={(v) => setCurrentItem({...currentItem, item_type: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_TYPES.map(type => (
                                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gross Weight (g) *</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={currentItem.gross_weight_grams || ''}
                            onChange={(e) => setCurrentItem({...currentItem, gross_weight_grams: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stone Weight (g)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={currentItem.stone_weight_grams || ''}
                            onChange={(e) => setCurrentItem({...currentItem, stone_weight_grams: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Purity</Label>
                          <Select value={currentItem.purity} onValueChange={(v) => setCurrentItem({...currentItem, purity: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PURITY_MAP).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{k} ({v}%)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={currentItem.description || ''}
                            onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={addGoldItem} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </CardContent>
                  </Card>

                  {goldItems.length > 0 && (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Net Wt (g)</TableHead>
                              <TableHead>Purity</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goldItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="capitalize">{item.item_type}</TableCell>
                                <TableCell>{item.net_weight_grams.toFixed(3)}</TableCell>
                                <TableCell>{item.purity}</TableCell>
                                <TableCell className="text-right">{formatIndianCurrency(item.appraised_value)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => removeGoldItem(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={3} className="font-semibold">Total Appraised Value</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatIndianCurrency(goldItems.reduce((sum, item) => sum + item.appraised_value, 0))}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Section 4: Loan Calculation - Dual View */}
                {loanCalculation && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Calculator className="h-4 w-4 text-amber-600" />
                      Loan Calculation
                    </h3>

                    <div className="space-y-2">
                      <Label>Tenure (days) *</Label>
                      <Input
                        type="number"
                        value={tenureDays}
                        onChange={(e) => setTenureDays(e.target.value)}
                        placeholder={`${loanCalculation.scheme.min_tenure_days} - ${loanCalculation.scheme.max_tenure_days} days`}
                        min={loanCalculation.scheme.min_tenure_days}
                        max={loanCalculation.scheme.max_tenure_days}
                        className="w-48"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer Receipt View */}
                      <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" />
                            Customer Receipt
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">What customer sees</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Principal Amount</span>
                            <span className="font-medium">{formatIndianCurrency(loanCalculation.loanAmount)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Interest Rate</span>
                            <span>{loanCalculation.scheme.shown_rate}% p.a.</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Advance Interest ({loanCalculation.scheme.advance_interest_months} mo)</span>
                            <span>-{formatIndianCurrency(loanCalculation.advanceCalc.shownInterest)}</span>
                          </div>
                          {loanCalculation.processingFee > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Processing Fee</span>
                              <span>-{formatIndianCurrency(loanCalculation.processingFee)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg text-green-700 dark:text-green-400">
                            <span>Net Cash to Customer</span>
                            <span>{formatIndianCurrency(loanCalculation.netCashToCustomer)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Internal Accounting View */}
                      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Internal Accounting
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Books entry (hidden from customer)</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Original Principal</span>
                            <span className="font-medium">{formatIndianCurrency(loanCalculation.loanAmount)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Effective Rate</span>
                            <span>{loanCalculation.scheme.effective_rate}% p.a.</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Advance Interest (Actual)</span>
                            <span>{formatIndianCurrency(loanCalculation.advanceCalc.actualInterest)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>Differential Added to Principal</span>
                            <span>+{formatIndianCurrency(loanCalculation.advanceCalc.differential)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg text-amber-700 dark:text-amber-400">
                            <span>Actual Principal (Books)</span>
                            <span>{formatIndianCurrency(loanCalculation.advanceCalc.actualPrincipal)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {tenureDays && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Maturity Date:</span> {format(addDays(new Date(), parseInt(tenureDays)), 'dd MMM yyyy')}
                        <span className="mx-4">|</span>
                        <span className="font-medium">Next Interest Due:</span> {format(addMonths(new Date(), loanCalculation.scheme.advance_interest_months || 3), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 5: Loan Images */}
                {client && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-amber-600" />
                      Loan Images
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageCapture
                        label="Jewel Photo *"
                        value={jewelPhotoUrl}
                        onChange={setJewelPhotoUrl}
                        folder="jewel-photos"
                        clientId={client.id}
                      />
                      <ImageCapture
                        label="Appraiser Sheet *"
                        value={appraiserSheetUrl}
                        onChange={setAppraiserSheetUrl}
                        folder="appraiser-sheets"
                        clientId={client.id}
                      />
                    </div>
                  </div>
                )}

                {/* Create Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateLoan} 
                    disabled={submitting || !selectedCustomerId || !selectedSchemeId || !selectedBranchId || goldItems.length === 0 || !tenureDays}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {submitting ? 'Creating...' : 'Create Loan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Inline Customer Creation Dialog */}
        {client && (
          <InlineCustomerForm
            open={showCustomerDialog}
            onClose={() => setShowCustomerDialog(false)}
            onCustomerCreated={(customerId) => {
              setSelectedCustomerId(customerId);
              fetchCustomers();
            }}
            clientId={client.id}
            branches={branches}
            defaultBranchId={selectedBranchId}
          />
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by loan number, customer name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="auctioned">Auctioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loan List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        ) : filteredLoans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No Loans Found' : 'No Loans Yet'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first gold loan to get started.'}
              </p>
              {!searchQuery && statusFilter === 'all' && canManageLoans && (
                <Button onClick={() => setIsFormOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Loan
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Loan List ({filteredLoans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Actual Principal</TableHead>
                      <TableHead>Maturity</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_number}</TableCell>
                        <TableCell>
                          <div>
                            <p>{loan.customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{loan.customer.customer_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p>{formatIndianCurrency(loan.principal_amount)}</p>
                          <p className="text-xs text-muted-foreground">@{loan.scheme.shown_rate || loan.interest_rate}% p.a.</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-amber-600 font-medium">{formatIndianCurrency(loan.actual_principal || loan.principal_amount)}</p>
                        </TableCell>
                        <TableCell>{format(new Date(loan.maturity_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{getBranchName(loan.branch_id)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(loan.status)} text-white`}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => viewLoanDetails(loan)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* View Loan Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loan Details - {viewingLoan?.loan_number}</DialogTitle>
            </DialogHeader>
            
            {viewingLoan && (
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customer">Customer View</TabsTrigger>
                  <TabsTrigger value="internal">Internal View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Customer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{viewingLoan.customer.full_name}</p>
                        <p className="text-sm text-muted-foreground">{viewingLoan.customer.customer_code} • {viewingLoan.customer.phone}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Scheme</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{viewingLoan.scheme.scheme_name}</p>
                        <p className="text-sm text-muted-foreground">@{viewingLoan.scheme.shown_rate || viewingLoan.interest_rate}% p.a.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Loan Summary (Customer Receipt)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Principal Amount</span>
                        <span className="font-medium">{formatIndianCurrency(viewingLoan.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Advance Interest Deducted</span>
                        <span>-{formatIndianCurrency(viewingLoan.advance_interest_shown || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Net Cash Paid</span>
                        <span className="text-green-600">{formatIndianCurrency(viewingLoan.net_disbursed)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="internal" className="space-y-4">
                  <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-amber-700 dark:text-amber-400">Internal Accounting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Original Principal</span>
                        <span>{formatIndianCurrency(viewingLoan.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Interest (Shown @18%)</span>
                        <span>{formatIndianCurrency(viewingLoan.advance_interest_shown || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Interest (Actual)</span>
                        <span>{formatIndianCurrency(viewingLoan.advance_interest_actual || 0)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Differential Added to Principal</span>
                        <span>+{formatIndianCurrency(viewingLoan.differential_capitalized || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Actual Principal (Books)</span>
                        <span className="text-amber-600">{formatIndianCurrency(viewingLoan.actual_principal || viewingLoan.principal_amount)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {viewingGoldItems.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Gold Items ({viewingGoldItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Net Weight</TableHead>
                        <TableHead>Purity</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingGoldItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="capitalize">{item.item_type}</TableCell>
                          <TableCell>{item.net_weight_grams.toFixed(3)}g</TableCell>
                          <TableCell>{item.purity}</TableCell>
                          <TableCell className="text-right">{formatIndianCurrency(item.appraised_value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}