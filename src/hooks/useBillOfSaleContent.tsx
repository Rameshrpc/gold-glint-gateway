import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BillOfSaleContentBlock {
  id: string;
  block_type: string;
  content_english: string;
  content_tamil: string;
  display_order: number;
  is_active: boolean;
}

export interface Declaration {
  id: string;
  title: string;
  content_english: string;
  content_tamil: string;
  display_order: number;
}

export interface StrikePeriod {
  id: string;
  label_english: string;
  label_tamil: string;
  days: number;
  display_order: number;
}

export interface BillOfSaleSettings {
  place: string;
  refPrefix: string;
}

export interface BillOfSaleContent {
  title: { english: string; tamil: string };
  legalRef: { english: string; tamil: string };
  sections: {
    seller: { english: string; tamil: string };
    buyer: { english: string; tamil: string };
    goods: { title: { english: string; tamil: string }; intro: { english: string; tamil: string } };
    consideration: { title: { english: string; tamil: string }; intro: { english: string; tamil: string }; label: { english: string; tamil: string } };
    repurchase: { title: { english: string; tamil: string }; intro: { english: string; tamil: string }; note: { english: string; tamil: string } };
    declarations: { english: string; tamil: string };
  };
  declarations: Declaration[];
  signatures: {
    seller: { label: { english: string; tamil: string }; note: { english: string; tamil: string } };
    buyer: { label: { english: string; tamil: string }; note: { english: string; tamil: string } };
  };
  strikePeriods: StrikePeriod[];
  strikeHeaders: {
    period: { english: string; tamil: string };
    price: { english: string; tamil: string };
    status: { english: string; tamil: string };
  };
  settings: BillOfSaleSettings;
}

