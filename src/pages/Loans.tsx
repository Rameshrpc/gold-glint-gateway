import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Search, Eye, User, Settings, Package, Calculator, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
}

interface SchemeBase {
  id: string;
  scheme_code: string;
  scheme_name: string;
  interest_rate: number;
  ltv_percentage: number;
}

interface Scheme extends SchemeBase {
  min_amount: number;
  max_amount: number;
  min_tenure_days: number;
  max_tenure_days: number;
  processing_fee_percentage: number | null;
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
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  net_disbursed: number;
  status: 'active' | 'closed' | 'overdue' | 'auctioned';
  customer: Customer;
  scheme: SchemeBase;
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

const ITEM_TYPES = [
  'necklace', 'chain', 'bangle', 'ring', 'earring', 'pendant', 'coin', 'bar', 'other'
];

export default function Loans() {
  const { client, currentBranch, branches, profile, isPlatformAdmin, hasRole } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [viewingGoldItems, setViewingGoldItems] = useState<GoldItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [marketRate, setMarketRate] = useState('6000');
  const [loanAmount, setLoanAmount] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [netDisbursed, setNetDisbursed] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Current gold item being added
  const [currentItem, setCurrentItem] = useState<Partial<GoldItem>>({
    item_type: '',
    description: '',
    gross_weight_grams: 0,
    stone_weight_grams: 0,
    purity: '22k',
    market_rate_per_gram: 6000,
  });

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
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, ltv_percentage)
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
      .select('id, scheme_code, scheme_name, interest_rate, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('scheme_name');
    setSchemes(data || []);
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedCustomerId('');
    setSelectedSchemeId('');
    setSelectedBranchId(currentBranch?.id || '');
    setGoldItems([]);
    setTenureDays('');
    setLoanAmount(0);
    setProcessingFee(0);
    setNetDisbursed(0);
    setCurrentItem({
      item_type: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
      market_rate_per_gram: 6000,
    });
  };

  const addGoldItem = () => {
    if (!currentItem.item_type || !currentItem.gross_weight_grams) {
      toast.error('Please fill item type and weight');
      return;
    }

    const netWeight = currentItem.gross_weight_grams! - (currentItem.stone_weight_grams || 0);
    const purityPercent = PURITY_MAP[currentItem.purity || '22k'];
    const rate = parseFloat(marketRate);
    const appraisedValue = netWeight * (purityPercent / 100) * rate;

    const newItem: GoldItem = {
      item_type: currentItem.item_type,
      description: currentItem.description || '',
      gross_weight_grams: currentItem.gross_weight_grams!,
      net_weight_grams: netWeight,
      purity: currentItem.purity || '22k',
      purity_percentage: purityPercent,
      stone_weight_grams: currentItem.stone_weight_grams || 0,
      market_rate_per_gram: rate,
      appraised_value: appraisedValue,
    };

    setGoldItems([...goldItems, newItem]);
    setCurrentItem({
      item_type: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
      market_rate_per_gram: parseFloat(marketRate),
    });
  };

  const removeGoldItem = (index: number) => {
    setGoldItems(goldItems.filter((_, i) => i !== index));
  };

  const calculateLoan = () => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    const maxLoanAmount = totalAppraisedValue * (scheme.ltv_percentage / 100);
    const clampedAmount = Math.min(Math.max(maxLoanAmount, scheme.min_amount), scheme.max_amount);
    const fee = clampedAmount * ((scheme.processing_fee_percentage || 0) / 100);
    
