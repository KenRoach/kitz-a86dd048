
-- =============================================================
-- PHASE 3: JIT Privileges, Throttles, Kill Switches, Injection Detection
-- =============================================================

-- 1. Add kill_switch to agent_identities
ALTER TABLE public.agent_identities
  ADD COLUMN IF NOT EXISTS kill_switch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_action_cap integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS spend_limit_daily numeric NOT NULL DEFAULT 50;

-- 2. Agent throttle tracking (sliding window counters)
CREATE TABLE public.agent_throttles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agent_identities(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  call_count integer NOT NULL DEFAULT 1,
  daily_date date NOT NULL DEFAULT CURRENT_DATE,
  daily_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, tool_id, window_start),
  UNIQUE(agent_id, tool_id, daily_date)
);

ALTER TABLE public.agent_throttles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own throttles"
  ON public.agent_throttles FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_agent_throttles_agent_tool ON public.agent_throttles(agent_id, tool_id);
CREATE INDEX idx_agent_throttles_daily ON public.agent_throttles(agent_id, tool_id, daily_date);

-- 3. JIT tokens (short-lived, single-use authorization tokens)
CREATE TABLE public.agent_jit_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_identities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'issued', -- 'issued', 'consumed', 'revoked', 'expired'
  issued_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 seconds'),
  revoked_reason text
);

ALTER TABLE public.agent_jit_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own JIT tokens"
  ON public.agent_jit_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own JIT tokens"
  ON public.agent_jit_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own JIT tokens"
  ON public.agent_jit_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_jit_tokens_session ON public.agent_jit_tokens(session_id);
CREATE INDEX idx_jit_tokens_status ON public.agent_jit_tokens(status);

-- 4. Injection detection log
CREATE TABLE public.agent_injection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agent_identities(id),
  session_id uuid REFERENCES public.agent_sessions(id),
  input_text text NOT NULL,
  detection_type text NOT NULL, -- 'prompt_injection', 'policy_override', 'cross_tenant', 'tool_abuse'
  pattern_matched text,
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  blocked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_injection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own injection logs"
  ON public.agent_injection_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own injection logs"
  ON public.agent_injection_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all injection logs
CREATE POLICY "Admins view all injection logs"
  ON public.agent_injection_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No UPDATE or DELETE (append-only)

CREATE INDEX idx_injection_log_user ON public.agent_injection_log(user_id);
CREATE INDEX idx_injection_log_created ON public.agent_injection_log(created_at DESC);
CREATE INDEX idx_injection_log_severity ON public.agent_injection_log(severity);

-- 5. Throttle check function (security definer)
CREATE OR REPLACE FUNCTION public.check_and_increment_throttle(
  p_user_id uuid,
  p_agent_id uuid,
  p_tool_id text,
  p_max_per_minute integer DEFAULT 15,
  p_max_per_day integer DEFAULT 500,
  p_daily_cap integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_minute timestamptz := date_trunc('minute', now());
  minute_count integer;
  day_count integer;
  total_daily integer;
BEGIN
  -- Check minute-level throttle
  INSERT INTO public.agent_throttles (user_id, agent_id, tool_id, window_start, call_count, daily_date, daily_count)
  VALUES (p_user_id, p_agent_id, p_tool_id, current_minute, 1, CURRENT_DATE, 1)
  ON CONFLICT (agent_id, tool_id, window_start) DO UPDATE
    SET call_count = agent_throttles.call_count + 1, updated_at = now()
  RETURNING call_count INTO minute_count;

  IF minute_count > p_max_per_minute THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'rate_limit_minute', 'count', minute_count, 'limit', p_max_per_minute);
  END IF;

  -- Check daily tool-level throttle
  INSERT INTO public.agent_throttles (user_id, agent_id, tool_id, window_start, call_count, daily_date, daily_count)
  VALUES (p_user_id, p_agent_id, p_tool_id, current_minute, 1, CURRENT_DATE, 1)
  ON CONFLICT (agent_id, tool_id, daily_date) DO UPDATE
    SET daily_count = agent_throttles.daily_count + 1, updated_at = now()
  RETURNING daily_count INTO day_count;

  IF day_count > p_max_per_day THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'rate_limit_daily', 'count', day_count, 'limit', p_max_per_day);
  END IF;

  -- Check agent-level daily action cap
  SELECT COALESCE(SUM(daily_count), 0) INTO total_daily
  FROM public.agent_throttles
  WHERE agent_id = p_agent_id AND daily_date = CURRENT_DATE;

  IF total_daily > p_daily_cap THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_cap_exceeded', 'count', total_daily, 'limit', p_daily_cap);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'minute_count', minute_count, 'daily_count', day_count);
END;
$$;
