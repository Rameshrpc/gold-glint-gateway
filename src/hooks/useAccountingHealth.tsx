import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountingHealth {
  unbalanced_count: number;
  total_imbalance: number;
  today_vouchers: number;
  today_balanced: number;
  health_score: number;
  status: 'healthy' | 'warning' | 'critical';
  checked_at: string;
}

interface UnbalancedVoucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  voucher_type: string;
  total_debit: number;
  total_credit: number;
  imbalance: number;
  narration: string;
}

export function useAccountingHealth() {
  const [health, setHealth] = useState<AccountingHealth | null>(null);
  const [unbalancedVouchers, setUnbalancedVouchers] = useState<UnbalancedVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const fetchHealth = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_accounting_health', {
        p_client_id: clientId
      });

      if (error) throw error;
      
      const healthData = data as unknown as AccountingHealth;
      setHealth(healthData);
      return healthData;
    } catch (error: any) {
      console.error('Failed to fetch accounting health:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnbalancedVouchers = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('v_unbalanced_vouchers')
        .select('*')
        .eq('client_id', clientId)
        .order('voucher_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setUnbalancedVouchers((data || []) as UnbalancedVoucher[]);
      return data as UnbalancedVoucher[];
    } catch (error: any) {
      console.error('Failed to fetch unbalanced vouchers:', error);
      return [];
    }
  }, []);

  const fixSingleVoucher = useCallback(async (voucherId: string) => {
    try {
      const { data, error } = await supabase.rpc('fix_voucher_imbalance', {
        p_voucher_id: voucherId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message?: string; voucher_number?: string };
      
      if (result.success) {
        toast.success(`Fixed voucher ${result.voucher_number}`);
        return true;
      } else {
        toast.error(result.message || 'Failed to fix voucher');
        return false;
      }
    } catch (error: any) {
      console.error('Failed to fix voucher:', error);
      toast.error('Failed to fix voucher');
      return false;
    }
  }, []);

  const fixAllVouchers = useCallback(async (clientId: string) => {
    setIsFixing(true);
    try {
      const { data, error } = await supabase.rpc('fix_all_voucher_imbalances', {
        p_client_id: clientId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; fixed_count: number; total_adjustment: number };
      
      if (result.success) {
        toast.success(`Fixed ${result.fixed_count} vouchers`, {
          description: `Total adjustment: ₹${result.total_adjustment.toFixed(2)}`
        });
        
        // Refresh data
        await fetchHealth(clientId);
        await fetchUnbalancedVouchers(clientId);
        
        return result;
      }
      
      return null;
    } catch (error: any) {
      console.error('Failed to fix all vouchers:', error);
      toast.error('Failed to fix vouchers');
      return null;
    } finally {
      setIsFixing(false);
    }
  }, [fetchHealth, fetchUnbalancedVouchers]);

  return {
    health,
    unbalancedVouchers,
    isLoading,
    isFixing,
    fetchHealth,
    fetchUnbalancedVouchers,
    fixSingleVoucher,
    fixAllVouchers,
  };
}
