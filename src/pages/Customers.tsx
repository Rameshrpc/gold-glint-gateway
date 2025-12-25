import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Search, Edit, Eye, Phone, Mail, Camera, X, FileCheck, User, Trash2, Download, Database, Loader2 } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getSignedUrl } from '@/lib/storage';

type NomineeRelation = 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | 
                       'brother' | 'sister' | 'grandfather' | 'grandmother' | 
                       'uncle' | 'aunt' | 'other';

interface Customer {
  id: string;
  customer_code: string;
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
  photo_url: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_card_url: string | null;
  nominee_name: string | null;
  nominee_relation: NomineeRelation | null;
  occupation: string | null;
  monthly_income: number | null;
  is_active: boolean;
  branch_id: string;
  client_id: string;
  created_at: string;
}

const NOMINEE_RELATIONS: { value: NomineeRelation; label: string }[] = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'other', label: 'Other' },
];

const MOCK_CUSTOMERS = [
  { full_name: 'Rajesh Kumar', gender: 'male', city: 'Mumbai', state: 'Maharashtra', occupation: 'Business Owner', monthly_income: 75000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Priya Sharma', gender: 'female', city: 'Delhi', state: 'Delhi', occupation: 'Software Engineer', monthly_income: 120000, nominee_relation: 'father' as NomineeRelation },
  { full_name: 'Amit Patel', gender: 'male', city: 'Ahmedabad', state: 'Gujarat', occupation: 'Shop Owner', monthly_income: 45000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Sunita Devi', gender: 'female', city: 'Jaipur', state: 'Rajasthan', occupation: 'Teacher', monthly_income: 35000, nominee_relation: 'son' as NomineeRelation },
  { full_name: 'Vikram Singh', gender: 'male', city: 'Lucknow', state: 'Uttar Pradesh', occupation: 'Government Employee', monthly_income: 55000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Meera Krishnan', gender: 'female', city: 'Chennai', state: 'Tamil Nadu', occupation: 'Doctor', monthly_income: 150000, nominee_relation: 'father' as NomineeRelation },
  { full_name: 'Suresh Reddy', gender: 'male', city: 'Hyderabad', state: 'Telangana', occupation: 'Farmer', monthly_income: 30000, nominee_relation: 'son' as NomineeRelation },
  { full_name: 'Anjali Gupta', gender: 'female', city: 'Kolkata', state: 'West Bengal', occupation: 'Accountant', monthly_income: 60000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Mohan Das', gender: 'male', city: 'Bangalore', state: 'Karnataka', occupation: 'IT Professional', monthly_income: 100000, nominee_relation: 'mother' as NomineeRelation },
  { full_name: 'Lakshmi Nair', gender: 'female', city: 'Kochi', state: 'Kerala', occupation: 'Nurse', monthly_income: 40000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Ramesh Yadav', gender: 'male', city: 'Patna', state: 'Bihar', occupation: 'Contractor', monthly_income: 80000, nominee_relation: 'brother' as NomineeRelation },
  { full_name: 'Kavita Joshi', gender: 'female', city: 'Pune', state: 'Maharashtra', occupation: 'Lawyer', monthly_income: 90000, nominee_relation: 'father' as NomineeRelation },
  { full_name: 'Arun Menon', gender: 'male', city: 'Trivandrum', state: 'Kerala', occupation: 'Architect', monthly_income: 85000, nominee_relation: 'spouse' as NomineeRelation },
  { full_name: 'Deepa Chatterjee', gender: 'female', city: 'Bhopal', state: 'Madhya Pradesh', occupation: 'Shopkeeper', monthly_income: 25000, nominee_relation: 'son' as NomineeRelation },
  { full_name: 'Sanjay Verma', gender: 'male', city: 'Indore', state: 'Madhya Pradesh', occupation: 'Restaurant Owner', monthly_income: 70000, nominee_relation: 'spouse' as NomineeRelation },
];

export default function Customers() {
  const { client, currentBranch, branches, isPlatformAdmin, hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingMockData, setLoadingMockData] = useState(false);
  
  // Form state
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
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // File upload state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null);

  // Signed URLs for viewing customer documents
  const [viewSignedUrls, setViewSignedUrls] = useState<{
    photo: string | null;
    aadhaarFront: string | null;
    aadhaarBack: string | null;
    panCard: string | null;
  }>({ photo: null, aadhaarFront: null, aadhaarBack: null, panCard: null });
  const [loadingSignedUrls, setLoadingSignedUrls] = useState(false);

  // Customer photo signed URLs cache for table display
  const [photoSignedUrls, setPhotoSignedUrls] = useState<Record<string, string>>({});


  const canManageCustomers = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager') || hasRole('loan_officer') || hasRole('appraiser');

  useEffect(() => {
    fetchCustomers();
  }, [client]);

  const fetchCustomers = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers((data as Customer[]) || []);
    } catch (error: any) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
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
    setOccupation('');
    setMonthlyIncome('');
    setSelectedBranchId(currentBranch?.id || '');
    setNomineeName('');
    setNomineeRelation('');
    setEditingCustomer(null);
    setUploadProgress(null);
    // Reset file states
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
    setAadhaarFrontFile(null);
    setAadhaarFrontPreview(null);
    setAadhaarBackFile(null);
    setAadhaarBackPreview(null);
    setPanCardFile(null);
    setPanCardPreview(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = async (customer: Customer) => {
    setEditingCustomer(customer);
    setFullName(customer.full_name);
    setPhone(customer.phone);
    setAlternatePhone(customer.alternate_phone || '');
    setEmail(customer.email || '');
    setDateOfBirth(customer.date_of_birth || '');
    setGender(customer.gender || '');
    setAddress(customer.address || '');
    setCity(customer.city || '');
    setState(customer.state || '');
    setPincode(customer.pincode || '');
    setOccupation(customer.occupation || '');
    setMonthlyIncome(customer.monthly_income?.toString() || '');
    setSelectedBranchId(customer.branch_id);
    setNomineeName(customer.nominee_name || '');
    setNomineeRelation(customer.nominee_relation || '');
    
    // Clear file selections
    setProfilePhotoFile(null);
    setAadhaarFrontFile(null);
    setAadhaarBackFile(null);
    setPanCardFile(null);
    
    // Clear previews first
    setProfilePhotoPreview(null);
    setAadhaarFrontPreview(null);
    setAadhaarBackPreview(null);
    setPanCardPreview(null);
    
    setDialogOpen(true);
    
    // Load signed URLs for existing images
    const [photoUrl, aadhaarFrontUrl, aadhaarBackUrl, panCardUrl] = await Promise.all([
      getSignedUrl('customer-documents', customer.photo_url),
      getSignedUrl('customer-documents', customer.aadhaar_front_url),
      getSignedUrl('customer-documents', customer.aadhaar_back_url),
      getSignedUrl('customer-documents', customer.pan_card_url),
    ]);
    
    setProfilePhotoPreview(photoUrl);
    setAadhaarFrontPreview(aadhaarFrontUrl);
    setAadhaarBackPreview(aadhaarBackUrl);
    setPanCardPreview(panCardUrl);
  };

  const handleFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('Only JPEG and PNG images are allowed');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadDocument = async (file: File, documentType: string, customerId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${client!.id}/${customerId}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    // Return just the path, not the public URL (for signed URL access)
    return fileName;
  };

  const generateCustomerCode = async (): Promise<string> => {
    const branch = branches.find(b => b.id === selectedBranchId);
    const branchCode = branch?.branch_code || 'CUST';
    
    const { data, error } = await supabase.rpc('generate_customer_code', {
      p_client_id: client!.id,
      p_branch_code: branchCode
    });
    
    if (error) throw error;
    return data;
  };

  // Parallel document upload function
  const uploadDocumentsInParallel = async (customerId: string): Promise<Record<string, string>> => {
    const uploadTasks: { key: string; promise: Promise<string> }[] = [];

    if (profilePhotoFile) {
      uploadTasks.push({ 
        key: 'photo_url', 
        promise: uploadDocument(profilePhotoFile, 'profile', customerId) 
      });
    }
    if (aadhaarFrontFile) {
      uploadTasks.push({ 
        key: 'aadhaar_front_url', 
        promise: uploadDocument(aadhaarFrontFile, 'aadhaar_front', customerId) 
      });
    }
    if (aadhaarBackFile) {
      uploadTasks.push({ 
        key: 'aadhaar_back_url', 
        promise: uploadDocument(aadhaarBackFile, 'aadhaar_back', customerId) 
      });
    }
    if (panCardFile) {
      uploadTasks.push({ 
        key: 'pan_card_url', 
        promise: uploadDocument(panCardFile, 'pan_card', customerId) 
      });
    }

    if (uploadTasks.length === 0) return {};

    setUploadProgress(`Uploading ${uploadTasks.length} document(s)...`);
    
    const results = await Promise.all(
      uploadTasks.map(async (task) => {
        const url = await task.promise;
        return { [task.key]: url };
      })
    );

    return Object.assign({}, ...results);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }

    // Validate all mandatory fields
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!dateOfBirth) {
      toast.error('Date of birth is required');
      return;
    }
    if (!gender) {
      toast.error('Gender is required');
      return;
    }
    if (!occupation.trim()) {
      toast.error('Occupation is required');
      return;
    }
    if (!monthlyIncome) {
      toast.error('Monthly income is required');
      return;
    }
    if (!address.trim()) {
      toast.error('Street address is required');
      return;
    }
    if (!city.trim()) {
      toast.error('City is required');
      return;
    }
    if (!state.trim()) {
      toast.error('State is required');
      return;
    }
    if (!pincode.trim()) {
      toast.error('Pincode is required');
      return;
    }
    if (!nomineeName.trim()) {
      toast.error('Nominee name is required');
      return;
    }
    if (!nomineeRelation) {
      toast.error('Nominee relation is required');
      return;
    }

    // Validate mandatory documents for new customers
    if (!editingCustomer) {
      if (!profilePhotoFile) {
        toast.error('Profile photo is required');
        return;
      }
      if (!aadhaarFrontFile) {
        toast.error('Aadhaar front image is required');
        return;
      }
      if (!aadhaarBackFile) {
        toast.error('Aadhaar back image is required');
        return;
      }
      if (!panCardFile) {
        toast.error('PAN card image is required');
        return;
      }
    }

    setSubmitting(true);
    try {
      let customerCode = editingCustomer?.customer_code;
      
      // Generate customer code for new customers
      if (!editingCustomer) {
        customerCode = await generateCustomerCode();
      }

      const customerData: any = {
        client_id: client.id,
        branch_id: selectedBranchId,
        customer_code: customerCode,
        full_name: fullName.trim(),
        phone: phone.trim(),
        alternate_phone: alternatePhone.trim() || null,
        email: email.trim() || null,
        date_of_birth: dateOfBirth || null,
        gender: gender as any || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        occupation: occupation.trim() || null,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
        nominee_name: nomineeName.trim() || null,
        nominee_relation: nomineeRelation as NomineeRelation || null,
      };

      let customerId: string;

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);
        if (error) throw error;
        customerId = editingCustomer.id;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert(customerData)
          .select('id')
          .single();
        if (error) throw error;
        customerId = data.id;
      }

      // Upload documents in parallel
      const documentUpdates = await uploadDocumentsInParallel(customerId);

      // Update customer with document URLs if any were uploaded
      if (Object.keys(documentUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(documentUpdates)
          .eq('id', customerId);
        if (updateError) throw updateError;
      }

      toast.success(editingCustomer ? 'Customer updated successfully' : 'Customer created successfully');
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Customer code already exists. Please try again.');
      } else {
        toast.error(error.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  // Delete customer function
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    setDeleting(true);
    try {
      // Check for active loans
      const { count, error: loanError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerToDelete.id)
        .eq('status', 'active');
      
      if (loanError) throw loanError;
      
      if (count && count > 0) {
        toast.error(`Cannot delete customer with ${count} active loan(s). Please close loans first.`);
        return;
      }

      // Delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);
      
      if (error) throw error;
      
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // Export to CSV function
  const exportToCSV = (exportType: 'all' | 'active' | 'filtered') => {
    let dataToExport: Customer[] = [];
    
    switch (exportType) {
      case 'all':
        dataToExport = customers;
        break;
      case 'active':
        dataToExport = customers.filter(c => c.is_active);
        break;
      case 'filtered':
        dataToExport = filteredCustomers;
        break;
    }

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Customer Code', 'Full Name', 'Phone', 'Alternate Phone', 'Email',
      'Date of Birth', 'Gender', 'Address', 'City', 'State', 'Pincode',
      'Occupation', 'Monthly Income', 'Nominee Name', 'Nominee Relation',
      'Branch', 'Status', 'Created At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(c => [
        c.customer_code,
        `"${c.full_name}"`,
        c.phone,
        c.alternate_phone || '',
        c.email || '',
        c.date_of_birth || '',
        c.gender || '',
        `"${(c.address || '').replace(/"/g, '""')}"`,
        c.city || '',
        c.state || '',
        c.pincode || '',
        c.occupation || '',
        c.monthly_income || '',
        c.nominee_name || '',
        c.nominee_relation || '',
        getBranchName(c.branch_id),
        c.is_active ? 'Active' : 'Inactive',
        new Date(c.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} customer(s)`);
  };

  // Load mock data function
  const loadMockData = async () => {
    if (!client || !currentBranch) {
      toast.error('Please select a branch first');
      return;
    }

    setLoadingMockData(true);
    try {
      for (const sample of MOCK_CUSTOMERS) {
        const customerCode = await generateCustomerCode();
        const mockPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
        
        const customerData = {
          client_id: client.id,
          branch_id: currentBranch.id,
          customer_code: customerCode,
          full_name: sample.full_name,
          phone: mockPhone,
          gender: sample.gender as any,
          city: sample.city,
          state: sample.state,
          occupation: sample.occupation,
          monthly_income: sample.monthly_income,
          nominee_name: `${sample.full_name.split(' ')[0]}'s ${sample.nominee_relation === 'spouse' ? 'Partner' : sample.nominee_relation}`,
          nominee_relation: sample.nominee_relation,
          is_active: true
        };
        
        const { error } = await supabase.from('customers').insert(customerData);
        if (error) throw error;
      }
      
      toast.success(`Created ${MOCK_CUSTOMERS.length} test customers`);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to load mock data');
    } finally {
      setLoadingMockData(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.branch_name || 'Unknown';
  };

  // Load signed URLs for a customer when viewing
  const loadCustomerSignedUrls = useCallback(async (customer: Customer) => {
    setLoadingSignedUrls(true);
    setViewSignedUrls({ photo: null, aadhaarFront: null, aadhaarBack: null, panCard: null });
    
    try {
      const [photo, aadhaarFront, aadhaarBack, panCard] = await Promise.all([
        getSignedUrl('customer-documents', customer.photo_url),
        getSignedUrl('customer-documents', customer.aadhaar_front_url),
        getSignedUrl('customer-documents', customer.aadhaar_back_url),
        getSignedUrl('customer-documents', customer.pan_card_url),
      ]);
      
      setViewSignedUrls({ photo, aadhaarFront, aadhaarBack, panCard });
    } catch (error) {
      console.error('Error loading signed URLs:', error);
    } finally {
      setLoadingSignedUrls(false);
    }
  }, []);

  // Load signed URL for a customer's profile photo (for table display)
  const loadPhotoSignedUrl = useCallback(async (customerId: string, photoPath: string | null) => {
    if (!photoPath || photoSignedUrls[customerId]) return;
    
    const signedUrl = await getSignedUrl('customer-documents', photoPath);
    if (signedUrl) {
      setPhotoSignedUrls(prev => ({ ...prev, [customerId]: signedUrl }));
    }
  }, [photoSignedUrls]);

  // Load photo URLs when customers change
  useEffect(() => {
    customers.forEach(customer => {
      if (customer.photo_url && !photoSignedUrls[customer.id]) {
        loadPhotoSignedUrl(customer.id, customer.photo_url);
      }
    });
  }, [customers, loadPhotoSignedUrl, photoSignedUrls]);

  // Load signed URLs when opening view dialog
  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setViewDialogOpen(true);
    loadCustomerSignedUrls(customer);
  };

  const clearFilePreview = (
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    setFile(null);
    setPreview(null);
  };

  // Camera modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [activeCameraField, setActiveCameraField] = useState<'profile' | 'aadhaarFront' | 'aadhaarBack' | 'panCard' | null>(null);

  const openCameraFor = (field: 'profile' | 'aadhaarFront' | 'aadhaarBack' | 'panCard') => {
    setActiveCameraField(field);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File, preview: string) => {
    switch (activeCameraField) {
      case 'profile':
        setProfilePhotoFile(file);
        setProfilePhotoPreview(preview);
        break;
      case 'aadhaarFront':
        setAadhaarFrontFile(file);
        setAadhaarFrontPreview(preview);
        break;
      case 'aadhaarBack':
        setAadhaarBackFile(file);
        setAadhaarBackPreview(preview);
        break;
      case 'panCard':
        setPanCardFile(file);
        setPanCardPreview(preview);
        break;
    }
    setCameraOpen(false);
    setActiveCameraField(null);
  };

  const getCameraLabel = () => {
    switch (activeCameraField) {
      case 'profile': return 'Profile Photo';
      case 'aadhaarFront': return 'Aadhaar Front';
      case 'aadhaarBack': return 'Aadhaar Back';
      case 'panCard': return 'PAN Card';
      default: return 'Photo';
    }
  };

  const ImageUploadField = ({
    label,
    required,
    cameraField,
    preview,
    setFile,
    setPreview,
    existingUrl
  }: {
    label: string;
    required?: boolean;
    cameraField: 'profile' | 'aadhaarFront' | 'aadhaarBack' | 'panCard';
    preview: string | null;
    setFile: (f: File | null) => void;
    setPreview: (p: string | null) => void;
    existingUrl?: string | null;
  }) => {
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
          {preview || existingUrl ? (
            <div className="relative">
              <img
                src={preview || existingUrl || ''}
                alt={label}
                className="max-h-32 mx-auto rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0 h-6 w-6"
                onClick={() => clearFilePreview(setFile, setPreview)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCameraFor(cameraField)}
              >
                <Camera className="h-4 w-4 mr-1" />
                Capture
              </Button>
              <p className="text-xs text-muted-foreground">Camera capture with timestamp</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToCSV('all')}>
                  Export All ({customers.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV('active')}>
                  Export Active Only ({customers.filter(c => c.is_active).length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV('filtered')}>
                  Export Current Filter ({filteredCustomers.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canManageCustomers && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddDialog} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo & Branch Selection */}
                    <div className="flex gap-6 items-start">
                      <div className="flex-shrink-0">
                        <ImageUploadField
                          label="Profile Photo"
                          required={!editingCustomer}
                          cameraField="profile"
                          setFile={setProfilePhotoFile}
                          preview={profilePhotoPreview}
                          setPreview={setProfilePhotoPreview}
                          existingUrl={editingCustomer?.photo_url}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        {editingCustomer && (
                          <div className="space-y-2">
                            <Label>Customer Code</Label>
                            <Input value={editingCustomer.customer_code} disabled className="bg-muted" />
                          </div>
                        )}
                        {!editingCustomer && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <FileCheck className="h-4 w-4 inline mr-1" />
                              Customer code will be auto-generated on save
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="branch">Branch *</Label>
                          <Select value={selectedBranchId} onValueChange={setSelectedBranchId} required>
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
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Details</h3>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter full name"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alternatePhone">Alternate Phone</Label>
                          <Input
                            id="alternatePhone"
                            value={alternatePhone}
                            onChange={(e) => setAlternatePhone(e.target.value)}
                            placeholder="Enter alternate phone"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender *</Label>
                          <Select value={gender} onValueChange={setGender} required>
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
                        <div className="space-y-2">
                          <Label htmlFor="occupation">Occupation *</Label>
                          <Input
                            id="occupation"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            placeholder="Enter occupation"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthlyIncome">Monthly Income (₹) *</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(e.target.value)}
                          placeholder="Enter monthly income"
                          required
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Address</h3>
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address *</Label>
                        <Textarea
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter full address"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="State"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="Pincode"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* KYC Documents */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        KYC Documents {!editingCustomer && <span className="text-destructive">(All Mandatory)</span>}
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <ImageUploadField
                          label="Aadhaar Front"
                          required={!editingCustomer}
                          cameraField="aadhaarFront"
                          setFile={setAadhaarFrontFile}
                          preview={aadhaarFrontPreview}
                          setPreview={setAadhaarFrontPreview}
                          existingUrl={editingCustomer?.aadhaar_front_url}
                        />
                        <ImageUploadField
                          label="Aadhaar Back"
                          required={!editingCustomer}
                          cameraField="aadhaarBack"
                          setFile={setAadhaarBackFile}
                          preview={aadhaarBackPreview}
                          setPreview={setAadhaarBackPreview}
                          existingUrl={editingCustomer?.aadhaar_back_url}
                        />
                        <ImageUploadField
                          label="PAN Card"
                          required={!editingCustomer}
                          cameraField="panCard"
                          setFile={setPanCardFile}
                          preview={panCardPreview}
                          setPreview={setPanCardPreview}
                          existingUrl={editingCustomer?.pan_card_url}
                        />
                      </div>
                    </div>

                    {/* Nominee Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Nominee Details <span className="text-destructive">(Mandatory)</span></h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomineeRelation">Nominee Relation *</Label>
                          <Select value={nomineeRelation} onValueChange={setNomineeRelation} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relation" />
                            </SelectTrigger>
                            <SelectContent>
                              {NOMINEE_RELATIONS.map((rel) => (
                                <SelectItem key={rel.value} value={rel.value}>
                                  {rel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nomineeName">Nominee Name *</Label>
                          <Input
                            id="nomineeName"
                            value={nomineeName}
                            onChange={(e) => setNomineeName(e.target.value)}
                            placeholder="Enter nominee name"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {uploadProgress && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-primary">{uploadProgress}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No Customers Found' : 'No Customers Yet'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms.'
                  : 'Start building your customer database. Add your first customer to begin creating loans.'}
              </p>
              <div className="flex gap-2">
                {!searchQuery && canManageCustomers && (
                  <>
                    <Button onClick={openAddDialog} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Customer
                    </Button>
                    <Button variant="outline" onClick={loadMockData} disabled={loadingMockData}>
                      <Database className="h-4 w-4 mr-2" />
                      {loadingMockData ? 'Loading...' : 'Load Test Data'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Nominee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        {customer.photo_url ? (
                          photoSignedUrls[customer.id] ? (
                            <img
                              src={photoSignedUrls[customer.id]}
                              alt={customer.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{customer.customer_code}</TableCell>
                      <TableCell>{customer.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" /> {customer.phone}
                          </span>
                          {customer.email && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" /> {customer.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getBranchName(customer.branch_id)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={customer.aadhaar_front_url && customer.aadhaar_back_url ? 'default' : 'secondary'} className="text-xs">
                            Aadhaar
                          </Badge>
                          <Badge variant={customer.pan_card_url ? 'default' : 'secondary'} className="text-xs">
                            PAN
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.nominee_name ? (
                          <span className="text-sm">
                            {customer.nominee_relation && (
                              <span className="capitalize">{customer.nominee_relation}: </span>
                            )}
                            {customer.nominee_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageCustomers && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* View Customer Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {viewingCustomer && (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex gap-4 items-start">
                  {viewingCustomer.photo_url ? (
                    loadingSignedUrls ? (
                      <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : viewSignedUrls.photo ? (
                      <img
                        src={viewSignedUrls.photo}
                        alt={viewingCustomer.full_name}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold">{viewingCustomer.full_name}</p>
                    <p className="text-sm text-muted-foreground">{viewingCustomer.customer_code}</p>
                    <Badge variant={viewingCustomer.is_active ? 'default' : 'secondary'} className="mt-2">
                      {viewingCustomer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingCustomer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Alternate Phone</Label>
                    <p className="font-medium">{viewingCustomer.alternate_phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewingCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{viewingCustomer.date_of_birth || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{viewingCustomer.gender || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Branch</Label>
                    <p className="font-medium">{getBranchName(viewingCustomer.branch_id)}</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">
                    {[viewingCustomer.address, viewingCustomer.city, viewingCustomer.state, viewingCustomer.pincode]
                      .filter(Boolean).join(', ') || '-'}
                  </p>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Occupation</Label>
                    <p className="font-medium">{viewingCustomer.occupation || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Monthly Income</Label>
                    <p className="font-medium">
                      {viewingCustomer.monthly_income ? `₹${viewingCustomer.monthly_income.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>

                {/* Nominee Details */}
                <div>
                  <Label className="text-muted-foreground">Nominee</Label>
                  <p className="font-medium">
                    {viewingCustomer.nominee_name ? (
                      <>
                        {viewingCustomer.nominee_relation && (
                          <span className="capitalize">{viewingCustomer.nominee_relation}: </span>
                        )}
                        {viewingCustomer.nominee_name}
                      </>
                    ) : '-'}
                  </p>
                </div>

                {/* KYC Documents */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground">KYC Documents</Label>
                  {loadingSignedUrls ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Aadhaar Front</p>
                        {viewSignedUrls.aadhaarFront ? (
                          <img
                            src={viewSignedUrls.aadhaarFront}
                            alt="Aadhaar Front"
                            className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                            onClick={() => window.open(viewSignedUrls.aadhaarFront!, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Not uploaded</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Aadhaar Back</p>
                        {viewSignedUrls.aadhaarBack ? (
                          <img
                            src={viewSignedUrls.aadhaarBack}
                            alt="Aadhaar Back"
                            className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                            onClick={() => window.open(viewSignedUrls.aadhaarBack!, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Not uploaded</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">PAN Card</p>
                        {viewSignedUrls.panCard ? (
                          <img
                            src={viewSignedUrls.panCard}
                            alt="PAN Card"
                            className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                            onClick={() => window.open(viewSignedUrls.panCard!, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Not uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{customerToDelete?.full_name}</strong> ({customerToDelete?.customer_code})?
                This action cannot be undone. Customers with active loans cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Camera Capture Dialog */}
        <CameraCapture
          open={cameraOpen}
          onClose={() => {
            setCameraOpen(false);
            setActiveCameraField(null);
          }}
          onCapture={handleCameraCapture}
          label={getCameraLabel()}
        />
      </div>
    </DashboardLayout>
  );
}
