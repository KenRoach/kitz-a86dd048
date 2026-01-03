-- Autopilot settings table
CREATE TABLE public.autopilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Storefront creation settings
  auto_create_storefronts BOOLEAN NOT NULL DEFAULT false,
  max_storefronts_per_day INTEGER NOT NULL DEFAULT 3,
  min_product_price NUMERIC NOT NULL DEFAULT 5,
  
  -- Customer follow-up settings  
  auto_followup_customers BOOLEAN NOT NULL DEFAULT false,
  followup_after_days INTEGER NOT NULL DEFAULT 7,
  max_followups_per_day INTEGER NOT NULL DEFAULT 5,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Autopilot action log
CREATE TABLE public.autopilot_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'storefront_created', 'customer_followup', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

-- Autopilot queue for pending actions
CREATE TABLE public.autopilot_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.autopilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_queue ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view own autopilot settings"
ON public.autopilot_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot settings"
ON public.autopilot_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot settings"
ON public.autopilot_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Actions policies
CREATE POLICY "Users can view own autopilot actions"
ON public.autopilot_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot actions"
ON public.autopilot_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot actions"
ON public.autopilot_actions FOR UPDATE
USING (auth.uid() = user_id);

-- Queue policies
CREATE POLICY "Users can view own autopilot queue"
ON public.autopilot_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own autopilot queue"
ON public.autopilot_queue FOR ALL
USING (auth.uid() = user_id);