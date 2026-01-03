import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AutopilotSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  auto_create_storefronts: boolean;
  max_storefronts_per_day: number;
  min_product_price: number;
  auto_followup_customers: boolean;
  followup_after_days: number;
  max_followups_per_day: number;
}

export interface AutopilotAction {
  id: string;
  action_type: string;
  status: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  executed_at: string | null;
}

export interface AutopilotOpportunity {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  payload: Record<string, any>;
}

const defaultSettings: Omit<AutopilotSettings, 'id' | 'user_id'> = {
  enabled: false,
  auto_create_storefronts: false,
  max_storefronts_per_day: 3,
  min_product_price: 5,
  auto_followup_customers: false,
  followup_after_days: 7,
  max_followups_per_day: 5,
};

export function useAutopilot() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [actions, setActions] = useState<AutopilotAction[]>([]);
  const [opportunities, setOpportunities] = useState<AutopilotOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchActions();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching autopilot settings:', error);
    }

    if (data) {
      setSettings(data as AutopilotSettings);
    } else {
      // Create default settings
      const { data: newSettings } = await supabase
        .from('autopilot_settings')
        .insert({ user_id: user.id, ...defaultSettings })
        .select()
        .single();
      
      if (newSettings) {
        setSettings(newSettings as AutopilotSettings);
      }
    }

    setLoading(false);
  };

  const fetchActions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('autopilot_actions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setActions(data as AutopilotAction[]);
    }
  };

  const updateSettings = async (updates: Partial<AutopilotSettings>) => {
    if (!user || !settings) return;

    const { data, error } = await supabase
      .from('autopilot_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update settings');
      return;
    }

    setSettings(data as AutopilotSettings);
    toast.success('Settings updated');
  };

  const analyzeOpportunities = useCallback(async () => {
    if (!user || !settings?.enabled) return;

    setAnalyzing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autopilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'analyze' }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setOpportunities(result.opportunities || []);
      }
    } catch (error) {
      console.error('Error analyzing opportunities:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [user, settings?.enabled]);

  const executeAction = async (type: string, payload: Record<string, any>) => {
    if (!user) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autopilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: type, payload }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Action completed');
        fetchActions();
        // Remove from opportunities
        setOpportunities(prev => prev.filter(o => 
          !(o.type === type && JSON.stringify(o.payload) === JSON.stringify(payload))
        ));
      } else {
        toast.error(result.error || 'Action failed');
      }

      return result;
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Action failed');
      return null;
    }
  };

  return {
    settings,
    actions,
    opportunities,
    loading,
    analyzing,
    updateSettings,
    analyzeOpportunities,
    executeAction,
    refetch: fetchSettings,
  };
}
