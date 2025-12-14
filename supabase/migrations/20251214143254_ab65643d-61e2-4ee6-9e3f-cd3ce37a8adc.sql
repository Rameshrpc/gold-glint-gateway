-- Create print_profiles table for combining multiple documents into one print action
CREATE TABLE print_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  profile_name VARCHAR NOT NULL,
  profile_type VARCHAR NOT NULL, -- 'loan', 'interest', 'redemption', 'auction', 'reloan'
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, profile_name)
);

-- Create print_profile_documents table for documents within a profile
CREATE TABLE print_profile_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES print_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR NOT NULL, -- 'loan_receipt', 'kyc', 'gold_declaration', 'summary', 'declaration'
  template_id UUID REFERENCES print_templates(id),
  print_order INTEGER NOT NULL DEFAULT 1,
  copies INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE print_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_profile_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for print_profiles
CREATE POLICY "Users can view their client print profiles" ON print_profiles
  FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage print profiles" ON print_profiles
  FOR ALL USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) 
    OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) 
    OR is_platform_admin(auth.uid())
  );

-- RLS policies for print_profile_documents
CREATE POLICY "Users can view profile documents" ON print_profile_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM print_profiles pp 
      WHERE pp.id = print_profile_documents.profile_id 
      AND pp.client_id = get_user_client_id(auth.uid())
    )
  );

CREATE POLICY "Admins can manage profile documents" ON print_profile_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM print_profiles pp 
      WHERE pp.id = print_profile_documents.profile_id 
      AND pp.client_id = get_user_client_id(auth.uid())
      AND is_any_admin(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM print_profiles pp 
      WHERE pp.id = print_profile_documents.profile_id 
      AND pp.client_id = get_user_client_id(auth.uid())
      AND is_any_admin(auth.uid())
    )
  );