-- Add Bill of Sale specific columns to print_settings
ALTER TABLE public.print_settings
ADD COLUMN IF NOT EXISTS bill_of_sale_place varchar DEFAULT 'Coimbatore',
ADD COLUMN IF NOT EXISTS bill_of_sale_ref_prefix varchar DEFAULT 'ZG';

-- Add Bill of Sale specific columns to print_templates  
ALTER TABLE public.print_templates
ADD COLUMN IF NOT EXISTS bill_of_sale_place varchar DEFAULT 'Coimbatore',
ADD COLUMN IF NOT EXISTS bill_of_sale_ref_prefix varchar DEFAULT 'ZG';

-- Add new Bill of Sale block types to print_content_blocks
-- We'll insert default content blocks via the initialize function update

-- Create function to initialize Bill of Sale content blocks
CREATE OR REPLACE FUNCTION public.initialize_bill_of_sale_content(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if already initialized for this client
  IF EXISTS (SELECT 1 FROM print_content_blocks WHERE client_id = p_client_id AND block_type LIKE 'bill_of_sale_%') THEN
    RETURN;
  END IF;

  -- Insert Bill of Sale content blocks
  INSERT INTO print_content_blocks (client_id, block_type, content_english, content_tamil, display_order) VALUES
    -- Document Title
    (p_client_id, 'bill_of_sale_title', 'BILL OF SALE & REPURCHASE OPTION AGREEMENT', 'விற்பனை மற்றும் மறுகொள்முதல் விருப்ப ஒப்பந்தம்', 1),
    
    -- Legal Reference
    (p_client_id, 'bill_of_sale_legal_ref', '(Under Sale of Goods Act, 1930 & Contract Act, 1872)', '(விற்பனை பொருட்கள் சட்டம், 1930 & ஒப்பந்த சட்டம், 1872 கீழ்)', 1),
    
    -- Section Titles
    (p_client_id, 'bill_of_sale_seller_title', 'THE SELLER (Customer)', 'விற்பவர் (வாடிக்கையாளர்)', 1),
    (p_client_id, 'bill_of_sale_buyer_title', 'THE BUYER (Trading Entity)', 'வாங்குபவர் (வர்த்தக நிறுவனம்)', 1),
    (p_client_id, 'bill_of_sale_goods_title', 'DESCRIPTION OF GOODS SOLD', 'விற்கப்பட்ட பொருட்களின் விவரம்', 1),
    (p_client_id, 'bill_of_sale_consideration_title', 'CONSIDERATION (PAYMENT DETAILS)', 'பரிசீலனை (கட்டண விவரங்கள்)', 1),
    (p_client_id, 'bill_of_sale_repurchase_title', 'REPURCHASE OPTION (BUYBACK TERMS)', 'மறுகொள்முதல் விருப்பம் (திருப்பி வாங்கும் விதிமுறைகள்)', 1),
    (p_client_id, 'bill_of_sale_declarations_title', 'DECLARATIONS & TAX COMPLIANCE', 'அறிவிப்புகள் & வரி இணக்கம்', 1),
    
    -- Section Intros
    (p_client_id, 'bill_of_sale_goods_intro', 'The Seller hereby sells and transfers absolute title and ownership of the following pre-owned jewellery to the Buyer:', 'விற்பவர் பின்வரும் பழைய நகைகளின் முழு உரிமையையும் உடைமையையும் வாங்குபவருக்கு விற்பனை செய்து மாற்றுகிறார்:', 1),
    (p_client_id, 'bill_of_sale_consideration_intro', 'The Buyer has paid the following amount to the Seller as full and final consideration for the purchase of the above goods:', 'மேற்கண்ட பொருட்களை வாங்குவதற்கான முழு மற்றும் இறுதித் தொகையாக வாங்குபவர் விற்பவருக்கு பின்வரும் தொகையை செலுத்தியுள்ளார்:', 1),
    (p_client_id, 'bill_of_sale_spot_price_label', 'SPOT PURCHASE PRICE (CASH HANDED OVER)', 'உடனடி கொள்முதல் விலை (ரொக்கமாக வழங்கப்பட்டது)', 1),
    (p_client_id, 'bill_of_sale_repurchase_intro', 'As part of this trading transaction, the Buyer grants the Seller an exclusive option to buy back the exact same goods within the specified period at the following fixed Strike Prices. This price includes the original purchase cost plus the Buyer''s trade margin and administrative fees.', 'இந்த வர்த்தக பரிவர்த்தனையின் ஒரு பகுதியாக, குறிப்பிட்ட காலத்திற்குள் கீழ்க்கண்ட நிலையான ஸ்ட்ரைக் விலையில் அதே பொருட்களை திருப்பி வாங்குவதற்கான பிரத்யேக விருப்பத்தை வாங்குபவர் விற்பவருக்கு வழங்குகிறார்.', 1),
    (p_client_id, 'bill_of_sale_expiry_note', 'Note: If the option is not exercised by {{expiry_date}}, this agreement expires. The Buyer ({{company_name}}) retains full ownership and is free to liquidate/melt/sell the asset without further notice.', 'குறிப்பு: {{expiry_date}} க்குள் விருப்பம் பயன்படுத்தப்படாவிட்டால், இந்த ஒப்பந்தம் காலாவதியாகும். வாங்குபவர் ({{company_name}}) முழு உரிமையைத் தக்க வைத்துக் கொள்கிறார்.', 1),
    
    -- Declarations
    (p_client_id, 'bill_of_sale_declaration', 'Transfer of Title|I (The Seller) declare that I am the legal owner of these goods. I have sold them to {{company_name}} voluntarily.|நான் (விற்பவர்) இந்த பொருட்களின் சட்டப்பூர்வ உரிமையாளர் என்று அறிவிக்கிறேன். நான் அவற்றை {{company_name}} க்கு தானாகவே விற்றேன்.', 1),
    (p_client_id, 'bill_of_sale_declaration', 'No Financial Transaction|I understand this is a Buy-Sell transaction and not a financial transaction. There is no rate applicable; there is only a repurchase price difference.|இது கடன் பரிவர்த்தனை அல்ல, வாங்கல்-விற்றல் பரிவர்த்தனை என்பதை புரிந்துகொள்கிறேன். வட்டி விகிதம் இல்லை; மறுகொள்முதல் விலை வேறுபாடு மட்டுமே உள்ளது.', 2),
    (p_client_id, 'bill_of_sale_declaration', 'GST Rule 32(5)|The Buyer ({{company_name}}) declares that this is a purchase of second-hand goods. GST will be paid on the margin earned upon resale/repurchase as per Rule 32(5) of CGST Rules, 2017.|வாங்குபவர் ({{company_name}}) இது பழைய பொருட்களின் கொள்முதல் என்று அறிவிக்கிறார். CGST விதிகள், 2017 இன் விதி 32(5) படி மறுவிற்பனை/மறுகொள்முதலில் ஈட்டிய மார்ஜினில் GST செலுத்தப்படும்.', 3),
    (p_client_id, 'bill_of_sale_declaration', 'Custody Authorization|I authorize {{company_name}} to store these goods in their safe deposit vaults or with their financial partners/bankers for logistics and safety purposes during the option period.|விருப்ப காலத்தில் பாதுகாப்பு மற்றும் தளவாட நோக்கங்களுக்காக இந்த பொருட்களை {{company_name}} அவர்களின் பாதுகாப்பு பெட்டகங்களில் அல்லது நிதி பங்காளிகள்/வங்கிகளிடம் சேமிக்க அனுமதிக்கிறேன்.', 4),
    
    -- Signature Labels
    (p_client_id, 'bill_of_sale_signature_seller', 'Signature of SELLER (Customer)', 'விற்பவர் கையொப்பம் (வாடிக்கையாளர்)', 1),
    (p_client_id, 'bill_of_sale_signature_seller_note', '(I have received the cash and sold my gold)', '(நான் ரொக்கத்தைப் பெற்று என் தங்கத்தை விற்றேன்)', 1),
    (p_client_id, 'bill_of_sale_signature_buyer', 'For {{company_name}}', '{{company_name}} சார்பாக', 1),
    (p_client_id, 'bill_of_sale_signature_buyer_note', '(Authorized Signatory)', '(அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்)', 1),
    
    -- Strike Price Table Headers
    (p_client_id, 'bill_of_sale_strike_period_header', 'If Exercised Between...', 'இடையில் பயன்படுத்தினால்...', 1),
    (p_client_id, 'bill_of_sale_strike_price_header', 'You Pay (Strike Price)', 'நீங்கள் செலுத்த வேண்டிய தொகை (ஸ்ட்ரைக் விலை)', 1),
    (p_client_id, 'bill_of_sale_strike_status_header', 'Status', 'நிலை', 1),
    
    -- Strike Price Period Labels (default 3 periods)
    (p_client_id, 'bill_of_sale_strike_period', '0-30 Days|0-30 நாட்கள்|30', 1),
    (p_client_id, 'bill_of_sale_strike_period', '31-60 Days|31-60 நாட்கள்|60', 2),
    (p_client_id, 'bill_of_sale_strike_period', '61-90 Days|61-90 நாட்கள்|90', 3);
END;
$function$;