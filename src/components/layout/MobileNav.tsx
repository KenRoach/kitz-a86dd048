import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Package, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { icon: LayoutDashboard, labelKey: "home" as const, path: "/" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: History, labelKey: "orders" as const, path: "/order-history" },
  { icon: Menu, labelKey: "more" as const, path: "/admin" },
];

export function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="sticky top-[61px] z-40 bg-background/98 backdrop-blur-sm border-b border-border/30 md:hidden">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground active:scale-95"
              )}
            >
              <item.icon 
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "stroke-[2.5px]"
                )} 
              />
              <span className={cn(
                "text-[10px] transition-all",
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