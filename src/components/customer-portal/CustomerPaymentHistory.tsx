import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { format } from 'date-fns';
import { Receipt, Calendar } from 'lucide-react';

interface CustomerPaymentHistoryProps {
  payments: any[];
  showTitle?: boolean;
}

export function CustomerPaymentHistory({ payments, showTitle = true }: CustomerPaymentHistoryProps) {
  if (!payments || payments.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Recent Payments
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No payment history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Recent Payments
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-4">
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{payment.receipt_number}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600">
                  {formatIndianCurrency(payment.amount_paid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Interest: {formatIndianCurrency(payment.shown_interest)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
