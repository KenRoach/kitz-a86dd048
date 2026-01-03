import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Badge {
  id: string;
  name: string;
  name_es: string;
  description: string;
  description_es: string;
  icon: string;
  category: string;
  level: number;
  points_required: number;
  criteria: Record<string, number>;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_storefronts: number;
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  streak_days: number;
  last_active_date: string | null;
  profile_completeness: number;
  level: number;
  xp: number;
}

export function useBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadgesAndStats();
    }
  }, [user]);

  const fetchBadgesAndStats = async () => {
    if (!user) return;

    try {
      // Fetch all badges
      const { data: badgesData } = await supabase
        .from("badges")
        .select("*")
        .order("level", { ascending: true });

      if (badgesData) {
        setBadges(badgesData as Badge[]);
      }

      // Fetch user's earned badges
      const { data: userBadgesData } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", user.id);

      if (userBadgesData) {
        setUserBadges(userBadgesData as UserBadge[]);
      }

      // Fetch or create user stats
      let { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!statsData) {
        // Create initial stats by calculating from existing data
        const stats = await calculateUserStats(user.id);
        const { data: newStats } = await supabase
          .from("user_stats")
          .insert({ user_id: user.id, ...stats })
          .select()
          .single();
        statsData = newStats;
      }

      if (statsData) {
        setUserStats(statsData as UserStats);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async (userId: string) => {
    const [storefronts, products, customers, profile] = await Promise.all([
      supabase.from("storefronts").select("id, status, price").eq("user_id", userId),
      supabase.from("products").select("id").eq("user_id", userId),
      supabase.from("customers").select("id").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const paidOrders = storefronts.data?.filter(s => s.status === "paid") || [];
    const totalRevenue = paidOrders.reduce((sum, s) => sum + (s.price || 0), 0);

    // Calculate profile completeness
    const profileData = profile.data;
    let completeness = 0;
    if (profileData) {
      const fields = ['business_name', 'business_type', 'phone', 'address', 'city', 'country', 'logo_url', 'username'];
      const filled = fields.filter(f => profileData[f as keyof typeof profileData]).length;
      completeness = Math.round((filled / fields.length) * 100);
    }

    return {
      total_storefronts: storefronts.data?.length || 0,
      total_orders: paidOrders.length,
      total_revenue: totalRevenue,
      total_products: products.data?.length || 0,
      total_customers: customers.data?.length || 0,
      profile_completeness: completeness,
      streak_days: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      xp: 0,
      level: 1,
    };
  };

  const refreshStats = async () => {
    if (!user) return;
    
    const stats = await calculateUserStats(user.id);
    
    // Update user stats
    const { data: updatedStats } = await supabase
      .from("user_stats")
      .update(stats)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updatedStats) {
      setUserStats(updatedStats as UserStats);
    }

    // Check for newly earned badges
    await checkAndAwardBadges(stats);
  };

  const checkAndAwardBadges = async (stats: ReturnType<typeof calculateUserStats> extends Promise<infer T> ? T : never) => {
    if (!user) return;

    const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
    const newBadges: string[] = [];

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      const criteria = badge.criteria;
      let earned = true;

      if (criteria.storefronts && stats.total_storefronts < criteria.storefronts) earned = false;
      if (criteria.products && stats.total_products < criteria.products) earned = false;
      if (criteria.orders && stats.total_orders < criteria.orders) earned = false;
      if (criteria.revenue && stats.total_revenue < criteria.revenue) earned = false;
      if (criteria.customers && stats.total_customers < criteria.customers) earned = false;
      if (criteria.streak && stats.streak_days < criteria.streak) earned = false;
      if (criteria.profile && stats.profile_completeness < criteria.profile) earned = false;

      if (earned) {
        newBadges.push(badge.id);
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const badgesToInsert = newBadges.map(badgeId => ({
        user_id: user.id,
        badge_id: badgeId,
      }));

      await supabase.from("user_badges").insert(badgesToInsert);

      // Add XP for earned badges
      const xpGained = badges
        .filter(b => newBadges.includes(b.id))
        .reduce((sum, b) => sum + b.points_required, 0);

      if (xpGained > 0 && userStats) {
        await supabase
          .from("user_stats")
          .update({ xp: (userStats.xp || 0) + xpGained })
          .eq("user_id", user.id);
      }

      // Refresh badges
      fetchBadgesAndStats();
    }
  };

  const getLevelProgress = () => {
    if (!userStats) return { current: 0, next: 100, percent: 0 };
    
    const level = userStats.level;
    const currentLevelXP = (level - 1) ** 2 * 50;
    const nextLevelXP = level ** 2 * 50;
    const xpInLevel = userStats.xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    
    return {
      current: xpInLevel,
      next: xpNeeded,
      percent: Math.round((xpInLevel / xpNeeded) * 100),
    };
  };

  return {
    badges,
    userBadges,
    userStats,
    loading,
    refreshStats,
    getLevelProgress,
    earnedBadgeIds: userBadges.map(ub => ub.badge_id),
  };
}
