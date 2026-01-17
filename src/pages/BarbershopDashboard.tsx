import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConsultantKanban } from "@/components/consultant/ConsultantKanban";
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
import { useBarbershopTheme } from "@/hooks/useBarbershopTheme";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Mail, Store, ShoppingBag, Package, DollarSign, 
  LayoutDashboard, Users, Megaphone, Brain, Share2, ChevronDown, Scissors, Image, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { ConsultantContact } from "@/components/consultant/ConsultantContactCard";

// Lazy load business tool tabs
import { ProductivityTab } from "@/components/profile/ProductivityTab";
import { MarketingTab } from "@/components/profile/MarketingTab";
import { ShareLinksTab } from "@/components/profile/ShareLinksTab";
import { ActivityList } from "@/components/consultant/ActivityList";

// Barbershop-specific components
import { ServicesManager } from "@/components/barbershop/ServicesManager";
import { ProductsManager } from "@/components/barbershop/ProductsManager";

// Demo contacts for barbershop test user
const DEMO_CONTACTS = [
  { name: "Juan Pérez", phone: "+507 6123-4567", source: "whatsapp", funnel_stage: "atraccion" },
  { name: "Miguel Sánchez", phone: "+507 6234-5678", source: "instagram", funnel_stage: "atraccion" },
  { name: "Roberto García", phone: "+507 6345-6789", email: "roberto@example.com", source: "email", funnel_stage: "nutricion" },
  { name: "Carlos Mendoza", phone: "+507 6456-7890", source: "referral", funnel_stage: "nutricion" },
  { name: "Pedro Ruiz", phone: "+507 6567-8901", source: "whatsapp", funnel_stage: "conversacion", payment_pending: true, is_high_attention: true },
  { name: "Andrés López", phone: "+507 6678-9012", source: "link", funnel_stage: "retencion", paid_at: new Date().toISOString(), attendance_confirmed: true },
];

