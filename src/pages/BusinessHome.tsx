import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useBusinessOS } from "@/hooks/useBusinessOS";
import { useAICredits } from "@/hooks/useAICredits";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { AIGated } from "@/components/ai/AIGated";
import { AIEmptyBanner } from "@/components/ai/AIEmptyBanner";
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Store,
  AlertTriangle, Zap, ArrowRight, Clock, CheckCircle2, Flame, Bot,
  MessageCircle, Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BusinessHome() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { loading: aiLoading, summary, actions, runMyBusiness } = useBusinessOS();
  const { hasCredits, consume } = useAICredits();
  const [stats, setStats] = useState({
    todayRevenue: 0, activeOrders: 0, pendingFollowUps: 0,
    totalContacts: 0, hotLeads: 0, riskyOrders: 0,
  });
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [dueFollowUps, setDueFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const [ordersRes, contactsRes, followUpsRes, actionsRes, dueSoonRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id),
      supabase.from("crm_contacts").select("id, lead_score").eq("user_id", user.id),
      supabase.from("follow_ups").select("id").eq("user_id", user.id).eq("status", "pending").lt("due_at", now.toISOString()),
      supabase.from("ai_actions").select("*").eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      supabase.from("follow_ups").select("id, reason, due_at, status, contact_id, order_id, channel").eq("user_id", user.id).eq("status", "pending").lte("due_at", now.toISOString()).order("due_at", { ascending: true }).limit(5),
    ]);

    const orders = ordersRes.data || [];
    const paidToday = orders.filter(o => o.payment_status === "PAID" && o.paid_at?.startsWith(todayStr));
    const todayRevenue = paidToday.reduce((s, o) => s + Number(o.total), 0);
    const activeOrders = orders.filter(o => o.payment_status === "PENDING" || (o.fulfillment_status !== "DELIVERED" && o.fulfillment_status !== "CANCELED" && o.payment_status === "PAID")).length;
    const riskyOrders = orders.filter(o => o.risk_flag).length;
    const contacts = contactsRes.data || [];

    setStats({
      todayRevenue,
      activeOrders,
      pendingFollowUps: (followUpsRes.data || []).length,
      totalContacts: contacts.length,
      hotLeads: contacts.filter(c => c.lead_score === "HOT").length,
      riskyOrders,
    });
    setRecentActions(actionsRes.data || []);
    setDueFollowUps(dueSoonRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const displaySummary = summary || stats;

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;

  const greeting = (() => {
    const h = new Date().getHours();
    const name = profile?.business_name || "Boss";
    if (h < 12) return language === "es" ? `Buenos días, ${name}` : `Good morning, ${name}`;
    if (h < 18) return language === "es" ? `Buenas tardes, ${name}` : `Good afternoon, ${name}`;
    return language === "es" ? `Buenas noches, ${name}` : `Good evening, ${name}`;
  })();

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium": return "bg-primary/10 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{greeting}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === "es" ? "Tu centro de operaciones" : "Your operating center"}
            </p>
          </div>
          <AIGated>
            <Button
              onClick={async () => {
                const ok = await consume();
                if (ok) runMyBusiness();
              }}
              disabled={aiLoading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Bot className="w-4 h-4" />
              {aiLoading
                ? (language === "es" ? "Analizando..." : "Analyzing...")
                : (language === "es" ? "Ejecutar" : "Run My Business")}
            </Button>
          </AIGated>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/orders")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold">${stats.todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Hoy" : "Today"}</p>
          </Card>

          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/orders")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold">{stats.activeOrders}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Órdenes activas" : "Active orders"}</p>
          </Card>

          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/crm")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold">{stats.pendingFollowUps}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Seguimientos" : "Follow-ups"}</p>
          </Card>

          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/crm")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold">{stats.hotLeads}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Leads calientes" : "Hot leads"}</p>
          </Card>
        </div>

        {/* Risks */}
        {stats.riskyOrders > 0 && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {stats.riskyOrders} {language === "es" ? "órdenes con riesgo" : "orders at risk"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/orders")}>
                {language === "es" ? "Ver" : "View"}
              </Button>
            </div>
          </Card>
        )}

        {/* Due Follow-ups — the differentiator */}
        {dueFollowUps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              {language === "es" ? "Seguimientos pendientes" : "Follow-ups due"}
              <Badge variant="secondary" className="text-[10px]">{dueFollowUps.length}</Badge>
            </h2>
            <div className="space-y-2">
              {dueFollowUps.map((f: any) => (
                <Card key={f.id} className="p-4 border-orange-200 dark:border-orange-800/30">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{f.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(f.due_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => navigate("/crm")}>
                      {language === "es" ? "Ver" : "View"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* AI Empty Banner */}
        {!hasCredits && <AIEmptyBanner />}

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/storefronts")}>
            <Store className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{language === "es" ? "Vitrinas" : "Storefronts"}</p>
          </Card>
          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/orders")}>
            <ShoppingCart className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{language === "es" ? "Órdenes" : "Orders"}</p>
            <p className="text-xs text-muted-foreground">{stats.activeOrders} {language === "es" ? "activas" : "active"}</p>
          </Card>
          <Card className="p-4 hover-calm cursor-pointer" onClick={() => navigate("/crm")}>
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{language === "es" ? "Clientes" : "Customers"}</p>
            <p className="text-xs text-muted-foreground">{stats.totalContacts}</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
