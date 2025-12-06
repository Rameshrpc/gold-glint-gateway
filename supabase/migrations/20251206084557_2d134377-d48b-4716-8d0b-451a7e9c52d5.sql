-- Create a function to check if user is any admin type (bypasses RLS completely)
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'moderator', 'tenant_admin')
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$$;

-- Drop problematic policies on user_roles
DROP POLICY IF EXISTS "Tenant admins can manage roles in their client" ON public.user_roles;
DROP POLICY IF EXISTS "Platform admins can manage all roles" ON public.user_roles;

-- Drop problematic policies on branches
DROP POLICY IF EXISTS "Tenant admins can manage their branches" ON public.branches;

-- Drop problematic policies on profiles
DROP POLICY IF EXISTS "Tenant admins can manage profiles in their client" ON public.profiles;

-- Create new non-recursive policy for user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    is_any_admin(auth.uid()) OR 
    is_platform_admin(auth.uid())
  )
  WITH CHECK (
    is_any_admin(auth.uid()) OR 
    is_platform_admin(auth.uid())
  );

-- Create new non-recursive policy for branches
CREATE POLICY "Admins can manage branches"
  ON public.branches
  FOR ALL
  USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR
    is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR
    is_platform_admin(auth.uid())
  );

-- Create new non-recursive policy for profiles
CREATE POLICY "Admins can manage profiles"
  ON public.profiles
  FOR ALL
  USING (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR
    is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR
    is_platform_admin(auth.uid())
  );