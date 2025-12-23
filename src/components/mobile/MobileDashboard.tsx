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
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bell
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { cn } from '@/lib/utils';

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
  const { autoSync } = useBackfillVouchers();
  const hasAutoSynced = useRef(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    interestCollected: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
        supabase
          .from('loans')
          .select('id, loan_number, principal_amount, loan_date, customer:customers(full_name)')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
          .limit(5),
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
    { icon: FileText, label: 'New Loan', path: '/new-loan' },
    { icon: Banknote, label: 'Interest', path: '/interest' },
    { icon: Award, label: 'Redeem', path: '/redemption' },
    { icon: RefreshCw, label: 'Reloan', path: '/reloan' },
  ];

  return (
    <MobileLayout>
      <MobileSimpleHeader 
        title={`${getGreeting()}, ${firstName}`}
        rightContent={
          <button 
            onClick={() => navigate('/notifications')}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Active Loans</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeLoans}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Customers</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Disbursed</span>
            </div>
            <p className="text-2xl font-bold">₹{(stats.totalDisbursed / 100000).toFixed(1)}L</p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Interest</span>
            </div>
            <p className="text-2xl font-bold">₹{(stats.interestCollected / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <button 
              onClick={() => navigate('/day-book')}
              className="text-xs text-primary font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))
            ) : recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    activity.type === 'loan' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-emerald-100 dark:bg-emerald-900/30'
                  )}>
                    {activity.type === 'loan' ? (
                      <ArrowDownRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.customerName} • {format(new Date(activity.date), 'dd MMM')}
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold",
                    activity.type === 'loan' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {activity.type === 'loan' ? '-' : '+'}₹{(activity.amount / 1000).toFixed(1)}K
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="h-4" />
      </PullToRefreshContainer>
    </MobileLayout>
  );
}
