import { Moon, Sun, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Link, useLocation } from "react-router-dom";

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

  // Dynamic theme classes
  const headerBg = isBarbershop ? "bg-barbershop-header" : "bg-consultant-header";
  const ctaColor = isBarbershop ? "text-barbershop-cta" : "text-consultant-cta";
  const sectionColor = isBarbershop ? "text-barbershop-section" : "text-consultant-section";
  const sectionHover = isBarbershop ? "hover:text-barbershop-cta hover:bg-barbershop-section/10" : "hover:text-consultant-cta hover:bg-consultant-section/10";
  const accentHover = isBarbershop ? "hover:text-barbershop-accent hover:bg-barbershop-accent/10" : "hover:text-consultant-accent hover:bg-consultant-accent/10";

  return (
    <header className={`md:hidden shrink-0 ${headerBg} shadow-md`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] ${ctaColor} font-semibold uppercase tracking-wider`}>
            {getGreeting()}
          </p>
          <p className={`text-lg font-bold ${sectionColor} truncate leading-tight`}>
            {profile?.business_name || "My Business"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/settings"
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${sectionColor}/70 ${sectionHover} transition-all active:scale-95`}
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={toggleLanguage}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${sectionColor}/70 hover:${sectionColor} hover:bg-${isBarbershop ? 'barbershop' : 'consultant'}-section/10 transition-all active:scale-95`}
            title={language === "en" ? "Español" : "English"}
          >
            <span className="text-[10px] font-bold">{language === "en" ? "ES" : "EN"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${sectionColor}/70 hover:${sectionColor} hover:bg-${isBarbershop ? 'barbershop' : 'consultant'}-section/10 transition-all active:scale-95`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${sectionColor}/70 ${accentHover} transition-all active:scale-95`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}