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
    const rawPayload = await req.json();

    // Detect WAHA webhook format vs legacy format
    let phone: string;
    let message_text: string;
    let message_type: string;
    let client_id: string;
    let provider_message_id: string | null;

    if (rawPayload.event === "message" && rawPayload.payload) {
      // ── WAHA webhook format ──
      const payload = rawPayload.payload;
      // WAHA sends from as "11111111111@c.us" — strip @c.us
      phone = (payload.from || "").replace(/@c\.us$|@s\.whatsapp\.net$/, "");
      message_text = payload.body || "";
      message_type = payload.hasMedia ? "media" : "text";
      provider_message_id = payload.id || null;

      // client_id can be passed via WAHA session metadata or query param
      client_id = rawPayload.metadata?.client_id || 
                  new URL(req.url).searchParams.get("client_id") || "";

      // Skip messages from self (outbound echoed back)
      if (payload.fromMe) {
        return new Response(
          JSON.stringify({ success: true, skipped: "fromMe message" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // ── Legacy format (direct call) ──
      phone = rawPayload.phone;
      message_text = rawPayload.message_text;
      message_type = rawPayload.message_type || "text";
      client_id = rawPayload.client_id;
      provider_message_id = rawPayload.provider_message_id || null;
    }

    if (!phone || !message_text || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, message_text, client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Normalize phone (strip non-digits)
    const normalizedPhone = phone.replace(/\D/g, "");

    // Find or create chat
    const { data: existingChat } = await supabase
      .from("whatsapp_chats")
      .select("id")
      .eq("client_id", client_id)
      .eq("customer_phone", normalizedPhone)
      .maybeSingle();

    let chatId: string;

    if (existingChat) {
      chatId = existingChat.id;
    } else {
      // Try to find customer by phone
      const { data: customer } = await supabase
        .from("customers")
        .select("id, full_name")
        .eq("client_id", client_id)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      const { data: newChat, error: chatError } = await supabase
        .from("whatsapp_chats")
        .insert({
          client_id,
          customer_phone: normalizedPhone,
          customer_name: customer?.full_name || normalizedPhone,
          customer_id: customer?.id || null,
          status: "open",
          unread_count: 0,
        })
        .select("id")
        .single();

      if (chatError) throw chatError;
      chatId = newChat.id;
    }

    // Insert inbound message
    const { error: msgError } = await supabase.from("whatsapp_messages").insert({
      chat_id: chatId,
      client_id,
      sender_type: "customer",
      message_text,
      message_type,
      is_outbound: false,
      delivery_status: "delivered",
      provider_message_id,
    });

    if (msgError) throw msgError;

    // Update chat metadata
    await supabase
      .from("whatsapp_chats")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message_text.substring(0, 100),
      })
      .eq("id", chatId);

    // Increment unread_count
    await supabase.rpc("increment_unread_count" as any, { p_chat_id: chatId }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, chat_id: chatId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("whatsapp-inbound error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
