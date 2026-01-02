import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, Search, Eye, Calculator, ShoppingCart, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { calculateStrikePrices, parseSchemeStrikePeriods, formatCurrencyForSale } from '@/lib/strike-price-utils';
import { calculateAdvanceInterest } from '@/lib/interestCalculations';

interface SaleAgreement {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  net_disbursed: number;
  tenure_days: number;
  maturity_date: string;
  status: string;
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
    shown_rate: number;
    effective_rate: number;
    strike_periods: any;
  };
}

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  shown_rate: number;
  effective_rate: number;
  minimum_days: number;
  advance_interest_months: number;
  ltv_percentage: number;
  processing_fee_percentage: number | null;
  rate_22kt: number | null;
  rate_18kt: number | null;
  strike_periods: any;
  min_tenure_days: number;
  max_tenure_days: number;
}

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
}

export default function SaleAgreements() {
  const { client, currentBranch, profile } = useAuth();
  const [agreements, setAgreements] = useState<SaleAgreement[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [spotPurchasePrice, setSpotPurchasePrice] = useState('');
  const [tenureDays, setTenureDays] = useState('90');
  const [submitting, setSubmitting] = useState(false);
  
  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<SaleAgreement | null>(null);

  useEffect(() => {
    if (client) {
      fetchAgreements();
      fetchSchemes();
      fetchCustomers();
    }
  }, [client]);

  const fetchAgreements = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, principal_amount, net_disbursed, tenure_days, maturity_date, status,
          customer:customers(id, customer_code, full_name, phone),
          scheme:schemes(id, scheme_code, scheme_name, shown_rate, effective_rate, strike_periods)
        `)
        .eq('client_id', client.id)
        .eq('transaction_type', 'sale_agreement')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements((data || []) as SaleAgreement[]);
    } catch (error: any) {
      toast.error('Failed to fetch sale agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('schemes')
      .select('*')
      .eq('client_id', client.id)
      .eq('scheme_type', 'sale_agreement')
      .eq('is_active', true)
      .order('scheme_name');
    setSchemes((data || []) as Scheme[]);
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

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
  
  // Calculate preview values
  const getCalculations = () => {
    if (!selectedScheme || !spotPurchasePrice) return null;
    
    const principal = parseFloat(spotPurchasePrice);
    const tenure = parseInt(tenureDays) || 90;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Calculate advance interest (deducted from disbursement)
    const advanceCalc = calculateAdvanceInterest(principal, {
      id: selectedScheme.id,
      scheme_name: selectedScheme.scheme_name,
      shown_rate: selectedScheme.shown_rate,
      effective_rate: selectedScheme.effective_rate,
      minimum_days: selectedScheme.minimum_days,
      advance_interest_months: selectedScheme.advance_interest_months,
    }, tenure);
    
    // Calculate strike prices
    const strikePeriods = parseSchemeStrikePeriods(selectedScheme.strike_periods);
    const strikeCalc = calculateStrikePrices(
      principal,
      selectedScheme.shown_rate,
      selectedScheme.effective_rate,
      selectedScheme.processing_fee_percentage || 0,
      today,
      tenure,
      strikePeriods
    );
    
    return {
      spotPrice: principal,
      advanceMargin: advanceCalc.shownInterest,
      cashToSeller: advanceCalc.netCashToCustomer,
      strikePrices: strikeCalc.strikePrices,
      expiryDate: strikeCalc.expiryDate,
    };
  };

  const calculations = getCalculations();

  const handleSubmit = async () => {
    if (!client || !currentBranch || !profile) return;
    
    if (!selectedCustomerId || !selectedSchemeId || !spotPurchasePrice) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const principal = parseFloat(spotPurchasePrice);
      const tenure = parseInt(tenureDays) || 90;
      const today = new Date().toISOString().split('T')[0];
      
      const advanceCalc = calculateAdvanceInterest(principal, {
        id: selectedScheme!.id,
        scheme_name: selectedScheme!.scheme_name,
        shown_rate: selectedScheme!.shown_rate,
        effective_rate: selectedScheme!.effective_rate,
        minimum_days: selectedScheme!.minimum_days,
        advance_interest_months: selectedScheme!.advance_interest_months,
      }, tenure);
      
      // Generate agreement number
      const { data: countData } = await supabase
        .from('loans')
        .select('id', { count: 'exact' })
        .eq('client_id', client.id)
        .eq('transaction_type', 'sale_agreement');
      
      const count = (countData?.length || 0) + 1;
      const agreementNumber = `SA${format(new Date(), 'yyMMdd')}${count.toString().padStart(4, '0')}`;
      
      const { error } = await supabase.from('loans').insert({
        client_id: client.id,
        branch_id: currentBranch.id,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        loan_number: agreementNumber,
        loan_date: today,
        principal_amount: principal,
        shown_principal: principal,
        actual_principal: advanceCalc.actualPrincipal,
        advance_interest_shown: advanceCalc.shownInterest,
        advance_interest_actual: advanceCalc.actualInterest,
        differential_capitalized: advanceCalc.differential,
        interest_rate: selectedScheme!.shown_rate,
        tenure_days: tenure,
        maturity_date: format(addDays(new Date(), tenure), 'yyyy-MM-dd'),
        net_disbursed: advanceCalc.netCashToCustomer,
        transaction_type: 'sale_agreement',
        status: 'active',
        approval_status: 'approved',
        created_by: profile.id,
      });

      if (error) throw error;

      toast.success('Sale Agreement created successfully');
      setIsFormOpen(false);
      resetForm();
      fetchAgreements();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedSchemeId('');
    setSpotPurchasePrice('');
    setTenureDays('90');
  };

  const handleView = (agreement: SaleAgreement) => {
    setViewingAgreement(agreement);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active Option</Badge>;
      case 'closed':
        return <Badge variant="secondary">Exercised</Badge>;
      case 'auctioned':
        return <Badge variant="destructive">Forfeited</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAgreements = agreements.filter(a => {
    const matchesSearch = 
      a.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sale Agreements</h1>
            <p className="text-muted-foreground">Bill of Sale & Repurchase Option transactions</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" /> New Purchase
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by agreement no., customer name or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Option</SelectItem>
                  <SelectItem value="closed">Exercised</SelectItem>
                  <SelectItem value="auctioned">Forfeited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agreements Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement No.</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Spot Price</TableHead>
                  <TableHead className="text-right">Cash Paid</TableHead>
                  <TableHead>Option Expiry</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredAgreements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sale agreements found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgreements.map(agreement => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">{agreement.loan_number}</TableCell>
                      <TableCell>{format(new Date(agreement.loan_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agreement.customer.full_name}</div>
                          <div className="text-sm text-muted-foreground">{agreement.customer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">₹{agreement.principal_amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{agreement.net_disbursed.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{format(new Date(agreement.maturity_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(agreement.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleView(agreement)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New Purchase Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Purchase Agreement</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Purchase Details</TabsTrigger>
                <TabsTrigger value="preview">Strike Price Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seller (Customer) *</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name} ({c.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Scheme *</Label>
                    <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {schemes.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.scheme_name} ({s.shown_rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spot Purchase Price (₹) *</Label>
                    <Input
                      type="number"
                      value={spotPurchasePrice}
                      onChange={e => setSpotPurchasePrice(e.target.value)}
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount to pay for the gold (before advance deduction)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Option Period (Days)</Label>
                    <Input
                      type="number"
                      value={tenureDays}
                      onChange={e => setTenureDays(e.target.value)}
                      placeholder="90"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {selectedScheme?.max_tenure_days || 90} days
                    </p>
                  </div>
                </div>

                {calculations && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Payment Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Spot Purchase Price:</span>
                          <span className="font-medium">{formatCurrencyForSale(calculations.spotPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Less: Advance Margin:</span>
                          <span className="text-red-500">-{formatCurrencyForSale(calculations.advanceMargin)}</span>
                        </div>
                        <div className="flex justify-between col-span-2 pt-2 border-t">
                          <span className="font-medium">Cash to Seller:</span>
                          <span className="font-bold text-lg">{formatCurrencyForSale(calculations.cashToSeller)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="pt-4">
                {calculations ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Strike Price Schedule</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        If seller exercises repurchase option, they pay:
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>If Exercised Between</TableHead>
                            <TableHead className="text-right">Strike Price</TableHead>
                            <TableHead className="text-right">Expires On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculations.strikePrices.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>{row.periodLabel}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrencyForSale(row.strikePrice)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {row.expiryDate}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                      <strong>Note:</strong> If seller does not exercise option by {calculations.expiryDate}, 
                      the agreement expires and buyer retains full ownership of the goods.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Enter purchase details to see strike price preview
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Agreement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agreement Details</DialogTitle>
            </DialogHeader>
            
            {viewingAgreement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Agreement No.</Label>
                    <p className="font-medium">{viewingAgreement.loan_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>{getStatusBadge(viewingAgreement.status)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Seller</Label>
                    <p className="font-medium">{viewingAgreement.customer.full_name}</p>
                    <p className="text-sm text-muted-foreground">{viewingAgreement.customer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Purchase Date</Label>
                    <p>{format(new Date(viewingAgreement.loan_date), 'dd MMMM yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Spot Purchase Price</Label>
                    <p className="font-medium text-lg">₹{viewingAgreement.principal_amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cash Paid to Seller</Label>
                    <p className="font-medium text-lg">₹{viewingAgreement.net_disbursed.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Option Expiry</Label>
                    <p>{format(new Date(viewingAgreement.maturity_date), 'dd MMMM yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Scheme</Label>
                    <p>{viewingAgreement.scheme.scheme_name}</p>
                  </div>
                </div>
                
                {viewingAgreement.status === 'active' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1">
                      <Receipt className="h-4 w-4 mr-2" /> Exercise Repurchase
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" /> Print Agreement
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
