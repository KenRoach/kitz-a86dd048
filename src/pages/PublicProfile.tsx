import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Globe, 
  Instagram, 
  MessageCircle, 
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  ShoppingBag,
  Twitter,
  Facebook,
  Send,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Saved contact info for repeat visitors
const CONTACT_INFO_KEY = "kitz_contact_info";
const CONTACT_INFO_EXPIRY_DAYS = 120;

interface SavedContactInfo {
  name: string;
  phone: string;
  email: string;
  savedAt: number;
}

function getSavedContactInfo(): SavedContactInfo | null {
  try {
    const saved = localStorage.getItem(CONTACT_INFO_KEY);
    if (!saved) return null;
    
    const info: SavedContactInfo = JSON.parse(saved);
    const expiryMs = CONTACT_INFO_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (Date.now() - info.savedAt > expiryMs) {
      localStorage.removeItem(CONTACT_INFO_KEY);
      return null;
    }
    
    return info;
  } catch {
    return null;
  }
}

function saveContactInfo(name: string, phone: string, email: string) {
  const info: SavedContactInfo = {
    name,
    phone,
    email,
    savedAt: Date.now(),
  };
  localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(info));
}

interface Profile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  storefront_image_url: string | null;
  website: string | null;
  instagram: string | null;
  username: string | null;
  payment_cards: boolean | null;
  payment_yappy: boolean | null;
  payment_cash: boolean | null;
  payment_pluxee: boolean | null;
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
  
  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved contact info
  useEffect(() => {
    const savedInfo = getSavedContactInfo();
    if (savedInfo) {
      setContactName(savedInfo.name);
      setContactPhone(savedInfo.phone);
      setContactEmail(savedInfo.email);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const isUsername = profileId.startsWith("@");
      const lookupValue = isUsername ? profileId.slice(1) : profileId;

      let profileData;
      
      if (isUsername) {
        const { data, error } = await supabase
          .from("public_profiles" as any)
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
        const { data, error } = await supabase
          .from("public_profiles" as any)
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

      // Fetch active storefronts
      const userId = (profileData as any).user_id;
      const { data: storefrontData } = await supabase
        .from("public_storefronts" as any)
        .select("id, title, price, image_url, slug, status")
        .eq("user_id", userId)
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(6);

      if (storefrontData) {
        setStorefronts(storefrontData as unknown as Storefront[]);
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
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank");
  };

  const handleSendMessage = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    if (!contactMessage.trim()) {
      toast.error("Please write a message");
      return;
    }

    setSubmitting(true);

    try {
      // Log the inquiry as an activity for the business owner
      const { error } = await supabase
        .from("activity_log")
        .insert({
          user_id: profile?.user_id,
          type: "message",
          message: `New inquiry from ${contactName.trim()}: "${contactMessage.trim().slice(0, 50)}..."`,
          related_id: profile?.id,
        });

      if (error) throw error;

      // Save contact info if opted in
      if (rememberMe) {
        saveContactInfo(contactName.trim(), contactPhone.trim(), contactEmail.trim());
      }

      setMessageSent(true);
      toast.success("Message sent! They'll get back to you soon.");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      {/* Hero Header */}
      <div className="relative h-[70vh] min-h-[500px]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-orange-500/20" />
        </div>

        {/* Share buttons */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="p-3 rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 hover:bg-green-500/30 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-green-400" />
          </button>
          <button
            onClick={handleShareTwitter}
            className="p-3 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all"
          >
            <Twitter className="w-5 h-5 text-blue-400" />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {profile?.logo_url && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl mb-4 bg-white/10 backdrop-blur">
              <img
                src={profile.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              {profile?.business_name}
            </span>
          </h1>

          {profile?.business_type && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-sm font-medium text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              {profile.business_type}
            </div>
          )}

          {(profile?.city || profile?.address) && (
            <p className="flex items-center gap-2 text-white/60 mt-3 text-sm">
              <MapPin className="w-4 h-4" />
              {[profile?.address, profile?.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-3">
          <Button
            onClick={() => setShowContactForm(true)}
            className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-full py-6 text-base font-semibold gap-2"
          >
            <Send className="w-5 h-5" />
            Contact
          </Button>
          {profile?.instagram && (
            <Button
              onClick={() => window.open(`https://instagram.com/${profile.instagram}`, "_blank")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-full py-6 px-6"
            >
              <Instagram className="w-5 h-5" />
            </Button>
          )}
          {profile?.website && (
            <Button
              onClick={() => window.open(profile.website!, "_blank")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-full py-6 px-6"
            >
              <Globe className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden animate-slide-in-right">
            {/* Form Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Contact {profile?.business_name}</h2>
                  <p className="text-sm text-white/60 mt-1">Send a message or inquiry</p>
                </div>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl text-white/60">×</span>
                </button>
              </div>
            </div>

            {/* Form Content */}
            {messageSent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-white/60 mb-6">
                  {profile?.business_name} will get back to you soon.
                </p>
                <Button
                  onClick={() => {
                    setShowContactForm(false);
                    setMessageSent(false);
                    setContactMessage("");
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-white/70 text-sm">Your name *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm">WhatsApp / Phone *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+507 6000-0000"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm">Email (optional)</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm">Message *</Label>
                  <div className="relative mt-1">
                    <Textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Hi! I'm interested in..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5"
                  />
                  <Label htmlFor="rememberMe" className="text-white/60 text-sm cursor-pointer">
                    Remember my info for faster contact
                  </Label>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-full py-6 text-base font-semibold gap-2 mt-4"
                >
                  {submitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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
                to={profile?.username ? `/p/@${profile.username}/${item.slug}` : `/s/${item.slug}`}
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
          {/* Contact CTA Card */}
          <button
            onClick={() => setShowContactForm(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">Get in touch</p>
              <p className="text-sm text-white/60">Send a message or inquiry</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-violet-400" />
          </button>

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

          {profile?.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 uppercase tracking-wider">Instagram</p>
                <p className="font-semibold text-white">@{profile.instagram}</p>
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
