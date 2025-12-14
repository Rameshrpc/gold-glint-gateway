import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PrintTemplate {
  id: string;
  template_code: string;
  template_name: string;
  receipt_type: string;
  language: string | null;
  layout_style: string | null;
  paper_size: string | null;
  is_active: boolean | null;
  color_scheme: { primary?: string; secondary?: string } | null;
  preview_image_url: string | null;
  created_at: string | null;
}

export interface ClientPrintSetting {
  id: string;
  client_id: string;
  receipt_type: string;
  template_id: string | null;
  logo_url: string | null;
  header_text: string | null;
  footer_text: string | null;
  watermark_type: string | null;
  watermark_text: string | null;
  watermark_image_url: string | null;
  watermark_opacity: number | null;
  show_logo: boolean | null;
  show_declaration: boolean | null;
  show_terms: boolean | null;
  show_signature_section: boolean | null;
  custom_terms: string | null;
  margins: { top?: number; right?: number; bottom?: number; left?: number } | null;
  font_size: number | null;
  copies: number | null;
  template_config: Record<string, unknown> | null;
}

export interface BranchTemplateAssignment {
  id: string;
  client_id: string;
  branch_id: string;
  receipt_type: string;
  template_id: string;
  is_locked: boolean | null;
  assigned_at: string | null;
  assigned_by: string | null;
}

export function usePrintSettings() {
  const { client } = useAuth();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [clientSettings, setClientSettings] = useState<ClientPrintSetting[]>([]);
  const [branchAssignments, setBranchAssignments] = useState<BranchTemplateAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .order('receipt_type', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    setTemplates((data || []).map(t => ({
      ...t,
      color_scheme: t.color_scheme as PrintTemplate['color_scheme']
    })));
  };

  const fetchClientSettings = async () => {
    if (!client?.id) return;

    const { data, error } = await supabase
      .from('client_print_settings')
      .select('*')
      .eq('client_id', client.id);

    if (error) {
      console.error('Error fetching client settings:', error);
      return;
    }

    setClientSettings((data || []).map(s => ({
      ...s,
      margins: s.margins as ClientPrintSetting['margins'],
      template_config: s.template_config as ClientPrintSetting['template_config']
    })));
  };

  const fetchBranchAssignments = async () => {
    if (!client?.id) return;

    const { data, error } = await supabase
      .from('branch_template_assignments')
      .select('*')
      .eq('client_id', client.id);

    if (error) {
      console.error('Error fetching branch assignments:', error);
      return;
    }

    setBranchAssignments(data || []);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchTemplates(),
        fetchClientSettings(),
        fetchBranchAssignments()
      ]);
      setLoading(false);
    };

    if (client?.id) {
      loadAll();
    }
  }, [client?.id]);

  const saveClientSetting = async (setting: Partial<ClientPrintSetting> & { receipt_type: string }) => {
    if (!client?.id) return false;

    const existing = clientSettings.find(s => s.receipt_type === setting.receipt_type);

    try {
      const dataToSave = {
        ...setting,
        margins: setting.margins ? JSON.stringify(setting.margins) : null,
        template_config: setting.template_config ? JSON.stringify(setting.template_config) : null,
      };

      if (existing) {
        const { error } = await supabase
          .from('client_print_settings')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_print_settings')
          .insert({
            client_id: client.id,
            ...dataToSave
          });

        if (error) throw error;
      }

      await fetchClientSettings();
      toast.success('Print settings saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving client setting:', error);
      toast.error('Failed to save print settings');
      return false;
    }
  };

  const saveBranchAssignment = async (
    branchId: string,
    receiptType: string,
    templateId: string,
    isLocked: boolean = false
  ) => {
    if (!client?.id) return false;

    const existing = branchAssignments.find(
      a => a.branch_id === branchId && a.receipt_type === receiptType
    );

    try {
      if (existing) {
        const { error } = await supabase
          .from('branch_template_assignments')
          .update({
            template_id: templateId,
            is_locked: isLocked
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branch_template_assignments')
          .insert({
            client_id: client.id,
            branch_id: branchId,
            receipt_type: receiptType,
            template_id: templateId,
            is_locked: isLocked
          });

        if (error) throw error;
      }

      await fetchBranchAssignments();
      toast.success('Template assignment saved');
      return true;
    } catch (error) {
      console.error('Error saving branch assignment:', error);
      toast.error('Failed to save assignment');
      return false;
    }
  };

  const deleteBranchAssignment = async (branchId: string, receiptType: string) => {
    const existing = branchAssignments.find(
      a => a.branch_id === branchId && a.receipt_type === receiptType
    );

    if (!existing) return true;

    try {
      const { error } = await supabase
        .from('branch_template_assignments')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      await fetchBranchAssignments();
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return false;
    }
  };

  const createTemplate = async (template: Partial<PrintTemplate>) => {
    try {
      const dataToInsert = {
        template_code: template.template_code!,
        template_name: template.template_name!,
        receipt_type: template.receipt_type!,
        language: template.language,
        layout_style: template.layout_style,
        paper_size: template.paper_size,
        color_scheme: template.color_scheme as Record<string, string> | null,
        is_active: template.is_active ?? false
      };

      const { error } = await supabase
        .from('print_templates')
        .insert(dataToInsert);

      if (error) throw error;

      await fetchTemplates();
      toast.success('Template created successfully');
      return true;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      return false;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<PrintTemplate>) => {
    try {
      const { error } = await supabase
        .from('print_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTemplates();
      toast.success('Template updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      return false;
    }
  };

  return {
    templates,
    clientSettings,
    branchAssignments,
    loading,
    fetchTemplates,
    fetchClientSettings,
    fetchBranchAssignments,
    saveClientSetting,
    saveBranchAssignment,
    deleteBranchAssignment,
    createTemplate,
    updateTemplate
  };
}
