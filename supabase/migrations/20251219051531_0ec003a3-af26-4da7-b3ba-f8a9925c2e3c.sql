-- Create approval_workflows configuration table
CREATE TABLE public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  workflow_type VARCHAR NOT NULL, -- 'loan', 'redemption', 'voucher', 'auction', 'commission'
  is_enabled BOOLEAN DEFAULT true,
  threshold_amount DECIMAL(15,2) DEFAULT 0, -- Approval required above this amount
  requires_dual_approval BOOLEAN DEFAULT false, -- Maker-checker
  auto_approve_roles app_role[] DEFAULT '{}', -- Roles that can bypass approval
  l1_approver_roles app_role[] DEFAULT ARRAY['branch_manager']::app_role[], -- Level 1 approvers
  l2_approver_roles app_role[] DEFAULT ARRAY['tenant_admin']::app_role[], -- Level 2 approvers (for dual approval)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, workflow_type)
);

-- Create approval_requests table
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES branches(id),
  workflow_type VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL, -- 'loan', 'redemption', 'voucher', etc.
  entity_id UUID NOT NULL,
  entity_number VARCHAR, -- Loan number, voucher number, etc.
  
  -- Request details
  requested_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  amount DECIMAL(15,2),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Approval status
  status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  
  -- Level 1 approval (checker)
  approved_by_l1 UUID REFERENCES profiles(id),
  approved_at_l1 TIMESTAMPTZ,
  comments_l1 TEXT,
  
  -- Level 2 approval (for dual approval)
  approved_by_l2 UUID REFERENCES profiles(id),
  approved_at_l2 TIMESTAMPTZ,
  comments_l2 TEXT,
  
  -- Rejection info
  rejected_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add approval_status to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'approved';

-- Add approval_status to redemptions table  
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'approved';

-- Add approval_status to vouchers table
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'approved';

-- Add approval_status to auctions table
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'approved';

-- Create indexes for fast lookups
CREATE INDEX idx_approval_requests_pending ON approval_requests(client_id, status) WHERE status = 'pending';
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_workflows_client ON approval_workflows(client_id);

-- Enable RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_workflows
CREATE POLICY "Admins can manage approval workflows"
ON approval_workflows FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view approval workflows in their client"
ON approval_workflows FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- RLS Policies for approval_requests
CREATE POLICY "Staff can create approval requests"
ON approval_requests FOR INSERT
WITH CHECK (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can view approval requests in their client"
ON approval_requests FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Approvers can update approval requests"
ON approval_requests FOR UPDATE
USING (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    is_platform_admin(auth.uid())
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) AND
  (
    has_role(auth.uid(), 'tenant_admin') OR
    has_role(auth.uid(), 'branch_manager') OR
    is_platform_admin(auth.uid())
  )
);

-- Function to initialize default workflows for a client
CREATE OR REPLACE FUNCTION public.initialize_approval_workflows(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM approval_workflows WHERE client_id = p_client_id) THEN
    RETURN;
  END IF;

  INSERT INTO approval_workflows (client_id, workflow_type, is_enabled, threshold_amount, requires_dual_approval, auto_approve_roles, l1_approver_roles, l2_approver_roles)
  VALUES
    (p_client_id, 'loan', false, 100000, false, ARRAY['tenant_admin']::app_role[], ARRAY['branch_manager']::app_role[], ARRAY['tenant_admin']::app_role[]),
    (p_client_id, 'redemption', false, 100000, false, ARRAY['tenant_admin']::app_role[], ARRAY['branch_manager']::app_role[], ARRAY['tenant_admin']::app_role[]),
    (p_client_id, 'voucher', false, 50000, false, ARRAY['tenant_admin']::app_role[], ARRAY['branch_manager']::app_role[], ARRAY['tenant_admin']::app_role[]),
    (p_client_id, 'auction', true, 0, true, ARRAY[]::app_role[], ARRAY['branch_manager']::app_role[], ARRAY['tenant_admin']::app_role[]),
    (p_client_id, 'commission', false, 10000, false, ARRAY['tenant_admin']::app_role[], ARRAY['branch_manager']::app_role[], ARRAY['tenant_admin']::app_role[]);
END;
$$;