import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useBarbershopRole() {
  const { user } = useAuth();
  const [isBarbershop, setIsBarbershop] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setIsBarbershop(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "barbershop")
        .maybeSingle();

      if (error) {
        console.error("Error checking barbershop role:", error);
        setIsBarbershop(false);
      } else {
        setIsBarbershop(!!data);
      }
      setLoading(false);
    }

    checkRole();
  }, [user]);

  return { isBarbershop, loading };
}
