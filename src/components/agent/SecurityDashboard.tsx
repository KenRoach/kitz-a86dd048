import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Shield, ShieldCheck, ShieldAlert, Activity,
  Eye, Zap, AlertTriangle, CheckCircle2, XCircle,
  Clock, Bot, Power, Ban, KeyRound, Lock, Plus, Trash2, RotateCcw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  event_type: string;
  tool_id: string | null;
  action: string;
  outcome: string;
  credits_cost: number;
  risk_score: number;
  created_at: string;
  policy_decision: Record<string, unknown>;
}

interface AgentIdentity {
  id: string;
  agent_type: string;
  display_name: string;
  is_active: boolean;
  kill_switch: boolean;
  role: string;
  allowed_tools: string[];
  daily_action_cap: number;
}

interface InjectionEntry {
  id: string;
  detection_type: string;
  severity: string;
  pattern_matched: string;
  blocked: boolean;
  created_at: string;
}

interface BreachIncident {
  id: string;
  agent_id: string;
  trigger_type: string;
  trigger_detail: Record<string, unknown>;
  containment_action: string;
  resolved_at: string | null;
  created_at: string;
}

interface VaultSecret {
  id: string;
  agent_id: string;
  key_name: string;
  last_rotated_at: string;
  created_at: string;
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const en = language === "en";
  const queryClient = useQueryClient();
  const [selectedAgentVault, setSelectedAgentVault] = useState<string | null>(null);
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["agent-identities", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_identities")
        .select("id, agent_type, display_name, is_active, kill_switch, role, allowed_tools, daily_action_cap")
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
      return (data || []) as { id: string; action: string; status: string; started_at: string; agent_id: string }[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: auditLog = [], isLoading: loadingAudit } = useQuery({
    queryKey: ["agent-audit-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_audit_log")
        .select("id, event_type, tool_id, action, outcome, credits_cost, risk_score, created_at, policy_decision")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as AuditEntry[];
    },
    enabled: !!user,
  });

  const { data: injections = [] } = useQuery({
    queryKey: ["agent-injections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_injection_log")
        .select("id, detection_type, severity, pattern_matched, blocked, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as InjectionEntry[];
    },
    enabled: !!user,
  });

  const { data: breachIncidents = [] } = useQuery({
    queryKey: ["breach-incidents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_breach_incidents")
        .select("id, agent_id, trigger_type, trigger_detail, containment_action, resolved_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as BreachIncident[];
    },
    enabled: !!user,
  });

