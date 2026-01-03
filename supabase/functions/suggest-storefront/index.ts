import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, existingProducts } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from existing products for pricing reference
    let productsContext = "";
    if (existingProducts && existingProducts.length > 0) {
      productsContext = `\n\nFor pricing reference, here are the seller's existing products:\n${
        existingProducts.map((p: any) => `- ${p.title}: $${p.price}`).join("\n")
      }`;
    }

    const prompt = `You are a business pricing and copywriting assistant. Help create a storefront for:

Product/Service: ${title}
${category ? `Category: ${category}` : ""}${productsContext}

Provide:
1. A suggested price range (min-max) based on typical market rates and the seller's existing pricing if available
2. A short, compelling description (2-3 sentences) that would make customers want to buy

Respond in this exact JSON format:
{
  "suggestedPriceMin": 10.00,
  "suggestedPriceMax": 25.00,
  "description": "Your compelling description here..."
}

Only respond with the JSON, no additional text.`;

    console.log("Generating storefront suggestions for:", title);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful business assistant. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate suggestions");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);
    
    // Parse the JSON response
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const suggestions = JSON.parse(cleanContent);
      
      return new Response(
        JSON.stringify({
          suggestedPriceMin: suggestions.suggestedPriceMin || 0,
          suggestedPriceMax: suggestions.suggestedPriceMax || 0,
          description: suggestions.description || ""
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a basic response if parsing fails
      return new Response(
        JSON.stringify({
          suggestedPriceMin: 0,
          suggestedPriceMax: 0,
          description: ""
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
