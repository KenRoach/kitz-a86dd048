import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, MapPin, CreditCard, Banknote, 
  Smartphone, Globe, Image, Instagram, Save, Loader2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
const BUSINESS_TYPES = [
  "Restaurant", "Cafe", "Bakery", "Food Truck", "Retail Store",
  "Online Store", "Services", "Beauty & Wellness", "Health & Fitness",
  "Education", "Consulting", "Creative Agency", "Photography", "Events", "Other",
];

const COUNTRIES = [
  { code: "PA", name: "Panama", phoneCode: "+507" },
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "CO", name: "Colombia", phoneCode: "+57" },
  { code: "CR", name: "Costa Rica", phoneCode: "+506" },
  { code: "GT", name: "Guatemala", phoneCode: "+502" },
];

interface ProfileSettingsTabProps {
  initialProfile?: any;
  onSaved?: () => void;
}

export function ProfileSettingsTab({ initialProfile, onSaved }: ProfileSettingsTabProps) {
  const { user, profile: authProfile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const profile = initialProfile || authProfile;

  const handleReplayTour = () => {
    localStorage.removeItem("kitz_spotlight_tour_complete");
    toast.success(language === "es" ? "Redirigiendo al tour..." : "Redirecting to tour...");
    navigate("/dashboard");
    // Small delay to ensure navigation completes before reload triggers tour
    setTimeout(() => window.location.reload(), 100);
  };
  
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || "",
    business_type: profile?.business_type || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    country: profile?.country || "PA",
    website: profile?.website || "",
    instagram: profile?.instagram || "",
    username: profile?.username || "",
    payment_cash: profile?.payment_cash ?? true,
    payment_cards: profile?.payment_cards ?? false,
    payment_yappy: profile?.payment_yappy ?? false,
    payment_pluxee: profile?.payment_pluxee ?? false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.logo_url);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("storefront-images").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("storefront-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.business_name.trim()) {
      toast.error(language === "es" ? "Nombre requerido" : "Name required");
      return;
    }
    
    setSaving(true);
    
    try {
      let newLogoUrl = profile?.logo_url;
      
      if (logoFile) {
        newLogoUrl = await uploadImage(logoFile);
      }

      const cleanUsername = formData.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || null;

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: formData.business_name.trim(),
          business_type: formData.business_type || null,
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          country: formData.country || null,
          logo_url: newLogoUrl,
          website: formData.website?.trim() || null,
          instagram: formData.instagram?.trim() || null,
          payment_cards: formData.payment_cards,
          payment_yappy: formData.payment_yappy,
          payment_cash: formData.payment_cash,
          payment_pluxee: formData.payment_pluxee,
          username: cleanUsername,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      setLogoFile(null);
      toast.success(language === "es" ? "Guardado" : "Saved");
      onSaved?.();
    } catch {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Brand & Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {language === "es" ? "Marca e Identidad" : "Brand & Identity"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div>
            <Label className="mb-2 block">{language === "es" ? "Logo" : "Logo"}</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-all"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Image className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>
          </div>

          {/* Business Name */}
          <div>
            <Label>{language === "es" ? "Nombre del Negocio" : "Business Name"}</Label>
            <Input
              value={formData.business_name}
              onChange={(e) => updateField("business_name", e.target.value)}
              placeholder="My Business"
              className="mt-1.5"
            />
          </div>

          {/* Business Type */}
          <div>
            <Label>{language === "es" ? "Tipo de Negocio" : "Business Type"}</Label>
            <Select
              value={formData.business_type}
              onValueChange={(v) => updateField("business_type", v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Username */}
          <div>
            <Label>{language === "es" ? "Nombre de usuario" : "Username"}</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="mybusiness"
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {language === "es" ? "Contacto y Ubicación" : "Contact & Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === "es" ? "Teléfono" : "Phone"}</Label>
            <Input
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+507 6000-0000"
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === "es" ? "Ciudad" : "City"}</Label>
              <Input
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Panama City"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{language === "es" ? "País" : "Country"}</Label>
              <Select
                value={formData.country}
                onValueChange={(v) => updateField("country", v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{language === "es" ? "Dirección" : "Address"}</Label>
            <Input
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="123 Main Street"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {language === "es" ? "Presencia Online" : "Online Presence"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {language === "es" ? "Sitio Web" : "Website"}
            </Label>
            <Input
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://mybusiness.com"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <Input
              value={formData.instagram}
              onChange={(e) => updateField("instagram", e.target.value)}
              placeholder="@mybusiness"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {language === "es" ? "Métodos de Pago" : "Payment Methods"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Métodos que aceptas de tus clientes" 
              : "Methods you accept from customers"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "payment_cash", label: language === "es" ? "Efectivo" : "Cash", icon: Banknote },
            { key: "payment_cards", label: language === "es" ? "Tarjetas" : "Cards", icon: CreditCard },
            { key: "payment_yappy", label: "Yappy", icon: Smartphone },
            { key: "payment_pluxee", label: "Pluxee", icon: CreditCard },
          ].map((method) => (
            <div key={method.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <method.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{method.label}</span>
              </div>
              <Switch
                checked={(formData as any)[method.key]}
                onCheckedChange={(v) => updateField(method.key, v)}
              />
            </div>
          ))}
      </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            {language === "es" ? "Preferencias de la App" : "App Preferences"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {language === "es" ? "Tour de la Aplicación" : "App Tour"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "es" 
                  ? "Revisa las funciones principales" 
                  : "Review the main features"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReplayTour} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {language === "es" ? "Repetir Tour" : "Replay Tour"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {language === "es" ? "Guardar Cambios" : "Save Changes"}
      </Button>
    </div>
  );
}
