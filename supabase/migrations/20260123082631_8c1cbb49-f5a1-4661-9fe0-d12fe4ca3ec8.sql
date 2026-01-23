-- Create activity_logs table for tracking user activities
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  entity_identifier VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_client_id ON activity_logs(client_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant admins can view their client's activity logs
CREATE POLICY "Tenant admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'super_admin', 'moderator')
    )
  );

-- Policy: All authenticated users can insert activity logs
CREATE POLICY "Users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);