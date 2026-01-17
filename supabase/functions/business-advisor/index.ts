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

    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    const isSpanish = language === 'es';

    // Fetch user's business data for context
    console.log('Fetching business data for user:', user.id);

    const [storefrontsRes, productsRes, customersRes, profileRes, contactsRes, rolesRes] = await Promise.all([
      supabase.from('storefronts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('total_spent', { ascending: false }).limit(20),
      supabase.from('profiles').select('*').single(),
      supabase.from('consultant_contacts').select('*').order('last_interaction', { ascending: false }),
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'consultant').maybeSingle()
    ]);

    const storefronts = storefrontsRes.data || [];
    const products = productsRes.data || [];
    const customers = customersRes.data || [];
    const profile = profileRes.data;
    const contacts = contactsRes.data || [];
    const isConsultant = !!rolesRes.data;

    // Calculate business metrics
    const paidStorefronts = storefronts.filter(s => s.status === 'paid');
    const totalRevenue = paidStorefronts.reduce((sum, s) => sum + (s.price || 0), 0);
    const avgOrderValue = paidStorefronts.length > 0 ? totalRevenue / paidStorefronts.length : 0;
    const pendingStorefronts = storefronts.filter(s => s.status === 'sent');
    const pendingRevenue = pendingStorefronts.reduce((sum, s) => sum + (s.price || 0), 0);
    
    // Product analysis
    const activeProducts = products.filter(p => p.is_active);
    const avgProductPrice = activeProducts.length > 0 
      ? activeProducts.reduce((sum, p) => sum + (p.price || 0), 0) / activeProducts.length 
      : 0;
    const highestPricedProduct = activeProducts.reduce((max, p) => (p.price > (max?.price || 0) ? p : max), null as any);
    const lowestPricedProduct = activeProducts.reduce((min, p) => (p.price < (min?.price || Infinity) ? p : min), null as any);

    // Customer analysis
    const totalCustomerSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const topCustomers = customers.slice(0, 5);
    const avgCustomerValue = customers.length > 0 ? totalCustomerSpent / customers.length : 0;

    // Recent activity
    const recentOrders = paidStorefronts.slice(0, 10);
    const draftStorefronts = storefronts.filter(s => s.status === 'draft');

    // Consultant funnel analysis (if consultant)
    const funnelStats = {
      total: contacts.length,
      atraccion: contacts.filter(c => c.funnel_stage === 'atraccion').length,
      nutricion: contacts.filter(c => c.funnel_stage === 'nutricion').length,
      conversacion: contacts.filter(c => c.funnel_stage === 'conversacion').length,
      retencion: contacts.filter(c => c.funnel_stage === 'retencion').length,
    };
    const pendingPayments = contacts.filter(c => c.funnel_stage === 'conversacion' && c.payment_pending);
    const highAttentionContacts = contacts.filter(c => c.is_high_attention);

    // Build consultant context
    const consultantContext = isConsultant && contacts.length > 0 ? `

🎯 CONSULTANT FUNNEL DATA:
- Total Contacts: ${funnelStats.total}
- Atracción (Attraction): ${funnelStats.atraccion} contacts
- Nutrición (Nurturing): ${funnelStats.nutricion} contacts
- Conversación (Conversation): ${funnelStats.conversacion} contacts
- Retención (Retention): ${funnelStats.retencion} contacts

📊 FUNNEL INSIGHTS:
- Contacts with pending payments: ${pendingPayments.length}
- High-attention contacts: ${highAttentionContacts.length}
- Conversion rate from Atracción to Retención: ${funnelStats.total > 0 ? ((funnelStats.retencion / funnelStats.total) * 100).toFixed(1) : 0}%

👥 RECENT CONTACTS:
${contacts.slice(0, 5).map(c => `- ${c.name}: ${c.funnel_stage} stage ${c.source ? `(via ${c.source})` : ''} ${c.payment_pending ? '⚠️ Payment pending' : ''} ${c.is_high_attention ? '🔥 High attention' : ''}`).join('\n')}
` : '';

    const businessContext = `
BUSINESS CONTEXT FOR ${profile?.business_name || 'This Business'}:
Business Type: ${profile?.business_type || 'Not specified'}
${isConsultant ? 'Role: Consultant' : ''}

📊 REVENUE METRICS:
- Total Revenue (paid orders): $${totalRevenue.toFixed(2)}
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Pending Revenue (sent but not paid): $${pendingRevenue.toFixed(2)}
- Total Paid Orders: ${paidStorefronts.length}
- Pending Orders: ${pendingStorefronts.length}
- Draft Storefronts: ${draftStorefronts.length}

📦 PRODUCT CATALOG (${activeProducts.length} active products):
${activeProducts.slice(0, 10).map(p => `- ${p.title}: $${p.price} ${p.category ? `(${p.category})` : ''}`).join('\n')}
- Average Product Price: $${avgProductPrice.toFixed(2)}
- Highest Priced: ${highestPricedProduct?.title || 'N/A'} at $${highestPricedProduct?.price || 0}
- Lowest Priced: ${lowestPricedProduct?.title || 'N/A'} at $${lowestPricedProduct?.price || 0}

👥 TOP CUSTOMERS (${customers.length} total):
${topCustomers.map(c => `- ${c.name}: $${c.total_spent?.toFixed(2) || 0} spent, ${c.order_count || 0} orders (${c.lifecycle})`).join('\n')}
- Average Customer Lifetime Value: $${avgCustomerValue.toFixed(2)}

📋 RECENT ORDERS:
${recentOrders.slice(0, 5).map(s => `- ${s.title}: $${s.price} (${s.status}) ${s.customer_name ? `to ${s.customer_name}` : ''}`).join('\n')}
${consultantContext}
PAYMENT METHODS ENABLED:
- Cash: ${profile?.payment_cash ? 'Yes' : 'No'}
- Cards: ${profile?.payment_cards ? 'Yes' : 'No'}
- Yappy: ${profile?.payment_yappy ? 'Yes' : 'No'}
- Pluxee: ${profile?.payment_pluxee ? 'Yes' : 'No'}
`;

    const consultantInstructions = isConsultant ? (isSpanish 
      ? `

INSTRUCCIONES ESPECIALES PARA CONSULTORES:
- Tienes acceso a datos del embudo de contactos del consultor
- Ayuda a mover contactos de una etapa a otra
- Sugiere estrategias para convertir contactos en Nutrición a Conversación
- Identifica contactos de alta prioridad que necesitan atención
- Ofrece consejos sobre seguimiento y retención`
      : `

SPECIAL CONSULTANT INSTRUCTIONS:
- You have access to the consultant's contact funnel data
- Help move contacts from one stage to another
- Suggest strategies to convert Nurturing contacts to Conversation
- Identify high-priority contacts that need attention
- Offer advice on follow-up and retention`) : '';

    const systemPrompt = isSpanish 
      ? `Eres un asesor de negocios estratégico para pequeños empresarios que usan kitz.io. Tu rol es ayudarlos a AUMENTAR INGRESOS y MEJORAR MÁRGENES.

${businessContext}

TU MISIÓN:
1. Analizar sus datos de negocio para encontrar oportunidades
2. Dar consejos específicos y accionables para aumentar ventas
3. Sugerir estrategias de precios para mejorar márgenes
4. Identificar sus mejores clientes y productos
5. Ayudar a convertir pedidos pendientes en pagados
6. Sugerir estrategias de venta cruzada y paquetes
${isConsultant ? '7. Ayudar a gestionar el embudo de contactos y mover prospectos' : ''}

ESTILO DE COMUNICACIÓN:
- Sé directo y orientado a la acción
- Usa sus datos y números reales
- Prioriza sugerencias de alto impacto
- Sé alentador pero realista
- SIEMPRE responde en español
- Mantén respuestas enfocadas y concisas
- Usa emojis con moderación para dar énfasis visual

SIEMPRE:
- Referencia sus productos, clientes y números específicos
- Sugiere pasos concretos que pueden tomar HOY
- Enfócate en victorias rápidas que aumenten ingresos
- Ayúdales a entender en qué productos/clientes enfocarse${consultantInstructions}`
      : `You are a strategic business advisor for small business owners using kitz.io. Your role is to help them INCREASE REVENUE and IMPROVE MARGINS.

${businessContext}

YOUR MISSION:
1. Analyze their business data to find opportunities
2. Give specific, actionable advice to increase sales
3. Suggest pricing strategies to improve margins
4. Identify their best customers and products
5. Help convert pending orders to paid
6. Suggest upselling and bundling strategies
${isConsultant ? '7. Help manage the contact funnel and move prospects' : ''}

COMMUNICATION STYLE:
- Be direct and action-oriented
- Use their actual data and numbers
- Prioritize high-impact suggestions
- Be encouraging but realistic
- ALWAYS respond in English
- Keep responses focused and concise
- Use emojis sparingly for visual breaks

ALWAYS:
- Reference their specific products, customers, and numbers
- Suggest concrete next steps they can take TODAY
- Focus on quick wins that increase revenue
- Help them understand which products/customers to focus on${consultantInstructions}`;

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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
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
    console.error("Business advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
