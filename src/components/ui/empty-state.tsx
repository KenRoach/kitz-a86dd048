import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tips?: string[];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tips,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 px-6 animate-fade-in", className)}>
      <div className="max-w-sm mx-auto text-center">
        {/* Illustrated icon with decorative elements */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Background glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
          
          {/* Decorative circles */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-primary/15" style={{ animationDelay: "500ms" }} />
          <div className="absolute top-1/2 -right-3 w-2 h-2 rounded-full bg-primary/25" />
          
          {/* Main icon container */}
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary/60" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {description}
        </p>
        
        {/* Tips section */}
        {tips && tips.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Quick tips
            </p>
            <ul className="space-y-1.5">
              {tips.map((tip, index) => (
                <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Action button */}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="gap-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
