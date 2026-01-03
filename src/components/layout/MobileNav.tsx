import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Package, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { icon: LayoutDashboard, labelKey: "home" as const, path: "/dashboard" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: History, labelKey: "orders" as const, path: "/order-history" },
  { icon: Menu, labelKey: "more" as const, path: "/admin" },
];

export function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="shrink-0 bg-background border-t border-border/50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-lg transition-all flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground active:scale-95"
              )}
            >
              <item.icon 
                className={cn(
                  "w-[18px] h-[18px] transition-all",
                  isActive && "stroke-[2.5px]"
                )} 
              />
              <span className={cn(
                "text-[9px] transition-all leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {t[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}