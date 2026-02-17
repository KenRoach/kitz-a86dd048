
-- =============================================================
-- PHASE 2: Agent Identity Registry & Security Foundation
-- =============================================================

-- 1. Agent Identity Registry
CREATE TABLE public.agent_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_type text NOT NULL, -- 'sales', 'operations', 'support', 'advisor'
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'executor', -- 'executor', 'orchestrator', 'readonly'
  max_privilege text NOT NULL DEFAULT 'standard', -- 'standard', 'elevated', 'admin'
  allowed_tools text[] NOT NULL DEFAULT '{}',
  allowed_tables text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  revoked_reason text,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent identities"
  ON public.agent_identities FOR ALL
  USING (auth.uid() = user_id);

-- 2. Agent Sessions (short-lived, per-invocation)
CREATE TABLE public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_identities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  credits_reserved integer NOT NULL DEFAULT 0,
  credits_consumed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'revoked', 'expired'
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  ip_address text,
  error_message text
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agent sessions"
  ON public.agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agent sessions"
  ON public.agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own agent sessions"
  ON public.agent_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Tool Registry (whitelisted tools)
CREATE TABLE public.tool_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  risk_level text NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  required_role text NOT NULL DEFAULT 'executor',
  required_privilege text NOT NULL DEFAULT 'standard',
  requires_approval boolean NOT NULL DEFAULT false,
  max_calls_per_minute integer NOT NULL DEFAULT 15,
  max_calls_per_day integer NOT NULL DEFAULT 500,
  allowed_agent_types text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  version text NOT NULL DEFAULT '1.0.0',
  signature_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_registry ENABLE ROW LEVEL SECURITY;

-- Tool registry is readable by all authenticated users
CREATE POLICY "Authenticated users can view tool registry"
  ON public.tool_registry FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage tool registry
CREATE POLICY "Admins manage tool registry"
  ON public.tool_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Agent Audit Log (append-only)
CREATE TABLE public.agent_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agent_identities(id),
  session_id uuid REFERENCES public.agent_sessions(id),
  event_type text NOT NULL, -- 'tool_call', 'auth', 'policy_violation', 'credit_deduct', 'session_start', 'session_end', 'throttle', 'revocation'
  tool_id text,
  action text NOT NULL,
  outcome text NOT NULL DEFAULT 'success', -- 'success', 'denied', 'throttled', 'error'
  policy_decision jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  credits_cost integer DEFAULT 0,
  risk_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit logs"
  ON public.agent_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own audit logs"
  ON public.agent_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins view all audit logs"
  ON public.agent_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No UPDATE or DELETE on audit log (append-only enforcement)

-- 5. Create indexes for performance
CREATE INDEX idx_agent_identities_user_id ON public.agent_identities(user_id);
CREATE INDEX idx_agent_identities_type ON public.agent_identities(agent_type);
CREATE INDEX idx_agent_sessions_agent_id ON public.agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_user_id ON public.agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_status ON public.agent_sessions(status);
CREATE INDEX idx_agent_audit_log_user_id ON public.agent_audit_log(user_id);
CREATE INDEX idx_agent_audit_log_agent_id ON public.agent_audit_log(agent_id);
CREATE INDEX idx_agent_audit_log_event_type ON public.agent_audit_log(event_type);
CREATE INDEX idx_agent_audit_log_created_at ON public.agent_audit_log(created_at DESC);

-- 6. Seed tool registry with known tools
INSERT INTO public.tool_registry (tool_id, display_name, description, risk_level, allowed_agent_types, max_calls_per_minute, max_calls_per_day) VALUES
  ('score_leads', 'Lead Scoring', 'Analyze and score CRM leads', 'low', ARRAY['sales'], 15, 500),
  ('analyze_customer', 'Customer Analysis', 'Deep analysis of individual customer', 'low', ARRAY['sales'], 15, 500),
  ('suggest_followups', 'Follow-up Suggestions', 'Generate follow-up recommendations', 'low', ARRAY['sales'], 15, 500),
  ('check_inventory', 'Inventory Check', 'Monitor product stock levels', 'low', ARRAY['operations'], 15, 500),
  ('check_orders', 'Order Report', 'Monitor fulfillment status', 'low', ARRAY['operations'], 15, 500),
  ('generate_tasks', 'Task Generation', 'Create prioritized task list', 'low', ARRAY['operations'], 15, 500),
  ('check_expiring', 'Expiring Report', 'Report on expiring storefronts', 'low', ARRAY['operations'], 15, 500),
  ('business_advisor', 'Business Advisor', 'AI business advice and analysis', 'medium', ARRAY['advisor'], 10, 200),
  ('chat_support', 'Chat Support', 'Customer support chat', 'low', ARRAY['support'], 20, 1000),
  ('generate_image', 'Image Generation', 'Generate marketing images', 'medium', ARRAY['advisor'], 5, 50),
  ('send_bulk_email', 'Bulk Email', 'Send emails to multiple contacts', 'high', ARRAY['sales'], 3, 20),
  ('instagram_ideas', 'Instagram Ideas', 'Generate content ideas', 'low', ARRAY['advisor'], 10, 100);

-- 7. Validate agent identity function (security definer)
CREATE OR REPLACE FUNCTION public.validate_agent_identity(
  p_user_id uuid,
  p_agent_type text,
  p_tool_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_record record;
  tool_record record;
  result jsonb;
BEGIN
  -- Find active agent identity
  SELECT * INTO agent_record
  FROM public.agent_identities
  WHERE user_id = p_user_id
    AND agent_type = p_agent_type
    AND is_active = true
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'no_active_agent');
  END IF;

  -- If tool_id provided, validate tool access
  IF p_tool_id IS NOT NULL THEN
    SELECT * INTO tool_record
    FROM public.tool_registry
    WHERE tool_id = p_tool_id
      AND is_active = true;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'tool_not_registered', 'agent_id', agent_record.id);
    END IF;

    -- Check agent type is allowed for this tool
    IF NOT (p_agent_type = ANY(tool_record.allowed_agent_types)) THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'tool_not_allowed_for_agent_type', 'agent_id', agent_record.id);
    END IF;

    -- Check tool is in agent's allowed list (if restricted)
    IF array_length(agent_record.allowed_tools, 1) > 0 AND NOT (p_tool_id = ANY(agent_record.allowed_tools)) THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'tool_not_in_agent_allowlist', 'agent_id', agent_record.id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'agent_id', agent_record.id,
    'role', agent_record.role,
    'max_privilege', agent_record.max_privilege,
    'allowed_tools', agent_record.allowed_tools
  );
END;
$$;

-- 8. Auto-provision agent identities for existing users
CREATE OR REPLACE FUNCTION public.provision_default_agents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_identities (user_id, agent_type, display_name, role, allowed_tools) VALUES
    (NEW.user_id, 'sales', 'Sales Agent', 'executor', ARRAY['score_leads', 'analyze_customer', 'suggest_followups']),
    (NEW.user_id, 'operations', 'Operations Agent', 'executor', ARRAY['check_inventory', 'check_orders', 'generate_tasks', 'check_expiring']),
    (NEW.user_id, 'support', 'Support Agent', 'executor', ARRAY['chat_support']),
    (NEW.user_id, 'advisor', 'Business Advisor', 'executor', ARRAY['business_advisor', 'generate_image', 'instagram_ideas'])
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER provision_agents_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_default_agents();
