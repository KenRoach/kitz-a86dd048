import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

import { supabase } from "@/integrations/supabase/client";
import { 
  User, MapPin, Bell, Shield, Globe, Image, Save, Loader2, 
  RotateCcw, Languages, Clock
} from "lucide-react";
import { ApiKeySection } from "@/components/settings/ApiKeySection";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "PA", name: "Panama", phoneCode: "+507" },
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "CO", name: "Colombia", phoneCode: "+57" },
  { code: "CR", name: "Costa Rica", phoneCode: "+506" },
  { code: "GT", name: "Guatemala", phoneCode: "+502" },
];

const TIMEZONES = [
  { value: "America/Panama", label: "Panama (GMT-5)" },
  { value: "America/New_York", label: "New York (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
  { value: "America/Mexico_City", label: "Mexico City (GMT-6)" },
  { value: "America/Bogota", label: "Bogota (GMT-5)" },
];

export default function Settings() {
  const { user, profile, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || "",
    phone: profile?.phone || "",
    city: profile?.city || "",
    country: profile?.country || "PA",
    timezone: "America/Panama",
    notifications_email: true,
    notifications_push: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.logo_url);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleReplayTour = () => {
    localStorage.removeItem("kitz_spotlight_tour_complete");
    toast.success(language === "es" ? "Redirigiendo al tour..." : "Redirecting to tour...");
    navigate("/dashboard");
    setTimeout(() => window.location.reload(), 100);
  };

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

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: formData.business_name.trim(),
          phone: formData.phone?.trim() || null,
          city: formData.city?.trim() || null,
          country: formData.country || null,
          logo_url: newLogoUrl,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      setLogoFile(null);
      toast.success(language === "es" ? "Guardado" : "Saved");
    } catch {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Update formData when profile loads
  if (profile && !formData.business_name && profile.business_name) {
    setFormData(prev => ({
      ...prev,
      business_name: profile.business_name || "",
      phone: profile.phone || "",
      city: profile.city || "",
      country: profile.country || "PA",
    }));
    if (profile.logo_url && !logoPreview) {
      setLogoPreview(profile.logo_url);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-lg mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto animate-fade-in pb-24">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {language === "es" ? "Ajustes" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "es" 
              ? "Configuración de tu cuenta personal" 
              : "Your personal account settings"}
          </p>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              {language === "es" ? "Información Personal" : "Personal Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Photo */}
            <div>
              <Label className="mb-2 block text-sm">
                {language === "es" ? "Foto" : "Photo"}
              </Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-all"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-sm">{language === "es" ? "Nombre" : "Name"}</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder={language === "es" ? "Tu nombre" : "Your name"}
                className="mt-1.5"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="mt-1.5 bg-muted/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {language === "es" 
                  ? "El email no se puede cambiar" 
                  : "Email cannot be changed"}
              </p>
            </div>

            {/* Phone */}
            <div>
              <Label className="text-sm">{language === "es" ? "Teléfono" : "Phone"}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+507 6000-0000"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-primary" />
              {language === "es" ? "Ubicación" : "Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{language === "es" ? "Ciudad" : "City"}</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Panama City"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">{language === "es" ? "País" : "Country"}</Label>
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
              <Label className="text-sm flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {language === "es" ? "Zona Horaria" : "Timezone"}
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(v) => updateField("timezone", v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="w-4 h-4 text-primary" />
              {language === "es" ? "Idioma" : "Language"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {language === "es" ? "Idioma de la aplicación" : "App language"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Español" : "English"}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
              >
                {language === "en" ? "Español" : "English"}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4 text-primary" />
              {language === "es" ? "Notificaciones" : "Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "Recibir actualizaciones por email" 
                    : "Receive email updates"}
                </p>
              </div>
              <Switch
                checked={formData.notifications_email}
                onCheckedChange={(v) => updateField("notifications_email", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Push</p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "Notificaciones en el navegador" 
                    : "Browser notifications"}
                </p>
              </div>
              <Switch
                checked={formData.notifications_push}
                onCheckedChange={(v) => updateField("notifications_push", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              {language === "es" ? "Seguridad" : "Security"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {language === "es" ? "Cambiar contraseña" : "Change password"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "Actualiza tu contraseña" 
                    : "Update your password"}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {language === "es" ? "Cambiar" : "Change"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <ApiKeySection language={language} />

        {/* App Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-4 h-4 text-primary" />
              {language === "es" ? "Preferencias" : "Preferences"}
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
                <RotateCcw className="w-3 h-3" />
                {language === "es" ? "Repetir" : "Replay"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:static md:bg-transparent md:border-0 md:p-0">
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
            {language === "es" ? "Guardar" : "Save"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
