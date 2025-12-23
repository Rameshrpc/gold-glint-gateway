import { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { MobileSearchBar, MobileBottomSheet } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Users, Phone, Mail, Pencil, Trash2, CreditCard, User } from 'lucide-react';
import { vibrateSuccess } from '@/lib/haptics';

interface Loyalty {
  id: string;
  client_id: string;
  branch_id: string | null;
  loyalty_code: string;
  employee_id: string | null;
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  designation: string | null;
  department: string | null;
  joining_date: string | null;
  is_active: boolean;
}

interface LoyaltyBankAccount {
  id: string;
  loyalty_id: string;
  bank_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string | null;
  account_type: string;
  credit_limit: number | null;
  interest_rate: number | null;
  is_primary: boolean;
  is_active: boolean;
  bank?: { bank_name: string; bank_code: string };
}

interface BankNbfc {
  id: string;
  bank_code: string;
  bank_name: string;
}

export default function MobileLoyalties() {
  const { client, currentBranch, branches, isPlatformAdmin, hasRole } = useAuth();
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState<Loyalty | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bank accounts
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [selectedLoyalty, setSelectedLoyalty] = useState<Loyalty | null>(null);
  const [bankAccounts, setBankAccounts] = useState<LoyaltyBankAccount[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LoyaltyBankAccount | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    employee_id: '',
    designation: '',
    department: '',
    joining_date: '',
    branch_id: '',
    is_active: true,
  });

  const [accountFormData, setAccountFormData] = useState({
    bank_id: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings',
    credit_limit: '',
    interest_rate: '',
    is_primary: false,
  });

  const canManage = isPlatformAdmin() || hasRole('tenant_admin');

  useEffect(() => {
    fetchLoyalties();
    fetchBanks();
  }, [client]);

  const fetchLoyalties = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('loyalties')
        .select('*')
        .eq('client_id', client.id)
        .order('full_name');

      if (error) throw error;
      setLoyalties(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('banks_nbfc')
        .select('id, bank_code, bank_name')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      console.error('Failed to fetch banks:', error);
    }
  };

  const fetchBankAccounts = async (loyaltyId: string) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_bank_accounts')
        .select('*, bank:banks_nbfc(bank_name, bank_code)')
        .eq('loyalty_id', loyaltyId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch bank accounts');
    }
  };

  const resetForm = () => {
    setEditingLoyalty(null);
    setFormData({
      full_name: '',
      phone: '',
      alternate_phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      employee_id: '',
      designation: '',
      department: '',
      joining_date: '',
      branch_id: currentBranch?.id || '',
      is_active: true,
    });
  };

  const resetAccountForm = () => {
    setEditingAccount(null);
    setAccountFormData({
      bank_id: '',
      account_holder_name: '',
      account_number: '',
      ifsc_code: '',
      account_type: 'savings',
      credit_limit: '',
      interest_rate: '',
      is_primary: false,
    });
  };

  const handleEdit = (loyalty: Loyalty) => {
    setEditingLoyalty(loyalty);
    setFormData({
      full_name: loyalty.full_name,
      phone: loyalty.phone,
      alternate_phone: loyalty.alternate_phone || '',
      email: loyalty.email || '',
      date_of_birth: loyalty.date_of_birth || '',
      gender: loyalty.gender || '',
      address: loyalty.address || '',
      city: loyalty.city || '',
      state: loyalty.state || '',
      pincode: loyalty.pincode || '',
      employee_id: loyalty.employee_id || '',
      designation: loyalty.designation || '',
      department: loyalty.department || '',
      joining_date: loyalty.joining_date || '',
      branch_id: loyalty.branch_id || '',
      is_active: loyalty.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!client) return;

    setSubmitting(true);
    try {
      let loyaltyCode = editingLoyalty?.loyalty_code;
      
      if (!editingLoyalty) {
        const { data: codeData, error: codeError } = await supabase.rpc('generate_loyalty_code', {
          p_client_id: client.id
        });
        if (codeError) throw codeError;
        loyaltyCode = codeData;
      }

      const data: any = {
        client_id: client.id,
        branch_id: formData.branch_id || null,
        loyalty_code: loyaltyCode,
        employee_id: formData.employee_id.trim() || null,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        alternate_phone: formData.alternate_phone.trim() || null,
        email: formData.email.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        designation: formData.designation.trim() || null,
        department: formData.department.trim() || null,
        joining_date: formData.joining_date || null,
        is_active: formData.is_active,
      };

      if (editingLoyalty) {
        const { error } = await supabase
          .from('loyalties')
          .update(data)
          .eq('id', editingLoyalty.id);
        if (error) throw error;
        toast.success('Employee updated');
      } else {
        const { error } = await supabase.from('loyalties').insert(data);
        if (error) throw error;
        toast.success('Employee created');
      }

      vibrateSuccess();
      setShowForm(false);
      resetForm();
      fetchLoyalties();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!client || !selectedLoyalty) return;

    setSubmitting(true);
    try {
      const data = {
        client_id: client.id,
        loyalty_id: selectedLoyalty.id,
        bank_id: accountFormData.bank_id,
        account_holder_name: accountFormData.account_holder_name.trim(),
        account_number: accountFormData.account_number.trim(),
        ifsc_code: accountFormData.ifsc_code.trim().toUpperCase() || null,
        account_type: accountFormData.account_type,
        credit_limit: accountFormData.credit_limit ? parseFloat(accountFormData.credit_limit) : null,
        interest_rate: accountFormData.interest_rate ? parseFloat(accountFormData.interest_rate) : null,
        is_primary: accountFormData.is_primary,
        is_active: true,
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('loyalty_bank_accounts')
          .update(data)
          .eq('id', editingAccount.id);
        if (error) throw error;
        toast.success('Account updated');
      } else {
        const { error } = await supabase.from('loyalty_bank_accounts').insert(data);
        if (error) throw error;
        toast.success('Account added');
      }

      vibrateSuccess();
      setShowAccountForm(false);
      resetAccountForm();
      fetchBankAccounts(selectedLoyalty.id);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('loyalties').delete().eq('id', id);
      if (error) throw error;
      vibrateSuccess();
      toast.success('Employee deleted');
      fetchLoyalties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase.from('loyalty_bank_accounts').delete().eq('id', accountId);
      if (error) throw error;
      vibrateSuccess();
      toast.success('Account deleted');
      if (selectedLoyalty) {
        fetchBankAccounts(selectedLoyalty.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const openBankAccounts = (loyalty: Loyalty) => {
    setSelectedLoyalty(loyalty);
    fetchBankAccounts(loyalty.id);
    setShowBankAccounts(true);
  };

  const filteredLoyalties = loyalties.filter(l =>
    l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loyalty_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery) ||
    l.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout hideNav={showForm || showBankAccounts}>
      <MobileSimpleHeader 
        title="Loyalties"
        showBack
        showSearch
        onSearchClick={() => setShowSearch(true)}
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{loyalties.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{loyalties.filter(l => l.is_active).length}</p>
          </div>
        </div>

        {/* Add Button */}
        {canManage && (
          <Button 
            className="w-full"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}

        {/* Loyalties List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredLoyalties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No employees found</p>
            <p className="text-sm">Add your first employee to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLoyalties.map((loyalty) => (
              <div 
                key={loyalty.id} 
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {loyalty.loyalty_code}
                      </span>
                      <Badge variant={loyalty.is_active ? 'default' : 'secondary'} className="text-xs">
                        {loyalty.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{loyalty.full_name}</h3>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {loyalty.phone}
                      </div>
                      {loyalty.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {loyalty.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {loyalty.designation && (
                        <Badge variant="outline" className="text-xs">
                          {loyalty.designation}
                        </Badge>
                      )}
                      {loyalty.department && (
                        <Badge variant="outline" className="text-xs">
                          {loyalty.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openBankAccounts(loyalty)}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(loyalty)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(loyalty.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Sheet */}
      <MobileBottomSheet
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        title="Search Employees"
      >
        <div className="p-4">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, code, or phone..."
            autoFocus
          />
        </div>
      </MobileBottomSheet>

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingLoyalty ? 'Edit Employee' : 'Add Employee'}
      >
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="work">Work Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Employee name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alt Phone</Label>
                  <Input
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@email.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="641001"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="work" className="space-y-4">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="EMP001"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Operations"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={formData.branch_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No branch</SelectItem>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={handleSubmit} 
            className="w-full mt-4" 
            disabled={!formData.full_name || !formData.phone || submitting}
          >
            {submitting ? 'Saving...' : (editingLoyalty ? 'Update' : 'Create')} Employee
          </Button>
        </div>
      </MobileBottomSheet>

      {/* Bank Accounts Sheet */}
      <MobileBottomSheet
        isOpen={showBankAccounts}
        onClose={() => setShowBankAccounts(false)}
        title={`Bank Accounts - ${selectedLoyalty?.full_name || ''}`}
      >
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <Button 
            className="w-full"
            onClick={() => {
              resetAccountForm();
              setShowAccountForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
          
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No bank accounts added</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="bg-muted/30 rounded-lg p-3 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{account.bank?.bank_name}</span>
                        {account.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.account_number}
                      </p>
                      {account.ifsc_code && (
                        <p className="text-xs text-muted-foreground font-mono">
                          IFSC: {account.ifsc_code}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileBottomSheet>

      {/* Add Bank Account Form */}
      <MobileBottomSheet
        isOpen={showAccountForm}
        onClose={() => setShowAccountForm(false)}
        title="Add Bank Account"
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Bank *</Label>
            <Select
              value={accountFormData.bank_id}
              onValueChange={(value) => setAccountFormData({ ...accountFormData, bank_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.bank_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Account Holder Name *</Label>
            <Input
              value={accountFormData.account_holder_name}
              onChange={(e) => setAccountFormData({ ...accountFormData, account_holder_name: e.target.value })}
              placeholder="Name as per bank"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Account Number *</Label>
              <Input
                value={accountFormData.account_number}
                onChange={(e) => setAccountFormData({ ...accountFormData, account_number: e.target.value })}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input
                value={accountFormData.ifsc_code}
                onChange={(e) => setAccountFormData({ ...accountFormData, ifsc_code: e.target.value })}
                placeholder="HDFC0001234"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select
              value={accountFormData.account_type}
              onValueChange={(value) => setAccountFormData({ ...accountFormData, account_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="overdraft">Overdraft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Credit Limit</Label>
              <Input
                type="number"
                value={accountFormData.credit_limit}
                onChange={(e) => setAccountFormData({ ...accountFormData, credit_limit: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate %</Label>
              <Input
                type="number"
                step="0.1"
                value={accountFormData.interest_rate}
                onChange={(e) => setAccountFormData({ ...accountFormData, interest_rate: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={accountFormData.is_primary}
              onCheckedChange={(checked) => setAccountFormData({ ...accountFormData, is_primary: checked })}
            />
            <Label>Primary Account</Label>
          </div>
          
          <Button 
            onClick={handleAddBankAccount} 
            className="w-full" 
            disabled={!accountFormData.bank_id || !accountFormData.account_number || submitting}
          >
            {submitting ? 'Saving...' : 'Add Account'}
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
