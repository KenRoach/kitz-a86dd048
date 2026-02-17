import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAICredits, insufficientCreditsResponse } from "./credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface AgentGatewayContext {
  supabase: SupabaseClient;
  userId: string;
  agentId: string;
  sessionId: string;
  jitTokenId: string;
  agentType: string;
  action: string;
}

export interface GatewayResult {
  allowed: boolean;
  context?: AgentGatewayContext;
  response?: Response;
}

// ─── Prompt Injection Detection ───────────────────────────────────────
const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i, type: "prompt_injection", severity: "critical" },
  { pattern: /you\s+are\s+now\s+(a|an|the)\s+/i, type: "prompt_injection", severity: "high" },
  { pattern: /disregard\s+(your|all|the)\s+(instructions|rules|guidelines)/i, type: "prompt_injection", severity: "critical" },
  { pattern: /forget\s+(everything|all|your)\s+(you|instructions|rules)/i, type: "prompt_injection", severity: "critical" },
  { pattern: /system\s*:\s*/i, type: "prompt_injection", severity: "high" },
  { pattern: /\[\s*SYSTEM\s*\]/i, type: "prompt_injection", severity: "high" },
  { pattern: /override\s+(security|policy|permissions|access)/i, type: "policy_override", severity: "critical" },
  { pattern: /grant\s+(me|yourself|admin)\s+(access|permissions|privileges)/i, type: "policy_override", severity: "critical" },
  { pattern: /execute\s+(sql|query|command|script)/i, type: "tool_abuse", severity: "high" },
  { pattern: /DROP\s+TABLE/i, type: "tool_abuse", severity: "critical" },
  { pattern: /DELETE\s+FROM\s+/i, type: "tool_abuse", severity: "high" },
  { pattern: /access\s+(other|another|different)\s+(user|tenant|account)/i, type: "cross_tenant", severity: "critical" },
  { pattern: /switch\s+(to|user|tenant|account)/i, type: "cross_tenant", severity: "medium" },
  { pattern: /act\s+as\s+(admin|root|superuser)/i, type: "policy_override", severity: "critical" },
  { pattern: /pretend\s+(you|to\s+be)/i, type: "prompt_injection", severity: "medium" },
];

interface InjectionResult {
  detected: boolean;
  type?: string;
  severity?: string;
  pattern?: string;
}

function detectInjection(input: string): InjectionResult {
  if (!input || input.length < 5) return { detected: false };
  
  for (const rule of INJECTION_PATTERNS) {
    const match = input.match(rule.pattern);
    if (match) {
      return {
        detected: true,
        type: rule.type,
        severity: rule.severity,
        pattern: match[0],
      };
    }
  }
  return { detected: false };
}

