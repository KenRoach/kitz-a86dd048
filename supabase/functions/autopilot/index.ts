import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isRateLimited } from "../_shared/rate-limit.ts";

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isRateLimited(`autopilot:${user.id}`, 10, 60_000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, payload } = await req.json();
    console.log('Autopilot action:', action, 'for user:', user.id);

    // Get user settings
    const { data: settings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!settings?.enabled) {
      return new Response(JSON.stringify({ error: 'Autopilot is not enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any = { success: false };

    switch (action) {
      case 'analyze':
        result = await analyzeOpportunities(supabase, user.id, settings);
        break;

      case 'create_storefront':
        if (!settings.auto_create_storefronts) {
          return new Response(JSON.stringify({ error: 'Storefront creation not enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        result = await createStorefront(supabase, user.id, payload, settings);
        break;

      case 'followup_customer':
        if (!settings.auto_followup_customers) {
          return new Response(JSON.stringify({ error: 'Customer follow-up not enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        result = await followupCustomer(supabase, user.id, payload, settings);
        break;

      case 'execute_pending':
        result = await executePendingActions(supabase, user.id, settings);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Autopilot error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeOpportunities(supabase: any, userId: string, settings: any) {
  const opportunities: any[] = [];

  // Get products for storefront suggestions
  if (settings.auto_create_storefronts) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('price', settings.min_product_price)
      .order('created_at', { ascending: false })
      .limit(10);

    // Check existing storefronts today
    const today = new Date().toISOString().split('T')[0];
    const { count: todayStorefronts } = await supabase
      .from('storefronts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);

    const remainingToday = settings.max_storefronts_per_day - (todayStorefronts || 0);

    if (products && products.length > 0 && remainingToday > 0) {
      // Find products without recent storefronts
      const { data: recentStorefronts } = await supabase
        .from('storefronts')
        .select('title')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const recentTitles = new Set(recentStorefronts?.map((s: any) => s.title.toLowerCase()) || []);
      
      const suggestedProducts = products.filter((p: any) => 
        !recentTitles.has(p.title.toLowerCase())
      ).slice(0, remainingToday);

      for (const product of suggestedProducts) {
        opportunities.push({
          type: 'create_storefront',
          priority: 'medium',
          title: `Create storefront for "${product.title}"`,
          description: `This product hasn't been promoted recently. Create a shareable storefront.`,
          payload: { productId: product.id, productTitle: product.title, price: product.price }
        });
      }
    }
  }

  // Get customers for follow-up
  if (settings.auto_followup_customers) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.followup_after_days);

    const { data: inactiveCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .lt('last_interaction', cutoffDate.toISOString())
      .order('total_spent', { ascending: false })
      .limit(settings.max_followups_per_day);

    if (inactiveCustomers) {
      for (const customer of inactiveCustomers) {
        opportunities.push({
          type: 'followup_customer',
          priority: customer.total_spent > 100 ? 'high' : 'medium',
          title: `Follow up with ${customer.name}`,
          description: `Last interaction was ${Math.floor((Date.now() - new Date(customer.last_interaction).getTime()) / (1000 * 60 * 60 * 24))} days ago. Total spent: $${customer.total_spent?.toFixed(2) || 0}`,
          payload: { customerId: customer.id, customerName: customer.name, phone: customer.phone }
        });
      }
    }
  }

  return { success: true, opportunities };
}

async function createStorefront(supabase: any, userId: string, payload: any, settings: any) {
  const { productId, productTitle, price } = payload;

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('storefronts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today);

  if ((count || 0) >= settings.max_storefronts_per_day) {
    return { success: false, error: 'Daily storefront limit reached' };
  }

  // Get product details
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  // Create storefront
  const slug = `${productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  
  const { data: storefront, error } = await supabase
    .from('storefronts')
    .insert({
      user_id: userId,
      title: product.title,
      description: product.description || `Get ${product.title} now!`,
      price: product.price,
      image_url: product.image_url,
      slug,
      status: 'draft',
      is_bundle: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating storefront:', error);
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('autopilot_actions').insert({
    user_id: userId,
    action_type: 'storefront_created',
    status: 'completed',
    description: `Created storefront for "${product.title}"`,
    metadata: { productId, storefrontId: storefront.id, price: product.price },
    related_id: storefront.id,
    executed_at: new Date().toISOString()
  });

  return { success: true, storefront };
}

async function followupCustomer(supabase: any, userId: string, payload: any, settings: any) {
  const { customerId, customerName, phone } = payload;

  // Log action (actual message sending would be via WhatsApp integration)
  await supabase.from('autopilot_actions').insert({
    user_id: userId,
    action_type: 'customer_followup',
    status: 'completed',
    description: `Follow-up reminder for ${customerName}`,
    metadata: { customerId, phone },
    related_id: customerId,
    executed_at: new Date().toISOString()
  });

  // Update customer last interaction
  await supabase
    .from('customers')
    .update({ last_interaction: new Date().toISOString() })
    .eq('id', customerId);

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    type: 'customer',
    message: `AI sent follow-up to ${customerName}`,
    related_id: customerId
  });

  return { 
    success: true, 
    message: `Follow-up prepared for ${customerName}`,
    whatsappLink: phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${customerName}! We miss you at our store. Check out our latest products!`)}` : null
  };
}

async function executePendingActions(supabase: any, userId: string, settings: any) {
  const { data: queue } = await supabase
    .from('autopilot_queue')
    .select('*')
    .eq('user_id', userId)
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: true })
    .limit(5);

  const results = [];

  for (const item of queue || []) {
    let result;
    
    if (item.action_type === 'create_storefront' && settings.auto_create_storefronts) {
      result = await createStorefront(supabase, userId, item.payload, settings);
    } else if (item.action_type === 'followup_customer' && settings.auto_followup_customers) {
      result = await followupCustomer(supabase, userId, item.payload, settings);
    }

    if (result?.success) {
      await supabase.from('autopilot_queue').delete().eq('id', item.id);
    }

    results.push({ id: item.id, ...result });
  }

  return { success: true, executed: results };
}
