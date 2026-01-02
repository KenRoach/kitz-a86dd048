import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EarningsToday } from "@/components/dashboard/EarningsToday";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const attentionItems = [
  {
    id: "1",
    type: "payment" as const,
    title: "Payment pending",
    description: "Carlos hasn't completed payment for Chicken Bowl",
    action: "Send reminder",
  },
  {
    id: "2",
    type: "followup" as const,
    title: "Follow up with Maria",
    description: "Last order was 2 weeks ago — she usually orders weekly",
    action: "Send message",
  },
  {
    id: "3",
    type: "confirm" as const,
    title: "Confirm new order",
    description: "Sandra wants 24 cupcakes for Friday pickup",
    action: "Confirm order",
  },
];

const activities = [
  { id: "1", message: "Payment received from Ana — $24.50", time: "2 min ago", type: "payment" as const },
  { id: "2", message: "New message from Pedro", time: "15 min ago", type: "message" as const },
  { id: "3", message: "Order completed for Luis", time: "1 hour ago", type: "order" as const },
  { id: "4", message: "New customer: Sofia Martinez", time: "2 hours ago", type: "customer" as const },
];

const todayEarnings = [
  { id: "1", customer: "Ana Rodriguez", amount: 24.50, time: "2 min ago" },
  { id: "2", customer: "Pedro Garcia", amount: 36.00, time: "1 hour ago" },
  { id: "3", customer: "Luis Mendez", amount: 45.00, time: "3 hours ago" },
];

export default function Dashboard() {
  const { profile } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleAction = (action: string) => {
    toast.success(`${action} — done!`);
  };

  const totalToday = todayEarnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* 1. Greeting and Context */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}{profile?.business_name ? `, ${profile.business_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what needs your attention today.
          </p>
        </div>

        {/* 2. Needs Attention — max 3 items */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Needs attention
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {attentionItems.slice(0, 3).map((item, index) => (
              <AttentionCard
                key={item.id}
                {...item}
                delay={index * 100}
                onAction={() => handleAction(item.action)}
              />
            ))}
          </div>
        </section>

        {/* 3. Momentum + 4. Earnings (Today) — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MomentumScore score={72} />
          <EarningsToday earnings={todayEarnings} total={totalToday} />
        </div>

        {/* 5. Activity Feed */}
        <section>
          <ActivityFeed activities={activities} />
        </section>
      </div>
    </AppLayout>
  );
}
