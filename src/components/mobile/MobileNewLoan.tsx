import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, FileText, Package, CreditCard, Plus, Trash2, Search, Camera, Calculator, Banknote, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTodayMarketRate } from '@/hooks/useMarketRates';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MobileLayout from './MobileLayout';
import MobileBottomSheet from './shared/MobileBottomSheet';
import MobilePrintSheet from './sheets/MobilePrintSheet';
import SuccessAnimation from './SuccessAnimation';
import LoadingButton from './LoadingButton';
import { vibrateSuccess } from '@/lib/haptics';
import { calculateAdvanceInterest, formatIndianCurrency } from '@/lib/interestCalculations';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string;
}

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  interest_rate: number;
  shown_rate: number;
  effective_rate: number;
  ltv_percentage: number;
  min_tenure_days: number;
  max_tenure_days: number;
  minimum_days: number;
  advance_interest_months: number;
  rate_18kt: number | null;
  rate_22kt: number | null;
  processing_fee_percentage: number | null;
  document_charges: number | null;
  min_amount: number;
  max_amount: number;
}

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  commission_percentage: number;
}

interface ItemGroup {
  id: string;
  group_code: string;
  group_name: string;
}

interface Item {
  id: string;
  item_group_id: string;
  item_code: string;
  item_name: string;
  tamil_name: string | null;
}

interface GoldItem {
  id: string;
  item_type: string;
  item_id?: string;
  item_group_id?: string;
  description: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: '24k' | '22k' | '20k' | '18k' | '14k';
  purity_percentage: number;
  stone_weight_grams: number;
  market_rate_per_gram: number;
  appraised_value: number;
  market_value?: number;
  market_rate_date?: string;
}

interface BankNBFC {
  id: string;
  bank_code: string;
  bank_name: string;
  account_number: string | null;
}

interface Loyalty {
  id: string;
  loyalty_code: string;
  full_name: string;
}

interface LoyaltyBankAccount {
  id: string;
  loyalty_id: string;
  bank_id: string;
  account_number: string;
  account_holder_name: string;
  bank?: { bank_name: string };
}

interface PaymentEntry {
  mode: string;
  amount: string;
  reference: string;
  sourceType: 'cash' | 'company' | 'employee';
  sourceBankId: string;
  sourceAccountId: string;
  selectedLoyaltyId: string;
}

const PURITY_MAP: Record<string, number> = {
  '24k': 99.9, '22k': 91.6, '20k': 83.3, '18k': 75.0, '14k': 58.5,
};

