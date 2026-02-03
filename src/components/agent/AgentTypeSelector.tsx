import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Headphones, TrendingUp, Settings, Play, 
  Users, ShoppingCart, ClipboardList, Loader2
} from "lucide-react";

interface AgentTypeSelectorProps {
  language: string;
  userId: string;
}

type AgentType = "support" | "sales" | "operations";

interface AgentResult {
  action: string;
  data: any;
}

export function AgentTypeSelector({ language, userId }: AgentTypeSelectorProps) {
  const [activeAgent, setActiveAgent] = useState<AgentType>("support");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AgentResult | null>(null);

  const t = {
    support: {
      title: language === "es" ? "Agente de Soporte" : "Support Agent",
      desc: language === "es" 
        ? "Responde preguntas usando base de conocimiento" 
        : "Answers questions using knowledge base",
      actions: [
        { id: "test_response", label: language === "es" ? "Probar Respuesta" : "Test Response" }
      ]
    },
    sales: {
      title: language === "es" ? "Agente de Ventas" : "Sales Agent",
      desc: language === "es" 
        ? "Califica leads y sugiere seguimientos" 
        : "Scores leads and suggests follow-ups",
      actions: [
        { id: "score_leads", label: language === "es" ? "Calificar Leads" : "Score Leads" },
        { id: "suggest_followups", label: language === "es" ? "Sugerir Seguimientos" : "Suggest Follow-ups" }
      ]
    },
    operations: {
      title: language === "es" ? "Agente de Operaciones" : "Operations Agent",
      desc: language === "es" 
        ? "Monitorea inventario y tareas" 
        : "Monitors inventory and tasks",
      actions: [
        { id: "check_inventory", label: language === "es" ? "Revisar Inventario" : "Check Inventory" },
        { id: "check_orders", label: language === "es" ? "Revisar Pedidos" : "Check Orders" },
        { id: "generate_tasks", label: language === "es" ? "Generar Tareas" : "Generate Tasks" },
        { id: "check_expiring", label: language === "es" ? "Ver Expirando" : "Check Expiring" }
      ]
    }
  };

  const runAgentAction = async (action: string) => {
    setIsRunning(true);
    setResults(null);

    try {
      const endpoint = activeAgent === "support" 
        ? "agent-support" 
        : activeAgent === "sales" 
          ? "agent-sales" 
          : "agent-operations";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            action, 
            userId,
            message: action === "test_response" ? "¿Cuáles son sus métodos de pago?" : undefined
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Agent request failed");
      }

      const data = await response.json();
      setResults(data);
      toast.success(language === "es" ? "Análisis completado" : "Analysis complete");
    } catch (error) {
      console.error("Agent error:", error);
      toast.error(language === "es" ? "Error al ejecutar agente" : "Agent execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const agentConfigs = [
    { 
      type: "support" as AgentType, 
      icon: Headphones, 
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-600"
    },
    { 
      type: "sales" as AgentType, 
      icon: TrendingUp, 
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      iconColor: "text-emerald-600"
    },
    { 
      type: "operations" as AgentType, 
      icon: Settings, 
      color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
      iconColor: "text-amber-600"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Agent Type Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {agentConfigs.map(({ type, icon: Icon, color, iconColor }) => (
          <Card 
            key={type}
            className={`cursor-pointer transition-all ${color} ${
              activeAgent === type ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => setActiveAgent(type)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{t[type].title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t[type].desc}</p>
                </div>
                {activeAgent === type && (
                  <Badge variant="default" className="text-[10px]">
                    {language === "es" ? "Activo" : "Active"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5" />
            {language === "es" ? "Acciones Disponibles" : "Available Actions"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Ejecuta análisis del agente seleccionado" 
              : "Run analysis from the selected agent"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {t[activeAgent].actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => runAgentAction(action.id)}
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      {results && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {language === "es" ? "Resultados" : "Results"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AgentResultsDisplay results={results} language={language} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AgentResultsDisplay({ results, language }: { results: AgentResult; language: string }) {
  const { action, data } = results;

  if (!data) {
    return <p className="text-muted-foreground">{language === "es" ? "Sin resultados" : "No results"}</p>;
  }

  // Sales Agent - Score Leads
  if (action === "score_leads" && data.leads) {
    return (
      <div className="space-y-3">
        {data.leads.map((lead: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.recommended_action}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={lead.priority === "hot" ? "destructive" : lead.priority === "warm" ? "default" : "secondary"}>
                {lead.score}/100
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{lead.priority}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Sales Agent - Follow-ups
  if (action === "suggest_followups" && data.followups) {
    return (
      <div className="space-y-3">
        {data.followups.map((f: any, idx: number) => (
          <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{f.customer_name}</span>
              <Badge variant={f.urgency === "urgent" ? "destructive" : "outline"}>
                {f.urgency} • {f.channel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground italic">"{f.message_template}"</p>
          </div>
        ))}
      </div>
    );
  }

  // Operations Agent - Orders/Inventory
  if (data.alerts || data.recommendations) {
    const items = data.alerts || data.recommendations;
    return (
      <div className="space-y-3">
        {data.summary && (
          <p className="text-sm text-muted-foreground mb-4">{data.summary}</p>
        )}
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {item.order_id ? <ShoppingCart className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
              <div>
                <p className="font-medium text-sm">{item.product_name || item.customer || item.title}</p>
                <p className="text-xs text-muted-foreground">{item.issue || item.description}</p>
              </div>
            </div>
            <Badge variant={
              item.priority === "urgent" || item.urgency === "critical" ? "destructive" : 
              item.priority === "high" || item.urgency === "high" ? "default" : "secondary"
            }>
              {item.priority || item.urgency}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  // Operations Agent - Tasks
  if (data.tasks) {
    return (
      <div className="space-y-3">
        {data.daily_focus && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium">{language === "es" ? "Enfoque del día:" : "Daily focus:"}</p>
            <p className="text-sm">{data.daily_focus}</p>
          </div>
        )}
        {data.tasks.map((task: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.description}</p>
              {task.estimated_time && (
                <p className="text-xs text-muted-foreground mt-1">⏱ {task.estimated_time}</p>
              )}
            </div>
            <div className="text-right">
              <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                {task.priority}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{task.category}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback - raw JSON
  return (
    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
