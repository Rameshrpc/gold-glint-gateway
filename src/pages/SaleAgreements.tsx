import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Search, Eye, Trash2, ChevronDown, ChevronUp, IndianRupee, Calculator, Package, User, Settings, UserPlus, Camera, Pencil, Banknote, Printer, FileSpreadsheet, CheckSquare, X, ShoppingCart, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { calculateAdvanceInterest, calculateRebateSchedule, formatIndianCurrency, type RebateSchedule } from '@/lib/interestCalculations';
import { calculateStrikePrices, parseSchemeStrikePeriods } from '@/lib/strike-price-utils';
import { useTodayMarketRate } from '@/hooks/useMarketRates';
import CustomerSummaryCard from '@/components/loans/CustomerSummaryCard';
import InlineCustomerForm from '@/components/loans/InlineCustomerForm';
import ImageCapture from '@/components/loans/ImageCapture';
import LoanEditDialog from '@/components/loans/LoanEditDialog';
import { LoanPrintDialog } from '@/components/print/LoanPrintDialog';
import { BulkOperationsDialog } from '@/components/loans/BulkOperationsDialog';
import { generateLoanDisbursementVoucher, generateAgentCommissionAccrualVoucher } from '@/hooks/useVoucherGeneration';
import { LoanStatementPDF } from '@/components/print/documents';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow';
import { ApprovalBadge } from '@/components/approvals/ApprovalBadge';
import { pdf } from '@react-pdf/renderer';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photo_url?: string;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_card_url?: string;
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
  strike_periods: unknown;
}

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  commission_percentage: number;
  total_commission_earned: number | null;
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
  id?: string;
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
  market_value?: number;
  market_rate_date?: string;
}

interface SaleAgreement {
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
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  is_reloan: boolean | null;
  customer: Customer;
  scheme: {
    id: string;
    scheme_code: string;
    scheme_name: string;
    interest_rate: number;
    shown_rate: number | null;
    effective_rate: number | null;
    ltv_percentage: number;
    strike_periods?: unknown;
  };
  branch_id: string;
}

type GoldPurity = '24k' | '22k' | '20k' | '18k' | '14k';

const PURITY_MAP: Record<string, number> = {
  '24k': 99.9,
  '22k': 91.6,
  '20k': 83.3,
  '18k': 75.0,
  '14k': 58.5,
};

