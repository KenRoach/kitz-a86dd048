import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, CreditCard, Banknote, Smartphone, Globe, Image, Instagram, Link2, Share2, Copy, Check, QrCode, Bot, BarChart3, Search, TrendingUp, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsSection } from "@/components/admin/IntegrationsSection";
import { AutopilotPanel } from "@/components/autopilot/AutopilotPanel";
import { useState as useStateReact } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const BUSINESS_TYPES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Food Truck",
  "Retail Store",
  "Online Store",
  "Services",
  "Beauty & Wellness",
  "Health & Fitness",
  "Education",
  "Consulting",
  "Creative Agency",
  "Photography",
  "Events",
  "Other",
];

const COUNTRIES = [
  { code: "PA", name: "Panama", phoneCode: "+507" },
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "CO", name: "Colombia", phoneCode: "+57" },
  { code: "CR", name: "Costa Rica", phoneCode: "+506" },
  { code: "GT", name: "Guatemala", phoneCode: "+502" },
  { code: "HN", name: "Honduras", phoneCode: "+504" },
  { code: "NI", name: "Nicaragua", phoneCode: "+505" },
  { code: "SV", name: "El Salvador", phoneCode: "+503" },
  { code: "DO", name: "Dominican Republic", phoneCode: "+1" },
  { code: "PE", name: "Peru", phoneCode: "+51" },
  { code: "EC", name: "Ecuador", phoneCode: "+593" },
  { code: "CL", name: "Chile", phoneCode: "+56" },
  { code: "AR", name: "Argentina", phoneCode: "+54" },
  { code: "BR", name: "Brazil", phoneCode: "+55" },
  { code: "ES", name: "Spain", phoneCode: "+34" },
];

