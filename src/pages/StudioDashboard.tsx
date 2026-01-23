import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { DailyAssistantPanel } from "@/components/consultant/DailyAssistantPanel";
import { AddContactDialog } from "@/components/consultant/AddContactDialog";
import { BulkEmailDialog } from "@/components/consultant/BulkEmailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Mail, Store, ShoppingBag, Package, DollarSign, 
  LayoutDashboard, Users, Megaphone, Brain, Clapperboard, ChevronDown,
  Rocket, Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { ConsultantContact } from "@/components/consultant/ConsultantContactCard";

// Core Kitz tabs (80%)
import { ProductivityTab } from "@/components/profile/ProductivityTab";
import { MarketingTab } from "@/components/profile/MarketingTab";
import { ActivityList } from "@/components/consultant/ActivityList";

// Studio CEO tools (20%)
import { ProductionPipeline } from "@/components/studio/ProductionPipeline";
import { StartupTracker } from "@/components/studio/StartupTracker";
import { OKRWidget } from "@/components/studio/OKRWidget";

export default function StudioDashboard() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  useStudioTheme();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("panel");
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["consultant-contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consultant_contacts")
        .select("*")
        .order("last_interaction", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as ConsultantContact[];
    },
    enabled: !!user,
  });

  // Funnel stats (clients/investors/partners)
  const stats = {
    total: contacts.length,
    atraccion: contacts.filter(c => c.funnel_stage === "atraccion").length,
    nutricion: contacts.filter(c => c.funnel_stage === "nutricion").length,
    conversacion: contacts.filter(c => c.funnel_stage === "conversacion").length,
    retencion: contacts.filter(c => c.funnel_stage === "retencion").length,
  };

  // Fetch Kitz tools stats
  const { data: kitzStats } = useQuery({
    queryKey: ["kitz-stats", user?.id],
    queryFn: async () => {
      if (!user) return { storefronts: 0, products: 0, orders: 0, revenue: 0 };
      
      const [storefronts, products] = await Promise.all([
        supabase.from("storefronts").select("id, status, price"),
        supabase.from("products").select("id"),
      ]);

      const paidOrders = storefronts.data?.filter(s => s.status === "paid") || [];
      const revenue = paidOrders.reduce((sum, s) => sum + (s.price || 0), 0);

      return {
        storefronts: storefronts.data?.length || 0,
        products: products.data?.length || 0,
        orders: paidOrders.length,
        revenue,
      };
    },
    enabled: !!user,
  });

  const t = {
    en: {
      studio: "Studio CEO",
      leads: "Leads",
      prospects: "Prospects", 
      deals: "Deals",
      clients: "Clients",
      new: "New",
      viewMore: "View more",
      storefronts: "Storefronts",
      products: "Products",
      projects: "Projects",
      revenue: "Revenue",
    },
    es: {
      studio: "Estudio CEO",
      leads: "Leads",
      prospects: "Prospectos",
      deals: "Deals",
      clients: "Clientes",
      new: "Nuevo",
      viewMore: "Ver más",
      storefronts: "Vitrinas",
      products: "Productos",
      projects: "Proyectos",
      revenue: "Ingresos",
    },
    pt: {
      studio: "Estúdio CEO",
      leads: "Leads",
      prospects: "Prospectos",
      deals: "Deals",
      clients: "Clientes",
      new: "Novo",
      viewMore: "Ver mais",
      storefronts: "Vitrines",
      products: "Produtos",
      projects: "Projetos",
      revenue: "Receita",
    },
  }[language];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-6 h-6 text-studio-cta" />
            <h1 className="text-xl font-bold text-studio-header">{t.studio}</h1>
          </div>
          <div className="flex items-center gap-2">
            {stats.nutricion > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsBulkEmailOpen(true)} 
                size="sm"
                className="gap-1.5 h-9 border-studio-accent text-studio-accent hover:bg-studio-accent/10"
              >
                <Mail className="w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              size="sm"
              className="gap-1.5 h-9 bg-studio-cta hover:bg-studio-cta/90 text-white"
            >
              <Plus className="w-4 h-4" />
              {t.new}
            </Button>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-purple-500/10 rounded-xl p-3 text-center border border-purple-500/20">
            <p className="text-xl font-bold text-studio-header">{stats.atraccion}</p>
            <p className="text-[9px] text-studio-muted font-medium">{t.leads}</p>
          </div>
          <div className="bg-cyan-500/10 rounded-xl p-3 text-center border border-cyan-500/20">
            <p className="text-xl font-bold text-studio-header">{stats.nutricion}</p>
            <p className="text-[9px] text-studio-muted font-medium">{t.prospects}</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
            <p className="text-xl font-bold text-studio-header">{stats.conversacion}</p>
            <p className="text-[9px] text-studio-muted font-medium">{t.deals}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
            <p className="text-xl font-bold text-studio-header">{stats.retencion}</p>
            <p className="text-[9px] text-studio-muted font-medium">{t.clients}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-studio-section-alt">
            <TabsTrigger 
              value="panel" 
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-studio-section data-[state=active]:text-studio-header text-[10px] text-studio-muted"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Panel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-studio-section data-[state=active]:text-studio-header text-[10px] text-studio-muted"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Pipeline</span>
            </TabsTrigger>
            <TabsTrigger 
              value="startup"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-studio-section data-[state=active]:text-studio-header text-[10px] text-studio-muted"
            >
              <Rocket className="w-4 h-4" />
              <span>Startup</span>
            </TabsTrigger>
            <TabsTrigger 
              value="marketing"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-studio-section data-[state=active]:text-studio-header text-[10px] text-studio-muted"
            >
              <Megaphone className="w-4 h-4" />
              <span>Marketing</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-studio-section data-[state=active]:text-studio-header text-[10px] text-studio-muted"
            >
              <Brain className="w-4 h-4" />
              <span>{language === "es" ? "Tareas" : language === "pt" ? "Tarefas" : "Tasks"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Panel Tab - CEO Overview */}
          <TabsContent value="panel" className="mt-4 space-y-4">
            {/* Daily Assistant */}
            <DailyAssistantPanel contacts={contacts} language={language} />

            {/* OKRs Widget */}
            <OKRWidget language={language} />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/storefronts"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-studio-section border border-studio-accent/20 hover:bg-studio-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-studio-cta/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-studio-cta" />
                </div>
                <p className="text-xl font-bold text-studio-header">{kitzStats?.storefronts || 0}</p>
                <p className="text-xs text-studio-muted">{t.storefronts}</p>
              </Link>
              <Link 
                to="/products"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-studio-section border border-studio-accent/20 hover:bg-studio-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-studio-accent/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-studio-accent" />
                </div>
                <p className="text-xl font-bold text-studio-header">{kitzStats?.products || 0}</p>
                <p className="text-xs text-studio-muted">{t.products}</p>
              </Link>
              <Link 
                to="/order-history"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-studio-section border border-studio-accent/20 hover:bg-studio-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-studio-header">{kitzStats?.orders || 0}</p>
                <p className="text-xs text-studio-muted">{t.projects}</p>
              </Link>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-studio-cta/5 to-studio-cta/10 border border-studio-cta/20">
                <div className="w-10 h-10 rounded-full bg-studio-cta/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-studio-cta" />
                </div>
                <p className="text-xl font-bold text-studio-cta">
                  ${(kitzStats?.revenue || 0).toFixed(0)}
                </p>
                <p className="text-xs text-studio-muted">{t.revenue}</p>
              </div>
            </div>

            {/* Secondary Content */}
            <Collapsible open={secondaryExpanded} onOpenChange={setSecondaryExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-center gap-2 text-studio-muted hover:text-studio-header"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${secondaryExpanded ? "rotate-180" : ""}`} />
                  {t.viewMore}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <Card className="bg-gradient-to-br from-studio-cta/5 to-studio-cta/10 border-studio-cta/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-studio-cta to-studio-accent flex items-center justify-center shadow-lg">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-studio-muted">
                          {language === "es" ? "Ingresos totales" : language === "pt" ? "Receita total" : "Total Revenue"}
                        </p>
                        <p className="text-2xl font-bold text-studio-cta">
                          ${(kitzStats?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <ActivityList language={language} limit={10} />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* Pipeline Tab - Animation Production */}
          <TabsContent value="pipeline" className="mt-4 space-y-4">
            <ProductionPipeline language={language} />
          </TabsContent>

          {/* Startup Tab - Fintech Launch */}
          <TabsContent value="startup" className="mt-4 space-y-4">
            <StartupTracker language={language} />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="mt-4">
            <MarketingTab />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <ProductivityTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        language={language}
      />
      
      <BulkEmailDialog
        open={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        contacts={contacts}
        language={language}
      />
    </AppLayout>
  );
}
