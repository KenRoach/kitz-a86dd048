import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  History, 
  Award, 
  Lightbulb,
  ArrowRight,
  X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  selector: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  icon: React.ElementType;
  position: "bottom" | "top" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    selector: '[href="/dashboard"]',
    titleEn: "Dashboard",
    titleEs: "Panel Principal",
    descriptionEn: "Your business at a glance. See earnings, momentum score, and what needs attention.",
    descriptionEs: "Tu negocio de un vistazo. Ve ganancias, puntuación y qué necesita atención.",
    icon: LayoutDashboard,
    position: "right",
  },
  {
    id: "storefronts",
    selector: '[href="/storefronts"]',
    titleEn: "Storefronts",
    titleEs: "Vitrinas",
    descriptionEn: "Create shareable product links in seconds. Send to customers via WhatsApp!",
    descriptionEs: "Crea enlaces de productos en segundos. ¡Envía a clientes por WhatsApp!",
    icon: Store,
    position: "right",
  },
  {
    id: "products",
    selector: '[href="/products"]',
    titleEn: "Products",
    titleEs: "Productos",
    descriptionEn: "Build your product catalog. AI helps with descriptions and pricing.",
    descriptionEs: "Construye tu catálogo. La IA ayuda con descripciones y precios.",
    icon: Package,
    position: "right",
  },
  {
    id: "orders",
    selector: '[href="/order-history"]',
    titleEn: "Order History",
    titleEs: "Historial de Pedidos",
    descriptionEn: "Track all your orders, payments, and fulfillment status.",
    descriptionEs: "Rastrea todos tus pedidos, pagos y estado de entrega.",
    icon: History,
    position: "right",
  },
  {
    id: "profile",
    selector: '[href="/profile"]',
    titleEn: "Your Profile",
    titleEs: "Tu Perfil",
    descriptionEn: "Manage your business info, CRM, productivity tools, and badges.",
    descriptionEs: "Gestiona tu info, CRM, herramientas de productividad y medallas.",
    icon: Award,
    position: "right",
  },
];

interface SpotlightTourProps {
  open: boolean;
  onComplete: () => void;
}

export function SpotlightTour({ open, onComplete }: SpotlightTourProps) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!open) return;
    
    const step = tourSteps[currentStep];
    // On mobile, look for the nav item in mobile nav
    const selector = isMobile 
      ? `nav ${step.selector}` 
      : `aside ${step.selector}`;
    
    const element = document.querySelector(selector) || document.querySelector(step.selector);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [currentStep, open, isMobile]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    
    // Update on interval to catch layout shifts
    const interval = setInterval(updateTargetRect, 100);
    
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
      clearInterval(interval);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!open) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { opacity: 0 };

    const padding = 16;
    const tooltipWidth = 280;
    const tooltipHeight = 200;

    // For mobile, position tooltip above or below the mobile nav
    if (isMobile) {
      return {
        position: "fixed",
        bottom: targetRect.height + padding + 60, // Above the mobile nav
        left: "50%",
        transform: "translateX(-50%)",
        width: tooltipWidth,
        zIndex: 10001,
      };
    }

    // For desktop, position to the right of the sidebar item
    const left = targetRect.right + padding;
    const top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;

    return {
      position: "fixed",
      left: Math.min(left, window.innerWidth - tooltipWidth - padding),
      top: Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding)),
      width: tooltipWidth,
      zIndex: 10001,
    };
  };

  // Calculate spotlight position
  const getSpotlightStyle = (): React.CSSProperties => {
    if (!targetRect) return {};

    const padding = 8;
    return {
      position: "fixed",
      left: targetRect.left - padding,
      top: targetRect.top - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      zIndex: 10000,
    };
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9999] transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          style={getSpotlightStyle()}
          className="rounded-xl ring-4 ring-primary ring-offset-2 ring-offset-transparent bg-transparent pointer-events-none animate-pulse"
        />
      )}

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300"
      >
        {/* Header with step counter */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {language === "es" ? "Tour" : "Tour"} {currentStep + 1}/{tourSteps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {language === "es" ? step.titleEs : step.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "es" ? step.descriptionEs : step.descriptionEn}
              </p>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStep 
                  ? "bg-primary w-4" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-3 pt-0">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="flex-1"
            >
              {language === "es" ? "Anterior" : "Back"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleNext}
            className={cn("gap-1", isFirstStep ? "flex-1" : "flex-[2]")}
          >
            {isLastStep 
              ? (language === "es" ? "¡Empezar!" : "Let's go!") 
              : (language === "es" ? "Siguiente" : "Next")
            }
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
