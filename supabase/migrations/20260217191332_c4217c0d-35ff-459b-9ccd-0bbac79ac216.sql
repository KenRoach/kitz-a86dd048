
-- Agent Secrets Vault: encrypted key-value store scoped per agent
CREATE TABLE public.agent_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agent_identities(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  encrypted_value text NOT NULL,
  last_rotated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, key_name)
);

ALTER TABLE public.agent_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agent secrets" ON public.agent_secrets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agent secrets" ON public.agent_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own agent secrets" ON public.agent_secrets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own agent secrets" ON public.agent_secrets
  FOR DELETE USING (auth.uid() = user_id);

-- Breach incidents table for tracking automatic containment actions
CREATE TABLE public.agent_breach_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agent_identities(id) ON DELETE CASCADE,
  trigger_type text NOT NULL, -- 'injection_spike', 'throttle_burst', 'anomaly_score'
  trigger_detail jsonb NOT NULL DEFAULT '{}',
  containment_action text NOT NULL, -- 'kill_switch', 'revoke_secrets', 'suspend_agent'
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_breach_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own breach incidents" ON public.agent_breach_incidents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own breach incidents" ON public.agent_breach_incidents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own breach incidents" ON public.agent_breach_incidents
  FOR UPDATE USING (auth.uid() = user_id);

-- Breach containment function: auto-activates kill switch and logs incident
CREATE OR REPLACE FUNCTION public.trigger_breach_containment(
  p_user_id uuid,
  p_agent_id uuid,
  p_trigger_type text,
  p_trigger_detail jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  incident_id uuid;
BEGIN
  -- Activate kill switch immediately
  UPDATE public.agent_identities
  SET kill_switch = true, updated_at = now()
  WHERE id = p_agent_id AND user_id = p_user_id;

  -- Revoke all active JIT tokens for this agent
  UPDATE public.agent_jit_tokens
  SET status = 'revoked', revoked_reason = 'breach_containment:' || p_trigger_type, consumed_at = now()
  WHERE agent_id = p_agent_id AND status = 'issued';

  -- Terminate all active sessions
  UPDATE public.agent_sessions
  SET status = 'terminated', completed_at = now(), error_message = 'breach_containment'
  WHERE agent_id = p_agent_id AND status = 'active';

  -- Log incident
  INSERT INTO public.agent_breach_incidents (user_id, agent_id, trigger_type, trigger_detail, containment_action)
  VALUES (p_user_id, p_agent_id, p_trigger_type, p_trigger_detail, 'kill_switch')
  RETURNING id INTO incident_id;

  RETURN incident_id;
END;
$$;