const DEFAULT_CONTENT: BillOfSaleContent = {
  title: { english: 'BILL OF SALE & REPURCHASE OPTION AGREEMENT', tamil: 'விற்பனை மற்றும் மறுகொள்முதல் விருப்ப ஒப்பந்தம்' },
  legalRef: { english: '(Under Sale of Goods Act, 1930 & Contract Act, 1872)', tamil: '(விற்பனை பொருட்கள் சட்டம், 1930 & ஒப்பந்த சட்டம், 1872 கீழ்)' },
  sections: {
    seller: { english: 'THE SELLER (Customer)', tamil: 'விற்பவர் (வாடிக்கையாளர்)' },
    buyer: { english: 'THE BUYER (Trading Entity)', tamil: 'வாங்குபவர் (வர்த்தக நிறுவனம்)' },
    goods: {
      title: { english: 'DESCRIPTION OF GOODS SOLD', tamil: 'விற்கப்பட்ட பொருட்களின் விவரம்' },
      intro: { english: 'The Seller hereby sells and transfers absolute title and ownership of the following pre-owned jewellery to the Buyer:', tamil: 'விற்பவர் பின்வரும் பழைய நகைகளின் முழு உரிமையையும் உடைமையையும் வாங்குபவருக்கு விற்பனை செய்து மாற்றுகிறார்:' }
    },
    consideration: {
      title: { english: 'CONSIDERATION (PAYMENT DETAILS)', tamil: 'பரிசீலனை (கட்டண விவரங்கள்)' },
      intro: { english: 'The Buyer has paid the following amount to the Seller as full and final consideration for the purchase of the above goods:', tamil: 'மேற்கண்ட பொருட்களை வாங்குவதற்கான முழு மற்றும் இறுதித் தொகையாக வாங்குபவர் விற்பவருக்கு பின்வரும் தொகையை செலுத்தியுள்ளார்:' },
      label: { english: 'SPOT PURCHASE PRICE (CASH HANDED OVER)', tamil: 'உடனடி கொள்முதல் விலை (ரொக்கமாக வழங்கப்பட்டது)' }
    },
    repurchase: {
      title: { english: 'REPURCHASE OPTION (BUYBACK TERMS)', tamil: 'மறுகொள்முதல் விருப்பம் (திருப்பி வாங்கும் விதிமுறைகள்)' },
      intro: { english: 'As part of this trading transaction, the Buyer grants the Seller an exclusive option to buy back the exact same goods within the specified period at the following fixed Strike Prices. This price includes the original purchase cost plus the Buyer\'s trade margin and administrative fees.', tamil: 'இந்த வர்த்தக பரிவர்த்தனையின் ஒரு பகுதியாக, குறிப்பிட்ட காலத்திற்குள் கீழ்க்கண்ட நிலையான ஸ்ட்ரைக் விலையில் அதே பொருட்களை திருப்பி வாங்குவதற்கான பிரத்யேக விருப்பத்தை வாங்குபவர் விற்பவருக்கு வழங்குகிறார்.' },
      note: { english: 'Note: If the option is not exercised by {{expiry_date}}, this agreement expires. The Buyer ({{company_name}}) retains full ownership and is free to liquidate/melt/sell the asset without further notice.', tamil: 'குறிப்பு: {{expiry_date}} க்குள் விருப்பம் பயன்படுத்தப்படாவிட்டால், இந்த ஒப்பந்தம் காலாவதியாகும். வாங்குபவர் ({{company_name}}) முழு உரிமையைத் தக்க வைத்துக் கொள்கிறார்.' }
    },
    declarations: { english: 'DECLARATIONS & TAX COMPLIANCE', tamil: 'அறிவிப்புகள் & வரி இணக்கம்' }
  },
  declarations: [
    { id: '1', title: 'Transfer of Title', content_english: 'I (The Seller) declare that I am the legal owner of these goods. I have sold them to {{company_name}} voluntarily.', content_tamil: 'நான் (விற்பவர்) இந்த பொருட்களின் சட்டப்பூர்வ உரிமையாளர் என்று அறிவிக்கிறேன். நான் அவற்றை {{company_name}} க்கு தானாகவே விற்றேன்.', display_order: 1 },
    { id: '2', title: 'No Financial Transaction', content_english: 'I understand this is a Buy-Sell transaction and not a financial transaction. There is no rate applicable; there is only a repurchase price difference.', content_tamil: 'இது கடன் பரிவர்த்தனை அல்ல, வாங்கல்-விற்றல் பரிவர்த்தனை என்பதை புரிந்துகொள்கிறேன். வட்டி விகிதம் இல்லை; மறுகொள்முதல் விலை வேறுபாடு மட்டுமே உள்ளது.', display_order: 2 },
    { id: '3', title: 'GST Rule 32(5)', content_english: 'The Buyer ({{company_name}}) declares that this is a purchase of second-hand goods. GST will be paid on the margin earned upon resale/repurchase as per Rule 32(5) of CGST Rules, 2017.', content_tamil: 'வாங்குபவர் ({{company_name}}) இது பழைய பொருட்களின் கொள்முதல் என்று அறிவிக்கிறார். CGST விதிகள், 2017 இன் விதி 32(5) படி மறுவிற்பனை/மறுகொள்முதலில் ஈட்டிய மார்ஜினில் GST செலுத்தப்படும்.', display_order: 3 },
    { id: '4', title: 'Custody Authorization', content_english: 'I authorize {{company_name}} to store these goods in their safe deposit vaults or with their financial partners/bankers for logistics and safety purposes during the option period.', content_tamil: 'விருப்ப காலத்தில் பாதுகாப்பு மற்றும் தளவாட நோக்கங்களுக்காக இந்த பொருட்களை {{company_name}} அவர்களின் பாதுகாப்பு பெட்டகங்களில் அல்லது நிதி பங்காளிகள்/வங்கிகளிடம் சேமிக்க அனுமதிக்கிறேன்.', display_order: 4 }
  ],
  signatures: {
    seller: { 
      label: { english: 'Signature of SELLER (Customer)', tamil: 'விற்பவர் கையொப்பம் (வாடிக்கையாளர்)' },
      note: { english: '(I have received the cash and sold my gold)', tamil: '(நான் ரொக்கத்தைப் பெற்று என் தங்கத்தை விற்றேன்)' }
    },
    buyer: {
      label: { english: 'For {{company_name}}', tamil: '{{company_name}} சார்பாக' },
      note: { english: '(Authorized Signatory)', tamil: '(அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்)' }
    }
  },
  strikePeriods: [
    { id: '1', label_english: '0-30 Days', label_tamil: '0-30 நாட்கள்', days: 30, display_order: 1 },
    { id: '2', label_english: '31-60 Days', label_tamil: '31-60 நாட்கள்', days: 60, display_order: 2 },
    { id: '3', label_english: '61-90 Days', label_tamil: '61-90 நாட்கள்', days: 90, display_order: 3 }
  ],
  strikeHeaders: {
    period: { english: 'If Exercised Between...', tamil: 'இடையில் பயன்படுத்தினால்...' },
    price: { english: 'You Pay (Strike Price)', tamil: 'நீங்கள் செலுத்த வேண்டிய தொகை (ஸ்ட்ரைக் விலை)' },
    status: { english: 'Status', tamil: 'நிலை' }
  },
  settings: {
    place: 'Coimbatore',
    refPrefix: 'ZG'
  }
};

