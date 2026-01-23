import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EarningsToday } from "@/components/dashboard/EarningsToday";
import { ProfileShareButton } from "@/components/dashboard/ProfileShareButton";
import { ContextualTip, useContextualTips } from "@/components/dashboard/ContextualTip";
import { ProfileSetupWizard } from "@/components/onboarding/ProfileSetupWizard";
import { QuickStartChecklist } from "@/components/onboarding/QuickStartChecklist";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useAutoDemo } from "@/hooks/useAutoDemo";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Plus, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Storefront {
  id: string;
  title: string;
  price: number;
  status: string;
  customer_name: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  type: "payment" | "message" | "order" | "customer" | "storefront";
  message: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { demoCreated } = useAutoDemo();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [hasGoals, setHasGoals] = useState(false);

  // Check if user needs profile setup (minimal friction)
  useEffect(() => {
    const hasCompletedProfileSetup = localStorage.getItem("kitz_profile_setup_complete");
    const isProfileIncomplete = profile && (!profile.phone || !profile.username);
    
    // Only show profile setup after user has created something
    if (!hasCompletedProfileSetup && isProfileIncomplete && storefronts.length > 1) {
      setShowProfileSetup(true);
    }
  }, [profile, storefronts.length]);

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    const [sfResult, actResult, prodResult, custResult, goalsResult] = await Promise.all([
      supabase
        .from("storefronts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("user_goals").select("id").limit(1)
    ]);

    if (sfResult.data) {
      setStorefronts(sfResult.data);
    }

    if (actResult.data) {
      setActivities(actResult.data.map(a => ({
        ...a,
        type: a.type as Activity["type"]
      })));
    }

    setProductCount(prodResult.count || 0);
    setCustomerCount(custResult.count || 0);
    setHasGoals((goalsResult.data?.length || 0) > 0);

    setLoading(false);
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await fetchData();
    toast.success(language === "es" ? "Actualizado" : "Refreshed");
  }, [fetchData, language]);

  const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const paidStorefronts = storefronts.filter(s => s.status === "paid");
  const draftStorefronts = storefronts.filter(s => s.status === "draft");
  const sentStorefronts = storefronts.filter(s => s.status === "sent");

  const today = new Date().toDateString();
  const todaysPaid = paidStorefronts.filter(
    s => new Date(s.created_at).toDateString() === today
  );
  const todaysEarnings = todaysPaid.map(s => ({
    id: s.id,
    customer: s.customer_name || "Customer",
    amount: s.price,
    time: getRelativeTime(s.created_at)
  }));
  const totalToday = todaysEarnings.reduce((sum, e) => sum + e.amount, 0);

  // Total balance (all time paid)
  const totalBalance = paidStorefronts.reduce((sum, s) => sum + s.price, 0);
  
  // Calculate change from yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const yesterdaysPaid = paidStorefronts.filter(
    s => new Date(s.created_at).toDateString() === yesterdayStr
  );
  const yesterdaysTotal = yesterdaysPaid.reduce((sum, s) => sum + s.price, 0);
  const changePercent = yesterdaysTotal > 0 
    ? ((totalToday - yesterdaysTotal) / yesterdaysTotal * 100).toFixed(0)
    : totalToday > 0 ? "+100" : "0";

  const calculateMomentum = () => {
    let score = 50;
    if (storefronts.length === 0) return 50;
    
    score += Math.min(paidStorefronts.length * 5, 20);
    score += Math.min(sentStorefronts.length * 3, 15);
    score -= Math.min(draftStorefronts.length * 5, 15);
    const todayActivities = activities.filter(
      a => new Date(a.created_at).toDateString() === today
    ).length;
    score += Math.min(todayActivities * 2, 10);

    return Math.max(0, Math.min(100, score));
  };

  const getAttentionItems = () => {
    const items: Array<{
      id: string;
      type: "payment" | "followup" | "confirm" | "urgent";
      title: string;
      description: string;
      action: string;
      onAction: () => void;
    }> = [];

    // Awaiting payment items (use orange for pending state)
    sentStorefronts.slice(0, 3).forEach(sf => {
      items.push({
        id: `sent-${sf.id}`,
        type: "payment",
        title: language === "es" ? "Esperando pago" : "Awaiting payment",
        description: `${sf.customer_name || "Customer"} — $${sf.price.toFixed(2)}`,
        action: t.sendReminder,
        onAction: () => {
          toast.success(language === "es" ? "Recordatorio enviado" : "Reminder sent");
        }
      });
    });

    if (items.length === 0 && storefronts.length > 0) {
      return null;
    }

    return items.slice(0, 3);
  };

  const attentionItems = getAttentionItems();

  const formattedActivities = activities.slice(0, 5).map(a => ({
    id: a.id,
    message: a.message,
    time: getRelativeTime(a.created_at),
    type: a.type
  }));

  function getRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "es" ? "Ahora" : "Just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  // Contextual tips based on user stats
  const profileComplete = !!(profile?.phone && profile?.logo_url && profile?.username);
  const contextualTips = useContextualTips({
    products: productCount,
    storefronts: storefronts.length,
    customers: customerCount,
    hasGoals,
    profileComplete
  });

  const isPositiveChange = parseFloat(changePercent) >= 0;

  if (loading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProfileSetupWizard open={showProfileSetup} onComplete={handleProfileSetupComplete} />
      
      <div ref={containerRef} className="relative">
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          progress={progress}
          isRefreshing={isRefreshing}
          isPulling={isPulling}
        />
        
        <div className="space-y-5">
          {/* Header with primary action */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              {t.dashboard}
            </h1>
            <Button 
              onClick={() => navigate("/storefronts")} 
              size="sm"
              className="gap-1.5 animate-calm-in"
            >
              <Plus className="w-4 h-4" />
              {language === "es" ? "Nuevo" : "New"}
            </Button>
          </div>

          {/* Quick Start Checklist - Shows for new users */}
          <QuickStartChecklist 
            hasProducts={productCount > 0}
            hasStorefronts={storefronts.length > 0}
            hasSentStorefronts={sentStorefronts.length > 0 || paidStorefronts.length > 0}
          />

          {/* Balance Card - Primary focus */}
          <div className="bg-primary rounded-2xl p-6 text-primary-foreground animate-calm-in hover-calm">
            <p className="text-sm text-primary-foreground/70 mb-1">
              {language === "es" ? "Balance Total" : "Total Balance"}
            </p>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl font-semibold tracking-tight">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isPositiveChange ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{changePercent}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  <span>{changePercent}%</span>
                </div>
              )}
              <span className="text-primary-foreground/60">
                {language === "es" ? "vs ayer" : "vs yesterday"}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-sm hover-calm" style={{ animationDelay: "50ms" }}>
              <p className="text-xs text-muted-foreground mb-1">
                {language === "es" ? "Hoy" : "Today"}
              </p>
              <p className="text-2xl font-semibold text-foreground">${totalToday.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {todaysPaid.length} {language === "es" ? "órdenes" : "orders"}
              </p>
            </div>
            <div 
              className="bg-card rounded-2xl p-4 shadow-sm hover-calm cursor-pointer" 
              style={{ animationDelay: "100ms" }}
              onClick={() => navigate("/storefronts")}
            >
              <p className="text-xs text-muted-foreground mb-1">
                {language === "es" ? "Listos para enviar" : "Ready to send"}
              </p>
              <p className="text-2xl font-semibold text-foreground">{draftStorefronts.length}</p>
              <p className="text-xs text-primary flex items-center gap-1 mt-1">
                {language === "es" ? "Ver" : "View"} <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* Attention Section - Only show if items exist */}
          {attentionItems && attentionItems.length > 0 && (
            <section className="space-y-3 animate-calm-in" style={{ animationDelay: "150ms" }}>
              <h2 className="text-sm font-medium text-foreground">
                {language === "es" ? "Pendiente" : "Pending"}
              </h2>
              <div className="space-y-2">
                {attentionItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={item.onAction}
                    className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover-calm touch-feedback"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-action/10 flex items-center justify-center">
                      <Circle className="w-4 h-4 text-action fill-action" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Calm state when nothing needs attention */}
          {attentionItems === null && storefronts.length > 0 && (
            <div className="bg-card rounded-2xl p-6 text-center shadow-sm animate-calm-in">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <p className="font-medium text-foreground text-sm">{t.allCaughtUp}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.businessRunningSmooth}
              </p>
            </div>
          )}

          {/* Contextual Tips - Max 1 at a time for calm UX */}
          {contextualTips.length > 0 && (
            <div className="animate-calm-in" style={{ animationDelay: "200ms" }}>
              <ContextualTip
                key={contextualTips[0].key}
                tipKey={contextualTips[0].key}
                title={contextualTips[0].title}
                titleEs={contextualTips[0].titleEs}
                description={contextualTips[0].description}
                descriptionEs={contextualTips[0].descriptionEs}
                actionLabel={contextualTips[0].actionLabel}
                actionLabelEs={contextualTips[0].actionLabelEs}
                onAction={() => navigate(contextualTips[0].route)}
                variant={contextualTips[0].variant}
              />
            </div>
          )}

          {/* Activity Feed - Minimal */}
          {formattedActivities.length > 0 && (
            <div className="animate-calm-in" style={{ animationDelay: "250ms" }}>
              <ActivityFeed activities={formattedActivities.slice(0, 3)} />
            </div>
          )}

          {/* Momentum + Earnings - Simplified grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-calm-in" style={{ animationDelay: "300ms" }}>
            <MomentumScore score={calculateMomentum()} />
            <EarningsToday earnings={todaysEarnings} total={totalToday} />
          </div>

          {/* Share profile - subtle placement */}
          <div className="flex justify-center pt-2 animate-calm-in" style={{ animationDelay: "350ms" }}>
            <ProfileShareButton />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}