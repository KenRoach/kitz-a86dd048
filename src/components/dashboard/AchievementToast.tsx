import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Confetti } from "@/components/ui/Confetti";

interface AchievementToastProps {
  badgeName: string;
  badgeNameEs: string;
  badgeIcon: string;
  featureHint?: string;
  featureHintEs?: string;
  featureRoute?: string;
  onClose: () => void;
  onExplore?: () => void;
}

export function AchievementToast({
  badgeName,
  badgeNameEs,
  badgeIcon,
  featureHint,
  featureHintEs,
  featureRoute,
  onClose,
  onExplore
}: AchievementToastProps) {
  const { language } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const displayName = language === "es" ? badgeNameEs : badgeName;
  const displayHint = language === "es" ? featureHintEs : featureHint;

  return (
    <>
      {showConfetti && <Confetti show={showConfetti} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
        <Card className="w-full max-w-sm border-2 border-primary/20 shadow-2xl animate-scale-in">
          <CardContent className="p-6 text-center">
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Trophy animation */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-3xl">{badgeIcon}</span>
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                {language === "es" ? "¡Logro Desbloqueado!" : "Achievement Unlocked!"}
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              {displayName}
            </h3>

            {displayHint && (
              <div className="bg-muted/50 rounded-xl p-3 mt-4">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{displayHint}</span>
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
              {onExplore && featureRoute && (
                <Button onClick={onExplore} className="flex-1 gap-2">
                  {language === "es" ? "Explorar" : "Explore"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Feature hints for different achievements
export const ACHIEVEMENT_HINTS: Record<string, { hint: string; hintEs: string; route?: string }> = {
  "first_storefront": {
    hint: "Did you know you can create bundles with multiple products? Try it next!",
    hintEs: "¿Sabías que puedes crear paquetes con varios productos? ¡Pruébalo!",
    route: "/storefronts"
  },
  "first_product": {
    hint: "Products can be reused across multiple storefronts. Add more to build your catalog!",
    hintEs: "Los productos se pueden reusar en varias vitrinas. ¡Añade más a tu catálogo!",
    route: "/products"
  },
  "first_sale": {
    hint: "Track your customers in the CRM to build lasting relationships!",
    hintEs: "¡Sigue a tus clientes en el CRM para construir relaciones duraderas!",
    route: "/profile"
  },
  "streak_3": {
    hint: "Try the Pomodoro timer to stay focused and productive!",
    hintEs: "¡Prueba el temporizador Pomodoro para mantenerte enfocado y productivo!",
    route: "/profile"
  },
  "revenue_100": {
    hint: "Use the SWOT analysis tool to plan your next growth phase!",
    hintEs: "¡Usa el análisis FODA para planificar tu próxima fase de crecimiento!",
    route: "/profile"
  }
};
