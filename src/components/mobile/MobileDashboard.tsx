import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBackfillVouchers } from '@/hooks/useBackfillVouchers';
import { toast } from 'sonner';
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
  ArrowDownRight
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalDisbursed: number;
  interestCollected: number;
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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.client_id) return;

      try {
        const [customersRes, loansRes, interestRes] = await Promise.all([
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
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [profile?.client_id]);

  const quickActions = [
    { icon: FileText, label: 'New Loan', path: '/loans', gradient: 'from-blue-500 to-blue-600' },
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
      <MobileGradientHeader showSearch onSearchClick={() => navigate('/loans')} />

      <div className="px-4 -mt-2 space-y-6 animate-fade-in">
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
                onClick={() => navigate(action.path)}
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
          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl shimmer" />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl bg-muted/30 border border-border/50">
                <Activity className="w-10 h-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Recent transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </MobileLayout>
  );
}
