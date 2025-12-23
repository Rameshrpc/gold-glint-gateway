import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, User, MapPin, Mail, Plus, FileText, Edit, Save, Calendar, Briefcase, IndianRupee, Users, Building2, CreditCard } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import LoadingButton from './LoadingButton';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard, MobileFormField, MobileTextareaField, MobileSelectField, MobileImageField } from './shared';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';

type NomineeRelation = 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | 
                       'brother' | 'sister' | 'grandfather' | 'grandmother' | 
                       'uncle' | 'aunt' | 'other';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active: boolean;
  created_at: string;
  gender?: string;
  occupation?: string;
  monthly_income?: number;
  nominee_name?: string;
  nominee_relation?: NomineeRelation;
  photo_url?: string;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_card_url?: string;
  branch_id: string;
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  is_active?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

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

interface FormData {
  full_name: string;
  phone: string;
  alternate_phone: string;
  email: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gender: string;
  occupation: string;
  monthly_income: string;
  nominee_name: string;
  nominee_relation: string;
  branch_id: string;
  photo_url: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_card_url: string | null;
}

const initialFormData: FormData = {
  full_name: '',
  phone: '',
  alternate_phone: '',
  email: '',
  date_of_birth: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gender: '',
  occupation: '',
  monthly_income: '',
  nominee_name: '',
  nominee_relation: '',
  branch_id: '',
  photo_url: null,
  aadhaar_front_url: null,
  aadhaar_back_url: null,
  pan_card_url: null,
};

