-- Create enum for user roles (8 roles as per spec)
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'moderator', 
  'tenant_admin',
  'branch_manager',
  'loan_officer',
  'appraiser',
  'collection_agent',
  'auditor'
);

-- Create enum for branch types (4-tier hierarchy)
CREATE TYPE public.branch_type AS ENUM (
  'main_branch',
  'company_owned',
  'franchise',
  'tenant'
);

-- Clients/Tenants table (multi-tenant support)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Branches table (linked to clients)
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  parent_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  branch_code VARCHAR(20) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  branch_type public.branch_type NOT NULL DEFAULT 'main_branch',
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, branch_code)
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user is super_admin or moderator
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'moderator')
  )
$$;

-- RLS Policies for clients table
CREATE POLICY "Platform admins can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Users can view their own client"
ON public.clients FOR SELECT
TO authenticated
USING (id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Platform admins can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- RLS Policies for branches table
CREATE POLICY "Users can view branches in their client"
ON public.branches FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage their branches"
ON public.branches FOR ALL
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'tenant_admin') OR public.is_platform_admin(auth.uid()))
)
WITH CHECK (
  client_id = public.get_user_client_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'tenant_admin') OR public.is_platform_admin(auth.uid()))
);

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in same client"
ON public.profiles FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage profiles in their client"
ON public.profiles FOR ALL
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'tenant_admin') OR public.is_platform_admin(auth.uid()))
)
WITH CHECK (
  client_id = public.get_user_client_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'tenant_admin') OR public.is_platform_admin(auth.uid()))
);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage roles in their client"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = public.user_roles.user_id
    AND p.client_id = public.get_user_client_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'tenant_admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = public.user_roles.user_id
    AND p.client_id = public.get_user_client_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'tenant_admin')
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();