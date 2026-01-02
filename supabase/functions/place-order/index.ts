import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, buyerName, buyerPhone, buyerEmail, buyerNote } = await req.json();

    console.log("Place order request:", { slug, buyerName, buyerPhone, buyerEmail });

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Storefront slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!buyerName || !buyerPhone) {
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the storefront
    const { data: storefront, error: fetchError } = await supabase
      .from("storefronts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchError || !storefront) {
      console.error("Error fetching storefront:", fetchError);
      return new Response(
        JSON.stringify({ error: "Storefront not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (storefront.status !== "sent") {
      return new Response(
        JSON.stringify({ error: "This storefront is not available for ordering" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update storefront with buyer info
    const { error: updateError } = await supabase
      .from("storefronts")
      .update({
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_email: buyerEmail?.trim() || null,
        buyer_note: buyerNote?.trim() || null,
        ordered_at: new Date().toISOString(),
      })
      .eq("id", storefront.id);

    if (updateError) {
      console.error("Error updating storefront:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to place order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity for the seller
    await supabase.from("activity_log").insert({
      user_id: storefront.user_id,
      type: "order",
      message: `New order: ${storefront.title} from ${buyerName} — $${storefront.price.toFixed(2)}`,
      related_id: storefront.id,
    });

    // Send WhatsApp notification to seller (if configured)
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    
    if (whatsappToken && whatsappPhoneId && storefront.seller_phone) {
      try {
        const sellerPhone = storefront.seller_phone.replace(/\D/g, "");
        const message = `🛒 *New Order!*\n\n*${storefront.title}*\n💰 $${storefront.price.toFixed(2)}\n\n👤 ${buyerName}\n📱 ${buyerPhone}${buyerEmail ? `\n✉️ ${buyerEmail}` : ""}${buyerNote ? `\n📝 ${buyerNote}` : ""}`;
        
        await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: sellerPhone,
            type: "text",
            text: { body: message },
          }),
        });
        console.log("WhatsApp notification sent to seller");
      } catch (waError) {
        console.error("Failed to send WhatsApp notification:", waError);
      }
    } else {
      console.log("WhatsApp notification skipped - credentials not configured or no seller phone");
    }

    // Send email notification to seller (if configured)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // Get seller email from profile
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", storefront.user_id)
      .maybeSingle();

    // Get seller's auth email
    const { data: { user: sellerUser } } = await supabase.auth.admin.getUserById(storefront.user_id);
    const sellerEmail = sellerUser?.email;

    if (resendApiKey && sellerEmail) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Orders <onboarding@resend.dev>",
            to: [sellerEmail],
            subject: `🛒 New Order: ${storefront.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">New Order Received!</h1>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">${storefront.title}</h2>
                  <p style="font-size: 24px; color: #16a34a; margin: 0;">$${storefront.price.toFixed(2)}</p>
                </div>
                <h3>Customer Details</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Name:</strong> ${buyerName}</li>
                  <li><strong>Phone:</strong> ${buyerPhone}</li>
                  ${buyerEmail ? `<li><strong>Email:</strong> ${buyerEmail}</li>` : ""}
                  ${buyerNote ? `<li><strong>Note:</strong> ${buyerNote}</li>` : ""}
                </ul>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  — ${sellerProfile?.business_name || "Your Store"}
                </p>
              </div>
            `,
          }),
        });
        
        if (emailResponse.ok) {
          console.log("Email notification sent to seller");
        } else {
          const errorData = await emailResponse.json();
          console.error("Failed to send email:", errorData);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    } else {
      console.log("Email notification skipped - RESEND_API_KEY not configured or no seller email");
    }

    // Add/update customer in CRM
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", storefront.user_id)
      .eq("phone", buyerPhone.trim())
      .maybeSingle();

    if (!existingCustomer) {
      await supabase.from("customers").insert({
        user_id: storefront.user_id,
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        email: buyerEmail?.trim() || null,
        lifecycle: "lead",
        tags: ["New", "Online Order"],
      });

      await supabase.from("activity_log").insert({
        user_id: storefront.user_id,
        type: "customer",
        message: `New customer from order: ${buyerName}`,
      });
    }

    console.log("Order placed successfully for storefront:", storefront.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order placed successfully",
        storefront: {
          id: storefront.id,
          title: storefront.title,
          price: storefront.price,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in place-order:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});