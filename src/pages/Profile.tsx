import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeIcon, BadgeCard } from "@/components/badges/BadgeDisplay";
import { LevelDisplay } from "@/components/badges/LevelDisplay";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Store, Package, ShoppingCart, Users, DollarSign, 
  Calendar, MapPin, Globe, Instagram, Phone, Mail,
  Edit, Flame, Award, TrendingUp, Share2, Check, ExternalLink, Copy, Link2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { 
    badges, 
    userBadges, 
    userStats, 
    loading: badgesLoading, 
    getLevelProgress,
    earnedBadgeIds,
    refreshStats 
  } = useBadges();

  const [stats, setStats] = useState({
    storefronts: 0,
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
      refreshStats();
    }
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

  const initials = profile?.business_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "KB";

  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        month: "long",
        year: "numeric"
      })
    : "";

  const [shareSuccess, setShareSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate public profile URL
  const publicProfileUrl = profile?.username 
    ? `${window.location.origin}/p/@${profile.username}`
    : user ? `${window.location.origin}/p/${user.id}` : "";

  const handleCopyProfileLink = async () => {
    await navigator.clipboard.writeText(publicProfileUrl);
    setLinkCopied(true);
    toast.success(language === "es" ? "Enlace copiado!" : "Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareAccomplishments = async () => {
    const level = userStats?.level || 1;
    const badgeCount = earnedBadges.length;
    const businessName = profile?.business_name || "My Business";
    
    const badgeNames = earnedBadges
      .slice(0, 3)
      .map(b => language === "es" ? b.name_es : b.name)
      .join(", ");

    const shareText = language === "es"
      ? `🏆 ${businessName} - Nivel ${level} en kitz!\n\n` +
        `📊 ${stats.orders} pedidos completados\n` +
        `🎖️ ${badgeCount} insignias ganadas${badgeNames ? `: ${badgeNames}` : ""}\n` +
        `💰 $${stats.revenue.toFixed(2)} en ventas\n\n` +
        `¡Únete a kitz y haz crecer tu negocio! 🚀`
      : `🏆 ${businessName} - Level ${level} on kitz!\n\n` +
        `📊 ${stats.orders} orders completed\n` +
        `🎖️ ${badgeCount} badges earned${badgeNames ? `: ${badgeNames}` : ""}\n` +
        `💰 $${stats.revenue.toFixed(2)} in sales\n\n` +
        `Join kitz and grow your business! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "es" ? "Mis logros en kitz" : "My kitz accomplishments",
          text: shareText,
        });
        toast.success(language === "es" ? "¡Compartido!" : "Shared!");
      } catch (err) {
        // User cancelled or error - try clipboard
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        toast.success(language === "es" ? "Copiado al portapapeles" : "Copied to clipboard");
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      toast.success(language === "es" ? "Copiado al portapapeles" : "Copied to clipboard");
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  if (badgesLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-6 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-white/20 shadow-xl">
              <AvatarImage src={profile?.logo_url || profile?.photo_url || ""} />
              <AvatarFallback className="bg-white/20 text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile?.business_name || "My Business"}</h1>
              {profile?.business_type && (
                <p className="text-primary-foreground/70">{profile.business_type}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-primary-foreground/70">
                {profile?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {language === "es" ? "Desde" : "Since"} {joinDate}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleCopyProfileLink}
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Link2 className="w-4 h-4 mr-1" />
                )}
                {language === "es" ? "Copiar enlace" : "Copy Link"}
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                onClick={() => window.open(publicProfileUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                {language === "es" ? "Ver perfil" : "View Profile"}
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate("/admin")}
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
              >
                <Edit className="w-4 h-4 mr-1" />
                {language === "es" ? "Editar" : "Edit"}
              </Button>
            </div>
          </div>

          {/* Public Profile Link Banner */}
          <div className="relative mt-4 p-3 bg-white/10 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Globe className="w-4 h-4 flex-shrink-0 opacity-70" />
              <span className="text-sm truncate font-mono opacity-80">
                {profile?.username ? `/p/@${profile.username}` : `/p/${user?.id?.slice(0, 8)}...`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyProfileLink}
              className="flex-shrink-0 h-8 px-3 bg-white/10 hover:bg-white/20 text-primary-foreground"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-4 gap-2 mt-4">
            {[
              { value: stats.storefronts, label: language === "es" ? "Vitrinas" : "Storefronts", icon: Store },
              { value: stats.products, label: language === "es" ? "Productos" : "Products", icon: Package },
              { value: stats.orders, label: language === "es" ? "Pedidos" : "Orders", icon: ShoppingCart },
              { value: stats.customers, label: language === "es" ? "Clientes" : "Customers", icon: Users },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-white/10 rounded-xl">
                <stat.icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] opacity-70 truncate">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

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

        {/* Business Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === "es" ? "Información del negocio" : "Business Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{profile.address}{profile.city ? `, ${profile.city}` : ""}</span>
              </div>
            )}
            {profile?.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            {profile?.instagram && (
              <div className="flex items-center gap-3 text-sm">
                <Instagram className="w-4 h-4 text-muted-foreground" />
                <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  @{profile.instagram.replace("@", "")}
                </a>
              </div>
            )}

            {/* Payment Methods */}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {language === "es" ? "Métodos de pago" : "Payment methods"}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile?.payment_cash && (
                  <span className="px-2 py-1 bg-muted rounded text-xs">{language === "es" ? "Efectivo" : "Cash"}</span>
                )}
                {profile?.payment_cards && (
                  <span className="px-2 py-1 bg-muted rounded text-xs">{language === "es" ? "Tarjetas" : "Cards"}</span>
                )}
                {profile?.payment_yappy && (
                  <span className="px-2 py-1 bg-muted rounded text-xs">Yappy</span>
                )}
                {profile?.payment_pluxee && (
                  <span className="px-2 py-1 bg-muted rounded text-xs">Pluxee</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Stats */}
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
      </div>
    </AppLayout>
  );
}