// ─── Agent Gateway ────────────────────────────────────────────────────
export async function agentGateway(
  supabase: SupabaseClient,
  userId: string,
  agentType: string,
  action: string,
  options: { creditCost?: number; userInput?: string } = {}
): Promise<GatewayResult> {
  const { creditCost = 1, userInput } = options;

  // 0. Prompt injection scan
  if (userInput) {
    const injection = detectInjection(userInput);
    if (injection.detected) {
      // Log injection attempt
      try {
        await supabase.from("agent_injection_log").insert({
          user_id: userId,
          input_text: userInput.substring(0, 500),
          detection_type: injection.type!,
          pattern_matched: injection.pattern!,
          severity: injection.severity!,
          blocked: true,
        });
      } catch (e) { console.error("Injection log failed:", e); }

      await logAudit(supabase, {
        user_id: userId,
        event_type: "policy_violation",
        action: `${agentType}:${action}`,
        outcome: "denied",
        policy_decision: { reason: "prompt_injection", type: injection.type, severity: injection.severity },
        risk_score: injection.severity === "critical" ? 100 : injection.severity === "high" ? 75 : 50,
      });

      // Breach containment: auto-kill agent on critical injection spike
      if (injection.severity === "critical") {
        await autoBreachContainment(supabase, userId, agentType, "injection_spike", {
          detection_type: injection.type,
          pattern: injection.pattern,
        });
      }

      return {
        allowed: false,
        response: new Response(
          JSON.stringify({ error: "Request blocked by security policy", code: "INJECTION_DETECTED" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }
  }

  // 1. Validate agent identity & tool authorization
  const { data: validation, error: valError } = await supabase.rpc(
    "validate_agent_identity",
    { p_user_id: userId, p_agent_type: agentType, p_tool_id: action }
  );

  if (valError || !validation?.valid) {
    const reason = validation?.reason || valError?.message || "unknown";
    await logAudit(supabase, {
      user_id: userId,
      agent_id: validation?.agent_id || null,
      event_type: "policy_violation",
      tool_id: action,
      action: `${agentType}:${action}`,
      outcome: "denied",
      policy_decision: { reason, agent_type: agentType },
    });
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: "Agent authorization denied", code: "AGENT_DENIED", reason }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const agentId = validation.agent_id;

  // 2. Kill switch check
  const { data: agentRecord } = await supabase
    .from("agent_identities")
    .select("kill_switch, daily_action_cap")
    .eq("id", agentId)
    .single();

  if (agentRecord?.kill_switch) {
    await logAudit(supabase, {
      user_id: userId,
      agent_id: agentId,
      event_type: "policy_violation",
      tool_id: action,
      action: `${agentType}:${action}`,
      outcome: "denied",
      policy_decision: { reason: "kill_switch_active" },
      risk_score: 0,
    });
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: "Agent is disabled (kill switch active)", code: "KILL_SWITCH" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // 3. Throttle check
  const { data: throttleResult } = await supabase.rpc("check_and_increment_throttle", {
    p_user_id: userId,
    p_agent_id: agentId,
    p_tool_id: action,
    p_daily_cap: agentRecord?.daily_action_cap || 100,
  });

  if (throttleResult && !throttleResult.allowed) {
    await logAudit(supabase, {
      user_id: userId,
      agent_id: agentId,
      event_type: "throttle",
      tool_id: action,
      action: `${agentType}:${action}`,
      outcome: "throttled",
      policy_decision: throttleResult,
    });
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: "Action throttled", code: "THROTTLED", reason: throttleResult.reason }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // 4. Check AI credits
  const creditCheck = await requireAICredits(supabase, userId, creditCost);
  if (!creditCheck.allowed) {
    await logAudit(supabase, {
      user_id: userId,
      agent_id: agentId,
      event_type: "credit_deduct",
      tool_id: action,
      action: `${agentType}:${action}`,
      outcome: "denied",
      policy_decision: { reason: "insufficient_credits" },
    });
    return { allowed: false, response: insufficientCreditsResponse(corsHeaders) };
  }

  // 5. Create agent session
  const { data: session } = await supabase
    .from("agent_sessions")
    .insert({
      agent_id: agentId,
      user_id: userId,
      action: `${agentType}:${action}`,
      credits_reserved: creditCost,
      status: "active",
    })
    .select("id")
    .single();

  const sessionId = session?.id;

  // 6. Issue JIT token (single-use, 30s TTL)
  const { data: jitToken } = await supabase
    .from("agent_jit_tokens")
    .insert({
      session_id: sessionId,
      agent_id: agentId,
      user_id: userId,
      tool_id: action,
      scope: { agent_type: agentType, action, max_privilege: validation.max_privilege },
      status: "issued",
    })
    .select("id")
    .single();

  const jitTokenId = jitToken?.id;

  // 7. Log session start
  await logAudit(supabase, {
    user_id: userId,
    agent_id: agentId,
    session_id: sessionId,
    event_type: "session_start",
    tool_id: action,
    action: `${agentType}:${action}`,
    outcome: "success",
    credits_cost: creditCost,
    policy_decision: {
      role: validation.role,
      privilege: validation.max_privilege,
      jit_token: jitTokenId,
    },
  });

  return {
    allowed: true,
    context: { supabase, userId, agentId, sessionId, jitTokenId, agentType, action },
  };
}

/**
 * Complete an agent session: consume JIT token, close session, log result.
 */
export async function completeSession(
  ctx: AgentGatewayContext,
  success: boolean,
  errorMessage?: string
) {
  // Consume/revoke JIT token
  if (ctx.jitTokenId) {
    await ctx.supabase
      .from("agent_jit_tokens")
      .update({
        status: success ? "consumed" : "revoked",
        consumed_at: new Date().toISOString(),
        revoked_reason: success ? null : (errorMessage || "session_error"),
      })
      .eq("id", ctx.jitTokenId);
  }

  // Update session
  await ctx.supabase
    .from("agent_sessions")
    .update({
      status: success ? "completed" : "error",
      completed_at: new Date().toISOString(),
      credits_consumed: 1,
      error_message: errorMessage || null,
    })
    .eq("id", ctx.sessionId);

  // Log session end
  await logAudit(ctx.supabase, {
    user_id: ctx.userId,
    agent_id: ctx.agentId,
    session_id: ctx.sessionId,
    event_type: "session_end",
    tool_id: ctx.action,
    action: `${ctx.agentType}:${ctx.action}`,
    outcome: success ? "success" : "error",
    metadata: errorMessage ? { error: errorMessage } : {},
  });
}

/**
 * Append-only audit log entry.
 */
async function logAudit(
  supabase: SupabaseClient,
  entry: {
    user_id: string;
    agent_id?: string | null;
    session_id?: string | null;
    event_type: string;
    tool_id?: string | null;
    action: string;
    outcome: string;
    policy_decision?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    credits_cost?: number;
    risk_score?: number;
  }
) {
  try {
    await supabase.from("agent_audit_log").insert({
      user_id: entry.user_id,
      agent_id: entry.agent_id || null,
      session_id: entry.session_id || null,
      event_type: entry.event_type,
      tool_id: entry.tool_id || null,
      action: entry.action,
      outcome: entry.outcome,
      policy_decision: entry.policy_decision || {},
      metadata: entry.metadata || {},
      credits_cost: entry.credits_cost || 0,
      risk_score: entry.risk_score || 0,
    });
  } catch (e) {
    console.error("Audit log write failed:", e);
  }
}


/**
 * Auto-trigger breach containment when anomaly detected.
 */
async function autoBreachContainment(
  supabase: SupabaseClient,
  userId: string,
  agentType: string,
  triggerType: string,
  detail: Record<string, unknown>
) {
  try {
    // Find agent
    const { data: agent } = await supabase
      .from("agent_identities")
      .select("id")
      .eq("user_id", userId)
      .eq("agent_type", agentType)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!agent) return;

    await supabase.rpc("trigger_breach_containment", {
      p_user_id: userId,
      p_agent_id: agent.id,
      p_trigger_type: triggerType,
      p_trigger_detail: detail,
    });

    console.warn(`[BREACH] Containment triggered for agent ${agent.id}: ${triggerType}`);
  } catch (e) {
    console.error("Breach containment failed:", e);
  }
}

export { corsHeaders };
