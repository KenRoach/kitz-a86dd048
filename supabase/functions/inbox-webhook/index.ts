import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Support multiple formats:
    // 1. Direct JSON: { user_id, from_name, from_email, subject, body }
    // 2. Zapier/Make webhook: similar structure
    const userId = body.user_id;
    const fromName = body.from_name || body.sender_name || body.from || null;
    const fromEmail = body.from_email || body.sender_email || body.email || null;
    const subject = body.subject || null;
    const messageBody = body.body || body.text || body.content || body.message || "";

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!messageBody) {
      return new Response(
        JSON.stringify({ error: "Message body is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitize = (s: string | null, max: number) => s ? s.trim().slice(0, max) : null;

    // Try to match to existing CRM contact by email
    let contactId: string | null = null;
    if (fromEmail) {
      const { data: contact } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("user_id", userId)
        .eq("email", fromEmail)
        .maybeSingle();
      contactId = contact?.id || null;
    }

    // Store the message
    const { data: msg, error } = await supabase
      .from("inbox_messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        channel: "email",
        direction: "inbound",
        sender_name: sanitize(fromName, 100),
        sender_email: sanitize(fromEmail, 255),
        subject: sanitize(subject, 255),
        body: messageBody.trim().slice(0, 10000),
        is_read: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error storing message:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "inbox",
      title: `📧 ${fromName || fromEmail || "New email"}`,
      message: subject || messageBody.slice(0, 100),
    });

    console.log("Inbox message stored:", msg.id);

    return new Response(
      JSON.stringify({ success: true, id: msg.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in inbox-webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
