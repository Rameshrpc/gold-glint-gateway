-- Fix RLS policies for authentication flow

-- Drop existing problematic policies for profiles
DROP POLICY IF EXISTS "Allow first profile insert during setup" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create proper policy: Users can insert their own profile with their user_id
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Drop existing problematic policies for user_roles
DROP POLICY IF EXISTS "Allow first super_admin role assignment" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- Create proper policy: Users can insert their own role during signup (only loan_officer by default)
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'loan_officer'::app_role
);

-- Ensure admins can still manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'moderator', 'tenant_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'moderator', 'tenant_admin')
  )
);