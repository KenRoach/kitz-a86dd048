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
        // Don't fail the order if WhatsApp fails
      }
    } else {
      console.log("WhatsApp notification skipped - credentials not configured or no seller phone");
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