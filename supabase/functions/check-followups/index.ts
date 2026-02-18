import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Kitz AI-Powered Follow-Up Engine
 * 
 * Sequences:
 *   payment_reminder: 24h → 48h → 72h
 *   no_reply: 24h → 48h → 72h
 *   testimonial: 24h after delivery
 * 
 * Smart behavior:
 *   - Customer pays → follow-ups auto-complete
 *   - Customer replies → sequence pauses
 *   - Order cancelled → follow-ups dismissed
 * 
 * AI Enhancement:
 *   - Each follow-up gets a personalized suggested_message
 *   - Uses customer name, order details, step context
 *   - Consumes 1 AI credit per message generated
 */

const SEQUENCE_CONFIG: Record<string, { intervals: number[]; channels: string[] }> = {
  payment_reminder: { intervals: [24, 48, 72], channels: ["whatsapp", "whatsapp", "email"] },
  no_reply: { intervals: [24, 48, 72], channels: ["whatsapp", "whatsapp", "email"] },
  testimonial: { intervals: [24], channels: ["whatsapp"] },
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

interface FollowUpContext {
  customerName: string;
  orderNumber?: string;
  orderTotal?: number;
  sequenceType: string;
  step: number;
  maxSteps: number;
  channel: string;
  businessName: string;
  language: string;
}

async function generateFollowUpMessage(
  ctx: FollowUpContext,
  apiKey: string
): Promise<string | null> {
  const stepLabel = ctx.step === 1 ? "first" : ctx.step === 2 ? "second" : "final";
  
  const prompts: Record<string, string> = {
    payment_reminder: `Write a short, warm ${stepLabel} payment reminder message from "${ctx.businessName}" to "${ctx.customerName}" about their pending order${ctx.orderNumber ? ` #${ctx.orderNumber}` : ""}${ctx.orderTotal ? ` ($${ctx.orderTotal})` : ""}. ${ctx.step === 1 ? "Be friendly and casual." : ctx.step === 2 ? "Be polite but clear it's a follow-up." : "Be respectful but mention it's the last reminder."}`,
    no_reply: `Write a short, friendly ${stepLabel} follow-up message from "${ctx.businessName}" to "${ctx.customerName}" who hasn't responded recently. ${ctx.step === 1 ? "Be casual and check in." : ctx.step === 2 ? "Be warm but express genuine interest." : "Be respectful, offer to help if they're still interested."}`,
    testimonial: `Write a short, warm message from "${ctx.businessName}" to "${ctx.customerName}" asking how their order${ctx.orderNumber ? ` #${ctx.orderNumber}` : ""} went and if they'd share a quick review. Be grateful and casual.`,
  };

  const prompt = prompts[ctx.sequenceType];
  if (!prompt) return null;

  const channelNote = ctx.channel === "whatsapp" 
    ? "Keep it under 160 characters, suitable for WhatsApp. Use 1-2 emojis max."
    : "Keep it under 3 sentences, suitable for a short email.";

  const langNote = ctx.language === "es" ? "Write in Spanish." : "Write in English.";

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a business messaging assistant. Write ONLY the message text, nothing else. No quotes, no labels, no "Subject:" lines. ${channelNote} ${langNote}`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("AI message generation error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let created = 0;
    let dismissed = 0;
    let escalated = 0;
    let paused = 0;
    let aiGenerated = 0;

    // Helper: create follow-up with AI message
    async function createFollowUp(params: {
      user_id: string;
      contact_id: string | null;
      order_id?: string | null;
      reason: string;
      due_at: string;
      channel: string;
      step: number;
      max_steps: number;
      sequence_type: string;
      customerName: string;
      orderNumber?: string;
      orderTotal?: number;
    }) {
      // Get business name for personalization
      let businessName = "My Business";
      let language = "en";
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, country")
        .eq("user_id", params.user_id)
        .maybeSingle();
      
      if (profile) {
        businessName = profile.business_name;
        // Panama-based = Spanish
        if (profile.country?.toLowerCase().includes("panama") || profile.country?.toLowerCase().includes("panamá")) {
          language = "es";
        }
      }

      // Check credits before AI generation
      const { data: creditResult } = await supabase.rpc("consume_ai_credit", {
        p_user_id: params.user_id,
        p_amount: 1,
      });

      let suggestedMessage: string | null = null;

      if (creditResult !== -1 && lovableApiKey) {
        suggestedMessage = await generateFollowUpMessage({
          customerName: params.customerName,
          orderNumber: params.orderNumber,
          orderTotal: params.orderTotal,
          sequenceType: params.sequence_type,
          step: params.step,
          maxSteps: params.max_steps,
          channel: params.channel,
          businessName,
          language,
        }, lovableApiKey);
        
        if (suggestedMessage) aiGenerated++;
      }

      await supabase.from("follow_ups").insert({
        user_id: params.user_id,
        contact_id: params.contact_id,
        order_id: params.order_id || null,
        reason: params.reason,
        due_at: params.due_at,
        status: "pending",
        channel: params.channel,
        step: params.step,
        max_steps: params.max_steps,
        sequence_type: params.sequence_type,
        suggested_message: suggestedMessage,
        message_generated_at: suggestedMessage ? now.toISOString() : null,
      });
      created++;
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. AUTO-DISMISS: Paid orders
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
            status: "completed", completed_at: now.toISOString(),
          }).in("id", toComplete.map(f => f.id));
          dismissed += toComplete.length;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. AUTO-DISMISS: Cancelled orders
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
            status: "completed", completed_at: now.toISOString(),
          }).in("id", toCancel.map(f => f.id));
          dismissed += toCancel.length;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. SMART PAUSE: Customer replied
    // ═══════════════════════════════════════════════════════════════
    const { data: activeFollowUps } = await supabase
      .from("follow_ups")
      .select("id, contact_id, created_at")
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
        const toPause: string[] = [];
        for (const fu of activeFollowUps) {
          if (!fu.contact_id) continue;
          const lastInteraction = contactMap.get(fu.contact_id);
          if (lastInteraction && new Date(lastInteraction) > new Date(fu.created_at)) {
            toPause.push(fu.id);
          }
        }
        if (toPause.length > 0) {
          await supabase.from("follow_ups").update({
            paused_at: now.toISOString(),
            pause_reason: "customer_replied",
          }).in("id", toPause);
          paused += toPause.length;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. ESCALATE: Next steps for user-completed follow-ups
    // ═══════════════════════════════════════════════════════════════
    const { data: completedFollowUps } = await supabase
      .from("follow_ups")
      .select("id, user_id, contact_id, order_id, step, max_steps, sequence_type, completed_at")
      .eq("status", "completed")
      .gt("completed_at", oneDayAgo.toISOString())
      .is("paused_at", null);

    if (completedFollowUps) {
      for (const fu of completedFollowUps) {
        if (fu.step >= fu.max_steps) continue;
        const config = SEQUENCE_CONFIG[fu.sequence_type];
        if (!config) continue;

        const nextStep = fu.step + 1;
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("order_id", fu.order_id)
          .eq("sequence_type", fu.sequence_type)
          .eq("step", nextStep);

        if (!count || count === 0) {
          // Get customer name for AI
          let customerName = "Customer";
          let orderNumber: string | undefined;
          let orderTotal: number | undefined;
          
          if (fu.contact_id) {
            const { data: contact } = await supabase
              .from("crm_contacts").select("name").eq("id", fu.contact_id).maybeSingle();
            if (contact) customerName = contact.name;
          }
          if (fu.order_id) {
            const { data: order } = await supabase
              .from("orders").select("order_number, total").eq("id", fu.order_id).maybeSingle();
            if (order) { orderNumber = order.order_number || undefined; orderTotal = order.total; }
          }

          const intervalHours = config.intervals[nextStep - 1] || 24;
          const nextDue = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
          const messages = STEP_MESSAGES[fu.sequence_type] || [];
          const nextChannel = config.channels[nextStep - 1] || "whatsapp";

          await createFollowUp({
            user_id: fu.user_id,
            contact_id: fu.contact_id,
            order_id: fu.order_id,
            reason: `${messages[nextStep - 1] || "Follow-up"}`,
            due_at: nextDue.toISOString(),
            channel: nextChannel,
            step: nextStep,
            max_steps: fu.max_steps,
            sequence_type: fu.sequence_type,
            customerName,
            orderNumber,
            orderTotal,
          });
          escalated++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CREATE: Payment reminders for stale unpaid orders
    // ═══════════════════════════════════════════════════════════════
    const { data: staleOrders } = await supabase
      .from("orders")
      .select("id, user_id, contact_id, order_number, total")
      .eq("payment_status", "PENDING")
      .neq("fulfillment_status", "CANCELLED")
      .lt("created_at", oneDayAgo.toISOString())
      .not("contact_id", "is", null);

    if (staleOrders) {
      for (const order of staleOrders) {
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("order_id", order.id)
          .eq("sequence_type", "payment_reminder");

        if (!count || count === 0) {
          let customerName = "Customer";
          if (order.contact_id) {
            const { data: contact } = await supabase
              .from("crm_contacts").select("name").eq("id", order.contact_id).maybeSingle();
            if (contact) customerName = contact.name;
          }

          await createFollowUp({
            user_id: order.user_id,
            contact_id: order.contact_id,
            order_id: order.id,
            reason: `${STEP_MESSAGES.payment_reminder[0]} — Order ${order.order_number || "Draft"}`,
            due_at: now.toISOString(),
            channel: "whatsapp",
            step: 1,
            max_steps: 3,
            sequence_type: "payment_reminder",
            customerName,
            orderNumber: order.order_number || undefined,
            orderTotal: order.total,
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CREATE: Testimonial requests
    // ═══════════════════════════════════════════════════════════════
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const { data: deliveredOrders } = await supabase
      .from("orders")
      .select("id, user_id, contact_id, order_number, delivered_at, total")
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
            let customerName = "Customer";
            if (order.contact_id) {
              const { data: contact } = await supabase
                .from("crm_contacts").select("name").eq("id", order.contact_id).maybeSingle();
              if (contact) customerName = contact.name;
            }

            await createFollowUp({
              user_id: order.user_id,
              contact_id: order.contact_id,
              order_id: order.id,
              reason: `${STEP_MESSAGES.testimonial[0]} — Order ${order.order_number || "Draft"}`,
              due_at: now.toISOString(),
              channel: "whatsapp",
              step: 1,
              max_steps: 1,
              sequence_type: "testimonial",
              customerName,
              orderNumber: order.order_number || undefined,
              orderTotal: order.total,
            });
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
        const { count } = await supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("contact_id", contact.id)
          .eq("sequence_type", "no_reply")
          .gt("created_at", threeDaysAgo.toISOString());

        if (!count || count === 0) {
          await createFollowUp({
            user_id: contact.user_id,
            contact_id: contact.id,
            reason: `${STEP_MESSAGES.no_reply[0]} — ${contact.name}`,
            due_at: now.toISOString(),
            channel: "whatsapp",
            step: 1,
            max_steps: 3,
            sequence_type: "no_reply",
            customerName: contact.name,
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. BACKFILL: Generate messages for existing follow-ups missing one
    // ═══════════════════════════════════════════════════════════════
    const { data: missingMessages } = await supabase
      .from("follow_ups")
      .select("id, user_id, contact_id, order_id, step, max_steps, sequence_type, channel")
      .eq("status", "pending")
      .is("suggested_message", null)
      .is("paused_at", null)
      .limit(5); // Batch 5 at a time to control AI costs

    if (missingMessages) {
      for (const fu of missingMessages) {
        let customerName = "Customer";
        let orderNumber: string | undefined;
        let orderTotal: number | undefined;

        if (fu.contact_id) {
          const { data: contact } = await supabase
            .from("crm_contacts").select("name").eq("id", fu.contact_id).maybeSingle();
          if (contact) customerName = contact.name;
        }
        if (fu.order_id) {
          const { data: order } = await supabase
            .from("orders").select("order_number, total").eq("id", fu.order_id).maybeSingle();
          if (order) { orderNumber = order.order_number || undefined; orderTotal = order.total; }
        }

        // Check credits
        const { data: creditResult } = await supabase.rpc("consume_ai_credit", {
          p_user_id: fu.user_id,
          p_amount: 1,
        });
        if (creditResult === -1) continue;

        let businessName = "My Business";
        let language = "en";
        const { data: profile } = await supabase
          .from("profiles").select("business_name, country").eq("user_id", fu.user_id).maybeSingle();
        if (profile) {
          businessName = profile.business_name;
          if (profile.country?.toLowerCase().includes("panama")) language = "es";
        }

        const msg = await generateFollowUpMessage({
          customerName, orderNumber, orderTotal,
          sequenceType: fu.sequence_type,
          step: fu.step,
          maxSteps: fu.max_steps,
          channel: fu.channel || "whatsapp",
          businessName, language,
        }, lovableApiKey);

        if (msg) {
          await supabase.from("follow_ups").update({
            suggested_message: msg,
            message_generated_at: now.toISOString(),
          }).eq("id", fu.id);
          aiGenerated++;
        }
      }
    }

    console.log(`Follow-up engine: ${created} created, ${escalated} escalated, ${dismissed} dismissed, ${paused} paused, ${aiGenerated} AI messages`);

    return new Response(JSON.stringify({
      success: true, created, escalated, dismissed, paused, aiGenerated,
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
