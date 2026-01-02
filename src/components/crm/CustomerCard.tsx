import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type CustomerLifecycle = "lead" | "active" | "repeat";

interface CustomerCardProps {
  id: string;
  name: string;
  lastInteraction: string;
  totalSpent: string;
  lifecycle: CustomerLifecycle;
  tags: string[];
  onClick?: () => void;
  delay?: number;
}

const lifecycleColors = {
  lead: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  repeat: "bg-success/10 text-success",
};

export function CustomerCard({
  name,
  lastInteraction,
  totalSpent,
  lifecycle,
  tags,
  onClick,
  delay = 0,
}: CustomerCardProps) {
  return (
    <div
      className="action-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-foreground">{name}</h4>
            <span className={cn("status-badge", lifecycleColors[lifecycle])}>
              {lifecycle}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{lastInteraction}</p>
          <div className="flex items-center gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total spent</p>
            <p className="font-semibold text-foreground">{totalSpent}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
