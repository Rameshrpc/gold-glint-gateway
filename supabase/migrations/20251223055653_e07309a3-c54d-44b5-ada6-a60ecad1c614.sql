-- Drop the problematic policy with inline subquery that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;