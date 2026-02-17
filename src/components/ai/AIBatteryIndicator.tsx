import { useAICredits } from "@/hooks/useAICredits";
import { useLanguage } from "@/hooks/useLanguage";
import { BatteryFull, BatteryLow, BatteryWarning, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AIRechargeModal } from "./AIRechargeModal";

export function AIBatteryIndicator() {
  const { balance, loading } = useAICredits();
  const { language } = useLanguage();
  const [showRecharge, setShowRecharge] = useState(false);

  if (loading) return null;

  const maxCredits = 100; // visual cap for percentage
  const pct = Math.min(Math.round((balance / maxCredits) * 100), 100);
  const isEmpty = balance <= 0;
  const isLow = balance > 0 && balance <= 10;

  const Icon = isEmpty ? BatteryWarning : isLow ? BatteryLow : BatteryFull;

  return (
    <>
      <button
        onClick={() => isEmpty && setShowRecharge(true)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
          isEmpty
            ? "bg-destructive/10 text-destructive cursor-pointer hover:bg-destructive/20"
            : isLow
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        )}
        title={`AI Credits: ${balance}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>
          {isEmpty
            ? (language === "es" ? "IA: 0%" : "AI: 0%")
            : `AI: ${pct}%`
          }
        </span>
        {isEmpty && <Zap className="w-3 h-3 animate-pulse" />}
      </button>
      <AIRechargeModal open={showRecharge} onOpenChange={setShowRecharge} />
    </>
  );
}