export default function MobileNewLoan() {
  const navigate = useNavigate();
  const { client, currentBranch, branches, profile } = useAuth();
  const { data: todayMarketRate } = useTodayMarketRate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [banksNbfc, setBanksNbfc] = useState<BankNBFC[]>([]);
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loyaltyBankAccountsMap, setLoyaltyBankAccountsMap] = useState<Record<string, LoyaltyBankAccount[]>>({});
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [approvedLoanAmount, setApprovedLoanAmount] = useState('');
  const [userDocumentChargesPercent, setUserDocumentChargesPercent] = useState('');
  
  // Payment entries (multiple)
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([
    { mode: 'cash', amount: '', reference: '', sourceType: 'cash', sourceBankId: '', sourceAccountId: '', selectedLoyaltyId: '' }
  ]);
  
  // Search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  
  // Bottom sheets
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLoan, setCreatedLoan] = useState<any>(null);
  
  // Section collapse states
  const [sectionsOpen, setSectionsOpen] = useState({
    customer: true,
    scheme: true,
    items: true,
    calculation: true,
    payment: true,
  });
  
  // Gold item form
  const [itemForm, setItemForm] = useState({
    selectedItemGroupId: '',
    item_id: '',
    item_type: '',
    description: '',
    gross_weight_grams: '',
    stone_weight_grams: '0',
    purity: '22k' as '24k' | '22k' | '20k' | '18k' | '14k',
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);

  useEffect(() => {
    if (client?.id) {
      fetchAllData();
    }
  }, [client?.id]);

  useEffect(() => {
    if (currentBranch?.id && !selectedBranchId) {
      setSelectedBranchId(currentBranch.id);
    }
  }, [currentBranch, selectedBranchId]);

  // Set default item group to Gold
  useEffect(() => {
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    if (goldGroup && !itemForm.selectedItemGroupId) {
      setItemForm(prev => ({ ...prev, selectedItemGroupId: goldGroup.id }));
    }
  }, [itemGroups]);

  const fetchAllData = async () => {
    const [customersRes, schemesRes, agentsRes, itemGroupsRes, itemsRes, banksRes, loyaltiesRes] = await Promise.all([
      supabase.from('customers').select('id, customer_code, full_name, phone, address').eq('client_id', client!.id).eq('is_active', true).order('full_name').limit(200),
      supabase.from('schemes').select('*').eq('client_id', client!.id).eq('is_active', true).order('scheme_name'),
      supabase.from('agents').select('id, agent_code, full_name, commission_percentage').eq('client_id', client!.id).eq('is_active', true).order('full_name'),
      supabase.from('item_groups').select('id, group_code, group_name').eq('client_id', client!.id).eq('is_active', true).order('group_name'),
      supabase.from('items').select('id, item_group_id, item_code, item_name, tamil_name').eq('client_id', client!.id).eq('is_active', true).order('item_name'),
      supabase.from('banks_nbfc').select('id, bank_code, bank_name, account_number').eq('client_id', client!.id).eq('is_active', true).order('bank_name'),
      supabase.from('loyalties').select('id, loyalty_code, full_name').eq('client_id', client!.id).eq('is_active', true).order('full_name'),
    ]);
    
    setCustomers((customersRes.data as Customer[]) || []);
    setSchemes((schemesRes.data as Scheme[]) || []);
    setAgents((agentsRes.data as Agent[]) || []);
    setItemGroups((itemGroupsRes.data as ItemGroup[]) || []);
    setItems((itemsRes.data as Item[]) || []);
    setBanksNbfc((banksRes.data as BankNBFC[]) || []);
    setLoyalties((loyaltiesRes.data as Loyalty[]) || []);
  };

  const fetchLoyaltyBankAccounts = async (loyaltyId: string) => {
    if (!client || !loyaltyId || loyaltyBankAccountsMap[loyaltyId]) return;
    const { data } = await supabase
      .from('loyalty_bank_accounts')
      .select('id, loyalty_id, bank_id, account_number, account_holder_name, bank:banks_nbfc(bank_name)')
      .eq('loyalty_id', loyaltyId)
      .eq('is_active', true);
    if (data) {
      setLoyaltyBankAccountsMap(prev => ({ ...prev, [loyaltyId]: data as LoyaltyBankAccount[] }));
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.full_name.toLowerCase().includes(q) || 
      c.phone.includes(q) ||
      c.customer_code.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const filteredItems = useMemo(() => {
    if (!itemForm.selectedItemGroupId) return items;
    return items.filter(i => i.item_group_id === itemForm.selectedItemGroupId);
  }, [items, itemForm.selectedItemGroupId]);

  const getRateForPurity = (purity: string, scheme: Scheme) => {
    switch (purity) {
      case '22k': return scheme.rate_22kt || 0;
      case '18k': return scheme.rate_18kt || 0;
      case '24k': return (scheme.rate_22kt || 0) * (24 / 22);
      default: return (scheme.rate_22kt || 0) * (PURITY_MAP[purity] / 91.6);
    }
  };

  const addGoldItem = () => {
    if (!selectedScheme) return toast.error('Select a scheme first');
    
    const selectedItem = items.find(i => i.id === itemForm.item_id);
    const itemName = selectedItem ? `${selectedItem.item_code} - ${selectedItem.item_name}` : itemForm.item_type;
    
    if (!itemName) return toast.error('Please select an item');
    
    const gross = parseFloat(itemForm.gross_weight_grams) || 0;
    const stone = parseFloat(itemForm.stone_weight_grams) || 0;
    if (gross <= 0) return toast.error('Enter valid weight');

    const netWeight = gross - stone;
    const purityPercent = PURITY_MAP[itemForm.purity];
    const rateForPurity = getRateForPurity(itemForm.purity, selectedScheme);
    const appraisedValue = netWeight * rateForPurity;

    let marketValue = 0;
    if (todayMarketRate) {
      const marketRateForPurity = itemForm.purity === '24k' ? todayMarketRate.rate_24kt 
        : itemForm.purity === '22k' ? todayMarketRate.rate_22kt 
        : itemForm.purity === '18k' ? todayMarketRate.rate_18kt
        : todayMarketRate.rate_22kt * (PURITY_MAP[itemForm.purity] / 91.6);
      marketValue = netWeight * marketRateForPurity;
    }

    const newItem: GoldItem = {
      id: Date.now().toString(),
      item_type: itemName,
      item_id: itemForm.item_id || undefined,
      item_group_id: itemForm.selectedItemGroupId || undefined,
      description: itemForm.description,
      gross_weight_grams: gross,
      net_weight_grams: netWeight,
      purity: itemForm.purity,
      purity_percentage: purityPercent,
      stone_weight_grams: stone,
      market_rate_per_gram: rateForPurity,
      appraised_value: appraisedValue,
      market_value: marketValue,
      market_rate_date: todayMarketRate?.rate_date,
    };

    setGoldItems([...goldItems, newItem]);
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    setItemForm({
      selectedItemGroupId: goldGroup?.id || '',
      item_id: '',
      item_type: '',
      description: '',
      gross_weight_grams: '',
      stone_weight_grams: '0',
      purity: '22k',
    });
    setShowAddItemSheet(false);
  };

  // Loan calculation with dual-rate system (matching desktop)
  const loanCalculation = useMemo(() => {
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
    };
  }, [goldItems, selectedSchemeId, schemes, tenureDays, userDocumentChargesPercent, approvedLoanAmount]);

  const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalGoldWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);

  const updatePaymentEntry = (index: number, field: keyof PaymentEntry, value: string) => {
    setPaymentEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPaymentEntry = () => {
    setPaymentEntries(prev => [...prev, { mode: 'cash', amount: '', reference: '', sourceType: 'cash', sourceBankId: '', sourceAccountId: '', selectedLoyaltyId: '' }]);
  };

  const removePaymentEntry = (index: number) => {
    if (paymentEntries.length > 1) {
      setPaymentEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!client || !currentBranch || !selectedCustomer || !selectedScheme || !loanCalculation) {
      toast.error('Please fill all required fields');
      return;
    }

    if (goldItems.length === 0) {
      toast.error('Please add at least one gold item');
      return;
    }

    if (loanCalculation.finalApprovedAmount > loanCalculation.maxApprovedAmount) {
      toast.error(`Approved amount cannot exceed ${formatIndianCurrency(loanCalculation.maxApprovedAmount)}`);
      return;
    }

    if (Math.abs(totalPayments - loanCalculation.netCashToCustomer) > 1) {
      toast.error(`Payment amounts must total ${formatIndianCurrency(loanCalculation.netCashToCustomer)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const loanDate = new Date();
      const maturityDate = addDays(loanDate, parseInt(tenureDays));
      const nextInterestDueDate = addMonths(loanDate, loanCalculation.scheme.advance_interest_months || 3);

      const { count } = await supabase.from('loans').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
      const branchCode = branches.find(b => b.id === selectedBranchId)?.branch_code || 'XX';
      const loanNumber = `GL${branchCode}${format(loanDate, 'yyyyMMdd')}${String((count || 0) + 1).padStart(4, '0')}`;

      const loanData = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        agent_id: selectedAgentId || null,
        loan_number: loanNumber,
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanCalculation.finalApprovedAmount,
        shown_principal: loanCalculation.loanAmount,
        actual_principal: loanCalculation.principalOnRecord,
        interest_rate: loanCalculation.scheme.shown_rate || 18,
        tenure_days: parseInt(tenureDays),
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        processing_fee: loanCalculation.processingFee,
        document_charges: loanCalculation.documentCharges,
        net_disbursed: loanCalculation.netCashToCustomer,
        advance_interest_shown: loanCalculation.advanceCalc.shownInterest,
        advance_interest_actual: loanCalculation.advanceCalc.actualInterest,
        differential_capitalized: loanCalculation.advanceCalc.differential,
        next_interest_due_date: format(nextInterestDueDate, 'yyyy-MM-dd'),
        last_interest_paid_date: format(loanDate, 'yyyy-MM-dd'),
        disbursement_mode: paymentEntries[0]?.mode || 'cash',
        payment_reference: paymentEntries[0]?.reference || null,
        created_by: profile?.id,
        appraised_by: profile?.id,
        status: 'active' as const,
      };

      const { data: loan, error: loanError } = await supabase.from('loans').insert([loanData]).select().single();
      if (loanError) throw loanError;

      // Insert disbursement entries
      const disbursementsData = paymentEntries
        .filter(entry => parseFloat(entry.amount) > 0)
        .map(entry => ({
          loan_id: loan.id,
          payment_mode: entry.mode,
          amount: parseFloat(entry.amount),
          reference_number: entry.reference || null,
          source_type: entry.sourceType,
          source_bank_id: entry.sourceType === 'company' ? (entry.sourceBankId || null) : null,
          source_account_id: entry.sourceType === 'employee' ? (entry.sourceAccountId || null) : null,
        }));

      if (disbursementsData.length > 0) {
        await supabase.from('loan_disbursements').insert(disbursementsData);
      }

      // Insert gold items
      const goldItemsData = goldItems.map(item => ({
        loan_id: loan.id,
        item_type: item.item_type,
        item_id: item.item_id || null,
        item_group_id: item.item_group_id || null,
        description: item.description || null,
        gross_weight_grams: item.gross_weight_grams,
        net_weight_grams: item.net_weight_grams,
        purity: item.purity,
        purity_percentage: item.purity_percentage,
        stone_weight_grams: item.stone_weight_grams,
        market_rate_per_gram: item.market_rate_per_gram,
        appraised_value: item.appraised_value,
        market_value: item.market_value || 0,
        market_rate_date: item.market_rate_date || format(loanDate, 'yyyy-MM-dd'),
      }));

      await supabase.from('gold_items').insert(goldItemsData);

      vibrateSuccess();
      setCreatedLoan({ ...loan, customer: selectedCustomer, goldItems: goldItemsData });
      setShowSuccess(true);
      
      toast.success(`Loan ${loanNumber} created successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, icon: Icon, section }: { title: string; icon: any; section: keyof typeof sectionsOpen }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      {sectionsOpen[section] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </CollapsibleTrigger>
  );

  if (showSuccess && createdLoan) {
    return (
      <MobileLayout>
        <SuccessAnimation 
          isVisible={showSuccess}
          message={`Loan ${createdLoan.loan_number} created!`}
          onComplete={() => {
            setShowSuccess(false);
            setShowPrintSheet(true);
          }}
        />
        <MobilePrintSheet 
          open={showPrintSheet} 
          onOpenChange={(open) => {
            if (!open) {
              setShowPrintSheet(false);
              navigate('/loans');
            }
          }}
          loan={createdLoan}
          customer={selectedCustomer!}
          goldItems={createdLoan.goldItems}
        />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-lg">New Loan</h1>
        </div>
      </div>

      {/* Scrollable Form */}
      <div className="p-4 pb-32 space-y-4">
        
        {/* Section 1: Customer, Branch & Agent */}
        <Collapsible open={sectionsOpen.customer} onOpenChange={() => toggleSection('customer')}>
          <div className="bg-card rounded-xl border p-4">
            <SectionHeader title="Customer, Branch & Agent" icon={User} section="customer" />
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Customer Search */}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or code..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerResults(true);
                    }}
                    onFocus={() => setShowCustomerResults(true)}
                    className="pl-10"
                  />
                </div>
                {showCustomerResults && filteredCustomers.length > 0 && (
                  <div className="border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 cursor-pointer hover:bg-accent text-sm border-b last:border-0"
                        onClick={() => {
                          setSelectedCustomerId(customer.id);
                          setCustomerSearch('');
                          setShowCustomerResults(false);
                        }}
                      >
                        <span className="font-medium">{customer.customer_code}</span> - {customer.full_name}
                        <span className="text-muted-foreground ml-2">({customer.phone})</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedCustomer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.customer_code} • {selectedCustomer.phone}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId('')}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Branch */}
              {branches.length > 1 && (
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.branch_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Agent */}
              <div className="space-y-2">
                <Label>Agent (Optional)</Label>
                <Select 
                  value={selectedAgentId || "none"} 
                  onValueChange={(v) => setSelectedAgentId(v === "none" ? "" : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Agent</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.commission_percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 2: Scheme */}
        <Collapsible open={sectionsOpen.scheme} onOpenChange={() => toggleSection('scheme')}>
          <div className="bg-card rounded-xl border p-4">
            <SectionHeader title="Scheme Selection" icon={FileText} section="scheme" />
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Scheme *</Label>
                <Select value={selectedSchemeId} onValueChange={(v) => {
                  setSelectedSchemeId(v);
                  const scheme = schemes.find(s => s.id === v);
                  if (scheme && !tenureDays) setTenureDays(scheme.max_tenure_days.toString());
                }}>
                  <SelectTrigger><SelectValue placeholder="Select scheme" /></SelectTrigger>
                  <SelectContent>
                    {schemes.map(scheme => (
                      <SelectItem key={scheme.id} value={scheme.id}>
                        {scheme.scheme_name} - {scheme.interest_rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedScheme && (
                <>
                  <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Interest:</span> <span className="font-medium">{selectedScheme.shown_rate}%</span></div>
                    <div><span className="text-muted-foreground">LTV:</span> <span className="font-medium">{selectedScheme.ltv_percentage}%</span></div>
                    <div><span className="text-muted-foreground">22KT Rate:</span> <span className="font-medium">₹{selectedScheme.rate_22kt?.toLocaleString('en-IN')}</span></div>
                    <div><span className="text-muted-foreground">18KT Rate:</span> <span className="font-medium">₹{selectedScheme.rate_18kt?.toLocaleString('en-IN')}</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tenure (Days) *</Label>
                    <Input
                      type="number"
                      value={tenureDays}
                      onChange={(e) => setTenureDays(e.target.value)}
                      placeholder={`${selectedScheme.min_tenure_days} - ${selectedScheme.max_tenure_days}`}
                    />
                  </div>
                </>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 3: Gold Items */}
        <Collapsible open={sectionsOpen.items} onOpenChange={() => toggleSection('items')}>
          <div className="bg-card rounded-xl border p-4">
            <SectionHeader title="Gold Item Appraisal" icon={Package} section="items" />
            <CollapsibleContent className="space-y-4 pt-4">
              {goldItems.map((item, index) => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.item_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.net_weight_grams.toFixed(2)}g • {item.purity} • ₹{item.market_rate_per_gram.toLocaleString('en-IN')}/g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">₹{item.appraised_value.toLocaleString('en-IN')}</span>
                    <button onClick={() => setGoldItems(goldItems.filter((_, i) => i !== index))} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={() => setShowAddItemSheet(true)} className="w-full py-4 border-dashed">
                <Plus className="w-4 h-4 mr-2" />Add Gold Item
              </Button>

              {goldItems.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Weight</span>
                    <span className="font-medium">{totalGoldWeight.toFixed(2)}g</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Total Appraised Value</span>
                    <span className="font-bold text-primary">₹{goldItems.reduce((sum, i) => sum + i.appraised_value, 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 4: Loan Calculation */}
        <Collapsible open={sectionsOpen.calculation} onOpenChange={() => toggleSection('calculation')}>
          <div className="bg-card rounded-xl border p-4">
            <SectionHeader title="Loan Calculation" icon={Calculator} section="calculation" />
            <CollapsibleContent className="space-y-4 pt-4">
              {loanCalculation ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Appraised</span><span>₹{loanCalculation.totalAppraisedValue.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">LTV Amount</span><span>₹{loanCalculation.loanAmount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Principal on Record</span><span className="font-medium">₹{loanCalculation.principalOnRecord.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Max Approved (10%)</span><span>₹{loanCalculation.maxApprovedAmount.toLocaleString('en-IN')}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Approved Loan Amount</Label>
                    <Input
                      type="number"
                      value={approvedLoanAmount}
                      onChange={(e) => setApprovedLoanAmount(e.target.value)}
                      placeholder={loanCalculation.principalOnRecord.toString()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Document Charges %</Label>
                    <Input
                      type="number"
                      value={userDocumentChargesPercent}
                      onChange={(e) => setUserDocumentChargesPercent(e.target.value)}
                      placeholder={loanCalculation.scheme.document_charges?.toString() || '0'}
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Advance Interest ({loanCalculation.scheme.advance_interest_months}M)</span><span>₹{loanCalculation.advanceCalc.shownInterest.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Processing Fee</span><span>₹{loanCalculation.processingFee.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Document Charges</span><span>₹{loanCalculation.documentCharges.toLocaleString('en-IN')}</span></div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Net Cash to Customer</span>
                      <span className="text-primary text-lg">₹{loanCalculation.netCashToCustomer.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Add gold items to see calculation</p>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 5: Payment Details */}
        <Collapsible open={sectionsOpen.payment} onOpenChange={() => toggleSection('payment')}>
          <div className="bg-card rounded-xl border p-4">
            <SectionHeader title="Payment Details" icon={Banknote} section="payment" />
            <CollapsibleContent className="space-y-4 pt-4">
              {paymentEntries.map((entry, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Payment {index + 1}</span>
                    {paymentEntries.length > 1 && (
                      <button onClick={() => removePaymentEntry(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div className="grid grid-cols-4 gap-2">
                    {['cash', 'bank', 'upi', 'cheque'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => updatePaymentEntry(index, 'mode', mode)}
                        className={cn("py-2 rounded-lg text-xs capitalize", entry.mode === mode ? "bg-primary text-primary-foreground" : "bg-muted")}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Source Type */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash' },
                      { value: 'company', label: 'Company' },
                      { value: 'employee', label: 'Employee' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePaymentEntry(index, 'sourceType', opt.value as any)}
                        className={cn("py-2 rounded-lg text-xs", entry.sourceType === opt.value ? "bg-secondary text-secondary-foreground" : "bg-muted")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Company Bank */}
                  {entry.sourceType === 'company' && (
                    <Select value={entry.sourceBankId} onValueChange={(v) => updatePaymentEntry(index, 'sourceBankId', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent>
                        {banksNbfc.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>{bank.bank_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Employee Account */}
                  {entry.sourceType === 'employee' && (
                    <>
                      <Select value={entry.selectedLoyaltyId} onValueChange={(v) => {
                        updatePaymentEntry(index, 'selectedLoyaltyId', v);
                        fetchLoyaltyBankAccounts(v);
                      }}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger>
                        <SelectContent>
                          {loyalties.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {entry.selectedLoyaltyId && loyaltyBankAccountsMap[entry.selectedLoyaltyId] && (
                        <Select value={entry.sourceAccountId} onValueChange={(v) => updatePaymentEntry(index, 'sourceAccountId', v)}>
                          <SelectTrigger className="text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                          <SelectContent>
                            {loyaltyBankAccountsMap[entry.selectedLoyaltyId].map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.bank?.bank_name} - {acc.account_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}

                  {/* Amount & Reference */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        value={entry.amount}
                        onChange={(e) => updatePaymentEntry(index, 'amount', e.target.value)}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reference</Label>
                      <Input
                        value={entry.reference}
                        onChange={(e) => updatePaymentEntry(index, 'reference', e.target.value)}
                        placeholder="Optional"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addPaymentEntry} className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Payment Entry
              </Button>

              {loanCalculation && (
                <div className={cn(
                  "rounded-lg p-3 text-sm",
                  Math.abs(totalPayments - loanCalculation.netCashToCustomer) < 1 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-destructive/10 border border-destructive/20"
                )}>
                  <div className="flex justify-between">
                    <span>Total Payments</span>
                    <span className="font-medium">₹{totalPayments.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required</span>
                    <span className="font-medium">₹{loanCalculation.netCashToCustomer.toLocaleString('en-IN')}</span>
                  </div>
                  {Math.abs(totalPayments - loanCalculation.netCashToCustomer) >= 1 && (
                    <div className="flex justify-between text-destructive mt-1">
                      <span>Difference</span>
                      <span>₹{Math.abs(totalPayments - loanCalculation.netCashToCustomer).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom z-30">
        <LoadingButton
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Creating..."
          disabled={!selectedCustomerId || !selectedSchemeId || goldItems.length === 0 || !loanCalculation}
          className="w-full py-4 bg-primary text-primary-foreground text-lg rounded-xl font-semibold"
        >
          Create Loan
        </LoadingButton>
      </div>

      {/* Add Gold Item Sheet */}
      <MobileBottomSheet
        isOpen={showAddItemSheet}
        onClose={() => setShowAddItemSheet(false)}
        title="Add Gold Item"
        footer={
          <LoadingButton onClick={addGoldItem} className="w-full py-3">
            Add Item
          </LoadingButton>
        }
      >
        <div className="p-4 space-y-4">
          {/* Item Group */}
          <div className="space-y-2">
            <Label>Item Group</Label>
            <Select value={itemForm.selectedItemGroupId} onValueChange={(v) => setItemForm({ ...itemForm, selectedItemGroupId: v, item_id: '' })}>
              <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
              <SelectContent>
                {itemGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item */}
          <div className="space-y-2">
            <Label>Item *</Label>
            <Select value={itemForm.item_id} onValueChange={(v) => setItemForm({ ...itemForm, item_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>
                {filteredItems.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.item_code} - {i.item_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gross Weight */}
          <div className="space-y-2">
            <Label>Gross Weight (grams) *</Label>
            <Input
              type="number"
              value={itemForm.gross_weight_grams}
              onChange={(e) => setItemForm({ ...itemForm, gross_weight_grams: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Stone Weight */}
          <div className="space-y-2">
            <Label>Stone Weight (grams)</Label>
            <Input
              type="number"
              value={itemForm.stone_weight_grams}
              onChange={(e) => setItemForm({ ...itemForm, stone_weight_grams: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Purity */}
          <div className="space-y-2">
            <Label>Purity</Label>
            <div className="grid grid-cols-5 gap-2">
              {(['24k', '22k', '20k', '18k', '14k'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setItemForm({ ...itemForm, purity: p })}
                  className={cn("py-2 rounded-lg text-sm font-medium", itemForm.purity === p ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="e.g. 1 piece, yellow gold"
            />
          </div>

          {/* Preview */}
          {selectedScheme && itemForm.gross_weight_grams && (
            <div className="bg-primary/5 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Weight</span>
                <span>{(parseFloat(itemForm.gross_weight_grams) - parseFloat(itemForm.stone_weight_grams || '0')).toFixed(2)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>₹{getRateForPurity(itemForm.purity, selectedScheme).toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                <span>Appraised Value</span>
                <span className="text-primary">
                  ₹{((parseFloat(itemForm.gross_weight_grams) - parseFloat(itemForm.stone_weight_grams || '0')) * getRateForPurity(itemForm.purity, selectedScheme)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
