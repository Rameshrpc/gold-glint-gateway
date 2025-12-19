import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function ApprovalBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: ApprovalBadgeProps) {
  const config = {
    pending: {
      label: 'Pending Approval',
      variant: 'outline' as const,
      icon: Clock,
      className: 'border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20'
    },
    pending_l1: {
      label: 'Awaiting L2',
      variant: 'outline' as const,
      icon: Clock,
      className: 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
    },
    approved: {
      label: 'Approved',
      variant: 'outline' as const,
      icon: CheckCircle2,
      className: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
    },
    rejected: {
      label: 'Rejected',
      variant: 'outline' as const,
      icon: XCircle,
      className: 'border-destructive/50 text-destructive bg-destructive/10'
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'outline' as const,
      icon: AlertCircle,
      className: 'border-muted-foreground/50 text-muted-foreground bg-muted/50'
    },
    draft: {
      label: 'Draft',
      variant: 'outline' as const,
      icon: AlertCircle,
      className: 'border-muted-foreground/50 text-muted-foreground bg-muted/50'
    }
  };

  const statusConfig = config[status as keyof typeof config] || config.pending;
  const Icon = statusConfig.icon;

  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-3'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <Badge
      variant={statusConfig.variant}
      className={cn(
        sizeClasses[size],
        statusConfig.className,
        'font-medium',
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {statusConfig.label}
    </Badge>
  );
}
