import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConsultantKanban } from "@/components/consultant/ConsultantKanban";
import { DailyAssistantPanel } from "@/components/consultant/DailyAssistantPanel";
import { AddContactDialog } from "@/components/consultant/AddContactDialog";
import { BulkEmailDialog } from "@/components/consultant/BulkEmailDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Mail, Store, ShoppingBag, Package, User, DollarSign, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ConsultantContact } from "@/components/consultant/ConsultantContactCard";

// Demo contacts for test user
const DEMO_CONTACTS = [
  { name: "María García", phone: "+507 6123-4567", source: "whatsapp", funnel_stage: "atraccion" },
  { name: "Carlos Rodríguez", phone: "+507 6234-5678", source: "instagram", funnel_stage: "atraccion" },
  { name: "Ana Martínez", phone: "+507 6345-6789", email: "ana@example.com", source: "email", funnel_stage: "nutricion" },
  { name: "Luis Pérez", phone: "+507 6456-7890", source: "referral", funnel_stage: "nutricion" },
  { name: "Sofia López", phone: "+507 6567-8901", source: "whatsapp", funnel_stage: "conversacion", payment_pending: true, is_high_attention: true },
  { name: "Diego Hernández", phone: "+507 6678-9012", source: "link", funnel_stage: "retencion", paid_at: new Date().toISOString(), attendance_confirmed: true },
];

export default function ConsultantDashboard() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

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

  // Seed demo data for consultant demo user
  useEffect(() => {
    async function seedDemoData() {
      if (!user || seeded || contacts.length > 0) return;
      
      // Check if this is the demo user or any consultant
      const demoSeeded = localStorage.getItem(`consultant_demo_seeded_${user.id}`);
      if (demoSeeded) {
        setSeeded(true);
        return;
      }

      // Insert demo contacts
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
        localStorage.setItem(`consultant_demo_seeded_${user.id}`, "true");
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[300px] rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {language === "es" ? "Mis Contactos" : "My Contacts"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile?.business_name || "Consultant Demo"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.nutricion > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsBulkEmailOpen(true)} 
                size="sm"
                className="gap-1.5"
              >
                <Mail className="w-4 h-4" />
                {language === "es" ? "Email Masivo" : "Bulk Email"}
              </Button>
            )}
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {language === "es" ? "Nuevo" : "New"}
            </Button>
          </div>
        </div>

        {/* Daily Assistant */}
        <DailyAssistantPanel contacts={contacts} language={language} />

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Total" : "Total"}</p>
          </div>
          <div className="bg-blue-500/5 rounded-xl p-3 text-center border border-blue-500/20">
            <p className="text-2xl font-semibold text-blue-600">{stats.atraccion}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Atracción" : "Attraction"}</p>
          </div>
          <div className="bg-purple-500/5 rounded-xl p-3 text-center border border-purple-500/20">
            <p className="text-2xl font-semibold text-purple-600">{stats.conversacion}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Conversación" : "Conversation"}</p>
          </div>
          <div className="bg-emerald-500/5 rounded-xl p-3 text-center border border-emerald-500/20">
            <p className="text-2xl font-semibold text-emerald-600">{stats.retencion}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Retención" : "Retention"}</p>
          </div>
        </div>

        {/* Core Kitz Tools with Stats */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">
              {language === "es" ? "Herramientas Kitz" : "Kitz Tools"}
            </h3>
            <Link 
              to="/profile"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              {language === "es" ? "Ver perfil completo" : "View full profile"}
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link 
              to="/storefronts"
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{kitzStats?.storefronts || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Vitrinas" : "Storefronts"}
                </p>
              </div>
            </Link>
            <Link 
              to="/products"
              className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{kitzStats?.products || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Productos" : "Products"}
                </p>
              </div>
            </Link>
            <Link 
              to="/order-history"
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{kitzStats?.orders || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Pedidos" : "Orders"}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">
                  ${(kitzStats?.revenue || 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Ingresos" : "Revenue"}
                </p>
              </div>
            </div>
          </div>

          {/* AI Advisor Quick Access */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {language === "es" ? "Pregunta sobre ingresos" : "Ask about revenue"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {language === "es" ? "Tu asesor de IA está listo" : "Your AI advisor is ready"}
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <ConsultantKanban 
          language={language} 
          onAddContact={() => setIsAddDialogOpen(true)}
        />

        {/* Version Stamp */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-muted-foreground">
            Consultant Mode v1.0.0 — Test
          </p>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <AddContactDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        language={language}
      />

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        contacts={contacts}
        language={language}
      />
    </AppLayout>
  );
}
