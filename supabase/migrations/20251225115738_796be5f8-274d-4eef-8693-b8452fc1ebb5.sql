-- Drop overly permissive SELECT policies that bypass branch filtering
DROP POLICY IF EXISTS "Users can view customers in their client" ON customers;
DROP POLICY IF EXISTS "Users can view loans in their client" ON loans;
DROP POLICY IF EXISTS "Users can view redemptions in their client" ON redemptions;
DROP POLICY IF EXISTS "Users can view interest payments in their client" ON interest_payments;
DROP POLICY IF EXISTS "Users can view vouchers in their client" ON vouchers;
DROP POLICY IF EXISTS "Users can view agent commissions in their client" ON agent_commissions;
DROP POLICY IF EXISTS "Users can view repledge packets in their client" ON repledge_packets;
DROP POLICY IF EXISTS "Users can view repledge redemptions in their client" ON repledge_redemptions;

-- Create new SELECT policies with branch-level filtering for customers
CREATE POLICY "Users can view customers with branch filter" ON customers
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer') 
       OR has_role(auth.uid(), 'appraiser'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for loans
CREATE POLICY "Users can view loans with branch filter" ON loans
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer') 
       OR has_role(auth.uid(), 'appraiser'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for redemptions
CREATE POLICY "Users can view redemptions with branch filter" ON redemptions
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for interest_payments
CREATE POLICY "Users can view interest payments with branch filter" ON interest_payments
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for vouchers
CREATE POLICY "Users can view vouchers with branch filter" ON vouchers
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for agent_commissions
CREATE POLICY "Users can view agent commissions with branch filter" ON agent_commissions
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for repledge_packets
CREATE POLICY "Users can view repledge packets with branch filter" ON repledge_packets
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);

-- Create new SELECT policies with branch-level filtering for repledge_redemptions
CREATE POLICY "Users can view repledge redemptions with branch filter" ON repledge_redemptions
FOR SELECT USING (
  (client_id = get_user_client_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'tenant_admin') 
    OR is_platform_admin(auth.uid())
    OR (
      (has_role(auth.uid(), 'branch_manager') 
       OR has_role(auth.uid(), 'loan_officer'))
      AND branch_id = get_user_branch_id(auth.uid())
    )
  )
);