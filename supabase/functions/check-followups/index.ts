import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Auto WhatsApp Follow-Up Engine
 * 
 * 4 triggers:
 * 1. Order created → instant reply (handled in place-order)
 * 2. Payment pending → 24h reminder (handled in place-order, auto-dismissed here if paid)
 * 3. No reply 24h → follow-up (created here)
 * 4. Delivered → ask for testimonial (created here)
 * 
 * This function runs on a schedule (cron) and:
 * - Auto-completes follow-ups for paid orders (trigger 2)
 * - Creates "no reply" follow-ups for stale orders (trigger 3)
 * - Creates testimonial requests for delivered orders (trigger 4)
 * - Returns pending follow-ups with WhatsApp links
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let created = 0;
    let dismissed = 0;

    // ── 1. Auto-dismiss payment reminders for already-paid orders ────
    const { data: paymentFollowUps } = await supabase
      .from("follow_ups")
      .select("id, order_id")
      .eq("status", "pending")
      .like("reason", "%Payment pending%");

    if (paymentFollowUps) {
      const orderIds = paymentFollowUps.map(f => f.order_id).filter(Boolean);
      if (orderIds.length > 0) {
        const { data: paidOrders } = await supabase
          .from("orders")
          .select("id")
          .in("id", orderIds)
          .eq("payment_status", "PAID");

        const paidIds = new Set(paidOrders?.map(o => o.id) || []);
        const toComplete = paymentFollowUps.filter(f => f.order_id && paidIds.has(f.order_id));

        for (const f of toComplete) {
          await supabase.from("follow_ups").update({
            status: "completed",
            completed_at: now.toISOString(),
          }).eq("id", f.id);
          dismissed++;
        }
      }
    }

    // ── 2. Create "no reply" follow-ups for stale unpaid orders ──────
    // Orders older than 24h that are still pending, with no "no reply" follow-up yet
    const { data: staleOrders } = await supabase
      .from("orders")
      .select("id, user_id, contact_id, order_number")
      .eq("payment_status", "PENDING")
      .neq("fulfillment_status", "CANCELLED")
      .lt("created_at", oneDayAgo.toISOString())
      .not("contact_id", "is", null);

    if (staleOrders) {
      for (const order of staleOrders) {
        // Check if we already created a "no reply" follow-up for this order
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("order_id", order.id)
          .like("reason", "%No reply%");

        if (!count || count === 0) {
          await supabase.from("follow_ups").insert({
            user_id: order.user_id,
            contact_id: order.contact_id,
            order_id: order.id,
            reason: `No reply on order ${order.order_number || "Draft"} — follow up now`,
            due_at: now.toISOString(),
            status: "pending",
            channel: "whatsapp",
          });
          created++;
        }
      }
    }

    // ── 3. Create testimonial requests for recently delivered orders ──
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const { data: deliveredOrders } = await supabase
      .from("orders")
      .select("id, user_id, contact_id, order_number, delivered_at")
      .eq("fulfillment_status", "DELIVERED")
      .gt("delivered_at", twoDaysAgo.toISOString())
      .not("contact_id", "is", null);

    if (deliveredOrders) {
      for (const order of deliveredOrders) {
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("order_id", order.id)
          .like("reason", "%testimonial%");

        if (!count || count === 0) {
          const askDate = new Date(order.delivered_at!);
          askDate.setDate(askDate.getDate() + 1); // Ask 1 day after delivery

          if (askDate <= now) {
            await supabase.from("follow_ups").insert({
              user_id: order.user_id,
              contact_id: order.contact_id,
              order_id: order.id,
              reason: `Order ${order.order_number || "Draft"} delivered — ask for testimonial`,
              due_at: now.toISOString(),
              status: "pending",
              channel: "whatsapp",
            });
            created++;
          }
        }
      }
    }

    console.log(`Follow-up check complete: ${created} created, ${dismissed} auto-dismissed`);

    return new Response(JSON.stringify({
      success: true,
      created,
      dismissed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Check-followups error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
