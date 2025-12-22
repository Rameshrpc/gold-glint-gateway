import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Loader2, X } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import LoanCard from './LoanCard';
import MobilePrintSheet from './sheets/MobilePrintSheet';
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
  const [printLoanId, setPrintLoanId] = useState<string | null>(null);

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: loans.length },
    { key: 'active', label: 'Active', count: loans.filter(l => l.status === 'active').length },
    { key: 'overdue', label: 'Overdue', count: loans.filter(l => l.status === 'active' && new Date(l.maturity_date) < new Date()).length },
    { key: 'closed', label: 'Closed', count: loans.filter(l => l.status === 'closed').length },
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
      <MobileGradientHeader 
        title="Loans" 
        variant="minimal"
        showSearch 
        onSearchClick={() => setShowSearch(!showSearch)} 
      />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative animate-slide-down">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by loan number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-mobile-sm"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center tap-scale"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter, index) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 tap-scale animate-slide-up-fade",
                activeFilter === filter.key
                  ? "gradient-gold text-white shadow-mobile-md"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="flex items-center gap-1.5">
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeFilter === filter.key
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {filter.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No results found' : 'No loans yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first loan to get started'}
              </p>
              <button
                onClick={() => navigate('/loans')}
                className="px-6 py-3 rounded-full gradient-gold text-white font-medium shadow-mobile-md tap-scale"
              >
                Create New Loan
              </button>
            </div>
          ) : (
            filteredLoans.map((loan, index) => (
              <div 
                key={loan.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <LoanCard
                  loan={loan}
                  onClick={() => navigate(`/loans?id=${loan.id}`)}
                  onInterestClick={() => navigate(`/interest?loan=${loan.loan_number}`)}
                  onRedeemClick={() => navigate(`/redemption?loan=${loan.loan_number}`)}
                  onPrintClick={() => setPrintLoanId(loan.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-20" />
      </div>

      {/* FAB for new loan */}
      <button
        onClick={() => navigate('/new-loan')}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-full gradient-gold text-white shadow-lg flex items-center justify-center tap-scale z-40 animate-bounce-in shadow-glow"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Print Sheet */}
      {printLoanId && (
        <MobilePrintSheet
          open={!!printLoanId}
          onOpenChange={(open) => !open && setPrintLoanId(null)}
          loanId={printLoanId}
        />
      )}
    </MobileLayout>
  );
}
