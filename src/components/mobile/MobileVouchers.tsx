import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  voucher_type: string;
  narration: string;
  total_debit: number;
  total_credit: number;
}

const voucherTypeConfig: Record<string, { label: string; color: string; icon: 'in' | 'out' | 'neutral' }> = {
  receipt: { label: 'Receipt', color: 'bg-green-500', icon: 'in' },
  payment: { label: 'Payment', color: 'bg-red-500', icon: 'out' },
  journal: { label: 'Journal', color: 'bg-blue-500', icon: 'neutral' },
  loan_disbursement: { label: 'Disbursement', color: 'bg-amber-500', icon: 'out' },
  interest_collection: { label: 'Interest', color: 'bg-emerald-500', icon: 'in' },
  redemption: { label: 'Redemption', color: 'bg-teal-500', icon: 'neutral' },
};

export default function MobileVouchers() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => {
    fetchVouchers();
  }, [profile?.client_id]);

  const fetchVouchers = async () => {
    if (!profile?.client_id) return;

    try {
      const today = new Date();
      const { data, error } = await supabase
        .from('vouchers')
        .select('id, voucher_number, voucher_date, voucher_type, narration, total_debit, total_credit')
        .eq('client_id', profile.client_id)
        .gte('voucher_date', format(startOfDay(today), 'yyyy-MM-dd'))
        .lte('voucher_date', format(endOfDay(today), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    if (filter === 'all') return true;
    const config = voucherTypeConfig[v.voucher_type];
    return config?.icon === filter;
  });

  const totalIn = vouchers
    .filter(v => voucherTypeConfig[v.voucher_type]?.icon === 'in')
    .reduce((sum, v) => sum + v.total_credit, 0);

  const totalOut = vouchers
    .filter(v => voucherTypeConfig[v.voucher_type]?.icon === 'out')
    .reduce((sum, v) => sum + v.total_debit, 0);

  return (
    <MobileLayout hideNav>
      <MobileSimpleHeader title="Today's Vouchers" showBack />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Inflow</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">₹{(totalIn / 1000).toFixed(0)}K</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Outflow</span>
            </div>
            <p className="text-xl font-bold text-destructive">₹{(totalOut / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'in', label: 'Receipts' },
            { key: 'out', label: 'Payments' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all tap-scale",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Vouchers List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No vouchers for today</p>
            </div>
          ) : (
            filteredVouchers.map((voucher, index) => {
              const config = voucherTypeConfig[voucher.voucher_type] || { label: voucher.voucher_type, color: 'bg-muted', icon: 'neutral' };
              const amount = voucher.total_debit || voucher.total_credit;

              return (
                <div
                  key={voucher.id}
                  className="p-4 rounded-xl bg-card border border-border animate-slide-up-fade"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                        config.color
                      )}>
                        {config.icon === 'in' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : config.icon === 'out' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{voucher.voucher_number}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{voucher.narration}</p>
                        <span className={cn(
                          "mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
                          config.color
                        )}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-base font-bold",
                      config.icon === 'in' ? "text-emerald-600" : config.icon === 'out' ? "text-red-600" : "text-foreground"
                    )}>
                      {config.icon === 'in' ? '+' : config.icon === 'out' ? '-' : ''}₹{(amount / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
