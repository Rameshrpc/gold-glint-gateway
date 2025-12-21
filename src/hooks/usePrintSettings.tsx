import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PrintSettings {
  id: string;
  client_id: string;
  language: 'bilingual' | 'english' | 'tamil';
  paper_size: 'A4' | 'Legal' | 'Letter';
  font_family: string;
  loan_receipt_copies: number;
  kyc_documents_copies: number;
  jewel_image_copies: number;
  gold_declaration_copies: number;
  terms_conditions_copies: number;
  include_loan_receipt: boolean;
  include_kyc_documents: boolean;
  include_jewel_image: boolean;
  include_gold_declaration: boolean;
  include_terms_conditions: boolean;
  header_english: string | null;
  header_tamil: string | null;
  footer_english: string | null;
  footer_tamil: string | null;
  company_slogan_english: string | null;
  company_slogan_tamil: string | null;
  logo_url: string | null;
}

export interface PrintContentBlock {
  id: string;
  client_id: string;
  block_type: 'gold_declaration' | 'terms_header' | 'acknowledgment' | 'warning' | 'signature_labels';
  content_english: string;
  content_tamil: string;
  display_order: number;
  is_active: boolean;
}

const DEFAULT_SETTINGS: Omit<PrintSettings, 'id' | 'client_id'> = {
  language: 'bilingual',
  paper_size: 'A4',
  font_family: 'Roboto',
  loan_receipt_copies: 2,
  kyc_documents_copies: 1,
  jewel_image_copies: 1,
  gold_declaration_copies: 1,
  terms_conditions_copies: 1,
  include_loan_receipt: true,
  include_kyc_documents: true,
  include_jewel_image: true,
  include_gold_declaration: true,
  include_terms_conditions: true,
  header_english: null,
  header_tamil: null,
  footer_english: 'Thank you for your business',
  footer_tamil: 'உங்கள் வணிகத்திற்கு நன்றி',
  company_slogan_english: null,
  company_slogan_tamil: null,
  logo_url: null,
};

export function usePrintSettings() {
  const { client } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [contentBlocks, setContentBlocks] = useState<PrintContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      // Just fetch existing settings - don't auto-create
      const { data: settingsData } = await supabase
        .from('print_settings')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();
      
      if (settingsData) {
        setSettings(settingsData as PrintSettings);
      }
      // If no settings exist, we use DEFAULT_SETTINGS (via the return statement)
      // Settings will be created on first explicit save

      // Fetch content blocks
      const { data: blocksData } = await supabase
        .from('print_content_blocks')
        .select('*')
        .eq('client_id', client.id)
        .order('block_type')
        .order('display_order');
      
      setContentBlocks((blocksData || []) as PrintContentBlock[]);

    } catch (error) {
      console.error('Error fetching print settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load print settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [client?.id, toast]);

  const initializeContentBlocks = async (clientId: string) => {
    const defaultBlocks = [
      { block_type: 'gold_declaration', content_english: 'The gold ornaments pledged are my personal property and I am the sole owner.', content_tamil: 'அடமானம் வைக்கப்பட்ட தங்க நகைகள் எனது சொந்த சொத்து மற்றும் நான் ஒரே உரிமையாளர்.', display_order: 1 },
      { block_type: 'gold_declaration', content_english: 'The ornaments are not stolen, illegally acquired, or encumbered.', content_tamil: 'இந்த நகைகள் திருடப்படவில்லை, சட்டவிரோதமாக பெறப்படவில்லை அல்லது சுமையாக இல்லை.', display_order: 2 },
      { block_type: 'gold_declaration', content_english: 'The gold is not subject to any other pledge, loan, or legal proceedings.', content_tamil: 'இந்த தங்கம் வேறு எந்த அடமானம், கடன் அல்லது சட்ட நடவடிக்கைகளுக்கும் உட்பட்டதல்ல.', display_order: 3 },
      { block_type: 'gold_declaration', content_english: 'I am authorized to pledge these ornaments and the weight/purity declared is accurate.', content_tamil: 'இந்த நகைகளை அடமானம் வைக்க நான் அதிகாரம் பெற்றுள்ளேன், மேலும் அறிவிக்கப்பட்ட எடை/தூய்மை துல்லியமானது.', display_order: 4 },
      { block_type: 'warning', content_english: 'Warning: Any false declaration may result in legal action and forfeiture of pledged items.', content_tamil: 'எச்சரிக்கை: தவறான அறிவிப்பு சட்ட நடவடிக்கை மற்றும் அடமான பொருட்களை இழக்க நேரிடும்.', display_order: 1 },
      { block_type: 'acknowledgment', content_english: 'I have read and understood all terms and conditions mentioned above.', content_tamil: 'மேலே குறிப்பிடப்பட்ட அனைத்து விதிமுறைகளையும் நான் படித்து புரிந்துகொண்டேன்.', display_order: 1 },
      { block_type: 'signature_labels', content_english: 'Customer Signature', content_tamil: 'வாடிக்கையாளர் கையொப்பம்', display_order: 1 },
      { block_type: 'signature_labels', content_english: 'Redemption Signature', content_tamil: 'மீட்பு கையொப்பம்', display_order: 2 },
      { block_type: 'signature_labels', content_english: 'Authorized Signature', content_tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்', display_order: 3 },
    ];

    await supabase.from('print_content_blocks').insert(
      defaultBlocks.map(block => ({ ...block, client_id: clientId }))
    );
  };

  const updateSettings = async (updates: Partial<PrintSettings>) => {
    if (!client?.id) return;
    
    setSaving(true);
    try {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('print_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', settings.id);

        if (error) throw error;
        setSettings(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Create settings on first save
        const { data: newSettings, error } = await supabase
          .from('print_settings')
          .insert({ client_id: client.id, ...updates })
          .select()
          .single();

        if (error) throw error;
        setSettings(newSettings as PrintSettings);
        
        // Also initialize content blocks on first save
        await initializeContentBlocks(client.id);
      }

      toast({
        title: 'Saved',
        description: 'Print settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating print settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save print settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateContentBlock = async (blockId: string, updates: Partial<PrintContentBlock>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_content_blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', blockId);

      if (error) throw error;

      setContentBlocks(prev =>
        prev.map(block => block.id === blockId ? { ...block, ...updates } : block)
      );
      toast({
        title: 'Saved',
        description: 'Content block updated',
      });
    } catch (error) {
      console.error('Error updating content block:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addContentBlock = async (block: Omit<PrintContentBlock, 'id' | 'client_id'>) => {
    if (!client?.id) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('print_content_blocks')
        .insert({ ...block, client_id: client.id })
        .select()
        .single();

      if (error) throw error;

      setContentBlocks(prev => [...prev, data as PrintContentBlock]);
      toast({
        title: 'Added',
        description: 'Content block added successfully',
      });
    } catch (error) {
      console.error('Error adding content block:', error);
      toast({
        title: 'Error',
        description: 'Failed to add content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteContentBlock = async (blockId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setContentBlocks(prev => prev.filter(block => block.id !== blockId));
      toast({
        title: 'Deleted',
        description: 'Content block removed',
      });
    } catch (error) {
      console.error('Error deleting content block:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getBlocksByType = (type: PrintContentBlock['block_type']) => {
    return contentBlocks
      .filter(block => block.block_type === type && block.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings: settings || DEFAULT_SETTINGS as PrintSettings,
    contentBlocks,
    loading,
    saving,
    updateSettings,
    updateContentBlock,
    addContentBlock,
    deleteContentBlock,
    getBlocksByType,
    refetch: fetchSettings,
  };
}
