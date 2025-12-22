import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Award, Calendar, Scale, Banknote, CheckCircle2, Printer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import LoadingButton from './LoadingButton';
import SuccessAnimation from './SuccessAnimation';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard, MobileSelectField } from './shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';
import { generateRedemptionVoucher } from '@/hooks/useVoucherGeneration';

interface LoanForRedemption {
  id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
  last_interest_paid_date: string | null;
  branch_id: string;
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
  daysSincePayment: number;
}

export default function MobileRedemption() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<LoanForRedemption[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanForRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanForRedemption | null>(null);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [goldVerified, setGoldVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceiptNumber, setLastReceiptNumber] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, interest_rate, loan_date, maturity_date, last_interest_paid_date, branch_id,
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
          daysSincePayment,
        };
      });

      setLoans(processedLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
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

  // Generate receipt number
  const generateReceiptNumber = async (): Promise<string> => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RDM-${timestamp}-${random}`;
  };

  // Handle redemption
  const handleRedeem = async () => {
    if (!selectedLoan || !profile?.client_id) return;

    if (!goldVerified) {
      toast.error('Please verify gold release before proceeding');
      return;
    }

    setIsSubmitting(true);
    vibrateLight();

    try {
      const receiptNumber = await generateReceiptNumber();
      const today = format(new Date(), 'yyyy-MM-dd');

      // Update loan status to closed
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: 'closed',
          closed_date: today,
          closure_type: 'redeemed',
        })
        .eq('id', selectedLoan.id);

      if (loanError) throw loanError;

      // Create interest payment for final interest (if any)
      if (selectedLoan.interestDue > 0) {
        const { error: interestError } = await supabase
          .from('interest_payments')
          .insert({
            client_id: profile.client_id,
            branch_id: selectedLoan.branch_id,
            loan_id: selectedLoan.id,
            receipt_number: `${receiptNumber}-INT`,
            payment_date: today,
            amount_paid: selectedLoan.interestDue,
            shown_interest: selectedLoan.interestDue,
            actual_interest: selectedLoan.interestDue,
            days_covered: selectedLoan.daysSincePayment,
            period_from: selectedLoan.last_interest_paid_date || selectedLoan.loan_date,
            period_to: today,
            overdue_days: 0,
            penalty_amount: 0,
            payment_mode: paymentMode,
            collected_by: profile.id,
          });

        if (interestError) throw interestError;
      }

      // Generate redemption voucher
      await generateRedemptionVoucher({
        clientId: profile.client_id,
        branchId: selectedLoan.branch_id,
        redemptionId: selectedLoan.id,
        loanNumber: selectedLoan.loan_number,
        amountReceived: selectedLoan.totalDue,
        principalAmount: selectedLoan.principal_amount,
        interestDue: selectedLoan.interestDue,
        penaltyAmount: 0,
        rebateAmount: 0,
      });

      vibrateSuccess();
      setLastReceiptNumber(receiptNumber);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error processing redemption:', error);
      toast.error(error.message || 'Failed to process redemption');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setSelectedLoan(null);
    setGoldVerified(false);
    setPaymentMode('cash');
    fetchLoans(); // Refresh the list
    toast.success(`Loan redeemed! Receipt: ${lastReceiptNumber}`);
  };

  // Render success animation as overlay
  const renderSuccessOverlay = () => {
    if (!showSuccess) return null;
    return (
      <SuccessAnimation
        isVisible={showSuccess}
        message={`Loan Redeemed! Gold Released. Receipt: ${lastReceiptNumber}`}
        onComplete={handleSuccessComplete}
      />
    );
  };

  return (
    <MobileLayout>
      {renderSuccessOverlay()}
      <MobileGradientHeader title="Redemption" variant="minimal" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
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
                      onClick: () => {
                        vibrateLight();
                        setSelectedLoan(loan);
                      },
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
      </PullToRefreshContainer>

      {/* Redemption Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedLoan}
        onClose={() => {
          setSelectedLoan(null);
          setGoldVerified(false);
        }}
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

            {/* Payment Mode */}
            <MobileSelectField
              label="Payment Mode"
              value={paymentMode}
              onChange={setPaymentMode}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cheque', label: 'Cheque' },
              ]}
            />

            {/* Gold Verification */}
            <button
              onClick={() => {
                vibrateLight();
                setGoldVerified(!goldVerified);
              }}
              className={cn(
                "w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                goldVerified 
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                  : "border-border bg-muted/30"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                goldVerified ? "bg-emerald-500" : "bg-muted"
              )}>
                {goldVerified && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-medium",
                  goldVerified ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                )}>
                  Gold Verified & Released
                </p>
                <p className="text-xs text-muted-foreground">
                  Confirm gold items have been verified and returned
                </p>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <LoadingButton
                onClick={handleRedeem}
                isLoading={isSubmitting}
                loadingText="Processing..."
                disabled={!goldVerified}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold shadow-mobile-md flex items-center justify-center gap-2",
                  goldVerified 
                    ? "gradient-gold text-white" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Redemption
              </LoadingButton>
              <button
                onClick={() => {
                  setSelectedLoan(null);
                  setGoldVerified(false);
                }}
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
