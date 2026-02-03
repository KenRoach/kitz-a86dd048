import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  type: "new_signup" | "revenue_milestone" | "inactive_users" | "daily_summary";
  data?: Record<string, any>;
}

const ADMIN_EMAIL = "admin@kitz.app"; // Will be fetched from admin profiles

function requireInternalSecret(req: Request): Response | null {
  const expected = Deno.env.get("ALERTS_INTERNAL_SECRET");
  if (!expected) {
    return new Response(
      JSON.stringify({ success: false, error: "Service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
  const provided = req.headers.get("x-internal-secret");
  if (!provided || provided !== expected) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
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

    // Get admin emails
    const { data: adminRoles } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ success: false, error: "No admin users found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin user emails from auth
    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabaseClient.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ success: false, error: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, data }: AlertRequest = await req.json();
    console.log(`Processing alert type: ${type}`, data);

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "new_signup": {
        const { businessName, email, businessType } = data || {};
        subject = `🎉 New Signup: ${businessName || 'New User'}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New User Signed Up!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">${businessName || 'New Business'}</h2>
                <p style="color: #64748b; margin: 5px 0;"><strong>Email:</strong> ${email || 'N/A'}</p>
                <p style="color: #64748b; margin: 5px 0;"><strong>Type:</strong> ${businessType || 'Not specified'}</p>
                <p style="color: #64748b; margin: 5px 0;"><strong>Joined:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">This is an automated notification from Kitz.</p>
            </div>
          </div>
        `;
        break;
      }

      case "revenue_milestone": {
        const { milestone, totalRevenue, period } = data || {};
        subject = `💰 Revenue Milestone: $${milestone} reached!`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 Revenue Milestone Reached!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Platform Revenue</p>
                <h2 style="color: #10b981; margin: 0; font-size: 48px;">$${totalRevenue?.toLocaleString() || milestone}</h2>
                <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">${period || 'All time'}</p>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Congratulations! Your platform has reached a new revenue milestone.</p>
            </div>
          </div>
        `;
        break;
      }

      case "inactive_users": {
        const { users, inactiveDays } = data || {};
        const userList = users || [];
        subject = `⚠️ ${userList.length} users inactive for ${inactiveDays || 7}+ days`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Inactive Users Alert</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #1e293b; margin: 0 0 20px 0;">${userList.length} users have been inactive for ${inactiveDays || 7}+ days:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                ${userList.slice(0, 10).map((user: any) => `
                  <div style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #1e293b;">${user.business_name}</strong>
                    <span style="color: #64748b; font-size: 12px; margin-left: 10px;">Last active: ${user.last_active || 'Unknown'}</span>
                  </div>
                `).join('')}
                ${userList.length > 10 ? `<p style="color: #64748b; margin: 15px 0 0 0;">...and ${userList.length - 10} more</p>` : ''}
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Consider reaching out to re-engage these users.</p>
            </div>
          </div>
        `;
        break;
      }

      case "daily_summary": {
        const { newUsers, totalOrders, revenue, activeUsers } = data || {};
        subject = `📊 Daily Summary: ${newUsers || 0} new users, $${revenue || 0} revenue`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📊 Daily Platform Summary</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">New Users</p>
                  <h3 style="color: #10b981; margin: 0; font-size: 28px;">${newUsers || 0}</h3>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Revenue</p>
                  <h3 style="color: #6366f1; margin: 0; font-size: 28px;">$${revenue?.toLocaleString() || 0}</h3>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Orders</p>
                  <h3 style="color: #f59e0b; margin: 0; font-size: 28px;">${totalOrders || 0}</h3>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Active Users</p>
                  <h3 style="color: #8b5cf6; margin: 0; font-size: 28px;">${activeUsers || 0}</h3>
                </div>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">This is your daily automated summary from Kitz.</p>
            </div>
          </div>
        `;
        break;
      }

      default:
        throw new Error(`Unknown alert type: ${type}`);
    }

    // Send email to all admins
    const results = await Promise.all(
      adminEmails.map(email =>
        resend.emails.send({
          from: "Kitz Alerts <onboarding@resend.dev>",
          to: [email],
          subject,
          html: htmlContent,
        })
      )
    );

    console.log("Emails sent:", results);

    // Log the activity
    const adminUserId = adminRoles[0].user_id;
    await supabaseClient.from("activity_log").insert({
      user_id: adminUserId,
      type: "admin_alert",
      message: `Admin alert sent: ${type}`,
      related_id: null,
    });

    return new Response(
      JSON.stringify({ success: true, sent: adminEmails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in admin-alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

