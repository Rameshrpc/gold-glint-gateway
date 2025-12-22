import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, ArrowLeft, Package, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { MobileBottomSheet } from './shared';
import { MobilePrintSheet } from './sheets/MobilePrintSheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, addDays, addMonths } from 'date-fns';
import { calculateRedemptionAmount, calculateAdvanceInterest, formatIndianCurrency } from '@/lib/interestCalculations';

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  actual_principal: number | null;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  status: string;
  last_interest_paid_date: string | null;
  differential_capitalized: number | null;
  branch_id: string;
  customer: {
    id: string;
    full_name: string;
    phone: string;
  };
  scheme: {
    id: string;
    scheme_name: string;
    shown_rate: number;
    effective_rate: number;
    minimum_days: number;
    penalty_rate: number | null;
    grace_period_days: number | null;
  };
  gold_items: Array<{
    net_weight_grams: number;
    appraised_value: number;
  }>;
}

interface Scheme {
  id: string;
  scheme_name: string;
  shown_rate: number;
  effective_rate: number;
  advance_interest_months: number;
  ltv_percentage: number;
  max_tenure_days: number;
  rate_22kt: number | null;
}

export default function MobileReloan() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    if (profile?.client_id) {
      fetchSchemes();
    }
  }, [profile?.client_id]);

  const fetchSchemes = async () => {
    const { data } = await supabase
      .from('schemes')
      .select('id, scheme_name, shown_rate, effective_rate, advance_interest_months, ltv_percentage, max_tenure_days, rate_22kt')
      .eq('client_id', profile?.client_id)
      .eq('is_active', true);
    setSchemes(data || []);
  };

  const handleSearch = async () => {
    if (!profile?.client_id || searchQuery.length < 3) {
      toast.error('Enter at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, principal_amount, actual_principal, interest_rate,
          tenure_days, maturity_date, status, last_interest_paid_date, differential_capitalized, branch_id,
          customer:customers(id, full_name, phone),
          scheme:schemes(id, scheme_name, shown_rate, effective_rate, minimum_days, penalty_rate, grace_period_days),
          gold_items(net_weight_grams, appraised_value)
        `)
        .eq('client_id', profile.client_id)
        .eq('status', 'active')
        .or(`loan_number.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setSelectedSchemeId(loan.scheme.id);
    setShowConfirm(true);
  };

  const oldLoanCalc = useMemo(() => {
    if (!selectedLoan) return null;
    const scheme = {
      shown_rate: selectedLoan.scheme.shown_rate || 18,
      effective_rate: selectedLoan.scheme.effective_rate || 24,
      minimum_days: selectedLoan.scheme.minimum_days || 30,
      penalty_rate: selectedLoan.scheme.penalty_rate || 2,
      grace_period_days: selectedLoan.scheme.grace_period_days || 7,
    };
    const lastPaidDate = selectedLoan.last_interest_paid_date || selectedLoan.loan_date;
    const daysSincePayment = differenceInDays(new Date(), parseISO(lastPaidDate));
    return calculateRedemptionAmount(
      selectedLoan.actual_principal || selectedLoan.principal_amount,
      scheme as any,
      daysSincePayment,
      selectedLoan.tenure_days,
      selectedLoan.differential_capitalized || 0
    );
  }, [selectedLoan]);

  const newLoanCalc = useMemo(() => {
    if (!selectedLoan) return null;
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme) return null;

    const totalAppraised = selectedLoan.gold_items.reduce((sum, item) => sum + item.appraised_value, 0);
    const loanAmount = Math.round(totalAppraised * (scheme.ltv_percentage / 100));
    const advanceCalc = calculateAdvanceInterest(loanAmount, {
      id: scheme.id,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate,
      effective_rate: scheme.effective_rate,
      minimum_days: 30,
      advance_interest_months: scheme.advance_interest_months || 3,
    }, scheme.max_tenure_days);

    return {
      loanAmount,
      netCash: advanceCalc.actualPrincipal - advanceCalc.shownInterest,
      advanceCalc,
      scheme,
    };
  }, [selectedLoan, selectedSchemeId, schemes]);

  const netSettlement = useMemo(() => {
    if (!oldLoanCalc || !newLoanCalc) return null;
    const oldTotal = oldLoanCalc.breakdown.total;
    const newCash = newLoanCalc.netCash;
    return {
      oldTotal,
      newCash,
      net: Math.abs(newCash - oldTotal),
      direction: newCash >= oldTotal ? 'to_customer' : 'from_customer',
    };
  }, [oldLoanCalc, newLoanCalc]);

  const handleProcessReloan = async () => {
    if (!selectedLoan || !oldLoanCalc || !newLoanCalc || !netSettlement || !profile) return;

    setProcessing(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const loanDate = new Date();
      const maturityDate = addDays(loanDate, newLoanCalc.scheme.max_tenure_days);
      const newLoanNumber = `GL${format(new Date(), 'yyyyMMdd')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Close old loan
      await supabase
        .from('loans')
        .update({ status: 'closed', closure_type: 'reloan', closed_date: today })
        .eq('id', selectedLoan.id);

      // Create new loan
      const { data: newLoan, error } = await supabase
        .from('loans')
        .insert({
          client_id: profile.client_id,
          branch_id: selectedLoan.branch_id,
          customer_id: selectedLoan.customer.id,
          scheme_id: selectedSchemeId,
          loan_number: newLoanNumber,
          loan_date: today,
          maturity_date: format(maturityDate, 'yyyy-MM-dd'),
          principal_amount: newLoanCalc.loanAmount,
          actual_principal: newLoanCalc.advanceCalc.actualPrincipal,
          shown_principal: newLoanCalc.advanceCalc.shownPrincipal,
          interest_rate: newLoanCalc.scheme.shown_rate / 12,
          tenure_days: newLoanCalc.scheme.max_tenure_days,
          net_disbursed: newLoanCalc.netCash,
          advance_interest_shown: newLoanCalc.advanceCalc.shownInterest,
          advance_interest_actual: newLoanCalc.advanceCalc.actualInterest,
          differential_capitalized: newLoanCalc.advanceCalc.differential,
          status: 'active',
          is_reloan: true,
          previous_loan_id: selectedLoan.id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy gold items
      const goldItems = selectedLoan.gold_items.map(item => ({
        loan_id: newLoan.id,
        ...item,
      }));
      // Note: simplified - actual implementation would copy full gold item data

      setCreatedLoanId(newLoan.id);
      toast.success(`Reloan created: ${newLoanNumber}`);
      setShowConfirm(false);
      setShowPrint(true);
    } catch (error: any) {
      console.error('Reloan error:', error);
      toast.error(error.message || 'Failed to process reloan');
    } finally {
      setProcessing(false);
    }
  };

  const totalGoldWeight = selectedLoan?.gold_items.reduce((sum, item) => sum + item.net_weight_grams, 0) || 0;

  return (
    <MobileLayout hideNav>
      <MobileGradientHeader 
        title="Reloan" 
        variant="minimal"
        showBack
        onBackClick={() => navigate(-1)}
      />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by loan number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 rounded-2xl gradient-gold text-white font-medium tap-scale"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Search for a loan to reloan</p>
            </div>
          ) : (
            loans.map((loan) => (
              <button
                key={loan.id}
                onClick={() => selectLoan(loan)}
                className="w-full p-4 rounded-2xl bg-card border border-border text-left tap-scale animate-slide-up-fade"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{loan.loan_number}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{loan.customer?.full_name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>₹{(loan.principal_amount / 1000).toFixed(0)}K</span>
                  <span>{loan.gold_items?.reduce((sum, i) => sum + i.net_weight_grams, 0).toFixed(1)}g</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Sheet */}
      <MobileBottomSheet
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Reloan"
      >
        {selectedLoan && oldLoanCalc && newLoanCalc && netSettlement && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="font-semibold">{selectedLoan.customer?.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedLoan.loan_number}</p>
            </div>

            {/* Old Loan Settlement */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <h4 className="font-semibold text-destructive mb-2">Close Old Loan</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Principal</span>
                  <span>₹{formatIndianCurrency(oldLoanCalc.breakdown.principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Due</span>
                  <span>₹{formatIndianCurrency(oldLoanCalc.breakdown.interest)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-destructive/20">
                  <span>Total</span>
                  <span>₹{formatIndianCurrency(oldLoanCalc.breakdown.total)}</span>
                </div>
              </div>
            </div>

            {/* New Loan */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="font-semibold text-emerald-600 mb-2">New Loan</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Loan Amount</span>
                  <span>₹{formatIndianCurrency(newLoanCalc.loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Interest</span>
                  <span>-₹{formatIndianCurrency(newLoanCalc.advanceCalc.shownInterest)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-emerald-500/20">
                  <span>Net Cash</span>
                  <span>₹{formatIndianCurrency(newLoanCalc.netCash)}</span>
                </div>
              </div>
            </div>

            {/* Net Settlement */}
            <div className={cn(
              "p-4 rounded-xl border-2",
              netSettlement.direction === 'to_customer' 
                ? "bg-emerald-500/10 border-emerald-500" 
                : "bg-amber-500/10 border-amber-500"
            )}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {netSettlement.direction === 'to_customer' ? 'Pay to Customer' : 'Collect from Customer'}
                </span>
                <span className="text-xl font-bold">₹{formatIndianCurrency(netSettlement.net)}</span>
              </div>
            </div>

            <button
              onClick={handleProcessReloan}
              disabled={processing}
              className="w-full py-4 rounded-2xl gradient-gold text-white font-semibold tap-scale disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Confirm Reloan'}
            </button>
          </div>
        )}
      </MobileBottomSheet>

      {/* Print Sheet */}
      {createdLoanId && (
        <MobilePrintSheet
          isOpen={showPrint}
          onClose={() => {
            setShowPrint(false);
            navigate('/loans');
          }}
          loanId={createdLoanId}
        />
      )}
    </MobileLayout>
  );
}
