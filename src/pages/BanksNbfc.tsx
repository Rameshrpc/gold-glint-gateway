import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  created_at: string;
}

export default function BanksNbfc() {
  const { client, isPlatformAdmin, hasRole } = useAuth();
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankNbfc | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<BankNbfc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankType, setBankType] = useState('bank');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [remarks, setRemarks] = useState('');

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
    setBankCode('');
    setBankName('');
    setBankType('bank');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBranchName('');
    setIfscCode('');
    setAccountNumber('');
    setInterestRate('');
    setCreditLimit('');
    setIsActive(true);
    setRemarks('');
    setEditingBank(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (bank: BankNbfc) => {
    setEditingBank(bank);
    setBankCode(bank.bank_code);
    setBankName(bank.bank_name);
    setBankType(bank.bank_type);
    setContactPerson(bank.contact_person || '');
    setPhone(bank.phone || '');
    setEmail(bank.email || '');
    setAddress(bank.address || '');
    setBranchName(bank.branch_name || '');
    setIfscCode(bank.ifsc_code || '');
    setAccountNumber(bank.account_number || '');
    setInterestRate(bank.interest_rate?.toString() || '');
    setCreditLimit(bank.credit_limit?.toString() || '');
    setIsActive(bank.is_active);
    setRemarks(bank.remarks || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setSubmitting(true);
    try {
      const data = {
        client_id: client.id,
        bank_code: bankCode.trim().toUpperCase(),
        bank_name: bankName.trim(),
        bank_type: bankType,
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        branch_name: branchName.trim() || null,
        ifsc_code: ifscCode.trim().toUpperCase() || null,
        account_number: accountNumber.trim() || null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        credit_limit: creditLimit ? parseFloat(creditLimit) : null,
        is_active: isActive,
        remarks: remarks.trim() || null,
      };

      if (editingBank) {
        const { error } = await supabase
          .from('banks_nbfc')
          .update(data)
          .eq('id', editingBank.id);
        if (error) throw error;
        toast.success('Bank/NBFC updated successfully');
      } else {
        const { error } = await supabase
          .from('banks_nbfc')
          .insert(data);
        if (error) throw error;
        toast.success('Bank/NBFC created successfully');
      }

      setDialogOpen(false);
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

  const handleDelete = async () => {
    if (!bankToDelete) return;

    try {
      const { error } = await supabase
        .from('banks_nbfc')
        .delete()
        .eq('id', bankToDelete.id);
      if (error) throw error;
      
      toast.success('Bank/NBFC deleted successfully');
      setDeleteDialogOpen(false);
      setBankToDelete(null);
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bank / NBFC Master</h1>
            <p className="text-muted-foreground">Manage banks and NBFCs for repledge operations</p>
          </div>
          {canManage && (
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank/NBFC
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.length}</p>
                  <p className="text-xs text-muted-foreground">Total Banks/NBFCs</p>
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
                  <p className="text-2xl font-bold">{banks.filter(b => b.bank_type === 'bank').length}</p>
                  <p className="text-xs text-muted-foreground">Banks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.filter(b => b.bank_type === 'nbfc').length}</p>
                  <p className="text-xs text-muted-foreground">NBFCs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.filter(b => b.is_active).length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No banks/NBFCs found matching your search' : 'No banks/NBFCs added yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBanks.map((bank) => (
                      <TableRow key={bank.id}>
                        <TableCell className="font-mono text-sm">{bank.bank_code}</TableCell>
                        <TableCell className="font-medium">{bank.bank_name}</TableCell>
                        <TableCell>
                          <Badge variant={bank.bank_type === 'bank' ? 'default' : 'secondary'}>
                            {bank.bank_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{bank.branch_name || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{bank.ifsc_code || '-'}</TableCell>
                        <TableCell>{bank.interest_rate ? `${bank.interest_rate}%` : '-'}</TableCell>
                        <TableCell>{formatCurrency(bank.credit_limit)}</TableCell>
                        <TableCell>
                          <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                            {bank.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(bank)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive"
                                onClick={() => { setBankToDelete(bank); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBank ? 'Edit Bank/NBFC' : 'Add Bank/NBFC'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Bank Code *</Label>
                  <Input
                    id="bankCode"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="e.g., HDFC001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankType">Type *</Label>
                  <Select value={bankType} onValueChange={setBankType}>
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
                <Label htmlFor="bankName">Bank/NBFC Name *</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., HDFC Bank"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., Coimbatore Main"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="e.g., HDFC0001234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                />
              </div>

              {/* Contact Info */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Financial Info */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Financial Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="e.g., 10000000"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Remarks */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isActive" className="font-normal">Active</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingBank ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bank/NBFC</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{bankToDelete?.bank_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
