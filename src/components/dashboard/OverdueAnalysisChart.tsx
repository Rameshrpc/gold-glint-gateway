import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { OverdueBucket } from '@/hooks/useDashboardData';

interface OverdueAnalysisChartProps {
  data: OverdueBucket[];
  totalOverdueLoans: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.label}</p>
        <p className="text-sm text-muted-foreground">
          {data.count} loans • {formatCurrency(data.amount)}
        </p>
      </div>
    );
  }
  return null;
};

export function OverdueAnalysisChart({ data, totalOverdueLoans, isLoading }: OverdueAnalysisChartProps) {
  const totalOverdueAmount = data
    .filter(b => b.label !== 'Current')
    .reduce((sum, b) => sum + b.amount, 0);

  const chartData = data.filter(b => b.count > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Overdue Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Overdue Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">NPA breakdown by aging</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="relative h-[180px] w-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ label: 'No Data', amount: 1, color: 'hsl(var(--muted))' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {chartData.length > 0 ? (
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  ) : (
                    <Cell fill="hsl(var(--muted))" />
                  )}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground">
                {totalOverdueLoans}
              </span>
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.slice(1).map((bucket, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="text-muted-foreground">{bucket.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{bucket.count}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({formatCurrency(bucket.amount)})
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total at Risk</span>
                <span className="text-sm font-bold text-destructive">
                  {formatCurrency(totalOverdueAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
