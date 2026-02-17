
-- Composite indexes for high-traffic "get recent by user" query patterns
-- These support the dominant access pattern: WHERE user_id = ? ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_payment ON public.orders (user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_contact ON public.orders (contact_id) WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storefronts_user_created ON public.storefronts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON public.storefronts (slug);
CREATE INDEX IF NOT EXISTS idx_storefronts_user_status ON public.storefronts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_created ON public.crm_contacts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_score ON public.crm_contacts (user_id, lead_score);

CREATE INDEX IF NOT EXISTS idx_business_events_user_ts ON public.business_events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_unprocessed ON public.business_events (user_id, processed) WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_follow_ups_user_status ON public.follow_ups (user_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_ai_actions_user_status ON public.ai_actions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_actions_user_created ON public.ai_actions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_user_active ON public.products (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_storefront_items_storefront ON public.storefront_items (storefront_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- Usage instrumentation table
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_user_created ON public.usage_events (user_id, created_at DESC);
CREATE INDEX idx_usage_events_type_created ON public.usage_events (event_type, created_at DESC);
CREATE INDEX idx_usage_events_name ON public.usage_events (event_name, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage events"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage events"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Daily aggregation table for dashboards (avoids scanning raw events)
CREATE TABLE IF NOT EXISTS public.usage_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stat_date date NOT NULL,
  ai_calls integer DEFAULT 0,
  agent_actions integer DEFAULT 0,
  orders_created integer DEFAULT 0,
  storefronts_created integer DEFAULT 0,
  contacts_added integer DEFAULT 0,
  follow_ups_completed integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, stat_date)
);

CREATE INDEX idx_usage_daily_user_date ON public.usage_daily_stats (user_id, stat_date DESC);

ALTER TABLE public.usage_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily stats"
  ON public.usage_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own daily stats"
  ON public.usage_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
  ON public.usage_daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to increment daily stats (called from edge functions)
CREATE OR REPLACE FUNCTION public.increment_daily_stat(
  p_user_id uuid,
  p_stat_name text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_daily_stats (user_id, stat_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, stat_date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.usage_daily_stats SET %I = %I + $1, updated_at = now() WHERE user_id = $2 AND stat_date = CURRENT_DATE',
    p_stat_name, p_stat_name
  )
  USING p_increment, p_user_id;
END;
$$;
