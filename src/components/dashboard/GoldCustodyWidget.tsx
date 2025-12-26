import { Card, CardContent } from '@/components/ui/card';
import { Gem, Scale, TrendingUp } from 'lucide-react';
import { GoldCustody } from '@/hooks/useDashboardData';

interface GoldCustodyWidgetProps {
  data: GoldCustody;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const formatWeight = (grams: number) => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams.toFixed(1)} g`;
};

export function GoldCustodyWidget({ data, isLoading }: GoldCustodyWidgetProps) {
  const getLTVColor = (ltv: number) => {
    if (ltv < 70) return 'text-green-600';
    if (ltv < 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getLTVBgColor = (ltv: number) => {
    if (ltv < 70) return 'bg-green-100';
    if (ltv < 80) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 w-24 bg-amber-200 rounded mb-2" />
            <div className="h-8 w-32 bg-amber-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 overflow-hidden relative">
      {/* Decorative gold pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Gem className="w-full h-full text-amber-600" />
      </div>
      
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Gold in Custody
            </h3>
          </div>
          {/* LTV Badge */}
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLTVBgColor(data.avgLTV)} ${getLTVColor(data.avgLTV)}`}>
            LTV: {data.avgLTV.toFixed(0)}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xl font-bold text-amber-900">{formatWeight(data.totalWeightGrams)}</p>
            <p className="text-xs text-amber-700">Total Weight</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-900">{formatCurrency(data.totalAppraisedValue)}</p>
            <p className="text-xs text-amber-700">Appraised</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-900">{data.itemCount}</p>
            <p className="text-xs text-amber-700">Items</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
