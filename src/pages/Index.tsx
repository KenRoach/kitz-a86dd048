import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./Dashboard";

type UserRole = "consultant" | "barbershop" | "default";

const Index = () => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        setUserRole("default");
        return;
      }

      // Check for consultant or barbershop role
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["consultant", "barbershop"]);

      if (data && data.length > 0) {
        // Prioritize barbershop if user has both roles
        const hasBarbershop = data.some(r => r.role === "barbershop");
        const hasConsultant = data.some(r => r.role === "consultant");
        
        if (hasBarbershop) {
          setUserRole("barbershop");
        } else if (hasConsultant) {
          setUserRole("consultant");
        } else {
          setUserRole("default");
        }
      } else {
        setUserRole("default");
      }
    }

    if (user) {
      checkUserRole();
    } else if (!loading) {
      setUserRole("default");
    }
  }, [user, loading]);

  // Still checking role
  if (userRole === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect based on role
  if (userRole === "barbershop") {
    return <Navigate to="/barbershop" replace />;
  }

  if (userRole === "consultant") {
    return <Navigate to="/consultant" replace />;
  }

  return <Dashboard />;
};

export default Index;
