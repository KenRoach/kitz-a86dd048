import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const [isConsultant, setIsConsultant] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkConsultantRole() {
      if (!user) {
        setIsConsultant(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "consultant")
        .maybeSingle();

      setIsConsultant(!!data);
    }

    if (user) {
      checkConsultantRole();
    } else if (!loading) {
      setIsConsultant(false);
    }
  }, [user, loading]);

  // Still checking role
  if (isConsultant === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect consultants to their dashboard
  if (isConsultant) {
    return <Navigate to="/consultant" replace />;
  }

  return <Dashboard />;
};

export default Index;
