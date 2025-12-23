import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, User, MapPin } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard } from './shared';
import { toast } from 'sonner';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  is_active: boolean;
  created_at: string;
}

export default function MobileCustomers() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filters = [
    { key: 'all', label: 'All', count: customers.length },
    { key: 'active', label: 'Active', count: customers.filter(c => c.is_active).length },
    { key: 'inactive', label: 'Inactive', count: customers.filter(c => !c.is_active).length },
  ];

  const fetchCustomers = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_code, full_name, phone, email, address, city, is_active, created_at')
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
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(c => !c.is_active);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.customer_code.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, activeFilter, searchQuery]);

  return (
    <MobileLayout>
      <MobileSimpleHeader 
        title="Customers" 
        showAdd
        onAddClick={() => navigate('/customers?action=new')}
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
                onClick={() => navigate('/customers?action=new')}
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
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
      >
        {selectedCustomer && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedCustomer.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_code}</p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 text-muted-foreground">@</span>
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  navigate(`/loans?customer=${selectedCustomer.id}`);
                }}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                View Loans
              </button>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  navigate(`/customers?id=${selectedCustomer.id}`);
                }}
                className="flex-1 py-2.5 rounded-lg bg-muted text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
