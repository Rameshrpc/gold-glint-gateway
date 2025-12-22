import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBackfillVouchers } from '@/hooks/useBackfillVouchers';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  FileText, 
  Banknote, 
  RefreshCw, 
  Award, 
  TrendingUp, 
  Users,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { cn } from '@/lib/utils';
import { vibrateLight } from '@/lib/haptics';

interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalDisbursed: number;
  interestCollected: number;
}

interface RecentActivity {
  id: string;
  type: 'loan' | 'interest' | 'redemption';
  amount: number;
  description: string;
  date: string;
  customerName?: string;
}

export default function MobileDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { autoSync, syncStatus } = useBackfillVouchers();
  const hasAutoSynced = useRef(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    interestCollected: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-sync vouchers on mount
  useEffect(() => {
    if (profile?.client_id && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      autoSync(profile.client_id).then((result) => {
        if (result.synced > 0 && result.pending === 0) {
          toast.success(`${result.synced} accounting entries synced`);
        }
      });
    }
  }, [profile?.client_id, autoSync]);

  // Fetch dashboard stats and recent activity
  const fetchData = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const [customersRes, loansRes, interestRes, recentLoansRes, recentInterestRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('client_id', profile.client_id)
          .eq('is_active', true),
        supabase
          .from('loans')
          .select('id, principal_amount, status')
          .eq('client_id', profile.client_id),
        supabase
          .from('interest_payments')
          .select('amount_paid')
          .eq('client_id', profile.client_id),
        // Recent loans with customer info
        supabase
          .from('loans')
          .select('id, loan_number, principal_amount, loan_date, customer:customers(full_name)')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
          .limit(5),
        // Recent interest payments
        supabase
          .from('interest_payments')
          .select('id, receipt_number, amount_paid, payment_date, loan:loans(loan_number, customer:customers(full_name))')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const activeLoans = loansRes.data?.filter(l => l.status === 'active') || [];
      const totalDisbursed = activeLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
      const interestCollected = interestRes.data?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      setStats({
        totalCustomers: customersRes.count || 0,
        activeLoans: activeLoans.length,
        totalDisbursed,
        interestCollected,
      });

      // Combine and sort recent activity
      const activities: RecentActivity[] = [];
      
      recentLoansRes.data?.forEach(loan => {
        activities.push({
          id: loan.id,
          type: 'loan',
          amount: loan.principal_amount,
          description: `New Loan ${loan.loan_number}`,
          date: loan.loan_date,
          customerName: (loan.customer as any)?.full_name,
        });
      });

      recentInterestRes.data?.forEach(payment => {
        activities.push({
          id: payment.id,
          type: 'interest',
          amount: payment.amount_paid,
          description: `Interest ${payment.receipt_number}`,
          date: payment.payment_date,
          customerName: (payment.loan as any)?.customer?.full_name,
        });
      });

      // Sort by date descending and take top 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  const quickActions = [
    { icon: FileText, label: 'New Loan', path: '/new-loan', gradient: 'from-blue-500 to-blue-600' },
    { icon: Banknote, label: 'Interest', path: '/interest', gradient: 'from-emerald-500 to-emerald-600' },
    { icon: Award, label: 'Redeem', path: '/redemption', gradient: 'from-amber-500 to-orange-500' },
    { icon: RefreshCw, label: 'Reloan', path: '/reloan', gradient: 'from-violet-500 to-purple-600' },
  ];

  const statItems = [
    { 
      icon: FileText, 
      label: 'Active Loans', 
      value: stats.activeLoans,
      gradient: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-500'
    },
    { 
      icon: Users, 
      label: 'Customers', 
      value: stats.totalCustomers,
      gradient: 'from-violet-500/20 to-purple-600/20',
      iconColor: 'text-violet-500'
    },
    { 
      icon: Wallet, 
      label: 'Disbursed', 
      value: `₹${(stats.totalDisbursed / 100000).toFixed(1)}L`,
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      iconColor: 'text-emerald-500'
    },
    { 
      icon: TrendingUp, 
      label: 'Interest', 
      value: `₹${(stats.interestCollected / 1000).toFixed(0)}K`,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-500'
    },
  ];

  return (
    <MobileLayout>
      <MobileGradientHeader showSearch onSearchClick={() => { vibrateLight(); navigate('/loans'); }} />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 -mt-2 space-y-6 animate-fade-in">
        {/* Hero Balance Card */}
        <div className="relative overflow-hidden rounded-3xl glass shadow-mobile-lg border border-border/50">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[hsl(var(--gradient-primary-start))] to-[hsl(var(--gradient-primary-end))] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground font-medium">Total Portfolio</span>
              <button 
                onClick={() => navigate('/trial-balance')}
                className="text-xs font-medium text-primary flex items-center gap-1 tap-scale"
              >
                View Details
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="mb-5">
              <h2 className="text-3xl font-bold tracking-tight">
                ₹{((stats.totalDisbursed + stats.interestCollected) / 100000).toFixed(2)}L
              </h2>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-xl bg-muted/50">
                <p className="text-lg font-bold">{stats.activeLoans}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Loans</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-muted/50">
                <p className="text-lg font-bold">₹{(stats.interestCollected / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground font-medium">Interest</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-muted/50">
                <p className="text-lg font-bold">{stats.totalCustomers}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Customers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={action.path}
                onClick={() => { vibrateLight(); navigate(action.path); }}
                className="flex flex-col items-center gap-2 tap-scale animate-slide-up-fade"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-mobile-md",
                  action.gradient
                )}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-base font-semibold mb-3">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "relative overflow-hidden p-4 rounded-2xl bg-card border border-border shadow-mobile-sm animate-slide-up-fade"
                )}
                style={{ animationDelay: `${index * 50 + 200}ms` }}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", item.gradient)} />
                <div className="relative">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-background/80 mb-2", item.iconColor)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Recent Activity</h2>
            <button 
              onClick={() => navigate('/day-book')}
              className="text-xs text-primary font-medium flex items-center gap-1 tap-scale"
            >
              View All
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl shimmer" />
              ))
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl bg-muted/30 border border-border/50">
                <Activity className="w-10 h-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Recent transactions will appear here
                </p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-mobile-sm animate-slide-up-fade"
                  style={{ animationDelay: `${index * 50 + 400}ms` }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    activity.type === 'loan' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    activity.type === 'interest' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  )}>
                    {activity.type === 'loan' ? (
                      <ArrowDownRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : activity.type === 'interest' ? (
                      <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.customerName || 'Customer'} • {format(new Date(activity.date), 'dd MMM')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold",
                      activity.type === 'loan' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {activity.type === 'loan' ? '-' : '+'}₹{(activity.amount / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </PullToRefreshContainer>
    </MobileLayout>
  );
}
