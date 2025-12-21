-- Create print_templates table for reusable print configurations
CREATE TABLE public.print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Template Settings
  language VARCHAR(20) DEFAULT 'bilingual',
  paper_size VARCHAR(20) DEFAULT 'A4',
  font_family VARCHAR(50) DEFAULT 'Roboto',
  
  -- Document inclusion defaults
  include_loan_receipt BOOLEAN DEFAULT true,
  include_kyc_documents BOOLEAN DEFAULT true,
  include_jewel_image BOOLEAN DEFAULT true,
  include_gold_declaration BOOLEAN DEFAULT true,
  include_terms_conditions BOOLEAN DEFAULT true,
  
  -- Copy counts
  loan_receipt_copies INTEGER DEFAULT 2,
  kyc_documents_copies INTEGER DEFAULT 1,
  jewel_image_copies INTEGER DEFAULT 1,
  gold_declaration_copies INTEGER DEFAULT 1,
  terms_conditions_copies INTEGER DEFAULT 1,
  
  -- Header/Footer content
  logo_url TEXT,
  header_english TEXT,
  header_tamil TEXT,
  footer_english TEXT DEFAULT 'Thank you for your business',
  footer_tamil TEXT DEFAULT 'உங்கள் வணிகத்திற்கு நன்றி',
  company_slogan_english TEXT,
  company_slogan_tamil TEXT,
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, template_code)
);

-- Create branch_print_settings table for branch-specific overrides
CREATE TABLE public.branch_print_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Template assignment
  default_template_id UUID REFERENCES public.print_templates(id) ON DELETE SET NULL,
  
  -- Branch-specific overrides (nullable = use template/client defaults)
  logo_url TEXT,
  company_slogan_english TEXT,
  company_slogan_tamil TEXT,
  footer_english TEXT,
  footer_tamil TEXT,
  
  -- Override controls
  use_client_logo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_print_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for print_templates
CREATE POLICY "Users can view templates in their client"
  ON public.print_templates FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage print templates"
  ON public.print_templates FOR ALL
  USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
  WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- RLS policies for branch_print_settings
CREATE POLICY "Users can view branch print settings in their client"
  ON public.branch_print_settings FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage branch print settings"
  ON public.branch_print_settings FOR ALL
  USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
  WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_print_templates_client ON public.print_templates(client_id);
CREATE INDEX idx_branch_print_settings_branch ON public.branch_print_settings(branch_id);
CREATE INDEX idx_branch_print_settings_client ON public.branch_print_settings(client_id);