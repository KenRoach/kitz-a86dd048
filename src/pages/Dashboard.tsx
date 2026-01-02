import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EarningsToday } from "@/components/dashboard/EarningsToday";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Plus, ArrowUpRight } from "lucide-react";
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
  const navigate = useNavigate();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
        title: "Complete storefront",
        description: `"${sf.title}" is ready to share`,
        action: "Share now",
        onAction: async () => {
          await supabase.from("storefronts").update({ status: "sent" }).eq("id", sf.id);
          toast.success("Storefront shared!");
          fetchData();
        }
      });
    });

    sentStorefronts.slice(0, 2 - items.length).forEach(sf => {
      items.push({
        id: `sent-${sf.id}`,
        type: "payment",
        title: "Awaiting payment",
        description: `${sf.customer_name || "Customer"} — ${sf.title} ($${sf.price.toFixed(2)})`,
        action: "Send reminder",
        onAction: () => {
          toast.success("Reminder sent!");
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

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Hero Balance Section */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <p className="text-muted-foreground text-xs md:text-sm font-medium uppercase tracking-wider">
                {getGreeting()}
              </p>
              <h1 className="text-lg md:text-xl font-semibold text-foreground mt-0.5 md:mt-1">
                {profile?.business_name || "Dashboard"}
              </h1>
            </div>
            <Button onClick={() => navigate("/storefronts")} size="sm" className="gap-1.5 md:gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>

          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl md:rounded-3xl p-5 md:p-8 text-primary-foreground shadow-glow animate-glow-pulse">
            <p className="text-primary-foreground/70 text-xs md:text-sm font-medium mb-1 md:mb-2">Total Balance</p>
            <div className="flex items-end gap-2 md:gap-4 mb-3 md:mb-4">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isPositiveChange ? (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 md:px-3 md:py-1">
                  <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">+{changePercent}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 md:px-3 md:py-1">
                  <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">{changePercent}%</span>
                </div>
              )}
              <span className="text-primary-foreground/70 text-xs md:text-sm">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="neu-card-flat p-4 md:p-5">
            <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider mb-0.5 md:mb-1">Today</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">${totalToday.toFixed(2)}</p>
            <p className="text-[10px] md:text-xs text-success mt-0.5 md:mt-1">{todaysPaid.length} orders</p>
          </div>
          <div className="neu-card-flat p-4 md:p-5">
            <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider mb-0.5 md:mb-1">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{sentStorefronts.length}</p>
            <p className="text-[10px] md:text-xs text-attention mt-0.5 md:mt-1">awaiting</p>
          </div>
          <div className="neu-card-flat p-4 md:p-5">
            <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider mb-0.5 md:mb-1">Drafts</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{draftStorefronts.length}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">to complete</p>
          </div>
          <div className="neu-card-flat p-4 md:p-5">
            <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider mb-0.5 md:mb-1">Completed</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{paidStorefronts.length}</p>
            <p className="text-[10px] md:text-xs text-success mt-0.5 md:mt-1">all time</p>
          </div>
        </div>

        {/* Needs Attention */}
        {attentionItems && attentionItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
              <span className="text-xs text-muted-foreground">{attentionItems.length} items</span>
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
            <p className="text-foreground font-semibold">All caught up</p>
            <p className="text-sm text-muted-foreground mt-1">
              Business is running smoothly
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
          <div className="neu-card-flat p-10 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ArrowUpRight className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Start selling</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first storefront and share it with customers to get paid
            </p>
            <Button onClick={() => navigate("/storefronts")} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create storefront
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}