import { Phone, Calendar, Banknote, Award, ChevronRight, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';

interface LoanCardProps {
  loan: {
    id: string;
    loan_number: string;
    principal_amount: number;
    status: string;
    loan_date: string;
    maturity_date: string;
    interest_rate: number;
    customer?: {
      full_name: string;
      phone: string;
    };
    gold_items?: Array<{
      net_weight_grams: number;
    }>;
  };
  onClick: () => void;
  onInterestClick?: () => void;
  onRedeemClick?: () => void;
  onPrintClick?: () => void;
}

export default function LoanCard({ loan, onClick, onInterestClick, onRedeemClick, onPrintClick }: LoanCardProps) {
  const totalGold = loan.gold_items?.reduce((sum, item) => sum + item.net_weight_grams, 0) || 0;
  const isOverdue = loan.status === 'active' && isPast(new Date(loan.maturity_date));
  const daysRemaining = differenceInDays(new Date(loan.maturity_date), new Date());
  
  // Calculate progress (0-100)
  const totalDays = differenceInDays(new Date(loan.maturity_date), new Date(loan.loan_date));
  const elapsedDays = differenceInDays(new Date(), new Date(loan.loan_date));
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const getStatusConfig = () => {
    if (loan.status === 'closed') return { 
      label: 'Closed', 
      bg: 'bg-muted', 
      text: 'text-muted-foreground',
    };
    if (isOverdue) return { 
      label: 'Overdue', 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-600 dark:text-red-400',
    };
    return { 
      label: 'Active', 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  };

  const status = getStatusConfig();

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-card rounded-2xl border shadow-mobile-sm transition-all duration-200 tap-scale",
        isOverdue ? "border-red-200 dark:border-red-900/50" : "border-border"
      )}
    >
      {/* Gradient accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        isOverdue 
          ? "bg-gradient-to-r from-red-500 to-rose-500" 
          : loan.status === 'closed'
            ? "bg-gradient-to-r from-gray-400 to-gray-500"
            : "bg-gradient-to-r from-[hsl(var(--gradient-primary-start))] to-[hsl(var(--gradient-primary-end))]"
      )} />

      {/* Main content - clickable */}
      <button onClick={onClick} className="w-full text-left p-4 pt-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm">{loan.loan_number}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                status.bg, status.text
              )}>
                {status.label}
              </span>
            </div>
            <h3 className="font-semibold text-base truncate">
              {loan.customer?.full_name || 'Unknown Customer'}
            </h3>
            {loan.customer?.phone && (
              <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{loan.customer.phone}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-muted/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">₹{(loan.principal_amount / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-muted-foreground font-medium">Principal</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">{totalGold.toFixed(1)}g</p>
            <p className="text-[10px] text-muted-foreground font-medium">Gold</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">{loan.interest_rate}%</p>
            <p className="text-[10px] text-muted-foreground font-medium">Interest</p>
          </div>
        </div>

        {/* Progress bar (only for active loans) */}
        {loan.status === 'active' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tenure Progress</span>
              <span className={cn(
                "font-medium",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}>
                {isOverdue 
                  ? `${Math.abs(daysRemaining)} days overdue` 
                  : `${daysRemaining} days left`
                }
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isOverdue 
                    ? "bg-red-500" 
                    : progress > 75 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Due date */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due: {format(new Date(loan.maturity_date), 'dd MMM yyyy')}</span>
        </div>
      </button>

      {/* Action buttons */}
      {loan.status === 'active' && (
        <div className="flex border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterestClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors tap-scale border-r border-border"
          >
            <Banknote className="w-4 h-4" />
            Interest
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRedeemClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors tap-scale border-r border-border"
          >
            <Award className="w-4 h-4" />
            Redeem
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors tap-scale"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      )}
    </div>
  );
}
