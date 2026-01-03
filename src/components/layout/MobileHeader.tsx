import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export function MobileHeader() {
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, getGreeting } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <header className="md:hidden sticky top-0 z-50 bg-background border-b border-border/50">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
            {getGreeting()}
          </p>
          <p className="text-base font-bold text-foreground truncate -mt-0.5">
            {profile?.business_name || "My Business"}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleLanguage}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title={language === "en" ? "Español" : "English"}
          >
            <span className="text-[9px] font-bold">{language === "en" ? "ES" : "EN"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => signOut()}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}