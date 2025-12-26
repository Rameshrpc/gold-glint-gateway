-- Create repledge_gold_items table for item-level repledging
CREATE TABLE public.repledge_gold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  packet_id UUID NOT NULL REFERENCES repledge_packets(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES loans(id),
  gold_item_id UUID NOT NULL REFERENCES gold_items(id),
  
  -- Item-level amounts (from gold_item)
  weight_grams NUMERIC NOT NULL,
  appraised_value NUMERIC NOT NULL,
  
  -- Proportional principal allocation
  principal_allocated NUMERIC NOT NULL DEFAULT 0,
  
  -- Status tracking
  status VARCHAR DEFAULT 'repledged',
  repledged_date DATE DEFAULT CURRENT_DATE,
  released_date DATE,
  
  -- Audit
  added_by UUID REFERENCES profiles(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure each gold item can only be in one active packet at a time
  CONSTRAINT unique_gold_item_per_active_packet UNIQUE (gold_item_id, packet_id)
);

-- Add is_repledged flag to gold_items table
ALTER TABLE gold_items ADD COLUMN IF NOT EXISTS is_repledged BOOLEAN DEFAULT false;
ALTER TABLE gold_items ADD COLUMN IF NOT EXISTS repledge_packet_id UUID REFERENCES repledge_packets(id);

-- Create index for faster lookups
CREATE INDEX idx_repledge_gold_items_packet ON repledge_gold_items(packet_id);
CREATE INDEX idx_repledge_gold_items_gold_item ON repledge_gold_items(gold_item_id);
CREATE INDEX idx_repledge_gold_items_loan ON repledge_gold_items(loan_id);
CREATE INDEX idx_repledge_gold_items_status ON repledge_gold_items(status);
CREATE INDEX idx_gold_items_repledge ON gold_items(is_repledged) WHERE is_repledged = true;

-- Enable RLS
ALTER TABLE repledge_gold_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Branch staff can manage repledge gold items"
ON repledge_gold_items
FOR ALL
USING (
  client_id = get_user_client_id(auth.uid()) AND (
    has_role(auth.uid(), 'tenant_admin') OR 
    is_platform_admin(auth.uid()) OR
    (has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))
  )
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) AND (
    has_role(auth.uid(), 'tenant_admin') OR 
    is_platform_admin(auth.uid()) OR
    (has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))
  )
);

CREATE POLICY "Users can view repledge gold items"
ON repledge_gold_items
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Function to check if any gold items from a loan are repledged
CREATE OR REPLACE FUNCTION public.check_loan_items_repledge_status(p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'has_repledged_items', EXISTS (
      SELECT 1 FROM repledge_gold_items rgi
      JOIN repledge_packets rp ON rp.id = rgi.packet_id
      WHERE rgi.loan_id = p_loan_id
        AND rgi.status = 'repledged'
        AND rp.status = 'active'
    ),
    'repledged_items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'gold_item_id', rgi.gold_item_id,
        'packet_id', rgi.packet_id,
        'packet_number', rp.packet_number,
        'weight_grams', rgi.weight_grams,
        'appraised_value', rgi.appraised_value
      ))
      FROM repledge_gold_items rgi
      JOIN repledge_packets rp ON rp.id = rgi.packet_id
      WHERE rgi.loan_id = p_loan_id
        AND rgi.status = 'repledged'
        AND rp.status = 'active'
    ), '[]'::jsonb),
    'total_items', (
      SELECT COUNT(*) FROM gold_items WHERE loan_id = p_loan_id
    ),
    'repledged_count', (
      SELECT COUNT(*) FROM repledge_gold_items rgi
      JOIN repledge_packets rp ON rp.id = rgi.packet_id
      WHERE rgi.loan_id = p_loan_id
        AND rgi.status = 'repledged'
        AND rp.status = 'active'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Migrate existing repledge_items data to new table
-- This preserves backward compatibility
INSERT INTO repledge_gold_items (client_id, packet_id, loan_id, gold_item_id, weight_grams, appraised_value, principal_allocated, status, repledged_date, released_date, created_at)
SELECT 
  ri.client_id,
  ri.packet_id,
  ri.loan_id,
  gi.id,
  gi.net_weight_grams,
  gi.appraised_value,
  CASE 
    WHEN loan_total.total_value > 0 
    THEN (gi.appraised_value / loan_total.total_value) * ri.principal_amount
    ELSE 0
  END,
  ri.status,
  ri.repledged_date,
  ri.released_date,
  ri.created_at
FROM repledge_items ri
JOIN gold_items gi ON gi.loan_id = ri.loan_id
LEFT JOIN LATERAL (
  SELECT SUM(appraised_value) as total_value FROM gold_items WHERE loan_id = ri.loan_id
) loan_total ON true
WHERE ri.packet_id IS NOT NULL;

-- Update gold_items is_repledged flag based on active packets
UPDATE gold_items gi
SET 
  is_repledged = true,
  repledge_packet_id = rgi.packet_id
FROM repledge_gold_items rgi
JOIN repledge_packets rp ON rp.id = rgi.packet_id
WHERE gi.id = rgi.gold_item_id
  AND rgi.status = 'repledged'
  AND rp.status = 'active';