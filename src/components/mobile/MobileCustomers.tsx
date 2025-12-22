import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Plus, User, MapPin, Mail } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard, MobileFormField } from './shared';
import { cn } from '@/lib/utils';
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
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filters = [
    { key: 'all', label: 'All', count: customers.length },
    { key: 'active', label: 'Active', count: customers.filter(c => c.is_active).length },
    { key: 'inactive', label: 'Inactive', count: customers.filter(c => !c.is_active).length },
  ];

  useEffect(() => {
    fetchCustomers();
  }, [profile?.client_id]);

  const fetchCustomers = async () => {
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
  };

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
      <MobileGradientHeader title="Customers" variant="minimal" />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Search and Filters */}
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, phone, code..."
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Customers List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No results found' : 'No customers yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
              </p>
              <button
                onClick={() => setShowAddSheet(true)}
                className="px-6 py-3 rounded-full gradient-gold text-white font-medium shadow-mobile-md tap-scale"
              >
                Add Customer
              </button>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MobileDataCard
                  title={customer.full_name}
                  subtitle={customer.customer_code}
                  icon={<User className="w-5 h-5 text-muted-foreground" />}
                  badge={{
                    label: customer.is_active ? 'Active' : 'Inactive',
                    variant: customer.is_active ? 'success' : 'default',
                  }}
                  onClick={() => setSelectedCustomer(customer)}
                  accentColor={customer.is_active ? 'gold' : 'default'}
                >
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{customer.city}</span>
                      </div>
                    )}
                  </div>
                </MobileDataCard>
              </div>
            ))
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-20" />
      </div>

      {/* FAB for new customer */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-full gradient-gold text-white shadow-lg flex items-center justify-center tap-scale z-40 animate-bounce-in shadow-glow"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Customer Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        snapPoints={['half', 'full']}
      >
        {selectedCustomer && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedCustomer.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_code}</p>
              </div>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/loans?customer=${selectedCustomer.id}`)}
                className="flex-1 py-3 rounded-xl gradient-gold text-white font-medium tap-scale"
              >
                View Loans
              </button>
              <button
                onClick={() => navigate(`/customers?id=${selectedCustomer.id}`)}
                className="flex-1 py-3 rounded-xl bg-muted font-medium tap-scale"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>

      {/* Add Customer Sheet */}
      <MobileBottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Add Customer"
        snapPoints={['full']}
      >
        <div className="p-4">
          <p className="text-center text-muted-foreground py-8">
            For full customer creation, please use the desktop version.
          </p>
          <button
            onClick={() => {
              setShowAddSheet(false);
              navigate('/customers');
            }}
            className="w-full py-3 rounded-xl gradient-gold text-white font-medium tap-scale"
          >
            Go to Full Form
          </button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
