import { ReactNode, forwardRef } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  progress: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  progress,
  isRefreshing,
  isPulling,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-200"
      style={{
        top: 0,
        height: `${pullDistance}px`,
        opacity: isPulling || isRefreshing ? 1 : 0,
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-background shadow-lg border border-border/50 transition-all duration-200",
          progress >= 1 && !isRefreshing && "bg-primary text-primary-foreground scale-110"
        )}
        style={{
          transform: `rotate(${progress * 180}deg)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <ArrowDown
            className={cn(
              "w-5 h-5 transition-colors",
              progress >= 1 ? "text-primary-foreground" : "text-muted-foreground"
            )}
          />
        )}
      </div>
    </div>
  );
}

interface PullToRefreshContainerProps {
  children: ReactNode;
  pullDistance: number;
  className?: string;
}

export const PullToRefreshContainer = forwardRef<HTMLDivElement, PullToRefreshContainerProps>(
  ({ children, pullDistance, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-y-auto overflow-x-hidden", className)}
        style={{
          paddingTop: pullDistance > 0 ? `${pullDistance}px` : undefined,
          transition: pullDistance === 0 ? "padding-top 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    );
  }
);

PullToRefreshContainer.displayName = "PullToRefreshContainer";
