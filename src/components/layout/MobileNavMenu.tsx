import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Settings, Package, CalendarDays, Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import React from "react";

interface MobileNavMenuProps {
  onClose: () => void;
}

const primaryItems = [
  { icon: LayoutDashboard, labelEn: "Home", labelEs: "Inicio", path: "/dashboard" },
  { icon: Store, labelEn: "Storefronts", labelEs: "Vitrinas", path: "/storefronts" },
  { icon: ShoppingCart, labelEn: "Orders", labelEs: "Órdenes", path: "/orders" },
  { icon: Users, labelEn: "Customers", labelEs: "Clientes", path: "/crm" },
];

const secondaryItems = [
  { icon: CalendarDays, labelEn: "Calendar", labelEs: "Calendario", path: "/calendar" },
  { icon: Inbox, labelEn: "Inbox", labelEs: "Bandeja", path: "/inbox" },
  { icon: Package, labelEn: "Products", labelEs: "Productos", path: "/products" },
];

const bottomItems = [
  { icon: Settings, labelEn: "Settings", labelEs: "Ajustes", path: "/settings" },
];

export const MobileNavMenu = React.forwardRef<HTMLDivElement, MobileNavMenuProps>(
  ({ onClose }, ref) => {
    const location = useLocation();
    const { language } = useLanguage();

    const isActive = (path: string) => location.pathname === path;
    const getLabel = (item: { labelEn: string; labelEs: string }) =>
      language === "es" ? item.labelEs : item.labelEn;

    return (
      <div ref={ref} className="pt-2">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {primaryItems.map((item) => {
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

        <div className="border-t border-border/30 pt-3 mb-3 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 pb-1 font-medium">
            {language === "es" ? "Más" : "More"}
          </p>
          {secondaryItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                isActive(item.path)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{getLabel(item)}</span>
            </Link>
          ))}
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
);

MobileNavMenu.displayName = "MobileNavMenu";
