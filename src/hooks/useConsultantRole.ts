import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useConsultantRole() {
  const { user } = useAuth();
  const [isConsultant, setIsConsultant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setIsConsultant(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "consultant")
        .maybeSingle();

      if (error) {
        console.error("Error checking consultant role:", error);
        setIsConsultant(false);
      } else {
        setIsConsultant(!!data);
      }
      setLoading(false);
    }

    checkRole();
  }, [user]);

  return { isConsultant, loading };
}
