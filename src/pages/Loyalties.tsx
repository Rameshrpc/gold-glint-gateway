import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Search, Edit, Trash2, Loader2, Eye, CreditCard, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  photo_url: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_card_url: string | null;
  is_active: boolean;
  remarks: string | null;
  created_at: string;
}

interface LoyaltyBankAccount {
  id: string;
  client_id: string;
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
  remarks: string | null;
  bank?: { bank_name: string; bank_code: string };
}

interface BankNbfc {
  id: string;
  bank_code: string;
  bank_name: string;
}

export default function Loyalties() {
  const { client, currentBranch, branches, isPlatformAdmin, hasRole } = useAuth();
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState<Loyalty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loyaltyToDelete, setLoyaltyToDelete] = useState<Loyalty | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bank accounts sheet
  const [bankAccountsOpen, setBankAccountsOpen] = useState(false);
  const [selectedLoyalty, setSelectedLoyalty] = useState<Loyalty | null>(null);
  const [bankAccounts, setBankAccounts] = useState<LoyaltyBankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Bank account form
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LoyaltyBankAccount | null>(null);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountIfsc, setAccountIfsc] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [accountCreditLimit, setAccountCreditLimit] = useState('');
  const [accountInterestRate, setAccountInterestRate] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Form state for employee
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<string>('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [remarks, setRemarks] = useState('');

  // File uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);

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
    setLoadingAccounts(true);
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
    } finally {
      setLoadingAccounts(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAlternatePhone('');
    setEmail('');
    setDateOfBirth('');
    setGender('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setEmployeeId('');
    setDesignation('');
    setDepartment('');
    setJoiningDate('');
    setSelectedBranchId(currentBranch?.id || '');
    setIsActive(true);
    setRemarks('');
    setEditingLoyalty(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadhaarFrontFile(null);
    setAadhaarBackFile(null);
    setPanCardFile(null);
  };

  const resetAccountForm = () => {
    setSelectedBankId('');
    setAccountHolderName('');
    setAccountNumber('');
    setAccountIfsc('');
    setAccountType('savings');
    setAccountCreditLimit('');
    setAccountInterestRate('');
    setIsPrimary(false);
    setEditingAccount(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (loyalty: Loyalty) => {
    setEditingLoyalty(loyalty);
    setFullName(loyalty.full_name);
    setPhone(loyalty.phone);
    setAlternatePhone(loyalty.alternate_phone || '');
    setEmail(loyalty.email || '');
    setDateOfBirth(loyalty.date_of_birth || '');
    setGender(loyalty.gender || '');
    setAddress(loyalty.address || '');
    setCity(loyalty.city || '');
    setState(loyalty.state || '');
    setPincode(loyalty.pincode || '');
    setEmployeeId(loyalty.employee_id || '');
    setDesignation(loyalty.designation || '');
    setDepartment(loyalty.department || '');
    setJoiningDate(loyalty.joining_date || '');
    setSelectedBranchId(loyalty.branch_id || '');
    setIsActive(loyalty.is_active);
    setRemarks(loyalty.remarks || '');
    setDialogOpen(true);
  };

  const openBankAccounts = (loyalty: Loyalty) => {
    setSelectedLoyalty(loyalty);
    fetchBankAccounts(loyalty.id);
    setBankAccountsOpen(true);
  };

  const uploadDocument = async (file: File, docType: string, loyaltyId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${client!.id}/loyalties/${loyaltyId}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('customer-documents')
      .upload(fileName, file);
      
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        branch_id: selectedBranchId || null,
        loyalty_code: loyaltyCode,
        employee_id: employeeId.trim() || null,
        full_name: fullName.trim(),
        phone: phone.trim(),
        alternate_phone: alternatePhone.trim() || null,
        email: email.trim() || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        designation: designation.trim() || null,
        department: department.trim() || null,
        joining_date: joiningDate || null,
        is_active: isActive,
        remarks: remarks.trim() || null,
      };

      let loyaltyId: string;

      if (editingLoyalty) {
        const { error } = await supabase
          .from('loyalties')
          .update(data)
          .eq('id', editingLoyalty.id);
        if (error) throw error;
        loyaltyId = editingLoyalty.id;
      } else {
        const { data: insertData, error } = await supabase
          .from('loyalties')
          .insert(data)
          .select('id')
          .single();
        if (error) throw error;
        loyaltyId = insertData.id;
      }

      // Upload documents
      const docUpdates: Record<string, string> = {};
      if (photoFile) {
        docUpdates.photo_url = await uploadDocument(photoFile, 'photo', loyaltyId);
      }
      if (aadhaarFrontFile) {
        docUpdates.aadhaar_front_url = await uploadDocument(aadhaarFrontFile, 'aadhaar_front', loyaltyId);
      }
      if (aadhaarBackFile) {
        docUpdates.aadhaar_back_url = await uploadDocument(aadhaarBackFile, 'aadhaar_back', loyaltyId);
      }
      if (panCardFile) {
        docUpdates.pan_card_url = await uploadDocument(panCardFile, 'pan_card', loyaltyId);
      }

      if (Object.keys(docUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('loyalties')
          .update(docUpdates)
          .eq('id', loyaltyId);
        if (updateError) throw updateError;
      }

      toast.success(editingLoyalty ? 'Employee updated' : 'Employee created');
      setDialogOpen(false);
      resetForm();
      fetchLoyalties();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedLoyalty) return;

    setSubmitting(true);
    try {
      const data = {
        client_id: client.id,
        loyalty_id: selectedLoyalty.id,
        bank_id: selectedBankId,
        account_holder_name: accountHolderName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: accountIfsc.trim().toUpperCase() || null,
        account_type: accountType,
        credit_limit: accountCreditLimit ? parseFloat(accountCreditLimit) : null,
        interest_rate: accountInterestRate ? parseFloat(accountInterestRate) : null,
        is_primary: isPrimary,
        is_active: true,
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('loyalty_bank_accounts')
          .update(data)
          .eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_bank_accounts')
          .insert(data);
        if (error) throw error;
      }

      toast.success(editingAccount ? 'Account updated' : 'Account added');
      setAccountDialogOpen(false);
      resetAccountForm();
      fetchBankAccounts(selectedLoyalty.id);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: LoyaltyBankAccount) => {
    try {
      const { error } = await supabase
        .from('loyalty_bank_accounts')
        .delete()
        .eq('id', account.id);
      if (error) throw error;
      
      toast.success('Account deleted');
      if (selectedLoyalty) {
        fetchBankAccounts(selectedLoyalty.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleDelete = async () => {
    if (!loyaltyToDelete) return;

    try {
      const { error } = await supabase
        .from('loyalties')
        .delete()
        .eq('id', loyaltyToDelete.id);
      if (error) throw error;
      
      toast.success('Employee deleted');
      setDeleteDialogOpen(false);
      setLoyaltyToDelete(null);
      fetchLoyalties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const filteredLoyalties = loyalties.filter(l =>
    l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loyalty_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery) ||
    l.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview?: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setFile(file);
      if (setPreview) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Loyalties (Employees)</h1>
            <p className="text-muted-foreground">Manage company employees for repledge operations</p>
          </div>
          {canManage && (
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loyalties.length}</p>
                  <p className="text-xs text-muted-foreground">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loyalties.filter(l => l.is_active).length}</p>
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
                  placeholder="Search by name, code, phone..."
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoyalties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No employees found' : 'No employees added yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoyalties.map((loyalty) => (
                      <TableRow key={loyalty.id}>
                        <TableCell className="font-mono text-sm">{loyalty.loyalty_code}</TableCell>
                        <TableCell className="font-medium">{loyalty.full_name}</TableCell>
                        <TableCell>{loyalty.phone}</TableCell>
                        <TableCell>{loyalty.designation || '-'}</TableCell>
                        <TableCell>{loyalty.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={loyalty.is_active ? 'default' : 'secondary'}>
                            {loyalty.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => openBankAccounts(loyalty)}
                              title="Bank Accounts"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(loyalty)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive"
                                  onClick={() => { setLoyaltyToDelete(loyalty); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Employee Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLoyalty ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone">Alternate Phone</Label>
                      <Input
                        id="alternatePhone"
                        type="tel"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="employment" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isActive" className="font-normal">Active Employee</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setPhotoFile, setPhotoPreview)}
                      />
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>PAN Card</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setPanCardFile)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aadhaar Front</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setAadhaarFrontFile)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhaar Back</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setAadhaarBackFile)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingLoyalty ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bank Accounts Sheet */}
        <Sheet open={bankAccountsOpen} onOpenChange={setBankAccountsOpen}>
          <SheetContent className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Bank Accounts - {selectedLoyalty?.full_name}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {canManage && (
                <Button onClick={() => { resetAccountForm(); setAccountDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              )}

              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bank accounts linked yet
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{account.bank?.bank_name}</span>
                              {account.is_primary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              A/C: {account.account_number}
                            </p>
                            {account.ifsc_code && (
                              <p className="text-xs text-muted-foreground">
                                IFSC: {account.ifsc_code}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {account.account_type.toUpperCase()} • {account.account_holder_name}
                            </p>
                            {account.credit_limit && (
                              <p className="text-xs">
                                Credit Limit: ₹{account.credit_limit.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setEditingAccount(account);
                                  setSelectedBankId(account.bank_id);
                                  setAccountHolderName(account.account_holder_name);
                                  setAccountNumber(account.account_number);
                                  setAccountIfsc(account.ifsc_code || '');
                                  setAccountType(account.account_type);
                                  setAccountCreditLimit(account.credit_limit?.toString() || '');
                                  setAccountInterestRate(account.interest_rate?.toString() || '');
                                  setIsPrimary(account.is_primary);
                                  setAccountDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteAccount(account)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Add/Edit Bank Account Dialog */}
        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBankAccount} className="space-y-4">
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
                <Label>Account Holder Name *</Label>
                <Input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={accountIfsc}
                    onChange={(e) => setAccountIfsc(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
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
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isPrimary" className="font-normal">Primary Account</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credit Limit (₹)</Label>
                  <Input
                    type="number"
                    value={accountCreditLimit}
                    onChange={(e) => setAccountCreditLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={accountInterestRate}
                    onChange={(e) => setAccountInterestRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAccount ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{loyaltyToDelete?.full_name}"? This will also delete all linked bank accounts.
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
