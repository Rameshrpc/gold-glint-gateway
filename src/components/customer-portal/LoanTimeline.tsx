import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { format, parseISO, differenceInDays } from 'date-fns';
import { 
  CircleDot, CheckCircle2, Clock, AlertTriangle, 
  Banknote, Receipt, ArrowRight 
} from 'lucide-react';

interface LoanTimelineProps {
  loan: any;
  payments?: any[];
  redemption?: any;
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'loan' | 'payment' | 'maturity' | 'redemption' | 'warning';
  amount?: number;
}

export function LoanTimeline({ loan, payments = [], redemption }: LoanTimelineProps) {
  // Build timeline events
  const events: TimelineEvent[] = [];

  // Loan creation
  events.push({
    id: 'loan-created',
    date: loan.loan_date,
    title: 'Loan Created',
    description: `Principal: ${formatIndianCurrency(loan.principal_amount)}`,
    type: 'loan',
    amount: loan.net_disbursed,
  });

  // Payment events
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );

  sortedPayments.forEach((payment, index) => {
    events.push({
      id: `payment-${payment.id}`,
      date: payment.payment_date,
      title: `Interest Payment ${index + 1}`,
      description: payment.receipt_number,
      type: 'payment',
      amount: payment.amount_paid,
    });
  });

  // Maturity warning (if approaching)
  const daysToMaturity = differenceInDays(parseISO(loan.maturity_date), new Date());
  if (loan.status === 'active' && daysToMaturity <= 30 && daysToMaturity > 0) {
    events.push({
      id: 'maturity-warning',
      date: loan.maturity_date,
      title: 'Maturity Due',
      description: `${daysToMaturity} days remaining`,
      type: 'warning',
    });
  }

  // Maturity date (for closed loans)
  if (loan.status === 'closed' || loan.status === 'auctioned') {
    events.push({
      id: 'maturity',
      date: loan.maturity_date,
      title: 'Maturity Date',
      type: 'maturity',
    });
  }

  // Redemption
  if (redemption) {
    events.push({
      id: 'redemption',
      date: redemption.redemption_date,
      title: 'Loan Redeemed',
      description: 'Gold released',
      type: 'redemption',
      amount: redemption.amount_received,
    });
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'loan':
        return <Banknote className="h-4 w-4" />;
      case 'payment':
        return <Receipt className="h-4 w-4" />;
      case 'maturity':
        return <Clock className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'redemption':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <CircleDot className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'loan':
        return 'bg-primary text-primary-foreground';
      case 'payment':
        return 'bg-emerald-500 text-white';
      case 'maturity':
        return 'bg-slate-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      case 'redemption':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLineColor = (type: TimelineEvent['type'], nextType?: TimelineEvent['type']) => {
    if (type === 'redemption') return 'bg-blue-200';
    if (nextType === 'warning') return 'bg-amber-200';
    return 'bg-border';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Loan Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                {index < events.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-2 ${getLineColor(event.type, events[index + 1]?.type)}`} />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.date), 'dd MMM yyyy')}
                    </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                  </div>
                  {event.amount !== undefined && (
                    <span className={`font-semibold ${
                      event.type === 'loan' ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatIndianCurrency(event.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Current status indicator for active loans */}
          {loan.status === 'active' && !redemption && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-primary/50" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Loan Active</p>
                <p className="text-xs text-muted-foreground">
                  {daysToMaturity > 0 
                    ? `${daysToMaturity} days to maturity`
                    : 'Past maturity date'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