  const { data: vaultSecrets = [] } = useQuery({
    queryKey: ["vault-secrets", selectedAgentVault],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("agent-vault", {
        body: { action: "list", agent_id: selectedAgentVault },
      });
      return (data?.secrets || []) as VaultSecret[];
    },
    enabled: !!selectedAgentVault,
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ agentId, active }: { agentId: string; active: boolean }) => {
      const { error } = await supabase
        .from("agent_identities")
        .update({ kill_switch: active })
        .eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["agent-identities"] });
      toast.success(active
        ? (en ? "Agent killed — all actions blocked" : "Agente detenido — acciones bloqueadas")
        : (en ? "Agent reactivated" : "Agente reactivado"));
    },
  });

  const addSecretMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-vault", {
        body: { action: "set", agent_id: selectedAgentVault, key_name: newSecretKey, secret_value: newSecretValue },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-secrets"] });
      setNewSecretKey("");
      setNewSecretValue("");
      toast.success(en ? "Secret stored securely" : "Secreto almacenado");
    },
    onError: () => toast.error(en ? "Failed to store secret" : "Error al almacenar"),
  });

  const deleteSecretMutation = useMutation({
    mutationFn: async (keyName: string) => {
      await supabase.functions.invoke("agent-vault", {
        body: { action: "delete", agent_id: selectedAgentVault, key_name: keyName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-secrets"] });
      toast.success(en ? "Secret removed" : "Secreto eliminado");
    },
  });

  const resolveBreachMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      const { error } = await supabase
        .from("agent_breach_incidents")
        .update({ resolved_at: new Date().toISOString(), resolved_by: user!.id })
        .eq("id", incidentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["breach-incidents"] });
      toast.success(en ? "Incident resolved" : "Incidente resuelto");
    },
  });

  const violations = auditLog.filter(e => e.outcome === "denied" || e.event_type === "policy_violation" || e.event_type === "throttle");
  const todayViolations = violations.filter(v => new Date(v.created_at).toDateString() === new Date().toDateString());
  const unresolvedBreaches = breachIncidents.filter(b => !b.resolved_at);
  const trustScore = Math.max(0, 100 - todayViolations.length * 10 - unresolvedBreaches.length * 20);

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
      throttle: "⏱ Throttled",
      revocation: "Revoked",
      auth: "Auth",
    };
    return map[type] || type;
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "bg-destructive text-destructive-foreground";
    if (s === "high") return "bg-amber-500 text-white";
    if (s === "medium") return "bg-amber-400/80 text-white";
    return "bg-muted text-muted-foreground";
  };

  const agentName = (id: string) => agents.find(a => a.id === id)?.display_name || id.slice(0, 8);

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
              <p className="text-2xl font-bold">{agents.filter(a => a.is_active && !a.kill_switch).length}</p>
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
            <div className={`p-2.5 rounded-xl ${unresolvedBreaches.length > 0 ? "bg-destructive/10" : todayViolations.length > 0 ? "bg-destructive/10" : "bg-accent"}`}>
              <ShieldAlert className={`h-5 w-5 ${unresolvedBreaches.length > 0 || todayViolations.length > 0 ? "text-destructive" : "text-accent-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{en ? "Breaches" : "Brechas"}</p>
              <p className="text-2xl font-bold">{unresolvedBreaches.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breach Incidents */}
      {breachIncidents.length > 0 && (
        <Card className="border-destructive/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" />
              {en ? "Breach Incidents" : "Incidentes de Seguridad"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {breachIncidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  <div>
                    <p className="text-xs font-medium">{agentName(inc.agent_id)} — {inc.trigger_type.replace("_", " ")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {inc.containment_action} · {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inc.resolved_at ? (
                    <Badge variant="outline" className="text-[10px] text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />{en ? "Resolved" : "Resuelto"}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => resolveBreachMutation.mutate(inc.id)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />{en ? "Resolve" : "Resolver"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Injection Threats */}
      {injections.length > 0 && (
        <Card className="border-destructive/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <Ban className="h-4 w-4" />
              {en ? "Injection Threats Blocked" : "Amenazas de Inyección Bloqueadas"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {injections.slice(0, 5).map(inj => (
              <div key={inj.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  <div>
                    <p className="text-xs font-medium">{inj.detection_type.replace("_", " ")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Pattern: <code className="bg-muted px-1 rounded text-[10px]">{inj.pattern_matched}</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${severityColor(inj.severity)}`}>{inj.severity}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(inj.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent Registry with Kill Switches */}
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
                  <div className={`w-2 h-2 rounded-full ${agent.kill_switch ? "bg-destructive" : agent.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">{agent.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.role} · {agent.allowed_tools.length} tools · cap {agent.daily_action_cap}/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setSelectedAgentVault(selectedAgentVault === agent.id ? null : agent.id)}
                  >
                    <KeyRound className="h-3 w-3 mr-1" />{en ? "Vault" : "Bóveda"}
                  </Button>
                  {agent.kill_switch && (
                    <Badge variant="destructive" className="text-[10px]">
                      <Power className="h-3 w-3 mr-1" />{en ? "Killed" : "Detenido"}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{en ? "Kill" : "Parar"}</span>
                    <Switch
                      checked={agent.kill_switch}
                      onCheckedChange={(checked) => killSwitchMutation.mutate({ agentId: agent.id, active: checked })}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Agent Vault */}
        {selectedAgentVault && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {en ? "Encrypted Vault" : "Bóveda Encriptada"} — {agentName(selectedAgentVault)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {vaultSecrets.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium font-mono">{s.key_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {en ? "Rotated" : "Rotado"} {formatDistanceToNow(new Date(s.last_rotated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteSecretMutation.mutate(s.key_name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {vaultSecrets.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {en ? "No secrets stored" : "Sin secretos almacenados"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={en ? "Key name" : "Nombre de clave"}
                  value={newSecretKey}
                  onChange={e => setNewSecretKey(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="password"
                  placeholder={en ? "Secret value" : "Valor secreto"}
                  value={newSecretValue}
                  onChange={e => setNewSecretValue(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  disabled={!newSecretKey || !newSecretValue || addSecretMutation.isPending}
                  onClick={() => addSecretMutation.mutate()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Timeline */}
        {!selectedAgentVault && (
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
                            {entry.risk_score > 50 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                risk:{entry.risk_score}
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
        )}
      </div>
    </div>
  );
}
