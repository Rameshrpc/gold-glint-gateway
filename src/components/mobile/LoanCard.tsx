import { ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
}

export default function LoanCard({ loan, onClick, onInterestClick, onRedeemClick }: LoanCardProps) {
  const totalGoldWeight = loan.gold_items?.reduce((sum, item) => sum + (item.net_weight_grams || 0), 0) || 0;
  const isOverdue = new Date(loan.maturity_date) < new Date() && loan.status === 'active';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'defaulted': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-200",
        "active:scale-[0.98] animate-fade-in",
        isOverdue && "border-destructive/50"
      )}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold">{loan.loan_number}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
                getStatusColor(loan.status)
              )}>
                {loan.status}
              </span>
            </div>
            <p className="text-base font-medium line-clamp-1">
              {loan.customer?.full_name || 'Unknown Customer'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="text-sm font-semibold">₹{loan.principal_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gold Weight</p>
            <p className="text-sm font-semibold">{totalGoldWeight.toFixed(2)}g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Interest Rate</p>
            <p className="text-sm font-semibold">{loan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className={cn(
              "text-sm font-semibold flex items-center gap-1",
              isOverdue && "text-destructive"
            )}>
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              {format(new Date(loan.maturity_date), 'dd MMM yy')}
            </p>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Opened {format(new Date(loan.loan_date), 'dd MMM yyyy')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {loan.status === 'active' && (
        <div className="flex border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterestClick?.();
            }}
            className="flex-1 py-3 text-sm font-medium text-primary hover:bg-accent active:bg-accent/80 transition-colors"
          >
            Pay Interest
          </button>
          <div className="w-px bg-border" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRedeemClick?.();
            }}
            className="flex-1 py-3 text-sm font-medium text-primary hover:bg-accent active:bg-accent/80 transition-colors"
          >
            Redeem
          </button>
        </div>
      )}
    </div>
  );
}
