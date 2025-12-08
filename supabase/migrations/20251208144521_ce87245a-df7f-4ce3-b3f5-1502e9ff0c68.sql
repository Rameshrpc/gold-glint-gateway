-- Create client_terms_conditions table for editable T&C
CREATE TABLE public.client_terms_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  term_type VARCHAR NOT NULL DEFAULT 'loan',
  language VARCHAR NOT NULL DEFAULT 'bilingual',
  terms_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, term_type, language, display_order)
);

-- Enable RLS
ALTER TABLE public.client_terms_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their client terms"
ON public.client_terms_conditions
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage client terms"
ON public.client_terms_conditions
FOR ALL
USING (((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
WITH CHECK (((client_id = get_user_client_id(auth.uid())) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- Insert the two new templates
INSERT INTO public.print_templates (template_code, template_name, receipt_type, language, paper_size, layout_style, is_active)
VALUES 
  ('LOAN_TN_PAWNBROKER_A4', 'Tamil Nadu Pawnbroker (A4 6-Page)', 'loan', 'bilingual', 'a4', 'formal', true),
  ('LOAN_TN_PAWNBROKER_THERMAL', 'Tamil Nadu Pawnbroker (Thermal)', 'loan', 'bilingual', '80mm', 'formal', true);