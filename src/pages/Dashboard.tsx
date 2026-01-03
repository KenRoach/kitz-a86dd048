import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EarningsToday } from "@/components/dashboard/EarningsToday";
import { ProfileShareButton } from "@/components/dashboard/ProfileShareButton";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { BusinessAdvisor } from "@/components/advisor/BusinessAdvisor";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Rocket } from "lucide-react";
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
  const { t, getGreeting } = useLanguage();
  const navigate = useNavigate();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("kitz_onboarding_complete");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("kitz_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
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
  };

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
    ? ((totalToday - yesterdaysTotal) / yesterdaysTotal * 100).toFixed(1)
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

    draftStorefronts.slice(0, 1).forEach(sf => {
      items.push({
        id: `draft-${sf.id}`,
        type: "confirm",
        title: t.completeStorefront,
        description: `"${sf.title}" ${t.readyToShare}`,
        action: t.shareNow,
        onAction: async () => {
          await supabase.from("storefronts").update({ status: "sent" }).eq("id", sf.id);
          toast.success(t.sent + "!");
          fetchData();
        }
      });
    });

    sentStorefronts.slice(0, 2 - items.length).forEach(sf => {
      items.push({
        id: `sent-${sf.id}`,
        type: "payment",
        title: t.awaitingPayment,
        description: `${sf.customer_name || "Customer"} — ${sf.title} ($${sf.price.toFixed(2)})`,
        action: t.sendReminder,
        onAction: () => {
          toast.success(t.sent + "!");
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
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
      <OnboardingDialog open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      <div className="space-y-3 md:space-y-6">
        {/* Header with Share */}
        <div className="flex items-center justify-between animate-fade-in">
          {/* Desktop: show greeting */}
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {getGreeting()}
            </p>
            <h1 className="text-lg font-semibold text-foreground mt-0.5">
              {profile?.business_name || "My Business"}
            </h1>
          </div>
          {/* Mobile: empty space for alignment */}
          <div className="md:hidden" />
          <ProfileShareButton />
        </div>

        {/* Hero Balance Section */}
        <div className="animate-fade-in">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-4 md:p-8 text-primary-foreground shadow-glow">
            <p className="text-primary-foreground/70 text-xs font-medium mb-1">{t.totalBalance}</p>
            <div className="flex items-end gap-2 mb-2 md:mb-4">
              <span className="text-3xl md:text-5xl font-bold tracking-tight">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isPositiveChange ? (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-medium">+{changePercent}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                  <TrendingDown className="w-3 h-3" />
                  <span className="text-xs font-medium">{changePercent}%</span>
                </div>
              )}
              <span className="text-primary-foreground/70 text-xs">{t.vsYesterday}</span>
            </div>
          </div>
        </div>

        {/* Stats Row - 2x2 grid on mobile */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-4">
          <div className="neu-card-flat p-3 md:p-5 min-w-0">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide truncate">{t.today}</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">${totalToday.toFixed(2)}</p>
            <p className="text-[10px] text-success mt-0.5">{todaysPaid.length} orders</p>
          </div>
          <div className="neu-card-flat p-3 md:p-5 min-w-0">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide truncate">{t.pending}</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{sentStorefronts.length}</p>
            <p className="text-[10px] text-attention mt-0.5">{t.awaiting}</p>
          </div>
          <div className="neu-card-flat p-3 md:p-5 min-w-0">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide truncate">{t.drafts}</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{draftStorefronts.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.toComplete}</p>
          </div>
          <div className="neu-card-flat p-3 md:p-5 min-w-0">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide truncate">{t.completed}</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-0.5">{paidStorefronts.length}</p>
            <p className="text-[10px] text-success mt-0.5">{t.allTime}</p>
          </div>
        </div>

        {/* Needs Attention */}
        {attentionItems && attentionItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{t.needsAttention}</h2>
              <span className="text-xs text-muted-foreground">{attentionItems.length} {t.items}</span>
            </div>
            <div className="space-y-3">
              {attentionItems.map((item, index) => (
                <AttentionCard
                  key={item.id}
                  {...item}
                  delay={index * 100}
                  onAction={item.onAction}
                />
              ))}
            </div>
          </section>
        )}

        {/* Calm state */}
        {attentionItems === null && (
          <div className="neu-card-flat p-8 text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-success/10 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-foreground font-semibold">{t.allCaughtUp}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t.businessRunningSmooth}
            </p>
          </div>
        )}

        {/* Momentum + Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MomentumScore score={calculateMomentum()} />
          <EarningsToday earnings={todaysEarnings} total={totalToday} />
        </div>

        {/* Activity Feed */}
        {formattedActivities.length > 0 && (
          <section>
            <ActivityFeed activities={formattedActivities} />
          </section>
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
              "Create a storefront in under 30 seconds",
              "Share instantly via WhatsApp or link",
              "Get notified when customers order"
            ]}
          />
        )}
      </div>
      
      <BusinessAdvisor />
    </AppLayout>
  );
}