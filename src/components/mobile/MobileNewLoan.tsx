import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, FileText, Package, CreditCard, Check, Plus, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTodayMarketRate } from '@/hooks/useMarketRates';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MobileLayout from './MobileLayout';
import MobileBottomSheet from './shared/MobileBottomSheet';
import MobilePrintSheet from './sheets/MobilePrintSheet';

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
  rate_18kt: number | null;
  rate_22kt: number | null;
  advance_interest_months: number;
  processing_fee_percentage: number | null;
  document_charges: number | null;
}

interface GoldItem {
  id: string;
  item_type: string;
  description: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: '24k' | '22k' | '20k' | '18k' | '14k';
  purity_percentage: number;
  stone_weight_grams: number;
  market_rate_per_gram: number;
  appraised_value: number;
}

type Step = 'customer' | 'scheme' | 'items' | 'payment' | 'confirm';

const STEPS: { key: Step; label: string; icon: typeof User }[] = [
  { key: 'customer', label: 'Customer', icon: User },
  { key: 'scheme', label: 'Scheme', icon: FileText },
  { key: 'items', label: 'Gold Items', icon: Package },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'confirm', label: 'Confirm', icon: Check },
];

const PURITY_MAP: Record<string, number> = {
  '24k': 99.9, '22k': 91.6, '20k': 83.3, '18k': 75.0, '14k': 58.5,
};

