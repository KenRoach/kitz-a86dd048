import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, History, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Store, label: "Storefronts", path: "/storefronts" },
  { icon: History, label: "Order History", path: "/order-history" },
  { icon: Settings, label: "Admin", path: "/admin" },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 bg-card p-5 flex flex-col shadow-lg">
      {/* Logo area */}
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          kitz
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Business OS</p>
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

      <div className="mt-auto pt-4">
        {/* Profile card */}
        <div className="px-3 py-4 rounded-xl bg-muted/50 mb-3">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile?.business_name || "My Business"}
          </p>
          {profile?.business_type && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.business_type}</p>
          )}
        </div>
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