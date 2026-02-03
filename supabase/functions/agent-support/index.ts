import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI Customer Support Agent for a small business. Your role is to:

1. **Answer customer questions** using the provided knowledge base
2. **Be helpful and professional** - use formal "usted" in Spanish
3. **Acknowledge when you don't know** - suggest contacting the business directly
4. **Keep responses concise** - 2-3 sentences max unless explaining a process

LANGUAGE: Detect and respond in the customer's language (Spanish or English). Default to Spanish.

When given knowledge base context, prioritize that information. If no relevant FAQ exists, provide a helpful general response.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, conversationHistory = [] } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant knowledge base entries
    const { data: knowledgeBase } = await supabase
      .from("knowledge_base")
      .select("question, answer, category")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(20);

    // Build context from knowledge base
    let kbContext = "";
    if (knowledgeBase && knowledgeBase.length > 0) {
      kbContext = "\n\nKNOWLEDGE BASE:\n" + knowledgeBase
        .map(kb => `Q: ${kb.question}\nA: ${kb.answer}`)
        .join("\n\n");
    }

    console.log("Support Agent request:", { 
      userId, 
      messagePreview: message?.substring(0, 50),
      kbEntries: knowledgeBase?.length || 0
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + kbContext },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to process request." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
