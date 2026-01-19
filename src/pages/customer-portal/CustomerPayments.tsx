import { useState, useMemo } from 'react';
import { CustomerPortalLayout } from '@/components/customer-portal/CustomerPortalLayout';
import { useCustomerPortalData } from '@/hooks/useCustomerPortalData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { 
  AlertTriangle, RefreshCw, Search, Receipt, Calendar,
  Wallet, TrendingUp, Filter
} from 'lucide-react';
import { format, parseISO, isWithinInterval, subMonths } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateFilter = 'all' | '1m' | '3m' | '6m' | '1y';

export default function CustomerPayments() {
  const { data, isLoading, error, refetch } = useCustomerPortalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [loanFilter, setLoanFilter] = useState<string>('all');

  if (isLoading) {
    return (
      <CustomerPortalLayout title="Payment History">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-12" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </CustomerPortalLayout>
    );
  }

  if (error) {
    return (
      <CustomerPortalLayout title="Payment History">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </CustomerPortalLayout>
    );
  }

  const { loans = [], recentPayments = [], redemptions = [] } = data || {};

  // Build a complete payments list from all loans
  const allPayments = useMemo(() => {
    const payments: any[] = [];
    
    // Add interest payments
    recentPayments.forEach((payment: any) => {
      const loan = loans.find((l: any) => l.id === payment.loan_id);
      payments.push({
        ...payment,
        type: 'interest',
        loanNumber: loan?.loan_number || 'Unknown',
      });
    });

    // Add redemption payments
    redemptions.forEach((redemption: any) => {
      const loan = loans.find((l: any) => l.id === redemption.loan_id);
      payments.push({
        id: redemption.id,
        payment_date: redemption.redemption_date,
        amount_paid: redemption.amount_received,
        receipt_number: redemption.redemption_number,
        loan_id: redemption.loan_id,
        type: 'redemption',
        loanNumber: loan?.loan_number || 'Unknown',
        total_settlement: redemption.total_settlement,
      });
    });

    // Sort by date descending
    return payments.sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
  }, [loans, recentPayments, redemptions]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      // Search filter
      const matchesSearch = 
        payment.loanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Loan filter
      const matchesLoan = loanFilter === 'all' || payment.loan_id === loanFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const paymentDate = parseISO(payment.payment_date);
        const now = new Date();
        const months = dateFilter === '1m' ? 1 : dateFilter === '3m' ? 3 : dateFilter === '6m' ? 6 : 12;
        const startDate = subMonths(now, months);
        matchesDate = isWithinInterval(paymentDate, { start: startDate, end: now });
      }
      
      return matchesSearch && matchesLoan && matchesDate;
    });
  }, [allPayments, searchQuery, loanFilter, dateFilter]);

  // Calculate totals
  const totalInterestPaid = allPayments
    .filter((p) => p.type === 'interest')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  
  const totalRedemptions = allPayments
    .filter((p) => p.type === 'redemption')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  // Get unique loans for filter
  const uniqueLoans = loans.map((l: any) => ({ id: l.id, number: l.loan_number }));

  return (
    <CustomerPortalLayout title="Payment History">
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest Paid</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIndianCurrency(totalInterestPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Redemptions</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatIndianCurrency(totalRedemptions)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by receipt or loan number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={loanFilter} onValueChange={setLoanFilter}>
              <SelectTrigger className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by loan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                {uniqueLoans.map((loan: any) => (
                  <SelectItem key={loan.id} value={loan.id}>
                    {loan.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payments List */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {filteredPayments.length} payment(s) found
          </h3>

          <div className="space-y-3">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment: any) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          payment.type === 'redemption' 
                            ? 'bg-blue-500/10' 
                            : 'bg-emerald-500/10'
                        }`}>
                          <Receipt className={`h-4 w-4 ${
                            payment.type === 'redemption'
                              ? 'text-blue-500'
                              : 'text-emerald-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{payment.receipt_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(payment.payment_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        payment.type === 'redemption'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                      }>
                        {payment.type === 'redemption' ? 'Redemption' : 'Interest'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Loan</p>
                        <p className="font-medium">{payment.loanNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Amount Paid</p>
                        <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                          {formatIndianCurrency(payment.amount_paid)}
                        </p>
                      </div>
                    </div>

                    {payment.type === 'interest' && payment.shown_interest && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Shown Interest: {formatIndianCurrency(payment.shown_interest)}
                      </div>
                    )}

                    {payment.type === 'redemption' && payment.total_settlement && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Total Settlement: {formatIndianCurrency(payment.total_settlement)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {searchQuery || loanFilter !== 'all' || dateFilter !== 'all'
                    ? 'No payments match your filters'
                    : 'No payment history found'}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </CustomerPortalLayout>
  );
}
