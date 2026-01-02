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
    // Fetch storefronts
    const { data: sfData } = await supabase
      .from("storefronts")
      .select("*")
      .order("created_at", { ascending: false });

    if (sfData) {
      setStorefronts(sfData);
    }

    // Fetch activities
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

  // Calculate metrics from real data
  const paidStorefronts = storefronts.filter(s => s.status === "paid");
  const draftStorefronts = storefronts.filter(s => s.status === "draft");
  const sentStorefronts = storefronts.filter(s => s.status === "sent");

  // Today's earnings from paid storefronts
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

  // Calculate momentum (0-100)
  const calculateMomentum = () => {
    let score = 50; // Base score
    if (storefronts.length === 0) return 50;
    
    // Bonus for paid storefronts
    score += Math.min(paidStorefronts.length * 5, 20);
    // Bonus for sent storefronts (active links)
    score += Math.min(sentStorefronts.length * 3, 15);
    // Penalty for drafts (unfinished work)
    score -= Math.min(draftStorefronts.length * 5, 15);
    // Bonus for activity today
    const todayActivities = activities.filter(
      a => new Date(a.created_at).toDateString() === today
    ).length;
    score += Math.min(todayActivities * 2, 10);

    return Math.max(0, Math.min(100, score));
  };

  // Generate attention items from real data
  const getAttentionItems = () => {
    const items: Array<{
      id: string;
      type: "payment" | "followup" | "confirm" | "urgent";
      title: string;
      description: string;
      action: string;
      onAction: () => void;
    }> = [];

    // Draft storefronts need to be sent
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

    // Sent storefronts waiting for payment
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

    // If nothing needs attention
    if (items.length === 0 && storefronts.length > 0) {
      return null; // Show calm state
    }

    return items.slice(0, 3);
  };

  const attentionItems = getAttentionItems();

  // Format activities for display
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
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} day${hours >= 48 ? "s" : ""} ago`;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* 1. Greeting and Context */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}{profile?.business_name ? `, ${profile.business_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            {attentionItems === null 
              ? "All caught up. Business is calm."
              : "Here's what needs your attention today."}
          </p>
        </div>

        {/* 2. Needs Attention — max 3 items */}
        {attentionItems && attentionItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Needs attention
            </h2>
            <div className="grid grid-cols-1 gap-4">
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

        {/* Calm state when nothing needs attention */}
        {attentionItems === null && (
          <div className="bg-success/5 border border-success/20 rounded-2xl p-8 text-center animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-foreground font-medium">Everything is on track</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new storefront when you are ready
            </p>
            <button
              onClick={() => navigate("/storefronts")}
              className="suggestion-pill mt-4"
            >
              New storefront
            </button>
          </div>
        )}

        {/* 3. Momentum + 4. Earnings (Today) — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MomentumScore score={calculateMomentum()} />
          <EarningsToday earnings={todaysEarnings} total={totalToday} />
        </div>

        {/* 5. Activity Feed */}
        {formattedActivities.length > 0 && (
          <section>
            <ActivityFeed activities={formattedActivities} />
          </section>
        )}

        {/* Empty state for new users */}
        {!loading && storefronts.length === 0 && (
          <div className="bg-accent/30 rounded-2xl p-8 text-center animate-fade-in">
            <h3 className="text-lg font-medium text-foreground mb-2">Get started</h3>
            <p className="text-muted-foreground mb-4">
              Create your first storefront to start selling
            </p>
            <button
              onClick={() => navigate("/storefronts")}
              className="suggestion-pill"
            >
              Create storefront
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
