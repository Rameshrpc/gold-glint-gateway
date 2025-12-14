-- Create client_print_templates for custom templates
CREATE TABLE IF NOT EXISTS client_print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  template_code VARCHAR NOT NULL,
  template_name VARCHAR NOT NULL,
  receipt_type VARCHAR NOT NULL,
  language VARCHAR DEFAULT 'bilingual',
  layout_style VARCHAR DEFAULT 'classic',
  paper_size VARCHAR DEFAULT 'a4',
  font_family VARCHAR DEFAULT 'Roboto',
  font_size INTEGER DEFAULT 10,
  color_scheme JSONB DEFAULT '{"primary": "#B45309", "secondary": "#1E40AF"}',
  header_content JSONB,
  footer_content JSONB,
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, template_code)
);

-- Enhance print_templates table
ALTER TABLE print_templates 
ADD COLUMN IF NOT EXISTS font_family VARCHAR DEFAULT 'Roboto',
ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- Enhance branch_template_assignments
ALTER TABLE branch_template_assignments
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS effective_from DATE,
ADD COLUMN IF NOT EXISTS effective_to DATE;

-- Add RLS policies for client_print_templates
ALTER TABLE client_print_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client templates" ON client_print_templates
  FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage client templates" ON client_print_templates
  FOR ALL USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) 
    OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) 
    OR is_platform_admin(auth.uid())
  );