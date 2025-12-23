import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Calendar, IndianRupee, Plus, ExternalLink, Copy } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { MobileBottomSheet, MobileFormField } from './shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMarketRates, useSaveMarketRate, useTodayMarketRate } from '@/hooks/useMarketRates';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MobileMarketRates() {
  const { data: rates = [], isLoading, refetch } = useMarketRates();
  const { data: todayRate } = useTodayMarketRate();
  const saveRate = useSaveMarketRate();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [rate22kt, setRate22kt] = useState('');
  const [rate24kt, setRate24kt] = useState('');
  const [rate18kt, setRate18kt] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriceChange = () => {
    if (rates.length < 2 || !todayRate) return null;
    const previousRate = rates.find(r => r.id !== todayRate.id);
    if (!previousRate) return null;
    const change = todayRate.rate_22kt - previousRate.rate_22kt;
    const percentChange = (change / previousRate.rate_22kt) * 100;
    return { change, percentChange };
  };

  const priceChange = getPriceChange();
  const lastRate = rates.length > 0 ? rates[0] : null;

  const handle22ktChange = (value: string) => {
    setRate22kt(value);
    const rate22 = parseFloat(value) || 0;
    const rate24 = Math.round(rate22 * (24 / 22));
    const rate18 = Math.round(rate22 * (18 / 22));
    setRate24kt(String(rate24));
    setRate18kt(String(rate18));
  };

  const copyLastRate = () => {
    if (lastRate) {
      vibrateLight();
      setRate22kt(String(lastRate.rate_22kt));
      setRate24kt(String(lastRate.rate_24kt));
      setRate18kt(String(lastRate.rate_18kt));
      toast.success(`Rates copied from ${format(new Date(lastRate.rate_date), 'dd MMM')}`);
    }
  };

  const handleSave = async () => {
    if (!rate22kt || parseFloat(rate22kt) <= 0) {
      toast.error('Please enter valid 22KT rate');
      return;
    }

    setSaving(true);
    try {
      await saveRate.mutateAsync({
        rate_date: today,
        rate_24kt: parseFloat(rate24kt) || 0,
        rate_22kt: parseFloat(rate22kt),
        rate_18kt: parseFloat(rate18kt) || 0,
        rate_source: 'manual',
      });

      vibrateSuccess();
      toast.success('Rate saved successfully');
      setShowAddSheet(false);
      setRate22kt('');
      setRate24kt('');
      setRate18kt('');
    } catch (error) {
      toast.error('Failed to save rate');
    } finally {
      setSaving(false);
    }
  };

  const openExternalLink = (url: string) => {
    vibrateLight();
    window.open(url, '_blank');
  };

  return (
    <MobileLayout>
      <MobileGradientHeader title="Market Rates" variant="minimal" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Today's Rate Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {todayRate ? format(new Date(todayRate.rate_date), 'dd MMMM yyyy') : 'Today'}
                </span>
              </div>
              {todayRate?.rate_date !== today && todayRate && (
                <Badge variant="secondary" className="text-[10px]">Latest</Badge>
              )}
            </div>

            {todayRate ? (
              <div className="space-y-4">
                {/* Main 22KT Rate */}
                <div className="text-center bg-white/60 dark:bg-black/20 rounded-2xl p-4 ring-2 ring-amber-400/50">
                  <p className="text-xs text-amber-600 font-medium mb-1">22KT (Standard)</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {formatCurrency(todayRate.rate_22kt)}
                    <span className="text-sm font-normal text-amber-600">/g</span>
                  </p>
                  {priceChange && (
                    <div className={cn(
                      'flex items-center justify-center gap-1 mt-2 text-sm font-medium',
                      priceChange.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {priceChange.change >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {priceChange.change >= 0 ? '+' : ''}{formatCurrency(priceChange.change)}
                      <span className="text-xs">({priceChange.percentChange.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>

                {/* Other rates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 dark:bg-black/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-amber-600 font-medium mb-0.5">24KT (Pure)</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
                      {formatCurrency(todayRate.rate_24kt)}
                    </p>
                  </div>
                  <div className="bg-white/40 dark:bg-black/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-amber-600 font-medium mb-0.5">18KT</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
                      {formatCurrency(todayRate.rate_18kt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <IndianRupee className="w-12 h-12 mx-auto mb-3 text-amber-400/50" />
                <p className="text-amber-700 dark:text-amber-400 mb-4">No rates configured</p>
                <Button
                  onClick={() => { vibrateLight(); setShowAddSheet(true); }}
                  className="gradient-gold text-white"
                >
                  Add First Rate
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Check External Rates</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openExternalLink('https://ibja.co')}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-xl text-sm font-medium tap-scale"
            >
              <span>🏦</span>
              <span>IBJA</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={() => openExternalLink('https://www.goodreturns.in/gold-rates/chennai.aspx')}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-xl text-sm font-medium tap-scale"
            >
              <span>📈</span>
              <span>GoodReturns</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={() => openExternalLink('https://goldpriceindia.com')}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-xl text-sm font-medium tap-scale"
            >
              <span>🥇</span>
              <span>Gold Price</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Rate History */}
        <div className="space-y-3">
          <h3 className="font-semibold px-1">Rate History</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No rate history available</p>
            </div>
          ) : (
            rates.slice(0, 10).map((rate, index) => (
              <div
                key={rate.id}
                className="flex items-center justify-between bg-card border border-border rounded-xl p-4 animate-slide-up-fade"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div>
                  <p className="font-medium">{format(new Date(rate.rate_date), 'dd MMM yyyy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {rate.rate_source || 'Manual'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{formatCurrency(rate.rate_22kt)}</p>
                  <p className="text-xs text-muted-foreground">22KT/g</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-24" />
      </PullToRefreshContainer>

      {/* FAB */}
      <button
        onClick={() => { vibrateLight(); setShowAddSheet(true); }}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-full gradient-gold text-white shadow-lg flex items-center justify-center tap-scale z-40 animate-bounce-in shadow-glow"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Rate Sheet */}
      <MobileBottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Add Today's Rate"
        snapPoints={['full']}
      >
        <div className="p-4 space-y-6">
          {/* Quick Fill */}
          {lastRate && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quick Fill</span>
              </div>
              <button
                onClick={copyLastRate}
                className="w-full flex items-center justify-between px-4 py-3 bg-background rounded-lg tap-scale"
              >
                <span className="text-sm">Copy from {format(new Date(lastRate.rate_date), 'dd MMM')}</span>
                <span className="text-sm font-semibold text-amber-600">
                  ₹{lastRate.rate_22kt.toLocaleString('en-IN')}
                </span>
              </button>
            </div>
          )}

          {/* Rate Input */}
          <div className="space-y-4">
            <MobileFormField label="22KT Rate (per gram)" required>
              <Input
                type="number"
                placeholder="Enter 22KT rate"
                value={rate22kt}
                onChange={(e) => handle22ktChange(e.target.value)}
                className="text-lg h-12"
              />
            </MobileFormField>

            <div className="grid grid-cols-2 gap-4">
              <MobileFormField label="24KT Rate">
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={rate24kt}
                  onChange={(e) => setRate24kt(e.target.value)}
                  className="h-12"
                />
              </MobileFormField>
              <MobileFormField label="18KT Rate">
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={rate18kt}
                  onChange={(e) => setRate18kt(e.target.value)}
                  className="h-12"
                />
              </MobileFormField>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !rate22kt}
            className="w-full h-12 gradient-gold text-white text-lg font-semibold"
          >
            {saving ? 'Saving...' : 'Save Rate'}
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
