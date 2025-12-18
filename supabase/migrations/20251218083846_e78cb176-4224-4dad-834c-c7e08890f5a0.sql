-- =====================================================
-- PHASE 1: AUDIT TRAIL, NOTIFICATIONS, DASHBOARD TABLES
-- =====================================================

-- 1. AUDIT LOGS TABLE - Comprehensive activity tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  branch_id UUID REFERENCES public.branches(id),
  user_id UUID NOT NULL,
  user_name VARCHAR,
  action VARCHAR NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', 'approve', 'reject'
  entity_type VARCHAR NOT NULL, -- 'loan', 'customer', 'interest_payment', 'redemption', 'user', etc.
  entity_id UUID,
  entity_identifier VARCHAR, -- loan_number, customer_code, etc. for easy reference
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[], -- list of fields that were changed
  ip_address VARCHAR,
  user_agent TEXT,
  session_id VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast querying
CREATE INDEX idx_audit_logs_client_id ON public.audit_logs(client_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

-- Anyone can insert audit logs (for logging their own actions)
CREATE POLICY "Users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- 2. NOTIFICATION TEMPLATES TABLE
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  template_code VARCHAR NOT NULL, -- 'DUE_REMINDER_7D', 'DUE_REMINDER_3D', 'DUE_REMINDER_1D', 'OVERDUE', 'LOAN_CREATED', etc.
  template_name VARCHAR NOT NULL,
  channel VARCHAR NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp', 'email'
  template_content TEXT NOT NULL, -- SMS content with placeholders like {{customer_name}}, {{loan_number}}, {{amount_due}}
  msg91_template_id VARCHAR, -- MSG91 DLT registered template ID
  variables TEXT[], -- List of available variables
  is_active BOOLEAN DEFAULT true,
  is_regulatory BOOLEAN DEFAULT false, -- For mandatory notices like auction
  send_time VARCHAR, -- Preferred send time e.g. '09:00'
  days_before_due INTEGER, -- For due reminders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, template_code)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view notification templates"
ON public.notification_templates FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- 3. NOTIFICATION LOGS TABLE - Track all sent notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  branch_id UUID REFERENCES public.branches(id),
  template_id UUID REFERENCES public.notification_templates(id),
  channel VARCHAR NOT NULL, -- 'sms', 'whatsapp', 'email'
  recipient_type VARCHAR NOT NULL, -- 'customer', 'agent', 'user'
  recipient_id UUID,
  recipient_name VARCHAR,
  recipient_phone VARCHAR,
  recipient_email VARCHAR,
  entity_type VARCHAR, -- 'loan', 'interest_payment', 'redemption'
  entity_id UUID,
  message_content TEXT NOT NULL,
  provider VARCHAR DEFAULT 'msg91', -- 'msg91', 'twilio'
  provider_message_id VARCHAR, -- External message ID from provider
  provider_response JSONB, -- Full response from provider
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'rejected'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cost_credits DECIMAL(10,4), -- Cost in credits/units
  retry_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_logs_client ON public.notification_logs(client_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_entity ON public.notification_logs(entity_type, entity_id);
CREATE INDEX idx_notification_logs_recipient ON public.notification_logs(recipient_phone);
CREATE INDEX idx_notification_logs_created ON public.notification_logs(created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch staff can view notification logs"
ON public.notification_logs FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Branch staff can create notification logs"
ON public.notification_logs FOR INSERT
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND 
   (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'branch_manager') OR has_role(auth.uid(), 'loan_officer')))
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "System can update notification logs"
ON public.notification_logs FOR UPDATE
USING (client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- 4. CLIENT NOTIFICATION SETTINGS
CREATE TABLE public.client_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) UNIQUE,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,
  msg91_auth_key VARCHAR, -- Encrypted MSG91 auth key
  msg91_sender_id VARCHAR(6), -- 6-char sender ID
  msg91_dlt_entity_id VARCHAR, -- DLT Entity ID for India
  whatsapp_template_namespace VARCHAR,
  default_send_time VARCHAR DEFAULT '09:00',
  daily_sms_limit INTEGER DEFAULT 1000,
  monthly_sms_limit INTEGER DEFAULT 30000,
  sms_sent_today INTEGER DEFAULT 0,
  sms_sent_this_month INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.client_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification settings"
ON public.client_notification_settings FOR ALL
USING (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (client_id = get_user_client_id(auth.uid()) AND is_any_admin(auth.uid()))
  OR is_platform_admin(auth.uid())
);

CREATE POLICY "Users can view notification settings"
ON public.client_notification_settings FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- 5. DASHBOARD KPI CACHE TABLE (for performance)
CREATE TABLE public.dashboard_kpi_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  branch_id UUID REFERENCES public.branches(id),
  kpi_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_customers INTEGER DEFAULT 0,
  active_loans INTEGER DEFAULT 0,
  total_aum DECIMAL(15,2) DEFAULT 0, -- Assets Under Management
  gold_weight_grams DECIMAL(12,3) DEFAULT 0,
  today_disbursements DECIMAL(15,2) DEFAULT 0,
  today_collections DECIMAL(15,2) DEFAULT 0,
  today_redemptions DECIMAL(15,2) DEFAULT 0,
  overdue_30_days INTEGER DEFAULT 0,
  overdue_60_days INTEGER DEFAULT 0,
  overdue_90_days INTEGER DEFAULT 0,
  overdue_180_days INTEGER DEFAULT 0,
  npa_count INTEGER DEFAULT 0,
  npa_amount DECIMAL(15,2) DEFAULT 0,
  interest_accrued DECIMAL(15,2) DEFAULT 0,
  interest_collected_mtd DECIMAL(15,2) DEFAULT 0,
  loans_created_today INTEGER DEFAULT 0,
  redemptions_today INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, branch_id, kpi_date)
);

