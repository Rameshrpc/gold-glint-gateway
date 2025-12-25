-- 1. Insert missing super_admin role for Ramesh (rk1@zc.in)
-- First get the user_id from profiles by email
INSERT INTO user_roles (user_id, role)
SELECT p.user_id, 'super_admin'::app_role
FROM profiles p
WHERE p.email = 'rk1@zc.in'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id 
    AND ur.role = 'super_admin'
  );

-- 2. Also ensure kam1@zc.com has super_admin (another super admin)
INSERT INTO user_roles (user_id, role)
SELECT p.user_id, 'super_admin'::app_role
FROM profiles p
WHERE p.email = 'kam1@zc.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id 
    AND ur.role = 'super_admin'
  );

-- 3. Create validation function for role-branch requirements
CREATE OR REPLACE FUNCTION public.validate_user_role_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid;
BEGIN
  -- Get user's branch_id from profile
  SELECT branch_id INTO v_branch_id 
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- Branch staff roles require branch_id
  IF NEW.role IN ('branch_manager', 'loan_officer', 'appraiser', 'collection_agent') THEN
    IF v_branch_id IS NULL THEN
      RAISE EXCEPTION 'Branch staff roles (%, loan_officer, appraiser, collection_agent) require a branch assignment. Please assign a branch to the user first.', NEW.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger to enforce the validation (drop if exists first)
DROP TRIGGER IF EXISTS check_role_branch_requirement ON user_roles;

CREATE TRIGGER check_role_branch_requirement
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION validate_user_role_branch();