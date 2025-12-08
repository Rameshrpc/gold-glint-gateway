import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrintTemplate {
  id: string;
  template_code: string;
  template_name: string;
  receipt_type: string;
  language: string;
  paper_size: string;
  layout_style: string;
  color_scheme: unknown;
  is_active: boolean;
  preview_image_url: string | null;
}

export function usePrintTemplates(receiptType?: string) {
  return useQuery({
    queryKey: ['print-templates', receiptType],
    queryFn: async () => {
      let query = supabase
        .from('print_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (receiptType) {
        query = query.eq('receipt_type', receiptType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PrintTemplate[];
    },
  });
}

export function useTemplatesByType() {
  const { data: templates, isLoading, error } = usePrintTemplates();

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.receipt_type]) {
      acc[template.receipt_type] = [];
    }
    acc[template.receipt_type].push(template);
    return acc;
  }, {} as Record<string, PrintTemplate[]>) || {};

  return {
    templates: groupedTemplates,
    isLoading,
    error,
    loanTemplates: groupedTemplates['loan'] || [],
    interestTemplates: groupedTemplates['interest'] || [],
    auctionTemplates: groupedTemplates['auction'] || [],
    redemptionTemplates: groupedTemplates['redemption'] || [],
  };
}
