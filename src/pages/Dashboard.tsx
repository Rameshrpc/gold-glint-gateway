import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { profile, client, currentBranch, roles } = useAuth();

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
