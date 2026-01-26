-- Add feature flags to clients table for module visibility control
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS supports_loans BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS supports_sale_agreements BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.supports_loans IS 'Feature flag: enables Loans module (Loans, Interest, Redemption, Reloan, Auction)';
COMMENT ON COLUMN public.clients.supports_sale_agreements IS 'Feature flag: enables Sale Agreements module (Agreements, Margin Renewal, Repurchase)';