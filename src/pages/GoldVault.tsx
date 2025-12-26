import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Package, Search, Eye, Loader2, Building2, Upload, FileImage, X, Vault, Unlock, AlertTriangle } from 'lucide-react';
import MultiFileUpload from '@/components/uploads/MultiFileUpload';
import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import GoldItemSelector from '@/components/goldvault/GoldItemSelector';
import PacketItemsView from '@/components/goldvault/PacketItemsView';
import { useSourceAccount } from '@/hooks/useSourceAccount';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import { generateRepledgeCreditVoucher, generateRepledgeRedemptionVoucher } from '@/hooks/useVoucherGeneration';

interface RepledgePacket {
  id: string;
  packet_number: string;
  packet_date: string;
  bank_id: string;
  loyalty_id: string | null;
  credit_account_id: string | null;
  total_loans: number;
  total_principal: number;
  total_gold_weight_grams: number;
  total_appraised_value: number;
  bank_loan_amount: number | null;
  bank_interest_rate: number | null;
  bank_reference_number: string | null;
  bank_loan_date: string | null;
  status: string;
  packet_images: string[] | null;
  bank_receipt_images: string[] | null;
  remarks: string | null;
  bank?: { bank_name: string; bank_code: string };
  loyalty?: { full_name: string };
  credit_account?: { id: string; account_number: string; account_holder_name: string; bank?: { bank_name: string } };
}

interface LoyaltyBankAccount {
  id: string;
  account_number: string;
  account_holder_name: string;
  account_type: string;
  bank_id: string;
  bank?: { bank_name: string };
}

interface RepledgeItem {
  id: string;
  loan_id: string;
  packet_id: string | null;
  principal_amount: number;
  gold_weight_grams: number;
  appraised_value: number;
  jewel_images: string[] | null;
  status: string;
  loan?: {
    loan_number: string;
    customer?: { full_name: string };
  };
}

interface SelectedGoldItem {
  gold_item_id: string;
  loan_id: string;
  weight_grams: number;
  appraised_value: number;
}

interface InVaultLoan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  status: string;
  customer?: { full_name: string };
  gold_items?: { net_weight_grams: number; appraised_value: number }[];
}

interface BankNbfc {
  id: string;
  bank_code: string;
  bank_name: string;
}

interface Loyalty {
  id: string;
  loyalty_code: string;
  full_name: string;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cheque', label: 'Cheque' },
];