CREATE INDEX idx_dashboard_kpi_client_date ON public.dashboard_kpi_cache(client_id, kpi_date DESC);

ALTER TABLE public.dashboard_kpi_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client KPIs"
ON public.dashboard_kpi_cache FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can manage KPIs"
ON public.dashboard_kpi_cache FOR ALL
USING (client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- 6. FUNCTION TO CALCULATE DASHBOARD KPIs
CREATE OR REPLACE FUNCTION public.calculate_dashboard_kpis(p_client_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT jsonb_build_object(
    'total_customers', (
      SELECT COUNT(*) FROM customers 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND is_active = true
    ),
    'active_loans', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
    ),
    'total_aum', (
      SELECT COALESCE(SUM(principal_amount), 0) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
    ),
    'gold_weight_grams', (
      SELECT COALESCE(SUM(gi.net_weight_grams), 0) 
      FROM gold_items gi
      JOIN loans l ON gi.loan_id = l.id
      WHERE l.client_id = p_client_id 
      AND (p_branch_id IS NULL OR l.branch_id = p_branch_id)
      AND l.status = 'active'
    ),
    'today_disbursements', (
      SELECT COALESCE(SUM(principal_amount), 0) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND loan_date = v_today
    ),
    'today_collections', (
      SELECT COALESCE(SUM(amount_paid), 0) FROM interest_payments 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND payment_date = v_today
    ),
    'today_redemptions', (
      SELECT COALESCE(SUM(amount_received), 0) FROM redemptions 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND redemption_date = v_today
    ),
    'overdue_30_days', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') < v_today - INTERVAL '30 days'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') >= v_today - INTERVAL '60 days'
    ),
    'overdue_60_days', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') < v_today - INTERVAL '60 days'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') >= v_today - INTERVAL '90 days'
    ),
    'overdue_90_days', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') < v_today - INTERVAL '90 days'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') >= v_today - INTERVAL '180 days'
    ),
    'overdue_180_days', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active'
      AND COALESCE(next_interest_due_date, loan_date + INTERVAL '30 days') < v_today - INTERVAL '180 days'
    ),
    'loans_created_today', (
      SELECT COUNT(*) FROM loans 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND loan_date = v_today
    ),
    'redemptions_today', (
      SELECT COUNT(*) FROM redemptions 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND redemption_date = v_today
    ),
    'interest_collected_mtd', (
      SELECT COALESCE(SUM(amount_paid), 0) FROM interest_payments 
      WHERE client_id = p_client_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', v_today)
    ),
    'calculated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 7. INSERT DEFAULT NOTIFICATION TEMPLATES FUNCTION
CREATE OR REPLACE FUNCTION public.initialize_notification_templates(p_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM notification_templates WHERE client_id = p_client_id) THEN
    RETURN;
  END IF;

  INSERT INTO notification_templates (client_id, template_code, template_name, channel, template_content, variables, days_before_due, is_active)
  VALUES
    (p_client_id, 'DUE_REMINDER_7D', '7-Day Due Reminder', 'sms', 
     'Dear {{customer_name}}, your gold loan {{loan_number}} interest of Rs.{{amount_due}} is due on {{due_date}}. Please pay to avoid penalty. - {{company_name}}',
     ARRAY['customer_name', 'loan_number', 'amount_due', 'due_date', 'company_name'], 7, true),
    
    (p_client_id, 'DUE_REMINDER_3D', '3-Day Due Reminder', 'sms',
     'Reminder: Gold loan {{loan_number}} interest Rs.{{amount_due}} due in 3 days ({{due_date}}). Pay now to avoid penalty. - {{company_name}}',
     ARRAY['customer_name', 'loan_number', 'amount_due', 'due_date', 'company_name'], 3, true),
    
    (p_client_id, 'DUE_REMINDER_1D', '1-Day Due Reminder', 'sms',
     'URGENT: Gold loan {{loan_number}} interest Rs.{{amount_due}} due tomorrow ({{due_date}}). Pay today to avoid penalty. - {{company_name}}',
     ARRAY['customer_name', 'loan_number', 'amount_due', 'due_date', 'company_name'], 1, true),
    
    (p_client_id, 'OVERDUE_NOTICE', 'Overdue Notice', 'sms',
     'Dear {{customer_name}}, your gold loan {{loan_number}} is overdue by {{overdue_days}} days. Outstanding: Rs.{{total_due}}. Contact us immediately. - {{company_name}}',
     ARRAY['customer_name', 'loan_number', 'overdue_days', 'total_due', 'company_name'], NULL, true);
END;
$$;