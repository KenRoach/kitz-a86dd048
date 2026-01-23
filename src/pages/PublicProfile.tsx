import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Globe, 
  Instagram, 
  MessageCircle, 
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  Send,
  User,
  Phone,
  Mail,
  CheckCircle,
  Star,
  Shield,
  Repeat,
  Clock,
  TrendingUp,
  Award,
  Zap,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { PublicLayout } from "@/components/layout/PublicLayout";

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
  description: string | null;
}

interface UserStats {
  total_orders: number;
  total_customers: number;
  total_storefronts: number;
  level: number;
  streak_days: number;
  created_at: string;
}

interface TrustMetrics {
  trustScore: number;
  completedOrders: number;
  repeatCustomerRate: number;
  memberSince: string;
  responseRate: number;
  isVerified: boolean;
  level: number;
}

function calculateTrustScore(stats: UserStats | null, profileComplete: boolean): TrustMetrics {
  if (!stats) {
    return {
      trustScore: 3.0,
      completedOrders: 0,
      repeatCustomerRate: 0,
      memberSince: "New",
      responseRate: 100,
      isVerified: false,
      level: 1,
    };
  }

  // Calculate trust score (1-5 stars)
  let score = 3.0;
  
  // Orders boost (up to +1.0)
  if (stats.total_orders >= 50) score += 1.0;
  else if (stats.total_orders >= 20) score += 0.7;
  else if (stats.total_orders >= 10) score += 0.5;
  else if (stats.total_orders >= 5) score += 0.3;
  
  // Profile completeness (+0.3)
  if (profileComplete) score += 0.3;
  
  // Streak bonus (+0.2)
  if (stats.streak_days >= 7) score += 0.2;
  
  // Level bonus (+0.3)
  if (stats.level >= 5) score += 0.3;
  else if (stats.level >= 3) score += 0.2;
  
  // Cap at 5.0
  score = Math.min(5.0, Math.round(score * 10) / 10);

  // Calculate repeat customer rate
  const repeatRate = stats.total_customers > 0 
    ? Math.min(100, Math.round((stats.total_orders / stats.total_customers - 1) * 50))
    : 0;

  // Calculate member since
  const createdDate = new Date(stats.created_at);
  const now = new Date();
  const months = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  let memberSince = "New";
  if (months >= 12) memberSince = `${Math.floor(months / 12)}+ year${Math.floor(months / 12) > 1 ? 's' : ''}`;
  else if (months >= 1) memberSince = `${months} month${months > 1 ? 's' : ''}`;
  else memberSince = "New";

  return {
    trustScore: score,
    completedOrders: stats.total_orders,
    repeatCustomerRate: Math.max(0, repeatRate),
    memberSince,
    responseRate: 95 + Math.min(5, stats.level),
    isVerified: stats.total_orders >= 5 && profileComplete,
    level: stats.level,
  };
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-white/10 text-white/20"
          )}
        />
      ))}
    </div>
  );
}

