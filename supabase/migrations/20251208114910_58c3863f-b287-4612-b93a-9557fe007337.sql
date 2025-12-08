-- Create gold_market_rates table for daily market rate management
CREATE TABLE public.gold_market_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rate_24kt NUMERIC NOT NULL,
  rate_22kt NUMERIC NOT NULL,
  rate_18kt NUMERIC NOT NULL,
  rate_source VARCHAR DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, rate_date)
);

-- Add market value columns to gold_items
ALTER TABLE public.gold_items 
ADD COLUMN IF NOT EXISTS market_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS market_rate_date DATE;

-- Enable RLS
ALTER TABLE public.gold_market_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gold_market_rates
CREATE POLICY "Users can view market rates in their client"
  ON public.gold_market_rates FOR SELECT 
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage market rates"
  ON public.gold_market_rates FOR ALL
  USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
  WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_gold_market_rates_updated_at
BEFORE UPDATE ON public.gold_market_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();