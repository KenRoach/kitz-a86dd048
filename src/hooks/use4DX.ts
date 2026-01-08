import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserGoals {
  id: string;
  user_id: string;
  wig_type: 'revenue' | 'orders' | 'customers';
  wig_target: number;
  wig_period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  storefronts_target: number;
  followups_target: number;
}

export interface LeadMeasures {
  storefrontsCreated: number;
  followupsCompleted: number;
  storefrontsTarget: number;
  followupsTarget: number;
}

export interface WIGProgress {
  current: number;
  target: number;
  percentage: number;
  type: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  commitment: string;
  week_start: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const defaultGoals: Omit<UserGoals, 'id' | 'user_id' | 'period_start'> = {
  wig_type: 'revenue',
  wig_target: 500,
  wig_period: 'weekly',
  storefronts_target: 5,
  followups_target: 10,
};

export function use4DX() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [leadMeasures, setLeadMeasures] = useState<LeadMeasures | null>(null);
  const [wigProgress, setWigProgress] = useState<WIGProgress | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [lastWeekCommitments, setLastWeekCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeekStart = useCallback((weeksAgo: number = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) - (weeksAgo * 7);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
    return weekStart.toISOString().split('T')[0];
  }, []);

  const getPeriodStart = useCallback((period: string) => {
    const now = new Date();
    if (period === 'daily') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      return new Date(now.setDate(diff)).toISOString();
    } else {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching goals:', error);
    }

    if (data) {
      setGoals(data as UserGoals);
    } else {
      // Create default goals
      const periodStart = getPeriodStart('weekly');
      const { data: newGoals, error: insertError } = await supabase
        .from('user_goals')
        .insert({ 
          user_id: user.id, 
          ...defaultGoals,
          period_start: periodStart 
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating goals:', insertError);
      } else if (newGoals) {
        setGoals(newGoals as UserGoals);
      }
    }

    setLoading(false);
  }, [user, getPeriodStart]);

  const fetchLeadMeasures = useCallback(async () => {
    if (!user || !goals) return;

    const periodStart = getPeriodStart(goals.wig_period);

    // Count storefronts created this period
    const { count: storefrontsCount } = await supabase
      .from('storefronts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart);

    // Count follow-ups (from activity log)
    const { count: followupsCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'followup')
      .gte('created_at', periodStart);

    setLeadMeasures({
      storefrontsCreated: storefrontsCount || 0,
      followupsCompleted: followupsCount || 0,
      storefrontsTarget: goals.storefronts_target,
      followupsTarget: goals.followups_target,
    });
  }, [user, goals, getPeriodStart]);

  const fetchWIGProgress = useCallback(async () => {
    if (!user || !goals) return;

    const periodStart = getPeriodStart(goals.wig_period);
    let current = 0;

    if (goals.wig_type === 'revenue') {
      // Sum of paid storefronts
      const { data } = await supabase
        .from('storefronts')
        .select('price')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('paid_at', periodStart);

      current = data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
    } else if (goals.wig_type === 'orders') {
      // Count of paid storefronts
      const { count } = await supabase
        .from('storefronts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('paid_at', periodStart);

      current = count || 0;
    } else if (goals.wig_type === 'customers') {
      // New customers this period
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart);

      current = count || 0;
    }

    const percentage = Math.min((current / goals.wig_target) * 100, 100);

    setWigProgress({
      current,
      target: goals.wig_target,
      percentage,
      type: goals.wig_type,
    });
  }, [user, goals, getPeriodStart]);

  const fetchCommitments = useCallback(async () => {
    if (!user) return;

    const thisWeekStart = getWeekStart(0);
    const lastWeekStart = getWeekStart(1);

    // This week's commitments
    const { data: thisWeek } = await supabase
      .from('user_commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', thisWeekStart)
      .order('created_at', { ascending: true });

    setCommitments((thisWeek as Commitment[]) || []);

    // Last week's commitments
    const { data: lastWeek } = await supabase
      .from('user_commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', lastWeekStart)
      .order('created_at', { ascending: true });

    setLastWeekCommitments((lastWeek as Commitment[]) || []);
  }, [user, getWeekStart]);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchCommitments();
    }
  }, [user, fetchGoals, fetchCommitments]);

  useEffect(() => {
    if (goals) {
      fetchLeadMeasures();
      fetchWIGProgress();
    }
  }, [goals, fetchLeadMeasures, fetchWIGProgress]);

  const updateGoals = async (updates: Partial<UserGoals>) => {
    if (!user || !goals) return;

    // If period changed, reset period_start
    let finalUpdates = { ...updates };
    if (updates.wig_period && updates.wig_period !== goals.wig_period) {
      finalUpdates.period_start = getPeriodStart(updates.wig_period);
    }

    const { data, error } = await supabase
      .from('user_goals')
      .update(finalUpdates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update goals');
      return;
    }

    setGoals(data as UserGoals);
    toast.success('Goals updated');
  };

  const resetPeriod = async () => {
    if (!user || !goals) return;

    const periodStart = getPeriodStart(goals.wig_period);
    await updateGoals({ period_start: periodStart } as any);
    
    // Refetch data
    fetchLeadMeasures();
    fetchWIGProgress();
  };

  const addCommitment = async (text: string) => {
    if (!user || !text.trim()) return;

    const weekStart = getWeekStart(0);

    const { data, error } = await supabase
      .from('user_commitments')
      .insert({
        user_id: user.id,
        commitment: text.trim(),
        week_start: weekStart,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add commitment');
      return;
    }

    setCommitments(prev => [...prev, data as Commitment]);
  };

  const toggleCommitment = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('user_commitments')
      .update({ 
        completed, 
        completed_at: completed ? new Date().toISOString() : null 
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update commitment');
      return;
    }

    setCommitments(prev => 
      prev.map(c => c.id === id ? { ...c, completed, completed_at: completed ? new Date().toISOString() : null } : c)
    );
  };

  const deleteCommitment = async (id: string) => {
    const { error } = await supabase
      .from('user_commitments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete commitment');
      return;
    }

    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  return {
    goals,
    leadMeasures,
    wigProgress,
    commitments,
    lastWeekCommitments,
    loading,
    updateGoals,
    resetPeriod,
    addCommitment,
    toggleCommitment,
    deleteCommitment,
    refetch: () => {
      fetchGoals();
      fetchLeadMeasures();
      fetchWIGProgress();
      fetchCommitments();
    },
  };
}
