import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, normalized: '', error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Extract just digits for validation
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  // Must be 10-15 digits (international format)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, normalized: '', error: 'Invalid phone number format' };
  }
  
  // Normalize: remove leading 0
  let normalized = digitsOnly;
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  return { valid: true, normalized };
}

function validateOtp(otp: string): { valid: boolean; normalized: string; error?: string } {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, normalized: '', error: 'OTP is required' };
  }
  
  // OTP must be exactly 6 digits
  const cleaned = otp.trim();
  if (!/^\d{6}$/.test(cleaned)) {
    return { valid: false, normalized: '', error: 'OTP must be 6 digits' };
  }
  
  return { valid: true, normalized: cleaned };
}

function validateClientCode(code: string): { valid: boolean; normalized: string; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, normalized: '', error: 'Client code is required' };
  }
  
  // Only allow alphanumeric characters, max 20 chars
  const cleaned = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,20}$/.test(cleaned)) {
    return { valid: false, normalized: '', error: 'Invalid client code format' };
  }
  
  return { valid: true, normalized: cleaned };
}

// Generate a secure random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, otp, clientCode } = body;

    // Validate all inputs
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      console.error('[customer-verify-otp] Phone validation failed:', phoneValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: phoneValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const otpValidation = validateOtp(otp);
    if (!otpValidation.valid) {
      console.error('[customer-verify-otp] OTP validation failed:', otpValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: otpValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientCodeValidation = validateClientCode(clientCode);
    if (!clientCodeValidation.valid) {
      console.error('[customer-verify-otp] Client code validation failed:', clientCodeValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: clientCodeValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = phoneValidation.normalized;
    const normalizedOtp = otpValidation.normalized;
    const normalizedClientCode = clientCodeValidation.normalized;
    
    console.log('[customer-verify-otp] Verifying OTP for phone ending:', normalizedPhone.slice(-4));

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the client by code
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('client_code', normalizedClientCode)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      console.error('[customer-verify-otp] Client not found:', normalizedClientCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid client code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find customer by phone - use separate queries to avoid SQL injection
    const last10Digits = normalizedPhone.slice(-10);
    
    let customer = null;
    
    // Query 1: Exact match
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();
    
    if (exactMatch) {
      customer = exactMatch;
    } else {
      // Query 2: With +91 prefix
      const { data: prefixMatch } = await supabase
        .from('customers')
        .select('id, full_name')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .eq('phone', `+91${normalizedPhone}`)
        .limit(1)
        .maybeSingle();
      
      if (prefixMatch) {
        customer = prefixMatch;
      } else {
        // Query 3: Last 10 digits match
        const { data: partialMatch } = await supabase
          .from('customers')
          .select('id, full_name')
          .eq('client_id', client.id)
          .eq('is_active', true)
          .ilike('phone', `%${last10Digits}`)
          .limit(1)
          .maybeSingle();
        
        if (partialMatch) {
          customer = partialMatch;
        }
      }
    }

    if (!customer) {
      console.error('[customer-verify-otp] Customer not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the session and verify OTP
    const { data: session, error: sessionError } = await supabase
      .from('customer_sessions')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('client_id', client.id)
      .single();

    if (sessionError || !session) {
      console.error('[customer-verify-otp] Session not found for customer:', customer.id);
      return new Response(
        JSON.stringify({ success: false, error: 'No OTP request found. Please request a new OTP.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OTP is expired
    if (new Date(session.otp_expires_at) < new Date()) {
      console.warn('[customer-verify-otp] OTP expired for customer:', customer.id);
      return new Response(
        JSON.stringify({ success: false, error: 'OTP has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP using timing-safe comparison
    const storedOtp = session.otp_code || '';
    if (storedOtp.length !== normalizedOtp.length) {
      console.warn('[customer-verify-otp] Invalid OTP length for customer:', customer.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Simple constant-time comparison
    let isValid = true;
    for (let i = 0; i < storedOtp.length; i++) {
      if (storedOtp[i] !== normalizedOtp[i]) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      console.warn('[customer-verify-otp] Invalid OTP for customer:', customer.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update session with verification
    const { error: updateError } = await supabase
      .from('customer_sessions')
      .update({
        is_verified: true,
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt,
        otp_code: null, // Clear OTP after verification
        otp_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('[customer-verify-otp] Failed to update session:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[customer-verify-otp] OTP verified successfully for customer:', customer.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP verified successfully',
        sessionToken,
        expiresAt: sessionExpiresAt,
        customer: {
          id: customer.id,
          name: customer.full_name,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[customer-verify-otp] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
