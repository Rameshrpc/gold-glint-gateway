-- Function to check if platform has been initialized (at least one super_admin exists)
CREATE OR REPLACE FUNCTION public.platform_initialized()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role IN ('super_admin', 'moderator')
  )
$$;

-- Allow public access to check platform initialization status
GRANT EXECUTE ON FUNCTION public.platform_initialized() TO anon;
GRANT EXECUTE ON FUNCTION public.platform_initialized() TO authenticated;

-- Add RLS policy to allow inserting first user profile during setup
CREATE POLICY "Allow first profile insert during setup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('super_admin', 'moderator'))
);

-- Add RLS policy to allow first role assignment during setup
CREATE POLICY "Allow first super_admin role assignment"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  role = 'super_admin' AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('super_admin', 'moderator'))
);