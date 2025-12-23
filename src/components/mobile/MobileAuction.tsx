import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, AlertTriangle, ChevronRight, Package, Calendar, Search } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { formatIndianCurrency } from '@/lib/interestCalculations';

interface EligibleLoan {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  customer: {
    full_name: string;
    phone: string;
  };
  gold_items: Array<{
    gross_weight_grams: number;
    appraised_value: number;
  }>;
}

export default function MobileAuction() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<EligibleLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEligibleLoans();
  }, [profile?.client_id]);

  const fetchEligibleLoans = async () => {
    if (!profile?.client_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, maturity_date, principal_amount,
          customer:customers(full_name, phone),
          gold_items(gross_weight_grams, appraised_value)
        `)
        .eq('client_id', profile.client_id)
        .in('status', ['active', 'overdue'])
        .lte('maturity_date', today)
        .order('maturity_date', { ascending: true });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysOverdue = (maturityDate: string) => {
    return differenceInDays(new Date(), new Date(maturityDate));
  };

  const filteredLoans = loans.filter(loan =>
    loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (days: number) => {
    if (days >= 180) return 'bg-red-500';
    if (days >= 90) return 'bg-orange-500';
    if (days >= 30) return 'bg-amber-500';
    return 'bg-yellow-500';
  };

  return (
    <MobileLayout hideNav>
      <MobileSimpleHeader title="Auction" showBack />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Header Stats */}
        <div className="p-4 rounded-2xl gradient-gold text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">Eligible for Auction</p>
              <p className="text-2xl font-bold">{loans.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm"
          />
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl shimmer" />
            ))
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No loans eligible for auction</p>
            </div>
          ) : (
            filteredLoans.map((loan, index) => {
              const daysOverdue = getDaysOverdue(loan.maturity_date);
              const totalWeight = loan.gold_items?.reduce((sum, i) => sum + i.gross_weight_grams, 0) || 0;
              const totalValue = loan.gold_items?.reduce((sum, i) => sum + i.appraised_value, 0) || 0;

              return (
                <div
                  key={loan.id}
                  className="p-4 rounded-2xl bg-card border border-border animate-slide-up-fade"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{loan.loan_number}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold text-white",
                          getSeverityColor(daysOverdue)
                        )}>
                          {daysOverdue}d overdue
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{loan.customer?.full_name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-muted/50 text-center">
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-semibold">₹{(loan.principal_amount / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/50 text-center">
                      <p className="text-muted-foreground">Gold</p>
                      <p className="font-semibold">{totalWeight.toFixed(1)}g</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/50 text-center">
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-semibold">₹{(totalValue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Matured: {format(new Date(loan.maturity_date), 'dd MMM yyyy')}
                    </span>
                    <button className="text-xs font-semibold text-primary tap-scale">
                      Process Auction →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
