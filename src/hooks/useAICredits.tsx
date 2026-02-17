import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AICreditsContextType {
  balance: number;
  loading: boolean;
  hasCredits: boolean;
  refresh: () => Promise<void>;
  consume: (amount?: number) => Promise<boolean>;
}

const AICreditsContext = createContext<AICreditsContextType>({
  balance: 0,
  loading: true,
  hasCredits: false,
  refresh: async () => {},
  consume: async () => false,
});

export function useAICredits() {
  return useContext(AICreditsContext);
}

export function AICreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("ai_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBalance(data.balance);
      } else {
        // Auto-create credits row for existing users
        const { data: inserted } = await supabase
          .from("ai_credits")
          .insert({ user_id: user.id, balance: 50 })
          .select("balance")
          .single();
        setBalance(inserted?.balance ?? 50);
      }
    } catch (e) {
      console.error("Failed to fetch AI credits:", e);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const consume = useCallback(async (amount = 1): Promise<boolean> => {
    if (balance < amount) return false;
    try {
      const { data, error } = await supabase.rpc("consume_ai_credit", {
        p_user_id: user!.id,
        p_amount: amount,
      });
      if (error) throw error;
      if (data === -1) {
        setBalance(0);
        return false;
      }
      setBalance(data as number);
      return true;
    } catch (e) {
      console.error("Failed to consume credit:", e);
      return false;
    }
  }, [user, balance]);

  return (
    <AICreditsContext.Provider value={{ balance, loading, hasCredits: balance > 0, refresh, consume }}>
      {children}
    </AICreditsContext.Provider>
  );
}
