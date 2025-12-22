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

const accentStyles = {
  gold: 'bg-gradient-to-r from-[hsl(var(--gradient-primary-start))] to-[hsl(var(--gradient-primary-end))]',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
  error: 'bg-gradient-to-r from-red-500 to-rose-500',
  default: 'bg-gradient-to-r from-gray-400 to-gray-500',
};

const actionStyles = {
  primary: 'text-primary hover:bg-primary/10',
  secondary: 'text-muted-foreground hover:bg-muted',
  success: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  warning: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
};

export default function MobileDataCard({
  title,
  subtitle,
  icon,
  badge,
  stats,
  actions,
  onClick,
  accentColor = 'gold',
  children,
  className,
}: MobileDataCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-card rounded-2xl border border-border shadow-mobile-sm transition-all duration-200',
        onClick && 'tap-scale cursor-pointer',
        className
      )}
    >
      {/* Accent line */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', accentStyles[accentColor])} />

      {/* Main content */}
      <div
        className={cn('p-4 pt-5', onClick && 'cursor-pointer')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-semibold text-base truncate">{title}</h3>
                {badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      badgeStyles[badge.variant]
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
        </div>

        {/* Stats grid */}
        {stats && stats.length > 0 && (
          <div className={cn('grid gap-2 mb-3', stats.length <= 3 ? `grid-cols-${stats.length}` : 'grid-cols-3')}>
            {stats.map((stat, index) => (
              <div key={index} className="bg-muted/50 rounded-xl p-2.5 text-center">
                <p className="text-base font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Custom children */}
        {children}
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
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors tap-scale',
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
