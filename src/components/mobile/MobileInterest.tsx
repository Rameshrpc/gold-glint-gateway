import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, Calendar, AlertTriangle, Clock, CheckCircle, Printer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import LoadingButton from './LoadingButton';
import SuccessAnimation from './SuccessAnimation';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard, MobileFormField, MobileSelectField } from './shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';
import { generateInterestVoucher } from '@/hooks/useVoucherGeneration';

interface LoanWithInterest {
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
  daysOverdue: number;
  interestDue: number;
  daysCovered: number;
  periodFrom: string;
  urgency: 'overdue' | 'due-soon' | 'normal';
}

export default function MobileInterest() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<LoanWithInterest[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanWithInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInterest | null>(null);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const filters = [
    { key: 'all', label: 'All', count: loans.length },
    { key: 'overdue', label: 'Overdue', count: loans.filter(l => l.urgency === 'overdue').length },
    { key: 'due-soon', label: 'Due Soon', count: loans.filter(l => l.urgency === 'due-soon').length },
  ];

  const fetchLoans = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, interest_rate, loan_date, maturity_date, last_interest_paid_date, branch_id,
          customer:customers(full_name, phone)
        `)
        .eq('client_id', profile.client_id)
        .eq('status', 'active')
        .order('maturity_date', { ascending: true });

      if (error) throw error;

      const processedLoans = (data || []).map(loan => {
        const lastPaidDate = loan.last_interest_paid_date ? new Date(loan.last_interest_paid_date) : new Date(loan.loan_date);
        const today = new Date();
        const daysSincePayment = differenceInDays(today, lastPaidDate);
        const daysOverdue = Math.max(0, daysSincePayment - 30);
        const interestDue = Math.round((loan.principal_amount * loan.interest_rate / 100 / 365) * daysSincePayment);
        
        let urgency: 'overdue' | 'due-soon' | 'normal' = 'normal';
        if (daysOverdue > 0) {
          urgency = 'overdue';
        } else if (daysSincePayment >= 25) {
          urgency = 'due-soon';
        }

        return {
          ...loan,
          daysOverdue,
          interestDue,
          daysCovered: daysSincePayment,
          periodFrom: format(lastPaidDate, 'yyyy-MM-dd'),
          urgency,
        };
      });

      // Sort by urgency
      processedLoans.sort((a, b) => {
        const urgencyOrder = { overdue: 0, 'due-soon': 1, normal: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
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

    if (activeFilter === 'overdue') {
      filtered = filtered.filter(l => l.urgency === 'overdue');
    } else if (activeFilter === 'due-soon') {
      filtered = filtered.filter(l => l.urgency === 'due-soon');
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

  // Generate receipt number
  const generateReceiptNumber = async (): Promise<string> => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INT-${timestamp}-${random}`;
  };

  // Handle interest collection
  const handleCollectInterest = async () => {
    if (!selectedLoan || !profile?.client_id) return;

    const amount = parseFloat(amountReceived) || selectedLoan.interestDue;
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    vibrateLight();

    try {
      const receiptNumber = await generateReceiptNumber();
      const today = format(new Date(), 'yyyy-MM-dd');

      // Create interest payment record
      const { data: payment, error: paymentError } = await supabase
        .from('interest_payments')
        .insert({
          client_id: profile.client_id,
          branch_id: selectedLoan.branch_id,
          loan_id: selectedLoan.id,
          receipt_number: receiptNumber,
          payment_date: today,
          amount_paid: amount,
          shown_interest: selectedLoan.interestDue,
          actual_interest: selectedLoan.interestDue,
          days_covered: selectedLoan.daysCovered,
          period_from: selectedLoan.periodFrom,
          period_to: today,
          overdue_days: selectedLoan.daysOverdue,
          penalty_amount: 0,
          payment_mode: paymentMode,
          collected_by: profile.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update loan's last interest paid date
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          last_interest_paid_date: today,
          total_interest_paid: (selectedLoan as any).total_interest_paid ? 
            (selectedLoan as any).total_interest_paid + amount : amount,
        })
        .eq('id', selectedLoan.id);

      if (loanError) throw loanError;

      // Generate voucher
      await generateInterestVoucher({
        clientId: profile.client_id,
        branchId: selectedLoan.branch_id,
        paymentId: payment.id,
        loanNumber: selectedLoan.loan_number,
        amountPaid: amount,
        interestAmount: selectedLoan.interestDue,
        penaltyAmount: 0,
        principalReduction: 0,
        paymentMode,
      });

      vibrateSuccess();
      setLastReceipt(receiptNumber);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error collecting interest:', error);
      toast.error(error.message || 'Failed to collect interest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setSelectedLoan(null);
    setAmountReceived('');
    setPaymentMode('cash');
    fetchLoans(); // Refresh the list
    toast.success(`Interest collected! Receipt: ${lastReceipt}`);
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return { color: 'error', icon: AlertTriangle, label: 'Overdue' };
      case 'due-soon':
        return { color: 'warning', icon: Clock, label: 'Due Soon' };
      default:
        return { color: 'success', icon: CheckCircle, label: 'On Track' };
    }
  };

  // Render success animation as overlay
  const renderSuccessOverlay = () => {
    if (!showSuccess) return null;
    return (
      <SuccessAnimation
        isVisible={showSuccess}
        message={`Interest Collected! Receipt: ${lastReceipt}`}
        onComplete={handleSuccessComplete}
      />
    );
  };

  return (
    <MobileLayout>
      {renderSuccessOverlay()}
      <MobileSimpleHeader title="Interest Collection" showBack />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Overdue</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {loans.filter(l => l.urgency === 'overdue').length}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Due This Week</span>
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {loans.filter(l => l.urgency === 'due-soon').length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by loan number, customer..."
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

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
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                No interest payments due at the moment
              </p>
            </div>
          ) : (
            filteredLoans.map((loan, index) => {
              const config = getUrgencyConfig(loan.urgency);
              const Icon = config.icon;

              return (
                <div
                  key={loan.id}
                  className="animate-slide-up-fade"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <MobileDataCard
                    title={loan.customer?.full_name || 'Unknown'}
                    subtitle={loan.loan_number}
                    badge={{
                      label: config.label,
                      variant: config.color as any,
                    }}
                    accentColor={config.color as any}
                    stats={[
                      { label: 'Principal', value: `₹${(loan.principal_amount / 1000).toFixed(0)}K` },
                      { label: 'Interest Due', value: `₹${loan.interestDue.toLocaleString()}` },
                      { label: 'Rate', value: `${loan.interest_rate}%` },
                    ]}
                    actions={[
                      {
                        label: 'Collect',
                        icon: <Banknote className="w-4 h-4" />,
                        onClick: () => {
                          vibrateLight();
                          setSelectedLoan(loan);
                          setAmountReceived(loan.interestDue.toString());
                        },
                        variant: 'success',
                      },
                    ]}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Last paid: {loan.last_interest_paid_date 
                          ? format(new Date(loan.last_interest_paid_date), 'dd MMM yyyy')
                          : 'Never'
                        }
                      </span>
                      {loan.daysOverdue > 0 && (
                        <span className="text-red-500 font-medium">
                          ({loan.daysOverdue} days overdue)
                        </span>
                      )}
                    </div>
                  </MobileDataCard>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Collection Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title="Collect Interest"
        snapPoints={['half', 'full']}
      >
        {selectedLoan && (
          <div className="p-4 space-y-4">
            {/* Loan Summary */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan</span>
                <span className="font-medium">{selectedLoan.loan_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{selectedLoan.customer?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Covered</span>
                <span className="font-medium">{selectedLoan.daysCovered} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Due</span>
                <span className="font-bold text-lg text-emerald-600">₹{selectedLoan.interestDue.toLocaleString()}</span>
              </div>
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

            {/* Amount Field */}
            <MobileFormField
              label="Amount Received"
              type="number"
              placeholder="Enter amount"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              icon={<Banknote className="w-4 h-4" />}
            />

            <LoadingButton
              onClick={handleCollectInterest}
              isLoading={isSubmitting}
              loadingText="Processing..."
              className="w-full py-4 rounded-xl gradient-gold text-white font-semibold shadow-mobile-md"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Collect ₹{amountReceived || selectedLoan.interestDue}
            </LoadingButton>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
