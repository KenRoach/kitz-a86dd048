import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BusinessSummary {
  todayRevenue: number;
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  totalContacts: number;
  hotLeads: number;
  activeOrders: number;
  overdueFollowUps: number;
  riskyOrders: number;
}

export interface AIAction {
  action_type: string;
  title: string;
  description: string;
  priority: string;
}

export function useBusinessOS() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [actions, setActions] = useState<AIAction[]>([]);

  const runMyBusiness = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("kitz-agent", {
        body: { action: "run_my_business", payload: {} }
      });
      if (error) throw error;
      setSummary(data.summary);
      setActions(data.actions || []);
      toast.success("Business scan complete!");
    } catch (e: any) {
      console.error("Run my business error:", e);
      toast.error("Failed to analyze business");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getInsights = useCallback(async () => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.functions.invoke("kitz-agent", {
        body: { action: "get_insights", payload: {} }
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error("Insights error:", e);
      toast.error("Failed to load insights");
      return null;
    }
  }, [user]);

  const scoreLead = useCallback(async (contactId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("kitz-agent", {
        body: { action: "score_lead", payload: { contact_id: contactId } }
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error("Score lead error:", e);
      return null;
    }
  }, []);

  return { loading, summary, actions, runMyBusiness, getInsights, scoreLead };
}
