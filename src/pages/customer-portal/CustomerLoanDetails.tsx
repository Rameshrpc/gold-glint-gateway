import { useParams, useNavigate } from 'react-router-dom';
import { CustomerPortalLayout } from '@/components/customer-portal/CustomerPortalLayout';
import { useCustomerLoanDetails } from '@/hooks/useCustomerPortalData';
import { CustomerPaymentHistory } from '@/components/customer-portal/CustomerPaymentHistory';
import { CustomerInterestDue } from '@/components/customer-portal/CustomerInterestDue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { ArrowLeft, AlertTriangle, RefreshCw, Calendar, Coins, Scale, Receipt } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function CustomerLoanDetails() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCustomerLoanDetails(loanId);

  if (isLoading) {
    return (
      <CustomerPortalLayout title="Loan Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </CustomerPortalLayout>
    );
  }

  if (error) {
    return (
      <CustomerPortalLayout title="Loan Details">
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

  const { loan, goldItems, payments } = data || {};

  if (!loan) {
    return (
      <CustomerPortalLayout title="Loan Details">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Loan not found</p>
          <Button onClick={() => navigate('/customer-portal/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </CustomerPortalLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'closed':
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
      case 'auctioned':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const daysToMaturity = loan.maturity_date
    ? differenceInDays(new Date(loan.maturity_date), new Date())
    : null;

  const totalGoldWeight = goldItems?.reduce((sum: number, item: any) => sum + (item.net_weight_grams || 0), 0) || 0;
  const totalAppraisedValue = goldItems?.reduce((sum: number, item: any) => sum + (item.appraised_value || 0), 0) || 0;

  return (
    <CustomerPortalLayout title="Loan Details">
      <div className="space-y-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer-portal/dashboard')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Loan Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xl">{loan.loan_number}</span>
                  <Badge variant="outline" className={getStatusColor(loan.status)}>
                    {loan.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {loan.branches?.branch_name || 'Branch'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Loan Date</p>
                  <p className="font-medium">{format(new Date(loan.loan_date), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Maturity Date</p>
                  <p className="font-medium">{format(new Date(loan.maturity_date), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>

            {daysToMaturity !== null && daysToMaturity <= 30 && daysToMaturity > 0 && loan.status === 'active' && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Maturity in {daysToMaturity} days - Please plan for redemption or renewal</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Amount Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Principal Amount</span>
                <span className="font-semibold text-lg">{formatIndianCurrency(loan.principal_amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-medium">{loan.interest_rate}% p.a.</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Tenure</span>
                <span className="font-medium">{loan.tenure_days} days</span>
              </div>
              {loan.processing_fee > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">{formatIndianCurrency(loan.processing_fee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Net Disbursed</span>
                <span className="font-semibold text-primary">{formatIndianCurrency(loan.net_disbursed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Due - Only for active loans */}
        {loan.status === 'active' && loan.currentInterest && (
          <CustomerInterestDue loan={loan} />
        )}

        {/* Gold Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4" /> Pledged Ornaments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {goldItems && goldItems.length > 0 ? (
              <div className="space-y-3">
                {goldItems.map((item: any, index: number) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{item.item_type}</span>
                      <Badge variant="outline">{item.purity}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Gross Weight</p>
                        <p className="font-medium">{item.gross_weight_grams?.toFixed(2)} g</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Weight</p>
                        <p className="font-medium">{item.net_weight_grams?.toFixed(2)} g</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rate/gram</p>
                        <p className="font-medium">{formatIndianCurrency(item.market_rate_per_gram)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Appraised Value</p>
                        <p className="font-medium">{formatIndianCurrency(item.appraised_value)}</p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="font-medium">Total Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Items</p>
                      <p className="font-semibold">{goldItems.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Net Weight</p>
                      <p className="font-semibold">{totalGoldWeight.toFixed(2)} g</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Total Appraised Value</p>
                      <p className="font-semibold text-lg text-primary">{formatIndianCurrency(totalAppraisedValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No gold items found</p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <CustomerPaymentHistory payments={payments || []} />

        {/* Redemption Info - if closed */}
        {loan.status === 'closed' && data?.redemption && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Redemption Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Redemption Date</span>
                  <span>{format(new Date(data.redemption.redemption_date), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Settlement</span>
                  <span className="font-medium">{formatIndianCurrency(data.redemption.total_settlement)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-emerald-600">{formatIndianCurrency(data.redemption.amount_received)}</span>
                </div>
                {data.redemption.gold_released && (
                  <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded text-emerald-600 text-center">
                    ✓ Gold Released
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerPortalLayout>
  );
}
