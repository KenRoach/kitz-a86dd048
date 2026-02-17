import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, ShoppingCart, BarChart3,
  Settings, Package, Bot, MessageSquare, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface MobileNavMenuProps {
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, labelEn: "Dashboard", labelEs: "Inicio", path: "/dashboard" },
  { icon: Users, labelEn: "CRM", labelEs: "CRM", path: "/crm" },
  { icon: Store, labelEn: "Storefronts", labelEs: "Tiendas", path: "/storefronts" },
  { icon: Bot, labelEn: "AI Agent", labelEs: "Agente IA", path: "/agent" },
  { icon: Package, labelEn: "Products", labelEs: "Productos", path: "/products" },
  { icon: ShoppingCart, labelEn: "Orders", labelEs: "Órdenes", path: "/orders" },
  { icon: BarChart3, labelEn: "Insights", labelEs: "Métricas", path: "/insights" },
  { icon: Lightbulb, labelEn: "Suggestions", labelEs: "Sugerencias", path: "/suggestions" },
];

const bottomItems = [
  { icon: Settings, labelEn: "Settings", labelEs: "Ajustes", path: "/settings" },
];

export function MobileNavMenu({ onClose }: MobileNavMenuProps) {
  const location = useLocation();
  const { language } = useLanguage();

  const isActive = (path: string) => location.pathname === path;
  const getLabel = (item: { labelEn: string; labelEs: string }) =>
    language === "es" ? item.labelEs : item.labelEn;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "bg-muted/50 text-foreground hover:bg-muted active:scale-[0.98]"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm truncate">{getLabel(item)}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border/30 pt-3">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              isActive(item.path)
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{getLabel(item)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
