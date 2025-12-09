import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PrintSettings {
  logo_url: string | null;
  header_text: string | null;
  footer_text: string | null;
  watermark_text: string | null;
  watermark_opacity: number | null;
  show_logo: boolean | null;
  show_declaration: boolean | null;
  show_terms: boolean | null;
  show_signature_section: boolean | null;
  copies: number | null;
  template_id: string | null;
  font_size: number | null;
}

interface UsePrintConfigReturn {
  settings: PrintSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<PrintSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePrintConfig(receiptType: string = 'loan'): UsePrintConfigReturn {
  const { client } = useAuth();
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_print_settings')
        .select('*')
        .eq('client_id', client.id)
        .eq('receipt_type', receiptType)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          logo_url: data.logo_url,
          header_text: data.header_text,
          footer_text: data.footer_text,
          watermark_text: data.watermark_text,
          watermark_opacity: data.watermark_opacity,
          show_logo: data.show_logo,
          show_declaration: data.show_declaration,
          show_terms: data.show_terms,
          show_signature_section: data.show_signature_section,
          copies: data.copies,
          template_id: data.template_id,
          font_size: data.font_size,
        });
      } else {
        // Return default settings if none exist
        setSettings({
          logo_url: null,
          header_text: null,
          footer_text: null,
          watermark_text: null,
          watermark_opacity: 15,
          show_logo: true,
          show_declaration: true,
          show_terms: true,
          show_signature_section: true,
          copies: 2,
          template_id: null,
          font_size: 12,
        });
      }
    } catch (err) {
      console.error('Error fetching print settings:', err);
      setError('Failed to load print settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<PrintSettings>) => {
    if (!client?.id) throw new Error('No client ID');

    // Check if record exists
    const { data: existing } = await supabase
      .from('client_print_settings')
      .select('id')
      .eq('client_id', client.id)
      .eq('receipt_type', receiptType)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('client_print_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', client.id)
        .eq('receipt_type', receiptType);

      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('client_print_settings')
        .insert({
          client_id: client.id,
          receipt_type: receiptType,
          ...updates,
        });

      if (insertError) throw insertError;
    }

    // Refresh settings
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, [client?.id, receiptType]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
