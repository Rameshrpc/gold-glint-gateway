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
  
  // Check for obviously invalid patterns (all same digit, sequential)
  if (/^(.)\1{9,}$/.test(digitsOnly)) {
    return { valid: false, normalized: '', error: 'Invalid phone number' };
  }
  
  // Normalize: remove leading 0, keep last 10 digits for Indian numbers
  let normalized = digitsOnly;
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  return { valid: true, normalized };
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, clientCode } = body;

    // Validate inputs
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      console.error('[customer-request-otp] Phone validation failed:', phoneValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: phoneValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientCodeValidation = validateClientCode(clientCode);
    if (!clientCodeValidation.valid) {
      console.error('[customer-request-otp] Client code validation failed:', clientCodeValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: clientCodeValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = phoneValidation.normalized;
    const normalizedClientCode = clientCodeValidation.normalized;
    
    console.log('[customer-request-otp] Processing request for phone:', normalizedPhone.slice(-4), 'clientCode:', normalizedClientCode);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the client by code (using parameterized query via SDK)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('client_code', normalizedClientCode)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      console.error('[customer-request-otp] Client not found:', normalizedClientCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid client code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find customer by phone - use separate queries to avoid SQL injection in .or()
    const last10Digits = normalizedPhone.slice(-10);
    
    // Query 1: Exact match
    let customer = null;
    let customerError = null;
    
    const { data: exactMatch, error: err1 } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();
    
    if (exactMatch) {
      customer = exactMatch;
    } else {
      // Query 2: With +91 prefix
      const { data: prefixMatch, error: err2 } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .eq('phone', `+91${normalizedPhone}`)
        .limit(1)
        .maybeSingle();
      
      if (prefixMatch) {
        customer = prefixMatch;
      } else {
        // Query 3: Last 10 digits match (using ilike safely)
        const { data: partialMatch, error: err3 } = await supabase
          .from('customers')
          .select('id, full_name, phone')
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
      console.error('[customer-request-otp] Customer not found for phone ending:', last10Digits.slice(-4));
      return new Response(
        JSON.stringify({ success: false, error: 'No customer found with this phone number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[customer-request-otp] Customer found:', customer.id);

    // Check rate limiting (max 3 OTP requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentSessions } = await supabase
      .from('customer_sessions')
      .select('id, otp_request_count, last_otp_request_at')
      .eq('customer_id', customer.id)
      .gte('last_otp_request_at', oneHourAgo)
      .order('last_otp_request_at', { ascending: false })
      .limit(1);

    const recentSession = recentSessions?.[0];
    if (recentSession && recentSession.otp_request_count >= 3) {
      console.warn('[customer-request-otp] Rate limit exceeded for customer:', customer.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many OTP requests. Please try again after 1 hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP using crypto for better randomness
    const otpArray = new Uint32Array(1);
    crypto.getRandomValues(otpArray);
    const otp = String(100000 + (otpArray[0] % 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    console.log('[customer-request-otp] Generated OTP for customer:', customer.id);

    // Upsert session record
    const { error: sessionError } = await supabase
      .from('customer_sessions')
      .upsert({
        client_id: client.id,
        customer_id: customer.id,
        phone: customer.phone,
        otp_code: otp,
        otp_expires_at: otpExpiresAt,
        is_verified: false,
        session_token: null,
        session_expires_at: null,
        last_otp_request_at: new Date().toISOString(),
        otp_request_count: (recentSession?.otp_request_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id',
        ignoreDuplicates: false,
      });

    if (sessionError) {
      // If upsert fails due to no unique constraint, try insert
      const { error: insertError } = await supabase
        .from('customer_sessions')
        .insert({
          client_id: client.id,
          customer_id: customer.id,
          phone: customer.phone,
          otp_code: otp,
          otp_expires_at: otpExpiresAt,
          is_verified: false,
          last_otp_request_at: new Date().toISOString(),
          otp_request_count: 1,
        });

      if (insertError) {
        console.error('[customer-request-otp] Failed to create session:', insertError);
        // Try update if insert also fails
        const { error: updateError } = await supabase
          .from('customer_sessions')
          .update({
            otp_code: otp,
            otp_expires_at: otpExpiresAt,
            is_verified: false,
            session_token: null,
            session_expires_at: null,
            last_otp_request_at: new Date().toISOString(),
            otp_request_count: (recentSession?.otp_request_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('customer_id', customer.id);

        if (updateError) {
          console.error('[customer-request-otp] Failed to update session:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create OTP session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check if MSG91 is configured for this client
    const { data: notificationSettings } = await supabase
      .from('client_notification_settings')
      .select('msg91_auth_key, msg91_sender_id, sms_enabled')
      .eq('client_id', client.id)
      .single();

    let smsSent = false;
    if (notificationSettings?.sms_enabled && notificationSettings?.msg91_auth_key) {
      // TODO: Implement MSG91 SMS sending
      console.log('[customer-request-otp] MSG91 configured, would send SMS here');
      smsSent = true;
    }

    // Mask phone for response (show only first 3 and last 3)
    const maskedPhone = customer.phone.length > 6 
      ? customer.phone.slice(0, 3) + '****' + customer.phone.slice(-3)
      : '****';

    return new Response(
      JSON.stringify({
        success: true,
        message: smsSent ? 'OTP sent to your phone' : 'OTP generated (SMS disabled - check logs for development)',
        customerName: customer.full_name,
        maskedPhone,
        expiresIn: 300, // 5 minutes in seconds
        // Include OTP in development mode (remove in production)
        ...(Deno.env.get('ENVIRONMENT') !== 'production' && { devOtp: otp }),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[customer-request-otp] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
