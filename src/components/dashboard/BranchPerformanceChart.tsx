import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BranchPerformance } from '@/hooks/useDashboardData';

interface BranchPerformanceChartProps {
  data: BranchPerformance[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const COLORS = [
  'hsl(32, 95%, 44%)',  // Primary amber
  'hsl(38, 92%, 50%)',  // Warning amber
  'hsl(45, 93%, 47%)',  // Accent yellow
  'hsl(142, 71%, 45%)', // Success green
  'hsl(217, 91%, 60%)', // Info blue
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.branchName}</p>
        <p className="text-xs text-muted-foreground mb-1">{data.branchCode}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">AUM:</span>
            <span className="font-medium">{formatCurrency(data.aum)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Loans:</span>
            <span className="font-medium">{data.loanCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Share:</span>
            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function BranchPerformanceChart({ data, isLoading }: BranchPerformanceChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Branch Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Branch Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No branch data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for horizontal bar chart
  const chartData = data.map(b => ({
    ...b,
    displayName: b.branchName.length > 12 ? b.branchName.slice(0, 12) + '...' : b.branchName,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Branch Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">Top 5 branches by AUM</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                type="category" 
                dataKey="displayName" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Bar dataKey="aum" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
