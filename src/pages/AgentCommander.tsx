import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, MessageSquare, Mail, Phone, Zap, Settings2, 
  Bell, CheckCircle2, XCircle, Clock, Sparkles, 
  Plus, LayoutDashboard, AlertTriangle, Cpu, BookOpen
} from "lucide-react";
import { ChannelConfigCard } from "@/components/agent/ChannelConfigCard";
import { RuleBuilder, type Rule } from "@/components/agent/RuleBuilder";
import { PendingActionsQueue, type PendingAction } from "@/components/agent/PendingActionsQueue";
import { ConversationsPanel } from "@/components/agent/ConversationsPanel";
import { AISetupWizard } from "@/components/agent/AISetupWizard";
import { AgentTypeSelector } from "@/components/agent/AgentTypeSelector";
import { KnowledgeBaseManager } from "@/components/agent/KnowledgeBaseManager";
import type { Json } from "@/integrations/supabase/types";

type Channel = "whatsapp" | "email" | "voice";

interface ChannelConfig {
  id: string;
  channel: Channel;
  is_enabled: boolean;
  config: Json;
}

export default function AgentCommander() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAISetup, setShowAISetup] = useState(false);

  // Fetch channel configs
  const { data: channelConfigs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ["agent-configs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("agent_configs")
        .select("*")
        .order("channel");
      if (error) throw error;
      return data as ChannelConfig[];
    },
    enabled: !!user,
  });

  // Fetch rules
  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["agent-rules", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("agent_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch pending actions
  const { data: pendingActions = [] } = useQuery({
    queryKey: ["agent-pending-actions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("agent_pending_actions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get channel status helper
  const getChannelConfig = (channel: Channel) => {
    return channelConfigs.find(c => c.channel === channel);
  };

  // Stats
  const enabledChannels = channelConfigs.filter(c => c.is_enabled).length;
  const activeRules = rules.filter((r: any) => r.is_active).length;
  const pendingCount = pendingActions.length;

  const t = {
    title: language === "es" ? "Comandante de Agente IA" : "AI Agent Commander",
    subtitle: language === "es" 
      ? "Gestiona interacciones en WhatsApp, Email y Llamadas de voz" 
      : "Manage interactions across WhatsApp, Email & Voice calls",
    overview: language === "es" ? "Vista General" : "Overview",
    channels: language === "es" ? "Canales" : "Channels",
    rules: language === "es" ? "Reglas" : "Rules",
    inbox: language === "es" ? "Bandeja" : "Inbox",
    pending: language === "es" ? "Pendientes" : "Pending",
    channelsActive: language === "es" ? "Canales activos" : "Active channels",
    rulesActive: language === "es" ? "Reglas activas" : "Active rules",
    needsApproval: language === "es" ? "Requieren aprobación" : "Need approval",
    setupAI: language === "es" ? "Configurar con IA" : "Setup with AI",
    noChannels: language === "es" 
      ? "No hay canales configurados. Activa al menos uno para comenzar." 
      : "No channels configured. Enable at least one to get started.",
  };

  if (loadingConfigs || loadingRules) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAISetup(true)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t.setupAI}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{enabledChannels}</p>
              <p className="text-xs text-muted-foreground">{t.channelsActive}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{activeRules}</p>
              <p className="text-xs text-muted-foreground">{t.rulesActive}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{t.needsApproval}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5 text-xs">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "es" ? "Agentes" : "Agents"}</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "es" ? "FAQ" : "FAQ"}</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-1.5 text-xs">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{t.channels}</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5 text-xs">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.rules}</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1.5 text-xs">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t.inbox}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 text-xs relative">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t.pending}</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {enabledChannels === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t.noChannels}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("channels")}
                  >
                    {language === "es" ? "Configurar canales" : "Configure channels"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Channel Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === "es" ? "Estado de Canales" : "Channel Status"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(["whatsapp", "email", "voice"] as Channel[]).map(channel => {
                      const config = getChannelConfig(channel);
                      const isEnabled = config?.is_enabled;
                      const icons = {
                        whatsapp: MessageSquare,
                        email: Mail,
                        voice: Phone,
                      };
                      const Icon = icons[channel];
                      const labels = {
                        whatsapp: "WhatsApp",
                        email: "Email",
                        voice: language === "es" ? "Llamadas de Voz" : "Voice Calls",
                      };
                      
                      return (
                        <div key={channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{labels[channel]}</span>
                          </div>
                          <Badge variant={isEnabled ? "default" : "secondary"}>
                            {isEnabled 
                              ? (language === "es" ? "Activo" : "Active") 
                              : (language === "es" ? "Inactivo" : "Inactive")}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === "es" ? "Actividad Reciente" : "Recent Activity"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {language === "es" 
                          ? "Las conversaciones aparecerán aquí" 
                          : "Conversations will appear here"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="mt-6">
            {user && <AgentTypeSelector language={language} userId={user.id} />}
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBaseManager language={language} />
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <ChannelConfigCard 
                channel="whatsapp" 
                config={getChannelConfig("whatsapp")}
                language={language}
              />
              <ChannelConfigCard 
                channel="email" 
                config={getChannelConfig("email")}
                language={language}
              />
              <ChannelConfigCard 
                channel="voice" 
                config={getChannelConfig("voice")}
                language={language}
              />
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-6">
            <RuleBuilder rules={rules} language={language} />
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="mt-6">
            <ConversationsPanel language={language} />
          </TabsContent>

          {/* Pending Actions Tab */}
          <TabsContent value="pending" className="mt-6">
            <PendingActionsQueue actions={pendingActions} language={language} />
          </TabsContent>
        </Tabs>

        {/* AI Setup Wizard Dialog */}
        <AISetupWizard 
          open={showAISetup} 
          onOpenChange={setShowAISetup}
          language={language}
        />
      </div>
    </AppLayout>
  );
}
