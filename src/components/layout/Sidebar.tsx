import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Settings, LogOut, Moon, Sun, Globe, Package, Award, Lightbulb, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, path: "/dashboard" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: History, labelKey: "orderHistory" as const, path: "/order-history" },
  { icon: Users, labelKey: "customers" as const, path: "/profile?tab=crm" },
  { icon: Lightbulb, labelKey: "suggestions" as const, path: "/suggestions" },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, getGreeting } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <aside className="hidden md:flex w-64 bg-card p-5 flex-col shadow-lg">
      {/* Greeting + Business Name */}
      <div className="mb-6 px-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {getGreeting()}
        </p>
        <h1 className="text-lg font-semibold text-foreground mt-0.5 truncate">
          {profile?.business_name || "My Business"}
        </h1>
        {profile?.business_type && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.business_type}</p>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path.includes("?") && location.pathname + location.search === item.path);
          
          // Custom label for customers
          const label = item.labelKey === "customers" 
            ? (language === "es" ? "Clientes" : "Customers")
            : (t as any)[item.labelKey];
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 space-y-2">
        {/* Profile link */}
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200",
            location.pathname === "/profile" 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "hover:bg-muted hover:text-foreground"
          )}
        >
          <Award className="w-5 h-5" />
          <span className="font-medium">{language === "es" ? "Mi Perfil" : "My Profile"}</span>
        </Link>
        
        {/* Admin link */}
        <Link
          to="/admin"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200",
            location.pathname === "/admin" 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">{t.admin}</span>
        </Link>
        
        {/* Separator after Admin */}
        <div className="h-px bg-foreground/10 mx-3 my-3" />
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground w-full"
        >
          <Globe className="w-5 h-5" />
          <span className="font-medium">{language === "en" ? "Español" : "English"}</span>
        </button>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground w-full"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{theme === "dark" ? t.lightMode : t.darkMode}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
