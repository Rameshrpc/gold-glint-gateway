-- Create helper function to get user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop existing RLS policies for customers
DROP POLICY IF EXISTS "Branch staff can manage customers in their branch" ON public.customers;

-- Create new branch-level RLS policy for customers
-- tenant_admin can access all customers in their client
-- branch staff can only access customers in their assigned branch
CREATE POLICY "Branch staff can manage customers in their branch" ON public.customers
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    -- Tenant admins can access all branches
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    -- Platform admins can access all
    is_platform_admin(auth.uid()) OR
    -- Branch staff can only access their branch
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR 
       has_role(auth.uid(), 'loan_officer'::app_role) OR 
       has_role(auth.uid(), 'appraiser'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR 
       has_role(auth.uid(), 'loan_officer'::app_role) OR 
       has_role(auth.uid(), 'appraiser'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Drop existing RLS policies for loans
DROP POLICY IF EXISTS "Branch staff can manage loans" ON public.loans;
DROP POLICY IF EXISTS "Platform admins can manage all loans" ON public.loans;
DROP POLICY IF EXISTS "Users can view loans in their client" ON public.loans;

-- Create new branch-level RLS policies for loans
CREATE POLICY "Users can view loans in their client" ON public.loans
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Platform admins can manage all loans" ON public.loans
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Branch staff can manage loans" ON public.loans
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR 
       has_role(auth.uid(), 'loan_officer'::app_role) OR 
       has_role(auth.uid(), 'appraiser'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR 
       has_role(auth.uid(), 'loan_officer'::app_role) OR 
       has_role(auth.uid(), 'appraiser'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update redemptions RLS
DROP POLICY IF EXISTS "Branch staff can manage redemptions" ON public.redemptions;

CREATE POLICY "Branch staff can manage redemptions" ON public.redemptions
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update interest_payments RLS
DROP POLICY IF EXISTS "Branch staff can manage interest payments" ON public.interest_payments;

CREATE POLICY "Branch staff can manage interest payments" ON public.interest_payments
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update vouchers RLS
DROP POLICY IF EXISTS "Branch staff can manage vouchers" ON public.vouchers;

CREATE POLICY "Branch staff can manage vouchers" ON public.vouchers
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update agent_commissions RLS
DROP POLICY IF EXISTS "Branch staff can manage agent commissions" ON public.agent_commissions;

CREATE POLICY "Branch staff can manage agent commissions" ON public.agent_commissions
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update repledge_packets RLS
DROP POLICY IF EXISTS "Branch staff can manage repledge packets" ON public.repledge_packets;

CREATE POLICY "Branch staff can manage repledge packets" ON public.repledge_packets
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Update repledge_redemptions RLS
DROP POLICY IF EXISTS "Branch staff can manage repledge redemptions" ON public.repledge_redemptions;

CREATE POLICY "Branch staff can manage repledge redemptions" ON public.repledge_redemptions
FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) AND (
    has_role(auth.uid(), 'tenant_admin'::app_role) OR
    is_platform_admin(auth.uid()) OR
    (
      (has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'loan_officer'::app_role))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);