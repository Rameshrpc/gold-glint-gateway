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
import { Plus, Package, Search, Eye, Loader2, Building2, Upload, FileImage, X, Vault } from 'lucide-react';
import MultiFileUpload from '@/components/uploads/MultiFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface Loan {
  id: string;
  loan_number: string;
  principal_amount: number;
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

export default function GoldVault() {
  const { client, currentBranch, isPlatformAdmin, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('repledged');
  const [loading, setLoading] = useState(true);
  const [packets, setPackets] = useState<RepledgePacket[]>([]);
  const [inVaultItems, setInVaultItems] = useState<RepledgeItem[]>([]);
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loyaltyBankAccounts, setLoyaltyBankAccounts] = useState<LoyaltyBankAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create packet dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
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

  const canManage = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer');

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    if (!client) return;

    try {
      await Promise.all([
        fetchPackets(),
        fetchInVaultItems(),
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

  const fetchInVaultItems = async () => {
    if (!client) return;
    
    const { data, error } = await supabase
      .from('repledge_items')
      .select('*, loan:loans(loan_number, customer:customers(full_name))')
      .eq('client_id', client.id)
      .is('packet_id', null)
      .eq('status', 'in_vault')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching in-vault items:', error);
      return;
    }
    setInVaultItems(data || []);
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
    if (!client) return;
    
    // Get loans that are active and not already in a repledge item
    const { data: existingItems } = await supabase
      .from('repledge_items')
      .select('loan_id')
      .eq('client_id', client.id);

    const existingLoanIds = existingItems?.map(i => i.loan_id) || [];

    let query = supabase
      .from('loans')
      .select('id, loan_number, principal_amount, customer:customers(full_name), gold_items(net_weight_grams, appraised_value)')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('loan_date', { ascending: false });

    if (existingLoanIds.length > 0) {
      query = query.not('id', 'in', `(${existingLoanIds.join(',')})`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAvailableLoans(data);
    }
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
    setSelectedLoans([]);
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
    if (!client || !currentBranch || selectedLoans.length === 0) {
      toast.error('Please select at least one loan');
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

      // Calculate totals from selected loans
      const selectedLoanData = availableLoans.filter(l => selectedLoans.includes(l.id));
      const totals = selectedLoanData.reduce((acc, loan) => {
        const goldWeight = loan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0;
        const appraisedValue = loan.gold_items?.reduce((sum, g) => sum + g.appraised_value, 0) || 0;
        return {
          loans: acc.loans + 1,
          principal: acc.principal + loan.principal_amount,
          weight: acc.weight + goldWeight,
          value: acc.value + appraisedValue
        };
      }, { loans: 0, principal: 0, weight: 0, value: 0 });

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

      // Create repledge items for each loan
      const items = selectedLoanData.map(loan => ({
        client_id: client.id,
        packet_id: packet.id,
        loan_id: loan.id,
        principal_amount: loan.principal_amount,
        gold_weight_grams: loan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0,
        appraised_value: loan.gold_items?.reduce((sum, g) => sum + g.appraised_value, 0) || 0,
        status: 'repledged',
        repledged_date: new Date().toISOString().split('T')[0]
      }));

      const { error: itemsError } = await supabase
        .from('repledge_items')
        .insert(items);

      if (itemsError) throw itemsError;

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

  const filteredInVault = inVaultItems.filter(i =>
    i.loan?.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.loan?.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    packetsActive: packets.filter(p => p.status === 'active').length,
    totalRepledged: packets.reduce((sum, p) => sum + p.total_principal, 0),
    inVaultCount: inVaultItems.length,
    inVaultValue: inVaultItems.reduce((sum, i) => sum + i.principal_amount, 0)
  };

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
                            <TableCell className="text-right">
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
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No loans in vault
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInVault.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.loan?.loan_number}</TableCell>
                            <TableCell>{item.loan?.customer?.full_name}</TableCell>
                            <TableCell>{formatCurrency(item.principal_amount)}</TableCell>
                            <TableCell>{item.gold_weight_grams.toFixed(2)}g</TableCell>
                            <TableCell>{formatCurrency(item.appraised_value)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">In Vault</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
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

              {/* Loan Selection */}
              <div className="space-y-2">
                <Label>Select Loans to Repledge *</Label>
                <Card className="max-h-60 overflow-y-auto">
                  <CardContent className="p-3">
                    {availableLoans.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No available loans to repledge
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableLoans.map(loan => {
                          const weight = loan.gold_items?.reduce((s, g) => s + g.net_weight_grams, 0) || 0;
                          return (
                            <div key={loan.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                              <Checkbox
                                checked={selectedLoans.includes(loan.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLoans([...selectedLoans, loan.id]);
                                  } else {
                                    setSelectedLoans(selectedLoans.filter(id => id !== loan.id));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{loan.loan_number}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span>{loan.customer?.full_name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(loan.principal_amount)} • {weight.toFixed(2)}g gold
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {selectedLoans.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedLoans.length} loans
                  </p>
                )}
              </div>

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
                <Button type="submit" disabled={submitting || selectedLoans.length === 0}>
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
      </div>
    </DashboardLayout>
  );
}
