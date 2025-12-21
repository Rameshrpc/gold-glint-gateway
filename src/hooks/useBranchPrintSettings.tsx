import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BranchPrintSettings {
  id: string;
  branch_id: string;
  client_id: string;
  default_template_id: string | null;
  logo_url: string | null;
  company_slogan_english: string | null;
  company_slogan_tamil: string | null;
  footer_english: string | null;
  footer_tamil: string | null;
  use_client_logo: boolean;
  created_at: string;
  updated_at: string;
}

export function useBranchPrintSettings() {
  const { client } = useAuth();
  const { toast } = useToast();
  const [branchSettings, setBranchSettings] = useState<BranchPrintSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBranchSettings = useCallback(async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branch_print_settings')
        .select('*')
        .eq('client_id', client.id);
      
      if (error) throw error;
      setBranchSettings((data || []) as BranchPrintSettings[]);
    } catch (error) {
      console.error('Error fetching branch print settings:', error);
    } finally {
      setLoading(false);
    }
  }, [client?.id]);

  const getBranchSettings = useCallback((branchId: string) => {
    return branchSettings.find(bs => bs.branch_id === branchId);
  }, [branchSettings]);

  const upsertBranchSettings = async (branchId: string, updates: Partial<BranchPrintSettings>) => {
    if (!client?.id) return;
    
    setSaving(true);
    try {
      const existing = getBranchSettings(branchId);
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('branch_print_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;

        setBranchSettings(prev =>
          prev.map(bs => bs.id === existing.id ? { ...bs, ...updates } : bs)
        );
      } else {
        // Create new
        const { data, error } = await supabase
          .from('branch_print_settings')
          .insert({
            branch_id: branchId,
            client_id: client.id,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;

        setBranchSettings(prev => [...prev, data as BranchPrintSettings]);
      }

      toast({
        title: 'Saved',
        description: 'Branch print settings updated',
      });
    } catch (error) {
      console.error('Error updating branch print settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update branch settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBranchSettings = async (branchId: string) => {
    const settings = getBranchSettings(branchId);
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('branch_print_settings')
        .delete()
        .eq('id', settings.id);

      if (error) throw error;

      setBranchSettings(prev => prev.filter(bs => bs.id !== settings.id));
      toast({
        title: 'Deleted',
        description: 'Branch print settings removed',
      });
    } catch (error) {
      console.error('Error deleting branch print settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete branch settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchBranchSettings();
  }, [fetchBranchSettings]);

  return {
    branchSettings,
    loading,
    saving,
    getBranchSettings,
    upsertBranchSettings,
    deleteBranchSettings,
    refetch: fetchBranchSettings,
  };
}
