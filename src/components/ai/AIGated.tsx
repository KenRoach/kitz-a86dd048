import { ReactNode, ReactElement, cloneElement, isValidElement } from "react";
import { useAICredits } from "@/hooks/useAICredits";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { useState } from "react";
import { AIRechargeModal } from "./AIRechargeModal";

interface AIGatedProps {
  children: ReactNode;
  /** Override click handler when credits available */
  onAction?: () => void;
  /** Show the ⚡ badge on the element */
  showBadge?: boolean;
  /** Custom class to apply when gated */
  className?: string;
}

/**
 * Wraps any AI-powered UI element.
 * - When credits > 0: renders normally with ⚡ indicator
 * - When credits = 0: greyed out, click triggers recharge modal
 */
export function AIGated({ children, onAction, showBadge = true, className }: AIGatedProps) {
  const { hasCredits } = useAICredits();
  const [showRecharge, setShowRecharge] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasCredits) {
      e.preventDefault();
      e.stopPropagation();
      setShowRecharge(true);
      return;
    }
    onAction?.();
  };

  return (
    <>
      <div
        className={cn(
          "relative inline-flex",
          !hasCredits && "opacity-50 grayscale cursor-not-allowed pointer-events-auto",
          className
        )}
        onClick={!hasCredits ? handleClick : undefined}
      >
        {/* Pass through children, intercepting clicks when gated */}
        <div className={cn(!hasCredits && "pointer-events-none")}>
          {children}
        </div>

        {/* ⚡ AI badge */}
        {showBadge && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] z-10",
              hasCredits
                ? "bg-amber-400 text-amber-900"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Zap className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <AIRechargeModal open={showRecharge} onOpenChange={setShowRecharge} />
    </>
  );
}
