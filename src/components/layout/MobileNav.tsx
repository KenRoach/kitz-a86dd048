import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { icon: LayoutDashboard, labelKey: "home" as const, path: "/dashboard" },
  { icon: Users, labelKey: "consultant" as const, path: "/consultant" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: History, labelKey: "orders" as const, path: "/order-history" },
];

export function MobileNav() {
  const location = useLocation();
  const { t, language } = useLanguage();

  // Custom labels for nav items
  const getLabel = (labelKey: string) => {
    if (labelKey === "consultant") {
      return language === "es" ? "Mi Trabajo" : "My Work";
    }
    return (t as any)[labelKey] || labelKey;
  };

  return (
    <nav className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border/30 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 flex-1 min-w-0",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:text-foreground active:scale-95 active:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isActive && "bg-primary/15"
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