import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_TEMPLATE_CONFIG, PrintTemplateConfig } from '@/lib/print-utils';

interface PrintTemplate {
  id: string;
  template_code: string;
  template_name: string;
  receipt_type: string;
  language: string | null;
  layout_style: string | null;
  paper_size: string | null;
  font_family: string | null;
  color_scheme: any;
  is_active: boolean | null;
}

interface BranchTemplateAssignment {
  id: string;
  branch_id: string;
  template_id: string;
  receipt_type: string;
  priority: number;
  is_locked: boolean;
}

export function usePrintTemplate(receiptType: string, branchId?: string) {
  const { client, currentBranch } = useAuth();
  const [template, setTemplate] = useState<PrintTemplate | null>(null);
  const [config, setConfig] = useState<PrintTemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [loading, setLoading] = useState(false);

  const effectiveBranchId = branchId || currentBranch?.id;

  const fetchTemplate = useCallback(async () => {
    if (!client?.id || !receiptType) return;

    setLoading(true);
    try {
      // First, check if there's a branch-specific assignment
      if (effectiveBranchId) {
        const { data: assignment } = await supabase
          .from('branch_template_assignments')
          .select('template_id')
          .eq('client_id', client.id)
          .eq('branch_id', effectiveBranchId)
          .eq('receipt_type', receiptType)
          .order('priority', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (assignment?.template_id) {
          const { data: templateData } = await supabase
            .from('print_templates')
            .select('*')
            .eq('id', assignment.template_id)
            .eq('is_active', true)
            .single();

          if (templateData) {
            setTemplate(templateData);
            updateConfig(templateData);
            return;
          }
        }
      }

      // Fall back to default active template for this receipt type
      const { data: defaultTemplate } = await supabase
        .from('print_templates')
        .select('*')
        .eq('receipt_type', receiptType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (defaultTemplate) {
        setTemplate(defaultTemplate);
        updateConfig(defaultTemplate);
      }
    } catch (error) {
      console.error('Error fetching print template:', error);
    } finally {
      setLoading(false);
    }
  }, [client?.id, receiptType, effectiveBranchId]);

  const updateConfig = (templateData: PrintTemplate) => {
    setConfig({
      fontFamily: templateData.font_family || 'Roboto',
      fontSize: 10,
      colorScheme: templateData.color_scheme || { primary: '#B45309', secondary: '#1E40AF' },
      paperSize: templateData.paper_size || 'a4',
      language: templateData.language || 'bilingual',
      showLogo: true,
      showDeclaration: true,
      showSignatureSection: true,
      showTerms: true,
    });
  };

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  return {
    template,
    config,
    loading,
    refetch: fetchTemplate,
  };
}

export function usePrintTemplates() {
  const { client } = useAuth();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!client?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [client?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    refetch: fetchTemplates,
  };
}

export function useBranchTemplateAssignments() {
  const { client } = useAuth();
  const [assignments, setAssignments] = useState<BranchTemplateAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!client?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branch_template_assignments')
        .select('*')
        .eq('client_id', client.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [client?.id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const assignTemplate = async (branchId: string, templateId: string, receiptType: string) => {
    if (!client?.id) return;

    try {
      // Check if assignment exists
      const { data: existing } = await supabase
        .from('branch_template_assignments')
        .select('id')
        .eq('client_id', client.id)
        .eq('branch_id', branchId)
        .eq('receipt_type', receiptType)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from('branch_template_assignments')
          .update({ template_id: templateId })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('branch_template_assignments')
          .insert({
            client_id: client.id,
            branch_id: branchId,
            template_id: templateId,
            receipt_type: receiptType,
          });
      }

      await fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error assigning template:', error);
      return false;
    }
  };

  return {
    assignments,
    loading,
    refetch: fetchAssignments,
    assignTemplate,
  };
}
