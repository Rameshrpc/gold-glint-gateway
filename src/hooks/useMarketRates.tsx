import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MarketRate {
  id: string;
  client_id: string;
  rate_date: string;
  rate_24kt: number;
  rate_22kt: number;
  rate_18kt: number;
  rate_source: string;
  created_by: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMarketRates() {
  const { client } = useAuth();

  return useQuery({
    queryKey: ['market-rates', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      
      const { data, error } = await supabase
        .from('gold_market_rates')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('rate_date', { ascending: false });

      if (error) throw error;
      return data as MarketRate[];
    },
    enabled: !!client?.id,
  });
}

export function useTodayMarketRate() {
  const { client } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['market-rate-today', client?.id, today],
    queryFn: async () => {
      if (!client?.id) return null;
      
      // Try to get today's rate, or the most recent rate
      const { data, error } = await supabase
        .from('gold_market_rates')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('rate_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MarketRate | null;
    },
    enabled: !!client?.id,
  });
}

export function useSaveMarketRate() {
  const { client, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: {
      id?: string;
      rate_date: string;
      rate_24kt: number;
      rate_22kt: number;
      rate_18kt: number;
      rate_source?: string;
      remarks?: string;
    }) => {
      if (!client?.id) throw new Error('No client ID');

      if (rate.id) {
        // Update existing
        const { error } = await supabase
          .from('gold_market_rates')
          .update({
            rate_date: rate.rate_date,
            rate_24kt: rate.rate_24kt,
            rate_22kt: rate.rate_22kt,
            rate_18kt: rate.rate_18kt,
            rate_source: rate.rate_source || 'manual',
            remarks: rate.remarks,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rate.id);
        if (error) throw error;
      } else {
        // Check if rate for this date exists
        const { data: existing } = await supabase
          .from('gold_market_rates')
          .select('id')
          .eq('client_id', client.id)
          .eq('rate_date', rate.rate_date)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('gold_market_rates')
            .update({
              rate_24kt: rate.rate_24kt,
              rate_22kt: rate.rate_22kt,
              rate_18kt: rate.rate_18kt,
              rate_source: rate.rate_source || 'manual',
              remarks: rate.remarks,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('gold_market_rates')
            .insert({
              client_id: client.id,
              rate_date: rate.rate_date,
              rate_24kt: rate.rate_24kt,
              rate_22kt: rate.rate_22kt,
              rate_18kt: rate.rate_18kt,
              rate_source: rate.rate_source || 'manual',
              remarks: rate.remarks,
              created_by: user?.id,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-rates'] });
      queryClient.invalidateQueries({ queryKey: ['market-rate-today'] });
      toast.success('Market rate saved');
    },
    onError: (error) => {
      toast.error('Failed to save rate: ' + error.message);
    },
  });
}

export function useDeleteMarketRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gold_market_rates')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-rates'] });
      queryClient.invalidateQueries({ queryKey: ['market-rate-today'] });
      toast.success('Market rate deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete rate: ' + error.message);
    },
  });
}