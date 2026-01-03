import { cn } from "@/lib/utils";
import { DollarSign, MessageCircle, ShoppingBag, User, Store } from "lucide-react";

interface Activity {
  id: string;
  message: string;
  time: string;
  type: "payment" | "message" | "order" | "customer" | "storefront";
}

interface ActivityFeedProps {
  activities: Activity[];
}

const iconMap: Record<Activity["type"], typeof DollarSign> = {
  payment: DollarSign,
  message: MessageCircle,
  order: ShoppingBag,
  customer: User,
  storefront: Store,
};

const colorMap: Record<Activity["type"], string> = {
  payment: "bg-orange-500/10 text-orange-500",
  message: "bg-orange-500/10 text-orange-500",
  order: "bg-orange-500/10 text-orange-500",
  customer: "bg-orange-500/10 text-orange-500",
  storefront: "bg-orange-500/10 text-orange-500",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="neu-card-flat p-6 animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorMap[activity.type])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}