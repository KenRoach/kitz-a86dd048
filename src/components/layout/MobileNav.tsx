import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, Menu, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNavMenu } from "./MobileNavMenu";

export function MobileNav() {
  const location = useLocation();
  const { language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const iconTabs = [
    { icon: LayoutDashboard, path: "/dashboard", label: language === "es" ? "Inicio" : "Home" },
    { icon: Store, path: "/storefronts", label: language === "es" ? "Tiendas" : "Stores" },
  ];

  return (
    <nav className="shrink-0 bg-background/95 backdrop-blur-xl border-t border-border/20 md:hidden safe-area-bottom">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Icon tabs */}
        {iconTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
              aria-label={tab.label}
            >
              <tab.icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
            </Link>
          );
        })}

        {/* Menu button */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                "text-muted-foreground hover:text-foreground active:scale-95"
              )}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8">
            <MobileNavMenu onClose={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Ask Kitz input bar */}
        <Link
          to="/dashboard"
          className="flex-1 flex items-center gap-2 h-10 px-4 rounded-full bg-muted/60 border border-border/30 text-muted-foreground text-sm transition-all hover:bg-muted"
        >
          <span className="truncate">{language === "es" ? "Pregunta a Kitz" : "Ask Kitz"}</span>
        </Link>

        {/* Mic button */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-md active:scale-95 transition-all duration-200"
          aria-label="Voice"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
