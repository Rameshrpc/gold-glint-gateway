import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Calculator, Clock, Wallet } from 'lucide-react';

interface OutstandingSummaryCardProps {
  loan: any;
}

export function OutstandingSummaryCard({ loan }: OutstandingSummaryCardProps) {
  if (!loan.currentInterest) return null;

  const { currentInterest, daysSinceLastPayment } = loan;
  const daysToMaturity = differenceInDays(parseISO(loan.maturity_date), new Date());
  
  // Calculate billable days (excluding advance interest period)
  const advanceInterestMonths = loan.schemes?.advance_interest_months || 1;
  const advanceInterestDays = advanceInterestMonths * 30;
  const billableDays = Math.max(0, (daysSinceLastPayment || 0) - advanceInterestDays);

  const totalToRedeem = 
    (loan.actual_principal || loan.principal_amount) + 
    currentInterest.totalDue;

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Calculator className="h-4 w-4" /> Outstanding Summary
          </CardTitle>
          {loan.isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Days Breakdown */}
          <div className="flex items-center justify-between text-sm p-2 bg-white/50 dark:bg-black/20 rounded">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Days Since Payment</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{daysSinceLastPayment || 0} days</span>
              {billableDays < daysSinceLastPayment && (
                <p className="text-xs text-muted-foreground">
                  ({billableDays} billable after {advanceInterestDays}d advance)
                </p>
              )}
            </div>
          </div>

          {/* Interest Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-amber-200/50">
              <span className="text-muted-foreground">Principal Outstanding</span>
              <span className="font-medium">{formatIndianCurrency(loan.actual_principal || loan.principal_amount)}</span>
            </div>
            
            <div className="flex justify-between py-1 border-b border-amber-200/50">
              <span className="text-muted-foreground">Interest @ {loan.schemes?.shown_rate || loan.interest_rate}%</span>
              <span className="font-medium">{formatIndianCurrency(currentInterest.shownInterest)}</span>
            </div>
            
            {/* Differential Interest hidden from customers - internal accounting only */}
            
            {currentInterest.penalty > 0 && (
              <div className="flex justify-between py-1 border-b border-amber-200/50 text-red-600 dark:text-red-400">
                <span>Penalty</span>
                <span className="font-medium">{formatIndianCurrency(currentInterest.penalty)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 font-semibold text-amber-800 dark:text-amber-200">
              <span>Interest Due Today</span>
              <span className="text-lg">{formatIndianCurrency(currentInterest.totalDue)}</span>
            </div>
          </div>

          {/* Total to Redeem */}
          <div className="p-3 bg-white/70 dark:bg-black/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                <span className="font-semibold text-amber-800 dark:text-amber-200">Total to Redeem</span>
              </div>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {formatIndianCurrency(totalToRedeem)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Principal + Interest (as of today)
            </p>
          </div>

          {/* Maturity Warning */}
          {daysToMaturity > 0 && daysToMaturity <= 30 && (
            <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded text-amber-700 dark:text-amber-300 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {daysToMaturity === 1 
                  ? 'Loan matures tomorrow!' 
                  : `${daysToMaturity} days remaining to maturity`}
              </span>
            </div>
          )}

          {daysToMaturity <= 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/50 rounded text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Loan has crossed maturity date. Please redeem soon.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
