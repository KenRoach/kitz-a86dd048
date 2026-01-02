import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Upload, User, MapPin, CreditCard, Banknote, Smartphone, Globe, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  business_name: string;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  ruc: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  photo_url: string | null;
  website: string | null;
  storefront_image_url: string | null;
  payment_cards: boolean;
  payment_yappy: boolean;
  payment_cash: boolean;
  payment_pluxee: boolean;
  latitude: number | null;
  longitude: number | null;
}

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    business_name: "",
    business_type: "",
    phone: "",
    address: "",
    ruc: "",
    city: "",
    country: "",
    logo_url: null,
    photo_url: null,
    website: "",
    storefront_image_url: null,
    payment_cards: false,
    payment_yappy: false,
    payment_cash: true,
    payment_pluxee: false,
    latitude: null,
    longitude: null,
  });
  
  // Image uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [storefrontFile, setStorefrontFile] = useState<File | null>(null);
  const [storefrontPreview, setStorefrontPreview] = useState<string | null>(null);
  
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
          address: data.address || "",
          ruc: (data as any).ruc || "",
          city: (data as any).city || "",
          country: (data as any).country || "",
          logo_url: (data as any).logo_url || null,
          photo_url: (data as any).photo_url || null,
          website: (data as any).website || "",
          storefront_image_url: (data as any).storefront_image_url || null,
          payment_cards: (data as any).payment_cards ?? false,
          payment_yappy: (data as any).payment_yappy ?? false,
          payment_cash: (data as any).payment_cash ?? true,
          payment_pluxee: (data as any).payment_pluxee ?? false,
          latitude: (data as any).latitude || null,
          longitude: (data as any).longitude || null,
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

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: profile.business_name.trim(),
          business_type: profile.business_type?.trim() || null,
          phone: profile.phone?.trim() || null,
          address: profile.address?.trim() || null,
          ruc: profile.ruc?.trim() || null,
          city: profile.city?.trim() || null,
          country: profile.country?.trim() || null,
          logo_url: newLogoUrl,
          website: profile.website?.trim() || null,
          storefront_image_url: newStorefrontUrl,
          payment_cards: profile.payment_cards,
          payment_yappy: profile.payment_yappy,
          payment_cash: profile.payment_cash,
          payment_pluxee: profile.payment_pluxee,
          latitude: profile.latitude,
          longitude: profile.longitude,
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

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
          <p className="text-muted-foreground mt-1">Set it once. Everything runs from here.</p>
        </div>

        {/* Brand Section */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Brand</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <Label className="mb-2 block text-muted-foreground">Business logo</Label>
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
              <Label className="mb-2 block text-muted-foreground">Storefront image</Label>
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
        </section>

        {/* Business Section */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Business</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName" className="text-muted-foreground">Business name</Label>
              <Input
                id="businessName"
                value={profile.business_name}
                onChange={(e) => updateProfile("business_name", e.target.value)}
                placeholder="My Business"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="businessType" className="text-muted-foreground">Business type</Label>
              <Input
                id="businessType"
                value={profile.business_type || ""}
                onChange={(e) => updateProfile("business_type", e.target.value)}
                placeholder="Restaurant, Retail..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ruc" className="text-muted-foreground">Tax ID (RUC)</Label>
              <Input
                id="ruc"
                value={profile.ruc || ""}
                onChange={(e) => updateProfile("ruc", e.target.value)}
                placeholder="12345678901"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-muted-foreground">Country</Label>
              <Input
                id="country"
                value={profile.country || ""}
                onChange={(e) => updateProfile("country", e.target.value)}
                placeholder="Panama"
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        {/* Contact & Presence */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact & Presence</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-muted-foreground">WhatsApp / Phone</Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => updateProfile("phone", e.target.value)}
                placeholder="+507 6000-0000"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-muted-foreground">Website</Label>
              <Input
                id="website"
                value={profile.website || ""}
                onChange={(e) => updateProfile("website", e.target.value)}
                placeholder="https://mybusiness.com"
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        {/* Payments */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Payments</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Credit / Debit cards</span>
              </div>
              <Switch
                checked={profile.payment_cards}
                onCheckedChange={(checked) => updateProfile("payment_cards", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-attention/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-attention" />
                </div>
                <span className="font-medium text-foreground">Yappy (Banco General)</span>
              </div>
              <Switch
                checked={profile.payment_yappy}
                onCheckedChange={(checked) => updateProfile("payment_yappy", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-success" />
                </div>
                <span className="font-medium text-foreground">Cash</span>
              </div>
              <Switch
                checked={profile.payment_cash}
                onCheckedChange={(checked) => updateProfile("payment_cash", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Pluxee</span>
              </div>
              <Switch
                checked={profile.payment_pluxee}
                onCheckedChange={(checked) => updateProfile("payment_pluxee", checked)}
              />
            </div>
          </div>
        </section>

        {/* Location & Discovery */}
        <section className="neu-card-flat p-6 space-y-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Location & Discovery</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address" className="text-muted-foreground">Street address</Label>
              <Input
                id="address"
                value={profile.address || ""}
                onChange={(e) => updateProfile("address", e.target.value)}
                placeholder="123 Main Street"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-muted-foreground">City</Label>
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
            <Label className="text-muted-foreground mb-2 block">Map pin (GPS location)</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleGetLocation} className="gap-2">
                <MapPin className="w-4 h-4" />
                Get current location
              </Button>
              {profile.latitude && profile.longitude && (
                <span className="text-sm text-muted-foreground">
                  {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
            {saving ? "Saving..." : "Save all changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}