import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBillOfSaleContent } from '@/hooks/useBillOfSaleContent';
import { Loader2, Plus, Trash2, Edit2, Save, X, Scale, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id?: string;
  label: string;
  block_type: string;
  content_english: string;
  content_tamil: string;
  display_order: number;
  is_deletable: boolean;
}

const DEFAULT_CONTENT: ContentItem[] = [
  { label: 'Document Title', block_type: 'bill_of_sale_title', content_english: 'BILL OF SALE & REPURCHASE OPTION AGREEMENT', content_tamil: 'விற்பனை மற்றும் மறுகொள்முதல் விருப்ப ஒப்பந்தம்', display_order: 1, is_deletable: false },
  { label: 'Legal Reference', block_type: 'bill_of_sale_legal_ref', content_english: '(Under Sale of Goods Act, 1930 & Contract Act, 1872)', content_tamil: '(விற்பனை பொருட்கள் சட்டம், 1930 & ஒப்பந்த சட்டம், 1872 கீழ்)', display_order: 2, is_deletable: false },
  { label: 'Seller Title', block_type: 'bill_of_sale_seller_title', content_english: 'THE SELLER (Customer)', content_tamil: 'விற்பவர் (வாடிக்கையாளர்)', display_order: 3, is_deletable: false },
  { label: 'Buyer Title', block_type: 'bill_of_sale_buyer_title', content_english: 'THE BUYER (Trading Entity)', content_tamil: 'வாங்குபவர் (வர்த்தக நிறுவனம்)', display_order: 4, is_deletable: false },
  { label: 'Goods Section Title', block_type: 'bill_of_sale_goods_title', content_english: 'DESCRIPTION OF GOODS SOLD', content_tamil: 'விற்கப்பட்ட பொருட்களின் விவரம்', display_order: 5, is_deletable: false },
  { label: 'Goods Section Intro', block_type: 'bill_of_sale_goods_intro', content_english: 'The Seller hereby sells and transfers absolute title and ownership of the following pre-owned jewellery to the Buyer:', content_tamil: 'விற்பவர் பின்வரும் பழைய நகைகளின் முழு உரிமையையும் உடைமையையும் வாங்குபவருக்கு விற்பனை செய்து மாற்றுகிறார்:', display_order: 6, is_deletable: false },
  { label: 'Consideration Title', block_type: 'bill_of_sale_consideration_title', content_english: 'CONSIDERATION (PAYMENT DETAILS)', content_tamil: 'பரிசீலனை (கட்டண விவரங்கள்)', display_order: 7, is_deletable: false },
  { label: 'Consideration Intro', block_type: 'bill_of_sale_consideration_intro', content_english: 'The Buyer has paid the following amount to the Seller as full and final consideration for the purchase of the above goods:', content_tamil: 'மேற்கண்ட பொருட்களை வாங்குவதற்கான முழு மற்றும் இறுதித் தொகையாக வாங்குபவர் விற்பவருக்கு பின்வரும் தொகையை செலுத்தியுள்ளார்:', display_order: 8, is_deletable: false },
  { label: 'Spot Price Label', block_type: 'bill_of_sale_spot_price_label', content_english: 'SPOT PURCHASE PRICE (CASH HANDED OVER)', content_tamil: 'உடனடி கொள்முதல் விலை (ரொக்கமாக வழங்கப்பட்டது)', display_order: 9, is_deletable: false },
  { label: 'Repurchase Title', block_type: 'bill_of_sale_repurchase_title', content_english: 'REPURCHASE OPTION (BUYBACK TERMS)', content_tamil: 'மறுகொள்முதல் விருப்பம் (திருப்பி வாங்கும் விதிமுறைகள்)', display_order: 10, is_deletable: false },
  { label: 'Repurchase Intro', block_type: 'bill_of_sale_repurchase_intro', content_english: "As part of this trading transaction, the Buyer grants the Seller an exclusive option to buy back the exact same goods within the specified period at the following fixed Strike Prices. This price includes the original purchase cost plus the Buyer's trade margin and administrative fees.", content_tamil: 'இந்த வர்த்தக பரிவர்த்தனையின் ஒரு பகுதியாக, குறிப்பிட்ட காலத்திற்குள் கீழ்க்கண்ட நிலையான ஸ்ட்ரைக் விலையில் அதே பொருட்களை திருப்பி வாங்குவதற்கான பிரத்யேக விருப்பத்தை வாங்குபவர் விற்பவருக்கு வழங்குகிறார்.', display_order: 11, is_deletable: false },
  { label: 'Expiry Note', block_type: 'bill_of_sale_expiry_note', content_english: 'Note: If the option is not exercised by {{expiry_date}}, this agreement expires. The Buyer ({{company_name}}) retains full ownership and is free to liquidate/melt/sell the asset without further notice.', content_tamil: 'குறிப்பு: {{expiry_date}} க்குள் விருப்பம் பயன்படுத்தப்படாவிட்டால், இந்த ஒப்பந்தம் காலாவதியாகும். வாங்குபவர் ({{company_name}}) முழு உரிமையைத் தக்க வைத்துக் கொள்கிறார்.', display_order: 12, is_deletable: false },
  { label: 'Declarations Title', block_type: 'bill_of_sale_declarations_title', content_english: 'DECLARATIONS & TAX COMPLIANCE', content_tamil: 'அறிவிப்புகள் & வரி இணக்கம்', display_order: 13, is_deletable: false },
  { label: 'Declaration 1: Transfer of Title', block_type: 'bill_of_sale_declaration', content_english: 'I (The Seller) declare that I am the legal owner of these goods. I have sold them to {{company_name}} voluntarily.', content_tamil: 'நான் (விற்பவர்) இந்த பொருட்களின் சட்டப்பூர்வ உரிமையாளர் என்று அறிவிக்கிறேன். நான் அவற்றை {{company_name}} க்கு தானாகவே விற்றேன்.', display_order: 14, is_deletable: true },
  { label: 'Declaration 2: No Financial Transaction', block_type: 'bill_of_sale_declaration', content_english: 'I understand this is a Buy-Sell transaction and not a financial transaction. There is no rate applicable; there is only a repurchase price difference.', content_tamil: 'இது கடன் பரிவர்த்தனை அல்ல, வாங்கல்-விற்றல் பரிவர்த்தனை என்பதை புரிந்துகொள்கிறேன். வட்டி விகிதம் இல்லை; மறுகொள்முதல் விலை வேறுபாடு மட்டுமே உள்ளது.', display_order: 15, is_deletable: true },
  { label: 'Declaration 3: GST Rule 32(5)', block_type: 'bill_of_sale_declaration', content_english: 'The Buyer ({{company_name}}) declares that this is a purchase of second-hand goods. GST will be paid on the margin earned upon resale/repurchase as per Rule 32(5) of CGST Rules, 2017.', content_tamil: 'வாங்குபவர் ({{company_name}}) இது பழைய பொருட்களின் கொள்முதல் என்று அறிவிக்கிறார். CGST விதிகள், 2017 இன் விதி 32(5) படி மறுவிற்பனை/மறுகொள்முதலில் ஈட்டிய மார்ஜினில் GST செலுத்தப்படும்.', display_order: 16, is_deletable: true },
  { label: 'Declaration 4: Custody Authorization', block_type: 'bill_of_sale_declaration', content_english: 'I authorize {{company_name}} to store these goods in their safe deposit vaults or with their financial partners/bankers for logistics and safety purposes during the option period.', content_tamil: 'விருப்ப காலத்தில் பாதுகாப்பு மற்றும் தளவாட நோக்கங்களுக்காக இந்த பொருட்களை {{company_name}} அவர்களின் பாதுகாப்பு பெட்டகங்களில் அல்லது நிதி பங்காளிகள்/வங்கிகளிடம் சேமிக்க அனுமதிக்கிறேன்.', display_order: 17, is_deletable: true },
  { label: 'Seller Signature Label', block_type: 'bill_of_sale_signature_seller', content_english: 'Signature of SELLER (Customer)', content_tamil: 'விற்பவர் கையொப்பம் (வாடிக்கையாளர்)', display_order: 18, is_deletable: false },
  { label: 'Seller Signature Note', block_type: 'bill_of_sale_signature_seller_note', content_english: '(I have received the cash and sold my gold)', content_tamil: '(நான் ரொக்கத்தைப் பெற்று என் தங்கத்தை விற்றேன்)', display_order: 19, is_deletable: false },
  { label: 'Buyer Signature Label', block_type: 'bill_of_sale_signature_buyer', content_english: 'For {{company_name}}', content_tamil: '{{company_name}} சார்பாக', display_order: 20, is_deletable: false },
  { label: 'Buyer Signature Note', block_type: 'bill_of_sale_signature_buyer_note', content_english: '(Authorized Signatory)', content_tamil: '(அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்)', display_order: 21, is_deletable: false },
  { label: 'Strike Price Table: Period Header', block_type: 'bill_of_sale_strike_period_header', content_english: 'If Exercised Between...', content_tamil: 'இடையில் பயன்படுத்தினால்...', display_order: 22, is_deletable: false },
  { label: 'Strike Price Table: Price Header', block_type: 'bill_of_sale_strike_price_header', content_english: 'You Pay (Strike Price)', content_tamil: 'நீங்கள் செலுத்த வேண்டிய தொகை (ஸ்ட்ரைக் விலை)', display_order: 23, is_deletable: false },
  { label: 'Strike Price Table: Status Header', block_type: 'bill_of_sale_strike_status_header', content_english: 'Status', content_tamil: 'நிலை', display_order: 24, is_deletable: false },
  { label: 'Strike Period 1: 0-30 Days', block_type: 'bill_of_sale_strike_period', content_english: '0-30 Days', content_tamil: '0-30 நாட்கள்', display_order: 25, is_deletable: true },
  { label: 'Strike Period 2: 31-60 Days', block_type: 'bill_of_sale_strike_period', content_english: '31-60 Days', content_tamil: '31-60 நாட்கள்', display_order: 26, is_deletable: true },
  { label: 'Strike Period 3: 61-90 Days', block_type: 'bill_of_sale_strike_period', content_english: '61-90 Days', content_tamil: '61-90 நாட்கள்', display_order: 27, is_deletable: true },
];

