import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || !apiKey.startsWith("kitz_")) {
      return new Response(JSON.stringify({ error: "Missing or invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the provided key
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Look up the key using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, is_active")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (keyError || !keyRecord) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = keyRecord.user_id;

    // Update last_used_at (fire and forget)
    supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then();

    const body = await req.json();
    const { resource, data } = body;

    if (!resource || !data) {
      return new Response(JSON.stringify({ error: "Missing resource or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (resource) {
      case "contact": {
        // Push a CRM contact
        const contact = {
          user_id: userId,
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          source_channel: data.source || "api",
          tags: data.tags || [],
          notes: data.notes || null,
          lead_score: data.lead_score || "WARM",
        };

        if (!contact.name) {
          return new Response(JSON.stringify({ error: "contact.name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: inserted, error } = await supabase
          .from("crm_contacts")
          .insert(contact)
          .select("id, name")
          .single();

        if (error) throw error;
        result = { contact_id: inserted.id, name: inserted.name };
        break;
      }

      case "order": {
        // Push an order
        const order = {
          user_id: userId,
          contact_id: data.contact_id || null,
          subtotal: data.subtotal || data.total || 0,
          total: data.total || 0,
          cost: data.cost || 0,
          payment_status: data.payment_status || "pending",
          fulfillment_status: data.fulfillment_status || "new",
          channel: data.channel || "api",
          notes: data.notes || null,
          payment_method: data.payment_method || null,
        };

        const { data: inserted, error } = await supabase
          .from("orders")
          .insert(order)
          .select("id, order_number")
          .single();

        if (error) throw error;

        // Insert order items if provided
        if (Array.isArray(data.items) && data.items.length > 0) {
          const items = data.items.map((item: any) => ({
            order_id: inserted.id,
            title: item.title || "Item",
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            unit_cost: item.unit_cost || 0,
          }));

          await supabase.from("order_items").insert(items);
        }

        result = { order_id: inserted.id, order_number: inserted.order_number };
        break;
      }

      case "storefront": {
        // Push a storefront
        const slug = `api-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const storefront = {
          user_id: userId,
          title: data.title,
          description: data.description || null,
          price: data.price || 0,
          slug,
          status: data.status || "draft",
          customer_name: data.customer_name || null,
          customer_phone: data.customer_phone || null,
          image_url: data.image_url || null,
          mode: data.mode || "invoice",
        };

        if (!storefront.title) {
          return new Response(JSON.stringify({ error: "storefront.title is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: inserted, error } = await supabase
          .from("storefronts")
          .insert(storefront)
          .select("id, slug")
          .single();

        if (error) throw error;
        result = { storefront_id: inserted.id, slug: inserted.slug };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown resource: ${resource}. Use contact, order, or storefront.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("inbound-api error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