export default function BarbershopDashboard() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  useBarbershopTheme(); // Initialize theme on load
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);
  
  // Read tab from URL, default to "panel"
  const activeTab = searchParams.get("tab") || "panel";
  const setActiveTab = (tab: string) => {
    if (tab === "panel") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

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

  // Seed demo data for barbershop demo user
  useEffect(() => {
    async function seedDemoData() {
      if (!user || seeded || contacts.length > 0) return;
      
      const demoSeeded = localStorage.getItem(`barbershop_demo_seeded_${user.id}`);
      if (demoSeeded) {
        setSeeded(true);
        return;
      }

      const contactsToInsert = DEMO_CONTACTS.map(c => ({
        ...c,
        user_id: user.id,
        stage_entered_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_interaction: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error } = await supabase
        .from("consultant_contacts")
        .insert(contactsToInsert);

      if (!error) {
        localStorage.setItem(`barbershop_demo_seeded_${user.id}`, "true");
        queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
      }
      setSeeded(true);
    }

    if (!isLoading && contacts.length === 0) {
      seedDemoData();
    }
  }, [user, isLoading, contacts.length, seeded, queryClient]);

  // Funnel stats
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

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === "es") {
      if (hour < 12) return "Buenos días";
      if (hour < 18) return "Buenas tardes";
      return "Buenas noches";
    }
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
        {/* Header with Scissors Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-barbershop-accent" />
            <h1 className="text-xl font-bold text-barbershop-header">
              {language === "es" ? "Barbería" : "Barbershop"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {stats.nutricion > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsBulkEmailOpen(true)} 
                size="sm"
                className="gap-1.5 h-9 border-barbershop-accent text-barbershop-accent hover:bg-barbershop-accent/10"
              >
                <Mail className="w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              size="sm"
              className="gap-1.5 h-9 bg-barbershop-cta hover:bg-barbershop-cta/90 text-white"
            >
              <Plus className="w-4 h-4" />
              {language === "es" ? "Nuevo" : "New"}
            </Button>
          </div>
        </div>

        {/* Funnel Overview - Always Visible */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
            <p className="text-xl font-bold text-barbershop-header">{stats.atraccion}</p>
            <p className="text-[9px] text-barbershop-muted font-medium">
              {language === "es" ? "Nuevos" : "New"}
            </p>
          </div>
          <div className="bg-barbershop-cta/10 rounded-xl p-3 text-center border border-barbershop-cta/20">
            <p className="text-xl font-bold text-barbershop-header">{stats.nutricion}</p>
            <p className="text-[9px] text-barbershop-muted font-medium">
              {language === "es" ? "Interesados" : "Interested"}
            </p>
          </div>
          <div className="bg-barbershop-accent/10 rounded-xl p-3 text-center border border-barbershop-accent/20">
            <p className="text-xl font-bold text-barbershop-header">{stats.conversacion}</p>
            <p className="text-[9px] text-barbershop-muted font-medium">
              {language === "es" ? "Citas" : "Appointments"}
            </p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
            <p className="text-xl font-bold text-barbershop-header">{stats.retencion}</p>
            <p className="text-[9px] text-barbershop-muted font-medium">
              {language === "es" ? "Clientes" : "Clients"}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full h-auto p-1 bg-barbershop-section-alt">
            <TabsTrigger 
              value="panel" 
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Panel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <Scissors className="w-4 h-4" />
              <span>{language === "es" ? "Servicios" : "Services"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="marketing"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <Megaphone className="w-4 h-4" />
              <span>Marketing</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <Package className="w-4 h-4" />
              <span>{language === "es" ? "Productos" : "Products"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contacts"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <Users className="w-4 h-4" />
              <span>{language === "es" ? "Clientes" : "Clients"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-barbershop-section data-[state=active]:text-barbershop-header text-[10px] text-barbershop-muted"
            >
              <Settings className="w-4 h-4" />
              <span>{language === "es" ? "Config" : "Settings"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Panel Tab - Overview with Daily Focus */}
          <TabsContent value="panel" className="mt-4 space-y-4">
            {/* Daily Assistant - Primary Focus */}
            <DailyAssistantPanel contacts={contacts} language={language} />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/storefronts"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-barbershop-section border border-barbershop-accent/20 hover:bg-barbershop-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-barbershop-cta/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-barbershop-cta" />
                </div>
                <p className="text-xl font-bold text-barbershop-header">{kitzStats?.storefronts || 0}</p>
                <p className="text-xs text-barbershop-muted">
                  {language === "es" ? "Servicios" : "Services"}
                </p>
              </Link>
              <Link 
                to="/products"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-barbershop-section border border-barbershop-accent/20 hover:bg-barbershop-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-barbershop-accent/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-barbershop-accent" />
                </div>
                <p className="text-xl font-bold text-barbershop-header">{kitzStats?.products || 0}</p>
                <p className="text-xs text-barbershop-muted">
                  {language === "es" ? "Productos" : "Products"}
                </p>
              </Link>
              <Link 
                to="/order-history"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-barbershop-section border border-barbershop-accent/20 hover:bg-barbershop-section-alt transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-barbershop-header">{kitzStats?.orders || 0}</p>
                <p className="text-xs text-barbershop-muted">
                  {language === "es" ? "Citas" : "Appointments"}
                </p>
              </Link>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-barbershop-cta/5 to-barbershop-cta/10 border border-barbershop-cta/20">
                <div className="w-10 h-10 rounded-full bg-barbershop-cta/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-barbershop-cta" />
                </div>
                <p className="text-xl font-bold text-barbershop-cta">
                  ${(kitzStats?.revenue || 0).toFixed(0)}
                </p>
                <p className="text-xs text-barbershop-muted">
                  {language === "es" ? "Ingresos" : "Revenue"}
                </p>
              </div>
            </div>

            {/* Secondary Content - Collapsible on Mobile */}
            <Collapsible open={secondaryExpanded} onOpenChange={setSecondaryExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-center gap-2 text-barbershop-muted hover:text-barbershop-header"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${secondaryExpanded ? "rotate-180" : ""}`} />
                  {language === "es" ? "Ver más" : "View more"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Total Revenue Card */}
                <Card className="bg-gradient-to-br from-barbershop-cta/5 to-barbershop-cta/10 border-barbershop-cta/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-barbershop-cta to-barbershop-accent flex items-center justify-center shadow-lg">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-barbershop-muted">
                          {language === "es" ? "Ingresos totales" : "Total Revenue"}
                        </p>
                        <p className="text-2xl font-bold text-barbershop-cta">
                          ${(kitzStats?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity List */}
                <ActivityList language={language} limit={10} />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-4">
            <ServicesManager language={language} />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="mt-4">
            <MarketingTab />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-4">
            <ProductsManager language={language} />
          </TabsContent>

          {/* Contacts Tab - Kanban */}
          <TabsContent value="contacts" className="mt-4 space-y-4">
            <ConsultantKanban 
              language={language} 
              onAddContact={() => setIsAddDialogOpen(true)}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <Link to="/settings" className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-barbershop-header">
                        {language === "es" ? "Perfil del Negocio" : "Business Profile"}
                      </h4>
                      <p className="text-sm text-barbershop-muted">
                        {language === "es" ? "Nombre, dirección, horarios, contacto" : "Name, address, hours, contact"}
                      </p>
                    </div>
                    <Settings className="w-5 h-5 text-barbershop-muted" />
                  </Link>
                </CardContent>
              </Card>
              <ShareLinksTab />
            </div>
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