export default function MobileNewLoan() {
  const navigate = useNavigate();
  const { client, currentBranch, profile } = useAuth();
  const { data: todayMarketRate } = useTodayMarketRate();
  
  const [currentStep, setCurrentStep] = useState<Step>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [schemeSearch, setSchemeSearch] = useState('');
  
  const [itemForm, setItemForm] = useState({
    item_type: 'chain',
    description: '',
    gross_weight_grams: '',
    stone_weight_grams: '0',
    purity: '22k' as '24k' | '22k' | '20k' | '18k' | '14k',
  });
  
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [createdLoan, setCreatedLoan] = useState<any>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  useEffect(() => {
    if (client?.id) {
      fetchCustomers();
      fetchSchemes();
    }
  }, [client?.id]);

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, customer_code, full_name, phone, address')
        .eq('client_id', client!.id)
        .eq('is_active', true)
        .order('full_name')
        .limit(100);
      setCustomers(data || []);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const { data } = await supabase
        .from('schemes')
        .select('*')
        .eq('client_id', client!.id)
        .eq('is_active', true)
        .order('scheme_name');
      setSchemes(data || []);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.full_name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  const filteredSchemes = useMemo(() => {
    if (!schemeSearch) return schemes;
    const q = schemeSearch.toLowerCase();
    return schemes.filter(s => s.scheme_name.toLowerCase().includes(q));
  }, [schemes, schemeSearch]);

  const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  const totalGoldWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const loanAmount = approvedAmount ? parseFloat(approvedAmount) : totalAppraisedValue;

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
    const gross = parseFloat(itemForm.gross_weight_grams) || 0;
    const stone = parseFloat(itemForm.stone_weight_grams) || 0;
    if (gross <= 0) return toast.error('Enter valid weight');

    const netWeight = gross - stone;
    const purityPercent = PURITY_MAP[itemForm.purity];
    const rateForPurity = getRateForPurity(itemForm.purity, selectedScheme);

    const newItem: GoldItem = {
      id: Date.now().toString(),
      item_type: itemForm.item_type,
      description: itemForm.description,
      gross_weight_grams: gross,
      net_weight_grams: netWeight,
      purity: itemForm.purity,
      purity_percentage: purityPercent,
      stone_weight_grams: stone,
      market_rate_per_gram: rateForPurity,
      appraised_value: netWeight * rateForPurity,
    };

    setGoldItems([...goldItems, newItem]);
    setItemForm({ item_type: 'chain', description: '', gross_weight_grams: '', stone_weight_grams: '0', purity: '22k' });
    setShowAddItemSheet(false);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'customer': return !!selectedCustomerId;
      case 'scheme': return !!selectedSchemeId && !!tenureDays;
      case 'items': return goldItems.length > 0;
      case 'payment': return !!paymentMode && loanAmount > 0;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canGoNext()) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) setCurrentStep(STEPS[nextIndex].key);
  };

  const goBack = () => {
    if (stepIndex === 0) navigate(-1);
    else setCurrentStep(STEPS[stepIndex - 1].key);
  };

  const handleSubmit = async () => {
    if (!client || !currentBranch || !selectedCustomer || !selectedScheme) return;

    setIsSubmitting(true);
    try {
      const { count } = await supabase.from('loans').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
      const loanNumber = `L${currentBranch.branch_code}${String((count || 0) + 1).padStart(6, '0')}`;
      const loanDate = new Date().toISOString().split('T')[0];
      const maturityDate = addDays(new Date(), parseInt(tenureDays)).toISOString().split('T')[0];
      const principal = loanAmount;
      const processingFee = selectedScheme.processing_fee_percentage ? (principal * selectedScheme.processing_fee_percentage / 100) : 0;
      const docCharges = selectedScheme.document_charges || 0;

      const { data: loan, error: loanError } = await supabase.from('loans').insert({
        client_id: client.id,
        branch_id: currentBranch.id,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        loan_number: loanNumber,
        loan_date: loanDate,
        maturity_date: maturityDate,
        principal_amount: principal,
        interest_rate: selectedScheme.interest_rate,
        tenure_days: parseInt(tenureDays),
        processing_fee: processingFee,
        document_charges: docCharges,
        net_disbursed: principal - processingFee - docCharges,
        disbursement_mode: paymentMode,
        payment_reference: paymentReference || null,
        created_by: profile?.id,
        status: 'active',
      }).select().single();

      if (loanError) throw loanError;

      const goldItemsData = goldItems.map(item => ({
        loan_id: loan.id,
        item_type: item.item_type,
        description: item.description || null,
        gross_weight_grams: item.gross_weight_grams,
        net_weight_grams: item.net_weight_grams,
        purity: item.purity,
        purity_percentage: item.purity_percentage,
        stone_weight_grams: item.stone_weight_grams,
        market_rate_per_gram: item.market_rate_per_gram,
        appraised_value: item.appraised_value,
        market_rate_date: todayMarketRate?.rate_date || loanDate,
      }));

      await supabase.from('gold_items').insert(goldItemsData);
      toast.success('Loan created!');
      setCreatedLoan({ ...loan, customer: selectedCustomer, goldItems: goldItemsData });
      setShowPrintSheet(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'customer':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredCustomers.map(customer => (
                <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id)}
                  className={cn("w-full p-4 rounded-xl text-left transition-all", selectedCustomerId === customer.id ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1"><p className="font-medium">{customer.full_name}</p><p className="text-sm text-muted-foreground">{customer.phone}</p></div>
                    {selectedCustomerId === customer.id && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 'scheme':
        return (
          <div className="space-y-4">
            <Input placeholder="Search schemes..." value={schemeSearch} onChange={(e) => setSchemeSearch(e.target.value)} />
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {filteredSchemes.map(scheme => (
                <button key={scheme.id} onClick={() => { setSelectedSchemeId(scheme.id); if (!tenureDays) setTenureDays(scheme.max_tenure_days.toString()); }}
                  className={cn("w-full p-4 rounded-xl text-left", selectedSchemeId === scheme.id ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border")}>
                  <div className="flex justify-between"><div><p className="font-medium">{scheme.scheme_name}</p></div><p className="font-bold text-primary">{scheme.interest_rate}%</p></div>
                </button>
              ))}
            </div>
            {selectedSchemeId && (
              <div className="space-y-2"><Label>Tenure (Days)</Label><Input type="number" value={tenureDays} onChange={(e) => setTenureDays(e.target.value)} /></div>
            )}
          </div>
        );
      case 'items':
        return (
          <div className="space-y-4">
            {goldItems.map(item => (
              <div key={item.id} className="bg-card rounded-xl p-3 border flex justify-between">
                <div><p className="font-medium capitalize">{item.item_type}</p><p className="text-sm text-muted-foreground">{item.net_weight_grams}g • {item.purity}</p></div>
                <div className="flex items-center gap-2"><span className="font-bold">₹{item.appraised_value.toLocaleString('en-IN')}</span><button onClick={() => setGoldItems(goldItems.filter(i => i.id !== item.id))} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setShowAddItemSheet(true)} className="w-full py-6 border-dashed"><Plus className="w-5 h-5 mr-2" />Add Gold Item</Button>
            {goldItems.length > 0 && <div className="bg-primary/5 rounded-xl p-4"><div className="flex justify-between"><span>Total Value</span><span className="font-bold">₹{totalAppraisedValue.toLocaleString('en-IN')}</span></div></div>}
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-4">
            <div><Label>Loan Amount</Label><Input type="number" value={approvedAmount || totalAppraisedValue.toString()} onChange={(e) => setApprovedAmount(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">{['cash', 'bank', 'upi'].map(mode => (<button key={mode} onClick={() => setPaymentMode(mode)} className={cn("py-3 rounded-xl capitalize", paymentMode === mode ? "bg-primary text-white" : "bg-muted")}>{mode}</button>))}</div>
            {paymentMode !== 'cash' && <div><Label>Reference</Label><Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} /></div>}
          </div>
        );
      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 border"><h3 className="font-semibold">Customer</h3><p>{selectedCustomer?.full_name}</p></div>
            <div className="bg-card rounded-xl p-4 border"><h3 className="font-semibold">Scheme</h3><p>{selectedScheme?.scheme_name} • {tenureDays} days</p></div>
            <div className="bg-primary/10 rounded-xl p-4"><div className="flex justify-between"><span className="text-lg">Loan Amount</span><span className="text-2xl font-bold text-primary">₹{loanAmount.toLocaleString('en-IN')}</span></div></div>
          </div>
        );
    }
  };

  return (
    <MobileLayout>
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <button onClick={goBack}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-semibold">New Loan</h1>
        </div>
        <div className="flex px-4 pb-4 gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex-1">
              <div className={cn("h-1 rounded-full", idx <= stepIndex ? "bg-primary" : "bg-muted")} />
              <p className={cn("text-[10px] mt-1 text-center", idx === stepIndex ? "text-primary font-medium" : "text-muted-foreground")}>{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pb-32">{renderStepContent()}</div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
        {currentStep === 'confirm' ? (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-6 gradient-gold text-white text-lg">{isSubmitting ? 'Creating...' : 'Create Loan'}</Button>
        ) : (
          <Button onClick={goNext} disabled={!canGoNext()} className="w-full py-6 gradient-gold text-white">Continue<ChevronRight className="w-5 h-5 ml-2" /></Button>
        )}
      </div>

      <MobileBottomSheet isOpen={showAddItemSheet} onClose={() => setShowAddItemSheet(false)} title="Add Gold Item">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {['chain', 'necklace', 'bangle', 'ring', 'earring', 'coin'].map(type => (
              <button key={type} onClick={() => setItemForm({ ...itemForm, item_type: type })} className={cn("py-2 rounded-lg text-sm capitalize", itemForm.item_type === type ? "bg-primary text-white" : "bg-muted")}>{type}</button>
            ))}
          </div>
          <div><Label>Gross Weight (g)</Label><Input type="number" value={itemForm.gross_weight_grams} onChange={(e) => setItemForm({ ...itemForm, gross_weight_grams: e.target.value })} /></div>
          <div><Label>Stone Weight (g)</Label><Input type="number" value={itemForm.stone_weight_grams} onChange={(e) => setItemForm({ ...itemForm, stone_weight_grams: e.target.value })} /></div>
          <div className="grid grid-cols-5 gap-2">
            {(['24k', '22k', '20k', '18k', '14k'] as const).map(p => (
              <button key={p} onClick={() => setItemForm({ ...itemForm, purity: p })} className={cn("py-2 rounded-lg text-sm", itemForm.purity === p ? "bg-primary text-white" : "bg-muted")}>{p}</button>
            ))}
          </div>
          <Button onClick={addGoldItem} className="w-full">Add Item</Button>
        </div>
      </MobileBottomSheet>

      {createdLoan && (
        <MobilePrintSheet open={showPrintSheet} onOpenChange={(open) => { if (!open) navigate('/loans'); else setShowPrintSheet(open); }}
          loan={createdLoan} customer={selectedCustomer!} goldItems={goldItems.map(item => ({ ...item, description: item.description || null, image_url: null }))} />
      )}
    </MobileLayout>
  );
}
