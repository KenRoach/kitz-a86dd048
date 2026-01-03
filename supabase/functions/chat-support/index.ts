import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the AI customer support assistant for a small business storefront platform in Panama. 

LANGUAGE RULES:
- Detect the customer's language from their message
- Respond in the same language they use (Spanish or English)
- Default to Spanish if unclear

TONE:
- Professional and helpful
- Use "usted" in Spanish, not "tú"
- Be clear and concise
- Show empathy when customers have issues

WHAT YOU CAN HELP WITH:
1. **Payment Methods** - Explain accepted payments: Cash, Yappy, Cards, Pluxee vouchers
2. **How to Order** - Guide them to browse storefronts and place orders
3. **Order Status** - Explain they can check their order using the link they received
4. **Delivery** - Delivery depends on the seller; coordinate via the storefront link
5. **Contact Seller** - Recommend using the storefront link to see seller contact info
6. **General Questions** - Answer questions about how the platform works

WHAT YOU CANNOT DO:
- You cannot look up specific order details (no database access)
- You cannot process payments or refunds
- You cannot contact sellers on behalf of customers

When you can't help, politely explain and suggest they use the storefront link or contact the seller directly.

Keep responses SHORT (2-3 sentences max unless explaining a process).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat support request:", { messageCount: messages?.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Estamos recibiendo muchas consultas. Por favor intente de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error al procesar su consulta." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat support error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
