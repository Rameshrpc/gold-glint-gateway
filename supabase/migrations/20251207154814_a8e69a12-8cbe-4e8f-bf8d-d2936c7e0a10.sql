-- Create loan_disbursements table for multiple payment entries
CREATE TABLE public.loan_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_mode VARCHAR(20) NOT NULL,
  amount NUMERIC NOT NULL,
  reference_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view disbursements for loans in their client"
ON public.loan_disbursements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_disbursements.loan_id
    AND l.client_id = get_user_client_id(auth.uid())
  )
);

CREATE POLICY "Branch staff can manage disbursements"
ON public.loan_disbursements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_disbursements.loan_id
    AND l.client_id = get_user_client_id(auth.uid())
    AND (
      has_role(auth.uid(), 'tenant_admin') OR
      has_role(auth.uid(), 'branch_manager') OR
      has_role(auth.uid(), 'loan_officer')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_disbursements.loan_id
    AND l.client_id = get_user_client_id(auth.uid())
    AND (
      has_role(auth.uid(), 'tenant_admin') OR
      has_role(auth.uid(), 'branch_manager') OR
      has_role(auth.uid(), 'loan_officer')
    )
  )
);

CREATE POLICY "Platform admins can manage all disbursements"
ON public.loan_disbursements
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));