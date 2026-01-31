import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PrintSettings } from '@/hooks/usePrintSettings';
import { BranchPrintSettings } from '@/hooks/useBranchPrintSettings';
import { PrintTemplate } from '@/hooks/usePrintTemplates';

export interface EffectivePrintSettings {
  // Core settings
  language: 'bilingual' | 'english' | 'tamil';
  paper_size: 'A4' | 'Legal' | 'Letter';
  font_family: string;
  
  // Document inclusion
  include_loan_receipt: boolean;
  include_kyc_documents: boolean;
  include_jewel_image: boolean;
  include_gold_declaration: boolean;
  include_terms_conditions: boolean;
  
  // Copy counts
  loan_receipt_copies: number;
  kyc_documents_copies: number;
  jewel_image_copies: number;
  gold_declaration_copies: number;
  terms_conditions_copies: number;
  
  // Branding - resolved with priority: branch > template > client
  logo_url: string | null;
  company_slogan_english: string | null;
  company_slogan_tamil: string | null;
  footer_english: string | null;
  footer_tamil: string | null;
  header_english: string | null;
  header_tamil: string | null;
  
  // Sale Agreement specific
  sale_agreement_company_name: string | null;
  sale_agreement_company_address: string | null;
  
  // Source info
  source: 'branch' | 'template' | 'client' | 'default';
  template_name?: string;
}

const DEFAULT_SETTINGS: EffectivePrintSettings = {
  language: 'bilingual',
  paper_size: 'A4',
  font_family: 'Roboto',
  include_loan_receipt: true,
  include_kyc_documents: true,
  include_jewel_image: true,
  include_gold_declaration: true,
  include_terms_conditions: true,
  loan_receipt_copies: 2,
  kyc_documents_copies: 1,
  jewel_image_copies: 1,
  gold_declaration_copies: 1,
  terms_conditions_copies: 1,
  logo_url: null,
  company_slogan_english: null,
  company_slogan_tamil: null,
  footer_english: 'Thank you for your business',
  footer_tamil: 'உங்கள் வணிகத்திற்கு நன்றி',
  header_english: null,
  header_tamil: null,
  sale_agreement_company_name: null,
  sale_agreement_company_address: null,
  source: 'default',
};

export function useEffectivePrintSettings(branchId?: string) {
  const { client } = useAuth();
  const [effectiveSettings, setEffectiveSettings] = useState<EffectivePrintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchEffectiveSettings = useCallback(async () => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [clientSettingsRes, branchSettingsRes, templatesRes] = await Promise.all([
        // 1. Client-level print settings
        supabase
          .from('print_settings')
          .select('*')
          .eq('client_id', client.id)
          .maybeSingle(),
        
        // 2. Branch-specific settings (if branchId provided)
        branchId
          ? supabase
              .from('branch_print_settings')
              .select('*')
              .eq('branch_id', branchId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        
        // 3. All templates for this client
        supabase
          .from('print_templates')
          .select('*')
          .eq('client_id', client.id)
          .eq('is_active', true),
      ]);

      const clientSettings = clientSettingsRes.data as PrintSettings | null;
      const branchSettings = branchSettingsRes.data as BranchPrintSettings | null;
      const templates = (templatesRes.data || []) as PrintTemplate[];

      // Find the template to use
      let template: PrintTemplate | null = null;
      if (branchSettings?.default_template_id) {
        template = templates.find(t => t.id === branchSettings.default_template_id) || null;
      }
      if (!template) {
        // Fall back to default template
        template = templates.find(t => t.is_default) || null;
      }

      // Build effective settings with priority: branch > template > client > default
      const effective: EffectivePrintSettings = {
        // Core settings from template or client
        language: (template?.language || clientSettings?.language || 'bilingual') as 'bilingual' | 'english' | 'tamil',
        paper_size: (template?.paper_size || clientSettings?.paper_size || 'A4') as 'A4' | 'Legal' | 'Letter',
        font_family: template?.font_family || clientSettings?.font_family || 'Roboto',

        // Document inclusion from template or client
        include_loan_receipt: template?.include_loan_receipt ?? clientSettings?.include_loan_receipt ?? true,
        include_kyc_documents: template?.include_kyc_documents ?? clientSettings?.include_kyc_documents ?? true,
        include_jewel_image: template?.include_jewel_image ?? clientSettings?.include_jewel_image ?? true,
        include_gold_declaration: template?.include_gold_declaration ?? clientSettings?.include_gold_declaration ?? true,
        include_terms_conditions: template?.include_terms_conditions ?? clientSettings?.include_terms_conditions ?? true,

        // Copy counts from template or client
        loan_receipt_copies: template?.loan_receipt_copies ?? clientSettings?.loan_receipt_copies ?? 2,
        kyc_documents_copies: template?.kyc_documents_copies ?? clientSettings?.kyc_documents_copies ?? 1,
        jewel_image_copies: template?.jewel_image_copies ?? clientSettings?.jewel_image_copies ?? 1,
        gold_declaration_copies: template?.gold_declaration_copies ?? clientSettings?.gold_declaration_copies ?? 1,
        terms_conditions_copies: template?.terms_conditions_copies ?? clientSettings?.terms_conditions_copies ?? 1,

        // Logo resolution: branch (if not using client logo) > template > client
        logo_url: resolveLogoUrl(branchSettings, template, clientSettings),

        // Slogans: branch > template > client
        company_slogan_english: branchSettings?.company_slogan_english || template?.company_slogan_english || clientSettings?.company_slogan_english || null,
        company_slogan_tamil: branchSettings?.company_slogan_tamil || template?.company_slogan_tamil || clientSettings?.company_slogan_tamil || null,

        // Footer: branch > template > client
        footer_english: branchSettings?.footer_english || template?.footer_english || clientSettings?.footer_english || 'Thank you for your business',
        footer_tamil: branchSettings?.footer_tamil || template?.footer_tamil || clientSettings?.footer_tamil || 'உங்கள் வணிகத்திற்கு நன்றி',

        // Header from template or client
        header_english: template?.header_english || clientSettings?.header_english || null,
        header_tamil: template?.header_tamil || clientSettings?.header_tamil || null,

        // Sale Agreement specific
        sale_agreement_company_name: clientSettings?.sale_agreement_company_name || null,
        sale_agreement_company_address: clientSettings?.sale_agreement_company_address || null,

        // Source info
        source: branchSettings ? 'branch' : template ? 'template' : clientSettings ? 'client' : 'default',
        template_name: template?.template_name,
      };

      setEffectiveSettings(effective);
    } catch (error) {
      console.error('Error fetching effective print settings:', error);
      setEffectiveSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [client?.id, branchId]);

  useEffect(() => {
    fetchEffectiveSettings();
  }, [fetchEffectiveSettings]);

  return {
    settings: effectiveSettings,
    loading,
    refetch: fetchEffectiveSettings,
  };
}

/**
 * Resolve logo URL with priority: branch > template > client
 */
function resolveLogoUrl(
  branchSettings: BranchPrintSettings | null,
  template: PrintTemplate | null,
  clientSettings: PrintSettings | null
): string | null {
  // If branch has its own logo and NOT using client logo
  if (branchSettings && !branchSettings.use_client_logo && branchSettings.logo_url) {
    return branchSettings.logo_url;
  }

  // If template has logo
  if (template?.logo_url) {
    return template.logo_url;
  }

  // Fall back to client logo
  return clientSettings?.logo_url || null;
}
