import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Percent, Calendar, IndianRupee, Package } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { cn } from '@/lib/utils';

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  shown_rate: number;
  effective_rate: number;
  ltv_percentage: number;
  min_tenure_days: number;
  max_tenure_days: number;
  advance_interest_months: number;
  rate_22kt: number | null;
  rate_18kt: number | null;
  is_active: boolean;
}

export default function MobileSchemes() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, [profile?.client_id]);

  const fetchSchemes = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('client_id', profile.client_id)
        .eq('is_active', true)
        .order('scheme_name');

      if (error) throw error;
      setSchemes(data || []);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout hideNav>
      <MobileSimpleHeader title="Loan Schemes" showBack />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">Active Schemes</p>
              <p className="text-2xl font-bold">{schemes.length}</p>
            </div>
          </div>
        </div>

        {/* Schemes List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl shimmer" />
            ))
          ) : schemes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No schemes configured</p>
            </div>
          ) : (
            schemes.map((scheme, index) => (
              <div
                key={scheme.id}
                className="p-4 rounded-2xl bg-card border border-border animate-slide-up-fade"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {scheme.scheme_code}
                    </span>
                    <h3 className="font-semibold mt-1">{scheme.scheme_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{scheme.shown_rate}%</p>
                    <p className="text-[10px] text-muted-foreground">p.a.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Percent className="w-3 h-3" />
                      <span className="text-[10px]">LTV</span>
                    </div>
                    <p className="text-sm font-semibold">{scheme.ltv_percentage}%</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px]">Tenure</span>
                    </div>
                    <p className="text-sm font-semibold">{scheme.max_tenure_days}d</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <IndianRupee className="w-3 h-3" />
                      <span className="text-[10px]">22kt</span>
                    </div>
                    <p className="text-sm font-semibold">₹{scheme.rate_22kt || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>Advance: {scheme.advance_interest_months} months</span>
                  <span>Effective: {scheme.effective_rate}% p.a.</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
