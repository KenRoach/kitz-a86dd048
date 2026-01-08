import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileQRCode } from "@/components/profile/ProfileQRCode";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useBadges } from "@/hooks/useBadges";
import { 
  Globe, ExternalLink, Copy, Check, Share2, 
  Link2, Instagram, Phone, Mail, QrCode
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function ShareLinksTab() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { userBadges, badges, userStats } = useBadges();
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Fetch stats for sharing
  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      if (!user) return { orders: 0, revenue: 0 };
      const { data } = await supabase
        .from("storefronts")
        .select("id, status, price")
        .eq("user_id", user.id);
      
      const paidOrders = data?.filter(s => s.status === "paid") || [];
      const revenue = paidOrders.reduce((sum, s) => sum + (s.price || 0), 0);
      return { orders: paidOrders.length, revenue };
    },
    enabled: !!user,
  });

  const publicProfileUrl = profile?.username 
    ? `${window.location.origin}/p/@${profile.username}`
    : user ? `${window.location.origin}/p/${user.id}` : "";

  const handleCopyProfileLink = async () => {
    await navigator.clipboard.writeText(publicProfileUrl);
    setLinkCopied(true);
    toast.success(language === "es" ? "Enlace copiado!" : "Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const earnedBadges = userBadges.map(ub => ({
    ...badges.find(b => b.id === ub.badge_id)!,
  })).filter(Boolean);

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
        `📊 ${stats?.orders || 0} pedidos completados\n` +
        `🎖️ ${badgeCount} insignias ganadas${badgeNames ? `: ${badgeNames}` : ""}\n` +
        `💰 $${(stats?.revenue || 0).toFixed(2)} en ventas\n\n` +
        `¡Únete a kitz y haz crecer tu negocio! 🚀`
      : `🏆 ${businessName} - Level ${level} on kitz!\n\n` +
        `📊 ${stats?.orders || 0} orders completed\n` +
        `🎖️ ${badgeCount} badges earned${badgeNames ? `: ${badgeNames}` : ""}\n` +
        `💰 $${(stats?.revenue || 0).toFixed(2)} in sales\n\n` +
        `Join kitz and grow your business! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "es" ? "Mis logros en kitz" : "My kitz accomplishments",
          text: shareText,
        });
        toast.success(language === "es" ? "¡Compartido!" : "Shared!");
      } catch {
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

  const quickLinks = [
    {
      label: language === "es" ? "Mi Perfil Público" : "My Public Profile",
      url: publicProfileUrl,
      icon: Globe,
    },
    ...(profile?.instagram ? [{
      label: "Instagram",
      url: `https://instagram.com/${profile.instagram.replace("@", "")}`,
      icon: Instagram,
    }] : []),
    ...(profile?.website ? [{
      label: language === "es" ? "Sitio Web" : "Website",
      url: profile.website,
      icon: Globe,
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* QR Code & Profile Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            {language === "es" ? "Tu Perfil Público" : "Your Public Profile"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Comparte tu perfil con clientes" 
              : "Share your profile with customers"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Link */}
          <div className="p-3 bg-muted rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link2 className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm truncate font-mono">
                {profile?.username ? `kitz.app/p/@${profile.username}` : `kitz.app/p/${user?.id?.slice(0, 8)}...`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyProfileLink}
              className="flex-shrink-0"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <ProfileQRCode 
              url={publicProfileUrl}
              businessName={profile?.business_name || "My Business"}
              logoUrl={profile?.logo_url}
              language={language}
            />
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open(publicProfileUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            {language === "es" ? "Ver Perfil Público" : "View Public Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            {language === "es" ? "Enlaces Rápidos" : "Quick Links"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickLinks.map((link, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{link.label}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(link.url, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Share Accomplishments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {language === "es" ? "Compartir Logros" : "Share Accomplishments"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Muestra tu progreso a otros" 
              : "Show off your progress to others"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full gap-2"
            onClick={handleShareAccomplishments}
          >
            {shareSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {language === "es" ? "Compartir mis logros" : "Share my accomplishments"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
