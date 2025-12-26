import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { phone, otp, clientCode } = await req.json();

    if (!phone || !otp || !clientCode) {
      console.error('[customer-verify-otp] Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Phone, OTP, and client code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '');
    console.log('[customer-verify-otp] Verifying OTP for phone:', normalizedPhone);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the client by code
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('client_code', clientCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      console.error('[customer-verify-otp] Client not found:', clientCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid client code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find customer by phone
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .or(`phone.eq.${normalizedPhone},phone.eq.+91${normalizedPhone},phone.ilike.%${normalizedPhone.slice(-10)}`)
      .limit(1)
      .single();

    if (customerError || !customer) {
      console.error('[customer-verify-otp] Customer not found:', normalizedPhone);
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

    // Verify OTP
    if (session.otp_code !== otp) {
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
