import { useParams, useNavigate } from 'react-router-dom';
import { CustomerPortalLayout } from '@/components/customer-portal/CustomerPortalLayout';
import { useCustomerLoanDetails } from '@/hooks/useCustomerPortalData';
import { LoanTimeline } from '@/components/customer-portal/LoanTimeline';
import { OutstandingSummaryCard } from '@/components/customer-portal/OutstandingSummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { 
  ArrowLeft, AlertTriangle, RefreshCw, Calendar, Receipt, 
  FileText, Building2, User, Phone, MapPin, Coins, Download
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function CustomerLoanStatement() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCustomerLoanDetails(loanId);

  if (isLoading) {
    return (
      <CustomerPortalLayout title="Loan Statement">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CustomerPortalLayout>
    );
  }

  if (error || !data?.loan) {
    return (
      <CustomerPortalLayout title="Loan Statement">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error || 'Loan not found'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </CustomerPortalLayout>
    );
  }

  const { loan, goldItems, payments, redemption, customer, client } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'closed': return 'bg-slate-500/10 text-slate-600 border-slate-200';
      case 'auctioned': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalGoldWeight = goldItems?.reduce((sum: number, item: any) => sum + (item.net_weight_grams || 0), 0) || 0;
  const totalAppraisedValue = goldItems?.reduce((sum: number, item: any) => sum + (item.appraised_value || 0), 0) || 0;

  // Calculate running balance
  const statementRows: any[] = [];
  let runningBalance = loan.principal_amount;

  // Opening entry
  statementRows.push({
    date: loan.loan_date,
    description: 'Loan Disbursement',
    debit: loan.principal_amount,
    credit: 0,
    balance: runningBalance,
    type: 'disbursement',
  });

  // Add payments in chronological order
  const sortedPayments = [...(payments || [])].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );

  sortedPayments.forEach((payment: any) => {
    statementRows.push({
      date: payment.payment_date,
      description: `Interest Payment - ${payment.receipt_number}`,
      debit: 0,
      credit: payment.amount_paid,
      balance: runningBalance, // Balance doesn't reduce for interest payments
      type: 'interest',
      details: {
        shownInterest: payment.shown_interest,
        periodFrom: payment.period_from,
        periodTo: payment.period_to,
        daysCovered: payment.days_covered,
      },
    });
  });

  // Add redemption if exists
  if (redemption) {
    runningBalance = 0;
    statementRows.push({
      date: redemption.redemption_date,
      description: `Loan Redemption - ${redemption.redemption_number}`,
      debit: 0,
      credit: redemption.amount_received,
      balance: 0,
      type: 'redemption',
      details: {
        totalSettlement: redemption.total_settlement,
      },
    });
  }

  return (
    <CustomerPortalLayout title="Loan Statement">
      <div className="space-y-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Statement Header */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{client?.company_name || 'Gold Loan Company'}</h2>
                <p className="text-sm text-muted-foreground">{loan.branches?.branch_name}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>

            <Separator className="my-4" />

            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">LOAN STATEMENT</h3>
              <p className="text-sm text-muted-foreground">
                Generated on {format(new Date(), 'dd MMMM yyyy')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Loan No:</span>
                  <span className="font-semibold">{loan.loan_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Loan Date:</span>
                  <span className="font-medium">{format(parseISO(loan.loan_date), 'dd/MM/yyyy')}</span>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Badge variant="outline" className={getStatusColor(loan.status)}>
                  {loan.status.toUpperCase()}
                </Badge>
                <div>
                  <span className="text-muted-foreground">Maturity: </span>
                  <span className="font-medium">{format(parseISO(loan.maturity_date), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{customer?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Code</span>
                <span className="font-medium">{customer?.customer_code}</span>
              </div>
              {customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{customer.phone}</span>
                </div>
              )}
              {customer?.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-[60%]">{customer.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Terms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Loan Terms</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Principal Amount</p>
                <p className="font-bold text-lg">{formatIndianCurrency(loan.principal_amount)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Interest Rate</p>
                <p className="font-bold text-lg">{loan.interest_rate}% p.a.</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Tenure</p>
                <p className="font-bold text-lg">{loan.tenure_days} days</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Net Disbursed</p>
                <p className="font-bold text-lg text-primary">{formatIndianCurrency(loan.net_disbursed)}</p>
              </div>
            </div>

            {/* Deductions Breakdown */}
            {(loan.advance_interest_shown > 0 || loan.processing_fee > 0 || loan.document_charges > 0) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Deductions at Disbursement</p>
                <div className="space-y-1 text-sm">
                  {loan.advance_interest_shown > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-300">Advance Interest</span>
                      <span className="font-medium">{formatIndianCurrency(loan.advance_interest_shown)}</span>
                    </div>
                  )}
                  {loan.processing_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-300">Processing Fee</span>
                      <span className="font-medium">{formatIndianCurrency(loan.processing_fee)}</span>
                    </div>
                  )}
                  {loan.document_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-300">Document Charges</span>
                      <span className="font-medium">{formatIndianCurrency(loan.document_charges)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pledged Gold Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4" /> Pledged Ornaments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {goldItems?.map((item: any, index: number) => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                  <div>
                    <span className="font-medium">{item.item_type}</span>
                    <span className="text-muted-foreground ml-2">({item.purity})</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.net_weight_grams?.toFixed(2)}g</p>
                    <p className="text-xs text-muted-foreground">{formatIndianCurrency(item.appraised_value)}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Total ({goldItems?.length || 0} items)</span>
                <div className="text-right">
                  <p>{totalGoldWeight.toFixed(2)}g</p>
                  <p className="text-primary">{formatIndianCurrency(totalAppraisedValue)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Summary - only for active loans */}
        {loan.status === 'active' && loan.currentInterest && (
          <OutstandingSummaryCard loan={loan} />
        )}

        {/* Statement Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium">Debit</th>
                    <th className="text-right py-2 font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {statementRows.map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 text-muted-foreground">
                        {format(parseISO(row.date), 'dd/MM/yy')}
                      </td>
                      <td className="py-3">
                        <p className="font-medium">{row.description}</p>
                        {row.details?.daysCovered && (
                          <p className="text-xs text-muted-foreground">
                            {row.details.daysCovered} days covered
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {row.debit > 0 ? formatIndianCurrency(row.debit) : '-'}
                      </td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">
                        {row.credit > 0 ? formatIndianCurrency(row.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={2} className="py-3">Principal Balance</td>
                    <td className="py-3 text-right" colSpan={2}>
                      {loan.status === 'closed' ? (
                        <span className="text-emerald-600">NIL (Redeemed)</span>
                      ) : (
                        formatIndianCurrency(loan.principal_amount)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Loan Timeline */}
        <LoanTimeline loan={loan} payments={payments} redemption={redemption} />

        {/* Redemption Details */}
        {redemption && (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-700 dark:text-emerald-300">
                ✓ Loan Redeemed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Redemption Date</p>
                  <p className="font-medium">{format(parseISO(redemption.redemption_date), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receipt No</p>
                  <p className="font-medium">{redemption.redemption_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Settlement Amount</p>
                  <p className="font-medium">{formatIndianCurrency(redemption.total_settlement)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-semibold text-emerald-600">{formatIndianCurrency(redemption.amount_received)}</p>
                </div>
              </div>
              {redemption.gold_released && (
                <div className="mt-3 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded text-center text-emerald-700 dark:text-emerald-300 text-sm">
                  Gold ornaments released to customer
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>This is a computer-generated statement.</p>
          <p>For any queries, please contact {client?.phone || 'our branch'}.</p>
        </div>
      </div>
    </CustomerPortalLayout>
  );
}
