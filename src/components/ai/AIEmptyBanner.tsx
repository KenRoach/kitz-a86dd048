import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatteryWarning, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import { AIRechargeModal } from "./AIRechargeModal";

/**
 * Inline banner shown on AI-dependent screens when credits = 0.
 */
export function AIEmptyBanner() {
  const { language } = useLanguage();
  const [showRecharge, setShowRecharge] = useState(false);
  const isEs = language === "es";

  return (
    <>
      <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <BatteryWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isEs ? "Sin créditos IA" : "Out of AI credits"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isEs
                ? "Recarga para continuar usando funciones de IA."
                : "Recharge to continue using AI features."}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowRecharge(true)} className="gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5" />
            {isEs ? "Recargar" : "Recharge"}
          </Button>
        </div>
      </Card>
      <AIRechargeModal open={showRecharge} onOpenChange={setShowRecharge} />
    </>
  );
}
