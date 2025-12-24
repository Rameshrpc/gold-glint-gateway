import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, X, FileText } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import LoanCard from './LoanCard';
import MobilePrintSheet from './sheets/MobilePrintSheet';
import MobileLoanDetailsSheet from './sheets/MobileLoanDetailsSheet';
import PullToRefreshContainer from './PullToRefreshContainer';
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
  const [detailsLoanId, setDetailsLoanId] = useState<string | null>(null);

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: loans.length },
    { key: 'active', label: 'Active', count: loans.filter(l => l.status === 'active').length },
    { key: 'overdue', label: 'Overdue', count: loans.filter(l => l.status === 'active' && new Date(l.maturity_date) < new Date()).length },
    { key: 'closed', label: 'Closed', count: loans.filter(l => l.status === 'closed').length },
  ];

  const fetchLoans = useCallback(async () => {
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
  }, [profile?.client_id]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    let filtered = [...loans];

    if (activeFilter === 'active') {
      filtered = filtered.filter(l => l.status === 'active');
    } else if (activeFilter === 'closed') {
      filtered = filtered.filter(l => l.status === 'closed');
    } else if (activeFilter === 'overdue') {
      filtered = filtered.filter(l => 
        l.status === 'active' && new Date(l.maturity_date) < new Date()
      );
    }

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
      <MobileSimpleHeader 
        title="Loans" 
        showSearch
        onSearchClick={() => setShowSearch(!showSearch)}
        showAdd
        onAddClick={() => navigate('/new-loan')}
      />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter.label}
              {filter.count !== undefined && filter.count > 0 && (
                <span className="ml-1.5 opacity-70">({filter.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                {searchQuery ? 'No results' : 'No loans'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search' : 'Create your first loan'}
              </p>
              <button
                onClick={() => navigate('/new-loan')}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                New Loan
              </button>
            </div>
          ) : (
            filteredLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onClick={() => setDetailsLoanId(loan.id)}
                onInterestClick={() => navigate(`/interest?loan=${loan.loan_number}`)}
                onRedeemClick={() => navigate(`/redemption?loan=${loan.loan_number}`)}
                onPrintClick={() => setPrintLoanId(loan.id)}
              />
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Loan Details Sheet */}
      <MobileLoanDetailsSheet
        loanId={detailsLoanId}
        onClose={() => setDetailsLoanId(null)}
        onRefresh={handleRefresh}
        onPrint={() => {
          if (detailsLoanId) {
            setPrintLoanId(detailsLoanId);
          }
        }}
      />

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
