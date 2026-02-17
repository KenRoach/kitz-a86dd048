import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Backend guard: checks and consumes AI credits before executing an AI action.
 * Returns { allowed: true, newBalance } or { allowed: false }.
 * Must be called BEFORE the AI gateway call.
 */
export async function requireAICredits(
  supabase: SupabaseClient,
  userId: string,
  amount = 1
): Promise<{ allowed: boolean; newBalance?: number }> {
  const { data, error } = await supabase.rpc("consume_ai_credit", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("Credit check error:", error);
    return { allowed: false };
  }

  if (data === -1) {
    return { allowed: false };
  }

  return { allowed: true, newBalance: data as number };
}

/**
 * Standard JSON response for insufficient credits.
 */
export function insufficientCreditsResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: "Insufficient AI credits. Please recharge.",
      code: "INSUFFICIENT_CREDITS",
    }),
    {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
