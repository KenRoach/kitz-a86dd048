import { Moon, Sun, LogOut, Globe } from "lucide-react";
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
    <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {getGreeting()}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">
            {profile?.business_name || "My Business"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLanguage}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            title={language === "en" ? "Español" : "English"}
          >
            <span className="text-xs font-bold">{language === "en" ? "ES" : "EN"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
