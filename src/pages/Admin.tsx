import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminSection } from "@/components/admin/AdminSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Upload, X, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [ruc, setRuc] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  
  // Image uploads
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setBusinessName(data.business_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setRuc((data as any).ruc || "");
        setCity((data as any).city || "");
        setCountry((data as any).country || "");
        setLogoUrl((data as any).logo_url || null);
        setPhotoUrl((data as any).photo_url || null);
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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      // Upload images if changed
      let newLogoUrl = logoUrl;
      let newPhotoUrl = photoUrl;
      
      if (logoFile) {
        newLogoUrl = await uploadImage(logoFile, "logo");
      }
      if (photoFile) {
        newPhotoUrl = await uploadImage(photoFile, "photo");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: businessName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          ruc: ruc.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          logo_url: newLogoUrl,
          photo_url: newPhotoUrl,
        } as any)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to save changes");
        return;
      }

      // Clear file states after successful upload
      if (logoFile) {
        setLogoUrl(newLogoUrl);
        setLogoFile(null);
      }
      if (photoFile) {
        setPhotoUrl(newPhotoUrl);
        setPhotoFile(null);
      }

      toast.success("Changes saved");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
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
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          <p className="text-muted-foreground mt-1">Business settings — set once, forget forever.</p>
        </div>

        {/* Sections */}
        <div className="grid gap-6">
          {/* Branding */}
          <AdminSection
            title="Branding"
            description="Logo and profile photo for your storefront"
          >
            <div className="flex flex-wrap gap-6">
              {/* Logo */}
              <div>
                <Label className="mb-2 block">Business Logo</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, setLogoFile, setLogoPreview)}
                  className="hidden"
                />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-colors"
                >
                  {logoPreview || logoUrl ? (
                    <img src={logoPreview || logoUrl || ""} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Building2 className="w-6 h-6 mx-auto text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground mt-1 block">Logo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <Label className="mb-2 block">Your Photo</Label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, setPhotoFile, setPhotoPreview)}
                  className="hidden"
                />
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-colors"
                >
                  {photoPreview || photoUrl ? (
                    <img src={photoPreview || photoUrl || ""} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <User className="w-6 h-6 mx-auto text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground mt-1 block">Photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AdminSection>

          {/* Business Profile */}
          <AdminSection
            title="Business Profile"
            description="Your business name and contact information"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="My Business"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp / Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0100"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruc">RUC / Tax ID</Label>
                  <Input
                    id="ruc"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="12345678901"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Peru"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </AdminSection>

          {/* Location */}
          <AdminSection
            title="Location"
            description="Where customers can find you"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Street address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lima"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Location will appear on your public storefront</span>
              </div>
            </div>
          </AdminSection>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? "Saving..." : "Save all changes"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
