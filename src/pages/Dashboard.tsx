import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumScore } from "@/components/dashboard/MomentumScore";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
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

export default function Dashboard() {
  const handleAction = (action: string) => {
    toast.success(`${action} — done!`);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Good morning</h1>
          <p className="text-muted-foreground mt-1">Here's what needs your attention today.</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attention Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Needs attention
            </h2>
            {attentionItems.map((item, index) => (
              <AttentionCard
                key={item.id}
                {...item}
                delay={index * 100}
                onAction={() => handleAction(item.action)}
              />
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MomentumScore score={72} />
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
