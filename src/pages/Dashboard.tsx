import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EarningsToday } from "@/components/dashboard/EarningsToday";
import { ProfileShareButton } from "@/components/dashboard/ProfileShareButton";
import { FourDXWidget } from "@/components/dashboard/FourDXWidget";
import { ProgressChecklist } from "@/components/dashboard/ProgressChecklist";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { SpotlightTour } from "@/components/onboarding/SpotlightTour";
import { ProfileSetupWizard } from "@/components/onboarding/ProfileSetupWizard";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { BusinessAdvisor } from "@/components/advisor/BusinessAdvisor";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Rocket, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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
  const { t, getGreeting, language } = useLanguage();
  const navigate = useNavigate();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSpotlightTour, setShowSpotlightTour] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Check if user needs profile setup or feature tour
  useEffect(() => {
    const hasCompletedProfileSetup = localStorage.getItem("kitz_profile_setup_complete");
    const hasSeenOnboarding = localStorage.getItem("kitz_onboarding_complete");
    const hasSeenSpotlightTour = localStorage.getItem("kitz_spotlight_tour_complete");
    
    // Check if profile is incomplete (missing phone or username)
    const isProfileIncomplete = profile && (!profile.phone || !profile.username);
    
    if (!hasCompletedProfileSetup && isProfileIncomplete) {
      setShowProfileSetup(true);
    } else if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    } else if (!hasSeenSpotlightTour) {
      // Show spotlight tour after onboarding dialog
      setShowSpotlightTour(true);
    }
  }, [profile]);

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    // Show feature tour after profile setup
    const hasSeenOnboarding = localStorage.getItem("kitz_onboarding_complete");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("kitz_onboarding_complete", "true");
    setShowOnboarding(false);
    // Start spotlight tour after onboarding
    const hasSeenSpotlightTour = localStorage.getItem("kitz_spotlight_tour_complete");
    if (!hasSeenSpotlightTour) {
      setTimeout(() => setShowSpotlightTour(true), 500);
    }
  };

  const handleSpotlightTourComplete = () => {
    localStorage.setItem("kitz_spotlight_tour_complete", "true");
    setShowSpotlightTour(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    const { data: sfData } = await supabase
      .from("storefronts")
      .select("*")
      .order("created_at", { ascending: false });

    if (sfData) {
      setStorefronts(sfData);
    }

    const { data: actData } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (actData) {
      setActivities(actData.map(a => ({
        ...a,
        type: a.type as Activity["type"]
      })));
    }

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
      <OnboardingDialog open={showOnboarding} onComplete={handleOnboardingComplete} />
      <SpotlightTour open={showSpotlightTour} onComplete={handleSpotlightTourComplete} />
      
      <div ref={containerRef} className="relative">
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          progress={progress}
          isRefreshing={isRefreshing}
          isPulling={isPulling}
        />
        
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t.dashboard}
            </h1>
          </div>
          <ProfileShareButton />
        </div>

        {/* Balance Card - Purple gradient */}
        <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "es" ? "Hoy" : "Today"}
            </p>
            <p className="text-2xl font-semibold text-foreground">${totalToday.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysPaid.length} {language === "es" ? "órdenes" : "orders"}
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "es" ? "Borradores" : "Drafts"}
            </p>
            <p className="text-2xl font-semibold text-foreground">{draftStorefronts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "pendientes" : "pending"}
            </p>
          </div>
        </div>

        {/* Progress Checklist */}
        <ProgressChecklist />

        {/* Attention Section */}
        {attentionItems && attentionItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">
              {language === "es" ? "Requiere atención" : "Needs attention"}
            </h2>
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={item.onAction}
                  className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-action/10 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-action fill-action" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Calm state when nothing needs attention */}
        {attentionItems === null && (
          <div className="bg-card rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <p className="font-medium text-foreground">{t.allCaughtUp}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t.businessRunningSmooth}
            </p>
          </div>
        )}

        {/* 4DX Goals + Momentum + Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FourDXWidget />
          <MomentumScore score={calculateMomentum()} />
          <EarningsToday earnings={todaysEarnings} total={totalToday} />
        </div>

        {/* Activity Feed */}
        {formattedActivities.length > 0 && (
          <ActivityFeed activities={formattedActivities} />
        )}

        {/* Empty state for new users */}
        {!loading && storefronts.length === 0 && (
          <EmptyState
            icon={Rocket}
            title={t.startSelling}
            description={t.createFirstStorefront}
            actionLabel={t.createStorefront}
            onAction={() => navigate("/storefronts")}
            tips={[
              language === "es" ? "Crea una vitrina en menos de 30 segundos" : "Create a storefront in under 30 seconds",
              language === "es" ? "Comparte al instante por WhatsApp" : "Share instantly via WhatsApp",
              language === "es" ? "Recibe notificaciones cuando ordenen" : "Get notified when customers order"
            ]}
          />
        )}
        </div>
      </div>
      
      <BusinessAdvisor />
    </AppLayout>
  );
}