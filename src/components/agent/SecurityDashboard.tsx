import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, ShieldCheck, ShieldAlert, Activity,
  Eye, Zap, AlertTriangle, CheckCircle2, XCircle,
  Clock, Bot
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  event_type: string;
  tool_id: string | null;
  action: string;
  outcome: string;
  credits_cost: number;
  created_at: string;
  policy_decision: Record<string, unknown>;
}

interface AgentIdentity {
  id: string;
  agent_type: string;
  display_name: string;
  is_active: boolean;
  role: string;
  allowed_tools: string[];
}

interface ActiveSession {
  id: string;
  action: string;
  status: string;
  started_at: string;
  agent_id: string;
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const en = language === "en";

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["agent-identities", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_identities")
        .select("id, agent_type, display_name, is_active, role, allowed_tools")
        .eq("user_id", user!.id);
      return (data || []) as AgentIdentity[];
    },
    enabled: !!user,
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["agent-sessions-active", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_sessions")
        .select("id, action, status, started_at, agent_id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(10);
      return (data || []) as ActiveSession[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: auditLog = [], isLoading: loadingAudit } = useQuery({
    queryKey: ["agent-audit-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_audit_log")
        .select("id, event_type, tool_id, action, outcome, credits_cost, created_at, policy_decision")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as AuditEntry[];
    },
    enabled: !!user,
  });

  const violations = auditLog.filter(e => e.outcome === "denied" || e.event_type === "policy_violation");
  const todayViolations = violations.filter(v => {
    const d = new Date(v.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const trustScore = Math.max(0, 100 - todayViolations.length * 10);

  const outcomeIcon = (outcome: string) => {
    if (outcome === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (outcome === "denied") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    if (outcome === "throttled") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const eventLabel = (type: string) => {
    const map: Record<string, string> = {
      session_start: "Session Start",
      session_end: "Session End",
      tool_call: "Tool Call",
      policy_violation: "⚠️ Policy Violation",
      credit_deduct: "Credit Check",
      throttle: "Throttled",
      revocation: "Revoked",
      auth: "Auth",
    };
    return map[type] || type;
  };

  if (loadingAgents) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{en ? "Trust Score" : "Confianza"}</p>
              <p className="text-2xl font-bold">{trustScore}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent">
              <Bot className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{en ? "Active Agents" : "Agentes"}</p>
              <p className="text-2xl font-bold">{agents.filter(a => a.is_active).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent">
              <Activity className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{en ? "Sessions" : "Sesiones"}</p>
              <p className="text-2xl font-bold">{activeSessions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${todayViolations.length > 0 ? "bg-destructive/10" : "bg-accent"}`}>
              <ShieldAlert className={`h-5 w-5 ${todayViolations.length > 0 ? "text-destructive" : "text-accent-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{en ? "Violations Today" : "Violaciones Hoy"}</p>
              <p className="text-2xl font-bold">{todayViolations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent Registry */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {en ? "Agent Identity Registry" : "Registro de Agentes"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">{agent.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.role} · {agent.allowed_tools.length} tools
                    </p>
                  </div>
                </div>
                <Badge variant={agent.is_active ? "default" : "secondary"} className="text-xs">
                  {agent.is_active ? (en ? "Active" : "Activo") : (en ? "Inactive" : "Inactivo")}
                </Badge>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {en ? "No agents registered" : "Sin agentes registrados"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Audit Timeline */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {en ? "Agent Activity Timeline" : "Actividad de Agentes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              {loadingAudit ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {en ? "No activity yet" : "Sin actividad aún"}
                </p>
              ) : (
                <div className="space-y-1">
                  {auditLog.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                      {outcomeIcon(entry.outcome)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{entry.action}</span>
                          {entry.credits_cost > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <Zap className="h-2.5 w-2.5 mr-0.5" />{entry.credits_cost}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {eventLabel(entry.event_type)} · {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