export function BillOfSaleSettings() {
  const { contentBlocks, isLoading, saveAllContent, isSaving } = useBillOfSaleContent();
  const [editingContent, setEditingContent] = useState<ContentItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Convert database content to ContentItem format
  const currentContent: ContentItem[] = contentBlocks.length > 0 
    ? contentBlocks.map((block, index) => ({
        id: block.id,
        label: getLabelForBlockType(block.block_type, block.display_order || index),
        block_type: block.block_type,
        content_english: block.content_english || '',
        content_tamil: block.content_tamil || '',
        display_order: block.display_order || index,
        is_deletable: block.block_type === 'bill_of_sale_declaration' || block.block_type === 'bill_of_sale_strike_period',
      }))
    : [];

  const loadDefaultContent = () => {
    setEditingContent([...DEFAULT_CONTENT]);
    setIsEditMode(true);
    toast.info('Default content loaded. Review and save to apply.');
  };

  const startEditing = () => {
    if (currentContent.length > 0) {
      setEditingContent([...currentContent]);
    } else {
      setEditingContent([...DEFAULT_CONTENT]);
    }
    setIsEditMode(true);
  };

  const updateItem = (index: number, field: 'content_english' | 'content_tamil', value: string) => {
    const updated = [...editingContent];
    updated[index] = { ...updated[index], [field]: value };
    setEditingContent(updated);
  };

  const removeItem = (index: number) => {
    if (!editingContent[index].is_deletable) {
      toast.error('This item cannot be deleted');
      return;
    }
    setEditingContent(editingContent.filter((_, i) => i !== index));
  };

  const addDeclaration = () => {
    const declarationCount = editingContent.filter(c => c.block_type === 'bill_of_sale_declaration').length;
    const maxOrder = Math.max(...editingContent.map(c => c.display_order), 0);
    
    // Find the index of the last declaration
    const lastDeclarationIndex = editingContent.reduce((lastIdx, item, idx) => 
      item.block_type === 'bill_of_sale_declaration' ? idx : lastIdx, -1);
    
    const newItem: ContentItem = {
      label: `Declaration ${declarationCount + 1}`,
      block_type: 'bill_of_sale_declaration',
      content_english: '',
      content_tamil: '',
      display_order: maxOrder + 1,
      is_deletable: true,
    };

    const updated = [...editingContent];
    updated.splice(lastDeclarationIndex + 1, 0, newItem);
    setEditingContent(updated);
  };

  const addStrikePeriod = () => {
    const periodCount = editingContent.filter(c => c.block_type === 'bill_of_sale_strike_period').length;
    const maxOrder = Math.max(...editingContent.map(c => c.display_order), 0);
    
    const newItem: ContentItem = {
      label: `Strike Period ${periodCount + 1}`,
      block_type: 'bill_of_sale_strike_period',
      content_english: '',
      content_tamil: '',
      display_order: maxOrder + 1,
      is_deletable: true,
    };

    setEditingContent([...editingContent, newItem]);
  };

  const handleSave = async () => {
    const contentToSave = editingContent.map((item, idx) => ({
      block_type: item.block_type,
      content_english: item.content_english,
      content_tamil: item.content_tamil,
      display_order: idx + 1,
    }));

    await saveAllContent(contentToSave);
    setIsEditMode(false);
    setEditingContent([]);
  };

  const cancelEditing = () => {
    setEditingContent([]);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Bill of Sale Agreement Settings
          </CardTitle>
          <CardDescription>
            Configure all editable content for Bill of Sale & Repurchase Option Agreement documents.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <Button onClick={loadDefaultContent} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Load Default Content
              </Button>
              <Button onClick={startEditing} variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
            </>
          ) : (
            <>
              <Button onClick={cancelEditing} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Content
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          <div className="space-y-4">
            {/* Placeholder Documentation */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Available Placeholders (will be replaced at print time):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-blue-800 dark:text-blue-200">
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{{company_name}}'}</code>
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{{customer_name}}'}</code>
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{{expiry_date}}'}</code>
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{{loan_date}}'}</code>
              </div>
            </div>
            
            {editingContent.map((item, index) => (
              <div key={index} className="flex gap-3 items-start border rounded-lg p-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">{item.label}</Label>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">English</Label>
                      <Textarea
                        value={item.content_english}
                        onChange={(e) => updateItem(index, 'content_english', e.target.value)}
                        placeholder="Enter English content"
                        className="min-h-[60px] font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tamil / தமிழ்</Label>
                      <Textarea
                        value={item.content_tamil}
                        onChange={(e) => updateItem(index, 'content_tamil', e.target.value)}
                        placeholder="தமிழ் உள்ளடக்கத்தை உள்ளிடவும்"
                        className="min-h-[60px] font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>
                {item.is_deletable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={addDeclaration} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add New Declaration
              </Button>
              <Button variant="outline" onClick={addStrikePeriod} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Strike Period
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentContent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No Bill of Sale content configured</p>
                <p className="text-sm mt-1">Click "Load Default Content" to start with a template, or "Edit Content" to add your own</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentContent.map((item, index) => (
                  <div key={item.id || index} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
                        <p className="text-sm">{item.content_english}</p>
                        {item.content_tamil && (
                          <p className="text-sm text-muted-foreground mt-1">{item.content_tamil}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getLabelForBlockType(blockType: string, order: number): string {
  const labelMap: Record<string, string> = {
    'bill_of_sale_title': 'Document Title',
    'bill_of_sale_legal_ref': 'Legal Reference',
    'bill_of_sale_seller_title': 'Seller Title',
    'bill_of_sale_buyer_title': 'Buyer Title',
    'bill_of_sale_goods_title': 'Goods Section Title',
    'bill_of_sale_goods_intro': 'Goods Section Intro',
    'bill_of_sale_consideration_title': 'Consideration Title',
    'bill_of_sale_consideration_intro': 'Consideration Intro',
    'bill_of_sale_spot_price_label': 'Spot Price Label',
    'bill_of_sale_repurchase_title': 'Repurchase Title',
    'bill_of_sale_repurchase_intro': 'Repurchase Intro',
    'bill_of_sale_expiry_note': 'Expiry Note',
    'bill_of_sale_declarations_title': 'Declarations Title',
    'bill_of_sale_declaration': `Declaration`,
    'bill_of_sale_signature_seller': 'Seller Signature Label',
    'bill_of_sale_signature_seller_note': 'Seller Signature Note',
    'bill_of_sale_signature_buyer': 'Buyer Signature Label',
    'bill_of_sale_signature_buyer_note': 'Buyer Signature Note',
    'bill_of_sale_strike_period_header': 'Strike Price Table: Period Header',
    'bill_of_sale_strike_price_header': 'Strike Price Table: Price Header',
    'bill_of_sale_strike_status_header': 'Strike Price Table: Status Header',
    'bill_of_sale_strike_period': `Strike Period`,
  };
  return labelMap[blockType] || blockType;
}
