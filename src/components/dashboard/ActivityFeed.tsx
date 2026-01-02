import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  message: string;
  time: string;
  type: "payment" | "message" | "order" | "customer";
}

interface ActivityFeedProps {
  activities: Activity[];
}

const dotColors = {
  payment: "bg-success",
  message: "bg-primary",
  order: "bg-attention",
  customer: "bg-muted-foreground",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
      <h3 className="text-lg font-medium text-foreground mb-4">Today</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("w-2 h-2 rounded-full mt-2", dotColors[activity.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
