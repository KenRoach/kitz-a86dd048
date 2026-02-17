import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isRateLimited } from "../_shared/rate-limit.ts";
import { agentGateway, completeSession, corsHeaders } from "../_shared/agent-gateway.ts";

const SYSTEM_PROMPT = `You are an AI Sales Agent for a small business CRM. Your capabilities:

1. **Lead Scoring** - Analyze customer data and assign priority scores (1-100)
2. **Follow-up Suggestions** - Recommend when and how to follow up with leads
3. **Upsell Detection** - Identify opportunities based on purchase history
4. **Conversation Analysis** - Suggest talking points based on customer lifecycle

SCORING CRITERIA:
- High value customers (total_spent > $500): +30 points
- Recent activity (< 7 days): +25 points  
- Multiple orders: +20 points
- Has email & phone: +15 points
- Long-time customer (> 6 months): +10 points

Return structured JSON when analyzing leads. Be actionable and specific in recommendations.`;

// Tool configs by action
function getToolConfig(action: string) {
  const configs: Record<string, any> = {
    score_leads: {
      tools: [{
        type: "function",
        function: {
          name: "score_leads",
          description: "Return scored leads with priority and recommended actions",
          parameters: {
            type: "object",
            properties: {
              leads: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    customer_id: { type: "string" },
                    name: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    priority: { type: "string", enum: ["hot", "warm", "cold"] },
                    recommended_action: { type: "string" },
                    best_time_to_contact: { type: "string" },
                  },
                  required: ["customer_id", "name", "score", "priority", "recommended_action"]
                }
              }
            },
            required: ["leads"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "score_leads" } }
    },
    analyze_customer: {
      tools: [{
        type: "function",
        function: {
          name: "analyze_customer",
          description: "Provide customer analysis with upsell opportunities",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number" },
              lifecycle_stage: { type: "string" },
              upsell_opportunities: { type: "array", items: { type: "string" } },
              talking_points: { type: "array", items: { type: "string" } },
              risk_of_churn: { type: "string", enum: ["low", "medium", "high"] },
              next_best_action: { type: "string" }
            },
            required: ["score", "lifecycle_stage", "next_best_action"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "analyze_customer" } }
    },
    suggest_followups: {
      tools: [{
        type: "function",
        function: {
          name: "suggest_followups",
          description: "Generate follow-up suggestions for customers",
          parameters: {
            type: "object",
            properties: {
              followups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    customer_id: { type: "string" },
                    customer_name: { type: "string" },
                    urgency: { type: "string", enum: ["urgent", "soon", "routine"] },
                    channel: { type: "string", enum: ["whatsapp", "email", "call"] },
                    message_template: { type: "string" },
                    reason: { type: "string" }
                  },
                  required: ["customer_id", "customer_name", "urgency", "channel", "message_template"]
                }
              }
            },
            required: ["followups"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "suggest_followups" } }
    }
  };
  return configs[action] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, customerId, query } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId && userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isRateLimited(`agent-sales:${user.id}`, 15, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === AGENT GATEWAY: Identity + Credits + Session + Audit ===
    const gateway = await agentGateway(supabase, user.id, "sales", action);
    if (!gateway.allowed) return gateway.response!;
    const ctx = gateway.context!;

    try {
      let customerContext = "";
      const effectiveUserId = user.id;

      if (action === "score_leads") {
        const { data: customers } = await supabase
          .from("customers").select("*").eq("user_id", effectiveUserId)
          .order("last_interaction", { ascending: false }).limit(20);
        customerContext = "\n\nCUSTOMER DATA:\n" + JSON.stringify(customers, null, 2);
      } else if (action === "analyze_customer" && customerId) {
        const { data: customer } = await supabase
          .from("customers").select("*").eq("id", customerId).single();
        const { data: storefronts } = await supabase
          .from("storefronts").select("title, price, status, ordered_at")
          .eq("user_id", effectiveUserId).eq("buyer_phone", customer?.phone)
          .order("ordered_at", { ascending: false }).limit(10);
        customerContext = `\n\nCUSTOMER PROFILE:\n${JSON.stringify(customer, null, 2)}\n\nPURCHASE HISTORY:\n${JSON.stringify(storefronts, null, 2)}`;
      } else if (action === "suggest_followups") {
        const { data: customers } = await supabase
          .from("customers").select("*").eq("user_id", effectiveUserId)
          .order("last_interaction", { ascending: true }).limit(10);
        customerContext = "\n\nCUSTOMERS NEEDING FOLLOW-UP:\n" + JSON.stringify(customers, null, 2);
      }

      const toolConfig = getToolConfig(action);
      const requestBody: any = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + customerContext },
          { role: "user", content: query || `Execute action: ${action}` },
        ],
      };
      if (toolConfig) {
        requestBody.tools = toolConfig.tools;
        requestBody.tool_choice = toolConfig.tool_choice;
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        await completeSession(ctx, false, `AI gateway error: ${response.status}`);
        return new Response(JSON.stringify({ error: "Failed to process request." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      let result = data;
      if (data.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = data.choices[0].message.tool_calls[0];
        result = { action, data: JSON.parse(toolCall.function.arguments) };
      }

      await completeSession(ctx, true);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (innerError) {
      await completeSession(ctx, false, innerError instanceof Error ? innerError.message : "Unknown error");
      throw innerError;
    }
  } catch (error) {
    console.error("Sales Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
