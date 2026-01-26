import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, IndianRupee, TrendingUp, AlertCircle, Receipt, LucideIcon } from 'lucide-react';
import { DashboardStats } from '@/hooks/useDashboardData';
import { Badge } from '@/components/ui/badge';

interface QuickStatsGridProps {
  stats: DashboardStats;
  isLoading?: boolean;
  showLoans?: boolean;
  showSaleAgreements?: boolean;
}

interface StatItem {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  badge?: { text: string; variant: 'destructive' } | null;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
};

export function QuickStatsGrid({ stats, isLoading, showLoans = true, showSaleAgreements = false }: QuickStatsGridProps) {
  // Base stats
  const statItems: StatItem[] = [
    {
      title: 'Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      subtitle: 'Active accounts',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    },
  ];

  // Add Loans stat if enabled
  if (showLoans) {
    statItems.push({
      title: 'Active Loans',
      value: stats.activeLoans.toLocaleString(),
      icon: FileText,
      subtitle: stats.overdueLoans > 0 ? `${stats.overdueLoans} overdue` : 'All on track',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      badge: stats.overdueLoans > 0 ? { text: `${stats.overdueLoans}`, variant: 'destructive' as const } : null,
    });
  }

  // Add Sale Agreements stat if enabled
  if (showSaleAgreements) {
    statItems.push({
      title: 'Active Agreements',
      value: stats.activeSaleAgreements.toLocaleString(),
      icon: Receipt,
      subtitle: stats.overdueSaleAgreements > 0 ? `${stats.overdueSaleAgreements} overdue` : 'All on track',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      badge: stats.overdueSaleAgreements > 0 ? { text: `${stats.overdueSaleAgreements}`, variant: 'destructive' as const } : null,
    });
  }

  // AUM stat
  statItems.push({
    title: 'Total AUM',
    value: formatCurrency(stats.totalAUM),
    icon: IndianRupee,
    subtitle: 'Active portfolio',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
  });

  // Monthly Collection stat
  statItems.push({
    title: 'Monthly Collection',
    value: formatCurrency(stats.monthlyCollection),
    icon: TrendingUp,
    subtitle: showLoans && showSaleAgreements ? 'All payments this month' : showLoans ? 'Interest this month' : 'Margin this month',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-7 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <Card 
          key={stat.title} 
          className={`${stat.bgColor} ${stat.borderColor} border transition-all hover:shadow-md`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.badge && (
                    <Badge variant={stat.badge.variant} className="text-xs px-1.5 py-0">
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                      {stat.badge.text}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
