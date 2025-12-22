import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Award, Calendar, Scale, Banknote, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard } from './shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LoanForRedemption {
  id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
  last_interest_paid_date: string | null;
  customer: {
    full_name: string;
    phone: string;
  };
  gold_items: Array<{
    net_weight_grams: number;
    item_type: string;
  }>;
  totalGold: number;
  interestDue: number;
  totalDue: number;
}

export default function MobileRedemption() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<LoanForRedemption[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanForRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanForRedemption | null>(null);

  useEffect(() => {
    fetchLoans();
  }, [profile?.client_id]);

  const fetchLoans = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, interest_rate, loan_date, maturity_date, last_interest_paid_date,
          customer:customers(full_name, phone),
          gold_items(net_weight_grams, item_type)
        `)
        .eq('client_id', profile.client_id)
        .eq('status', 'active')
        .order('maturity_date', { ascending: true });

      if (error) throw error;

      const processedLoans = (data || []).map(loan => {
        const lastPaidDate = loan.last_interest_paid_date ? new Date(loan.last_interest_paid_date) : new Date(loan.loan_date);
        const today = new Date();
        const daysSincePayment = differenceInDays(today, lastPaidDate);
        const interestDue = Math.round((loan.principal_amount * loan.interest_rate / 100 / 365) * daysSincePayment);
        const totalGold = loan.gold_items?.reduce((sum, item) => sum + item.net_weight_grams, 0) || 0;

        return {
          ...loan,
          totalGold,
          interestDue,
          totalDue: loan.principal_amount + interestDue,
        };
      });

      setLoans(processedLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...loans];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.loan_number.toLowerCase().includes(query) ||
        l.customer?.full_name?.toLowerCase().includes(query) ||
        l.customer?.phone?.includes(query)
      );
    }

    setFilteredLoans(filtered);
  }, [loans, searchQuery]);

  return (
    <MobileLayout>
      <MobileGradientHeader title="Redemption" variant="minimal" />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Summary Card */}
        <div className="gradient-gold rounded-2xl p-4 text-white shadow-mobile-lg">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6" />
            <span className="font-semibold">Ready for Redemption</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/70 text-xs">Active Loans</p>
              <p className="text-2xl font-bold">{loans.length}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Total Gold</p>
              <p className="text-2xl font-bold">
                {loans.reduce((sum, l) => sum + l.totalGold, 0).toFixed(1)}g
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by loan number, customer..."
        />

        {/* Loans List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Award className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No results found' : 'No active loans'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'All loans have been redeemed'}
              </p>
            </div>
          ) : (
            filteredLoans.map((loan, index) => (
              <div
                key={loan.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MobileDataCard
                  title={loan.customer?.full_name || 'Unknown'}
                  subtitle={loan.loan_number}
                  icon={<Scale className="w-5 h-5 text-amber-500" />}
                  accentColor="gold"
                  stats={[
                    { label: 'Principal', value: `₹${(loan.principal_amount / 1000).toFixed(0)}K` },
                    { label: 'Gold', value: `${loan.totalGold.toFixed(1)}g` },
                    { label: 'Total Due', value: `₹${(loan.totalDue / 1000).toFixed(1)}K` },
                  ]}
                  actions={[
                    {
                      label: 'Redeem',
                      icon: <Award className="w-4 h-4" />,
                      onClick: () => setSelectedLoan(loan),
                      variant: 'warning',
                    },
                  ]}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {format(new Date(loan.maturity_date), 'dd MMM yyyy')}</span>
                  </div>
                </MobileDataCard>
              </div>
            ))
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-20" />
      </div>

      {/* Redemption Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title="Loan Redemption"
        snapPoints={['half', 'full']}
      >
        {selectedLoan && (
          <div className="p-4 space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedLoan.customer?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedLoan.loan_number}</p>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal Amount</span>
                <span className="font-medium">₹{selectedLoan.principal_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Due</span>
                <span className="font-medium">₹{selectedLoan.interestDue.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold">Total Payable</span>
                <span className="font-bold text-lg text-amber-600">
                  ₹{selectedLoan.totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Gold Items */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-amber-900 dark:text-amber-100">Gold to Return</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {selectedLoan.totalGold.toFixed(2)}g
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {selectedLoan.gold_items?.length || 0} item(s)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setSelectedLoan(null);
                  navigate(`/redemption?loan=${selectedLoan.loan_number}`);
                }}
                className="w-full py-4 rounded-xl gradient-gold text-white font-semibold tap-scale shadow-mobile-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Proceed to Redeem
              </button>
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-full py-3 rounded-xl bg-muted font-medium tap-scale"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
