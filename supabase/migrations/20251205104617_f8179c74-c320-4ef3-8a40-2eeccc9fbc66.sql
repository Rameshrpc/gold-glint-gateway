-- Create the initialize_platform function to handle atomic setup
CREATE OR REPLACE FUNCTION public.initialize_platform(
  p_user_id uuid,
  p_client_code varchar,
  p_company_name varchar,
  p_company_email varchar DEFAULT NULL,
  p_company_phone varchar DEFAULT NULL,
  p_full_name varchar DEFAULT NULL,
  p_user_email varchar DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_branch_id uuid;
BEGIN
  -- Safety check: ensure platform not already initialized
  IF EXISTS (SELECT 1 FROM user_roles WHERE role IN ('super_admin', 'moderator')) THEN
    RAISE EXCEPTION 'Platform already initialized';
  END IF;

  -- Create the first client
  INSERT INTO clients (client_code, company_name, email, phone, is_active)
  VALUES (p_client_code, p_company_name, p_company_email, p_company_phone, true)
  RETURNING id INTO v_client_id;

  -- Create profile for super admin
  INSERT INTO profiles (user_id, client_id, full_name, email, is_active)
  VALUES (p_user_id, v_client_id, p_full_name, p_user_email, true);

  -- Assign super_admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'super_admin');

  -- Create default main branch
  INSERT INTO branches (client_id, branch_code, branch_name, branch_type, is_active)
  VALUES (v_client_id, 'MAIN', 'Main Branch', 'main_branch', true)
  RETURNING id INTO v_branch_id;

  RETURN json_build_object(
    'success', true,
    'client_id', v_client_id,
    'branch_id', v_branch_id
  );
END;
$$;