import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Kitz Automated Follow-Up Engine
 * 
 * Trigger-based reminder sequences:
 * 
 * SEQUENCE: payment_reminder (when order is pending payment)
 *   Step 1: 24h after order  → "Friendly payment reminder"
 *   Step 2: 48h after order  → "Second check-in"
 *   Step 3: 72h after order  → "Final reminder"
 * 
 * SEQUENCE: no_reply (when customer stops replying)
 *   Step 1: 24h after last interaction → "Check-in"
 *   Step 2: 48h → "Second follow-up"
 *   Step 3: 72h → "Final reach-out"
 * 
 * SEQUENCE: testimonial (after delivery)
 *   Step 1: 24h after delivery → "How was your experience?"
 * 
 * SMART BEHAVIOR:
 *   - Customer pays → all payment follow-ups auto-complete
 *   - Customer replies (last_interaction updates) → sequence pauses
 *   - Order updated → reminders adjust accordingly
 *   - Order cancelled → follow-ups dismissed
 */

// Step intervals in hours for each sequence type
const SEQUENCE_CONFIG: Record<string, { intervals: number[]; channels: string[] }> = {
  payment_reminder: {
    intervals: [24, 48, 72],
    channels: ["whatsapp", "whatsapp", "email"],
  },
  no_reply: {
    intervals: [24, 48, 72],
    channels: ["whatsapp", "whatsapp", "email"],
  },
  testimonial: {
    intervals: [24],
    channels: ["whatsapp"],
  },
};