export function useBillOfSaleContent() {
  const { client } = useAuth();
  const [content, setContent] = useState<BillOfSaleContent>(DEFAULT_CONTENT);
  const [contentBlocks, setContentBlocks] = useState<BillOfSaleContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const parseContent = useCallback((blocks: BillOfSaleContentBlock[]): BillOfSaleContent => {
    const getBlock = (type: string) => blocks.find(b => b.block_type === type);
    const getBlocks = (type: string) => blocks.filter(b => b.block_type === type).sort((a, b) => a.display_order - b.display_order);
    
    const title = getBlock('bill_of_sale_title');
    const legalRef = getBlock('bill_of_sale_legal_ref');
    const sellerTitle = getBlock('bill_of_sale_seller_title');
    const buyerTitle = getBlock('bill_of_sale_buyer_title');
    const goodsTitle = getBlock('bill_of_sale_goods_title');
    const goodsIntro = getBlock('bill_of_sale_goods_intro');
    const considerationTitle = getBlock('bill_of_sale_consideration_title');
    const considerationIntro = getBlock('bill_of_sale_consideration_intro');
    const spotPriceLabel = getBlock('bill_of_sale_spot_price_label');
    const repurchaseTitle = getBlock('bill_of_sale_repurchase_title');
    const repurchaseIntro = getBlock('bill_of_sale_repurchase_intro');
    const expiryNote = getBlock('bill_of_sale_expiry_note');
    const declarationsTitle = getBlock('bill_of_sale_declarations_title');
    const sellerSignature = getBlock('bill_of_sale_signature_seller');
    const sellerSignatureNote = getBlock('bill_of_sale_signature_seller_note');
    const buyerSignature = getBlock('bill_of_sale_signature_buyer');
    const buyerSignatureNote = getBlock('bill_of_sale_signature_buyer_note');
    const periodHeader = getBlock('bill_of_sale_strike_period_header');
    const priceHeader = getBlock('bill_of_sale_strike_price_header');
    const statusHeader = getBlock('bill_of_sale_strike_status_header');

    // Parse declarations (format: "Title|English Content|Tamil Content")
    const declarationBlocks = getBlocks('bill_of_sale_declaration');
    const declarations: Declaration[] = declarationBlocks.map((block, index) => {
      const parts = block.content_english.split('|');
      const tamilParts = block.content_tamil.split('|');
      return {
        id: block.id,
        title: parts[0] || `Declaration ${index + 1}`,
        content_english: parts[1] || block.content_english,
        content_tamil: tamilParts.length > 1 ? tamilParts[1] : block.content_tamil,
        display_order: block.display_order
      };
    });

    // Parse strike periods (format: "English Label|Tamil Label|Days")
    const periodBlocks = getBlocks('bill_of_sale_strike_period');
    const strikePeriods: StrikePeriod[] = periodBlocks.map((block) => {
      const parts = block.content_english.split('|');
      return {
        id: block.id,
        label_english: parts[0] || block.content_english,
        label_tamil: parts[1] || block.content_tamil,
        days: parseInt(parts[2] || '30', 10),
        display_order: block.display_order
      };
    });

    return {
      title: { english: title?.content_english || DEFAULT_CONTENT.title.english, tamil: title?.content_tamil || DEFAULT_CONTENT.title.tamil },
      legalRef: { english: legalRef?.content_english || DEFAULT_CONTENT.legalRef.english, tamil: legalRef?.content_tamil || DEFAULT_CONTENT.legalRef.tamil },
      sections: {
        seller: { english: sellerTitle?.content_english || DEFAULT_CONTENT.sections.seller.english, tamil: sellerTitle?.content_tamil || DEFAULT_CONTENT.sections.seller.tamil },
        buyer: { english: buyerTitle?.content_english || DEFAULT_CONTENT.sections.buyer.english, tamil: buyerTitle?.content_tamil || DEFAULT_CONTENT.sections.buyer.tamil },
        goods: {
          title: { english: goodsTitle?.content_english || DEFAULT_CONTENT.sections.goods.title.english, tamil: goodsTitle?.content_tamil || DEFAULT_CONTENT.sections.goods.title.tamil },
          intro: { english: goodsIntro?.content_english || DEFAULT_CONTENT.sections.goods.intro.english, tamil: goodsIntro?.content_tamil || DEFAULT_CONTENT.sections.goods.intro.tamil }
        },
        consideration: {
          title: { english: considerationTitle?.content_english || DEFAULT_CONTENT.sections.consideration.title.english, tamil: considerationTitle?.content_tamil || DEFAULT_CONTENT.sections.consideration.title.tamil },
          intro: { english: considerationIntro?.content_english || DEFAULT_CONTENT.sections.consideration.intro.english, tamil: considerationIntro?.content_tamil || DEFAULT_CONTENT.sections.consideration.intro.tamil },
          label: { english: spotPriceLabel?.content_english || DEFAULT_CONTENT.sections.consideration.label.english, tamil: spotPriceLabel?.content_tamil || DEFAULT_CONTENT.sections.consideration.label.tamil }
        },
        repurchase: {
          title: { english: repurchaseTitle?.content_english || DEFAULT_CONTENT.sections.repurchase.title.english, tamil: repurchaseTitle?.content_tamil || DEFAULT_CONTENT.sections.repurchase.title.tamil },
          intro: { english: repurchaseIntro?.content_english || DEFAULT_CONTENT.sections.repurchase.intro.english, tamil: repurchaseIntro?.content_tamil || DEFAULT_CONTENT.sections.repurchase.intro.tamil },
          note: { english: expiryNote?.content_english || DEFAULT_CONTENT.sections.repurchase.note.english, tamil: expiryNote?.content_tamil || DEFAULT_CONTENT.sections.repurchase.note.tamil }
        },
        declarations: { english: declarationsTitle?.content_english || DEFAULT_CONTENT.sections.declarations.english, tamil: declarationsTitle?.content_tamil || DEFAULT_CONTENT.sections.declarations.tamil }
      },
      declarations: declarations.length > 0 ? declarations : DEFAULT_CONTENT.declarations,
      signatures: {
        seller: {
          label: { english: sellerSignature?.content_english || DEFAULT_CONTENT.signatures.seller.label.english, tamil: sellerSignature?.content_tamil || DEFAULT_CONTENT.signatures.seller.label.tamil },
          note: { english: sellerSignatureNote?.content_english || DEFAULT_CONTENT.signatures.seller.note.english, tamil: sellerSignatureNote?.content_tamil || DEFAULT_CONTENT.signatures.seller.note.tamil }
        },
        buyer: {
          label: { english: buyerSignature?.content_english || DEFAULT_CONTENT.signatures.buyer.label.english, tamil: buyerSignature?.content_tamil || DEFAULT_CONTENT.signatures.buyer.label.tamil },
          note: { english: buyerSignatureNote?.content_english || DEFAULT_CONTENT.signatures.buyer.note.english, tamil: buyerSignatureNote?.content_tamil || DEFAULT_CONTENT.signatures.buyer.note.tamil }
        }
      },
      strikePeriods: strikePeriods.length > 0 ? strikePeriods : DEFAULT_CONTENT.strikePeriods,
      strikeHeaders: {
        period: { english: periodHeader?.content_english || DEFAULT_CONTENT.strikeHeaders.period.english, tamil: periodHeader?.content_tamil || DEFAULT_CONTENT.strikeHeaders.period.tamil },
        price: { english: priceHeader?.content_english || DEFAULT_CONTENT.strikeHeaders.price.english, tamil: priceHeader?.content_tamil || DEFAULT_CONTENT.strikeHeaders.price.tamil },
        status: { english: statusHeader?.content_english || DEFAULT_CONTENT.strikeHeaders.status.english, tamil: statusHeader?.content_tamil || DEFAULT_CONTENT.strikeHeaders.status.tamil }
      },
      settings: DEFAULT_CONTENT.settings
    };
  }, []);

  const fetchContent = useCallback(async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      // Fetch content blocks
      const { data: blocks, error: blocksError } = await supabase
        .from('print_content_blocks')
        .select('*')
        .eq('client_id', client.id)
        .like('block_type', 'bill_of_sale_%')
        .eq('is_active', true)
        .order('display_order');

      if (blocksError) throw blocksError;

      // Fetch settings
      const { data: settings, error: settingsError } = await supabase
        .from('print_settings')
        .select('bill_of_sale_place, bill_of_sale_ref_prefix')
        .eq('client_id', client.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      setContentBlocks(blocks || []);
      
      const parsedContent = parseContent(blocks || []);
      if (settings) {
        parsedContent.settings = {
          place: (settings as any).bill_of_sale_place || 'Coimbatore',
          refPrefix: (settings as any).bill_of_sale_ref_prefix || 'ZG'
        };
      }
      setContent(parsedContent);
    } catch (error) {
      console.error('Error fetching Bill of Sale content:', error);
    } finally {
      setLoading(false);
    }
  }, [client?.id, parseContent]);

  const initializeContent = useCallback(async () => {
    if (!client?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase.rpc('initialize_bill_of_sale_content', {
        p_client_id: client.id
      });

      if (error) throw error;
      await fetchContent();
      toast.success('Bill of Sale content initialized');
    } catch (error) {
      console.error('Error initializing content:', error);
      toast.error('Failed to initialize content');
    } finally {
      setSaving(false);
    }
  }, [client?.id, fetchContent]);

  const updateContentBlock = useCallback(async (id: string, updates: Partial<BillOfSaleContentBlock>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_content_blocks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast.success('Content updated');
    } catch (error) {
      console.error('Error updating content block:', error);
      toast.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  }, [fetchContent]);

  const addContentBlock = useCallback(async (block: Omit<BillOfSaleContentBlock, 'id' | 'is_active'>) => {
    if (!client?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_content_blocks')
        .insert({
          client_id: client.id,
          block_type: block.block_type,
          content_english: block.content_english,
          content_tamil: block.content_tamil,
          display_order: block.display_order,
          is_active: true
        });

      if (error) throw error;
      await fetchContent();
      toast.success('Content block added');
    } catch (error) {
      console.error('Error adding content block:', error);
      toast.error('Failed to add content block');
    } finally {
      setSaving(false);
    }
  }, [client?.id, fetchContent]);

  const deleteContentBlock = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_content_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast.success('Content block deleted');
    } catch (error) {
      console.error('Error deleting content block:', error);
      toast.error('Failed to delete content block');
    } finally {
      setSaving(false);
    }
  }, [fetchContent]);

  const updateSettings = useCallback(async (settings: BillOfSaleSettings) => {
    if (!client?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_settings')
        .update({
          bill_of_sale_place: settings.place,
          bill_of_sale_ref_prefix: settings.refPrefix
        })
        .eq('client_id', client.id);

      if (error) throw error;
      setContent(prev => ({ ...prev, settings }));
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  }, [client?.id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    contentBlocks,
    loading,
    saving,
    fetchContent,
    initializeContent,
    updateContentBlock,
    addContentBlock,
    deleteContentBlock,
    updateSettings,
    hasContent: contentBlocks.length > 0
  };
}
