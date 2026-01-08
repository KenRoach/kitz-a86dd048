import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, Brain, Megaphone, Share2, Settings,
  MapPin, Calendar, Users
} from "lucide-react";

// Tab Components
import { ProductivityTab } from "@/components/profile/ProductivityTab";
import { DashboardTab } from "@/components/profile/DashboardTab";
import { MarketingTab } from "@/components/profile/MarketingTab";
import { ShareLinksTab } from "@/components/profile/ShareLinksTab";
import { ProfileSettingsTab } from "@/components/profile/ProfileSettingsTab";
import { CrmLiteTab } from "@/components/profile/CrmLiteTab";

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: "dashboard", label: language === "es" ? "Panel" : "Dashboard", icon: BarChart3 },
    { id: "crm", label: "CRM", icon: Users },
    { id: "productivity", label: language === "es" ? "Productividad" : "Productivity", icon: Brain },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "share", label: language === "es" ? "Compartir" : "Share", icon: Share2 },
    { id: "settings", label: language === "es" ? "Ajustes" : "Settings", icon: Settings },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Compact Profile Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-4 sm:p-6 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/20 shadow-xl">
              <AvatarImage src={profile?.logo_url || profile?.photo_url || ""} />
              <AvatarFallback className="bg-white/20 text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile?.business_name || "My Business"}</h1>
              {profile?.business_type && (
                <p className="text-primary-foreground/70 text-sm">{profile.business_type}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-primary-foreground/60">
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
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto grid grid-cols-3 sm:grid-cols-6 gap-2 bg-muted/30 backdrop-blur-sm p-2 rounded-2xl border border-border/50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-3 px-2 rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary hover:bg-background/50"
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] sm:text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="crm" className="mt-6">
            <CrmLiteTab />
          </TabsContent>

          <TabsContent value="productivity" className="mt-6">
            <ProductivityTab />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingTab />
          </TabsContent>

          <TabsContent value="share" className="mt-6">
            <ShareLinksTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <ProfileSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