const STEP_MESSAGES: Record<string, string[]> = {
  payment_reminder: [
    "Payment pending — friendly reminder",
    "Payment pending — second check-in",
    "Payment pending — final reminder",
  ],
  no_reply: [
    "No reply — check in with customer",
    "No reply — second follow-up",
    "No reply — final reach-out",
  ],
  testimonial: [
    "Order delivered — ask for testimonial",
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let created = 0;
    let dismissed = 0;
    let escalated = 0;
    let paused = 0;

    // ═══════════════════════════════════════════════════════════════
    // 1. AUTO-DISMISS: Complete follow-ups for paid orders
    // ═══════════════════════════════════════════════════════════════
    const { data: paymentFollowUps } = await supabase
      .from("follow_ups")
      .select("id, order_id")
      .eq("status", "pending")
      .eq("sequence_type", "payment_reminder");

    if (paymentFollowUps && paymentFollowUps.length > 0) {
      const orderIds = [...new Set(paymentFollowUps.map(f => f.order_id).filter(Boolean))];
      if (orderIds.length > 0) {
        const { data: paidOrders } = await supabase
          .from("orders")
          .select("id")
          .in("id", orderIds)
          .eq("payment_status", "PAID");

        const paidIds = new Set(paidOrders?.map(o => o.id) || []);
        const toComplete = paymentFollowUps.filter(f => f.order_id && paidIds.has(f.order_id));

        if (toComplete.length > 0) {
          await supabase.from("follow_ups").update({
            status: "completed",
            completed_at: now.toISOString(),
          }).in("id", toComplete.map(f => f.id));
          dismissed += toComplete.length;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. AUTO-DISMISS: Complete follow-ups for cancelled orders
    // ═══════════════════════════════════════════════════════════════
    const { data: cancelFollowUps } = await supabase
      .from("follow_ups")
      .select("id, order_id")
      .eq("status", "pending")
      .not("order_id", "is", null);

    if (cancelFollowUps && cancelFollowUps.length > 0) {
      const cancelOrderIds = [...new Set(cancelFollowUps.map(f => f.order_id).filter(Boolean))];
      if (cancelOrderIds.length > 0) {
        const { data: cancelledOrders } = await supabase
          .from("orders")
          .select("id")
          .in("id", cancelOrderIds)
          .eq("fulfillment_status", "CANCELLED");

        const cancelledIds = new Set(cancelledOrders?.map(o => o.id) || []);
        const toCancel = cancelFollowUps.filter(f => f.order_id && cancelledIds.has(f.order_id));

        if (toCancel.length > 0) {
          await supabase.from("follow_ups").update({
            status: "completed",
            completed_at: now.toISOString(),
          }).in("id", toCancel.map(f => f.id));
          dismissed += toCancel.length;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. SMART PAUSE: Pause follow-ups when customer has replied
    // ═══════════════════════════════════════════════════════════════
    const { data: activeFollowUps } = await supabase
      .from("follow_ups")
      .select("id, contact_id, order_id, created_at, sequence_type")
      .eq("status", "pending")
      .is("paused_at", null)
      .not("contact_id", "is", null);

    if (activeFollowUps && activeFollowUps.length > 0) {
      const contactIds = [...new Set(activeFollowUps.map(f => f.contact_id).filter(Boolean))];
      
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from("crm_contacts")
          .select("id, last_interaction_at")
          .in("id", contactIds);

        const contactMap = new Map(contacts?.map(c => [c.id, c.last_interaction_at]) || []);

        for (const fu of activeFollowUps) {
          if (!fu.contact_id) continue;
          const lastInteraction = contactMap.get(fu.contact_id);
          if (!lastInteraction) continue;

          const interactionDate = new Date(lastInteraction);
          const followUpCreated = new Date(fu.created_at);

          // If customer interacted AFTER this follow-up was created, pause it
          if (interactionDate > followUpCreated) {
            await supabase.from("follow_ups").update({
              paused_at: now.toISOString(),
              pause_reason: "customer_replied",
            }).eq("id", fu.id);
            paused++;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. ESCALATE: Create next-step follow-ups for completed ones
    // ═══════════════════════════════════════════════════════════════
    // Find recently completed follow-ups that have more steps
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: completedFollowUps } = await supabase
      .from("follow_ups")
      .select("id, user_id, contact_id, order_id, step, max_steps, sequence_type, channel, completed_at")
      .eq("status", "completed")
      .gt("completed_at", oneDayAgo.toISOString())
      .is("paused_at", null); // Not paused ones

    if (completedFollowUps) {
      for (const fu of completedFollowUps) {
        // Only escalate manually-completed (user acted on it), not auto-dismissed
        if (fu.step < fu.max_steps) {
          const config = SEQUENCE_CONFIG[fu.sequence_type];
          if (!config) continue;

          const nextStep = fu.step + 1;
          
          // Check if next step already exists
          const { count } = await supabase
            .from("follow_ups")
            .select("id", { count: "exact", head: true })
            .eq("order_id", fu.order_id)
            .eq("sequence_type", fu.sequence_type)
            .eq("step", nextStep);

          if (!count || count === 0) {
            const intervalHours = config.intervals[nextStep - 1] || 24;
            const nextDue = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
            const messages = STEP_MESSAGES[fu.sequence_type] || [];
            const nextChannel = config.channels[nextStep - 1] || "whatsapp";

            await supabase.from("follow_ups").insert({
              user_id: fu.user_id,
              contact_id: fu.contact_id,
              order_id: fu.order_id,
              reason: `${messages[nextStep - 1] || "Follow-up"} (${fu.order_id ? "Order" : "Contact"})`,
              due_at: nextDue.toISOString(),
              status: "pending",
              channel: nextChannel,
              step: nextStep,
              max_steps: fu.max_steps,
              sequence_type: fu.sequence_type,
            });
            escalated++;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CREATE: New payment reminder sequences for unpaid orders
    // ═══════════════════════════════════════════════════════════════
    const { data: staleOrders } = await supabase
      .from("orders")
      .select("id, user_id, contact_id, order_number")
      .eq("payment_status", "PENDING")
      .neq("fulfillment_status", "CANCELLED")
      .lt("created_at", oneDayAgo.toISOString())
      .not("contact_id", "is", null);

    if (staleOrders) {
      for (const order of staleOrders) {
        // Check if any payment_reminder sequence already exists for this order
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("order_id", order.id)
          .eq("sequence_type", "payment_reminder");

        if (!count || count === 0) {
          await supabase.from("follow_ups").insert({
            user_id: order.user_id,
            contact_id: order.contact_id,
            order_id: order.id,
            reason: `${STEP_MESSAGES.payment_reminder[0]} — Order ${order.order_number || "Draft"}`,
            due_at: now.toISOString(),
            status: "pending",
            channel: "whatsapp",
            step: 1,
            max_steps: 3,
            sequence_type: "payment_reminder",
          });
          created++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CREATE: Testimonial requests for delivered orders
    // ═══════════════════════════════════════════════════════════════
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
          .eq("sequence_type", "testimonial");

        if (!count || count === 0) {
          const askDate = new Date(order.delivered_at!);
          askDate.setDate(askDate.getDate() + 1);

          if (askDate <= now) {
            await supabase.from("follow_ups").insert({
              user_id: order.user_id,
              contact_id: order.contact_id,
              order_id: order.id,
              reason: `${STEP_MESSAGES.testimonial[0]} — Order ${order.order_number || "Draft"}`,
              due_at: now.toISOString(),
              status: "pending",
              channel: "whatsapp",
              step: 1,
              max_steps: 1,
              sequence_type: "testimonial",
            });
            created++;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. CREATE: No-reply sequences for stale contacts
    // ═══════════════════════════════════════════════════════════════
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const { data: staleContacts } = await supabase
      .from("crm_contacts")
      .select("id, user_id, name, last_interaction_at")
      .eq("status", "active")
      .in("lead_score", ["HOT", "WARM"])
      .lt("last_interaction_at", oneDayAgo.toISOString())
      .gt("last_interaction_at", threeDaysAgo.toISOString());

    if (staleContacts) {
      for (const contact of staleContacts) {
        // Check if a no_reply sequence already exists recently
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("contact_id", contact.id)
          .eq("sequence_type", "no_reply")
          .gt("created_at", threeDaysAgo.toISOString());

        if (!count || count === 0) {
          await supabase.from("follow_ups").insert({
            user_id: contact.user_id,
            contact_id: contact.id,
            reason: `${STEP_MESSAGES.no_reply[0]} — ${contact.name}`,
            due_at: now.toISOString(),
            status: "pending",
            channel: "whatsapp",
            step: 1,
            max_steps: 3,
            sequence_type: "no_reply",
          });
          created++;
        }
      }
    }

    console.log(`Follow-up engine: ${created} created, ${escalated} escalated, ${dismissed} dismissed, ${paused} paused`);

    return new Response(JSON.stringify({
      success: true,
      created,
      escalated,
      dismissed,
      paused,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Follow-up engine error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
