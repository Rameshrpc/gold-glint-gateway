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
  Activity
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileHeader from './MobileHeader';
import StatCard from './StatCard';
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
    { icon: FileText, label: 'New Loan', path: '/loans', color: 'bg-blue-500' },
    { icon: Banknote, label: 'Interest', path: '/interest', color: 'bg-green-500' },
    { icon: Award, label: 'Redeem', path: '/redemption', color: 'bg-amber-500' },
    { icon: RefreshCw, label: 'Reloan', path: '/reloan', color: 'bg-purple-500' },
  ];

  return (
    <MobileLayout>
      <MobileHeader />

      <div className="px-4 py-4 space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {syncStatus.status === 'syncing' ? 'Syncing entries...' : 'Here\'s your business overview'}
          </p>
        </div>

        {/* Stats Carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <StatCard
            icon={FileText}
            label="Active Loans"
            value={stats.activeLoans}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            icon={Users}
            label="Customers"
            value={stats.totalCustomers}
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatCard
            icon={Wallet}
            label="Disbursed"
            value={`₹${(stats.totalDisbursed / 100000).toFixed(1)}L`}
            color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Interest"
            value={`₹${(stats.interestCollected / 1000).toFixed(0)}K`}
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border",
                  "active:scale-95 transition-all duration-200 animate-scale-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-white",
                  action.color
                )}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button 
              onClick={() => navigate('/day-book')}
              className="text-sm text-primary font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Recent transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
