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
import { Plus, FileText, Search, Eye, Trash2, ChevronDown, ChevronUp, IndianRupee, Calculator, Package, User, Settings, UserPlus, Camera, Pencil, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { calculateAdvanceInterest, calculateRebateSchedule, formatIndianCurrency, type AdvanceInterestCalculation, type RebateSchedule } from '@/lib/interestCalculations';
import CustomerSummaryCard from '@/components/loans/CustomerSummaryCard';
import InlineCustomerForm from '@/components/loans/InlineCustomerForm';
import ImageCapture from '@/components/loans/ImageCapture';
import LoanEditDialog from '@/components/loans/LoanEditDialog';
import { PDFViewerDialog } from '@/components/receipts/PDFViewerDialog';
import { LoanDisbursementPDF } from '@/components/receipts/LoanDisbursementPDF';

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
  const { canEdit, canDelete, attemptEdit, attemptDelete } = usePermissions();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // New loan form state
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
  
  // Payment details - multiple payment entries
  const [paymentEntries, setPaymentEntries] = useState<Array<{
    mode: string;
    amount: string;
    reference: string;
  }>>([{ mode: 'cash', amount: '', reference: '' }]);
  
  // User-input document charges and approved loan amount
  const [userDocumentChargesPercent, setUserDocumentChargesPercent] = useState('');
  const [approvedLoanAmount, setApprovedLoanAmount] = useState('');
  
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
  
  // View loan dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [viewingGoldItems, setViewingGoldItems] = useState<GoldItem[]>([]);
  
  // Edit loan dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  
  // PDF receipt dialog
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [createdLoanData, setCreatedLoanData] = useState<{
    loanNumber: string;
    loanDate: string;
    maturityDate: string;
    tenureDays: number;
    customer: Customer;
    scheme: Scheme;
    goldItems: GoldItem[];
    calculation: {
      totalAppraisedValue: number;
      principalAmount: number;
      advanceInterest: number;
      processingFee: number;
      documentCharges: number;
      netDisbursed: number;
    };
  } | null>(null);

  const canManageLoans = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    if (client) {
      fetchLoans();
      fetchCustomers();
      fetchSchemes();
      fetchAgents();
      fetchItemGroups();
      fetchItems();
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

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedSchemeId('');
    setSelectedBranchId(currentBranch?.id || '');
    setSelectedAgentId('');
    setGoldItems([]);
    setTenureDays('');
    setJewelPhotoUrl(null);
    setAppraiserSheetUrl(null);
    setPaymentEntries([{ mode: 'cash', amount: '', reference: '' }]);
    setUserDocumentChargesPercent('');
    setApprovedLoanAmount('');
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
        // 20KT = 22KT rate × (20/22)
        return (scheme.rate_22kt || 0) * (20 / 22);
      case '14k':
        // 14KT = 22KT rate × (14/22)
        return (scheme.rate_22kt || 0) * (14 / 22);
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
    
    // Direct calculation: Net Weight × Rate for that purity
    const appraisedValue = netWeight * rateForPurity;

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

  // Calculate loan with dual-rate system
  const loanCalculation = useMemo(() => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme || goldItems.length === 0) return null;

    const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
    const maxLoanAmount = totalAppraisedValue * (scheme.ltv_percentage / 100);
    const loanAmount = Math.round(Math.min(Math.max(maxLoanAmount, scheme.min_amount), scheme.max_amount));
    
    // Use selected tenure or default to max tenure
    const selectedTenure = tenureDays ? parseInt(tenureDays) : scheme.max_tenure_days;
    
    // Calculate dual-rate advance interest with tenure for differential
    const advanceCalc = calculateAdvanceInterest(loanAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate || 18,
      effective_rate: scheme.effective_rate || 24,
      minimum_days: scheme.minimum_days || 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    }, selectedTenure);

    // Principal on Record = Loan Amount + Differential
    const principalOnRecord = advanceCalc.actualPrincipal;
    
    // Max Approved Amount = Principal on Record × 1.10 (10% above)
    const maxApprovedAmount = Math.round(principalOnRecord * 1.10);
    
    // Use user-entered approved amount or default to principal on record
    const finalApprovedAmount = approvedLoanAmount ? parseFloat(approvedLoanAmount) : principalOnRecord;
    
    // User-input document charges percentage (defaults to scheme value if not set)
    const docChargesPercent = userDocumentChargesPercent ? parseFloat(userDocumentChargesPercent) : (scheme.document_charges || 0);
    
    // Document charges calculated on Principal on Record (not approved amount)
    const documentCharges = Math.round(principalOnRecord * (docChargesPercent / 100));
    
    // Processing fee on the final approved amount
    const processingFee = Math.round(finalApprovedAmount * ((scheme.processing_fee_percentage || 0) / 100));

    // Net cash to customer = Approved Amount - Advance Interest - Processing Fee - Document Charges
    const netCashToCustomer = finalApprovedAmount - advanceCalc.shownInterest - processingFee - documentCharges;
    
    // Calculate rebate schedule for display
    const rebateSchedule = calculateRebateSchedule(advanceCalc.differential);

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
      rebateSchedule,
      scheme,
    };
  }, [goldItems, selectedSchemeId, schemes, tenureDays, userDocumentChargesPercent, approvedLoanAmount]);

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

    // Validate approved loan amount
    if (loanCalculation.finalApprovedAmount > loanCalculation.maxApprovedAmount) {
      toast.error(`Approved amount cannot exceed ${formatIndianCurrency(loanCalculation.maxApprovedAmount)} (10% above Principal on Record)`);
      return;
    }

    // Validate payment entries tally
    const totalPayments = paymentEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (totalPayments !== loanCalculation.netCashToCustomer) {
      toast.error(`Payment amounts must total ${formatIndianCurrency(loanCalculation.netCashToCustomer)}. Current total: ${formatIndianCurrency(totalPayments)}`);
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
        agent_id: selectedAgentId || null,
        loan_number: generateLoanNumber(),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        principal_amount: loanCalculation.finalApprovedAmount, // Use approved loan amount as final
        shown_principal: loanCalculation.loanAmount,
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
      };

      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (loanError) throw loanError;

      // Insert multiple disbursement entries if more than one payment mode
      if (paymentEntries.length > 0) {
        const disbursementsData = paymentEntries
          .filter(entry => parseFloat(entry.amount) > 0)
          .map(entry => ({
            loan_id: loanResult.id,
            payment_mode: entry.mode,
            amount: parseFloat(entry.amount),
            reference_number: entry.reference || null,
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
      }));

      const { error: itemsError } = await supabase
        .from('gold_items')
        .insert(goldItemsData);

      if (itemsError) throw itemsError;

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
        }
      }

      // Get selected customer and scheme for PDF
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
      
      if (selectedCustomer && selectedScheme) {
        // Store data for PDF receipt
        setCreatedLoanData({
          loanNumber: loanResult.loan_number,
          loanDate: format(loanDate, 'yyyy-MM-dd'),
          maturityDate: format(maturityDate, 'yyyy-MM-dd'),
          tenureDays: parseInt(tenureDays),
          customer: selectedCustomer,
          scheme: selectedScheme,
          goldItems: [...goldItems],
          calculation: {
            totalAppraisedValue: loanCalculation.totalAppraisedValue,
            principalAmount: loanCalculation.finalApprovedAmount,
            advanceInterest: loanCalculation.advanceCalc.shownInterest,
            processingFee: loanCalculation.processingFee,
            documentCharges: loanCalculation.documentCharges,
            netDisbursed: loanCalculation.netCashToCustomer,
          }
        });
        setShowReceiptDialog(true);
      }

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

  const handleEditLoan = (loan: Loan) => {
    if (!attemptEdit()) return;
    setEditingLoan(loan);
    setEditDialogOpen(true);
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
                {/* Section 1: Customer, Branch & Agent */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-amber-600" />
                    Customer, Branch & Agent
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {/* Approved Loan Amount Section */}
                    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Loan Amount Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Loan Amount (LTV)</Label>
                            <div className="text-sm font-medium">{formatIndianCurrency(loanCalculation.loanAmount)}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Principal on Record</Label>
                            <div className="text-sm font-medium text-amber-600">{formatIndianCurrency(loanCalculation.principalOnRecord)}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Approved (+10%)</Label>
                            <div className="text-sm font-medium text-blue-600">{formatIndianCurrency(loanCalculation.maxApprovedAmount)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Approved Loan Amount *</Label>
                            <Input
                              type="number"
                              value={approvedLoanAmount}
                              onChange={(e) => setApprovedLoanAmount(e.target.value)}
                              placeholder={loanCalculation.principalOnRecord.toString()}
                              className={`${
                                approvedLoanAmount && parseFloat(approvedLoanAmount) > loanCalculation.maxApprovedAmount
                                  ? 'border-destructive focus-visible:ring-destructive'
                                  : ''
                              }`}
                            />
                            {approvedLoanAmount && parseFloat(approvedLoanAmount) > loanCalculation.maxApprovedAmount && (
                              <p className="text-xs text-destructive">Cannot exceed {formatIndianCurrency(loanCalculation.maxApprovedAmount)}</p>
                            )}
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
                            <span>Loan Amount (@ {loanCalculation.scheme.ltv_percentage}% LTV)</span>
                            <span className="font-medium">{formatIndianCurrency(loanCalculation.loanAmount)}</span>
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
                          <div className="flex justify-between font-bold text-blue-600">
                            <span>Approved Loan Amount</span>
                            <span>{formatIndianCurrency(loanCalculation.finalApprovedAmount)}</span>
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
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-background">
                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                          <Select 
                            value={entry.mode} 
                            onValueChange={(value) => {
                              const updated = [...paymentEntries];
                              updated[index].mode = value;
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
                        <div className="md:col-span-3 space-y-1">
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
                        <div className="md:col-span-4 space-y-1">
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
                        <div className="md:col-span-2 flex items-end">
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
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentEntries([...paymentEntries, { mode: 'cash', amount: '', reference: '' }])}
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
                          const isMatched = totalPayments === loanCalculation.netCashToCustomer;
                          const diff = loanCalculation.netCashToCustomer - totalPayments;
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

                {/* Create Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    type="button"
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
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewLoanDetails(loan)} title="View loan details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditLoan(loan)}
                              disabled={!canEdit}
                              title={canEdit ? "Edit loan" : "Only tenant admin or branch manager can edit"}
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

        {/* Loan Edit Dialog */}
        <LoanEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          loan={editingLoan}
          onSuccess={fetchLoans}
        />

        {/* Loan Disbursement Receipt PDF Dialog */}
        {createdLoanData && (
          <PDFViewerDialog
            open={showReceiptDialog}
            onOpenChange={setShowReceiptDialog}
            title="Loan Disbursement Receipt"
            fileName={`loan-disbursement-${createdLoanData.loanNumber}`}
            document={
              <LoanDisbursementPDF
                company={{
                  name: client?.company_name || 'Gold Finance',
                }}
                loan={{
                  number: createdLoanData.loanNumber,
                  date: createdLoanData.loanDate,
                  maturityDate: createdLoanData.maturityDate,
                  tenureDays: createdLoanData.tenureDays,
                }}
                customer={{
                  name: createdLoanData.customer.full_name,
                  code: createdLoanData.customer.customer_code,
                  phone: createdLoanData.customer.phone,
                }}
                scheme={{
                  name: createdLoanData.scheme.scheme_name,
                  rate: createdLoanData.scheme.shown_rate || createdLoanData.scheme.interest_rate,
                  ltvPercentage: createdLoanData.scheme.ltv_percentage,
                }}
                goldItems={createdLoanData.goldItems}
                calculation={createdLoanData.calculation}
                rebateSchedule={calculateRebateSchedule(createdLoanData.calculation.advanceInterest)}
              />
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}