    setLoanAmount(Math.round(clampedAmount));
    setProcessingFee(Math.round(fee));
    setNetDisbursed(Math.round(clampedAmount - fee));
  };

  useEffect(() => {
    calculateLoan();
  }, [goldItems, selectedSchemeId]);

  const generateLoanNumber = () => {
    const prefix = 'GL';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  };

  const handleCreateLoan = async () => {
    if (!client || !selectedBranchId || !selectedCustomerId || !selectedSchemeId || goldItems.length === 0 || !tenureDays) {
      toast.error('Please complete all required fields');
      return;
    }

    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme) return;

    setSubmitting(true);
    try {
      const loanDate = new Date();
      const maturityDate = addDays(loanDate, parseInt(tenureDays));

      const loanData = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        loan_number: generateLoanNumber(),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanAmount,
        interest_rate: scheme.interest_rate,
        tenure_days: parseInt(tenureDays),
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        processing_fee: processingFee,
        net_disbursed: netDisbursed,
        created_by: profile?.id,
        appraised_by: profile?.id,
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
      setDialogOpen(false);
      resetWizard();
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

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loans</h1>
            <p className="text-muted-foreground">Manage gold loans and disbursements</p>
          </div>
          {canManageLoans && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetWizard(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Loan</DialogTitle>
                </DialogHeader>

                {/* Wizard Steps */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        wizardStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Select Customer */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold">Step 1: Select Customer</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Customer *</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger>
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
                    <div className="flex justify-end">
                      <Button onClick={() => setWizardStep(2)} disabled={!selectedCustomerId || !selectedBranchId}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Scheme */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold">Step 2: Select Scheme</h3>
                    </div>
                    <div className="grid gap-3">
                      {schemes.map((scheme) => (
                        <Card 
                          key={scheme.id} 
                          className={`cursor-pointer transition-all ${selectedSchemeId === scheme.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedSchemeId(scheme.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{scheme.scheme_name}</p>
                                <p className="text-sm text-muted-foreground">{scheme.scheme_code}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p><span className="text-muted-foreground">Interest:</span> <span className="font-medium">{scheme.interest_rate}%/mo</span></p>
                                <p><span className="text-muted-foreground">LTV:</span> <span className="font-medium">{scheme.ltv_percentage}%</span></p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(1)}>Back</Button>
                      <Button onClick={() => setWizardStep(3)} disabled={!selectedSchemeId}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Add Gold Items */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold">Step 3: Appraise Gold Items</h3>
                    </div>

                    <div className="space-y-2">
                      <Label>Market Rate (₹/gram for 24k)</Label>
                      <Input
                        type="number"
                        value={marketRate}
                        onChange={(e) => setMarketRate(e.target.value)}
                        placeholder="Today's gold rate"
                      />
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Add Gold Item</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Item Type *</Label>
                            <Select value={currentItem.item_type} onValueChange={(v) => setCurrentItem({...currentItem, item_type: v})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
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
                        </div>
                        <div className="grid grid-cols-3 gap-3">
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
                          <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={currentItem.description || ''}
                              onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                              placeholder="e.g., Gold chain with pendant"
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
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Added Items ({goldItems.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Net Wt (g)</TableHead>
                                <TableHead>Purity</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {goldItems.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="capitalize">{item.item_type}</TableCell>
                                  <TableCell>{item.net_weight_grams.toFixed(3)}</TableCell>
                                  <TableCell>{item.purity}</TableCell>
                                  <TableCell>₹{item.appraised_value.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => removeGoldItem(index)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="font-semibold">Total Appraised Value</TableCell>
                                <TableCell className="font-semibold">₹{totalAppraisedValue.toLocaleString()}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(2)}>Back</Button>
                      <Button onClick={() => setWizardStep(4)} disabled={goldItems.length === 0}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Create */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold">Step 4: Review & Create Loan</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium">{selectedCustomer?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer?.customer_code} • {selectedCustomer?.phone}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Scheme</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium">{selectedScheme?.scheme_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedScheme?.interest_rate}%/mo • LTV {selectedScheme?.ltv_percentage}%</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Loan Calculation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Tenure (days) *</Label>
                          <Input
                            type="number"
                            value={tenureDays}
                            onChange={(e) => setTenureDays(e.target.value)}
                            placeholder={`${selectedScheme?.min_tenure_days} - ${selectedScheme?.max_tenure_days} days`}
                            min={selectedScheme?.min_tenure_days}
                            max={selectedScheme?.max_tenure_days}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Appraised Value</p>
                            <p className="text-lg font-semibold">₹{totalAppraisedValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Loan Amount (LTV {selectedScheme?.ltv_percentage}%)</p>
                            <p className="text-lg font-semibold text-amber-600">₹{loanAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Processing Fee</p>
                            <p className="text-lg font-semibold">₹{processingFee.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Net Disbursed</p>
                            <p className="text-lg font-semibold text-green-600">₹{netDisbursed.toLocaleString()}</p>
                          </div>
                        </div>
                        {tenureDays && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">Maturity Date</p>
                            <p className="font-medium">{format(addDays(new Date(), parseInt(tenureDays)), 'dd MMM yyyy')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(3)}>Back</Button>
                      <Button 
                        onClick={handleCreateLoan} 
                        disabled={submitting || !tenureDays}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      >
                        {submitting ? 'Creating...' : 'Create Loan'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

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
                <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
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
                      <TableCell>₹{loan.principal_amount.toLocaleString()}</TableCell>
                      <TableCell>{loan.interest_rate}%/mo</TableCell>
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
            </CardContent>
          </Card>
        )}

        {/* View Loan Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Loan Details - {viewingLoan?.loan_number}</DialogTitle>
            </DialogHeader>
            {viewingLoan && (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="gold">Gold Items ({viewingGoldItems.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Customer</Label>
                      <p className="font-medium">{viewingLoan.customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{viewingLoan.customer.customer_code}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Scheme</Label>
                      <p className="font-medium">{viewingLoan.scheme.scheme_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Principal Amount</Label>
                      <p className="font-medium">₹{viewingLoan.principal_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Net Disbursed</Label>
                      <p className="font-medium">₹{viewingLoan.net_disbursed.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Interest Rate</Label>
                      <p className="font-medium">{viewingLoan.interest_rate}% per month</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tenure</Label>
                      <p className="font-medium">{viewingLoan.tenure_days} days</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Loan Date</Label>
                      <p className="font-medium">{format(new Date(viewingLoan.loan_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Maturity Date</Label>
                      <p className="font-medium">{format(new Date(viewingLoan.maturity_date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="gold">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Net Weight</TableHead>
                        <TableHead>Purity</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingGoldItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="capitalize">
                            {item.item_type}
                            {item.description && <span className="text-muted-foreground"> - {item.description}</span>}
                          </TableCell>
                          <TableCell>{item.net_weight_grams.toFixed(3)}g</TableCell>
                          <TableCell>{item.purity} ({item.purity_percentage}%)</TableCell>
                          <TableCell>₹{item.appraised_value.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
