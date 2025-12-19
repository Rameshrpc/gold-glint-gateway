-- Create print_settings table for client-level print configuration
CREATE TABLE public.print_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- General settings
  language VARCHAR NOT NULL DEFAULT 'bilingual' CHECK (language IN ('bilingual', 'english', 'tamil')),
  paper_size VARCHAR NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4', 'Legal', 'Letter')),
  font_family VARCHAR NOT NULL DEFAULT 'Roboto',
  
  -- Document defaults (copies)
  loan_receipt_copies INTEGER NOT NULL DEFAULT 2,
  kyc_documents_copies INTEGER NOT NULL DEFAULT 1,
  jewel_image_copies INTEGER NOT NULL DEFAULT 1,
  gold_declaration_copies INTEGER NOT NULL DEFAULT 1,
  terms_conditions_copies INTEGER NOT NULL DEFAULT 1,
  
  -- Document defaults (include by default)
  include_loan_receipt BOOLEAN NOT NULL DEFAULT true,
  include_kyc_documents BOOLEAN NOT NULL DEFAULT true,
  include_jewel_image BOOLEAN NOT NULL DEFAULT true,
  include_gold_declaration BOOLEAN NOT NULL DEFAULT true,
  include_terms_conditions BOOLEAN NOT NULL DEFAULT true,
  
  -- Editable header/footer (bilingual)
  header_english TEXT DEFAULT NULL,
  header_tamil TEXT DEFAULT NULL,
  footer_english TEXT DEFAULT 'Thank you for your business',
  footer_tamil TEXT DEFAULT 'உங்கள் வணிகத்திற்கு நன்றி',
  company_slogan_english TEXT DEFAULT NULL,
  company_slogan_tamil TEXT DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(client_id)
);

-- Create print_content_blocks table for editable secondary content
CREATE TABLE public.print_content_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  block_type VARCHAR NOT NULL CHECK (block_type IN ('gold_declaration', 'terms_header', 'acknowledgment', 'warning', 'signature_labels')),
  content_english TEXT NOT NULL,
  content_tamil TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_print_settings_client ON public.print_settings(client_id);
CREATE INDEX idx_print_content_blocks_client ON public.print_content_blocks(client_id, block_type);
CREATE INDEX idx_print_content_blocks_active ON public.print_content_blocks(client_id, is_active);

-- Enable RLS
ALTER TABLE public.print_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_content_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for print_settings
CREATE POLICY "Admins can manage print settings" 
ON public.print_settings 
FOR ALL 
USING (
  ((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) 
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  ((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) 
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view print settings" 
ON public.print_settings 
FOR SELECT 
USING (client_id = get_user_client_id(auth.uid()));

-- RLS Policies for print_content_blocks
CREATE POLICY "Admins can manage print content blocks" 
ON public.print_content_blocks 
FOR ALL 
USING (
  ((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) 
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  ((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) 
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view print content blocks" 
ON public.print_content_blocks 
FOR SELECT 
USING (client_id = get_user_client_id(auth.uid()));

-- Function to initialize default print settings for a client
CREATE OR REPLACE FUNCTION public.initialize_print_settings(p_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM print_settings WHERE client_id = p_client_id) THEN
    RETURN;
  END IF;

  -- Insert default print settings
  INSERT INTO print_settings (client_id) VALUES (p_client_id);

  -- Insert default gold declaration statements
  INSERT INTO print_content_blocks (client_id, block_type, content_english, content_tamil, display_order)
  VALUES
    (p_client_id, 'gold_declaration', 'The gold ornaments pledged are my personal property and I am the sole owner.', 'அடமானம் வைக்கப்பட்ட தங்க நகைகள் எனது சொந்த சொத்து மற்றும் நான் ஒரே உரிமையாளர்.', 1),
    (p_client_id, 'gold_declaration', 'The ornaments are not stolen, illegally acquired, or encumbered.', 'இந்த நகைகள் திருடப்படவில்லை, சட்டவிரோதமாக பெறப்படவில்லை அல்லது சுமையாக இல்லை.', 2),
    (p_client_id, 'gold_declaration', 'The gold is not subject to any other pledge, loan, or legal proceedings.', 'இந்த தங்கம் வேறு எந்த அடமானம், கடன் அல்லது சட்ட நடவடிக்கைகளுக்கும் உட்பட்டதல்ல.', 3),
    (p_client_id, 'gold_declaration', 'I am authorized to pledge these ornaments and the weight/purity declared is accurate.', 'இந்த நகைகளை அடமானம் வைக்க நான் அதிகாரம் பெற்றுள்ளேன், மேலும் அறிவிக்கப்பட்ட எடை/தூய்மை துல்லியமானது.', 4),
    (p_client_id, 'warning', 'Warning: Any false declaration may result in legal action and forfeiture of pledged items.', 'எச்சரிக்கை: தவறான அறிவிப்பு சட்ட நடவடிக்கை மற்றும் அடமான பொருட்களை இழக்க நேரிடும்.', 1),
    (p_client_id, 'acknowledgment', 'I have read and understood all terms and conditions mentioned above.', 'மேலே குறிப்பிடப்பட்ட அனைத்து விதிமுறைகளையும் நான் படித்து புரிந்துகொண்டேன்.', 1),
    (p_client_id, 'signature_labels', 'Customer Signature', 'வாடிக்கையாளர் கையொப்பம்', 1),
    (p_client_id, 'signature_labels', 'Redemption Signature', 'மீட்பு கையொப்பம்', 2),
    (p_client_id, 'signature_labels', 'Authorized Signature', 'அங்கீகரிக்கப்பட்ட கையொப்பம்', 3);

  -- Seed default terms if not already present
  IF NOT EXISTS (SELECT 1 FROM client_terms_conditions WHERE client_id = p_client_id) THEN
    INSERT INTO client_terms_conditions (client_id, term_type, language, terms_text, display_order)
    VALUES
      (p_client_id, 'loan', 'bilingual', 'The pledged gold ornaments will be kept safely in the custody of the company until the loan is fully repaid. / அடமானம் வைக்கப்பட்ட தங்க நகைகள் கடன் முழுவதும் திருப்பி செலுத்தப்படும் வரை நிறுவனத்தின் பாதுகாப்பில் பத்திரமாக வைக்கப்படும்.', 1),
      (p_client_id, 'loan', 'bilingual', 'Interest shall be calculated on a monthly basis and is payable every 30 days. / வட்டி மாதாந்திர அடிப்படையில் கணக்கிடப்படும் மற்றும் ஒவ்வொரு 30 நாட்களுக்கும் செலுத்த வேண்டும்.', 2),
      (p_client_id, 'loan', 'bilingual', 'Failure to pay interest for 90 days may result in penalty charges. / 90 நாட்கள் வட்டி செலுத்தத் தவறினால் அபராத கட்டணங்கள் விதிக்கப்படலாம்.', 3),
      (p_client_id, 'loan', 'bilingual', 'The loan must be repaid within the tenure period, failing which the pledged gold may be auctioned. / கடன் காலத்திற்குள் திருப்பி செலுத்தப்பட வேண்டும், இல்லையெனில் அடமான தங்கம் ஏலம் விடப்படலாம்.', 4),
      (p_client_id, 'loan', 'bilingual', 'The borrower must produce valid identity proof at the time of redemption. / மீட்பு நேரத்தில் கடன் வாங்குபவர் சரியான அடையாள ஆதாரத்தை சமர்ப்பிக்க வேண்டும்.', 5);
  END IF;
END;
$$;