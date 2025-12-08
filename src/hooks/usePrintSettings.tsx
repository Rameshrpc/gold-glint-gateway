import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface PrintSettings {
  id: string;
  client_id: string;
  receipt_type: string;
  template_id: string | null;
  logo_url: string | null;
  watermark_type: string;
  watermark_text: string | null;
  watermark_image_url: string | null;
  watermark_opacity: number;
  header_text: string | null;
  footer_text: string | null;
  show_logo: boolean;
  show_declaration: boolean;
  show_signature_section: boolean;
  show_terms: boolean;
  custom_terms: string | null;
  margins: Json | null;
  font_size: number;
  copies: number;
}

export interface BranchAssignment {
  id: string;
  branch_id: string;
  client_id: string;
  receipt_type: string;
  template_id: string;
  is_locked: boolean;
  assigned_by: string | null;
  assigned_at: string;
}

export function usePrintSettings(receiptType?: string) {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  return useQuery({
    queryKey: ['print-settings', clientId, receiptType],
    queryFn: async () => {
      let query = supabase
        .from('client_print_settings')
        .select('*');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      if (receiptType) {
        query = query.eq('receipt_type', receiptType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data as PrintSettings[];
    },
    enabled: !!clientId,
  });
}

export function useSavePrintSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PrintSettings> & { receipt_type: string }) => {
      if (!profile?.client_id) throw new Error('No client ID');

      const { data: existing } = await supabase
        .from('client_print_settings')
        .select('id')
        .eq('client_id', profile.client_id)
        .eq('receipt_type', settings.receipt_type)
        .single();

      // Build the update/insert payload with proper types
      const payload = {
        receipt_type: settings.receipt_type,
        template_id: settings.template_id,
        logo_url: settings.logo_url,
        watermark_type: settings.watermark_type,
        watermark_text: settings.watermark_text,
        watermark_image_url: settings.watermark_image_url,
        watermark_opacity: settings.watermark_opacity,
        header_text: settings.header_text,
        footer_text: settings.footer_text,
        show_logo: settings.show_logo,
        show_declaration: settings.show_declaration,
        show_signature_section: settings.show_signature_section,
        show_terms: settings.show_terms,
        custom_terms: settings.custom_terms,
        margins: settings.margins as Json,
        font_size: settings.font_size,
        copies: settings.copies,
      };

      if (existing) {
        const { error } = await supabase
          .from('client_print_settings')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_print_settings')
          .insert({
            ...payload,
            client_id: profile.client_id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-settings'] });
      toast.success('Print settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
}

export function useBranchAssignments() {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  return useQuery({
    queryKey: ['branch-assignments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_template_assignments')
        .select(`
          *,
          branches:branch_id(id, branch_name, branch_code),
          template:template_id(id, template_name, template_code)
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useSaveBranchAssignment() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: {
      branch_id: string;
      receipt_type: string;
      template_id: string;
      is_locked: boolean;
    }) => {
      if (!profile?.client_id) throw new Error('No client ID');

      const { data: existing } = await supabase
        .from('branch_template_assignments')
        .select('id')
        .eq('branch_id', assignment.branch_id)
        .eq('receipt_type', assignment.receipt_type)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('branch_template_assignments')
          .update({
            template_id: assignment.template_id,
            is_locked: assignment.is_locked,
            assigned_by: user?.id,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branch_template_assignments')
          .insert({
            ...assignment,
            client_id: profile.client_id,
            assigned_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-assignments'] });
      toast.success('Branch assignment saved');
    },
    onError: (error) => {
      toast.error('Failed to save assignment: ' + error.message);
    },
  });
}

export function useUploadBrandingAsset() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'logo' | 'watermark' }) => {
      if (!profile?.client_id) throw new Error('No client ID');

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.client_id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-settings'] });
    },
    onError: (error) => {
      toast.error('Failed to upload: ' + error.message);
    },
  });
}