export default function GoldVault() {
  const { client, currentBranch, profile, isPlatformAdmin, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('repledged');
  const [loading, setLoading] = useState(true);
  const [packets, setPackets] = useState<RepledgePacket[]>([]);
  const [inVaultLoans, setInVaultLoans] = useState<InVaultLoan[]>([]);
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loyaltyBankAccounts, setLoyaltyBankAccounts] = useState<LoyaltyBankAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create packet dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGoldItems, setSelectedGoldItems] = useState<SelectedGoldItem[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedLoyaltyId, setSelectedLoyaltyId] = useState('');
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState('');
  const [bankLoanAmount, setBankLoanAmount] = useState('');
  const [bankInterestRate, setBankInterestRate] = useState('');
  const [bankReferenceNumber, setBankReferenceNumber] = useState('');
  const [bankLoanDate, setBankLoanDate] = useState('');
  const [bankMaturityDate, setBankMaturityDate] = useState('');
  const [packetImages, setPacketImages] = useState<File[]>([]);
  const [bankReceiptImages, setBankReceiptImages] = useState<File[]>([]);
  const [remarks, setRemarks] = useState('');

  // View packet
  const [viewPacket, setViewPacket] = useState<RepledgePacket | null>(null);
  const [packetItems, setPacketItems] = useState<RepledgeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Redeem packet dialog
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [packetToRedeem, setPacketToRedeem] = useState<RepledgePacket | null>(null);
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [bankPrincipalOutstanding, setBankPrincipalOutstanding] = useState('');
  const [bankInterestDue, setBankInterestDue] = useState('');
  const [bankPenalty, setBankPenalty] = useState('');
  const [redeemPaymentMode, setRedeemPaymentMode] = useState('neft');
  const [redeemPaymentReference, setRedeemPaymentReference] = useState('');
  const [redeemRemarks, setRedeemRemarks] = useState('');
  const [bankSettledConfirmed, setBankSettledConfirmed] = useState(false);
  const sourceAccount = useSourceAccount();

  const canManage = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    if (!client) return;

    try {
      await Promise.all([
        fetchPackets(),
        fetchInVaultLoans(),
        fetchBanks(),
        fetchLoyalties(),
        fetchAvailableLoans()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackets = async () => {
    if (!client) return;
    
    const { data, error } = await supabase
      .from('repledge_packets')
      .select('*, bank:banks_nbfc(bank_name, bank_code), loyalty:loyalties(full_name), credit_account:loyalty_bank_accounts(id, account_number, account_holder_name, bank:banks_nbfc(bank_name))')
      .eq('client_id', client.id)
      .order('packet_date', { ascending: false });

    if (error) {
      console.error('Error fetching packets:', error);
      return;
    }
    setPackets(data || []);
  };

  const fetchLoyaltyBankAccounts = async (loyaltyId: string) => {
    if (!client || !loyaltyId) {
      setLoyaltyBankAccounts([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('loyalty_bank_accounts')
      .select('id, account_number, account_holder_name, account_type, bank_id, bank:banks_nbfc(bank_name)')
      .eq('client_id', client.id)
      .eq('loyalty_id', loyaltyId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      setLoyaltyBankAccounts(data);
    }
  };

  const fetchInVaultLoans = async () => {
    if (!client) return;
    
    // Get all loan IDs that are already in repledge_items with active packets
    const { data: repledgedItems } = await supabase
      .from('repledge_items')
      .select('loan_id, packet:repledge_packets(status)')
      .eq('client_id', client.id);

    const activeLoanIds = repledgedItems
      ?.filter(i => (i.packet as any)?.status === 'active')
      .map(i => i.loan_id) || [];

    // Fetch active loans NOT in active repledge packets
    let query = supabase
      .from('loans')
      .select('id, loan_number, loan_date, principal_amount, status, customer:customers(full_name), gold_items(net_weight_grams, appraised_value)')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('loan_date', { ascending: false });

    if (activeLoanIds.length > 0) {
      query = query.not('id', 'in', `(${activeLoanIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching in-vault loans:', error);
      return;
    }
    setInVaultLoans(data || []);
  };

  const fetchBanks = async () => {
    if (!client) return;
    
    const { data, error } = await supabase
      .from('banks_nbfc')
      .select('id, bank_code, bank_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('bank_name');

    if (!error && data) {
      setBanks(data);
    }
  };

  const fetchLoyalties = async () => {
    if (!client) return;
    
    const { data, error } = await supabase
      .from('loyalties')
      .select('id, loyalty_code, full_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('full_name');

    if (!error && data) {
      setLoyalties(data);
    }
  };

  const fetchAvailableLoans = async () => {
    // No longer needed - using GoldItemSelector component instead
  };

  const fetchPacketItems = async (packetId: string) => {
    setLoadingItems(true);
    const { data, error } = await supabase
      .from('repledge_items')
      .select('*, loan:loans(loan_number, customer:customers(full_name))')
      .eq('packet_id', packetId);

    if (!error && data) {
      setPacketItems(data);
    }
    setLoadingItems(false);
  };

  const resetCreateForm = () => {
    setSelectedGoldItems([]);
    setSelectedBankId('');
    setSelectedLoyaltyId('');
    setSelectedCreditAccountId('');
    setLoyaltyBankAccounts([]);
    setBankLoanAmount('');
    setBankInterestRate('');
    setBankReferenceNumber('');
    setBankLoanDate('');
    setBankMaturityDate('');
    setPacketImages([]);
    setBankReceiptImages([]);
    setRemarks('');
  };

  const resetRedeemForm = () => {
    setBankPrincipalOutstanding('');
    setBankInterestDue('');
    setBankPenalty('');
    setRedeemPaymentMode('neft');
    setRedeemPaymentReference('');
    setRedeemRemarks('');
    setBankSettledConfirmed(false);
    sourceAccount.resetSourceAccount();
  };

  const handleLoyaltyChange = (loyaltyId: string) => {
    setSelectedLoyaltyId(loyaltyId);
    setSelectedCreditAccountId('');
    if (loyaltyId) {
      fetchLoyaltyBankAccounts(loyaltyId);
    } else {
      setLoyaltyBankAccounts([]);
    }
  };

  const uploadImages = async (files: File[], folder: string, packetId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${client!.id}/repledge/${packetId}/${folder}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('loan-documents')
        .upload(fileName, file);
        
      if (!error) {
        urls.push(fileName);
      }
    }
    return urls;
  };

  const handleCreatePacket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !currentBranch || selectedGoldItems.length === 0) {
      toast.error('Please select at least one gold item');
      return;
    }

    if (!selectedBankId) {
      toast.error('Please select a bank/NBFC');
      return;
    }

    setSubmitting(true);
    try {
      // Generate packet number
      const { data: packetNumber, error: numError } = await supabase.rpc('generate_packet_number', {
        p_client_id: client.id
      });
      if (numError) throw numError;

      // Calculate totals from selected gold items
      const affectedLoanIds = [...new Set(selectedGoldItems.map(i => i.loan_id))];
      const totals = {
        loans: affectedLoanIds.length,
        principal: 0, // Will be calculated based on proportional allocation
        weight: selectedGoldItems.reduce((s, i) => s + i.weight_grams, 0),
        value: selectedGoldItems.reduce((s, i) => s + i.appraised_value, 0),
      };

      // Fetch loan principal amounts for proportional allocation
      const { data: loanData } = await supabase
        .from('loans')
        .select('id, principal_amount, gold_items(id, appraised_value)')
        .in('id', affectedLoanIds);

      // Calculate proportional principal for each selected item
      const itemsWithPrincipal = selectedGoldItems.map(item => {
        const loan = loanData?.find(l => l.id === item.loan_id);
        const loanTotalValue = loan?.gold_items?.reduce((s: number, g: any) => s + g.appraised_value, 0) || 1;
        const principalAllocated = loan ? (item.appraised_value / loanTotalValue) * loan.principal_amount : 0;
        totals.principal += principalAllocated;
        return { ...item, principal_allocated: principalAllocated };
      });

      // Create packet
      const { data: packet, error: packetError } = await supabase
        .from('repledge_packets')
        .insert({
          client_id: client.id,
          branch_id: currentBranch.id,
          bank_id: selectedBankId,
          loyalty_id: selectedLoyaltyId || null,
          credit_account_id: selectedCreditAccountId || null,
          packet_number: packetNumber,
          packet_date: new Date().toISOString().split('T')[0],
          total_loans: totals.loans,
          total_principal: totals.principal,
          total_gold_weight_grams: totals.weight,
          total_appraised_value: totals.value,
          bank_loan_amount: bankLoanAmount ? parseFloat(bankLoanAmount) : null,
          bank_interest_rate: bankInterestRate ? parseFloat(bankInterestRate) : null,
          bank_reference_number: bankReferenceNumber || null,
          bank_loan_date: bankLoanDate || null,
          bank_maturity_date: bankMaturityDate || null,
          remarks: remarks || null,
          status: 'active'
        })
        .select('id')
        .single();

      if (packetError) throw packetError;

      // Upload images if any
      const imageUpdates: any = {};
      if (packetImages.length > 0) {
        imageUpdates.packet_images = await uploadImages(packetImages, 'packet', packet.id);
      }
      if (bankReceiptImages.length > 0) {
        imageUpdates.bank_receipt_images = await uploadImages(bankReceiptImages, 'receipt', packet.id);
      }

      if (Object.keys(imageUpdates).length > 0) {
        await supabase
          .from('repledge_packets')
          .update(imageUpdates)
          .eq('id', packet.id);
      }

      // Create repledge_gold_items entries for each selected gold item
      const goldItemEntries = itemsWithPrincipal.map(item => ({
        client_id: client.id,
        packet_id: packet.id,
        loan_id: item.loan_id,
        gold_item_id: item.gold_item_id,
        weight_grams: item.weight_grams,
        appraised_value: item.appraised_value,
        principal_allocated: item.principal_allocated,
        status: 'repledged',
        repledged_date: new Date().toISOString().split('T')[0],
        added_by: profile?.id || null
      }));

      const { error: goldItemsError } = await supabase
        .from('repledge_gold_items')
        .insert(goldItemEntries);

      if (goldItemsError) throw goldItemsError;

      // Update gold_items to mark them as repledged
      const goldItemIds = selectedGoldItems.map(i => i.gold_item_id);
      await supabase
        .from('gold_items')
        .update({ is_repledged: true, repledge_packet_id: packet.id })
        .in('id', goldItemIds);

      // Also create legacy repledge_items for backward compatibility (grouped by loan)
      const loanGroups = affectedLoanIds.map(loanId => {
        const loanItems = itemsWithPrincipal.filter(i => i.loan_id === loanId);
        return {
          client_id: client.id,
          packet_id: packet.id,
          loan_id: loanId,
          principal_amount: loanItems.reduce((s, i) => s + i.principal_allocated, 0),
          gold_weight_grams: loanItems.reduce((s, i) => s + i.weight_grams, 0),
          appraised_value: loanItems.reduce((s, i) => s + i.appraised_value, 0),
          status: 'repledged',
          repledged_date: new Date().toISOString().split('T')[0]
        };
      });

      const { error: itemsError } = await supabase
        .from('repledge_items')
        .insert(loanGroups);

      if (itemsError) throw itemsError;

      // Generate accounting voucher for repledge credit (if bank loan amount is provided)
      if (bankLoanAmount && parseFloat(bankLoanAmount) > 0) {
        const selectedBank = banks.find(b => b.id === selectedBankId);
        const voucherResult = await generateRepledgeCreditVoucher({
          clientId: client.id,
          branchId: currentBranch.id,
          packetId: packet.id,
          packetNumber: packetNumber,
          bankLoanAmount: parseFloat(bankLoanAmount),
          bankName: selectedBank?.bank_name || 'Bank',
        });

        if (!voucherResult.success && voucherResult.error) {
          console.warn('Voucher generation failed:', voucherResult.error);
        }
      }

      toast.success('Repledge packet created successfully');
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create packet');
    } finally {
      setSubmitting(false);
    }
  };

  const openRedeemDialog = (packet: RepledgePacket) => {
    setPacketToRedeem(packet);
    setBankPrincipalOutstanding(String(packet.bank_loan_amount || 0));
    
    // Calculate interest due based on bank loan date
    if (packet.bank_loan_date && packet.bank_loan_amount && packet.bank_interest_rate) {
      const days = differenceInDays(new Date(), parseISO(packet.bank_loan_date));
      const interest = (packet.bank_loan_amount * packet.bank_interest_rate * days) / (365 * 100);
      setBankInterestDue(String(Math.round(interest)));
    } else {
      setBankInterestDue('0');
    }
    
    setBankPenalty('0');
    setRedeemDialogOpen(true);
  };

  const handleRedeemPacket = async () => {
    if (!client || !currentBranch || !profile || !packetToRedeem) return;
    
    if (!bankSettledConfirmed) {
      toast.error('Please confirm bank loan has been settled');
      return;
    }

    const principalOutstanding = parseFloat(bankPrincipalOutstanding) || 0;
    const interestDue = parseFloat(bankInterestDue) || 0;
    const penalty = parseFloat(bankPenalty) || 0;
    const totalSettlement = principalOutstanding + interestDue + penalty;

    setRedeemSubmitting(true);
    try {
      // Generate redemption number
      const { data: redemptionNumber, error: numError } = await supabase.rpc('generate_repledge_redemption_number', {
        p_client_id: client.id
      });
      if (numError) throw numError;

      const sourceData = sourceAccount.getSourceAccountData(redeemPaymentMode);

      // Create repledge_redemption record
      const { error: redemptionError } = await supabase
        .from('repledge_redemptions')
        .insert({
          client_id: client.id,
          branch_id: currentBranch.id,
          packet_id: packetToRedeem.id,
          redemption_number: redemptionNumber,
          redemption_date: format(new Date(), 'yyyy-MM-dd'),
          bank_principal_outstanding: principalOutstanding,
          bank_interest_due: interestDue,
          bank_penalty: penalty,
          bank_total_settlement: totalSettlement,
          payment_mode: redeemPaymentMode,
          payment_reference: redeemPaymentReference || null,
          source_type: sourceData.source_type,
          source_bank_id: sourceData.source_bank_id,
          source_account_id: sourceData.source_account_id,
          processed_by: profile.id,
          remarks: redeemRemarks || null,
        });

      if (redemptionError) throw redemptionError;

      // Update packet status to released
      const { error: packetError } = await supabase
        .from('repledge_packets')
        .update({
          status: 'released',
          released_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .eq('id', packetToRedeem.id);

      if (packetError) throw packetError;

      // Update all repledge_items status to released
      const { error: itemsError } = await supabase
        .from('repledge_items')
        .update({
          status: 'released',
          released_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .eq('packet_id', packetToRedeem.id);

      if (itemsError) throw itemsError;

      // Generate accounting voucher for repledge redemption
      const voucherResult = await generateRepledgeRedemptionVoucher({
        clientId: client.id,
        branchId: currentBranch.id,
        redemptionId: redemptionNumber,
        packetNumber: packetToRedeem.packet_number,
        principalPaid: principalOutstanding,
        interestPaid: interestDue,
        penaltyPaid: penalty,
        totalSettlement: totalSettlement,
        bankName: packetToRedeem.bank?.bank_name || 'Bank',
      });

      if (!voucherResult.success && voucherResult.error) {
        console.warn('Voucher generation failed:', voucherResult.error);
      }

      toast.success(`Packet ${packetToRedeem.packet_number} redeemed successfully. Loans are now available for customer redemption/auction.`);
      setRedeemDialogOpen(false);
      setPacketToRedeem(null);
      resetRedeemForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to redeem packet');
    } finally {
      setRedeemSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'partially_released': return 'secondary';
      case 'released': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const filteredPackets = packets.filter(p =>
    p.packet_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bank?.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bank_reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInVault = inVaultLoans.filter(l =>
    l.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    packetsActive: packets.filter(p => p.status === 'active').length,
    totalRepledged: packets.filter(p => p.status === 'active').reduce((sum, p) => sum + p.total_principal, 0),
    inVaultCount: inVaultLoans.length,
    inVaultValue: inVaultLoans.reduce((sum, l) => sum + l.principal_amount, 0)
  };

  const bankTotalSettlement = (parseFloat(bankPrincipalOutstanding) || 0) + 
                               (parseFloat(bankInterestDue) || 0) + 
                               (parseFloat(bankPenalty) || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Vault className="h-6 w-6" />
              Gold Vault
            </h1>
            <p className="text-muted-foreground">Manage repledged loans and in-vault inventory</p>
          </div>
          {canManage && (
            <Button onClick={() => { resetCreateForm(); setCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Packet
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.packetsActive}</p>
                  <p className="text-xs text-muted-foreground">Active Packets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalStats.totalRepledged)}</p>
                  <p className="text-xs text-muted-foreground">Total Repledged</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Vault className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.inVaultCount}</p>
                  <p className="text-xs text-muted-foreground">In-Vault Loans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Vault className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalStats.inVaultValue)}</p>
                  <p className="text-xs text-muted-foreground">In-Vault Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="repledged">Repledged Packets</TabsTrigger>
                  <TabsTrigger value="in-vault">In-Vault</TabsTrigger>
                </TabsList>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs value={activeTab}>
                <TabsContent value="repledged">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Packet #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Bank/NBFC</TableHead>
                        <TableHead>Loans</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Gold (g)</TableHead>
                        <TableHead>Bank Loan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPackets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No repledge packets yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPackets.map((packet) => (
                          <TableRow key={packet.id}>
                            <TableCell className="font-mono text-sm">{packet.packet_number}</TableCell>
                            <TableCell>{new Date(packet.packet_date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>{packet.bank?.bank_name}</TableCell>
                            <TableCell>{packet.total_loans}</TableCell>
                            <TableCell>{formatCurrency(packet.total_principal)}</TableCell>
                            <TableCell>{packet.total_gold_weight_grams.toFixed(2)}g</TableCell>
                            <TableCell>{packet.bank_loan_amount ? formatCurrency(packet.bank_loan_amount) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(packet.status)}>
                                {packet.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setViewPacket(packet);
                                  fetchPacketItems(packet.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {packet.status === 'active' && canManage && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => openRedeemDialog(packet)}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="in-vault">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Loan Date</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Gold (g)</TableHead>
                        <TableHead>Appraised Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInVault.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No untracked loans in vault
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInVault.map((loan) => {
                          const goldWeight = loan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0;
                          const appraisedValue = loan.gold_items?.reduce((sum, g) => sum + g.appraised_value, 0) || 0;
                          return (
                            <TableRow key={loan.id}>
                              <TableCell className="font-mono text-sm">{loan.loan_number}</TableCell>
                              <TableCell>{loan.customer?.full_name}</TableCell>
                              <TableCell>{new Date(loan.loan_date).toLocaleDateString('en-IN')}</TableCell>
                              <TableCell>{formatCurrency(loan.principal_amount)}</TableCell>
                              <TableCell>{goldWeight.toFixed(2)}g</TableCell>
                              <TableCell>{formatCurrency(appraisedValue)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">In Vault</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Create Packet Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Repledge Packet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePacket} className="space-y-6">
              {/* Bank/NBFC Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank/NBFC *</Label>
                  <Select value={selectedBankId} onValueChange={setSelectedBankId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(bank => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.bank_name} ({bank.bank_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Handled By (Employee)</Label>
                  <Select value={selectedLoyaltyId} onValueChange={handleLoyaltyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {loyalties.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.full_name} ({l.loyalty_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Credit Account Selection - shown only when loyalty is selected */}
              {selectedLoyaltyId && (
                <div className="space-y-2">
                  <Label>Credit To Account {loyaltyBankAccounts.length > 0 && '*'}</Label>
                  {loyaltyBankAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No bank accounts found for this employee
                    </p>
                  ) : (
                    <Select value={selectedCreditAccountId} onValueChange={setSelectedCreditAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account for bank credit" />
                      </SelectTrigger>
                      <SelectContent>
                        {loyaltyBankAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.bank?.bank_name} - A/C {acc.account_number} ({acc.account_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Bank credit will be deposited to this account
                  </p>
                </div>
              )}

              {/* Gold Item Selection */}
              {client && (
                <GoldItemSelector
                  clientId={client.id}
                  selectedItems={selectedGoldItems}
                  onSelectionChange={setSelectedGoldItems}
                />
              )}

              {/* Bank Loan Details */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Bank Loan Details (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Loan Amount (₹)</Label>
                    <Input
                      type="number"
                      value={bankLoanAmount}
                      onChange={(e) => setBankLoanAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bankInterestRate}
                      onChange={(e) => setBankInterestRate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input
                      value={bankReferenceNumber}
                      onChange={(e) => setBankReferenceNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loan Date</Label>
                    <Input
                      type="date"
                      value={bankLoanDate}
                      onChange={(e) => setBankLoanDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maturity Date</Label>
                    <Input
                      type="date"
                      value={bankMaturityDate}
                      onChange={(e) => setBankMaturityDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Document Uploads (Optional - can add later)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <MultiFileUpload
                    label="Packet Images"
                    files={packetImages}
                    onFilesChange={setPacketImages}
                    maxFiles={5}
                  />
                  <MultiFileUpload
                    label="Bank Receipt Images"
                    files={bankReceiptImages}
                    onFilesChange={setBankReceiptImages}
                    maxFiles={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || selectedGoldItems.length === 0}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Packet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Packet Dialog */}
        <Dialog open={!!viewPacket} onOpenChange={() => setViewPacket(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Packet Details - {viewPacket?.packet_number}</DialogTitle>
            </DialogHeader>
            {viewPacket && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank/NBFC</p>
                    <p className="font-medium">{viewPacket.bank?.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(viewPacket.packet_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loans</p>
                    <p className="font-medium">{viewPacket.total_loans}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Principal</p>
                    <p className="font-medium">{formatCurrency(viewPacket.total_principal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gold Weight</p>
                    <p className="font-medium">{viewPacket.total_gold_weight_grams.toFixed(2)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Loan Amount</p>
                    <p className="font-medium">{viewPacket.bank_loan_amount ? formatCurrency(viewPacket.bank_loan_amount) : '-'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Loans in this Packet</h4>
                  {loadingItems ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loan #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Gold (g)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packetItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.loan?.loan_number}</TableCell>
                            <TableCell>{item.loan?.customer?.full_name}</TableCell>
                            <TableCell>{formatCurrency(item.principal_amount)}</TableCell>
                            <TableCell>{item.gold_weight_grams.toFixed(2)}g</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Redeem Packet Dialog */}
        <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-green-600" />
                Redeem Packet - {packetToRedeem?.packet_number}
              </DialogTitle>
            </DialogHeader>
            {packetToRedeem && (
              <div className="space-y-6">
                {/* Packet Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank/NBFC</p>
                      <p className="font-medium">{packetToRedeem.bank?.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Reference</p>
                      <p className="font-medium">{packetToRedeem.bank_reference_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Loans</p>
                      <p className="font-medium">{packetToRedeem.total_loans}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Principal</p>
                      <p className="font-medium">{formatCurrency(packetToRedeem.total_principal)}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Settlement Calculation */}
                <div className="space-y-4">
                  <h4 className="font-medium">Bank Loan Settlement</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Principal Outstanding (₹)</Label>
                      <Input
                        type="number"
                        value={bankPrincipalOutstanding}
                        onChange={(e) => setBankPrincipalOutstanding(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Interest Due (₹)</Label>
                      <Input
                        type="number"
                        value={bankInterestDue}
                        onChange={(e) => setBankInterestDue(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Penalty (₹)</Label>
                    <Input
                      type="number"
                      value={bankPenalty}
                      onChange={(e) => setBankPenalty(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex justify-between text-lg font-bold text-green-800 dark:text-green-300">
                      <span>Total Bank Settlement</span>
                      <span>{formatCurrency(bankTotalSettlement)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Details */}
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select value={redeemPaymentMode} onValueChange={setRedeemPaymentMode}>
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
                      <Label>Payment Reference</Label>
                      <Input
                        value={redeemPaymentReference}
                        onChange={(e) => setRedeemPaymentReference(e.target.value)}
                        placeholder="Transaction reference"
                      />
                    </div>
                  </div>

                  {/* Source Account Selection for non-cash payments */}
                  <SourceAccountSelector
                    clientId={client?.id || ''}
                    paymentMode={redeemPaymentMode}
                    sourceType={sourceAccount.sourceType}
                    setSourceType={sourceAccount.setSourceType}
                    sourceBankId={sourceAccount.sourceBankId}
                    setSourceBankId={sourceAccount.setSourceBankId}
                    sourceAccountId={sourceAccount.sourceAccountId}
                    setSourceAccountId={sourceAccount.setSourceAccountId}
                    selectedLoyaltyId={sourceAccount.selectedLoyaltyId}
                    setSelectedLoyaltyId={sourceAccount.setSelectedLoyaltyId}
                  />

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={redeemRemarks}
                      onChange={(e) => setRedeemRemarks(e.target.value)}
                      placeholder="Optional notes"
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Confirmation */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        Upon redemption, all <strong>{packetToRedeem.total_loans} loans</strong> in this packet will be released from repledge tracking and will become available for customer redemption or auction.
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="bankSettledConfirmed"
                          checked={bankSettledConfirmed}
                          onCheckedChange={(checked) => setBankSettledConfirmed(checked === true)}
                        />
                        <Label htmlFor="bankSettledConfirmed" className="cursor-pointer text-amber-800 dark:text-amber-300">
                          I confirm bank loan has been settled
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => { setRedeemDialogOpen(false); resetRedeemForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRedeemPacket} 
                    disabled={redeemSubmitting || !bankSettledConfirmed}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {redeemSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Unlock className="h-4 w-4 mr-2" />
                    Redeem Packet
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
