import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Revenue milestones to track
const REVENUE_MILESTONES = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000];
const INACTIVE_DAYS = 7;

function requireInternalSecret(req: Request): Response | null {
  const expected = Deno.env.get("ALERTS_INTERNAL_SECRET");
  if (!expected) {
    return new Response(
      JSON.stringify({ error: "Service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const provided = req.headers.get("x-internal-secret");
  if (!provided || provided !== expected) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secretResp = requireInternalSecret(req);
  if (secretResp) return secretResp;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const internalSecret = Deno.env.get("ALERTS_INTERNAL_SECRET") ?? "";

    const alerts: Array<{ type: string; data: any }> = [];

    // Check for revenue milestones
    const { data: paidStorefronts } = await supabaseClient
      .from("storefronts")
      .select("price")
      .not("paid_at", "is", null);

    const totalRevenue = paidStorefronts?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;

    // Get last tracked milestone from activity log
    const { data: lastMilestoneLog } = await supabaseClient
      .from("activity_log")
      .select("message")
      .eq("type", "revenue_milestone")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastMilestone = lastMilestoneLog?.[0]?.message
      ? parseInt(lastMilestoneLog[0].message.match(/\$(\d+)/)?.[1] || "0")
      : 0;

    // Find new milestones reached
    for (const milestone of REVENUE_MILESTONES) {
      if (totalRevenue >= milestone && milestone > lastMilestone) {
        alerts.push({
          type: "revenue_milestone",
          data: { milestone, totalRevenue, period: "All time" },
        });

        // Log milestone reached
        const { data: adminRole } = await supabaseClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1)
          .single();

        if (adminRole) {
          await supabaseClient.from("activity_log").insert({
            user_id: adminRole.user_id,
            type: "revenue_milestone",
            message: `Revenue milestone reached: $${milestone}`,
          });
        }
        break; // Only alert for the highest new milestone
      }
    }

    // Check for inactive users
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - INACTIVE_DAYS);

    const { data: inactiveStats } = await supabaseClient
      .from("user_stats")
      .select("user_id, last_active_date")
      .or(`last_active_date.lt.${inactiveDate.toISOString()},last_active_date.is.null`);

    if (inactiveStats && inactiveStats.length > 0) {
      // Get profile info for inactive users
      const userIds = inactiveStats.map((s) => s.user_id);
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("user_id, business_name")
        .in("user_id", userIds);

      const inactiveUsers = profiles?.map((p) => ({
        business_name: p.business_name,
        last_active: inactiveStats.find((s) => s.user_id === p.user_id)?.last_active_date,
      }));

      // Only send weekly inactive user alerts (check if it's Monday)
      const today = new Date();
      if (today.getDay() === 1 && inactiveUsers && inactiveUsers.length > 0) {
        alerts.push({
          type: "inactive_users",
          data: { users: inactiveUsers, inactiveDays: INACTIVE_DAYS },
        });
      }
    }

    // Generate daily summary
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: newProfiles } = await supabaseClient
      .from("profiles")
      .select("id")
      .gte("created_at", yesterdayStr);

    const { data: yesterdayOrders } = await supabaseClient
      .from("storefronts")
      .select("price")
      .gte("ordered_at", yesterdayStr);

    const { data: activeStats } = await supabaseClient
      .from("user_stats")
      .select("user_id")
      .gte("last_active_date", yesterdayStr);

    const dailyRevenue = yesterdayOrders?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;

    // Check if daily summary was already sent today
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: existingSummary } = await supabaseClient
      .from("activity_log")
      .select("id")
      .eq("type", "daily_summary")
      .gte("created_at", todayStr)
      .limit(1);

    if (!existingSummary || existingSummary.length === 0) {
      alerts.push({
        type: "daily_summary",
        data: {
          newUsers: newProfiles?.length || 0,
          totalOrders: yesterdayOrders?.length || 0,
          revenue: dailyRevenue,
          activeUsers: activeStats?.length || 0,
        },
      });

      // Log daily summary sent
      const { data: adminRole } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminRole) {
        await supabaseClient.from("activity_log").insert({
          user_id: adminRole.user_id,
          type: "daily_summary",
          message: `Daily summary sent`,
        });
      }
    }

    // Send all alerts
    for (const alert of alerts) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/admin-alerts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret,
          },
          body: JSON.stringify(alert),
        });
        console.log(`Alert sent: ${alert.type}`);
      } catch (err) {
        console.error(`Failed to send alert: ${alert.type}`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alertsSent: alerts.length, alerts: alerts.map((a) => a.type) }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

