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
    const { businessType, businessName, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const systemPrompt = `You are a social media content strategist for small businesses and freelancers. 
Generate 5 Instagram post ideas that are simple, authentic, and easy to create with just a phone.
Focus on everyday moments, behind-the-scenes, and relatable content - NOT professional photoshoots.

Today is ${dayOfWeek}, ${monthDay}. Consider seasonal themes and day-specific content (e.g., Monday motivation, Friday vibes).

For each idea, provide:
1. A catchy title (2-4 words)
2. A brief description of what to post (1-2 sentences)
3. 3-5 relevant hashtags
4. The best time to post (morning/afternoon/evening)
5. Content type (photo, video, carousel, reel, story)`;

    const userPrompt = `Business: ${businessName || 'My Business'}
Type: ${businessType || 'General'}
Mood/Theme: ${mood || 'everyday business content'}

Generate 5 simple, authentic Instagram post ideas I can create today.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_post_ideas",
              description: "Generate Instagram post ideas for a business",
              parameters: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Catchy 2-4 word title" },
                        description: { type: "string", description: "What to post in 1-2 sentences" },
                        hashtags: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "3-5 relevant hashtags without the # symbol"
                        },
                        bestTime: { 
                          type: "string", 
                          enum: ["morning", "afternoon", "evening"],
                          description: "Best time to post"
                        },
                        contentType: { 
                          type: "string", 
                          enum: ["photo", "video", "carousel", "reel", "story"],
                          description: "Type of content"
                        }
                      },
                      required: ["title", "description", "hashtags", "bestTime", "contentType"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["ideas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_post_ideas" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Please add credits to continue using AI features." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call response");
    }

    const ideas = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate ideas";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