interface ProfileData {
  business_name: string;
  business_type: string | null;
  phone: string | null;
  phone_country: string | null;
  address: string | null;
  ruc: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  photo_url: string | null;
  website: string | null;
  instagram: string | null;
  storefront_image_url: string | null;
  payment_cards: boolean;
  payment_yappy: boolean;
  payment_cash: boolean;
  payment_pluxee: boolean;
  latitude: number | null;
  longitude: number | null;
  username: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    business_name: "",
    business_type: "",
    phone: "",
    phone_country: "PA",
    address: "",
    ruc: "",
    city: "",
    country: "PA",
    logo_url: null,
    photo_url: null,
    website: "",
    instagram: "",
    storefront_image_url: null,
    payment_cards: false,
    payment_yappy: false,
    payment_cash: true,
    payment_pluxee: false,
    latitude: null,
    longitude: null,
    username: null,
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [storefrontFile, setStorefrontFile] = useState<File | null>(null);
  const [storefrontPreview, setStorefrontPreview] = useState<string | null>(null);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const profileLink = profile.username 
    ? `${window.location.origin}/p/@${profile.username}` 
    : user ? `${window.location.origin}/p/${user.id}` : "";

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(profileLink);
    setProfileLinkCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setProfileLinkCopied(false), 2000);
  };
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const storefrontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setProfile({
          business_name: data.business_name || "",
          business_type: (data as any).business_type || "",
          phone: data.phone || "",
          phone_country: "PA",
          address: data.address || "",
          ruc: (data as any).ruc || "",
          city: (data as any).city || "",
          country: (data as any).country || "PA",
          logo_url: (data as any).logo_url || null,
          photo_url: (data as any).photo_url || null,
          website: (data as any).website || "",
          instagram: (data as any).instagram || "",
          storefront_image_url: (data as any).storefront_image_url || null,
          payment_cards: (data as any).payment_cards ?? false,
          payment_yappy: (data as any).payment_yappy ?? false,
          payment_cash: (data as any).payment_cash ?? true,
          payment_pluxee: (data as any).payment_pluxee ?? false,
          latitude: (data as any).latitude || null,
          longitude: (data as any).longitude || null,
          username: (data as any).username || null,
        });
        setLogoPreview((data as any).logo_url);
        setStorefrontPreview((data as any).storefront_image_url);
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, [user]);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${folder}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("storefront-images").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("storefront-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfile(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        toast.success("Location updated");
      },
      () => {
        toast.error("Could not get location");
      }
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!profile.business_name.trim()) {
      toast.error(language === "es" ? "El nombre del negocio es requerido" : "Business name is required");
      return;
    }
    if (!profile.business_type) {
      toast.error(language === "es" ? "El tipo de negocio es requerido" : "Business type is required");
      return;
    }
    if (!profile.phone?.trim()) {
      toast.error(language === "es" ? "El teléfono es requerido" : "Phone number is required");
      return;
    }
    if (!profile.country) {
      toast.error(language === "es" ? "El país es requerido" : "Country is required");
      return;
    }
    
    setSaving(true);
    
    try {
      let newLogoUrl = profile.logo_url;
      let newStorefrontUrl = profile.storefront_image_url;
      
      if (logoFile) {
        newLogoUrl = await uploadImage(logoFile, "logo");
      }
      if (storefrontFile) {
        newStorefrontUrl = await uploadImage(storefrontFile, "storefront");
      }

      // Build full phone with country code
      const phoneCountry = COUNTRIES.find(c => c.code === profile.phone_country);
      const fullPhone = profile.phone ? `${phoneCountry?.phoneCode || ""} ${profile.phone}`.trim() : null;

      // Clean username - lowercase, no spaces, alphanumeric only
      const cleanUsername = profile.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || null;

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: profile.business_name.trim(),
          business_type: profile.business_type?.trim() || null,
          phone: fullPhone,
          address: profile.address?.trim() || null,
          ruc: profile.ruc?.trim() || null,
          city: profile.city?.trim() || null,
          country: profile.country || null,
          logo_url: newLogoUrl,
          website: profile.website?.trim() || null,
          instagram: profile.instagram?.trim() || null,
          storefront_image_url: newStorefrontUrl,
          payment_cards: profile.payment_cards,
          payment_yappy: profile.payment_yappy,
          payment_cash: profile.payment_cash,
          payment_pluxee: profile.payment_pluxee,
          latitude: profile.latitude,
          longitude: profile.longitude,
          username: cleanUsername,
        } as any)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to save changes");
        return;
      }

      if (logoFile) setLogoFile(null);
      if (storefrontFile) setStorefrontFile(null);

      toast.success("Settings saved");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (key: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  const selectedCountry = COUNTRIES.find(c => c.code === profile.phone_country);

  const { language, t } = useLanguage();

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6 max-w-2xl">
        {/* Header with Share Button */}
        <div className="animate-fade-in flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-semibold text-foreground">Admin</h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5 truncate">
              {language === "es" ? "Configura una vez. Todo funciona desde aquí." : "Set it once. Everything runs from here."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.profileQrCode}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG value={profileLink} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {t.scanToVisit}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(profileLink);
                      toast.success(t.linkCopied);
                    }}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t.copyLink}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyProfileLink}
              className="gap-2"
            >
              {profileLinkCopied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  {t.share}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs for Settings vs Autopilot */}
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="settings">
              {language === "es" ? "Configuración" : "Settings"}
            </TabsTrigger>
            <TabsTrigger value="autopilot" className="gap-2">
              <Bot className="w-4 h-4" />
              {language === "es" ? "Modo IA" : "AI Mode"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="autopilot" className="mt-0">
            <AutopilotPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-3 md:space-y-6">
            {/* Brand Section */}
            <section className="neu-card-flat p-6 space-y-5 animate-fade-in">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.brand}</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <Label className="mb-2 block text-muted-foreground">{t.businessLogo}</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, setLogoFile, setLogoPreview)}
                className="hidden"
              />
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-all"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
            </div>

            {/* Storefront Image */}
            <div>
              <Label className="mb-2 block text-muted-foreground">{t.storefrontImage}</Label>
              <input
                ref={storefrontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, setStorefrontFile, setStorefrontPreview)}
                className="hidden"
              />
              <div
                onClick={() => storefrontInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-all"
              >
                {storefrontPreview ? (
                  <img src={storefrontPreview} alt="Storefront" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
            </div>
          </div>

          {/* Username / Profile Link */}
          <div className="pt-4 border-t border-border">
            <Label htmlFor="username" className="text-muted-foreground">{t.profileUsername}</Label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={profile.username || ""}
                  onChange={(e) => updateProfile("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourbusiness"
                  className="pl-8"
                />
              </div>
            </div>
            {profile.username && (
              <p className="text-xs text-muted-foreground mt-2">
                Your profile: <span className="font-mono text-foreground">{profileLink}</span>
              </p>
            )}
          </div>
        </section>

        {/* Business Section */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.business}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName" className="text-muted-foreground">
                {language === "es" ? "Nombre del negocio" : "Business name"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                value={profile.business_name}
                onChange={(e) => updateProfile("business_name", e.target.value)}
                placeholder={language === "es" ? "Mi Negocio" : "My Business"}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label className="text-muted-foreground">
                {language === "es" ? "Tipo de negocio" : "Business type"} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={profile.business_type || ""}
                onValueChange={(value) => updateProfile("business_type", value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select type..."} />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ruc" className="text-muted-foreground">
                {language === "es" ? "RUC" : "Tax ID (RUC)"} <span className="text-xs text-muted-foreground/70">({language === "es" ? "opcional" : "optional"})</span>
              </Label>
              <Input
                id="ruc"
                value={profile.ruc || ""}
                onChange={(e) => updateProfile("ruc", e.target.value)}
                placeholder="12345678901"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">
                {language === "es" ? "País" : "Country"} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={profile.country || "PA"}
                onValueChange={(value) => updateProfile("country", value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={language === "es" ? "Seleccionar país..." : "Select country..."} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Contact & Presence */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.contactPresence}</h2>
          
          <div className="space-y-4">
            {/* Phone with country */}
            <div>
              <Label className="text-muted-foreground">
                WhatsApp / {language === "es" ? "Teléfono" : "Phone"} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={profile.phone_country || "PA"}
                  onValueChange={(value) => updateProfile("phone_country", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.phoneCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={profile.phone || ""}
                  onChange={(e) => updateProfile("phone", e.target.value)}
                  placeholder="6000-0000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website" className="text-muted-foreground">
                  {language === "es" ? "Sitio web" : "Website"} <span className="text-xs text-muted-foreground/70">({language === "es" ? "opcional" : "optional"})</span>
                </Label>
                <Input
                  id="website"
                  value={profile.website || ""}
                  onChange={(e) => updateProfile("website", e.target.value)}
                  placeholder="https://mybusiness.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="instagram" className="text-muted-foreground">
                  Instagram <span className="text-xs text-muted-foreground/70">({language === "es" ? "opcional" : "optional"})</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    value={profile.instagram || ""}
                    onChange={(e) => updateProfile("instagram", e.target.value)}
                    placeholder="mybusiness"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payments */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.payments}</h2>
          <p className="text-sm text-muted-foreground -mt-2">{language === "es" ? "Acepta pagos a tu manera" : "Accept payments your way"}</p>
          
          {/* Online Payments */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">{t.onlinePayments}</h3>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Stripe</span>
                  <p className="text-sm text-muted-foreground">{t.acceptCardsWorldwide}</p>
                </div>
              </div>
              <Switch
                checked={profile.payment_cards}
                onCheckedChange={(checked) => updateProfile("payment_cards", checked)}
              />
            </div>
          </div>

          {/* Local Payments */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">{t.localPayments}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-attention/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-attention" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Yappy</span>
                    <p className="text-sm text-muted-foreground">{t.mobilePayments}</p>
                  </div>
                </div>
                <Switch
                  checked={profile.payment_yappy}
                  onCheckedChange={(checked) => updateProfile("payment_yappy", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{t.cash}</span>
                    <p className="text-sm text-muted-foreground">{t.inPersonPayments}</p>
                  </div>
                </div>
                <Switch
                  checked={profile.payment_cash}
                  onCheckedChange={(checked) => updateProfile("payment_cash", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Pluxee</span>
                    <p className="text-sm text-muted-foreground">{t.employeeBenefitCards}</p>
                  </div>
                </div>
                <Switch
                  checked={profile.payment_pluxee}
                  onCheckedChange={(checked) => updateProfile("payment_pluxee", checked)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.integrations}</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">{language === "es" ? "Conecta tus herramientas favoritas" : "Connect your favorite tools for a seamless workflow"}</p>
          
          <IntegrationsSection />
        </section>

        {/* Location & Discovery */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.location}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address" className="text-muted-foreground">{t.address}</Label>
              <Input
                id="address"
                value={profile.address || ""}
                onChange={(e) => updateProfile("address", e.target.value)}
                placeholder="123 Main Street"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-muted-foreground">{t.city}</Label>
              <Input
                id="city"
                value={profile.city || ""}
                onChange={(e) => updateProfile("city", e.target.value)}
                placeholder="Panama City"
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-muted-foreground mb-2 block">{language === "es" ? "Pin de mapa (ubicación GPS)" : "Map pin (GPS location)"}</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleGetLocation} className="gap-2">
                <MapPin className="w-4 h-4" />
                {t.getLocation}
              </Button>
              {profile.latitude && profile.longitude && (
                <span className="text-sm text-muted-foreground">
                  {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Analytics & Discovery */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {language === "es" ? "Analytics & Descubrimiento" : "Analytics & Discovery"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            {language === "es" 
              ? "Herramientas gratuitas para medir y hacer crecer tu negocio" 
              : "Free tools to measure and grow your business"}
          </p>
          
          <div className="space-y-3">
            {/* Google Business Profile */}
            <a 
              href="https://business.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Google Business Profile</span>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Gestiona tu perfil y reseñas en Google" : "Manage your profile and reviews on Google"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            {/* Google Analytics */}
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Google Analytics</span>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Analiza el tráfico de tu sitio web" : "Analyze your website traffic"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            {/* Google Search Console */}
            <a 
              href="https://search.google.com/search-console" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Google Search Console</span>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Optimiza tu presencia en búsquedas" : "Optimize your search presence"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            {/* Meta Business Suite */}
            <a 
              href="https://business.facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Meta Business Suite</span>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Gestiona Facebook e Instagram" : "Manage Facebook & Instagram"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            {/* Hotjar */}
            <a 
              href="https://www.hotjar.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Hotjar</span>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Mapas de calor y grabaciones de usuario" : "Heatmaps and user recordings"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
            {saving ? t.saving : t.saveAllChanges}
          </Button>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}