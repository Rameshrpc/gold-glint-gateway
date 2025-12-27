import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBackfillVouchers } from '@/hooks/useBackfillVouchers';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccountingHealthWidget } from '@/components/accounting/AccountingHealthWidget';
import {
  QuickStatsGrid,
  PortfolioTrendChart,
  OverdueAnalysisChart,
  BranchPerformanceChart,
  GoldCustodyWidget,
} from '@/components/dashboard';
import { 
  CreditCard,
  Wallet,
  RefreshCw,
  Plus,
  CheckCircle2,
  Loader2,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, client, currentBranch, roles, hasRole } = useAuth();
  const { autoSync, syncStatus } = useBackfillVouchers();
  const hasAutoSynced = useRef(false);
  const dashboardData = useDashboardData();

  const isTenantAdmin = hasRole('tenant_admin') || hasRole('super_admin');

  const quickActions = [
    { title: 'New Loan', icon: Plus, href: '/loans?action=new', color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Interest', icon: CreditCard, href: '/interest', color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'Redemption', icon: Wallet, href: '/redemption', color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'Reloan', icon: RefreshCw, href: '/reloan', color: 'bg-amber-600 hover:bg-amber-700' },
  ];

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
      <div className="space-y-5">
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
                ? 'bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800' 
                : syncStatus.status === 'syncing' || syncStatus.status === 'checking'
                ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800'
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

        {/* Quick Stats + Gold Custody Row */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-4">
            <QuickStatsGrid stats={dashboardData.stats} isLoading={dashboardData.isLoading} />
          </div>
          <div className="lg:col-span-1">
            <GoldCustodyWidget data={dashboardData.goldCustody} isLoading={dashboardData.isLoading} />
          </div>
        </div>

        {/* Charts Row 1: Portfolio Trend + Overdue Analysis */}
        <div className="grid gap-4 lg:grid-cols-3">
          <PortfolioTrendChart 
            data={dashboardData.trendData} 
            isLoading={dashboardData.isLoading} 
          />
          <OverdueAnalysisChart 
            data={dashboardData.overdueBuckets}
            totalOverdueLoans={dashboardData.stats.overdueLoans}
            isLoading={dashboardData.isLoading}
          />
        </div>

        {/* Charts Row 2: Branch Performance + Accounting Health */}
        <div className="grid gap-4 lg:grid-cols-2">
          {isTenantAdmin && (
            <BranchPerformanceChart 
              data={dashboardData.branchPerformance} 
              isLoading={dashboardData.isLoading} 
            />
          )}
          <AccountingHealthWidget />
        </div>

        {/* Role Info Card - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium"
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
