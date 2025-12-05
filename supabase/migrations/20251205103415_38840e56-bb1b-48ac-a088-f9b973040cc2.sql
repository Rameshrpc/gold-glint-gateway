-- Add a permissive policy to allow public client code validation during signup/login
CREATE POLICY "Public client code validation"
ON public.clients
FOR SELECT
TO public
USING (is_active = true);