export default function PublicProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics | null>(null);
  
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

      const userId = (profileData as any).user_id;

      // Fetch user stats for trust metrics
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Check profile completeness
      const p = profileData as Profile;
      const profileComplete = !!(p.business_name && p.business_type && (p.logo_url || p.storefront_image_url));
      
      const metrics = calculateTrustScore(statsData as UserStats | null, profileComplete);
      setTrustMetrics(metrics);

      // Fetch active storefronts (promos/products)
      const { data: storefrontData } = await supabase
        .from("public_storefronts" as any)
        .select("id, title, price, image_url, slug, status, description")
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppContact = () => {
    // Open WhatsApp with the business (we'd need phone from profile, for now just open WhatsApp)
    const text = `Hi! I found your profile on Kitz and I'm interested in your products/services.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
      const { error } = await supabase
        .from("activity_log")
        .insert({
          user_id: profile?.user_id,
          type: "message",
          message: `New inquiry from ${contactName.trim()}: "${contactMessage.trim().slice(0, 50)}..."`,
          related_id: profile?.id,
        });

      if (error) throw error;

      if (rememberMe) {
        saveContactInfo(contactName.trim(), contactPhone.trim(), contactEmail.trim());
      }

      setMessageSent(true);
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-pulse">
            <Sparkles className="w-8 h-8 text-white/50" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-6xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-white mb-2">Not found</h1>
            <p className="text-white/60">This profile doesn't exist or has been removed.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const headerImage = profile?.storefront_image_url || profile?.logo_url;

  return (
    <PublicLayout>
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Compact Header */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-emerald-600/20 via-zinc-950 to-zinc-950" />
        
        <div className="relative max-w-lg mx-auto px-4 pt-6 pb-4">
          {/* Top bar with share */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-full bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>

          {/* Profile Card - Uber Style */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
            {/* Main Profile Section */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar - Optimized with lazy loading */}
                <div className="relative">
                  {profile?.logo_url ? (
                    <OptimizedImage
                      src={profile.logo_url}
                      alt={profile?.business_name || "Business"}
                      containerClassName="w-20 h-20 rounded-2xl border-2 border-white/10"
                      priority={true}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-2 border-white/10">
                      <span className="text-3xl font-bold text-white">
                        {profile?.business_name?.charAt(0) || "B"}
                      </span>
                    </div>
                  )}
                  {trustMetrics?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Name & Rating */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white truncate">
                    {profile?.business_name}
                  </h1>
                  
                  {profile?.business_type && (
                    <p className="text-sm text-white/60 mt-0.5">{profile.business_type}</p>
                  )}

                  {/* Trust Score */}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={trustMetrics?.trustScore || 0} size="sm" />
                    <span className="text-lg font-semibold text-white">
                      {trustMetrics?.trustScore.toFixed(1)}
                    </span>
                  </div>

                  {(profile?.city || profile?.address) && (
                    <p className="flex items-center gap-1.5 text-xs text-white/50 mt-2">
                      <MapPin className="w-3 h-3" />
                      {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Trust Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">{trustMetrics?.completedOrders || 0}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">Orders</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-emerald-400">{trustMetrics?.repeatCustomerRate || 0}%</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">Repeat</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">{trustMetrics?.responseRate || 0}%</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">Response</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">Lv{trustMetrics?.level || 1}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">Level</div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {trustMetrics?.isVerified && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Verified Seller
                  </div>
                )}
                {(trustMetrics?.completedOrders || 0) >= 10 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                    <Award className="w-3 h-3" />
                    Trusted
                  </div>
                )}
                {(trustMetrics?.repeatCustomerRate || 0) >= 20 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                    <Repeat className="w-3 h-3" />
                    High Repeat
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs">
                  <Clock className="w-3 h-3" />
                  {trustMetrics?.memberSince}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 pt-0 flex gap-2">
              <Button
                onClick={() => setShowContactForm(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-6 text-base font-semibold gap-2"
              >
                <Send className="w-5 h-5" />
                Contact
              </Button>
              <Button
                onClick={handleWhatsAppContact}
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl py-6 px-5"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
              {profile?.instagram && (
                <Button
                  onClick={() => window.open(`https://instagram.com/${profile.instagram}`, "_blank")}
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl py-6 px-5"
                >
                  <Instagram className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Storefronts / Promos */}
      {storefronts.length > 0 && (
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Available Now
            </h2>
            <span className="text-xs text-white/50">{storefronts.length} items</span>
          </div>
          
          <div className="space-y-3">
            {storefronts.map((storefront) => (
              <Link
                key={storefront.id}
                to={`/s/${storefront.slug}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900 transition-all group"
              >
                {storefront.image_url ? (
                  <OptimizedImage
                    src={storefront.image_url}
                    alt={storefront.title}
                    containerClassName="w-16 h-16 rounded-xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                    {storefront.title}
                  </h3>
                  {storefront.description && (
                    <p className="text-sm text-white/50 truncate mt-0.5">
                      {storefront.description}
                    </p>
                  )}
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    ${storefront.price.toFixed(2)}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-sm font-medium text-white/50 mb-3">Accepts</h2>
        <div className="flex flex-wrap gap-2">
          {profile?.payment_cash && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 text-sm">
              💵 Cash
            </div>
          )}
          {profile?.payment_yappy && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 text-sm">
              📱 Yappy
            </div>
          )}
          {profile?.payment_cards && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 text-sm">
              💳 Cards
            </div>
          )}
          {profile?.payment_pluxee && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 text-sm">
              🎟️ Pluxee
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      {(profile?.website || profile?.instagram) && (
        <div className="max-w-lg mx-auto px-4 pb-8">
          <h2 className="text-sm font-medium text-white/50 mb-3">Links</h2>
          <div className="space-y-2">
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Globe className="w-5 h-5 text-white/50" />
                <span className="text-sm text-white/70">{profile.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-4 h-4 text-white/30 ml-auto" />
              </a>
            )}
            {profile?.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Instagram className="w-5 h-5 text-white/50" />
                <span className="text-sm text-white/70">@{profile.instagram}</span>
                <ExternalLink className="w-4 h-4 text-white/30 ml-auto" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Powered by */}
      <div className="max-w-lg mx-auto px-4 pb-8 text-center">
        <p className="text-xs text-white/30">
          Powered by Kitz • Share your link to grow
        </p>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden animate-slide-in-right">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
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

            {messageSent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
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
                      placeholder="Your name"
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
                  <Textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Hi! I'm interested in..."
                    rows={3}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5"
                  />
                  <Label htmlFor="rememberMe" className="text-white/60 text-sm cursor-pointer">
                    Remember me for faster contact
                  </Label>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={submitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-6 text-base font-semibold"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </PublicLayout>
  );
}