export default function MobileCustomers() {
  const navigate = useNavigate();
  const { profile, currentBranch, branches } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Add/Edit state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filters = [
    { key: 'all', label: 'All', count: customers.length },
    { key: 'active', label: 'Active', count: customers.filter(c => c.is_active).length },
  ];

  const fetchCustomers = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    let filtered = [...customers];

    if (activeFilter === 'active') {
      filtered = filtered.filter(c => c.is_active);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.customer_code.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, activeFilter, searchQuery]);

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      branch_id: currentBranch?.id || '',
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const openAddSheet = () => {
    resetForm();
    setShowAddSheet(true);
    vibrateLight();
  };

  const openEditSheet = (customer: Customer) => {
    setFormData({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      alternate_phone: customer.alternate_phone || '',
      email: customer.email || '',
      date_of_birth: customer.date_of_birth || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gender: customer.gender || '',
      occupation: customer.occupation || '',
      monthly_income: customer.monthly_income?.toString() || '',
      nominee_name: customer.nominee_name || '',
      nominee_relation: customer.nominee_relation || '',
      branch_id: customer.branch_id || '',
      photo_url: customer.photo_url || null,
      aadhaar_front_url: customer.aadhaar_front_url || null,
      aadhaar_back_url: customer.aadhaar_back_url || null,
      pan_card_url: customer.pan_card_url || null,
    });
    setIsEditing(true);
    setSelectedCustomer(customer);
    setShowAddSheet(true);
    vibrateLight();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) errors.phone = 'Invalid phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.branch_id) errors.branch_id = 'Branch is required';
    
    // Mandatory KYC for new customers
    if (!isEditing) {
      if (!formData.photo_url) errors.photo_url = 'Profile photo is required';
      if (!formData.aadhaar_front_url) errors.aadhaar_front_url = 'Aadhaar front is required';
      if (!formData.aadhaar_back_url) errors.aadhaar_back_url = 'Aadhaar back is required';
      if (!formData.pan_card_url) errors.pan_card_url = 'PAN card is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !profile?.client_id) return;

    setIsSaving(true);
    try {
      if (isEditing && selectedCustomer) {
        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            alternate_phone: formData.alternate_phone || null,
            email: formData.email || null,
            date_of_birth: formData.date_of_birth || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            pincode: formData.pincode || null,
            gender: (formData.gender as 'male' | 'female' | 'other') || null,
            occupation: formData.occupation || null,
            monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
            nominee_name: formData.nominee_name || null,
            nominee_relation: (formData.nominee_relation as NomineeRelation) || null,
            branch_id: formData.branch_id,
            photo_url: formData.photo_url,
            aadhaar_front_url: formData.aadhaar_front_url,
            aadhaar_back_url: formData.aadhaar_back_url,
            pan_card_url: formData.pan_card_url,
          })
          .eq('id', selectedCustomer.id);

        if (error) throw error;
        vibrateSuccess();
        toast.success('Customer updated');
      } else {
        // Generate customer code using RPC
        const branch = branches?.find(b => b.id === formData.branch_id);
        const branchCode = branch?.branch_code || 'CUST';
        
        const { data: customerCode, error: codeError } = await supabase
          .rpc('generate_customer_code', { 
            p_client_id: profile.client_id, 
            p_branch_code: branchCode 
          });
        
        if (codeError) throw codeError;

        // Create customer
        const { error } = await supabase
          .from('customers')
          .insert([{
            client_id: profile.client_id,
            branch_id: formData.branch_id,
            customer_code: customerCode,
            full_name: formData.full_name,
            phone: formData.phone,
            alternate_phone: formData.alternate_phone || null,
            email: formData.email || null,
            date_of_birth: formData.date_of_birth || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            pincode: formData.pincode || null,
            gender: (formData.gender as 'male' | 'female' | 'other') || null,
            occupation: formData.occupation || null,
            monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
            nominee_name: formData.nominee_name || null,
            nominee_relation: (formData.nominee_relation as NomineeRelation) || null,
            photo_url: formData.photo_url,
            aadhaar_front_url: formData.aadhaar_front_url,
            aadhaar_back_url: formData.aadhaar_back_url,
            pan_card_url: formData.pan_card_url,
            is_active: true,
            created_by: profile.id,
          }]);

        if (error) throw error;
        vibrateSuccess();
        toast.success('Customer created');
      }

      setShowAddSheet(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  const closeSheet = () => {
    setShowAddSheet(false);
    setSelectedCustomer(null);
    resetForm();
  };

  const updateFormField = (field: keyof FormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const activeBranches = branches?.filter(b => b.is_active !== false) || [];

  return (
    <MobileLayout>
      <MobileSimpleHeader 
        title="Customers" 
        showAdd
        onAddClick={openAddSheet}
      />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Search and Filters */}
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search customers..."
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Customers List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                {searchQuery ? 'No results' : 'No customers'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search' : 'Add your first customer'}
              </p>
              <button
                onClick={openAddSheet}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Add Customer
              </button>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <MobileDataCard
                key={customer.id}
                title={customer.full_name}
                subtitle={customer.customer_code}
                icon={<User className="w-4 h-4 text-muted-foreground" />}
                badge={{
                  label: customer.is_active ? 'Active' : 'Inactive',
                  variant: customer.is_active ? 'success' : 'default',
                }}
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{customer.city}</span>
                    </div>
                  )}
                </div>
              </MobileDataCard>
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Customer Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedCustomer && !showAddSheet}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
      >
        {selectedCustomer && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedCustomer.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_code}</p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${selectedCustomer.phone}`} className="text-primary">{selectedCustomer.phone}</a>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  navigate(`/loans?customer=${selectedCustomer.id}`);
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                View Loans
              </button>
              <button
                onClick={() => openEditSheet(selectedCustomer)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>

      {/* Add/Edit Customer Sheet */}
      <MobileBottomSheet
        isOpen={showAddSheet}
        onClose={closeSheet}
        title={isEditing ? 'Edit Customer' : 'New Customer'}
        snapPoints={['full']}
        footer={
          <LoadingButton
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {isEditing ? 'Update Customer' : 'Create Customer'}
          </LoadingButton>
        }
      >
        <div className="p-4 space-y-6">
          {/* Section: Profile Photo & Branch */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <User className="w-4 h-4" />
              Profile & Branch
            </div>
            
            <MobileImageField
              label="Profile Photo"
              value={formData.photo_url}
              onChange={(url) => updateFormField('photo_url', url)}
              folder="photos"
              clientId={profile?.client_id || ''}
              required={!isEditing}
              error={formErrors.photo_url}
            />

            <MobileSelectField
              label="Branch"
              value={formData.branch_id}
              onChange={(value) => updateFormField('branch_id', value)}
              options={activeBranches.map(b => ({ value: b.id, label: b.branch_name }))}
              placeholder="Select branch"
              error={formErrors.branch_id}
            />
          </div>

          {/* Section: Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <User className="w-4 h-4" />
              Personal Details
            </div>

            <MobileFormField
              label="Full Name"
              placeholder="Enter customer name"
              value={formData.full_name}
              onChange={(e) => updateFormField('full_name', e.target.value)}
              error={formErrors.full_name}
              icon={<User className="w-4 h-4" />}
              required
            />

            <MobileFormField
              label="Phone"
              placeholder="10-digit mobile number"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormField('phone', e.target.value)}
              error={formErrors.phone}
              icon={<Phone className="w-4 h-4" />}
              required
            />

            <MobileFormField
              label="Alternate Phone"
              placeholder="Alternate mobile number"
              type="tel"
              value={formData.alternate_phone}
              onChange={(e) => updateFormField('alternate_phone', e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />

            <MobileFormField
              label="Email"
              placeholder="email@example.com"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormField('email', e.target.value)}
              error={formErrors.email}
              icon={<Mail className="w-4 h-4" />}
            />

            <MobileFormField
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => updateFormField('date_of_birth', e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />

            <MobileSelectField
              label="Gender"
              value={formData.gender}
              onChange={(value) => updateFormField('gender', value)}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />

            <MobileFormField
              label="Occupation"
              placeholder="Enter occupation"
              value={formData.occupation}
              onChange={(e) => updateFormField('occupation', e.target.value)}
              icon={<Briefcase className="w-4 h-4" />}
            />

            <MobileFormField
              label="Monthly Income"
              placeholder="Enter monthly income"
              type="number"
              value={formData.monthly_income}
              onChange={(e) => updateFormField('monthly_income', e.target.value)}
              icon={<IndianRupee className="w-4 h-4" />}
            />
          </div>

          {/* Section: Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <MapPin className="w-4 h-4" />
              Address
            </div>

            <MobileTextareaField
              label="Address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={(e) => updateFormField('address', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <MobileFormField
                label="City"
                placeholder="City"
                value={formData.city}
                onChange={(e) => updateFormField('city', e.target.value)}
              />
              <MobileFormField
                label="State"
                placeholder="State"
                value={formData.state}
                onChange={(e) => updateFormField('state', e.target.value)}
              />
            </div>

            <MobileFormField
              label="Pincode"
              placeholder="6-digit pincode"
              type="text"
              value={formData.pincode}
              onChange={(e) => updateFormField('pincode', e.target.value)}
            />
          </div>

          {/* Section: KYC Documents */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <CreditCard className="w-4 h-4" />
              KYC Documents
            </div>

            <MobileImageField
              label="Aadhaar Card (Front)"
              value={formData.aadhaar_front_url}
              onChange={(url) => updateFormField('aadhaar_front_url', url)}
              folder="aadhaar_front"
              clientId={profile?.client_id || ''}
              required={!isEditing}
              error={formErrors.aadhaar_front_url}
            />

            <MobileImageField
              label="Aadhaar Card (Back)"
              value={formData.aadhaar_back_url}
              onChange={(url) => updateFormField('aadhaar_back_url', url)}
              folder="aadhaar_back"
              clientId={profile?.client_id || ''}
              required={!isEditing}
              error={formErrors.aadhaar_back_url}
            />

            <MobileImageField
              label="PAN Card"
              value={formData.pan_card_url}
              onChange={(url) => updateFormField('pan_card_url', url)}
              folder="pan_card"
              clientId={profile?.client_id || ''}
              required={!isEditing}
              error={formErrors.pan_card_url}
            />
          </div>

          {/* Section: Nominee Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="w-4 h-4" />
              Nominee Details
            </div>

            <MobileFormField
              label="Nominee Name"
              placeholder="Enter nominee name"
              value={formData.nominee_name}
              onChange={(e) => updateFormField('nominee_name', e.target.value)}
              icon={<User className="w-4 h-4" />}
            />

            <MobileSelectField
              label="Nominee Relation"
              value={formData.nominee_relation}
              onChange={(value) => updateFormField('nominee_relation', value)}
              options={NOMINEE_RELATIONS.map(r => ({ value: r.value, label: r.label }))}
              placeholder="Select relation"
            />
          </div>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
