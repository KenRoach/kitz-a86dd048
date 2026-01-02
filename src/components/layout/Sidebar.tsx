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
    <aside className="w-64 border-r border-border bg-sidebar p-4 flex flex-col">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Business OS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">AI-first operations</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.business_name || "My Business"}
          </p>
          {profile?.business_type && (
            <p className="text-xs text-muted-foreground truncate">{profile.business_type}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="nav-item w-full text-left text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
