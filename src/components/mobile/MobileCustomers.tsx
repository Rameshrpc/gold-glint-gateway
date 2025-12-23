import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, User, MapPin, Mail, Plus, FileText, Edit, Save } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import LoadingButton from './LoadingButton';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard, MobileFormField, MobileTextareaField, MobileSelectField } from './shared';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active: boolean;
  created_at: string;
  gender?: string;
  occupation?: string;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function MobileCustomers() {
  const navigate = useNavigate();
  const { profile, currentBranch } = useAuth();
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
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gender: '',
    occupation: '',
  });
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
        .select('id, customer_code, full_name, phone, email, address, city, state, pincode, is_active, created_at, gender, occupation')
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
      full_name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gender: '',
      occupation: '',
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
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gender: customer.gender || '',
      occupation: customer.occupation || '',
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !profile?.client_id || !currentBranch?.id) return;

    setIsSaving(true);
    try {
      if (isEditing && selectedCustomer) {
        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            pincode: formData.pincode || null,
            gender: (formData.gender as 'male' | 'female' | 'other') || null,
            occupation: formData.occupation || null,
          })
          .eq('id', selectedCustomer.id);

        if (error) throw error;
        vibrateSuccess();
        toast.success('Customer updated');
      } else {
        // Generate customer code
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 4).toUpperCase();
        const customerCode = `C${timestamp}${random}`;

        // Create customer
        const { error } = await supabase
          .from('customers')
          .insert([{
            client_id: profile.client_id,
            branch_id: currentBranch.id,
            customer_code: customerCode,
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            pincode: formData.pincode || null,
            gender: (formData.gender as 'male' | 'female' | 'other') || null,
            occupation: formData.occupation || null,
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
      >
        <div className="p-4 space-y-4 pb-32">
          <MobileFormField
            label="Full Name *"
            placeholder="Enter customer name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={formErrors.full_name}
            icon={<User className="w-4 h-4" />}
          />

          <MobileFormField
            label="Phone *"
            placeholder="10-digit mobile number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            icon={<Phone className="w-4 h-4" />}
          />

          <MobileFormField
            label="Email"
            placeholder="email@example.com"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <MobileSelectField
            label="Gender"
            value={formData.gender}
            onChange={(value) => setFormData({ ...formData, gender: value })}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />

          <MobileFormField
            label="Occupation"
            placeholder="Enter occupation"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          />

          <MobileTextareaField
            label="Address"
            placeholder="Enter full address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="City"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <MobileFormField
              label="State"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <MobileFormField
            label="Pincode"
            placeholder="6-digit pincode"
            type="text"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
        </div>

        {/* Fixed bottom action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
          <LoadingButton
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {isEditing ? 'Update Customer' : 'Create Customer'}
          </LoadingButton>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
