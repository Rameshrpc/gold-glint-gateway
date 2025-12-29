import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BillOfSaleContentBlock {
  id: string;
  client_id: string;
  block_type: string;
  content_english: string | null;
  content_tamil: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SaveContentItem {
  block_type: string;
  content_english: string;
  content_tamil: string;
  display_order: number;
}

export const useBillOfSaleContent = () => {
  const { profile } = useAuth();
  const clientId = profile?.client_id;
  const queryClient = useQueryClient();

  // Fetch all Bill of Sale content blocks
  const { data: contentBlocks = [], isLoading } = useQuery({
    queryKey: ['bill-of-sale-content', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('print_content_blocks')
        .select('*')
        .eq('client_id', clientId)
        .like('block_type', 'bill_of_sale_%')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as BillOfSaleContentBlock[];
    },
    enabled: !!clientId,
  });

  // Initialize default content
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('No client ID');
      
      const { error } = await supabase.rpc('initialize_bill_of_sale_content', {
        p_client_id: clientId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-of-sale-content', clientId] });
      toast.success('Default Bill of Sale content initialized');
    },
    onError: (error) => {
      console.error('Error initializing content:', error);
      toast.error('Failed to initialize content');
    },
  });

  // Save all content (bulk update)
  const saveMutation = useMutation({
    mutationFn: async (items: SaveContentItem[]) => {
      if (!clientId) throw new Error('No client ID');

      // First, deactivate all existing Bill of Sale content blocks
      await supabase
        .from('print_content_blocks')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .like('block_type', 'bill_of_sale_%');

      // Insert new content blocks
      const blocksToInsert = items.map((item) => ({
        client_id: clientId,
        block_type: item.block_type,
        content_english: item.content_english,
        content_tamil: item.content_tamil,
        display_order: item.display_order,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('print_content_blocks')
        .insert(blocksToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-of-sale-content', clientId] });
      toast.success('Bill of Sale content saved successfully');
    },
    onError: (error) => {
      console.error('Error saving content:', error);
      toast.error('Failed to save Bill of Sale content');
    },
  });

  return {
    contentBlocks,
    isLoading,
    initializeContent: initializeMutation.mutate,
    isInitializing: initializeMutation.isPending,
    saveAllContent: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};

// Helper hook for PDF generation - returns structured content
export const useBillOfSaleContentForPDF = () => {
  const { contentBlocks, isLoading } = useBillOfSaleContent();

  const getBlockByType = (type: string) => {
    return contentBlocks.find(b => b.block_type === type);
  };

  const getBlocksByType = (type: string) => {
    return contentBlocks
      .filter(b => b.block_type === type)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  return {
    isLoading,
    hasContent: contentBlocks.length > 0,
    title: getBlockByType('bill_of_sale_title'),
    legalRef: getBlockByType('bill_of_sale_legal_ref'),
    sellerTitle: getBlockByType('bill_of_sale_seller_title'),
    buyerTitle: getBlockByType('bill_of_sale_buyer_title'),
    goodsTitle: getBlockByType('bill_of_sale_goods_title'),
    goodsIntro: getBlockByType('bill_of_sale_goods_intro'),
    considerationTitle: getBlockByType('bill_of_sale_consideration_title'),
    considerationIntro: getBlockByType('bill_of_sale_consideration_intro'),
    spotPriceLabel: getBlockByType('bill_of_sale_spot_price_label'),
    repurchaseTitle: getBlockByType('bill_of_sale_repurchase_title'),
    repurchaseIntro: getBlockByType('bill_of_sale_repurchase_intro'),
    expiryNote: getBlockByType('bill_of_sale_expiry_note'),
    declarationsTitle: getBlockByType('bill_of_sale_declarations_title'),
    declarations: getBlocksByType('bill_of_sale_declaration'),
    sellerSignature: getBlockByType('bill_of_sale_signature_seller'),
    sellerSignatureNote: getBlockByType('bill_of_sale_signature_seller_note'),
    buyerSignature: getBlockByType('bill_of_sale_signature_buyer'),
    buyerSignatureNote: getBlockByType('bill_of_sale_signature_buyer_note'),
    strikePeriodHeader: getBlockByType('bill_of_sale_strike_period_header'),
    strikePriceHeader: getBlockByType('bill_of_sale_strike_price_header'),
    strikeStatusHeader: getBlockByType('bill_of_sale_strike_status_header'),
    strikePeriods: getBlocksByType('bill_of_sale_strike_period'),
  };
};
