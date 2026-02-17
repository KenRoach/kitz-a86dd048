import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isRateLimited } from "../_shared/rate-limit.ts";
import { agentGateway, completeSession, corsHeaders } from "../_shared/agent-gateway.ts";

const SYSTEM_PROMPT = `You are an AI Operations Agent for a small business. Your capabilities:

1. **Inventory Monitoring** - Track product stock and suggest reorders
2. **Order Management** - Monitor fulfillment status and flag delays
3. **Task Automation** - Create and prioritize tasks based on business conditions
4. **Alert Generation** - Identify issues needing attention

CONDITIONS TO MONITOR:
- Low stock products (quantity < threshold)
- Unfulfilled orders older than 24 hours
- Payment pending for more than 48 hours
- Storefronts expiring soon

Return structured, actionable recommendations. Prioritize by urgency.`;

function getToolConfig(action: string) {
  const configs: Record<string, any> = {
    check_inventory: {
      tools: [{
        type: "function",
        function: {
          name: "inventory_report",
          description: "Generate inventory status report with recommendations",
          parameters: {
            type: "object",
            properties: {
              total_products: { type: "number" },
              active_products: { type: "number" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    product_name: { type: "string" },
                    issue: { type: "string" },
                    action: { type: "string" },
                    priority: { type: "string", enum: ["urgent", "high", "medium", "low"] }
                  },
                  required: ["product_name", "issue", "action", "priority"]
                }
              },
              summary: { type: "string" }
            },
            required: ["total_products", "active_products", "recommendations", "summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "inventory_report" } }
    },
    check_orders: {
      tools: [{
        type: "function",
        function: {
          name: "order_report",
          description: "Generate order fulfillment report with action items",
          parameters: {
            type: "object",
            properties: {
              total_orders: { type: "number" },
              pending_fulfillment: { type: "number" },
              pending_payment: { type: "number" },
              alerts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    order_id: { type: "string" },
                    customer: { type: "string" },
                    issue: { type: "string" },
                    days_pending: { type: "number" },
                    recommended_action: { type: "string" },
                    urgency: { type: "string", enum: ["critical", "high", "medium", "low"] }
                  },
                  required: ["order_id", "issue", "recommended_action", "urgency"]
                }
              },
              summary: { type: "string" }
            },
            required: ["total_orders", "alerts", "summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "order_report" } }
    },
    generate_tasks: {
      tools: [{
        type: "function",
        function: {
          name: "task_list",
          description: "Generate prioritized task list based on business state",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string", enum: ["sales", "fulfillment", "inventory", "customer_service", "marketing"] },
                    priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
                    estimated_time: { type: "string" },
                    impact: { type: "string" }
                  },
                  required: ["title", "description", "category", "priority"]
                }
              },
              daily_focus: { type: "string" }
            },
            required: ["tasks", "daily_focus"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "task_list" } }
    },
    check_expiring: {
      tools: [{
        type: "function",
        function: {
          name: "expiring_report",
          description: "Report on expiring storefronts with recommended actions",
          parameters: {
            type: "object",
            properties: {
              expiring_count: { type: "number" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    storefront_id: { type: "string" },
                    title: { type: "string" },
                    expires_in: { type: "string" },
                    customer: { type: "string" },
                    action: { type: "string", enum: ["extend", "follow_up", "close", "convert"] }
                  },
                  required: ["storefront_id", "title", "expires_in", "action"]
                }
              },
              summary: { type: "string" }
            },
            required: ["expiring_count", "items", "summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "expiring_report" } }
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

    const { action, userId, threshold = 5 } = await req.json();

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

    if (isRateLimited(`agent-operations:${user.id}`, 15, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === AGENT GATEWAY: Identity + Credits + Session + JIT + Injection Scan ===
    const gateway = await agentGateway(supabase, user.id, "operations", action, {});
    if (!gateway.allowed) return gateway.response!;
    const ctx = gateway.context!;

    try {
      const effectiveUserId = user.id;
      let operationsContext = "";

      if (action === "check_inventory") {
        const { data: products } = await supabase
          .from("products").select("id, title, price, is_active, category")
          .eq("user_id", effectiveUserId).eq("is_active", true);
        operationsContext = "\n\nPRODUCT INVENTORY:\n" + JSON.stringify(products, null, 2);
      } else if (action === "check_orders") {
        const { data: orders } = await supabase
          .from("storefronts").select("id, title, price, status, fulfillment_status, ordered_at, paid_at, buyer_name")
          .eq("user_id", effectiveUserId).in("status", ["active", "ordered"])
          .order("ordered_at", { ascending: true }).limit(30);
        operationsContext = "\n\nORDER STATUS:\n" + JSON.stringify(orders, null, 2);
      } else if (action === "generate_tasks") {
        const { data: products } = await supabase
          .from("products").select("title, is_active").eq("user_id", effectiveUserId);
        const { data: orders } = await supabase
          .from("storefronts").select("title, status, fulfillment_status")
          .eq("user_id", effectiveUserId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        const { data: customers } = await supabase
          .from("customers").select("name, lifecycle, last_interaction")
          .eq("user_id", effectiveUserId).limit(20);
        operationsContext = `\n\nBUSINESS STATE:\nProducts: ${JSON.stringify(products)}\nRecent Orders: ${JSON.stringify(orders)}\nCustomers: ${JSON.stringify(customers)}`;
      } else if (action === "check_expiring") {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: expiring } = await supabase
          .from("storefronts").select("id, title, valid_until, status, buyer_name")
          .eq("user_id", effectiveUserId).eq("status", "active")
          .lt("valid_until", tomorrow).order("valid_until", { ascending: true });
        operationsContext = "\n\nEXPIRING STOREFRONTS:\n" + JSON.stringify(expiring, null, 2);
      }

      const toolConfig = getToolConfig(action);
      const requestBody: any = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + operationsContext },
          { role: "user", content: `Execute operations check: ${action}. Current timestamp: ${new Date().toISOString()}` },
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
    console.error("Operations Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
