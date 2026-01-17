import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Package, Users, Scissors, Image, ShoppingBag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const consultantNavItems = [
  { icon: LayoutDashboard, labelKey: "home" as const, path: "/dashboard" },
  { icon: Users, labelKey: "consultant" as const, path: "/consultant" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: History, labelKey: "orders" as const, path: "/order-history" },
];

const barbershopNavItems = [
  { icon: LayoutDashboard, labelKey: "panel" as const, path: "/barbershop" },
  { icon: Scissors, labelKey: "services" as const, path: "/barbershop?tab=services" },
  { icon: Image, labelKey: "gallery" as const, path: "/barbershop?tab=gallery" },
  { icon: ShoppingBag, labelKey: "products" as const, path: "/barbershop?tab=products" },
  { icon: Users, labelKey: "contacts" as const, path: "/barbershop?tab=contacts" },
];

export function MobileNav() {
  const location = useLocation();
  const { t, language } = useLanguage();

  const isBarbershop = location.pathname.startsWith("/barbershop");
  const navItems = isBarbershop ? barbershopNavItems : consultantNavItems;

  // Custom labels for nav items
  const getLabel = (labelKey: string) => {
    if (labelKey === "consultant") {
      return language === "es" ? "Mi Trabajo" : "My Work";
    }
    if (labelKey === "panel") {
      return language === "es" ? "Inicio" : "Home";
    }
    if (labelKey === "services") {
      return language === "es" ? "Servicios" : "Services";
    }
    if (labelKey === "gallery") {
      return language === "es" ? "Galería" : "Gallery";
    }
    if (labelKey === "contacts") {
      return language === "es" ? "Clientes" : "Clients";
    }
    return (t as any)[labelKey] || labelKey;
  };

  // Check if nav item is active
  const isItemActive = (item: typeof navItems[0]) => {
    if (isBarbershop) {
      const searchParams = new URLSearchParams(location.search);
      const currentTab = searchParams.get("tab");
      
      if (item.path === "/barbershop" && !currentTab) return true;
      if (item.path.includes("?tab=")) {
        const itemTab = new URLSearchParams(item.path.split("?")[1]).get("tab");
        return currentTab === itemTab;
      }
      return false;
    }
    return location.pathname === item.path;
  };

  // Theme-aware colors
  const activeColor = isBarbershop ? "text-barbershop-cta" : "text-primary";
  const activeBg = isBarbershop ? "bg-barbershop-cta/10" : "bg-primary/10";
  const activeIconBg = isBarbershop ? "bg-barbershop-cta/15" : "bg-primary/15";

  return (
    <nav className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border/30 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = isItemActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 flex-1 min-w-0",
                isActive
                  ? `${activeColor} ${activeBg}`
                  : "text-muted-foreground active:text-foreground active:scale-95 active:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isActive && activeIconBg
              )}>
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "stroke-[2.5px]"
                  )} 
                />
              </div>
              <span className={cn(
                "text-[10px] transition-all leading-tight truncate max-w-full",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {getLabel(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}