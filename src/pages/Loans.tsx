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
import { Plus, FileText, Search, Eye, Trash2, ChevronDown, ChevronUp, IndianRupee, Calculator, Package, User, Settings, UserPlus, Camera, Pencil, Banknote, Printer, FileSpreadsheet, CheckSquare, X, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { calculateAdvanceInterest, calculateRebateSchedule, calculateClosureSchedule, formatIndianCurrency, type AdvanceInterestCalculation, type RebateSchedule, type ClosureSchedule } from '@/lib/interestCalculations';
import { logCreate, logPrint, logExport } from '@/lib/activity-logger';
import { useTodayMarketRate } from '@/hooks/useMarketRates';
import CustomerSummaryCard from '@/components/loans/CustomerSummaryCard';
import InlineCustomerForm from '@/components/loans/InlineCustomerForm';
import ImageCapture from '@/components/loans/ImageCapture';

import { LoanPrintDialog } from '@/components/print/LoanPrintDialog';
import { BulkOperationsDialog } from '@/components/loans/BulkOperationsDialog';
import { generateLoanDisbursementVoucher, generateAgentCommissionAccrualVoucher } from '@/hooks/useVoucherGeneration';
import { LoanStatementPDF } from '@/components/print/documents';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useApprovalWorkflow, WorkflowType } from '@/hooks/useApprovalWorkflow';
import { ApprovalBadge } from '@/components/approvals/ApprovalBadge';
import { pdf } from '@react-pdf/renderer';
import { SendButtons } from '@/components/notifications';

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
  item_count: number;
  remarks?: string;
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
  };
  branch_id: string;
  jewel_photo_url: string | null;
  appraiser_sheet_url: string | null;
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
  const { canEdit, canDelete, attemptEdit, attemptDelete } = usePermissions();
  const { data: todayMarketRate } = useTodayMarketRate();
  const [loans, setLoans] = useState<Loan[]>([]);
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
  
  // New loan form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingLoanNumber, setEditingLoanNumber] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [tenureDays, setTenureDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoanDate, setSelectedLoanDate] = useState<Date>(new Date());
  
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
  
  // User-input document charges and editable loan amount
  const [userDocumentChargesPercent, setUserDocumentChargesPercent] = useState('');
  const [editableLoanAmount, setEditableLoanAmount] = useState('');
  
  // Customer creation dialog
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Editing gold item index
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Current gold item being added
  const [currentItem, setCurrentItem] = useState<Partial<GoldItem & { selectedItemGroupId?: string }>>({
    item_type: '',
    selectedItemGroupId: '',
    item_id: '',
    description: '',
    gross_weight_grams: 0,
    stone_weight_grams: 0,
    purity: '22k',
    item_count: 1,
    remarks: '',
  });
  
  // View loan dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [viewingGoldItems, setViewingGoldItems] = useState<GoldItem[]>([]);
  
  
  // Print dialog
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printingLoan, setPrintingLoan] = useState<Loan | null>(null);
  const [printingCustomer, setPrintingCustomer] = useState<Customer | null>(null);
  const [printingGoldItems, setPrintingGoldItems] = useState<GoldItem[]>([]);
  
  // Bulk operations
  const [selectedLoanIds, setSelectedLoanIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  // Print settings for statement PDF
  const { settings: printSettings } = useEffectivePrintSettings();
  
  // Approval workflow
  const { checkApprovalRequired, canAutoApprove, submitForApproval } = useApprovalWorkflow();

  const canManageLoans = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchLoans();
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

  const fetchLoans = async () => {
    if (!client) return;
    setLoading(true);
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
      setLoans((data || []) as Loan[]);
    } catch (error: any) {
      console.error('Failed to fetch loans', error);
      const message =
        error?.message ??
        error?.details ??
        error?.hint ??
        'Unknown error';
      toast.error('Failed to fetch loans', { id: 'fetch-loans', description: message });
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
      .select('id, scheme_code, scheme_name, interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months, ltv_percentage, min_amount, max_amount, min_tenure_days, max_tenure_days, processing_fee_percentage, document_charges, rate_18kt, rate_22kt, current_version_id')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .not('current_version_id', 'is', null)  // Only schemes with valid versions
      .or('scheme_type.is.null,scheme_type.eq.loan')  // Exclude sale agreement schemes
      .order('scheme_name');
    setSchemes(data || []);
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
    if (loyaltyBankAccountsMap[loyaltyId]) return; // Already fetched
    
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
    setEditableLoanAmount('');
    setSelectedLoanDate(new Date());
    setIsEditMode(false);
    setEditingLoanId(null);
    setEditingLoanNumber(null);
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    setCurrentItem({
      item_type: '',
      selectedItemGroupId: goldGroup?.id || '',
      item_id: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
      item_count: 1,
      remarks: '',
    });
  };

  // Get rate based on item purity - direct rate lookup
  const getRateForPurity = (purity: string, scheme: Scheme) => {
    switch (purity) {
      case '22k':
        return scheme.rate_22kt || 0;
      case '18k':
        return scheme.rate_18kt || 0;
      case '24k':
        // 24KT = 22KT rate × (24/22) - proportional to 22KT
        return (scheme.rate_22kt || 0) * (24 / 22);
      case '20k':
        // Below 22KT: use 18KT rate
        return scheme.rate_18kt || 0;
      case '14k':
        // Below 22KT: use 18KT rate
        return scheme.rate_18kt || 0;
      default:
        return 0;
    }
  };

  const addGoldItem = () => {
    // Get item details from selected item
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
    
    // Direct calculation: Net Weight × Rate for that purity (Appraised Value for loan)
    const appraisedValue = netWeight * rateForPurity;
    
    // Calculate market value from today's market rate
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
      item_count: currentItem.item_count || 1,
      remarks: currentItem.remarks || '',
    };

    // If editing, update existing item; otherwise add new
    if (editingItemIndex !== null) {
      const updatedItems = [...goldItems];
      updatedItems[editingItemIndex] = newItem;
      setGoldItems(updatedItems);
      setEditingItemIndex(null);
    } else {
      setGoldItems([...goldItems, newItem]);
    }
    
    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    setCurrentItem({
      item_type: '',
      selectedItemGroupId: goldGroup?.id || currentItem.selectedItemGroupId,
      item_id: '',
      description: '',
      gross_weight_grams: 0,
      stone_weight_grams: 0,
      purity: '22k',
      item_count: 1,
      remarks: '',
    });
  };

  const editGoldItem = (index: number) => {
    const item = goldItems[index];
    setCurrentItem({
      item_type: item.item_type,
      item_id: item.item_id,
      selectedItemGroupId: item.item_group_id,
      description: item.description,
      gross_weight_grams: item.gross_weight_grams,
      stone_weight_grams: item.stone_weight_grams,
      purity: item.purity,
      item_count: item.item_count,
      remarks: item.remarks,
    });
    setEditingItemIndex(index);
  };

  const removeGoldItem = (index: number) => {
    setGoldItems(goldItems.filter((_, i) => i !== index));
    // Reset editing state if the removed item was being edited
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      // Adjust index if editing an item after the removed one
      setEditingItemIndex(editingItemIndex - 1);
    }
  };

  // Calculate loan with dual-rate system
  const loanCalculation = useMemo(() => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return null;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    // Total market value = sum of all gold items' market values
    const totalMarketValue = goldItems.reduce((sum, item) => sum + (item.market_value || item.appraised_value), 0);
    
    // Default loan amount based on LTV
    const defaultLoanAmount = Math.round(totalAppraisedValue * (scheme.ltv_percentage / 100));
    
    // Use user-entered editable loan amount OR default to LTV calculation
    const userLoanAmount = editableLoanAmount ? parseFloat(editableLoanAmount) : defaultLoanAmount;
    
    // Cap the loan amount at market value
    const cappedLoanAmount = Math.min(userLoanAmount, totalMarketValue);
    
    // Use selected tenure or default to max tenure
    const selectedTenure = tenureDays ? parseInt(tenureDays) : scheme.max_tenure_days;
    
    // Calculate interest adjustment based on the capped loan amount (not total appraised value)
    const advanceCalc = calculateAdvanceInterest(cappedLoanAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate || 18,
      effective_rate: scheme.effective_rate || 24,
      minimum_days: scheme.minimum_days || 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    }, selectedTenure);

    // Principal on Record = Capped Loan Amount + Interest Adjustment
    const principalOnRecord = advanceCalc.actualPrincipal;
    
    // User-input document charges percentage (defaults to scheme value if not set)
    const docChargesPercent = userDocumentChargesPercent ? parseFloat(userDocumentChargesPercent) : (scheme.document_charges || 0);
    
    // Document charges calculated on Principal on Record
    const documentCharges = Math.round(principalOnRecord * (docChargesPercent / 100));
    
    // Processing fee on the principal on record
    const processingFee = Math.round(principalOnRecord * ((scheme.processing_fee_percentage || 0) / 100));

    // Net Cash = Capped Loan Amount - Advance Interest - Document Charges
    const netCashToCustomer = Math.round(cappedLoanAmount - advanceCalc.shownInterest - documentCharges);
    
    // Calculate rebate schedule for display (using interest adjustment)
    const rebateSchedule = calculateRebateSchedule(advanceCalc.differential);
    
    // Calculate closure schedule for display
    const closureSchedule = calculateClosureSchedule(
      principalOnRecord,
      scheme.shown_rate || 18,
      selectedTenure,
      advanceCalc.differential
    );

    return {
      totalAppraisedValue,
      totalMarketValue,
      loanAmount: cappedLoanAmount,
      defaultLoanAmount,
      interestAdjustment: advanceCalc.differential,
      principalOnRecord,
      processingFee,
      documentCharges,
      documentChargesPercentage: docChargesPercent,
      advanceCalc,
      netCashToCustomer,
      rebateSchedule,
      closureSchedule,
      scheme,
    };
  }, [goldItems, selectedSchemeId, schemes, tenureDays, userDocumentChargesPercent, editableLoanAmount]);

  const generateLoanNumber = () => {
    const prefix = 'GL';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  };

  const handleCreateLoan = async () => {
    // Specific validation with clear messages
    if (!client) {
      toast.error('Client not loaded - please refresh the page');
      return;
    }
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
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
      toast.error('Tenure days not set - please select a scheme');
      return;
    }
    if (!loanCalculation) {
      toast.error('Loan calculation failed - please check scheme and gold items');
      return;
    }

    // Validate loan amount doesn't exceed market value
    if (loanCalculation.loanAmount > loanCalculation.totalMarketValue) {
      toast.error(`Loan amount cannot exceed Market Value of ${formatIndianCurrency(loanCalculation.totalMarketValue)}`);
      return;
    }

    // Validate payment entries tally (use tolerance for floating-point precision)
    const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (Math.abs(totalPayments - loanCalculation.netCashToCustomer) >= 0.01) {
      toast.error(`Payment amounts must total ${formatIndianCurrency(loanCalculation.netCashToCustomer)}. Current total: ${formatIndianCurrency(totalPayments)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Check if approval is required for this loan amount
      const loanAmount = loanCalculation.principalOnRecord;
      const { required: approvalRequired } = await checkApprovalRequired('loan', loanAmount);
      const userCanAutoApprove = await canAutoApprove('loan');
      
      // Determine approval status
      // If approval not required OR user can auto-approve: status = 'approved'
      // Otherwise: status = 'pending'
      const approvalStatus = (!approvalRequired || userCanAutoApprove) ? 'approved' : 'pending';
      
      const loanDate = selectedLoanDate;
      const maturityDate = addDays(loanDate, parseInt(tenureDays));
      const nextInterestDueDate = addMonths(loanDate, loanCalculation.scheme.advance_interest_months || 3);

      // Get scheme's current version id
      const { data: schemeWithVersion } = await supabase
        .from('schemes')
        .select('current_version_id')
        .eq('id', selectedSchemeId)
        .single();

      // Block loan creation if scheme has no version
      if (!schemeWithVersion?.current_version_id) {
        toast.error('Selected scheme is not properly configured. Please contact admin.', {
          description: 'Scheme is missing version data required for loan creation.'
        });
        setSubmitting(false);
        return;
      }

      const loanData = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        scheme_version_id: schemeWithVersion.current_version_id,
        agent_id: selectedAgentId || null,
        loan_number: generateLoanNumber(),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanCalculation.principalOnRecord, // Principal on Record (includes interest adjustment)
        shown_principal: loanCalculation.loanAmount, // The base loan amount (user editable)
        actual_principal: loanCalculation.principalOnRecord, // Principal on Record
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
        disbursement_mode: paymentEntries[0]?.mode || 'cash',
        document_charges: loanCalculation.documentCharges,
        payment_reference: paymentEntries[0]?.reference || null,
        approval_status: approvalStatus,
      };

      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (loanError) throw loanError;

      // Insert multiple disbursement entries with source account tracking
      if (paymentEntries.length > 0) {
        const disbursementsData = paymentEntries
          .filter(entry => parseFloat(entry.amount) > 0)
          .map(entry => ({
            loan_id: loanResult.id,
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
        loan_id: loanResult.id,
        item_type: item.item_type as GoldItemType,
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
        item_count: item.item_count || 1,
        remarks: item.remarks || null,
      }));

      const { error: itemsError } = await supabase
        .from('gold_items')
        .insert(goldItemsData);

      if (itemsError) throw itemsError;

      // Generate accounting voucher for loan disbursement
      const voucherResult = await generateLoanDisbursementVoucher({
        clientId: client.id,
        branchId: selectedBranchId,
        loanId: loanResult.id,
        loanNumber: loanResult.loan_number,
        principalAmount: loanCalculation.principalOnRecord,
        actualPrincipal: loanCalculation.principalOnRecord, // Principal on Record (includes capitalized differential)
        netDisbursed: loanCalculation.netCashToCustomer,
        processingFee: loanCalculation.processingFee,
        documentCharges: loanCalculation.documentCharges,
        advanceInterestShown: loanCalculation.advanceCalc.shownInterest,
        advanceInterestActual: loanCalculation.advanceCalc.actualInterest,
        paymentMode: paymentEntries[0]?.mode || 'cash',
      });

      if (!voucherResult.success && voucherResult.error) {
        console.warn('Voucher generation failed:', voucherResult.error);
      }

      // Calculate and update agent commission if agent is selected
      if (selectedAgentId) {
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        if (selectedAgent && selectedAgent.commission_percentage) {
          const commissionAmount = (loanCalculation.loanAmount * selectedAgent.commission_percentage) / 100;
          const newTotalCommission = (selectedAgent.total_commission_earned || 0) + commissionAmount;
          
          await supabase
            .from('agents')
            .update({ total_commission_earned: newTotalCommission })
            .eq('id', selectedAgentId);

          // Generate agent commission accrual voucher
          const commissionVoucherResult = await generateAgentCommissionAccrualVoucher({
            clientId: client.id,
            branchId: selectedBranchId,
            loanId: loanResult.id,
            loanNumber: loanResult.loan_number,
            commissionAmount,
            agentName: selectedAgent.full_name,
          });

          if (!commissionVoucherResult.success && commissionVoucherResult.error) {
            console.warn('Commission accrual voucher failed:', commissionVoucherResult.error);
          }
        }
      }

      toast.success(`Loan ${loanResult.loan_number} created successfully`);

      // Log activity
      logCreate(
        'loans',
        'loan',
        loanResult.id,
        loanResult.loan_number,
        `Created loan ${loanResult.loan_number} for ${customers.find(c => c.id === selectedCustomerId)?.full_name} - Amount: ₹${loanAmount.toLocaleString('en-IN')}`
      );
      
      
      // If approval is required, submit for approval
      if (approvalStatus === 'pending') {
        await submitForApproval({
          workflowType: 'loan',
          entityType: 'loan',
          entityId: loanResult.id,
          entityNumber: loanResult.loan_number,
          branchId: selectedBranchId,
          amount: loanAmount,
          description: `Loan ${loanResult.loan_number} for ${customers.find(c => c.id === selectedCustomerId)?.full_name}`,
        });
        toast.info('Loan submitted for approval');
      }
      
      // Prepare print data and auto-trigger print dialog
      const selectedCustomerData = customers.find(c => c.id === selectedCustomerId);
      const selectedSchemeData = schemes.find(s => s.id === selectedSchemeId);
      const selectedBranchData = branches.find(b => b.id === selectedBranchId);
      
      // Get complete customer data with all image URLs
      const fullCustomerData = customers.find(c => c.id === selectedCustomerId);
      
      // Print dialog removed - will be rebuilt with new print system
      
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

  const handleEditLoan = async (loan: Loan) => {
    if (!attemptEdit()) return;
    
    // Fetch gold items for the loan
    const { data: loanGoldItems } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', loan.id);
    
    // Fetch disbursement entries
    const { data: disbursements } = await supabase
      .from('loan_disbursements')
      .select('*')
      .eq('loan_id', loan.id);
    
    // Populate form with loan data
    setIsEditMode(true);
    setEditingLoanId(loan.id);
    setEditingLoanNumber(loan.loan_number);
    setSelectedCustomerId(loan.customer.id);
    setSelectedSchemeId(loan.scheme.id);
    setSelectedBranchId(loan.branch_id);
    setSelectedLoanDate(new Date(loan.loan_date));
    setTenureDays(loan.tenure_days.toString());
    
    // Convert gold items to form format
    if (loanGoldItems && loanGoldItems.length > 0) {
      const formattedGoldItems: GoldItem[] = loanGoldItems.map(item => ({
        id: item.id,
        item_type: item.item_type,
        item_id: item.item_id || undefined,
        item_group_id: item.item_group_id || undefined,
        description: item.description || '',
        gross_weight_grams: item.gross_weight_grams,
        net_weight_grams: item.net_weight_grams,
        purity: item.purity,
        purity_percentage: item.purity_percentage,
        stone_weight_grams: item.stone_weight_grams || 0,
        market_rate_per_gram: item.market_rate_per_gram,
        appraised_value: item.appraised_value,
        market_value: item.market_value || undefined,
        market_rate_date: item.market_rate_date || undefined,
        item_count: (item as any).item_count || 1,
        remarks: (item as any).remarks || '',
      }));
      setGoldItems(formattedGoldItems);
    }
    
    // Convert disbursements to payment entries format
    if (disbursements && disbursements.length > 0) {
      const formattedPayments = disbursements.map(d => ({
        mode: d.payment_mode,
        amount: d.amount.toString(),
        reference: d.reference_number || '',
        sourceType: (d.source_type || 'cash') as 'cash' | 'company' | 'employee',
        sourceBankId: d.source_bank_id || '',
        sourceAccountId: d.source_account_id || '',
        selectedLoyaltyId: '',
      }));
      setPaymentEntries(formattedPayments);
    }
    
    // Restore image URLs
    setJewelPhotoUrl(loan.jewel_photo_url || null);
    setAppraiserSheetUrl(loan.appraiser_sheet_url || null);
    
    // Open the form
    setIsFormOpen(true);
  };

  const handleUpdateLoan = async () => {
    if (!client || !editingLoanId) {
      toast.error('Invalid edit state');
      return;
    }
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
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
      toast.error('Tenure days not set');
      return;
    }
    if (!loanCalculation) {
      toast.error('Loan calculation failed');
      return;
    }

    // Validate payment entries tally (use tolerance for floating-point precision)
    const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (Math.abs(totalPayments - loanCalculation.netCashToCustomer) >= 0.01) {
      toast.error(`Payment amounts must total ${formatIndianCurrency(loanCalculation.netCashToCustomer)}. Current total: ${formatIndianCurrency(totalPayments)}`);
      return;
    }

    setSubmitting(true);
    try {
      const loanDate = selectedLoanDate;
      const maturityDate = addDays(loanDate, parseInt(tenureDays));
      const nextInterestDueDate = addMonths(loanDate, loanCalculation.scheme.advance_interest_months || 3);

      // Update loan record
      const loanUpdateData = {
        branch_id: selectedBranchId,
        customer_id: selectedCustomerId,
        scheme_id: selectedSchemeId,
        agent_id: selectedAgentId || null,
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanCalculation.principalOnRecord,
        shown_principal: loanCalculation.loanAmount,
        actual_principal: loanCalculation.principalOnRecord,
        interest_rate: loanCalculation.scheme.shown_rate || 18,
        tenure_days: parseInt(tenureDays),
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        processing_fee: loanCalculation.processingFee,
        net_disbursed: loanCalculation.netCashToCustomer,
        advance_interest_shown: loanCalculation.advanceCalc.shownInterest,
        advance_interest_actual: loanCalculation.advanceCalc.actualInterest,
        differential_capitalized: loanCalculation.advanceCalc.differential,
        next_interest_due_date: format(nextInterestDueDate, 'yyyy-MM-dd'),
        last_interest_paid_date: format(loanDate, 'yyyy-MM-dd'),
        jewel_photo_url: jewelPhotoUrl,
        appraiser_sheet_url: appraiserSheetUrl,
        disbursement_mode: paymentEntries[0]?.mode || 'cash',
        document_charges: loanCalculation.documentCharges,
        payment_reference: paymentEntries[0]?.reference || null,
        updated_at: new Date().toISOString(),
      };

      const { error: loanError } = await supabase
        .from('loans')
        .update(loanUpdateData)
        .eq('id', editingLoanId);

      if (loanError) throw loanError;

      // Delete existing gold items and insert new ones
      await supabase
        .from('gold_items')
        .delete()
        .eq('loan_id', editingLoanId);

      const goldItemsData = goldItems.map(item => ({
        loan_id: editingLoanId,
        item_type: item.item_type as GoldItemType,
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

      // Delete existing disbursements and insert new ones
      await supabase
        .from('loan_disbursements')
        .delete()
        .eq('loan_id', editingLoanId);

      if (paymentEntries.length > 0) {
        const disbursementsData = paymentEntries
          .filter(entry => parseFloat(entry.amount) > 0)
          .map(entry => ({
            loan_id: editingLoanId,
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

      toast.success(`Loan ${editingLoanNumber} updated successfully`);
      setIsFormOpen(false);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update loan');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintLoan = async (loan: Loan) => {
    // Fetch gold items for the loan
    const { data: goldItemsData } = await supabase
      .from('gold_items')
      .select('*')
      .eq('loan_id', loan.id);
    
    // Find full customer data
    const fullCustomer = customers.find(c => c.id === loan.customer.id);
    
    setPrintingLoan(loan);
    setPrintingCustomer(fullCustomer || loan.customer as Customer);
    setPrintingGoldItems(goldItemsData || []);
    setPrintDialogOpen(true);
  };

  const handleGenerateLoanStatement = async (loan: Loan) => {
    try {
      toast.info('Generating statement...');
      
      // Fetch gold items for the loan
      const { data: goldItemsData } = await supabase
        .from('gold_items')
        .select('*')
        .eq('loan_id', loan.id);
      
      // Fetch interest payments
      const { data: paymentsData } = await supabase
        .from('interest_payments')
        .select('*')
        .eq('loan_id', loan.id)
        .order('payment_date', { ascending: false });
      
      const fullCustomer = customers.find(c => c.id === loan.customer.id);
      
      // Calculate outstanding interest
      const totalInterestPaid = paymentsData?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
      
      const loanData = {
        loan_number: loan.loan_number,
        loan_date: loan.loan_date,
        maturity_date: loan.maturity_date,
        principal_amount: loan.actual_principal || loan.principal_amount,
        interest_rate: loan.interest_rate,
        tenure_days: loan.tenure_days,
        status: loan.status,
        net_disbursed: loan.net_disbursed,
        advance_interest_shown: loan.advance_interest_shown || null,
        processing_fee: null,
        document_charges: null,
        total_interest_paid: totalInterestPaid,
        outstanding_principal: loan.actual_principal || loan.principal_amount,
        outstanding_interest: 0, // Would need calculation based on dates
        customer: {
          full_name: fullCustomer?.full_name || loan.customer.full_name,
          customer_code: fullCustomer?.customer_code || loan.customer.customer_code,
          phone: fullCustomer?.phone || loan.customer.phone,
          address: fullCustomer?.address || ''
        },
        scheme: {
          scheme_name: loan.scheme.scheme_name,
          interest_rate: loan.scheme.interest_rate
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
      
      const branchName = getBranchName(loan.branch_id);
      
      const blob = await pdf(
        <LoanStatementPDF 
          loan={loanData}
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
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement');
    }
  };

  // Bulk selection handlers
  const toggleLoanSelection = (loanId: string) => {
    setSelectedLoanIds(prev => {
      const next = new Set(prev);
      if (next.has(loanId)) {
        next.delete(loanId);
      } else {
        next.add(loanId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLoanIds.size === filteredLoans.length) {
      setSelectedLoanIds(new Set());
    } else {
      setSelectedLoanIds(new Set(filteredLoans.map(l => l.id)));
    }
  };

  const clearSelection = () => {
    setSelectedLoanIds(new Set());
  };

  const selectedLoans = loans.filter(l => selectedLoanIds.has(l.id));

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || 
      (approvalFilter === 'pending' && loan.approval_status === 'pending') ||
      (approvalFilter === 'approved' && (loan.approval_status === 'approved' || loan.approval_status === null)) ||
      (approvalFilter === 'rejected' && loan.approval_status === 'rejected');
    return matchesSearch && matchesStatus && matchesApproval;
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
              onClick={() => {
                if (isFormOpen) {
                  setIsFormOpen(false);
                  resetForm();
                } else {
                  resetForm(); // Reset to ensure it's in create mode
                  setIsFormOpen(true);
                }
              }}
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
                  {isEditMode ? (
                    <>
                      <Pencil className="h-5 w-5 text-amber-600" />
                      Edit Loan: {editingLoanNumber}
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-amber-600" />
                      Create New Loan
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section 1: Customer, Branch & Agent */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-amber-600" />
                    Customer, Branch & Agent
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Customer *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Search by name, code, or last 4 digits of phone..."
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
                            <div className="px-3 py-2 text-sm text-muted-foreground">No customers found</div>
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
                      <Label>Loan Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedLoanDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedLoanDate ? format(selectedLoanDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedLoanDate}
                            onSelect={(date) => date && setSelectedLoanDate(date)}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Agent (Referral)</Label>
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
                        <SelectValue placeholder="Select a scheme" />
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
                              <p className="text-xs text-muted-foreground">Interest Rate</p>
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
                              <p className="text-xs text-muted-foreground">Tenure</p>
                              <p className="font-medium">{selectedScheme.max_tenure_days} days</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Item Nos</Label>
                          <Input
                            type="number"
                            min="1"
                            value={currentItem.item_count || 1}
                            onChange={(e) => setCurrentItem({...currentItem, item_count: parseInt(e.target.value) || 1})}
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Remarks (Optional)</Label>
                          <Input
                            value={currentItem.remarks || ''}
                            onChange={(e) => setCurrentItem({...currentItem, remarks: e.target.value})}
                            placeholder="Additional remarks"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" onClick={addGoldItem} variant="outline" size="sm" className="w-full">
                            {editingItemIndex !== null ? (
                              <>
                                <Pencil className="h-4 w-4 mr-1" /> Update Item
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {goldItems.length > 0 && (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">S.No</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-center">Item Nos</TableHead>
                              <TableHead>Gross Wt</TableHead>
                              <TableHead>Net Wt</TableHead>
                              <TableHead>Purity</TableHead>
                              <TableHead className="text-right">Appraised Value</TableHead>
                              <TableHead className="text-right">Market Value</TableHead>
                              <TableHead>Remarks</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goldItems.map((item, index) => (
                              <TableRow key={index} className={editingItemIndex === index ? 'bg-amber-50 dark:bg-amber-950/30' : ''}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="capitalize">{item.item_type}</TableCell>
                                <TableCell className="text-center">{item.item_count || 1}</TableCell>
                                <TableCell>{item.gross_weight_grams.toFixed(3)}g</TableCell>
                                <TableCell>{item.net_weight_grams.toFixed(3)}g</TableCell>
                                <TableCell>{item.purity}</TableCell>
                                <TableCell className="text-right">
                                  {formatIndianCurrency(item.appraised_value)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.market_value ? formatIndianCurrency(item.market_value) : '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                                  {item.remarks || '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => editGoldItem(index)}>
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeGoldItem(index)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50">
                              <TableCell className="font-semibold">Total</TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-center font-semibold">{goldItems.reduce((sum, item) => sum + (item.item_count || 1), 0)}</TableCell>
                              <TableCell className="font-semibold">{goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0).toFixed(3)}g</TableCell>
                              <TableCell className="font-semibold">{goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0).toFixed(3)}g</TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatIndianCurrency(goldItems.reduce((sum, item) => sum + item.appraised_value, 0))}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatIndianCurrency(goldItems.reduce((sum, item) => sum + (item.market_value || 0), 0))}
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
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

                    {/* Loan Amount Section */}
                    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Loan Amount
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Market Value (Max Limit)</Label>
                            <div className="text-sm font-medium text-blue-600">{formatIndianCurrency(loanCalculation.totalMarketValue)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Loan Amount (LTV) *</Label>
                            <Input
                              type="number"
                              value={editableLoanAmount}
                              onChange={(e) => setEditableLoanAmount(e.target.value)}
                              placeholder={loanCalculation.defaultLoanAmount.toString()}
                              className={`${
                                editableLoanAmount && parseFloat(editableLoanAmount) > loanCalculation.totalMarketValue
                                  ? 'border-destructive focus-visible:ring-destructive'
                                  : ''
                              }`}
                            />
                            {editableLoanAmount && parseFloat(editableLoanAmount) > loanCalculation.totalMarketValue && (
                              <p className="text-xs text-destructive">Cannot exceed Market Value of {formatIndianCurrency(loanCalculation.totalMarketValue)}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Default: {formatIndianCurrency(loanCalculation.defaultLoanAmount)} ({loanCalculation.scheme.ltv_percentage}% LTV)</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Principal on Record</Label>
                            <div className="text-sm font-medium text-amber-600">{formatIndianCurrency(loanCalculation.principalOnRecord)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Loan Calculation - Professional View */}
                      <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" />
                            Loan Calculation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Appraised Value</span>
                            <span className="font-medium">{formatIndianCurrency(loanCalculation.totalAppraisedValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Market Value</span>
                            <span className="font-medium text-blue-600">{formatIndianCurrency(loanCalculation.totalMarketValue)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Loan Amount</span>
                            <span>{formatIndianCurrency(loanCalculation.loanAmount)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>Interest Adjustment</span>
                            <span>+{formatIndianCurrency(loanCalculation.advanceCalc.differential)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-amber-700">
                            <span>Principal on Record</span>
                            <span>{formatIndianCurrency(loanCalculation.principalOnRecord)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-muted-foreground">
                            <span>Interest Rate</span>
                            <span>{loanCalculation.scheme.shown_rate}% p.a.</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Tenure</span>
                            <span>{tenureDays} days</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Less: Advance Interest ({loanCalculation.scheme.advance_interest_months} months)</span>
                            <span>-{formatIndianCurrency(loanCalculation.advanceCalc.shownInterest)}</span>
                          </div>
                          {loanCalculation.processingFee > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Less: Processing Fee</span>
                              <span>-{formatIndianCurrency(loanCalculation.processingFee)}</span>
                            </div>
                          )}
                          {loanCalculation.documentCharges > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Less: Document Charges ({loanCalculation.documentChargesPercentage}%)</span>
                              <span>-{formatIndianCurrency(loanCalculation.documentCharges)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg text-green-700 dark:text-green-400">
                            <span>Net Cash to Customer</span>
                            <span>{formatIndianCurrency(loanCalculation.netCashToCustomer)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Early Release Rebate Schedule */}
                      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Early Release Benefit
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Rebate on early loan closure</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="space-y-2">
                            {loanCalculation.rebateSchedule.slots.map((slot, index) => (
                              <div key={index} className="flex justify-between items-center py-1 border-b border-amber-200/50 dark:border-amber-800/50 last:border-0">
                                <span className="text-muted-foreground">{slot.dayRange}</span>
                                <span className={`font-medium ${slot.rebateAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {slot.rebateAmount > 0 ? formatIndianCurrency(slot.rebateAmount) : 'No rebate'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Loan Schedule of Closure */}
                    <Card className="border-violet-500/30 bg-violet-50/50 dark:bg-violet-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-violet-700 dark:text-violet-400 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Loan Schedule of Closure
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Total payable at different intervals</p>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Period</TableHead>
                              <TableHead className="text-right text-xs">Principal</TableHead>
                              <TableHead className="text-right text-xs">Interest</TableHead>
                              <TableHead className="text-right text-xs">Rebate</TableHead>
                              <TableHead className="text-right text-xs">Total Payable</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loanCalculation.closureSchedule.entries.map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-xs">{entry.dayRange}</TableCell>
                                <TableCell className="text-right text-xs">{formatIndianCurrency(entry.principalOutstanding)}</TableCell>
                                <TableCell className="text-right text-xs">{formatIndianCurrency(entry.interestAccrued)}</TableCell>
                                <TableCell className="text-right text-xs text-green-600">
                                  {entry.rebateAmount > 0 ? `-${formatIndianCurrency(entry.rebateAmount)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold">{formatIndianCurrency(entry.totalClosureAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {tenureDays && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Maturity Date:</span> {format(addDays(new Date(), parseInt(tenureDays)), 'dd MMM yyyy')}
                        <span className="mx-4">|</span>
                        <span className="font-medium">Next Interest Due:</span> {format(addMonths(new Date(), loanCalculation.scheme.advance_interest_months || 3), 'dd MMM yyyy')}
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
                  
                  {/* Document Charges - User Input */}
                  {loanCalculation && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Document Charges %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={userDocumentChargesPercent}
                          onChange={(e) => setUserDocumentChargesPercent(e.target.value)}
                          placeholder={(loanCalculation.scheme.document_charges || 0).toString()}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Document Charges Amount</Label>
                        <div className="text-sm font-medium text-amber-600 pt-2">{formatIndianCurrency(loanCalculation.documentCharges)}</div>
                        <p className="text-xs text-muted-foreground">On Principal on Record</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Processing Fee</Label>
                        <div className="text-sm font-medium pt-2">{formatIndianCurrency(loanCalculation.processingFee)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Advance Interest</Label>
                        <div className="text-sm font-medium pt-2">{formatIndianCurrency(loanCalculation.advanceCalc.shownInterest)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Net Cash to Customer</Label>
                        <div className="text-sm font-bold text-green-600 pt-2">{formatIndianCurrency(loanCalculation.netCashToCustomer)}</div>
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
                                // Auto-set source type based on mode
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
                            {/* Source Account - Only show for non-cash */}
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
                        
                        {/* Source Account Selection Row - Only for non-cash */}
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
                    {loanCalculation && (
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg font-medium">
                        <span>Total Disbursement</span>
                        {(() => {
                          const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                          const diff = loanCalculation.netCashToCustomer - totalPayments;
                          const isMatched = Math.abs(diff) < 0.01;
                          return (
                            <div className="flex items-center gap-3">
                              <span className={isMatched ? "text-green-600" : "text-destructive"}>
                                {formatIndianCurrency(totalPayments)} / {formatIndianCurrency(loanCalculation.netCashToCustomer)}
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

                {/* Create/Update Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={isEditMode ? handleUpdateLoan : handleCreateLoan} 
                    disabled={submitting || !selectedCustomerId || !selectedSchemeId || !selectedBranchId || goldItems.length === 0 || !tenureDays}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Loan' : 'Create Loan')}
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
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Approval Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Loan List ({filteredLoans.length})</CardTitle>
              {selectedLoanIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    <CheckSquare className="h-4 w-4 mr-1" />
                    {selectedLoanIds.size} selected
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setBulkDialogOpen(true)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveTable minWidth="1100px" maxHeight="500px">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedLoanIds.size === filteredLoans.length && filteredLoans.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
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
                      <TableRow 
                        key={loan.id} 
                        className={`${selectedLoanIds.has(loan.id) ? 'bg-muted/50' : ''} ${loan.approval_status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''} ${loan.approval_status === 'rejected' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedLoanIds.has(loan.id)}
                            onCheckedChange={() => toggleLoanSelection(loan.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{loan.loan_number}</span>
                            {loan.is_reloan && (
                              <Badge variant="secondary" className="text-xs">Reloan</Badge>
                            )}
                            {loan.approval_status && loan.approval_status !== 'approved' && (
                              <ApprovalBadge 
                                status={loan.approval_status} 
                                size="sm"
                              />
                            )}
                          </div>
                        </TableCell>
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
                          <p className="text-amber-600 dark:text-amber-400 font-medium">{formatIndianCurrency(loan.actual_principal || loan.principal_amount)}</p>
                        </TableCell>
                        <TableCell>{format(new Date(loan.maturity_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{getBranchName(loan.branch_id)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(loan.status)} text-white`}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <SendButtons
                              recipient={{ id: loan.customer.id, name: loan.customer.full_name, phone: loan.customer.phone }}
                              loan={{ id: loan.id, loan_number: loan.loan_number, principal_amount: loan.principal_amount, interest_rate: loan.interest_rate, loan_date: loan.loan_date, maturity_date: loan.maturity_date }}
                              templateType="loan_disbursed"
                              variant="icon-only"
                              entityType="loan"
                              entityId={loan.id}
                            />
                            <Button variant="ghost" size="sm" onClick={() => viewLoanDetails(loan)} title="View loan details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleGenerateLoanStatement(loan)}
                              title="Generate statement PDF"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePrintLoan(loan)}
                              title="Print loan receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditLoan(loan)}
                              disabled={!canEdit}
                              title={canEdit ? "Edit loan" : "Edit requires admin, manager, or loan officer role"}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (!attemptDelete()) return;
                                toast.info('Delete loan functionality coming soon');
                              }}
                              disabled={!canDelete}
                              title={canDelete ? "Delete loan" : "Only tenant admin can delete"}
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
          selectedLoans={selectedLoans}
          onClearSelection={clearSelection}
        />

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
                        <TableHead className="w-[50px]">S.No</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Item Nos</TableHead>
                        <TableHead>Gross Wt</TableHead>
                        <TableHead>Net Wt</TableHead>
                        <TableHead>Purity</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingGoldItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="capitalize">{item.item_type}</TableCell>
                          <TableCell className="text-center">{(item as any).item_count || 1}</TableCell>
                          <TableCell>{item.gross_weight_grams.toFixed(3)}g</TableCell>
                          <TableCell>{item.net_weight_grams.toFixed(3)}g</TableCell>
                          <TableCell>{item.purity}</TableCell>
                          <TableCell className="text-right">{item.market_value ? formatIndianCurrency(item.market_value) : formatIndianCurrency(item.appraised_value)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{(item as any).remarks || '-'}</TableCell>
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
        {printingLoan && printingCustomer && (
          <LoanPrintDialog
            open={printDialogOpen}
            onOpenChange={setPrintDialogOpen}
            loan={printingLoan}
            customer={printingCustomer}
            goldItems={printingGoldItems}
          />
        )}


      </div>
    </DashboardLayout>
  );
}