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
      className="action-card animate-fade-in p-3 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{name}</h4>
            <span className={cn("status-badge text-[10px] sm:text-xs px-2 py-0.5", lifecycleColors[lifecycle])}>
              {lifecycle}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{lastInteraction}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto scrollbar-hide">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-muted text-muted-foreground rounded-full whitespace-nowrap shrink-0"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Spent</p>
            <p className="font-semibold text-foreground text-sm sm:text-base">{totalSpent}</p>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
