
-- Create user_permissions table for per-user module access
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_key VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  can_approve_high_value BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_key)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage permissions
CREATE POLICY "Admins can manage user permissions"
  ON public.user_permissions
  FOR ALL
  USING (
    is_any_admin(auth.uid()) OR 
    is_platform_admin(auth.uid())
  )
  WITH CHECK (
    is_any_admin(auth.uid()) OR 
    is_platform_admin(auth.uid())
  );

-- Create client_modules table for per-client module licensing
CREATE TABLE public.client_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, module_key)
);

-- Enable RLS on client_modules
ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;

-- Users can view their client's modules
CREATE POLICY "Users can view their client modules"
  ON public.client_modules
  FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

-- Only super_admin can manage client modules
CREATE POLICY "Platform admins can manage client modules"
  ON public.client_modules
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Add plan fields to clients table
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50) DEFAULT 'Growth';

-- Create trigger for updated_at on user_permissions
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on client_modules
CREATE TRIGGER update_client_modules_updated_at
  BEFORE UPDATE ON public.client_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
