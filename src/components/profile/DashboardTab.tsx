import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelDisplay } from "@/components/badges/LevelDisplay";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, Package, ShoppingCart, Users, DollarSign, 
  Flame, Award, TrendingUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCard } from "@/components/badges/BadgeDisplay";

export function DashboardTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { 
    badges, 
    userBadges, 
    userStats, 
    getLevelProgress,
    earnedBadgeIds,
  } = useBadges();

  const [stats, setStats] = useState({
    storefronts: 0,
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const [storefronts, products, customers] = await Promise.all([
      supabase.from("storefronts").select("id, status, price"),
      supabase.from("products").select("id"),
      supabase.from("customers").select("id"),
    ]);

    const paidOrders = storefronts.data?.filter(s => s.status === "paid") || [];
    const revenue = paidOrders.reduce((sum, s) => sum + (s.price || 0), 0);

    setStats({
      storefronts: storefronts.data?.length || 0,
      products: products.data?.length || 0,
      orders: paidOrders.length,
      customers: customers.data?.length || 0,
      revenue,
    });
  };

  const earnedBadges = userBadges.map(ub => ({
    ...badges.find(b => b.id === ub.badge_id)!,
    earnedAt: ub.earned_at,
  })).filter(Boolean);

  const unearnedBadges = badges.filter(b => !earnedBadgeIds.includes(b.id));
  const levelProgress = getLevelProgress();

  const statCards = [
    { value: stats.storefronts, label: language === "es" ? "Vitrinas" : "Storefronts", icon: Store, color: "text-blue-500" },
    { value: stats.products, label: language === "es" ? "Productos" : "Products", icon: Package, color: "text-purple-500" },
    { value: stats.orders, label: language === "es" ? "Pedidos" : "Orders", icon: ShoppingCart, color: "text-green-500" },
    { value: stats.customers, label: language === "es" ? "Clientes" : "Customers", icon: Users, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="text-center">
            <CardContent className="p-4">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "es" ? "Ingresos totales" : "Total Revenue"}
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level & XP */}
      <LevelDisplay 
        level={userStats?.level || 1} 
        xp={userStats?.xp || 0} 
        progress={levelProgress} 
      />

      {/* Streak */}
      {userStats && userStats.streak_days > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">{userStats.streak_days} {language === "es" ? "días seguidos" : "day streak"}</p>
              <p className="text-sm text-muted-foreground">
                {language === "es" ? "¡Sigue así!" : "Keep it up!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {language === "es" ? "Insignias" : "Badges"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {earnedBadges.length}/{badges.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="earned" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="earned">
                {language === "es" ? "Ganadas" : "Earned"} ({earnedBadges.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                {language === "es" ? "Por ganar" : "Available"} ({unearnedBadges.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="earned">
              {earnedBadges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{language === "es" ? "Aún no tienes insignias" : "No badges yet"}</p>
                  <p className="text-sm">{language === "es" ? "¡Sigue usando kitz para ganar!" : "Keep using kitz to earn some!"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earnedBadges.map((badge) => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge} 
                      earned 
                      earnedAt={badge.earnedAt}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="available">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unearnedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
