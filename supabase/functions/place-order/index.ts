import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getClientIp, isRateLimited } from "../_shared/rate-limit.ts";
import { trackUsage } from "../_shared/track.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
};

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeInput = (input: string, maxLength: number): string =>
  input.trim().slice(0, maxLength);

function generateOrderKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 6; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = getClientIp(req);
    const { slug, buyerName, buyerPhone, buyerEmail, buyerNote } = await req.json();

    if (typeof slug === "string") {
      if (isRateLimited(`place-order:${ip}:${slug}`, 5, 5 * 60_000)) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Place order request received for slug:", slug);

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

    const sanitizedName = sanitizeInput(buyerName, 100);
    const sanitizedPhone = sanitizeInput(buyerPhone, 20);
    const sanitizedEmail = buyerEmail ? sanitizeInput(buyerEmail, 255) : null;
    const sanitizedNote = buyerNote ? sanitizeInput(buyerNote, 500) : null;

    if (sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: "Name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validatePhone(sanitizedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 1. Fetch storefront ──────────────────────────────────────────
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

    // ── 2. CRM: upsert into crm_contacts ─────────────────────────────
    let contactId: string | null = null;

    const { data: existingContact } = await supabase
      .from("crm_contacts")
      .select("id, lifetime_value")
      .eq("user_id", storefront.user_id)
      .eq("phone", sanitizedPhone)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
      // Update name/email if provided, bump lifetime value
      await supabase
        .from("crm_contacts")
        .update({
          name: sanitizedName,
          email: sanitizedEmail || existingContact.email || null,
          last_interaction_at: new Date().toISOString(),
          lifetime_value: (existingContact.lifetime_value || 0) + storefront.price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    } else {
      const { data: newContact } = await supabase
        .from("crm_contacts")
        .insert({
          user_id: storefront.user_id,
          name: sanitizedName,
          phone: sanitizedPhone,
          email: sanitizedEmail,
          source_channel: "storefront",
          tags: ["Online Order"],
          lead_score: "HOT",
          status: "active",
          lifetime_value: storefront.price,
          last_interaction_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      contactId = newContact?.id || null;

      await supabase.from("activity_log").insert({
        user_id: storefront.user_id,
        type: "customer",
        message: `New customer from storefront: ${sanitizedName}`,
      });
    }

    // ── 3. Create order in orders table ──────────────────────────────
    const orderKey = generateOrderKey();

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: storefront.user_id,
        contact_id: contactId,
        subtotal: storefront.price,
        total: storefront.price,
        cost: 0,
        payment_status: "PENDING",
        fulfillment_status: "PENDING",
        channel: "storefront",
        notes: sanitizedNote,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Create order_items ────────────────────────────────────────
    if (storefront.is_bundle) {
      const { data: bundleItems } = await supabase
        .from("storefront_items")
        .select("*")
        .eq("storefront_id", storefront.id)
        .order("sort_order", { ascending: true });

      if (bundleItems && bundleItems.length > 0) {
        const orderItems = bundleItems.map((item: any) => ({
          order_id: newOrder.id,
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          quantity: item.quantity,
          unit_price: item.price,
          unit_cost: 0,
        }));

        await supabase.from("order_items").insert(orderItems);
      }
    } else {
      // Single product → single order item
      await supabase.from("order_items").insert({
        order_id: newOrder.id,
        title: storefront.title,
        description: storefront.description,
        image_url: storefront.image_url,
        quantity: storefront.quantity || 1,
        unit_price: storefront.price / (storefront.quantity || 1),
        unit_cost: 0,
      });
    }

    // ── 5. Update storefront with buyer info + order_key ─────────────
    const { error: updateError } = await supabase
      .from("storefronts")
      .update({
        buyer_name: sanitizedName,
        buyer_phone: sanitizedPhone,
        buyer_email: sanitizedEmail,
        buyer_note: sanitizedNote,
        ordered_at: new Date().toISOString(),
        order_key: orderKey,
      })
      .eq("id", storefront.id);

    if (updateError) {
      console.error("Error updating storefront:", updateError);
    }

    // ── 6. Contact timeline entry ────────────────────────────────────
    if (contactId) {
      await supabase.from("contact_timeline").insert({
        user_id: storefront.user_id,
        contact_id: contactId,
        event_type: "order",
        content: `Placed order: ${storefront.title} — $${storefront.price.toFixed(2)}`,
        metadata: {
          order_id: newOrder.id,
          storefront_id: storefront.id,
          order_key: orderKey,
        },
      });
    }

    // ── 7. Activity log ──────────────────────────────────────────────
    await supabase.from("activity_log").insert({
      user_id: storefront.user_id,
      type: "order",
      message: `New order: ${storefront.title} — $${storefront.price.toFixed(2)}`,
      related_id: newOrder.id,
    });

    // ── 8. Create auto follow-ups ───────────────────────────────────
    if (contactId) {
      // Trigger 1: Instant — "Order received" (for seller to contact buyer)
      await supabase.from("follow_ups").insert({
        user_id: storefront.user_id,
        contact_id: contactId,
        order_id: newOrder.id,
        reason: `New order #${orderKey} from ${sanitizedName} — confirm receipt`,
        due_at: new Date().toISOString(),
        status: "pending",
        channel: "whatsapp",
      });

      // Trigger 2: Payment pending reminder (24h)
      const paymentReminder = new Date();
      paymentReminder.setHours(paymentReminder.getHours() + 24);
      await supabase.from("follow_ups").insert({
        user_id: storefront.user_id,
        contact_id: contactId,
        order_id: newOrder.id,
        reason: `Payment pending for order #${orderKey} — send reminder`,
        due_at: paymentReminder.toISOString(),
        status: "pending",
        channel: "whatsapp",
      });
    }

    // ── 9. Notifications (WhatsApp + Email) ──────────────────────────
    // WhatsApp
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (whatsappToken && whatsappPhoneId && storefront.seller_phone) {
      try {
        const sellerPhone = storefront.seller_phone.replace(/\D/g, "");
        const message = `🛒 *New Order #${orderKey}!*\n\n*${storefront.title}*\n💰 $${storefront.price.toFixed(2)}\n\n👤 ${sanitizedName}\n📱 ${sanitizedPhone}${sanitizedEmail ? `\n✉️ ${sanitizedEmail}` : ""}${sanitizedNote ? `\n📝 ${sanitizedNote}` : ""}`;

        await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: sellerPhone,
            type: "text",
            text: { body: message },
          }),
        });
        console.log("WhatsApp notification sent");
      } catch (waError) {
        console.error("WhatsApp notification failed:", waError);
      }
    }

    // Email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", storefront.user_id)
      .maybeSingle();

    const { data: { user: sellerUser } } = await supabase.auth.admin.getUserById(storefront.user_id);
    const sellerEmail = sellerUser?.email;

    if (resendApiKey && sellerEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Orders <onboarding@resend.dev>",
            to: [sellerEmail],
            subject: `🛒 New Order #${orderKey}: ${storefront.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">New Order #${orderKey}</h1>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">${storefront.title}</h2>
                  <p style="font-size: 24px; color: #16a34a; margin: 0;">$${storefront.price.toFixed(2)}</p>
                </div>
                <h3>Customer Details</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Name:</strong> ${sanitizedName}</li>
                  <li><strong>Phone:</strong> ${sanitizedPhone}</li>
                  ${sanitizedEmail ? `<li><strong>Email:</strong> ${sanitizedEmail}</li>` : ""}
                  ${sanitizedNote ? `<li><strong>Note:</strong> ${sanitizedNote}</li>` : ""}
                </ul>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  — ${sellerProfile?.business_name || "Your Store"}
                </p>
              </div>
            `,
          }),
        });
        console.log("Email notification sent");
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    // ── 10. Also update legacy customers table ──────────────────────
    const { data: existingLegacy } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", storefront.user_id)
      .eq("phone", sanitizedPhone)
      .maybeSingle();

    if (!existingLegacy) {
      await supabase.from("customers").insert({
        user_id: storefront.user_id,
        name: sanitizedName,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        lifecycle: "lead",
        tags: ["New", "Online Order"],
      });
    }

    // ── 11. Track usage ─────────────────────────────────────────────
    console.log("Order placed successfully:", newOrder.id, "key:", orderKey);

    trackUsage(supabase, storefront.user_id, "order", "place_order", {
      storefront_id: storefront.id,
      order_id: newOrder.id,
      price: storefront.price,
    }, "orders_created");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order placed successfully",
        order: {
          id: newOrder.id,
          order_key: orderKey,
        },
        storefront: {
          id: storefront.id,
          title: storefront.title,
          price: storefront.price,
        },
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
