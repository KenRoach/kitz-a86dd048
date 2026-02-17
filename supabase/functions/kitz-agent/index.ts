import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isRateLimited } from "../_shared/rate-limit.ts";
import { trackUsage } from "../_shared/track.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (isRateLimited(`kitz-agent:${user.id}`, 10, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Tool definitions for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "generate_actions",
          description: "Generate AI recommended business actions",
          parameters: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action_type: { type: "string", enum: ["follow_up", "payment_reminder", "delivery_alert", "revenue_alert", "bundle_suggestion", "general"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "critical"] }
                  },
                  required: ["action_type", "title", "description", "priority"]
                }
              }
            },
            required: ["actions"]
          }
        }
      }
    ];

    if (action === "run_my_business") {
      // Gather all business data
      const [contacts, orders, followUps, events] = await Promise.all([
        supabase.from("crm_contacts").select("*").eq("user_id", user.id),
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("follow_ups").select("*, crm_contacts(name)").eq("user_id", user.id).eq("status", "pending"),
        supabase.from("business_events").select("*").eq("user_id", user.id).order("timestamp", { ascending: false }).limit(20),
      ]);

      const now = new Date();
      const overdueFollowUps = (followUps.data || []).filter(f => new Date(f.due_at) < now);
      const unpaidOrders = (orders.data || []).filter(o => o.payment_status === "PENDING");
      const riskyOrders = (orders.data || []).filter(o => o.risk_flag);

      // Calculate revenue stats
      const paidOrders = (orders.data || []).filter(o => o.payment_status === "PAID");
      const todayStr = now.toISOString().split("T")[0];
      const todayRevenue = paidOrders
        .filter(o => o.paid_at?.startsWith(todayStr))
        .reduce((sum, o) => sum + Number(o.total), 0);

      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const thisWeekRevenue = paidOrders
        .filter(o => o.paid_at && new Date(o.paid_at) >= weekAgo)
        .reduce((sum, o) => sum + Number(o.total), 0);

      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const lastWeekRevenue = paidOrders
        .filter(o => o.paid_at && new Date(o.paid_at) >= twoWeeksAgo && new Date(o.paid_at) < weekAgo)
        .reduce((sum, o) => sum + Number(o.total), 0);

      const hotLeads = (contacts.data || []).filter(c => c.lead_score === "HOT");
      const coldLeads = (contacts.data || []).filter(c => c.lead_score === "COLD");

      const systemPrompt = `You are Kitz, an AI Business Operating System. Analyze this business data and generate 3-5 actionable recommendations.

Business Summary:
- Total contacts: ${(contacts.data || []).length} (HOT: ${hotLeads.length}, COLD: ${coldLeads.length})
- Total orders: ${(orders.data || []).length}
- Today's revenue: $${todayRevenue.toFixed(2)}
- This week revenue: $${thisWeekRevenue.toFixed(2)}
- Last week revenue: $${lastWeekRevenue.toFixed(2)}
- Revenue change: ${lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(0) : "N/A"}%
- Overdue follow-ups: ${overdueFollowUps.length}
- Unpaid orders: ${unpaidOrders.length} totaling $${unpaidOrders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)}
- Risky orders: ${riskyOrders.length}

Rules:
- If overdue follow-ups exist, create follow_up actions
- If unpaid orders > 2hrs old, create payment_reminder actions
- If revenue dropped 20%+ week over week, create revenue_alert
- If delivery is delayed, create delivery_alert
- Always suggest at least 1 growth action`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze my business and generate recommended actions." }
          ],
          tools,
          tool_choice: { type: "function", function: { name: "generate_actions" } }
        })
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let actions = [];

      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        actions = parsed.actions || [];
      }

      // Store actions in DB
      if (actions.length > 0) {
        // Clear old pending actions
        await supabase.from("ai_actions").delete().eq("user_id", user.id).eq("status", "pending");

        const inserts = actions.map((a: any) => ({
          user_id: user.id,
          action_type: a.action_type,
          title: a.title,
          description: a.description,
          priority: a.priority,
        }));
        await supabase.from("ai_actions").insert(inserts);
      }

      trackUsage(supabase, user.id, "ai", "kitz_agent.run_my_business", {
        actions_count: actions.length,
        overdue_followups: overdueFollowUps.length,
        unpaid_orders: unpaidOrders.length,
      }, "ai_calls");

      return new Response(JSON.stringify({
        summary: {
          todayRevenue,
          thisWeekRevenue,
          lastWeekRevenue,
          totalContacts: (contacts.data || []).length,
          hotLeads: hotLeads.length,
          activeOrders: unpaidOrders.length,
          overdueFollowUps: overdueFollowUps.length,
          riskyOrders: riskyOrders.length,
        },
        actions,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CRM Agent: score lead
    if (action === "score_lead") {
      const { contact_id } = payload;
      const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", contact_id).single();
      const { data: contactOrders } = await supabase.from("orders").select("*").eq("contact_id", contact_id);

      if (!contact) {
        return new Response(JSON.stringify({ error: "Contact not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const orderCount = (contactOrders || []).length;
      const totalSpent = (contactOrders || []).filter(o => o.payment_status === "PAID").reduce((s, o) => s + Number(o.total), 0);

      let score: string = "WARM";
      let status = contact.status;

      if (orderCount >= 3 || totalSpent >= 500) {
        score = "HOT";
        status = "vip";
      } else if (contact.last_interaction_at) {
        const daysSince = (Date.now() - new Date(contact.last_interaction_at).getTime()) / 86400000;
        if (daysSince > 30) score = "COLD";
        else if (daysSince < 3) score = "HOT";
      }

      await supabase.from("crm_contacts").update({
        lead_score: score,
        status,
        lifetime_value: totalSpent,
        last_interaction_at: new Date().toISOString()
      }).eq("id", contact_id);

      trackUsage(supabase, user.id, "agent", "kitz_agent.score_lead", { score, orderCount }, "agent_actions");

      return new Response(JSON.stringify({ score, status, totalSpent, orderCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Insights Agent: get metrics
    if (action === "get_insights") {
      const { data: orders } = await supabase.from("orders").select("*").eq("user_id", user.id);
      const { data: contacts } = await supabase.from("crm_contacts").select("*").eq("user_id", user.id);

      const paidOrders = (orders || []).filter(o => o.payment_status === "PAID");
      const now = new Date();

      // Daily revenue (last 7 days)
      const dailyRevenue: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split("T")[0];
        dailyRevenue[key] = 0;
      }
      paidOrders.forEach(o => {
        if (o.paid_at) {
          const key = o.paid_at.split("T")[0];
          if (key in dailyRevenue) dailyRevenue[key] += Number(o.total);
        }
      });

      // Top products
      const productCounts: Record<string, { count: number; revenue: number }> = {};
      // We'd need order_items but simplify for now

      const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
      const totalCost = paidOrders.reduce((s, o) => s + Number(o.cost), 0);
      const totalOrders = (orders || []).length;
      const conversionRate = (contacts || []).length > 0
        ? (paidOrders.length / (contacts || []).length * 100).toFixed(1)
        : "0";

      return new Response(JSON.stringify({
        totalRevenue,
        totalCost,
        totalMargin: totalRevenue - totalCost,
        totalOrders,
        paidOrders: paidOrders.length,
        conversionRate: Number(conversionRate),
        dailyRevenue,
        totalContacts: (contacts || []).length,
        hotLeads: (contacts || []).filter(c => c.lead_score === "HOT").length,
        warmLeads: (contacts || []).filter(c => c.lead_score === "WARM").length,
        coldLeads: (contacts || []).filter(c => c.lead_score === "COLD").length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("kitz-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
