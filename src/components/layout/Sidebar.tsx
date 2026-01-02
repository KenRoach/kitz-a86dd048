import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Settings, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Store, label: "Storefronts", path: "/storefronts" },
  { icon: History, label: "Order History", path: "/order-history" },
  { icon: Settings, label: "Admin", path: "/admin" },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
          const isActive = location.pathname === item.path;
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
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground w-full"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
