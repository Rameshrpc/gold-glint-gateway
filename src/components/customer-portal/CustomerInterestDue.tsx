import { Card, CardContent } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { AlertTriangle, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerInterestDueProps {
  loan: any;
}

export function CustomerInterestDue({ loan }: CustomerInterestDueProps) {
  if (!loan || loan.status !== 'active' || !loan.currentInterest) {
    return null;
  }

  const { currentInterest, daysSinceLastPayment, isOverdue, next_interest_due_date } = loan;

  return (
    <Card className={isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Interest Due
            </h3>
            <p className="text-sm text-muted-foreground">
              As of {format(new Date(), 'dd MMM yyyy')}
            </p>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Days Since Last Payment</span>
            <span className="font-medium">{daysSinceLastPayment || 0} days</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Interest Amount</span>
            <span className="font-medium">{formatIndianCurrency(currentInterest.shownInterest)}</span>
          </div>

          {currentInterest.differential > 0 && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Part Payment</span>
              <span className="font-medium">{formatIndianCurrency(currentInterest.differential)}</span>
            </div>
          )}

          {currentInterest.penalty > 0 && (
            <div className="flex justify-between items-center py-2 border-b text-red-600">
              <span className="text-sm">Penalty</span>
              <span className="font-medium">{formatIndianCurrency(currentInterest.penalty)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3">
            <span className="font-semibold">Total Due</span>
            <span className="font-bold text-xl text-amber-600">
              {formatIndianCurrency(currentInterest.totalDue)}
            </span>
          </div>
        </div>

        {next_interest_due_date && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Next due date: {format(new Date(next_interest_due_date), 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
