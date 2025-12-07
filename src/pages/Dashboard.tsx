import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, client, currentBranch, branches, roles, hasRole } = useAuth();

  const hasMultipleBranches = branches && branches.length > 1;

  const quickActions = [
    { title: 'New Loan', icon: Plus, href: '/loans?action=new', color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Interest', icon: CreditCard, href: '/interest', color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'Redemption', icon: Wallet, href: '/redemption', color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'Reloan', icon: RefreshCw, href: '/reloan', color: 'bg-amber-600 hover:bg-amber-700' },
  ];

  const stats = [
    {
      title: 'Total Customers',
      value: '0',
      icon: Users,
      change: 'Start adding customers',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Loans',
      value: '0',
      icon: FileText,
      change: 'No active loans yet',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Disbursed',
      value: '₹0',
      icon: IndianRupee,
      change: 'This month',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Interest Collected',
      value: '₹0',
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {client?.company_name}{currentBranch ? ` • ${currentBranch.branch_name}` : ''}
          </p>
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
          {stats.map((stat) => (
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
