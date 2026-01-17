import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  contactIds: string[];
  subject: string;
  message: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { contactIds, subject, message, senderName }: BulkEmailRequest = await req.json();

    if (!contactIds || contactIds.length === 0) {
      throw new Error("No contacts selected");
    }

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    // Fetch contacts with emails
    const { data: contacts, error: contactsError } = await supabaseClient
      .from("consultant_contacts")
      .select("id, name, email")
      .in("id", contactIds)
      .eq("user_id", user.id)
      .not("email", "is", null);

    if (contactsError) {
      throw new Error("Failed to fetch contacts");
    }

    const contactsWithEmail = contacts?.filter(c => c.email) || [];
    
    if (contactsWithEmail.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "None of the selected contacts have email addresses" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails to each contact
    for (const contact of contactsWithEmail) {
      try {
        const personalizedMessage = message
          .replace(/\{nombre\}/gi, contact.name)
          .replace(/\{name\}/gi, contact.name);

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
            <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">${personalizedMessage}</div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #888; font-size: 12px;">
              Enviado por ${senderName}
            </p>
          </div>
        `;

        await resend.emails.send({
          from: `${senderName} <onboarding@resend.dev>`,
          to: [contact.email],
          subject: subject,
          html: htmlContent,
        });

        results.sent++;

        // Update last_interaction for this contact
        await supabaseClient
          .from("consultant_contacts")
          .update({ last_interaction: new Date().toISOString() })
          .eq("id", contact.id);

      } catch (emailError: any) {
        results.failed++;
        results.errors.push(`${contact.name}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.sent,
        failed: results.failed,
        total: contactsWithEmail.length,
        errors: results.errors
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-bulk-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
