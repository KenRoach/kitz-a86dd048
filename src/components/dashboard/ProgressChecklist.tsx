import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Package, 
  ShoppingBag, 
  Users, 
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  icon: React.ElementType;
  completed: boolean;
  action: () => void;
  actionLabelEn: string;
  actionLabelEs: string;
}

export function ProgressChecklist() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [stats, setStats] = useState({
    hasProducts: false,
    hasStorefronts: false,
    hasCustomers: false,
    hasGoals: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const [productsRes, storefrontsRes, customersRes, goalsRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("user_goals").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      hasProducts: (productsRes.count || 0) > 0,
      hasStorefronts: (storefrontsRes.count || 0) > 0,
      hasCustomers: (customersRes.count || 0) > 0,
      hasGoals: (goalsRes.count || 0) > 0,
    });
    setLoading(false);
  };

  const isProfileComplete = profile?.phone && profile?.username && profile?.business_name;

  const checklistItems: ChecklistItem[] = [
    {
      id: "profile",
      titleEn: "Complete your profile",
      titleEs: "Completa tu perfil",
      descriptionEn: "Add phone, username, and business name",
      descriptionEs: "Agrega teléfono, usuario y nombre del negocio",
      icon: User,
      completed: !!isProfileComplete,
      action: () => navigate("/profile"),
      actionLabelEn: "Go to Profile",
      actionLabelEs: "Ir al Perfil",
    },
    {
      id: "product",
      titleEn: "Add your first product",
      titleEs: "Agrega tu primer producto",
      descriptionEn: "Create products to sell faster",
      descriptionEs: "Crea productos para vender más rápido",
      icon: Package,
      completed: stats.hasProducts,
      action: () => navigate("/products"),
      actionLabelEn: "Add Product",
      actionLabelEs: "Agregar Producto",
    },
    {
      id: "storefront",
      titleEn: "Create your first storefront",
      titleEs: "Crea tu primera vitrina",
      descriptionEn: "Share a link and start selling",
      descriptionEs: "Comparte un enlace y empieza a vender",
      icon: ShoppingBag,
      completed: stats.hasStorefronts,
      action: () => navigate("/storefronts"),
      actionLabelEn: "Create Storefront",
      actionLabelEs: "Crear Vitrina",
    },
    {
      id: "customer",
      titleEn: "Add a customer",
      titleEs: "Agrega un cliente",
      descriptionEn: "Track your customer relationships",
      descriptionEs: "Rastrea tus relaciones con clientes",
      icon: Users,
      completed: stats.hasCustomers,
      action: () => navigate("/profile?tab=crm"),
      actionLabelEn: "Add Customer",
      actionLabelEs: "Agregar Cliente",
    },
    {
      id: "goals",
      titleEn: "Set your weekly goals",
      titleEs: "Establece tus metas semanales",
      descriptionEn: "Use 4DX to stay focused",
      descriptionEs: "Usa 4DX para mantenerte enfocado",
      icon: Target,
      completed: stats.hasGoals,
      action: () => {
        const widget = document.querySelector('[data-4dx-widget]');
        widget?.scrollIntoView({ behavior: 'smooth' });
      },
      actionLabelEn: "Set Goals",
      actionLabelEs: "Establecer Metas",
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  // Don't show if all complete and user has dismissed
  const dismissedKey = "kitz_checklist_dismissed";
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(dismissedKey) === "true";
  });

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey, "true");
    setIsDismissed(true);
  };

  if (loading || isDismissed) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            allComplete ? "bg-success/10" : "bg-primary/10"
          )}>
            {allComplete ? (
              <Sparkles className="w-5 h-5 text-success" />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-medium text-foreground">
              {allComplete 
                ? (language === "es" ? "¡Todo listo!" : "All set!") 
                : (language === "es" ? "Configura tu negocio" : "Set up your business")
              }
            </h3>
            <p className="text-xs text-muted-foreground">
              {allComplete
                ? (language === "es" ? "Has completado todos los pasos" : "You've completed all steps")
                : (language === "es" 
                    ? `${completedCount} de ${totalCount} pasos completados` 
                    : `${completedCount} of ${totalCount} steps complete`)
              }
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Checklist items */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  item.completed 
                    ? "bg-success/5" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  item.completed ? "bg-success/10" : "bg-background"
                )}>
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    item.completed ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {language === "es" ? item.titleEs : item.titleEn}
                  </p>
                  {!item.completed && (
                    <p className="text-xs text-muted-foreground">
                      {language === "es" ? item.descriptionEs : item.descriptionEn}
                    </p>
                  )}
                </div>
                {!item.completed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={item.action}
                    className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {language === "es" ? item.actionLabelEs : item.actionLabelEn}
                  </Button>
                )}
              </div>
            );
          })}

          {/* Dismiss button when all complete */}
          {allComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-full mt-2 text-muted-foreground"
            >
              {language === "es" ? "Ocultar esta sección" : "Hide this section"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
