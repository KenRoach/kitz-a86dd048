import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, Settings, LogOut, Package, Users, Shield, Bot, ShoppingCart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AIBatteryIndicator } from "@/components/ai/AIBatteryIndicator";

const navItems = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, path: "/dashboard" },
  { icon: Users, labelKey: "crm" as const, path: "/crm" },
  { icon: ShoppingCart, labelKey: "orders" as const, path: "/orders" },
  { icon: BarChart3, labelKey: "insights" as const, path: "/insights" },
  { icon: Store, labelKey: "storefronts" as const, path: "/storefronts" },
  { icon: Package, labelKey: "products" as const, path: "/products" },
  { icon: Bot, labelKey: "agent" as const, path: "/agent" },
];

export function Sidebar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { language, t, getGreeting } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Custom labels for nav items
  const getLabel = (labelKey: string) => {
    const labels: Record<string, string> = language === "es"
      ? { dashboard: "Inicio", crm: "CRM", orders: "Órdenes", insights: "Métricas", storefronts: "Vitrinas", products: "Productos", agent: "Agente IA" }
      : { dashboard: "Home", crm: "CRM", orders: "Orders", insights: "Insights", storefronts: "Storefronts", products: "Products", agent: "AI Agent" };
    return labels[labelKey] || (t as any)[labelKey];
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
        <AIBatteryIndicator />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path.includes("?") && location.pathname + location.search === item.path);
          
          const label = getLabel(item.labelKey);
          
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
        {/* Admin link - only for admins */}
        {isAdmin && (
          <Link
            to="/platform-admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200",
              location.pathname === "/platform-admin" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Control Center</span>
          </Link>
        )}
        
        {/* Settings link */}
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200",
            location.pathname === "/settings" 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">{language === "es" ? "Ajustes" : "Settings"}</span>
        </Link>
        
        {/* Separator */}
        <div className="h-px bg-foreground/10 mx-3 my-3" />

        {/* Sign out */}
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
