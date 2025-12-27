import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { useNavigate } from 'react-router-dom';

interface OverdueBucket {
  label: string;
  range: string;
  count: number;
  amount: number;
  color: string;
}

interface OverdueAlertsWidgetProps {
  data: OverdueBucket[];
  isLoading: boolean;
}

const bucketColors: Record<string, string> = {
  'Current': 'bg-green-500 dark:bg-green-600',
  '1-30 Days': 'bg-yellow-500 dark:bg-yellow-600',
  '31-60 Days': 'bg-orange-500 dark:bg-orange-600',
  '61-90 Days': 'bg-red-500 dark:bg-red-600',
  '90+ Days': 'bg-red-700 dark:bg-red-800',
};

const bucketBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Current': 'secondary',
  '1-30 Days': 'outline',
  '31-60 Days': 'outline',
  '61-90 Days': 'destructive',
  '90+ Days': 'destructive',
};

export function OverdueAlertsWidget({ data, isLoading }: OverdueAlertsWidgetProps) {
  const navigate = useNavigate();

  const totalOverdue = data
    .filter(b => b.label !== 'Current')
    .reduce((sum, b) => sum + b.count, 0);

  const totalOverdueAmount = data
    .filter(b => b.label !== 'Current')
    .reduce((sum, b) => sum + b.amount, 0);

  const maxAmount = Math.max(...data.map(b => b.amount), 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={totalOverdue > 0 ? 'border-amber-200 dark:border-amber-800' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${totalOverdue > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Overdue Analysis
          </CardTitle>
          {totalOverdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalOverdue} Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        {totalOverdue > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Total Overdue Amount
                </p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {formatIndianCurrency(totalOverdueAmount)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </div>
        )}

        {/* Aging Buckets */}
        <div className="space-y-2">
          {data.filter(b => b.label !== 'Current').map((bucket) => (
            <div key={bucket.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${bucketColors[bucket.label]}`} />
                  <span className="text-muted-foreground">{bucket.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={bucketBadgeVariants[bucket.label]} className="text-xs">
                    {bucket.count}
                  </Badge>
                  <span className="font-medium text-xs w-24 text-right">
                    {formatIndianCurrency(bucket.amount)}
                  </span>
                </div>
              </div>
              <Progress 
                value={(bucket.amount / maxAmount) * 100} 
                className="h-1.5"
              />
            </div>
          ))}
        </div>

        {/* Action Button */}
        {totalOverdue > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={() => navigate('/loans?status=overdue')}
          >
            View Overdue Loans
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}

        {totalOverdue === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No overdue loans</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
