-- Create item_groups table
CREATE TABLE public.item_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  group_code VARCHAR(10) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, group_code)
);

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  item_group_id UUID NOT NULL REFERENCES item_groups(id) ON DELETE CASCADE,
  item_code VARCHAR(20) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  tamil_name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, item_code)
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  agent_code VARCHAR(20) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  commission_percentage NUMERIC(5,2) DEFAULT 0,
  total_commission_earned NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, agent_code)
);

-- Add agent_id to loans table
ALTER TABLE public.loans ADD COLUMN agent_id UUID REFERENCES agents(id);

-- Add item_id and item_group_id to gold_items table
ALTER TABLE public.gold_items ADD COLUMN item_id UUID REFERENCES items(id);
ALTER TABLE public.gold_items ADD COLUMN item_group_id UUID REFERENCES item_groups(id);

-- Enable RLS
ALTER TABLE public.item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_groups
CREATE POLICY "Users can view item groups in their client"
ON public.item_groups FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage item groups"
ON public.item_groups FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- RLS Policies for items
CREATE POLICY "Users can view items in their client"
ON public.items FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage items"
ON public.items FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid())) OR is_platform_admin(auth.uid()));

-- RLS Policies for agents
CREATE POLICY "Users can view agents in their client"
ON public.agents FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can manage agents"
ON public.agents FOR ALL
USING ((client_id = get_user_client_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))) OR is_platform_admin(auth.uid()))
WITH CHECK ((client_id = get_user_client_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer'))) OR is_platform_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_item_groups_updated_at
BEFORE UPDATE ON public.item_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();