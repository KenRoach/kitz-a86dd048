import { Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AIBatteryIndicator } from "@/components/ai/AIBatteryIndicator";

export function MobileHeader() {
  const { profile, user } = useAuth();
  const { getGreeting } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  return (
    <header className="md:hidden shrink-0 shadow-md bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {getGreeting()}
          </p>
          <p className="text-lg font-bold truncate leading-tight text-foreground">
            {profile?.business_name || "My Business"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <AIBatteryIndicator />
          <NotificationBell />
          {isAdmin && (
            <Link
              to="/platform-admin"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Control Center"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}