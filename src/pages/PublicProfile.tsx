import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Globe, 
  Instagram, 
  MessageCircle, 
  Phone, 
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  ShoppingBag,
  Share2,
  Twitter,
  Facebook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Profile {
  id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  storefront_image_url: string | null;
  website: string | null;
  instagram: string | null;
}

interface Storefront {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  slug: string;
  status: string;
}

export default function PublicProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check if it's a username (starts with @) or user_id
      const isUsername = profileId.startsWith("@");
      const lookupValue = isUsername ? profileId.slice(1) : profileId;

      let profileData;
      
      if (isUsername) {
        // Fetch by username
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", lookupValue)
          .maybeSingle();
        
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        profileData = data;
      } else {
        // Fetch by user_id
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", lookupValue)
          .maybeSingle();
        
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        profileData = data;
      }

      setProfile(profileData as Profile);

      // Fetch active storefronts for this user
      const userId = (profileData as any).user_id;
      const { data: storefrontData } = await supabase
        .from("storefronts")
        .select("id, title, price, image_url, slug, status")
        .eq("user_id", userId)
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(6);

      if (storefrontData) {
        setStorefronts(storefrontData as Storefront[]);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [profileId]);

  const pageUrl = window.location.href;
  const shareText = `Check out ${profile?.business_name || "this business"}! ✨`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `${shareText} ${pageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = `${shareText}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank");
  };

  const handleWhatsApp = () => {
    if (!profile?.phone) return;
    const phone = profile.phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <Sparkles className="w-8 h-8 text-white/50" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-white mb-2">Not found</h1>
          <p className="text-white/60">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const headerImage = profile?.storefront_image_url || profile?.logo_url;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Header - Full viewport height on mobile */}
      <div className="relative h-[70vh] min-h-[500px]">
        {/* Background Image with gradient overlay */}
        <div className="absolute inset-0">
          {headerImage ? (
            <img
              src={headerImage}
              alt={profile?.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400" />
          )}
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-orange-500/20" />
        </div>

        {/* Floating share buttons */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="p-3 rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 hover:bg-green-500/30 transition-all"
            title="Share on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-green-400" />
          </button>
          <button
            onClick={handleShareTwitter}
            className="p-3 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            title="Share on Twitter"
          >
            <Twitter className="w-5 h-5 text-blue-400" />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all group"
            title="Copy link"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        {/* Content at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Logo */}
          {profile?.logo_url && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl mb-4 bg-white/10 backdrop-blur">
              <img
                src={profile.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Business name with gradient text */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              {profile?.business_name}
            </span>
          </h1>

          {/* Business type badge */}
          {profile?.business_type && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-sm font-medium text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              {profile.business_type}
            </div>
          )}

          {/* Location */}
          {(profile?.city || profile?.address) && (
            <p className="flex items-center gap-2 text-white/60 mt-3 text-sm">
              <MapPin className="w-4 h-4" />
              {[profile?.address, profile?.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons - Sticky glass card */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-3">
          {profile?.phone && (
            <Button
              onClick={handleWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-6 text-base font-semibold gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </Button>
          )}
          {profile?.instagram && (
            <Button
              onClick={() => window.open(`https://instagram.com/${profile.instagram}`, "_blank")}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6 text-base font-semibold gap-2"
            >
              <Instagram className="w-5 h-5" />
              Instagram
            </Button>
          )}
          {profile?.website && (
            <Button
              onClick={() => window.open(profile.website!, "_blank")}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 rounded-full py-6 text-base font-semibold gap-2"
            >
              <Globe className="w-5 h-5" />
              Web
            </Button>
          )}
        </div>
      </div>

      {/* Active Storefronts */}
      {storefronts.length > 0 && (
        <section className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-violet-400" />
              Available Now
            </h2>
            <span className="text-sm text-white/40">{storefronts.length} items</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {storefronts.map((item) => (
              <Link
                key={item.id}
                to={`/s/${item.slug}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-lg font-bold text-white">${item.price.toFixed(2)}</p>
                </div>
                <div className="absolute top-3 right-3 p-2 rounded-full bg-white/10 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact Info Footer */}
      <section className="max-w-lg mx-auto px-4 py-8 border-t border-white/10">
        <div className="space-y-4">
          {profile?.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Call us</p>
                <p className="font-semibold text-white">{profile.phone}</p>
              </div>
            </a>
          )}

          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 uppercase tracking-wider">Website</p>
                <p className="font-semibold text-white truncate">{profile.website}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/40" />
            </a>
          )}
        </div>
      </section>

      {/* Branding footer */}
      <footer className="text-center py-8 text-white/30 text-sm">
        <p>Powered by <span className="font-semibold text-white/50">kitz.io</span> ✨</p>
      </footer>
    </div>
  );
}
