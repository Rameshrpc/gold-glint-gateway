
ALTER TABLE public.clients 
  ADD COLUMN supports_accounting boolean NOT NULL DEFAULT true,
  ADD COLUMN supports_reports boolean NOT NULL DEFAULT true,
  ADD COLUMN supports_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN supports_gold_vault boolean NOT NULL DEFAULT true,
  ADD COLUMN supports_agents boolean NOT NULL DEFAULT true,
  ADD COLUMN supports_customer_portal boolean NOT NULL DEFAULT false,
  ADD COLUMN supports_approvals boolean NOT NULL DEFAULT true;
