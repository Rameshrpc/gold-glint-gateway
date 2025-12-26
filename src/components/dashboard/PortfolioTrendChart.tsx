import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendDataPoint } from '@/hooks/useDashboardData';

interface PortfolioTrendChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PortfolioTrendChart({ data, isLoading }: PortfolioTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Portfolio & Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Portfolio & Collections
        </CardTitle>
        <p className="text-sm text-muted-foreground">Last 14 days trend</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeAUM"
                name="AUM"
                stroke="hsl(32, 95%, 44%)"
                strokeWidth={2}
                fill="url(#aumGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="collections"
                name="Collections"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(142, 71%, 45%)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">AUM Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
            <span className="text-sm text-muted-foreground">Daily Collections</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
