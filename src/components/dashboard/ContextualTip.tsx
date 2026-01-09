import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ContextualTipProps {
  tipKey: string;
  title: string;
  titleEs?: string;
  description: string;
  descriptionEs?: string;
  actionLabel?: string;
  actionLabelEs?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  variant?: "info" | "success" | "warning";
  className?: string;
  delay?: number;
}

export function ContextualTip({
  tipKey,
  title,
  titleEs,
  description,
  descriptionEs,
  actionLabel,
  actionLabelEs,
  onAction,
  onDismiss,
  variant = "info",
  className,
  delay = 0
}: ContextualTipProps) {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(`kitz_tip_${tipKey}`);
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [tipKey, delay]);

  const handleDismiss = () => {
    localStorage.setItem(`kitz_tip_${tipKey}`, "true");
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || !visible) return null;

  const displayTitle = language === "es" && titleEs ? titleEs : title;
  const displayDescription = language === "es" && descriptionEs ? descriptionEs : description;
  const displayAction = language === "es" && actionLabelEs ? actionLabelEs : actionLabel;

  const variantStyles = {
    info: "border-primary/20 bg-primary/5",
    success: "border-success/20 bg-success/5",
    warning: "border-action/20 bg-action/5"
  };

  const iconColors = {
    info: "text-primary",
    success: "text-success",
    warning: "text-action"
  };

  return (
    <Card className={cn(
      "animate-fade-in border",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            variant === "info" && "bg-primary/10",
            variant === "success" && "bg-success/10",
            variant === "warning" && "bg-action/10"
          )}>
            <Lightbulb className={cn("w-4 h-4", iconColors[variant])} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm text-foreground">{displayTitle}</h4>
              <button 
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {displayDescription}
            </p>
            
            {onAction && displayAction && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  onAction();
                  handleDismiss();
                }}
                className="mt-2 h-7 px-2 text-xs gap-1"
              >
                {displayAction}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to get contextual tips based on user behavior
export function useContextualTips(stats: {
  products: number;
  storefronts: number;
  customers: number;
  hasGoals: boolean;
  profileComplete: boolean;
}) {
  const tips: Array<{
    key: string;
    title: string;
    titleEs: string;
    description: string;
    descriptionEs: string;
    actionLabel: string;
    actionLabelEs: string;
    route: string;
    variant: "info" | "success" | "warning";
    show: boolean;
  }> = [];

  if (stats.products === 0) {
    tips.push({
      key: "first_product",
      title: "Create your first product",
      titleEs: "Crea tu primer producto",
      description: "Products let you quickly create storefronts. Add one now to speed up your sales process!",
      descriptionEs: "Los productos te permiten crear vitrinas rápidamente. ¡Añade uno para acelerar tus ventas!",
      actionLabel: "Add Product",
      actionLabelEs: "Añadir Producto",
      route: "/products",
      variant: "info",
      show: true
    });
  }

  if (stats.storefronts === 0 && stats.products > 0) {
    tips.push({
      key: "first_storefront",
      title: "Share your first storefront",
      titleEs: "Comparte tu primera vitrina",
      description: "You have products ready! Create a storefront to share with customers and start selling.",
      descriptionEs: "¡Tienes productos listos! Crea una vitrina para compartir con clientes y empieza a vender.",
      actionLabel: "Create Storefront",
      actionLabelEs: "Crear Vitrina",
      route: "/storefronts",
      variant: "warning",
      show: true
    });
  }

  if (!stats.hasGoals && stats.storefronts > 0) {
    tips.push({
      key: "set_goals",
      title: "Set your weekly goals",
      titleEs: "Establece tus metas semanales",
      description: "Businesses with goals grow 3x faster. Set your first WIG (Wildly Important Goal)!",
      descriptionEs: "Los negocios con metas crecen 3x más rápido. ¡Establece tu primer objetivo WIG!",
      actionLabel: "Set Goals",
      actionLabelEs: "Establecer Metas",
      route: "/dashboard",
      variant: "success",
      show: true
    });
  }

  if (!stats.profileComplete) {
    tips.push({
      key: "complete_profile",
      title: "Complete your profile",
      titleEs: "Completa tu perfil",
      description: "A complete profile builds trust with customers. Add your logo, phone, and payment methods.",
      descriptionEs: "Un perfil completo genera confianza. Añade tu logo, teléfono y métodos de pago.",
      actionLabel: "Edit Profile",
      actionLabelEs: "Editar Perfil",
      route: "/profile",
      variant: "info",
      show: true
    });
  }

  return tips.filter(t => t.show);
}
