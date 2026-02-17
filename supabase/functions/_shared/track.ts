import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Lightweight usage tracker for edge functions.
 * Fires insert + daily stat increment in parallel (non-blocking).
 */
export function trackUsage(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  eventName: string,
  metadata: Record<string, unknown> = {},
  dailyStat?: string
) {
  const promises: Promise<unknown>[] = [
    supabase.from("usage_events").insert({
      user_id: userId,
      event_type: eventType,
      event_name: eventName,
      metadata,
    }),
  ];

  if (dailyStat) {
    promises.push(
      supabase.rpc("increment_daily_stat", {
        p_user_id: userId,
        p_stat_name: dailyStat,
        p_increment: 1,
      })
    );
  }

  // Fire and forget – don't block the response
  Promise.allSettled(promises).catch((e) =>
    console.error("trackUsage error:", e)
  );
}