export default function SaleAgreements() {
  const { client, currentBranch, branches, profile, isPlatformAdmin, hasRole } = useAuth();
  const { canEdit, canDelete, attemptEdit, attemptDelete } = usePermissions();
  const { data: todayMarketRate } = useTodayMarketRate();
  const [agreements, setAgreements] = useState<SaleAgreement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // New agreement form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Image captures
  const [jewelPhotoUrl, setJewelPhotoUrl] = useState<string | null>(null);
  const [appraiserSheetUrl, setAppraiserSheetUrl] = useState<string | null>(null);
  
  // Payment details - multiple payment entries with source account tracking
  const [paymentEntries, setPaymentEntries] = useState<Array<{
    mode: string;
    amount: string;
    reference: string;
    sourceType: 'cash' | 'company' | 'employee';
    sourceBankId: string;
    sourceAccountId: string;
    selectedLoyaltyId: string;
  }>>([{ mode: 'cash', amount: '', reference: '', sourceType: 'cash', sourceBankId: '', sourceAccountId: '', selectedLoyaltyId: '' }]);

  // Banks, Loyalties, and Loyalty Bank Accounts for source tracking
  interface BankNBFC {
    id: string;
    bank_code: string;
    bank_name: string;
    account_number: string | null;
    branch_name: string | null;
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
    account_type: string | null;
    bank?: { bank_name: string };
  }
  const [banksNbfc, setBanksNbfc] = useState<BankNBFC[]>([]);
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loyaltyBankAccountsMap, setLoyaltyBankAccountsMap] = useState<Record<string, LoyaltyBankAccount[]>>({});
  
  // User-input document charges and approved amount
  const [userDocumentChargesPercent, setUserDocumentChargesPercent] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  
  // Customer creation dialog
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Current gold item being added
  const [currentItem, setCurrentItem] = useState<Partial<GoldItem & { selectedItemGroupId?: string }>>({
    item_type: '',
    selectedItemGroupId: '',
    item_id: '',
    description: '',
    gross_weight_grams: 0,
    stone_weight_grams: 0,
    purity: '22k',
  });
  
  // View agreement dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<SaleAgreement | null>(null);
  const [viewingGoldItems, setViewingGoldItems] = useState<GoldItem[]>([]);
  
  // Edit agreement dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<SaleAgreement | null>(null);
  
  // Print dialog
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printingAgreement, setPrintingAgreement] = useState<SaleAgreement | null>(null);
  const [printingCustomer, setPrintingCustomer] = useState<Customer | null>(null);
  const [printingGoldItems, setPrintingGoldItems] = useState<GoldItem[]>([]);
  
  // Bulk operations
  const [selectedAgreementIds, setSelectedAgreementIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  // Print settings for statement PDF
  const { settings: printSettings } = useEffectivePrintSettings();
  
  // Approval workflow
  const { checkApprovalRequired, canAutoApprove, submitForApproval } = useApprovalWorkflow();

  const canManageAgreements = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchAgreements();
      fetchCustomers();
      fetchSchemes();
      fetchAgents();
      fetchItemGroups();
      fetchItems();
      fetchBanksNbfc();
      fetchLoyalties();
    }
  }, [client]);

  // Set default item group (Gold) when item groups load
  useEffect(() => {
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    if (goldGroup && !currentItem.selectedItemGroupId) {
      setCurrentItem(prev => ({ ...prev, selectedItemGroupId: goldGroup.id }));
    }
  }, [itemGroups]);

  useEffect(() => {
    if (currentBranch?.id && !selectedBranchId) {
      setSelectedBranchId(currentBranch.id);
    }
  }, [currentBranch, selectedBranchId]);

  const fetchAgreements = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone, address, city, state, pincode, photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, ltv_percentage, strike_periods)
        `)
        .eq('client_id', client.id)
        .eq('transaction_type', 'sale_agreement')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements((data || []) as SaleAgreement[]);
    } catch (error: unknown) {
      toast.error('Failed to fetch sale agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('customers')
      .select('id, customer_code, full_name, phone, address, city, state, pincode, photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');
    setCustomers(data || []);
  };

  const fetchSchemes = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('schemes')
      .select('id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, document_charges, rate_18kt, rate_22kt, strike_periods')
      .eq('client_id', client.id)
      .eq('scheme_type', 'sale_agreement')
      .eq('is_active', true)
      .order('scheme_name');
    setSchemes((data || []) as Scheme[]);
  };

  const fetchAgents = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('agents')
      .select('id, agent_code, full_name, phone, commission_percentage, total_commission_earned')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');
    setAgents(data || []);
  };

  const fetchItemGroups = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('item_groups')
      .select('id, group_code, group_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('group_name');
    setItemGroups(data || []);
  };

  const fetchItems = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('items')
      .select('id, item_group_id, item_code, item_name, tamil_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('item_name');
    setItems(data || []);
  };

  const fetchBanksNbfc = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('banks_nbfc')
      .select('id, bank_code, bank_name, account_number, branch_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('bank_name');
    setBanksNbfc(data || []);
  };

  const fetchLoyalties = async () => {
    if (!client) return;
    const { data } = await supabase
      .from('loyalties')
      .select('id, loyalty_code, full_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');
    setLoyalties(data || []);
  };

  const fetchLoyaltyBankAccounts = async (loyaltyId: string) => {
    if (!client || !loyaltyId) return;
    if (loyaltyBankAccountsMap[loyaltyId]) return;
    
    const { data } = await supabase
      .from('loyalty_bank_accounts')
      .select('id, loyalty_id, bank_id, account_number, account_holder_name, account_type, bank:banks_nbfc(bank_name)')
      .eq('loyalty_id', loyaltyId)
      .eq('is_active', true);
    
    if (data) {
      setLoyaltyBankAccountsMap(prev => ({ ...prev, [loyaltyId]: data as LoyaltyBankAccount[] }));
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedSchemeId('');
    setSelectedBranchId(currentBranch?.id || '');
    setSelectedAgentId('');
    setGoldItems([]);
    setTenureDays('');
    setJewelPhotoUrl(null);
    setAppraiserSheetUrl(null);
    setPaymentEntries([{ mode: 'cash', amount: '', reference: '', sourceType: 'cash', sourceBankId: '', sourceAccountId: '', selectedLoyaltyId: '' }]);
    setUserDocumentChargesPercent('');
    setApprovedAmount('');
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    setCurrentItem({
      item_type: '',
      selectedItemGroupId: goldGroup?.id || '',
      item_id: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
    });
  };

  // Get rate based on item purity
  const getRateForPurity = (purity: string, scheme: Scheme) => {
    switch (purity) {
      case '22k':
        return scheme.rate_22kt || 0;
      case '18k':
        return scheme.rate_18kt || 0;
      case '24k':
        return (scheme.rate_22kt || 0) * (24 / 22);
      case '20k':
        return (scheme.rate_22kt || 0) * (20 / 22);
      case '14k':
        return (scheme.rate_22kt || 0) * (14 / 22);
      default:
        return 0;
    }
  };

  const addGoldItem = () => {
    const selectedItem = items.find(i => i.id === currentItem.item_id);
    const itemName = selectedItem?.item_name || currentItem.item_type || '';
    
    if (!itemName || !currentItem.gross_weight_grams) {
      toast.error('Please select an item and enter weight');
      return;
    }

    if (!selectedSchemeId) {
      toast.error('Please select a scheme first');
      return;
    }

    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme?.rate_22kt) {
      toast.error('Selected scheme does not have 22KT rate configured');
      return;
    }

    const netWeight = currentItem.gross_weight_grams! - (currentItem.stone_weight_grams || 0);
    const purity = currentItem.purity || '22k';
    const purityPercent = PURITY_MAP[purity];
    const rateForPurity = getRateForPurity(purity, scheme);
    
    const appraisedValue = netWeight * rateForPurity;
    
    let marketValue = 0;
    const today = new Date().toISOString().split('T')[0];
    if (todayMarketRate) {
      const marketRateForPurity = purity === '24k' ? todayMarketRate.rate_24kt 
        : purity === '22k' ? todayMarketRate.rate_22kt 
        : purity === '18k' ? todayMarketRate.rate_18kt
        : todayMarketRate.rate_22kt * (PURITY_MAP[purity] / 91.6);
      marketValue = netWeight * marketRateForPurity;
    }

    const newItem: GoldItem = {
      item_type: selectedItem ? `${selectedItem.item_code} - ${selectedItem.item_name}` : itemName,
      item_id: currentItem.item_id,
      item_group_id: currentItem.selectedItemGroupId,
      description: currentItem.description || '',
      gross_weight_grams: currentItem.gross_weight_grams!,
      net_weight_grams: netWeight,
      purity: purity,
      purity_percentage: purityPercent,
      stone_weight_grams: currentItem.stone_weight_grams || 0,
      market_rate_per_gram: rateForPurity,
      appraised_value: appraisedValue,
      market_value: marketValue,
      market_rate_date: todayMarketRate?.rate_date || today,
    };

    setGoldItems([...goldItems, newItem]);
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    setCurrentItem({
      item_type: '',
      selectedItemGroupId: goldGroup?.id || currentItem.selectedItemGroupId,
      item_id: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
    });
  };

  const removeGoldItem = (index: number) => {
    setGoldItems(goldItems.filter((_, i) => i !== index));
  };

  // Calculate agreement with dual-rate system
  const agreementCalculation = useMemo(() => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return null;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    const maxPurchaseAmount = totalAppraisedValue * (scheme.ltv_percentage / 100);
    const purchaseAmount = Math.round(Math.min(Math.max(maxPurchaseAmount, scheme.min_amount), scheme.max_amount));
    
    const selectedTenure = tenureDays ? parseInt(tenureDays) : scheme.max_tenure_days;
    
    // Calculate dual-rate advance margin
    const advanceCalc = calculateAdvanceInterest(purchaseAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate || 18,
      effective_rate: scheme.effective_rate || 24,
      minimum_days: scheme.minimum_days || 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    }, selectedTenure);

    // Purchase Price on Record = Purchase Amount + Differential
    const priceOnRecord = advanceCalc.actualPrincipal;
    
    // Max Approved Amount = Price on Record × 1.10 (10% above)
    const maxApprovedAmount = Math.round(priceOnRecord * 1.10);
    
    // Use user-entered approved amount or default to price on record
    const finalApprovedAmount = approvedAmount ? parseFloat(approvedAmount) : priceOnRecord;
    
    // Document charges percentage
    const docChargesPercent = userDocumentChargesPercent ? parseFloat(userDocumentChargesPercent) : (scheme.document_charges || 0);
    
    // Document charges calculated on Price on Record
    const documentCharges = Math.round(priceOnRecord * (docChargesPercent / 100));
    
    // Processing fee on the final approved amount
    const processingFee = Math.round(finalApprovedAmount * ((scheme.processing_fee_percentage || 0) / 100));

    // Net cash to seller = Approved Amount - Advance Margin - Processing Fee - Document Charges
    const netCashToSeller = finalApprovedAmount - advanceCalc.shownInterest - processingFee - documentCharges;
    
    // Calculate rebate schedule
    const rebateSchedule = calculateRebateSchedule(advanceCalc.differential);

    // Calculate strike prices
    const strikePeriods = parseSchemeStrikePeriods(scheme.strike_periods);
    const strikeCalc = calculateStrikePrices(
      finalApprovedAmount,
      scheme.shown_rate,
      scheme.effective_rate,
      scheme.processing_fee_percentage || 0,
      format(new Date(), 'yyyy-MM-dd'),
      selectedTenure,
      strikePeriods
    );

    return {
      totalAppraisedValue,
      purchaseAmount,
      priceOnRecord,
      maxApprovedAmount,
      finalApprovedAmount,
      processingFee,
      documentCharges,
      documentChargesPercentage: docChargesPercent,
      advanceCalc,
      netCashToSeller,
      rebateSchedule,
      scheme,
      strikePrices: strikeCalc.strikePrices,
      expiryDate: strikeCalc.expiryDate,
    };
  }, [goldItems, selectedSchemeId, schemes, tenureDays, userDocumentChargesPercent, approvedAmount]);

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId);

  const generateAgreementNumber = () => {
    const prefix = 'SA';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  };

  const handleCreateAgreement = async () => {
    if (!client) {
      toast.error('Client not loaded - please refresh the page');
      return;
    }
    if (!selectedCustomerId) {
      toast.error('Please select a seller');
      return;
    }
    if (!selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }
    if (!selectedSchemeId) {
      toast.error('Please select a scheme');
      return;
    }
    if (goldItems.length === 0) {
      toast.error('Please add at least one gold item');
      return;
    }
    if (!tenureDays) {
      toast.error('Option period not set - please select a scheme');
      return;
    }
    if (!agreementCalculation) {
      toast.error('Calculation failed - please check scheme and gold items');
      return;
    }

    // Validate approved amount
    if (agreementCalculation.finalApprovedAmount > agreementCalculation.maxApprovedAmount) {
      toast.error(`Approved amount cannot exceed ${formatIndianCurrency(agreementCalculation.maxApprovedAmount)} (10% above Price on Record)`);
      return;
    }

    // Validate payment entries tally
    const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (totalPayments !== agreementCalculation.netCashToSeller) {
      toast.error(`Payment amounts must total ${formatIndianCurrency(agreementCalculation.netCashToSeller)}. Current total: ${formatIndianCurrency(totalPayments)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Check if approval is required
      const purchaseAmount = agreementCalculation.finalApprovedAmount;
      const { required: approvalRequired } = await checkApprovalRequired('loan', purchaseAmount);
      const userCanAutoApprove = await canAutoApprove('loan');
      
      const approvalStatus = (!approvalRequired || userCanAutoApprove) ? 'approved' : 'pending';
      
      const agreementDate = new Date();
      const expiryDate = addDays(agreementDate, parseInt(tenureDays));
      const nextDueDate = addMonths(agreementDate, agreementCalculation.scheme.advance_interest_months || 3);

      const agreementData = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        agent_id: selectedAgentId || null,
        loan_number: generateAgreementNumber(),
        loan_date: format(agreementDate, 'yyyy-MM-dd'),
        principal_amount: agreementCalculation.finalApprovedAmount,
        shown_principal: agreementCalculation.purchaseAmount,
        actual_principal: agreementCalculation.priceOnRecord,
        interest_rate: agreementCalculation.scheme.shown_rate || 18,
        tenure_days: parseInt(tenureDays),
        maturity_date: format(expiryDate, 'yyyy-MM-dd'),
        processing_fee: agreementCalculation.processingFee,
        net_disbursed: agreementCalculation.netCashToSeller,
        advance_interest_shown: agreementCalculation.advanceCalc.shownInterest,
        advance_interest_actual: agreementCalculation.advanceCalc.actualInterest,
        differential_capitalized: agreementCalculation.advanceCalc.differential,
        next_interest_due_date: format(nextDueDate, 'yyyy-MM-dd'),
        last_interest_paid_date: format(agreementDate, 'yyyy-MM-dd'),
        created_by: profile?.id,
        appraised_by: profile?.id,
        jewel_photo_url: jewelPhotoUrl,
        appraiser_sheet_url: appraiserSheetUrl,
        disbursement_mode: paymentEntries[0]?.mode || 'cash',
        document_charges: agreementCalculation.documentCharges,
        payment_reference: paymentEntries[0]?.reference || null,
        approval_status: approvalStatus,
        transaction_type: 'sale_agreement',
      };

      const { data: agreementResult, error: agreementError } = await supabase
        .from('loans')
        .insert(agreementData)
        .select()
        .single();

      if (agreementError) throw agreementError;

      // Insert multiple disbursement entries
      if (paymentEntries.length > 0) {
        const disbursementsData = paymentEntries
          .filter(entry => parseFloat(entry.amount) > 0)
          .map(entry => ({
            loan_id: agreementResult.id,
            payment_mode: entry.mode,
            amount: parseFloat(entry.amount),
            reference_number: entry.reference || null,
            source_type: entry.sourceType,
            source_bank_id: entry.sourceType === 'company' ? (entry.sourceBankId || null) : null,
            source_account_id: entry.sourceType === 'employee' ? (entry.sourceAccountId || null) : null,
          }));

        if (disbursementsData.length > 0) {
          const { error: disbursementError } = await supabase
            .from('loan_disbursements')
            .insert(disbursementsData);

          if (disbursementError) throw disbursementError;
        }
      }

      // Insert gold items
      const goldItemsData = goldItems.map(item => ({
        loan_id: agreementResult.id,
        item_type: item.item_type as string,
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

      const { error: itemsError } = await supabase
        .from('gold_items')
        .insert(goldItemsData);

      if (itemsError) throw itemsError;

      // Generate accounting voucher
      const voucherResult = await generateLoanDisbursementVoucher({
        clientId: client.id,
        branchId: selectedBranchId,
        loanId: agreementResult.id,
        loanNumber: agreementResult.loan_number,
        principalAmount: agreementCalculation.finalApprovedAmount,
        actualPrincipal: agreementCalculation.priceOnRecord,
        netDisbursed: agreementCalculation.netCashToSeller,
        processingFee: agreementCalculation.processingFee,
        documentCharges: agreementCalculation.documentCharges,
        advanceInterestShown: agreementCalculation.advanceCalc.shownInterest,
        advanceInterestActual: agreementCalculation.advanceCalc.actualInterest,
        paymentMode: paymentEntries[0]?.mode || 'cash',
      });

      if (!voucherResult.success && voucherResult.error) {
        console.warn('Voucher generation failed:', voucherResult.error);
      }

      // Handle agent commission
      if (selectedAgentId) {
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        if (selectedAgent && selectedAgent.commission_percentage) {
          const commissionAmount = (agreementCalculation.purchaseAmount * selectedAgent.commission_percentage) / 100;
          const newTotalCommission = (selectedAgent.total_commission_earned || 0) + commissionAmount;
          
          await supabase
            .from('agents')
            .update({ total_commission_earned: newTotalCommission })
            .eq('id', selectedAgentId);

          const commissionVoucherResult = await generateAgentCommissionAccrualVoucher({
            clientId: client.id,
            branchId: selectedBranchId,
            loanId: agreementResult.id,
            loanNumber: agreementResult.loan_number,
            commissionAmount,
            agentName: selectedAgent.full_name,
          });

          if (!commissionVoucherResult.success && commissionVoucherResult.error) {
            console.warn('Commission accrual voucher failed:', commissionVoucherResult.error);
          }
        }
      }

      toast.success(`Sale Agreement ${agreementResult.loan_number} created successfully`);
      
      // Submit for approval if required
      if (approvalStatus === 'pending') {
        await submitForApproval({
          workflowType: 'loan',
          entityType: 'loan',
          entityId: agreementResult.id,
          entityNumber: agreementResult.loan_number,
          branchId: selectedBranchId,
          amount: purchaseAmount,
          description: `Sale Agreement ${agreementResult.loan_number} for ${customers.find(c => c.id === selectedCustomerId)?.full_name}`,
        });
        toast.info('Agreement submitted for approval');
      }
      
      setIsFormOpen(false);
      resetForm();
      fetchAgreements();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create agreement';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const viewAgreementDetails = async (agreement: SaleAgreement) => {
    setViewingAgreement(agreement);
    const { data } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', agreement.id);
    setViewingGoldItems(data || []);
    setViewDialogOpen(true);
  };

  const handleEditAgreement = (agreement: SaleAgreement) => {
    if (!attemptEdit()) return;
    setEditingAgreement(agreement);
    setEditDialogOpen(true);
  };

  const handlePrintAgreement = async (agreement: SaleAgreement) => {
    const { data: goldItemsData } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', agreement.id);
    
    const fullCustomer = customers.find(c => c.id === agreement.customer.id);
    
    setPrintingAgreement(agreement);
    setPrintingCustomer(fullCustomer || agreement.customer as Customer);
    setPrintingGoldItems(goldItemsData || []);
    setPrintDialogOpen(true);
  };

  const handleGenerateStatement = async (agreement: SaleAgreement) => {
    try {
      toast.info('Generating statement...');
      
      const { data: goldItemsData } = await supabase
        .from('gold_items')
        .select('*')
        .eq('loan_id', agreement.id);
      
      const { data: paymentsData } = await supabase
        .from('interest_payments')
        .select('*')
        .eq('loan_id', agreement.id)
        .order('payment_date', { ascending: false });
      
      const fullCustomer = customers.find(c => c.id === agreement.customer.id);
      
      const totalInterestPaid = paymentsData?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
      
      const statementData = {
        loan_number: agreement.loan_number,
        loan_date: agreement.loan_date,
        maturity_date: agreement.maturity_date,
        principal_amount: agreement.actual_principal || agreement.principal_amount,
        interest_rate: agreement.interest_rate,
        tenure_days: agreement.tenure_days,
        status: agreement.status,
        net_disbursed: agreement.net_disbursed,
        advance_interest_shown: agreement.advance_interest_shown || null,
        processing_fee: null,
        document_charges: null,
        total_interest_paid: totalInterestPaid,
        outstanding_principal: agreement.actual_principal || agreement.principal_amount,
        outstanding_interest: 0,
        customer: {
          full_name: fullCustomer?.full_name || agreement.customer.full_name,
          customer_code: fullCustomer?.customer_code || agreement.customer.customer_code,
          phone: fullCustomer?.phone || agreement.customer.phone,
          address: fullCustomer?.address || ''
        },
        scheme: {
          scheme_name: agreement.scheme.scheme_name,
          interest_rate: agreement.scheme.interest_rate
        },
        gold_items: (goldItemsData || []).map(item => ({
          item_type: item.item_type,
          gross_weight_grams: item.gross_weight_grams,
          net_weight_grams: item.net_weight_grams,
          purity: item.purity,
          appraised_value: item.appraised_value
        })),
        interest_payments: (paymentsData || []).map(p => ({
          id: p.id,
          receipt_number: p.receipt_number,
          payment_date: p.payment_date,
          period_from: p.period_from,
          period_to: p.period_to,
          days_covered: p.days_covered,
          amount_paid: p.amount_paid,
          payment_mode: p.payment_mode
        }))
      };
      
      const branchName = getBranchName(agreement.branch_id);
      
      const blob = await pdf(
        <LoanStatementPDF 
          loan={statementData}
          companyName={client?.company_name || 'Gold Finance'}
          branchName={branchName}
          logoUrl={printSettings?.logo_url || ''}
          asOfDate={new Date().toISOString().split('T')[0]}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast.success('Statement generated');
    } catch (error) {
      toast.error('Failed to generate statement');
    }
  };

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.branch_name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      case 'overdue': return 'bg-red-500';
      case 'auctioned': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active Option';
      case 'closed': return 'Exercised';
      case 'overdue': return 'Overdue';
      case 'auctioned': return 'Forfeited';
      default: return status;
    }
  };

  // Filter agreements
  const filteredAgreements = agreements.filter(a => {
    const matchesSearch = 
      a.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || a.approval_status === approvalFilter;
    return matchesSearch && matchesStatus && matchesApproval;
  });

  // Bulk selection
  const toggleSelectAgreement = (id: string) => {
    const newSelected = new Set(selectedAgreementIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAgreementIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAgreementIds.size === filteredAgreements.length) {
      setSelectedAgreementIds(new Set());
    } else {
      setSelectedAgreementIds(new Set(filteredAgreements.map(a => a.id)));
    }
  };

  const selectedAgreements = agreements.filter(a => selectedAgreementIds.has(a.id));
  const clearSelection = () => setSelectedAgreementIds(new Set());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sale Agreements</h1>
            <p className="text-muted-foreground">Bill of Sale & Repurchase Option transactions</p>
          </div>
          {canManageAgreements && (
            <Button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isFormOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
              {isFormOpen ? 'Close Form' : 'New Purchase'}
            </Button>
          )}
        </div>

        {/* New Agreement Form - Collapsible */}
        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <CollapsibleContent>
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                  New Purchase Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section 1: Seller, Branch & Agent */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-amber-600" />
                    Seller, Branch & Referral
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Seller (Customer) *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Search by name, code, or phone..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="pr-8"
                          />
                          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCustomerDialog(true)}
                          className="shrink-0"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      {customerSearchQuery && (
                        <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-lg">
                          {customers
                            .filter(c => {
                              const query = customerSearchQuery.toLowerCase();
                              return (
                                c.full_name.toLowerCase().includes(query) ||
                                c.customer_code.toLowerCase().includes(query) ||
                                (c.phone && c.phone.slice(-4).includes(query))
                              );
                            })
                            .slice(0, 10)
                            .map((customer) => (
                              <div
                                key={customer.id}
                                className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${selectedCustomerId === customer.id ? 'bg-accent' : ''}`}
                                onClick={() => {
                                  setSelectedCustomerId(customer.id);
                                  setCustomerSearchQuery('');
                                }}
                              >
                                <span className="font-medium">{customer.customer_code}</span> - {customer.full_name}
                                <span className="text-muted-foreground ml-2">(...{customer.phone?.slice(-4)})</span>
                              </div>
                            ))}
                          {customers.filter(c => {
                            const query = customerSearchQuery.toLowerCase();
                            return (
                              c.full_name.toLowerCase().includes(query) ||
                              c.customer_code.toLowerCase().includes(query) ||
                              (c.phone && c.phone.slice(-4).includes(query))
                            );
                          }).length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No sellers found</div>
                          )}
                        </div>
                      )}
                      {selectedCustomerId && !customerSearchQuery && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {customers.find(c => c.id === selectedCustomerId)?.customer_code} - {customers.find(c => c.id === selectedCustomerId)?.full_name}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => setSelectedCustomerId('')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
                    <div className="space-y-2">
                      <Label>Referral Agent</Label>
                      <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.agent_code} - {agent.full_name} ({agent.commission_percentage}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Seller Summary Card */}
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
                  <div className="space-y-3">
                    <Select 
                      value={selectedSchemeId} 
                      onValueChange={(v) => { 
                        setSelectedSchemeId(v); 
                        setGoldItems([]); 
                        const scheme = schemes.find(s => s.id === v);
                        if (scheme) {
                          setTenureDays(scheme.max_tenure_days.toString());
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a sale scheme" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {schemes.map((scheme) => (
                          <SelectItem key={scheme.id} value={scheme.id}>
                            {scheme.scheme_name} ({scheme.scheme_code}) - {scheme.shown_rate}% | LTV {scheme.ltv_percentage}% | 22KT: ₹{scheme.rate_22kt}/g
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedScheme && (
                      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Trade Margin Rate</p>
                              <p className="font-medium text-green-600">{selectedScheme.shown_rate}% p.a.</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">LTV</p>
                              <p className="font-medium">{selectedScheme.ltv_percentage}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">22KT Rate</p>
                              <p className="font-medium text-amber-600">₹{selectedScheme.rate_22kt}/g</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">18KT Rate</p>
                              <p className="font-medium text-amber-500">₹{selectedScheme.rate_18kt}/g</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Option Period</p>
                              <p className="font-medium">{selectedScheme.max_tenure_days} days</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Section 3: Gold Items (Goods Description) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-amber-600" />
                      Goods Description (Gold Appraisal)
                    </h3>
                    {selectedSchemeId && schemes.find(s => s.id === selectedSchemeId)?.rate_22kt && (
                      <Badge variant="outline" className="text-amber-600">
                        22KT: ₹{schemes.find(s => s.id === selectedSchemeId)?.rate_22kt}/g | 18KT: ₹{schemes.find(s => s.id === selectedSchemeId)?.rate_18kt}/g
                      </Badge>
                    )}
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Item Group *</Label>
                          <Select 
                            value={currentItem.selectedItemGroupId} 
                            onValueChange={(v) => setCurrentItem({...currentItem, selectedItemGroupId: v, item_id: ''})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                              {itemGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.group_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Item *</Label>
                          <Select 
                            value={currentItem.item_id} 
                            onValueChange={(v) => {
                              const item = items.find(i => i.id === v);
                              setCurrentItem({...currentItem, item_id: v, item_type: item?.item_name || ''});
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items
                                .filter(item => !currentItem.selectedItemGroupId || item.item_group_id === currentItem.selectedItemGroupId)
                                .map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.item_code} - {item.item_name} {item.tamil_name ? `(${item.tamil_name})` : ''}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gross Wt (g) *</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={currentItem.gross_weight_grams || ''}
                            onChange={(e) => setCurrentItem({...currentItem, gross_weight_grams: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stone Wt (g)</Label>
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
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Description (Optional)</Label>
                          <Input
                            value={currentItem.description || ''}
                            onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                            placeholder="Additional details"
                          />
                        </div>
                        <Button type="button" onClick={addGoldItem} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add Item
                        </Button>
                      </div>
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
                              <TableHead className="text-right">Market Value</TableHead>
                              <TableHead className="text-right">Purchase Value</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goldItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="capitalize">{item.item_type}</TableCell>
                                <TableCell>{item.net_weight_grams.toFixed(3)}</TableCell>
                                <TableCell>{item.purity}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {item.market_value ? formatIndianCurrency(item.market_value) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatIndianCurrency(item.appraised_value)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => removeGoldItem(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={3} className="font-semibold">Totals</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatIndianCurrency(goldItems.reduce((sum, item) => sum + (item.market_value || 0), 0))}
                              </TableCell>
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

                {/* Section 4: Agreement Calculation - Dual View */}
                {agreementCalculation && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Calculator className="h-4 w-4 text-amber-600" />
                      Agreement Calculation
                    </h3>

                    {/* Approved Amount Section */}
                    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Purchase Amount Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Spot Purchase Price (LTV)</Label>
                            <div className="text-sm font-medium">{formatIndianCurrency(agreementCalculation.purchaseAmount)}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Price on Record</Label>
                            <div className="text-sm font-medium text-amber-600">{formatIndianCurrency(agreementCalculation.priceOnRecord)}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Approved (+10%)</Label>
                            <div className="text-sm font-medium text-blue-600">{formatIndianCurrency(agreementCalculation.maxApprovedAmount)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Approved Purchase Amount *</Label>
                            <Input
                              type="number"
                              value={approvedAmount}
                              onChange={(e) => setApprovedAmount(e.target.value)}
                              placeholder={agreementCalculation.priceOnRecord.toString()}
                              className={`${
                                approvedAmount && parseFloat(approvedAmount) > agreementCalculation.maxApprovedAmount
                                  ? 'border-destructive focus-visible:ring-destructive'
                                  : ''
                              }`}
                            />
                            {approvedAmount && parseFloat(approvedAmount) > agreementCalculation.maxApprovedAmount && (
                              <p className="text-xs text-destructive">Cannot exceed {formatIndianCurrency(agreementCalculation.maxApprovedAmount)}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Purchase Calculation */}
                      <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" />
                            Purchase Calculation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Appraised Value</span>
                            <span className="font-medium">{formatIndianCurrency(agreementCalculation.totalAppraisedValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Spot Price (@ {agreementCalculation.scheme.ltv_percentage}% LTV)</span>
                            <span className="font-medium">{formatIndianCurrency(agreementCalculation.purchaseAmount)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>Margin Adjustment</span>
                            <span>+{formatIndianCurrency(agreementCalculation.advanceCalc.differential)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-amber-700">
                            <span>Price on Record</span>
                            <span>{formatIndianCurrency(agreementCalculation.priceOnRecord)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-blue-600">
                            <span>Approved Amount</span>
                            <span>{formatIndianCurrency(agreementCalculation.finalApprovedAmount)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-muted-foreground">
                            <span>Trade Margin Rate</span>
                            <span>{agreementCalculation.scheme.shown_rate}% p.a.</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Option Period</span>
                            <span>{tenureDays} days</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Less: Advance Margin ({agreementCalculation.scheme.advance_interest_months} months)</span>
                            <span>-{formatIndianCurrency(agreementCalculation.advanceCalc.shownInterest)}</span>
                          </div>
                          {agreementCalculation.processingFee > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Less: Processing Fee</span>
                              <span>-{formatIndianCurrency(agreementCalculation.processingFee)}</span>
                            </div>
                          )}
                          {agreementCalculation.documentCharges > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Less: Document Charges ({agreementCalculation.documentChargesPercentage}%)</span>
                              <span>-{formatIndianCurrency(agreementCalculation.documentCharges)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg text-green-700 dark:text-green-400">
                            <span>Net Cash to Seller</span>
                            <span>{formatIndianCurrency(agreementCalculation.netCashToSeller)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Early Exercise Rebate Schedule */}
                      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Early Exercise Benefit
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Rebate on early repurchase</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="space-y-2">
                            {agreementCalculation.rebateSchedule.slots.map((slot, index) => (
                              <div key={index} className="flex justify-between items-center py-1 border-b border-amber-200/50 dark:border-amber-800/50 last:border-0">
                                <span className="text-muted-foreground">Within {slot.dayRange}</span>
                                <span className="font-medium text-green-600">{formatIndianCurrency(slot.rebateAmount)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center py-1 pt-2">
                              <span className="text-muted-foreground">After 75 days</span>
                              <span className="font-medium text-muted-foreground">No rebate</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Strike Price Preview */}
                      <Card className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-purple-700 dark:text-purple-400 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Strike Price Preview
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Repurchase option prices</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {agreementCalculation.strikePrices.map((strike, index) => (
                            <div key={index} className="flex justify-between items-center py-1 border-b border-purple-200/50 dark:border-purple-800/50 last:border-0">
                              <span className="text-muted-foreground">{strike.periodLabel}</span>
                              <span className="font-medium text-purple-600">{formatIndianCurrency(strike.strikePrice)}</span>
                            </div>
                          ))}
                          <div className="pt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Option Expiry:</span> {agreementCalculation.expiryDate}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {tenureDays && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Option Expiry Date:</span> {format(addDays(new Date(), parseInt(tenureDays)), 'dd MMM yyyy')}
                        <span className="mx-4">|</span>
                        <span className="font-medium">Next Margin Due:</span> {format(addMonths(new Date(), agreementCalculation.scheme.advance_interest_months || 3), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Section 5: Payment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4 text-amber-600" />
                    Payment Details
                  </h3>
                  
                  {/* Document Charges */}
                  {agreementCalculation && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Document Charges %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={userDocumentChargesPercent}
                          onChange={(e) => setUserDocumentChargesPercent(e.target.value)}
                          placeholder={(agreementCalculation.scheme.document_charges || 0).toString()}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Document Charges Amount</Label>
                        <div className="text-sm font-medium text-amber-600 pt-2">{formatIndianCurrency(agreementCalculation.documentCharges)}</div>
                        <p className="text-xs text-muted-foreground">On Price on Record</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Processing Fee</Label>
                        <div className="text-sm font-medium pt-2">{formatIndianCurrency(agreementCalculation.processingFee)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Advance Margin</Label>
                        <div className="text-sm font-medium pt-2">{formatIndianCurrency(agreementCalculation.advanceCalc.shownInterest)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Net Cash to Seller</Label>
                        <div className="text-sm font-bold text-green-600 pt-2">{formatIndianCurrency(agreementCalculation.netCashToSeller)}</div>
                      </div>
                    </div>
                  )}

                  {/* Multiple Payment Entries */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Payment Breakup</Label>
                    {paymentEntries.map((entry, index) => (
                      <div key={index} className="space-y-3 p-3 border rounded-lg bg-background">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                            <Select 
                              value={entry.mode} 
                              onValueChange={(value) => {
                                const updated = [...paymentEntries];
                                updated[index].mode = value;
                                if (value === 'cash') {
                                  updated[index].sourceType = 'cash';
                                  updated[index].sourceBankId = '';
                                  updated[index].sourceAccountId = '';
                                  updated[index].selectedLoyaltyId = '';
                                } else if (!updated[index].sourceType || updated[index].sourceType === 'cash') {
                                  updated[index].sourceType = 'company';
                                }
                                setPaymentEntries(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="neft">NEFT</SelectItem>
                                <SelectItem value="rtgs">RTGS</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                            <Input
                              type="number"
                              value={entry.amount}
                              onChange={(e) => {
                                const updated = [...paymentEntries];
                                updated[index].amount = e.target.value;
                                setPaymentEntries(updated);
                              }}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <Label className="text-xs text-muted-foreground">Reference Number</Label>
                            <Input
                              value={entry.reference}
                              onChange={(e) => {
                                const updated = [...paymentEntries];
                                updated[index].reference = e.target.value;
                                setPaymentEntries(updated);
                              }}
                              placeholder={entry.mode === 'cash' ? 'N/A for cash' : 'Transaction/Cheque number'}
                              disabled={entry.mode === 'cash'}
                            />
                          </div>
                          <div className="md:col-span-4">
                            {entry.mode !== 'cash' && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Source Type</Label>
                                <Select 
                                  value={entry.sourceType} 
                                  onValueChange={(value: 'company' | 'employee') => {
                                    const updated = [...paymentEntries];
                                    updated[index].sourceType = value;
                                    updated[index].sourceBankId = '';
                                    updated[index].sourceAccountId = '';
                                    updated[index].selectedLoyaltyId = '';
                                    setPaymentEntries(updated);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="company">Company Account</SelectItem>
                                    <SelectItem value="employee">Employee Account</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-1 flex items-end justify-end">
                            {paymentEntries.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setPaymentEntries(paymentEntries.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Source Account Selection Row */}
                        {entry.mode !== 'cash' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pl-2 border-l-2 border-amber-500/30">
                            {entry.sourceType === 'company' && (
                              <div className="md:col-span-6 space-y-1">
                                <Label className="text-xs text-muted-foreground">Company Bank Account</Label>
                                <Select 
                                  value={entry.sourceBankId} 
                                  onValueChange={(value) => {
                                    const updated = [...paymentEntries];
                                    updated[index].sourceBankId = value;
                                    setPaymentEntries(updated);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select company bank account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {banksNbfc.map((bank) => (
                                      <SelectItem key={bank.id} value={bank.id}>
                                        {bank.bank_name} {bank.branch_name ? `- ${bank.branch_name}` : ''} {bank.account_number ? `(A/C ${bank.account_number})` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {entry.sourceType === 'employee' && (
                              <>
                                <div className="md:col-span-4 space-y-1">
                                  <Label className="text-xs text-muted-foreground">Employee</Label>
                                  <Select 
                                    value={entry.selectedLoyaltyId} 
                                    onValueChange={(value) => {
                                      const updated = [...paymentEntries];
                                      updated[index].selectedLoyaltyId = value;
                                      updated[index].sourceAccountId = '';
                                      setPaymentEntries(updated);
                                      fetchLoyaltyBankAccounts(value);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {loyalties.map((loyalty) => (
                                        <SelectItem key={loyalty.id} value={loyalty.id}>
                                          {loyalty.loyalty_code} - {loyalty.full_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="md:col-span-5 space-y-1">
                                  <Label className="text-xs text-muted-foreground">Employee Bank Account</Label>
                                  <Select 
                                    value={entry.sourceAccountId} 
                                    onValueChange={(value) => {
                                      const updated = [...paymentEntries];
                                      updated[index].sourceAccountId = value;
                                      setPaymentEntries(updated);
                                    }}
                                    disabled={!entry.selectedLoyaltyId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={entry.selectedLoyaltyId ? "Select account" : "Select employee first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(loyaltyBankAccountsMap[entry.selectedLoyaltyId] || []).map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                          {account.bank?.bank_name || 'Bank'} - A/C {account.account_number} ({account.account_type || 'Savings'})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentEntries([...paymentEntries, { mode: 'cash', amount: '', reference: '', sourceType: 'cash', sourceBankId: '', sourceAccountId: '', selectedLoyaltyId: '' }])}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Mode
                    </Button>

                    {/* Payment Tally */}
                    {agreementCalculation && (
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg font-medium">
                        <span>Total Cash to Seller</span>
                        {(() => {
                          const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                          const isMatched = totalPayments === agreementCalculation.netCashToSeller;
                          const diff = agreementCalculation.netCashToSeller - totalPayments;
                          return (
                            <div className="flex items-center gap-3">
                              <span className={isMatched ? "text-green-600" : "text-destructive"}>
                                {formatIndianCurrency(totalPayments)} / {formatIndianCurrency(agreementCalculation.netCashToSeller)}
                              </span>
                              {!isMatched && totalPayments > 0 && (
                                <Badge variant={diff > 0 ? "secondary" : "destructive"} className="text-xs">
                                  {diff > 0 ? `Short: ${formatIndianCurrency(diff)}` : `Over: ${formatIndianCurrency(Math.abs(diff))}`}
                                </Badge>
                              )}
                              {isMatched && <Badge className="bg-green-600 text-xs">Matched ✓</Badge>}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Section 6: Image Capture */}
                {client && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-amber-600" />
                      Photo Capture
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageCapture
                        clientId={client.id}
                        label="Jewel Photo"
                        folder="jewel-photos"
                        value={jewelPhotoUrl}
                        onChange={setJewelPhotoUrl}
                      />
                      <ImageCapture
                        clientId={client.id}
                        label="Appraiser Sheet"
                        folder="appraiser-sheets"
                        value={appraiserSheetUrl}
                        onChange={setAppraiserSheetUrl}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAgreement}
                    disabled={submitting || !agreementCalculation}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {submitting ? 'Creating...' : 'Create Sale Agreement'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Filters & Bulk Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by agreement no., seller name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Option</SelectItem>
                    <SelectItem value="closed">Exercised</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="auctioned">Forfeited</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Approvals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approvals</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedAgreementIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {selectedAgreementIds.size} selected
                  </Badge>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                  <Button size="sm" onClick={() => setBulkDialogOpen(true)}>
                    Bulk Actions
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agreements Table */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sale Agreements Found</h3>
              <p className="text-muted-foreground">Create your first sale agreement to get started</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedAgreementIds.size === filteredAgreements.length && filteredAgreements.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Agreement No.</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Spot Price</TableHead>
                      <TableHead className="text-right">Price on Record</TableHead>
                      <TableHead>Option Expiry</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.map((agreement) => (
                      <TableRow key={agreement.id} className={selectedAgreementIds.has(agreement.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAgreementIds.has(agreement.id)}
                            onCheckedChange={() => toggleSelectAgreement(agreement.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{agreement.loan_number}</span>
                            {agreement.approval_status && agreement.approval_status !== 'approved' && (
                              <ApprovalBadge status={agreement.approval_status} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(agreement.loan_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{agreement.customer.full_name}</p>
                            <p className="text-xs text-muted-foreground">{agreement.customer.customer_code} • {agreement.customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p>{formatIndianCurrency(agreement.principal_amount)}</p>
                          <p className="text-xs text-muted-foreground">@{agreement.scheme.shown_rate || agreement.interest_rate}% p.a.</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-amber-600 dark:text-amber-400 font-medium">{formatIndianCurrency(agreement.actual_principal || agreement.principal_amount)}</p>
                        </TableCell>
                        <TableCell>{format(new Date(agreement.maturity_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{getBranchName(agreement.branch_id)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(agreement.status)} text-white`}>
                            {getStatusLabel(agreement.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewAgreementDetails(agreement)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleGenerateStatement(agreement)}
                              title="Generate statement PDF"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePrintAgreement(agreement)}
                              title="Print Bill of Sale"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditAgreement(agreement)}
                              disabled={!canEdit}
                              title={canEdit ? "Edit agreement" : "Only tenant admin or branch manager can edit"}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (!attemptDelete()) return;
                                toast.info('Delete functionality coming soon');
                              }}
                              disabled={!canDelete}
                              title={canDelete ? "Delete agreement" : "Only tenant admin can delete"}
                              className={`text-destructive hover:text-destructive ${!canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        )}

        {/* Bulk Operations Dialog */}
        <BulkOperationsDialog
          open={bulkDialogOpen}
          onOpenChange={setBulkDialogOpen}
          selectedLoans={selectedAgreements}
          onClearSelection={clearSelection}
        />

        {/* View Agreement Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agreement Details - {viewingAgreement?.loan_number}</DialogTitle>
            </DialogHeader>
            
            {viewingAgreement && (
              <Tabs defaultValue="seller" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="seller">Seller View</TabsTrigger>
                  <TabsTrigger value="internal">Internal View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="seller" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Seller</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{viewingAgreement.customer.full_name}</p>
                        <p className="text-sm text-muted-foreground">{viewingAgreement.customer.customer_code} • {viewingAgreement.customer.phone}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Scheme</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{viewingAgreement.scheme.scheme_name}</p>
                        <p className="text-sm text-muted-foreground">@{viewingAgreement.scheme.shown_rate || viewingAgreement.interest_rate}% p.a.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Agreement Summary (Seller Receipt)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Spot Purchase Price</span>
                        <span className="font-medium">{formatIndianCurrency(viewingAgreement.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Advance Margin Deducted</span>
                        <span>-{formatIndianCurrency(viewingAgreement.advance_interest_shown || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Net Cash Paid</span>
                        <span className="text-green-600">{formatIndianCurrency(viewingAgreement.net_disbursed)}</span>
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
                        <span>Original Spot Price</span>
                        <span>{formatIndianCurrency(viewingAgreement.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Margin (Shown @{viewingAgreement.scheme.shown_rate}%)</span>
                        <span>{formatIndianCurrency(viewingAgreement.advance_interest_shown || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Margin (Actual)</span>
                        <span>{formatIndianCurrency(viewingAgreement.advance_interest_actual || 0)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Differential Added to Price</span>
                        <span>+{formatIndianCurrency(viewingAgreement.differential_capitalized || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Actual Price on Record (Books)</span>
                        <span className="text-amber-600">{formatIndianCurrency(viewingAgreement.actual_principal || viewingAgreement.principal_amount)}</span>
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

        {/* Print Dialog */}
        {printingAgreement && printingCustomer && (
          <LoanPrintDialog
            open={printDialogOpen}
            onOpenChange={setPrintDialogOpen}
            loan={printingAgreement as any}
            customer={printingCustomer}
            goldItems={printingGoldItems}
          />
        )}

        {/* Customer Creation Dialog */}
        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
            </DialogHeader>
            <InlineCustomerForm
              onSuccess={(customerId) => {
                setSelectedCustomerId(customerId);
                setShowCustomerDialog(false);
                fetchCustomers();
              }}
              onCancel={() => setShowCustomerDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingAgreement && (
          <LoanEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            loan={editingAgreement as any}
            onSuccess={() => {
              fetchAgreements();
              setEditDialogOpen(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
