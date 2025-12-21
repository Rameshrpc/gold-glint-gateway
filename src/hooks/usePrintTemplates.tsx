import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PrintTemplate {
  id: string;
  client_id: string;
  template_name: string;
  template_code: string;
  description: string | null;
  language: string;
  paper_size: string;
  font_family: string;
  include_loan_receipt: boolean;
  include_kyc_documents: boolean;
  include_jewel_image: boolean;
  include_gold_declaration: boolean;
  include_terms_conditions: boolean;
  loan_receipt_copies: number;
  kyc_documents_copies: number;
  jewel_image_copies: number;
  gold_declaration_copies: number;
  terms_conditions_copies: number;
  logo_url: string | null;
  header_english: string | null;
  header_tamil: string | null;
  footer_english: string | null;
  footer_tamil: string | null;
  company_slogan_english: string | null;
  company_slogan_tamil: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PrintTemplateInsert = Omit<PrintTemplate, 'id' | 'client_id' | 'created_at' | 'updated_at'>;

export function usePrintTemplates() {
  const { client } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('*')
        .eq('client_id', client.id)
        .order('is_default', { ascending: false })
        .order('template_name');
      
      if (error) throw error;
      setTemplates((data || []) as PrintTemplate[]);
    } catch (error) {
      console.error('Error fetching print templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load print templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [client?.id, toast]);

  const createTemplate = async (template: PrintTemplateInsert) => {
    if (!client?.id) return null;
    
    setSaving(true);
    try {
      // Generate template code from name if not provided
      const templateCode = template.template_code || 
        template.template_name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);

      const { data, error } = await supabase
        .from('print_templates')
        .insert({
          ...template,
          template_code: templateCode,
          client_id: client.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, data as PrintTemplate]);
      toast({
        title: 'Created',
        description: 'Print template created successfully',
      });
      return data as PrintTemplate;
    } catch (error: any) {
      console.error('Error creating print template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<PrintTemplate>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev =>
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      toast({
        title: 'Saved',
        description: 'Template updated successfully',
      });
    } catch (error) {
      console.error('Error updating print template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Deleted',
        description: 'Template removed',
      });
    } catch (error) {
      console.error('Error deleting print template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const setDefaultTemplate = async (id: string) => {
    if (!client?.id) return;
    
    setSaving(true);
    try {
      // First, unset all other defaults
      await supabase
        .from('print_templates')
        .update({ is_default: false })
        .eq('client_id', client.id);

      // Then set the new default
      const { error } = await supabase
        .from('print_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev =>
        prev.map(t => ({ ...t, is_default: t.id === id }))
      );
      toast({
        title: 'Updated',
        description: 'Default template updated',
      });
    } catch (error) {
      console.error('Error setting default template:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const cloneTemplate = async (templateId: string, newName: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    const { id, client_id, created_at, updated_at, is_default, template_code, ...rest } = template;
    return createTemplate({
      ...rest,
      template_name: newName,
      template_code: newName.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
      is_default: false,
    });
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    saving,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    cloneTemplate,
    refetch: fetchTemplates,
  };
}
