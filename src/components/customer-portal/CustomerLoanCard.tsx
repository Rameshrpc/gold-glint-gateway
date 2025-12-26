import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { ChevronRight, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface CustomerLoanCardProps {
  loan: any;
}

export function CustomerLoanCard({ loan }: CustomerLoanCardProps) {
  const navigate = useNavigate();

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

  const isOverdue = loan.isOverdue;
  const daysToMaturity = loan.maturity_date 
    ? differenceInDays(new Date(loan.maturity_date), new Date())
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/customer-portal/loan/${loan.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">{loan.loan_number}</span>
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

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="font-semibold">{formatIndianCurrency(loan.principal_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loan Date</p>
            <p className="font-medium">{format(new Date(loan.loan_date), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {loan.status === 'active' && (
          <>
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Interest Due</span>
                <span className="font-semibold text-lg text-amber-600">
                  {formatIndianCurrency(loan.currentInterest?.totalDue || 0)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{loan.daysSinceLastPayment || 0} days since last payment</span>
              </div>
            </div>

            {isOverdue && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/30 rounded-md flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Payment overdue</span>
              </div>
            )}

            {daysToMaturity !== null && daysToMaturity <= 30 && daysToMaturity > 0 && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md flex items-center gap-2 text-amber-600 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Maturity in {daysToMaturity} days</span>
              </div>
            )}
          </>
        )}

        {loan.status === 'closed' && (
          <div className="border-t pt-3 mt-3">
            <p className="text-sm text-muted-foreground">
              Closed on {loan.closed_date ? format(new Date(loan.closed_date), 'dd MMM yyyy') : 'N/A'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
