
-- Create print_templates table for predefined templates
CREATE TABLE public.print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR NOT NULL UNIQUE,
  template_name VARCHAR NOT NULL,
  receipt_type VARCHAR NOT NULL,
  language VARCHAR DEFAULT 'english',
  paper_size VARCHAR DEFAULT 'a4',
  layout_style VARCHAR DEFAULT 'classic',
  color_scheme JSONB DEFAULT '{"primary": "#B45309", "secondary": "#1E40AF"}',
  is_active BOOLEAN DEFAULT true,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create client_print_settings table
CREATE TABLE public.client_print_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  receipt_type VARCHAR NOT NULL,
  template_id UUID REFERENCES print_templates(id),
  logo_url TEXT,
  watermark_type VARCHAR DEFAULT 'none',
  watermark_text VARCHAR,
  watermark_image_url TEXT,
  watermark_opacity INTEGER DEFAULT 10,
  header_text TEXT,
  footer_text TEXT,
  show_logo BOOLEAN DEFAULT true,
  show_declaration BOOLEAN DEFAULT true,
  show_signature_section BOOLEAN DEFAULT true,
  show_terms BOOLEAN DEFAULT false,
  custom_terms TEXT,
  margins JSONB DEFAULT '{"top": 30, "bottom": 30, "left": 30, "right": 30}',
  font_size INTEGER DEFAULT 10,
  copies INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, receipt_type)
);

-- Create branch_template_assignments table
CREATE TABLE public.branch_template_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  receipt_type VARCHAR NOT NULL,
  template_id UUID NOT NULL REFERENCES print_templates(id),
  is_locked BOOLEAN DEFAULT true,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id, receipt_type)
);

-- Enable RLS
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_print_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_template_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for print_templates (viewable by all authenticated)
CREATE POLICY "Anyone can view active templates"
  ON public.print_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform admins can manage templates"
  ON public.print_templates FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- RLS Policies for client_print_settings
CREATE POLICY "Users can view their client print settings"
  ON public.client_print_settings FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage client print settings"
  ON public.client_print_settings FOR ALL
  USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
    OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
    OR is_platform_admin(auth.uid())
  );

-- RLS Policies for branch_template_assignments
CREATE POLICY "Users can view their client branch assignments"
  ON public.branch_template_assignments FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage branch template assignments"
  ON public.branch_template_assignments FOR ALL
  USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
    OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
    OR is_platform_admin(auth.uid())
  );

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding-assets
CREATE POLICY "Branding assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding-assets');

CREATE POLICY "Admins can upload branding assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'branding-assets' AND is_any_admin(auth.uid()));

CREATE POLICY "Admins can update branding assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'branding-assets' AND is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete branding assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'branding-assets' AND is_any_admin(auth.uid()));

-- Insert predefined templates
-- Loan Disbursement Templates
INSERT INTO public.print_templates (template_code, template_name, receipt_type, language, paper_size, layout_style) VALUES
  ('LOAN_CLASSIC_EN', 'Classic English', 'loan', 'english', 'a4', 'classic'),
  ('LOAN_MODERN_EN', 'Modern English', 'loan', 'english', 'a4', 'modern'),
  ('LOAN_BILINGUAL_FORMAL', 'Bilingual Formal', 'loan', 'bilingual', 'a4', 'formal'),
  ('LOAN_BILINGUAL_COMPACT', 'Bilingual Compact', 'loan', 'bilingual', 'a5', 'compact'),
  ('LOAN_THERMAL_EN', 'Thermal Receipt', 'loan', 'english', 'thermal_80', 'minimal');

-- Interest Receipt Templates
INSERT INTO public.print_templates (template_code, template_name, receipt_type, language, paper_size, layout_style) VALUES
  ('INT_CLASSIC_EN', 'Classic English', 'interest', 'english', 'a5', 'classic'),
  ('INT_MODERN_EN', 'Modern English', 'interest', 'english', 'a5', 'modern'),
  ('INT_BILINGUAL_STD', 'Bilingual Standard', 'interest', 'bilingual', 'a5', 'standard'),
  ('INT_BILINGUAL_COMPACT', 'Bilingual Compact', 'interest', 'bilingual', 'a5', 'compact'),
  ('INT_THERMAL_EN', 'Thermal Receipt', 'interest', 'english', 'thermal_80', 'minimal');

-- Auction Notice Templates
INSERT INTO public.print_templates (template_code, template_name, receipt_type, language, paper_size, layout_style) VALUES
  ('AUC_FORMAL_EN', 'Formal English', 'auction', 'english', 'a4', 'formal'),
  ('AUC_MODERN_EN', 'Modern English', 'auction', 'english', 'a4', 'modern'),
  ('AUC_BILINGUAL_LEGAL', 'Bilingual Legal', 'auction', 'bilingual', 'a4', 'legal'),
  ('AUC_BILINGUAL_NOTICE', 'Bilingual Notice', 'auction', 'bilingual', 'a4', 'notice'),
  ('AUC_SETTLEMENT_EN', 'Settlement Receipt', 'auction', 'english', 'a4', 'settlement');

-- Redemption Receipt Templates
INSERT INTO public.print_templates (template_code, template_name, receipt_type, language, paper_size, layout_style) VALUES
  ('RED_CLASSIC_EN', 'Classic English', 'redemption', 'english', 'a4', 'classic'),
  ('RED_MODERN_EN', 'Modern English', 'redemption', 'english', 'a4', 'modern'),
  ('RED_BILINGUAL_FORMAL', 'Bilingual Formal', 'redemption', 'bilingual', 'a4', 'formal'),
  ('RED_BILINGUAL_COMPACT', 'Bilingual Compact', 'redemption', 'bilingual', 'a5', 'compact'),
  ('RED_THERMAL_EN', 'Thermal Receipt', 'redemption', 'english', 'thermal_80', 'minimal');
