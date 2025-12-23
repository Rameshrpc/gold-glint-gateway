import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'default';
  };
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
  }>;
  onClick?: () => void;
  accentColor?: 'gold' | 'success' | 'warning' | 'error' | 'default';
  children?: ReactNode;
  className?: string;
}

const badgeStyles = {
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  default: 'bg-muted text-muted-foreground',
};

const actionStyles = {
  primary: 'text-primary active:bg-primary/10',
  secondary: 'text-muted-foreground active:bg-muted',
  success: 'text-emerald-600 dark:text-emerald-400 active:bg-emerald-50 dark:active:bg-emerald-900/20',
  warning: 'text-amber-600 dark:text-amber-400 active:bg-amber-50 dark:active:bg-amber-900/20',
};

export default function MobileDataCard({
  title,
  subtitle,
  icon,
  badge,
  stats,
  actions,
  onClick,
  children,
  className,
}: MobileDataCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border overflow-hidden',
        onClick && 'active:bg-muted/50 cursor-pointer',
        className
      )}
    >
      {/* Main content */}
      <div
        className="p-3"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-sm truncate">{title}</h3>
                {badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      badgeStyles[badge.variant]
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
              {children && <div className="mt-2">{children}</div>}
            </div>
          </div>
          {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />}
        </div>

        {/* Stats grid */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-sm font-semibold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {actions && actions.length > 0 && (
        <div className="flex border-t border-border">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                actionStyles[action.variant || 'primary'],
                index !== actions.length - 1 && 'border-r border-border'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
