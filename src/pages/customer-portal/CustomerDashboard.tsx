import { CustomerPortalLayout } from '@/components/customer-portal/CustomerPortalLayout';
import { useCustomerPortalData } from '@/hooks/useCustomerPortalData';
import { CustomerLoanCard } from '@/components/customer-portal/CustomerLoanCard';
import { CustomerPaymentHistory } from '@/components/customer-portal/CustomerPaymentHistory';
import { InterestCalculator } from '@/components/customer-portal/InterestCalculator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { Wallet, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerDashboard() {
  const { data, isLoading, error, refetch } = useCustomerPortalData();

  if (isLoading) {
    return (
      <CustomerPortalLayout title="Dashboard">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </CustomerPortalLayout>
    );
  }

  if (error) {
    return (
      <CustomerPortalLayout title="Dashboard">
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

  const { summary, loans, recentPayments, customer, client } = data || {};

  return (
    <CustomerPortalLayout title={`Welcome, ${customer?.full_name?.split(' ')[0] || 'Customer'}`}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Loans</p>
                  <p className="text-xl font-bold">{summary?.totalActiveLoans || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest Due</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatIndianCurrency(summary?.totalInterestDue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {summary?.overdueLoansCount ? (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">
                You have {summary.overdueLoansCount} overdue loan(s). Please make payment soon.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Interest Calculator */}
        <InterestCalculator defaultInterestRate={1.5} />

        {/* Active Loans */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Loans</h2>
          {loans && loans.length > 0 ? (
            <div className="space-y-3">
              {loans.filter((l: any) => l.status === 'active').map((loan: any) => (
                <CustomerLoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No active loans</CardContent></Card>
          )}
        </div>

        {/* Recent Payments */}
        <CustomerPaymentHistory payments={recentPayments || []} />
      </div>
    </CustomerPortalLayout>
  );
}
