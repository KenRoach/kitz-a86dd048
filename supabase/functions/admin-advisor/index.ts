import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // User client for auth check
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Service client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { messages, action, payload, language = 'en' } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle admin actions with validated inputs
    if (action) {
      if (typeof action !== "string") {
        return new Response(JSON.stringify({ error: "Invalid action type" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await handleAdminAction(adminClient, action, payload || {});
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSpanish = language === 'es';

    // Fetch comprehensive platform data for AI context
    console.log('Fetching platform data for admin:', user.id);

    const [
      profilesRes,
      storefrontsRes,
      productsRes,
      customersRes,
      activityRes,
      rolesRes,
      contactsRes
    ] = await Promise.all([
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
      adminClient.from('storefronts').select('*').order('created_at', { ascending: false }).limit(200),
      adminClient.from('products').select('*').order('created_at', { ascending: false }).limit(200),
      adminClient.from('customers').select('*').order('total_spent', { ascending: false }).limit(100),
      adminClient.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100),
      adminClient.from('user_roles').select('*'),
      adminClient.from('consultant_contacts').select('*').limit(100)
    ]);

    const profiles = profilesRes.data || [];
    const storefronts = storefrontsRes.data || [];
    const products = productsRes.data || [];
    const customers = customersRes.data || [];
    const activities = activityRes.data || [];
    const allRoles = rolesRes.data || [];
    const contacts = contactsRes.data || [];

    // Calculate platform metrics
    const paidStorefronts = storefronts.filter(s => s.status === 'paid');
    const totalPlatformRevenue = paidStorefronts.reduce((sum, s) => sum + (s.price || 0), 0);
    const pendingStorefronts = storefronts.filter(s => s.status === 'sent');
    const pendingRevenue = pendingStorefronts.reduce((sum, s) => sum + (s.price || 0), 0);
    const draftStorefronts = storefronts.filter(s => s.status === 'draft');

    // User breakdown
    const adminUsers = allRoles.filter(r => r.role === 'admin').length;
    const consultantUsers = allRoles.filter(r => r.role === 'consultant').length;
    const barbershopUsers = allRoles.filter(r => r.role === 'barbershop').length;

    // Top users by revenue
    const userRevenueMap: Record<string, number> = {};
    paidStorefronts.forEach(s => {
      userRevenueMap[s.user_id] = (userRevenueMap[s.user_id] || 0) + (s.price || 0);
    });
    const topUsersByRevenue = Object.entries(userRevenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, revenue]) => {
        const profile = profiles.find(p => p.user_id === userId);
        return { name: profile?.business_name || 'Unknown', revenue };
      });

    // Business type breakdown
    const businessTypes: Record<string, number> = {};
    profiles.forEach(p => {
      const type = p.business_type || 'Other';
      businessTypes[type] = (businessTypes[type] || 0) + 1;
    });

    // Country breakdown
    const countries: Record<string, number> = {};
    profiles.forEach(p => {
      const country = p.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
    });

    // Recent signups
    const recentSignups = profiles.slice(0, 10).map(p => ({
      name: p.business_name,
      type: p.business_type,
      date: p.created_at,
      city: p.city,
      country: p.country
    }));

    // Recent activity summary
    const recentActivitySummary = activities.slice(0, 20).map(a => ({
      type: a.type,
      message: a.message,
      date: a.created_at
    }));

    const platformContext = `
KITZ PLATFORM ADMIN DASHBOARD
==============================

📊 PLATFORM OVERVIEW:
- Total Users: ${profiles.length}
- Total Storefronts: ${storefronts.length}
- Total Products: ${products.length}
- Total Customers (across all users): ${customers.length}
- Total Consultant Contacts: ${contacts.length}

💰 REVENUE METRICS:
- Total Platform Revenue: $${totalPlatformRevenue.toFixed(2)}
- Total Paid Orders: ${paidStorefronts.length}
- Pending Revenue: $${pendingRevenue.toFixed(2)} (${pendingStorefronts.length} orders)
- Draft Storefronts: ${draftStorefronts.length}

👥 USER ROLES:
- Admins: ${adminUsers}
- Consultants: ${consultantUsers}
- Barbershops: ${barbershopUsers}
- Regular Users: ${profiles.length - consultantUsers - barbershopUsers}

🏆 TOP USERS BY REVENUE:
${topUsersByRevenue.map((u, i) => `${i + 1}. ${u.name}: $${u.revenue.toFixed(2)}`).join('\n')}

🏢 BUSINESS TYPES:
${Object.entries(businessTypes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => `- ${type}: ${count} users`).join('\n')}

🌍 COUNTRIES:
${Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => `- ${country}: ${count} users`).join('\n')}

🆕 RECENT SIGNUPS:
${recentSignups.map(s => `- ${s.name} (${s.type || 'N/A'}) from ${s.city || s.country || 'Unknown'}`).join('\n')}

📋 RECENT ACTIVITY:
${recentActivitySummary.map(a => `- [${a.type}] ${a.message}`).join('\n')}

AVAILABLE ADMIN ACTIONS:
You can help the admin perform these actions by responding with the appropriate command format:
1. GRANT_ROLE: Grant a role to a user - format: [ACTION:GRANT_ROLE:user_email:role_name]
2. REVOKE_ROLE: Remove a role from a user - format: [ACTION:REVOKE_ROLE:user_email:role_name]
3. MARK_PAID: Mark a storefront as paid - format: [ACTION:MARK_PAID:storefront_id]
4. VIEW_USER: Get detailed info about a user - format: [ACTION:VIEW_USER:user_email]
5. ANALYTICS: Provide insights and recommendations

When the admin asks to perform an action, include the action format in your response so the system can execute it.
`;

    const systemPrompt = isSpanish 
      ? `Eres el asistente de control de la plataforma Kitz. Tienes acceso COMPLETO a todos los datos de la plataforma y puedes ayudar al administrador a:

${platformContext}

TU ROL:
1. Monitorear la salud de la plataforma
2. Identificar oportunidades de crecimiento
3. Ayudar a gestionar usuarios y roles
4. Analizar tendencias de ingresos
5. Ejecutar acciones administrativas cuando se solicite
6. Proporcionar insights accionables

ESTILO:
- Sé profesional y directo
- Usa datos específicos de la plataforma
- Sugiere acciones concretas
- Responde siempre en español
- Cuando el admin pida una acción, incluye el formato de comando apropiado`
      : `You are the Kitz platform control assistant. You have FULL ACCESS to all platform data and can help the admin:

${platformContext}

YOUR ROLE:
1. Monitor platform health
2. Identify growth opportunities
3. Help manage users and roles
4. Analyze revenue trends
5. Execute administrative actions when requested
6. Provide actionable insights

STYLE:
- Be professional and direct
- Use specific platform data
- Suggest concrete actions
- Always respond in English
- When the admin requests an action, include the appropriate command format`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Admin advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const ALLOWED_ACTIONS = new Set(["GRANT_ROLE", "REVOKE_ROLE", "MARK_PAID", "GET_USER_DETAILS"]);
const ALLOWED_ROLES = new Set(["admin", "moderator", "user", "consultant", "barbershop"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handleAdminAction(adminClient: any, action: string, payload: any) {
  // Whitelist actions
  if (!ALLOWED_ACTIONS.has(action)) {
    return { error: `Unknown action: ${action}. Allowed: ${[...ALLOWED_ACTIONS].join(", ")}` };
  }

  switch (action) {
    case 'GRANT_ROLE': {
      const { userId, role } = payload || {};
      if (!userId || !UUID_REGEX.test(userId)) {
        return { error: "Invalid or missing userId (must be UUID)" };
      }
      if (!role || !ALLOWED_ROLES.has(role)) {
        return { error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(", ")}` };
      }
      // Verify user exists
      const { data: targetUser } = await adminClient.auth.admin.getUserById(userId);
      if (!targetUser?.user) {
        return { error: "Target user not found" };
      }
      const { error } = await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select();
      if (error) throw error;

      // Audit log
      await adminClient.from("activity_log").insert({
        user_id: userId,
        type: "admin_action",
        message: `Role "${role}" granted by admin`,
      });
      return { success: true, message: `Role ${role} granted successfully` };
    }
    
    case 'REVOKE_ROLE': {
      const { userId, role } = payload || {};
      if (!userId || !UUID_REGEX.test(userId)) {
        return { error: "Invalid or missing userId (must be UUID)" };
      }
      if (!role || !ALLOWED_ROLES.has(role)) {
        return { error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(", ")}` };
      }
      const { error } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;

      await adminClient.from("activity_log").insert({
        user_id: userId,
        type: "admin_action",
        message: `Role "${role}" revoked by admin`,
      });
      return { success: true, message: `Role ${role} revoked successfully` };
    }
    
    case 'MARK_PAID': {
      const { storefrontId } = payload || {};
      if (!storefrontId || !UUID_REGEX.test(storefrontId)) {
        return { error: "Invalid or missing storefrontId (must be UUID)" };
      }
      // Verify storefront exists
      const { data: sf } = await adminClient
        .from('storefronts')
        .select('id, user_id, title')
        .eq('id', storefrontId)
        .maybeSingle();
      if (!sf) {
        return { error: "Storefront not found" };
      }
      const { error } = await adminClient
        .from('storefronts')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', storefrontId);
      if (error) throw error;

      await adminClient.from("activity_log").insert({
        user_id: sf.user_id,
        type: "admin_action",
        message: `Storefront "${sf.title}" marked as paid by admin`,
        related_id: storefrontId,
      });
      return { success: true, message: 'Storefront marked as paid' };
    }
    
    case 'GET_USER_DETAILS': {
      const { userId } = payload || {};
      if (!userId || !UUID_REGEX.test(userId)) {
        return { error: "Invalid or missing userId (must be UUID)" };
      }
      const [profileRes, storefrontsRes, rolesRes] = await Promise.all([
        adminClient.from('profiles').select('*').eq('user_id', userId).single(),
        adminClient.from('storefronts').select('*').eq('user_id', userId),
        adminClient.from('user_roles').select('role').eq('user_id', userId)
      ]);
      
      return {
        profile: profileRes.data,
        storefronts: storefrontsRes.data,
        roles: rolesRes.data?.map((r: any) => r.role) || []
      };
    }
    
    default:
      return { error: 'Unknown action' };
  }
}
