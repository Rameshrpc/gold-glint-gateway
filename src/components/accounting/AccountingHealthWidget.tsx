import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccountingHealth } from '@/hooks/useAccountingHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  Loader2,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function AccountingHealthWidget() {
  const { profile } = useAuth();
  const { health, isLoading, isFixing, fetchHealth, fixAllVouchers } = useAccountingHealth();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (profile?.client_id) {
      fetchHealth(profile.client_id);
    }
  }, [profile?.client_id, fetchHealth]);

  const getStatusIcon = () => {
    if (!health) return <Activity className="h-5 w-5 text-muted-foreground" />;
    
    switch (health.status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    if (!health) return 'bg-muted';
    
    switch (health.status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleRefresh = () => {
    if (profile?.client_id) {
      fetchHealth(profile.client_id);
    }
  };

  const handleFixAll = async () => {
    if (profile?.client_id) {
      await fixAllVouchers(profile.client_id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading && !health) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Accounting Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Accounting Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {health ? (
          <>
            {/* Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(health.health_score)}`}>
                  {health.health_score}%
                </span>
              </div>
              <Progress 
                value={health.health_score} 
                className={`h-2 ${
                  health.health_score >= 90 ? '[&>div]:bg-green-600' :
                  health.health_score >= 70 ? '[&>div]:bg-amber-600' : '[&>div]:bg-red-600'
                }`}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background border">
                <div className="text-xs text-muted-foreground">Unbalanced</div>
                <div className="text-lg font-semibold">
                  {health.unbalanced_count}
                  {health.unbalanced_count > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Fix needed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="text-xs text-muted-foreground">Total Imbalance</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(health.total_imbalance)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="text-xs text-muted-foreground">Today's Vouchers</div>
                <div className="text-lg font-semibold">{health.today_vouchers}</div>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="text-xs text-muted-foreground">Today Balanced</div>
                <div className="text-lg font-semibold text-green-600">
                  {health.today_balanced}
                </div>
              </div>
            </div>

            {/* Actions */}
            {health.unbalanced_count > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled={isFixing}
                  >
                    {isFixing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4 mr-2" />
                        Fix All Imbalances ({health.unbalanced_count})
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Fix All Voucher Imbalances?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will add adjustment entries to the Suspense account to balance 
                      {health.unbalanced_count} unbalanced vouchers. Total adjustment: {formatCurrency(health.total_imbalance)}.
                      <br /><br />
                      This action cannot be undone. The Suspense account should be reviewed 
                      and cleared periodically by your accountant.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFixAll}>
                      Fix All Vouchers
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {health.status === 'healthy' && (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">All vouchers balanced</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to fetch accounting health
          </p>
        )}
      </CardContent>
    </Card>
  );
}
