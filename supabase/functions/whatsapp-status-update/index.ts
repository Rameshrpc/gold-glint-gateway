import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map WAHA ack values to our delivery_status
function mapAckToStatus(ack: number): string | null {
  switch (ack) {
    case -1: return "failed";
    case 0: return "pending";
    case 1: return "sent";
    case 2: return "delivered";
    case 3: return "read";
    case 4: return "read"; // played = read for our purposes
    default: return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPayload = await req.json();

    let delivery_status: string;
    let provider_message_id: string | null = null;
    let message_id: string | null = null;

    if (rawPayload.event === "message.ack" && rawPayload.payload) {
      // ── WAHA webhook format ──
      const payload = rawPayload.payload;
      provider_message_id = payload.id || null;
      const ack = typeof payload.ack === "number" ? payload.ack : null;
      
      if (ack === null || !provider_message_id) {
        return new Response(
          JSON.stringify({ error: "Missing ack or message id in WAHA payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mapped = mapAckToStatus(ack);
      if (!mapped) {
        return new Response(
          JSON.stringify({ error: `Unknown ack value: ${ack}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      delivery_status = mapped;
    } else {
      // ── Legacy format ──
      delivery_status = rawPayload.delivery_status;
      provider_message_id = rawPayload.provider_message_id || null;
      message_id = rawPayload.message_id || null;

      if (!delivery_status || (!provider_message_id && !message_id)) {
        return new Response(
          JSON.stringify({ error: "Missing provider_message_id/message_id and delivery_status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const validStatuses = ["sent", "delivered", "read", "failed"];
      if (!validStatuses.includes(delivery_status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("whatsapp_messages")
      .update({ delivery_status });

    if (message_id) {
      query = query.eq("id", message_id);
    } else if (provider_message_id) {
      query = query.eq("provider_message_id", provider_message_id);
    }

    const { error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, updated: count }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("whatsapp-status-update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
