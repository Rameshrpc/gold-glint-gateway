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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateBankAccount } from '@/hooks/useVoucherGeneration';
import { toast } from 'sonner';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { vibrateSuccess } from '@/lib/haptics';

interface BankNbfc {
  id: string;
  client_id: string;
  bank_code: string;
  bank_name: string;
  bank_type: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  branch_name: string | null;
  ifsc_code: string | null;
  account_number: string | null;
  interest_rate: number | null;
  credit_limit: number | null;
  is_active: boolean;
  remarks: string | null;
}

export default function MobileBanksNbfc() {
  const { client, isPlatformAdmin, hasRole } = useAuth();
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankNbfc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bank_code: '',
    bank_name: '',
    bank_type: 'bank',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    branch_name: '',
    ifsc_code: '',
    account_number: '',
    interest_rate: '',
    credit_limit: '',
    is_active: true,
    remarks: '',
  });

  const canManage = isPlatformAdmin() || hasRole('tenant_admin');

  useEffect(() => {
    fetchBanks();
  }, [client]);

  const fetchBanks = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('banks_nbfc')
        .select('*')
        .eq('client_id', client.id)
        .order('bank_name');

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch banks/NBFCs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingBank(null);
    setFormData({
      bank_code: '',
      bank_name: '',
      bank_type: 'bank',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      branch_name: '',
      ifsc_code: '',
      account_number: '',
      interest_rate: '',
      credit_limit: '',
      is_active: true,
      remarks: '',
    });
  };

  const handleEdit = (bank: BankNbfc) => {
    setEditingBank(bank);
    setFormData({
      bank_code: bank.bank_code,
      bank_name: bank.bank_name,
      bank_type: bank.bank_type,
      contact_person: bank.contact_person || '',
      phone: bank.phone || '',
      email: bank.email || '',
      address: bank.address || '',
      branch_name: bank.branch_name || '',
      ifsc_code: bank.ifsc_code || '',
      account_number: bank.account_number || '',
      interest_rate: bank.interest_rate?.toString() || '',
      credit_limit: bank.credit_limit?.toString() || '',
      is_active: bank.is_active,
      remarks: bank.remarks || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!client) return;

    setSubmitting(true);
    try {
      const data = {
        client_id: client.id,
        bank_code: formData.bank_code.trim().toUpperCase(),
        bank_name: formData.bank_name.trim(),
        bank_type: formData.bank_type,
        contact_person: formData.contact_person.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        branch_name: formData.branch_name.trim() || null,
        ifsc_code: formData.ifsc_code.trim().toUpperCase() || null,
        account_number: formData.account_number.trim() || null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        is_active: formData.is_active,
        remarks: formData.remarks.trim() || null,
      };

      if (editingBank) {
        const { error } = await supabase
          .from('banks_nbfc')
          .update(data)
          .eq('id', editingBank.id);
        if (error) throw error;
        toast.success('Bank/NBFC updated');
      } else {
        const { data: newBank, error } = await supabase
          .from('banks_nbfc')
          .insert(data)
          .select()
          .single();
        if (error) throw error;

        // Auto-create ledger account
        if (newBank && client) {
          await getOrCreateBankAccount(
            client.id,
            newBank.id,
            newBank.bank_name,
            newBank.bank_code
          );
        }
        toast.success('Bank/NBFC created');
      }

      vibrateSuccess();
      setShowForm(false);
      resetForm();
      fetchBanks();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Bank code already exists');
      } else {
        toast.error(error.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('banks_nbfc').delete().eq('id', id);
      if (error) throw error;
      vibrateSuccess();
      toast.success('Bank/NBFC deleted');
      fetchBanks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.bank_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.branch_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MobileLayout hideNav={showForm}>
      <MobileSimpleHeader 
        title="Banks & NBFCs"
        showBack
        showSearch
        onSearchClick={() => setShowSearch(true)}
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{banks.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{banks.filter(b => b.is_active).length}</p>
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
            Add Bank/NBFC
          </Button>
        )}

        {/* Banks List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No banks/NBFCs found</p>
            <p className="text-sm">Add your first bank to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBanks.map((bank) => (
              <div 
                key={bank.id} 
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {bank.bank_code}
                      </span>
                      <Badge 
                        variant={bank.bank_type === 'bank' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {bank.bank_type.toUpperCase()}
                      </Badge>
                      <Badge 
                        variant={bank.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{bank.bank_name}</h3>
                    
                    {bank.branch_name && (
                      <p className="text-sm text-muted-foreground">{bank.branch_name}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bank.ifsc_code && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {bank.ifsc_code}
                        </Badge>
                      )}
                      {bank.interest_rate && (
                        <Badge variant="outline" className="text-xs">
                          {bank.interest_rate}% Interest
                        </Badge>
                      )}
                      {bank.credit_limit && (
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(bank.credit_limit)} Limit
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(bank)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(bank.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
        title="Search Banks"
      >
        <div className="p-4">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, code, or branch..."
            autoFocus
          />
        </div>
      </MobileBottomSheet>

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingBank ? 'Edit Bank/NBFC' : 'Add Bank/NBFC'}
      >
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bank Code *</Label>
              <Input
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                placeholder="HDFC001"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.bank_type}
                onValueChange={(value) => setFormData({ ...formData, bank_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="nbfc">NBFC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bank/NBFC Name *</Label>
            <Input
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="HDFC Bank"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                placeholder="Main Branch"
              />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                placeholder="HDFC0001234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="Account number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Interest Rate %</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                placeholder="12.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Limit</Label>
              <Input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                placeholder="1000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Manager name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="bank@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Bank address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={!formData.bank_code || !formData.bank_name || submitting}
          >
            {submitting ? 'Saving...' : (editingBank ? 'Update' : 'Create')} Bank/NBFC
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
