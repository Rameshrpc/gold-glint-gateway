import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_id, chat_id, client_id, phone, message_text } = await req.json();

    if (!client_id || !phone || !message_text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: client_id, phone, message_text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get WAHA config from client settings
    const { data: settings, error: settingsError } = await supabase
      .from("client_notification_settings")
      .select("waha_api_url, waha_api_key, waha_session_name")
      .eq("client_id", client_id)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (!settings?.waha_api_url) {
      return new Response(
        JSON.stringify({ error: "WAHA API URL not configured. Go to Settings → WhatsApp to set it up." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wahaUrl = settings.waha_api_url.replace(/\/+$/, "");
    const session = settings.waha_session_name || "default";

    // Normalize phone: strip non-digits, add @c.us
    const normalizedPhone = phone.replace(/\D/g, "");
    const chatId = `${normalizedPhone}@c.us`;

    // Send via WAHA API
    const wahaHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (settings.waha_api_key) {
      wahaHeaders["X-Api-Key"] = settings.waha_api_key;
    }

    const wahaResponse = await fetch(`${wahaUrl}/api/sendText`, {
      method: "POST",
      headers: wahaHeaders,
      body: JSON.stringify({
        session,
        chatId,
        text: message_text,
      }),
    });

    if (!wahaResponse.ok) {
      const errorText = await wahaResponse.text();
      console.error("WAHA API error:", wahaResponse.status, errorText);

      // Update message status to failed
      if (message_id) {
        await supabase
          .from("whatsapp_messages")
          .update({ delivery_status: "failed" })
          .eq("id", message_id);
      }

      return new Response(
        JSON.stringify({ error: `WAHA API error: ${wahaResponse.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wahaResult = await wahaResponse.json();
    const providerMessageId = wahaResult?.id || null;

    // Update the message record with provider_message_id
    if (message_id && providerMessageId) {
      await supabase
        .from("whatsapp_messages")
        .update({
          provider_message_id: providerMessageId,
          delivery_status: "sent",
        })
        .eq("id", message_id);
    }

    return new Response(
      JSON.stringify({ success: true, provider_message_id: providerMessageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("whatsapp-send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
