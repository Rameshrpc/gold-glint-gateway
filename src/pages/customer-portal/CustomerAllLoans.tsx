import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerPortalLayout } from '@/components/customer-portal/CustomerPortalLayout';
import { useCustomerPortalData } from '@/hooks/useCustomerPortalData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { 
  AlertTriangle, RefreshCw, Search, CreditCard, 
  Calendar, ChevronRight, Wallet, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

type LoanStatus = 'all' | 'active' | 'closed' | 'auctioned';

export default function CustomerAllLoans() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCustomerPortalData();
  const [statusFilter, setStatusFilter] = useState<LoanStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <CustomerPortalLayout title="My Loans">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </CustomerPortalLayout>
    );
  }

  if (error) {
    return (
      <CustomerPortalLayout title="My Loans">
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

  const { summary, loans = [] } = data || {};

  // Filter loans
  const filteredLoans = loans.filter((loan: any) => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesSearch = loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate totals
  const activeLoans = loans.filter((l: any) => l.status === 'active');
  const closedLoans = loans.filter((l: any) => l.status === 'closed');
  const totalPrincipal = activeLoans.reduce((sum: number, l: any) => sum + (l.principal_amount || 0), 0);
  const totalInterestPaid = loans.reduce((sum: number, l: any) => sum + (l.total_interest_paid || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400';
      case 'closed':
        return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400';
      case 'auctioned':
        return 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <CustomerPortalLayout title="My Loans">
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Loans</p>
                  <p className="text-xl font-bold">{activeLoans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Closed Loans</p>
                  <p className="text-xl font-bold">{closedLoans.length}</p>
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
                  <p className="text-xs text-muted-foreground">Total Principal</p>
                  <p className="text-lg font-bold">{formatIndianCurrency(totalPrincipal)}</p>
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
                  <p className="text-xs text-muted-foreground">Interest Paid</p>
                  <p className="text-lg font-bold">{formatIndianCurrency(totalInterestPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by loan number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as LoanStatus)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="auctioned">Auctioned</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {filteredLoans.length > 0 ? (
            filteredLoans.map((loan: any) => {
              const daysToMaturity = loan.maturity_date
                ? differenceInDays(new Date(loan.maturity_date), new Date())
                : null;

              return (
                <Card
                  key={loan.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/customer-portal/loan/${loan.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{loan.loan_number}</span>
                          <Badge variant="outline" className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {loan.branches?.branch_name || 'Branch'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Principal</p>
                        <p className="font-semibold">{formatIndianCurrency(loan.principal_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rate</p>
                        <p className="font-semibold">{loan.interest_rate}% p.a.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Loan Date</span>
                      </div>
                      <div>
                        <p className="font-medium">{format(new Date(loan.loan_date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>

                    {/* Interest Due for Active Loans */}
                    {loan.status === 'active' && loan.currentInterest && (
                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Interest Due</p>
                          <p className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatIndianCurrency(loan.currentInterest.totalDue)}
                          </p>
                        </div>
                        {daysToMaturity !== null && daysToMaturity <= 30 && daysToMaturity > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                            {daysToMaturity} days to maturity
                          </Badge>
                        )}
                      </div>
                    )}

                    {loan.isOverdue && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Payment overdue</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No loans match your search' : 'No loans found'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CustomerPortalLayout>
  );
}
