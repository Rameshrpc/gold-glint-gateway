import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  className?: string;
}

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend, 
  color = 'bg-primary/10 text-primary',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "flex-shrink-0 w-[140px] p-4 rounded-2xl bg-card border border-border shadow-sm",
      "transition-all duration-200 active:scale-95",
      className
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
        color
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{label}</p>
      {subValue && (
        <p className={cn(
          "text-xs mt-1 font-medium",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-destructive",
          trend === 'neutral' && "text-muted-foreground"
        )}>
          {subValue}
        </p>
      )}
    </div>
  );
}
