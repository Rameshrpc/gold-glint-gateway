-- Create customer_sessions table for OTP-based customer portal authentication
CREATE TABLE public.customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  phone VARCHAR NOT NULL,
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMPTZ,
  session_token VARCHAR UNIQUE,
  session_expires_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  last_otp_request_at TIMESTAMPTZ,
  otp_request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_customer_sessions_phone ON public.customer_sessions(phone);
CREATE INDEX idx_customer_sessions_session_token ON public.customer_sessions(session_token);
CREATE INDEX idx_customer_sessions_customer_id ON public.customer_sessions(customer_id);

-- Enable RLS
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public insert for OTP requests (edge functions will handle validation)
CREATE POLICY "Allow public insert for OTP requests"
ON public.customer_sessions
FOR INSERT
WITH CHECK (true);

-- RLS Policy: Allow public update for OTP verification
CREATE POLICY "Allow public update for OTP verification"
ON public.customer_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow public select for session validation
CREATE POLICY "Allow public select for session validation"
ON public.customer_sessions
FOR SELECT
USING (true);

-- RLS Policy: Allow delete for cleanup
CREATE POLICY "Allow public delete for cleanup"
ON public.customer_sessions
FOR DELETE
USING (true);

-- Create function to get customer_id from session token
CREATE OR REPLACE FUNCTION public.get_customer_from_session(p_session_token VARCHAR)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT customer_id INTO v_customer_id
  FROM customer_sessions
  WHERE session_token = p_session_token
    AND is_verified = true
    AND session_expires_at > NOW();
  
  RETURN v_customer_id;
END;
$$;

-- Create function to validate customer session and get client_id
CREATE OR REPLACE FUNCTION public.validate_customer_session(p_session_token VARCHAR)
RETURNS TABLE(customer_id UUID, client_id UUID, is_valid BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.customer_id,
    cs.client_id,
    (cs.is_verified = true AND cs.session_expires_at > NOW()) AS is_valid
  FROM customer_sessions cs
  WHERE cs.session_token = p_session_token;
END;
$$;