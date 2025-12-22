import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBackfillVouchers } from '@/hooks/useBackfillVouchers';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Building,
  MapPin,
  CreditCard,
  Wallet,
  RefreshCw,
  Plus,
  CheckCircle2,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalDisbursed: number;
  interestCollected: number;
  overdueLoans: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, client, currentBranch, branches, roles, hasRole } = useAuth();
  const { autoSync, syncStatus } = useBackfillVouchers();
  const hasAutoSynced = useRef(false);
  const [showSyncCard, setShowSyncCard] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    interestCollected: 0,
    overdueLoans: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const hasMultipleBranches = branches && branches.length > 1;

  const quickActions = [
    { title: 'New Loan', icon: Plus, href: '/loans?action=new', color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Interest', icon: CreditCard, href: '/interest', color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'Redemption', icon: Wallet, href: '/redemption', color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'Reloan', icon: RefreshCw, href: '/reloan', color: 'bg-amber-600 hover:bg-amber-700' },
  ];

  // Fetch real stats
  const fetchStats = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const branchFilter = currentBranch?.id;
      
      // Fetch stats in parallel
      const [customersRes, loansRes, interestRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('client_id', profile.client_id)
          .eq('is_active', true),
        supabase
          .from('loans')
          .select('id, principal_amount, status, maturity_date')
          .eq('client_id', profile.client_id),
        supabase
          .from('interest_payments')
          .select('amount_paid, payment_date')
          .eq('client_id', profile.client_id),
      ]);

      const activeLoans = loansRes.data?.filter(l => l.status === 'active') || [];
      const totalDisbursed = activeLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
      
      // Get this month's interest
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthlyInterest = interestRes.data
        ?.filter(p => p.payment_date >= startOfMonth)
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      // Count overdue loans
      const today = new Date().toISOString().split('T')[0];
      const overdueLoans = activeLoans.filter(l => l.maturity_date < today).length;

      setStats({
        totalCustomers: customersRes.count || 0,
        activeLoans: activeLoans.length,
        totalDisbursed,
        interestCollected: monthlyInterest,
        overdueLoans,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [profile?.client_id, currentBranch?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statItems = [
    {
      title: 'Total Customers',
      value: isLoadingStats ? '...' : stats.totalCustomers.toLocaleString(),
      icon: Users,
      change: stats.totalCustomers > 0 ? 'Active customers' : 'Start adding customers',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Loans',
      value: isLoadingStats ? '...' : stats.activeLoans.toLocaleString(),
      icon: FileText,
      change: stats.overdueLoans > 0 ? `${stats.overdueLoans} overdue` : 'All on track',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Disbursed',
      value: isLoadingStats ? '...' : `₹${(stats.totalDisbursed / 100000).toFixed(1)}L`,
      icon: IndianRupee,
      change: 'Active portfolio',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Interest Collected',
      value: isLoadingStats ? '...' : `₹${(stats.interestCollected / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      change: 'This month',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const getBranchTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      main_branch: 'bg-amber-100 text-amber-800',
      company_owned: 'bg-blue-100 text-blue-800',
      franchise: 'bg-green-100 text-green-800',
      tenant: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Auto-sync vouchers on dashboard load
  useEffect(() => {
    if (profile?.client_id && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      
      autoSync(profile.client_id).then((result) => {
        if (result.synced > 0) {
          toast.success(`Synced ${result.synced} accounting entries`, {
            description: 'All transactions now have vouchers',
            duration: 3000,
          });
        }
      });
    }
  }, [profile?.client_id, autoSync]);

  const getSyncStatusDisplay = () => {
    switch (syncStatus.status) {
      case 'checking':
        return { icon: Loader2, text: 'Checking...', color: 'text-muted-foreground', animate: true };
      case 'syncing':
        return { icon: Loader2, text: `Syncing ${syncStatus.pending} entries...`, color: 'text-amber-600', animate: true };
      case 'synced':
        return { icon: CheckCircle2, text: 'All synced', color: 'text-green-600', animate: false };
      case 'pending':
        return { icon: AlertTriangle, text: `${syncStatus.pending} pending`, color: 'text-amber-600', animate: false };
      default:
        return { icon: BookOpen, text: 'Ready', color: 'text-muted-foreground', animate: false };
    }
  };

  const statusDisplay = getSyncStatusDisplay();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header with Sync Status */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              {client?.company_name}{currentBranch ? ` • ${currentBranch.branch_name}` : ''}
            </p>
          </div>
          
          {/* Compact Sync Status Badge */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
              syncStatus.status === 'synced' 
                ? 'bg-green-50 border border-green-200' 
                : syncStatus.status === 'syncing' || syncStatus.status === 'checking'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-muted border border-border'
            }`}
            title="Accounting sync status"
          >
            <statusDisplay.icon className={`h-4 w-4 ${statusDisplay.color} ${statusDisplay.animate ? 'animate-spin' : ''}`} />
            <span className={`font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  onClick={() => navigate(action.href)}
                  className={`${action.color} text-white h-auto py-3 flex flex-col items-center gap-2`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Branch Overview Card */}
        {hasMultipleBranches && (
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-amber-600" />
                Branch Network Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                  <div 
                    key={branch.id} 
                    className={`p-3 rounded-lg border ${
                      currentBranch?.id === branch.id 
                        ? 'border-amber-400 bg-amber-100/50' 
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{branch.branch_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{branch.branch_code}</p>
                      </div>
                      <Badge 
                        variant={branch.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={`${getBranchTypeBadge(branch.branch_type)} text-xs`}>
                        {branch.branch_type.replace('_', ' ')}
                      </Badge>
                      {currentBranch?.id === branch.id && (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                You have access to {branches.length} branches. Use the branch selector in the sidebar to switch between them.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions / Alerts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No pending actions. You're all caught up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No alerts at this time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                >
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
            {roles.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No roles assigned. Contact your administrator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
