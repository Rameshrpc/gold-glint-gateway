-- Fix: Remove public access to clients table and create secure validation function

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public client code validation" ON public.clients;

-- Create a secure function for client code validation that only returns minimal info
-- This function is SECURITY DEFINER so it can access the clients table without RLS
CREATE OR REPLACE FUNCTION public.validate_client_code(p_client_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Only return whether the client exists and is active, plus the client_id
  -- Do NOT expose sensitive information like company_name, email, phone, address
  SELECT json_build_object(
    'valid', true,
    'client_id', c.id
  )
  INTO v_result
  FROM clients c
  WHERE c.client_code = UPPER(p_client_code)
    AND c.is_active = true;
  
  IF v_result IS NULL THEN
    RETURN json_build_object('valid', false, 'client_id', null);
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.validate_client_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_client_code(text) TO authenticated;