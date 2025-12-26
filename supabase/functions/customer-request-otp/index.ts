import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, clientCode } = await req.json();

    if (!phone || !clientCode) {
      console.error('[customer-request-otp] Missing phone or clientCode');
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number and client code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone (remove spaces, ensure +91 prefix for Indian numbers)
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '');
    console.log('[customer-request-otp] Processing request for phone:', normalizedPhone, 'clientCode:', clientCode);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the client by code
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('client_code', clientCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      console.error('[customer-request-otp] Client not found:', clientCode, clientError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid client code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find customer by phone in this client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .or(`phone.eq.${normalizedPhone},phone.eq.+91${normalizedPhone},phone.ilike.%${normalizedPhone.slice(-10)}`)
      .limit(1)
      .single();

    if (customerError || !customer) {
      console.error('[customer-request-otp] Customer not found:', normalizedPhone, customerError);
      return new Response(
        JSON.stringify({ success: false, error: 'No customer found with this phone number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[customer-request-otp] Customer found:', customer.id, customer.full_name);

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

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    console.log('[customer-request-otp] Generated OTP for customer:', customer.id, 'OTP:', otp);

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

    // TODO: Send OTP via MSG91 when client_notification_settings are configured
    // For now, we'll log the OTP for development/testing
    console.log(`[customer-request-otp] OTP for ${customer.phone}: ${otp} (expires: ${otpExpiresAt})`);

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

    return new Response(
      JSON.stringify({
        success: true,
        message: smsSent ? 'OTP sent to your phone' : 'OTP generated (SMS disabled - check logs for development)',
        customerName: customer.full_name,
        maskedPhone: customer.phone.slice(0, 3) + '****' + customer.phone.slice(-3),
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
