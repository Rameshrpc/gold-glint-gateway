import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileHeader from './MobileHeader';
import LoanCard from './LoanCard';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'active' | 'closed' | 'overdue';

interface Loan {
  id: string;
  loan_number: string;
  principal_amount: number;
  status: string;
  loan_date: string;
  maturity_date: string;
  interest_rate: number;
  customer?: {
    full_name: string;
    phone: string;
  };
  gold_items?: Array<{
    net_weight_grams: number;
  }>;
}

export default function MobileLoans() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [showSearch, setShowSearch] = useState(false);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    const fetchLoans = async () => {
      if (!profile?.client_id) return;

      try {
        const { data, error } = await supabase
          .from('loans')
          .select(`
            id,
            loan_number,
            principal_amount,
            status,
            loan_date,
            maturity_date,
            interest_rate,
            customer:customers(full_name, phone),
            gold_items(net_weight_grams)
          `)
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setLoans(data || []);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [profile?.client_id]);

  useEffect(() => {
    let filtered = [...loans];

    // Apply status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(l => l.status === 'active');
    } else if (activeFilter === 'closed') {
      filtered = filtered.filter(l => l.status === 'closed');
    } else if (activeFilter === 'overdue') {
      filtered = filtered.filter(l => 
        l.status === 'active' && new Date(l.maturity_date) < new Date()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.loan_number.toLowerCase().includes(query) ||
        l.customer?.full_name?.toLowerCase().includes(query) ||
        l.customer?.phone?.includes(query)
      );
    }

    setFilteredLoans(filtered);
  }, [loans, activeFilter, searchQuery]);

  return (
    <MobileLayout>
      <MobileHeader 
        title="Loans" 
        showSearch 
        onSearchClick={() => setShowSearch(!showSearch)} 
      />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative animate-slide-down">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by loan number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.label}
              {filter.key === 'active' && loans.filter(l => l.status === 'active').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-[10px]">
                  {loans.filter(l => l.status === 'active').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery ? 'No loans found' : 'No loans yet'}
              </p>
              <button
                onClick={() => navigate('/loans')}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Create New Loan
              </button>
            </div>
          ) : (
            filteredLoans.map((loan, index) => (
              <div 
                key={loan.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <LoanCard
                  loan={loan}
                  onClick={() => navigate(`/loans?id=${loan.id}`)}
                  onInterestClick={() => navigate(`/interest?loan=${loan.loan_number}`)}
                  onRedeemClick={() => navigate(`/redemption?loan=${loan.loan_number}`)}
                />
              </div>
            ))
          )}
        </div>

        {/* FAB for new loan - Additional to bottom nav */}
        <button
          onClick={() => navigate('/loans')}
          className="fixed right-4 bottom-24 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </MobileLayout>
  );
}
