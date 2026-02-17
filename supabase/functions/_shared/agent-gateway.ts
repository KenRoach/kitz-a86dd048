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
  agentType: string;
  action: string;
}

export interface GatewayResult {
  allowed: boolean;
  context?: AgentGatewayContext;
  response?: Response;
}

/**
 * Agent Gateway: validates identity, checks tool authorization,
 * consumes AI credits, creates session, and logs audit trail.
 */
export async function agentGateway(
  supabase: SupabaseClient,
  userId: string,
  agentType: string,
  action: string,
  creditCost = 1
): Promise<GatewayResult> {
  // 1. Validate agent identity & tool authorization
  const { data: validation, error: valError } = await supabase.rpc(
    "validate_agent_identity",
    { p_user_id: userId, p_agent_type: agentType, p_tool_id: action }
  );

  if (valError || !validation?.valid) {
    const reason = validation?.reason || valError?.message || "unknown";
    
    // Log policy violation
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

  // 2. Check AI credits
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

    return {
      allowed: false,
      response: insufficientCreditsResponse(corsHeaders),
    };
  }

  // 3. Create agent session
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

  // 4. Log session start
  await logAudit(supabase, {
    user_id: userId,
    agent_id: agentId,
    session_id: sessionId,
    event_type: "session_start",
    tool_id: action,
    action: `${agentType}:${action}`,
    outcome: "success",
    credits_cost: creditCost,
    policy_decision: { role: validation.role, privilege: validation.max_privilege },
  });

  return {
    allowed: true,
    context: { supabase, userId, agentId, sessionId, agentType, action },
  };
}

/**
 * Complete an agent session and log the result.
 */
export async function completeSession(
  ctx: AgentGatewayContext,
  success: boolean,
  errorMessage?: string
) {
  // Update session status
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

export { corsHeaders };
