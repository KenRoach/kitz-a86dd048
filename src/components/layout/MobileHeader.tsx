import { Moon, Sun, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, getGreeting } = useLanguage();
  const location = useLocation();

  const isBarbershop = location.pathname.startsWith("/barbershop");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <header className={cn(
      "md:hidden shrink-0 shadow-md",
      isBarbershop ? "bg-barbershop-header" : "bg-consultant-header"
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            isBarbershop ? "text-barbershop-cta" : "text-consultant-cta"
          )}>
            {getGreeting()}
          </p>
          <p className={cn(
            "text-lg font-bold truncate leading-tight",
            isBarbershop ? "text-barbershop-section" : "text-consultant-section"
          )}>
            {profile?.business_name || "My Business"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/settings"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
              isBarbershop 
                ? "text-barbershop-section/70 hover:text-barbershop-cta hover:bg-barbershop-section/10" 
                : "text-consultant-section/70 hover:text-consultant-cta hover:bg-consultant-section/10"
            )}
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={toggleLanguage}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
              isBarbershop 
                ? "text-barbershop-section/70 hover:text-barbershop-section hover:bg-barbershop-section/10" 
                : "text-consultant-section/70 hover:text-consultant-section hover:bg-consultant-section/10"
            )}
            title={language === "en" ? "Español" : "English"}
          >
            <span className="text-[10px] font-bold">{language === "en" ? "ES" : "EN"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
              isBarbershop 
                ? "text-barbershop-section/70 hover:text-barbershop-section hover:bg-barbershop-section/10" 
                : "text-consultant-section/70 hover:text-consultant-section hover:bg-consultant-section/10"
            )}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
              isBarbershop 
                ? "text-barbershop-section/70 hover:text-barbershop-accent hover:bg-barbershop-accent/10" 
                : "text-consultant-section/70 hover:text-consultant-accent hover:bg-consultant-accent/10"
            )}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}