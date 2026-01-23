import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Package, ShoppingBag, Share2, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickStartChecklistProps {
  hasProducts: boolean;
  hasStorefronts: boolean;
  hasSentStorefronts: boolean;
}

const STORAGE_KEY = "kitz_quickstart_dismissed";

export function QuickStartChecklist({ 
  hasProducts, 
  hasStorefronts, 
  hasSentStorefronts 
}: QuickStartChecklistProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const steps = [
    {
      id: "product",
      icon: Package,
      titleEn: "Add a product",
      titleEs: "Agrega un producto",
      completed: hasProducts,
      action: () => navigate("/products"),
    },
    {
      id: "storefront",
      icon: ShoppingBag,
      titleEn: "Create a storefront",
      titleEs: "Crea una vitrina",
      completed: hasStorefronts,
      action: () => navigate("/storefronts"),
    },
    {
      id: "share",
      icon: Share2,
      titleEn: "Share your link",
      titleEs: "Comparte tu enlace",
      completed: hasSentStorefronts,
      action: () => navigate("/storefronts"),
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const allComplete = completedCount === steps.length;
  const currentStep = steps.find(s => !s.completed);

  // Auto-dismiss after all complete + 3 seconds
  useEffect(() => {
    if (allComplete && !isDismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, isDismissed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  };

  // Don't show if dismissed or all complete
  if (isDismissed) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden animate-calm-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            allComplete ? "bg-success/10" : "bg-primary/10"
          )}>
            {allComplete ? (
              <Sparkles className="w-4 h-4 text-success" />
            ) : (
              <span className="text-xs font-semibold text-primary">
                {completedCount}/{steps.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {allComplete 
                ? (language === "es" ? "¡Listo para vender!" : "Ready to sell!")
                : (language === "es" ? "Empieza aquí" : "Start here")
              }
            </h3>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pb-4 space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = currentStep?.id === step.id;
          
          return (
            <div
              key={step.id}
              onClick={!step.completed ? step.action : undefined}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                step.completed 
                  ? "bg-success/5" 
                  : isCurrent
                    ? "bg-primary/5 cursor-pointer hover:bg-primary/10"
                    : "bg-muted/30 opacity-60"
              )}
            >
              {/* Step indicator */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                step.completed 
                  ? "bg-success/10" 
                  : isCurrent
                    ? "bg-primary/10"
                    : "bg-muted"
              )}>
                {step.completed ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Icon className={cn(
                    "w-4 h-4",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  step.completed 
                    ? "text-muted-foreground line-through" 
                    : "text-foreground"
                )}>
                  <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
                  {language === "es" ? step.titleEs : step.titleEn}
                </p>
              </div>

              {/* Action button for current step */}
              {isCurrent && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                >
                  {language === "es" ? "Ir" : "Go"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
