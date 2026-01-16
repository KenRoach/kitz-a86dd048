import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, MessageCircle, CheckCircle, ArrowLeft, CreditCard, Banknote, Smartphone, Globe, ShoppingBag, User, Phone, Mail, Package, Save, Upload, FileText, ThumbsUp, ChefHat, PackageCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { PaymentProofUpload } from "@/components/storefront/PaymentProofUpload";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const BUYER_INFO_KEY = "kitz_buyer_info";
const BUYER_INFO_EXPIRY_DAYS = 120;

interface SavedBuyerInfo {
  name: string;
  phone: string;
  email: string;
  savedAt: number;
}

function getSavedBuyerInfo(): SavedBuyerInfo | null {
  try {
    const saved = localStorage.getItem(BUYER_INFO_KEY);
    if (!saved) return null;
    
    const info: SavedBuyerInfo = JSON.parse(saved);
    const expiryMs = BUYER_INFO_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    // Check if expired
    if (Date.now() - info.savedAt > expiryMs) {
      localStorage.removeItem(BUYER_INFO_KEY);
      return null;
    }
    
    return info;
  } catch {
    return null;
  }
}

function saveBuyerInfo(name: string, phone: string, email: string) {
  const info: SavedBuyerInfo = {
    name,
    phone,
    email,
    savedAt: Date.now(),
  };
  localStorage.setItem(BUYER_INFO_KEY, JSON.stringify(info));
}

interface StorefrontItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  sort_order: number;
}

interface Storefront {
  id: string;
  title: string;
  description: string | null;
  price: number;
  quantity: number;
  status: string;
  image_url: string | null;
  customer_name: string | null;
  fulfillment_note: string | null;
  payment_cards: boolean;
  payment_yappy: boolean;
  payment_cash: boolean;
  payment_pluxee: boolean;
  ordered_at: string | null;
  is_bundle: boolean;
  user_id: string | null;
  mode: string;
  valid_until: string | null;
  accepted_at: string | null;
  fulfillment_status: string | null;
  version_major: number;
  version_minor: number;
  version_patch: number;
  version_updated_at: string;
}

export default function PublicStorefront() {
  const { slug, username, storefrontSlug } = useParams<{ slug?: string; username?: string; storefrontSlug?: string }>();
  const effectiveSlug = storefrontSlug || slug;
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [bundleItems, setBundleItems] = useState<StorefrontItem[]>([]);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [sellerUsername, setSellerUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [hasSavedInfo, setHasSavedInfo] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(false);

  // Buyer form
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved buyer info on mount
  useEffect(() => {
    const savedInfo = getSavedBuyerInfo();
    if (savedInfo) {
      setBuyerName(savedInfo.name);
      setBuyerPhone(savedInfo.phone);
      setBuyerEmail(savedInfo.email);
      setHasSavedInfo(true);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const fetchStorefront = async () => {
      if (!effectiveSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Use public view that excludes sensitive data (buyer info, seller phone)
      const { data, error } = await supabase
        .from("public_storefronts" as any)
        .select("id, title, description, price, quantity, status, image_url, customer_name, fulfillment_note, payment_cards, payment_yappy, payment_cash, payment_pluxee, ordered_at, is_bundle, user_id, mode, valid_until, accepted_at, fulfillment_status, version_major, version_minor, version_patch, version_updated_at")
        .eq("slug", effectiveSlug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        const storefrontData = data as unknown as Storefront;
        setStorefront(storefrontData);
        
        // Fetch business name and username from the seller's profile
        if (storefrontData.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("public_profiles" as any)
            .select("business_name, username")
            .eq("user_id", storefrontData.user_id)
            .maybeSingle();
          
          if (!profileError && profileData) {
            const profile = profileData as unknown as { business_name: string | null; username: string | null };
            if (profile.business_name) {
              setBusinessName(profile.business_name.trim());
            }
            if (profile.username) {
              setSellerUsername(profile.username);
            }
          }
        }
        
        // If already ordered, show that
        if (storefrontData.ordered_at) {
          setOrderPlaced(true);
        }
        
        // Check if quote was already accepted
        if (storefrontData.accepted_at) {
          setQuoteAccepted(true);
        }

        // Fetch bundle items if it's a bundle
        if (storefrontData.is_bundle) {
          const { data: items } = await supabase
            .from("storefront_items")
            .select("*")
            .eq("storefront_id", storefrontData.id)
            .order("sort_order", { ascending: true });
          
          if (items) {
            setBundleItems(items as StorefrontItem[]);
          }
        }
      }
      setLoading(false);
    };

    fetchStorefront();
  }, [effectiveSlug]);

  const handlePlaceOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke("place-order", {
        body: {
          slug: effectiveSlug,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerNote: buyerNote.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Save buyer info if they opted in
      if (rememberMe) {
        saveBuyerInfo(buyerName.trim(), buyerPhone.trim(), buyerEmail.trim());
        toast.success("Order placed! Your info is saved for faster checkout.");
      } else if (!hasSavedInfo) {
        // Show save prompt after order if they didn't have saved info
        setShowSavePrompt(true);
      }

      setOrderPlaced(true);
      setShowCheckout(false);
      if (!rememberMe && !showSavePrompt) {
        toast.success("Order placed! The seller will contact you soon.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveInfo = () => {
    saveBuyerInfo(buyerName.trim(), buyerPhone.trim(), buyerEmail.trim());
    setShowSavePrompt(false);
    toast.success("Info saved! Your next purchase will be faster.");
  };

  const handleSkipSave = () => {
    setShowSavePrompt(false);
    toast.success("Order placed! The seller will contact you soon.");
  };

  const handleAcceptQuote = async () => {
    if (!storefront) return;
    
    setAcceptingQuote(true);
    try {
      const { error } = await supabase
        .from("storefronts")
        .update({ accepted_at: new Date().toISOString() } as any)
        .eq("id", storefront.id);
      
      if (error) throw error;
      
      setQuoteAccepted(true);
      toast.success("Quote accepted! You can now proceed to order.");
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast.error("Failed to accept quote");
    } finally {
      setAcceptingQuote(false);
    }
  };

  // WhatsApp contact is no longer available on public storefront - seller phone is hidden for security

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Storefront not found</h1>
          <p className="text-muted-foreground mb-6">This link may have expired or doesn't exist.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = storefront?.status === "paid";
  const isBundle = storefront?.is_bundle && bundleItems.length > 0;
  const isQuote = storefront?.mode === "quote";
  const needsQuoteAcceptance = isQuote && !quoteAccepted && !orderPlaced && !isPaid;

  // Collect enabled payment methods
  const paymentMethods = [
    { enabled: storefront?.payment_cards, icon: CreditCard, label: "Cards", color: "text-primary" },
    { enabled: storefront?.payment_yappy, icon: Smartphone, label: "Yappy", color: "text-attention" },
    { enabled: storefront?.payment_cash, icon: Banknote, label: "Cash", color: "text-success" },
    { enabled: storefront?.payment_pluxee, icon: Globe, label: "Pluxee", color: "text-muted-foreground" },
  ].filter(m => m.enabled);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Clean, trust-building */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sellerUsername ? (
              <Link 
                to={`/p/@${sellerUsername}`} 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {businessName || "Store"}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground">{businessName || "Store"}</span>
            )}
            {/* Trust indicator */}
            <span className="trust-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Verified
            </span>
          </div>
          
          {/* Status badges - minimal */}
          {isPaid && (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle className="w-3.5 h-3.5" />
              {storefront?.fulfillment_status === "complete" ? "Complete" : 
               storefront?.fulfillment_status === "ready" ? "Ready" :
               storefront?.fulfillment_status === "preparing" ? "Preparing" : "Paid"}
            </span>
          )}
          {orderPlaced && !isPaid && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <ShoppingBag className="w-3.5 h-3.5" />
              Ordered
            </span>
          )}
          {needsQuoteAcceptance && (
            <span className="flex items-center gap-1 text-xs font-medium text-attention">
              <FileText className="w-3.5 h-3.5" />
              Quote
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto p-4 pb-48">
        {/* Quote banner */}
        {isQuote && !quoteAccepted && !orderPlaced && !isPaid && (
          <div className="bg-attention/10 border border-attention/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FileText className="w-5 h-5 text-attention flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">This is a quote</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review the details and accept this quote to proceed with your order.
              </p>
            </div>
          </div>
        )}
        
        {isQuote && quoteAccepted && !orderPlaced && !isPaid && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ThumbsUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Quote accepted!</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                You can now proceed to place your order.
              </p>
            </div>
          </div>
        )}

        {/* Hero section - different for bundles */}
        {isBundle ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Bundle</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{storefront?.title}</h1>
            {storefront?.customer_name && (
              <p className="text-muted-foreground mt-1">For: {storefront.customer_name}</p>
            )}
            {storefront?.description && (
              <p className="text-muted-foreground mt-2">{storefront.description}</p>
            )}
          </div>
        ) : (
          <>
            {/* Product image for single items - Optimized with lazy loading */}
            <OptimizedImage
              src={storefront?.image_url}
              alt={storefront?.title || "Product"}
              containerClassName="rounded-2xl mb-6"
              aspectRatio="square"
              priority={true} // Above the fold
              fallbackIcon={<ImageIcon className="w-16 h-16 text-muted-foreground/30" />}
            />

            {/* Product details for single items */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">{storefront?.title}</h1>
              {storefront?.customer_name && (
                <p className="text-muted-foreground mt-1">For: {storefront.customer_name}</p>
              )}
              {storefront?.description && (
                <p className="text-muted-foreground mt-2">{storefront.description}</p>
              )}
              {(storefront?.quantity || 1) > 1 && (
                <p className="text-sm text-muted-foreground mt-2">Quantity: {storefront?.quantity}</p>
              )}
            </div>
          </>
        )}

        {/* Bundle items - Order Summary */}
        {isBundle && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">Order Summary</h2>
              <p className="text-sm text-muted-foreground">{bundleItems.length} items</p>
            </div>
            <div className="divide-y divide-border">
              {bundleItems.map((item, index) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {/* Item image - Lazy loaded for bundle items */}
                  <OptimizedImage
                    src={item.image_url}
                    alt={item.title}
                    containerClassName="w-20 h-20 rounded-xl flex-shrink-0"
                    priority={index < 2} // First 2 items load immediately
                    fallbackIcon={<ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                  />
                  
                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="font-semibold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bundle total */}
            <div className="p-4 bg-muted/30 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">
                  ${storefront?.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fulfillment note */}
        {storefront?.fulfillment_note && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Delivery info:</span>{" "}
              {storefront.fulfillment_note}
            </p>
          </div>
        )}

        {/* Payment methods */}
        {paymentMethods.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Accepted payments</p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 text-sm"
                >
                  <method.icon className={cn("w-4 h-4", method.color)} />
                  <span className="text-foreground font-medium">{method.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checkout Form */}
        {showCheckout && !orderPlaced && !isPaid && (
          <div className="bg-card rounded-2xl p-5 border border-border space-y-4 animate-fade-in">
            <h3 className="font-semibold text-foreground">Your details</h3>
            
            <div>
              <Label htmlFor="buyerName" className="text-muted-foreground text-sm">
                Your name *
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="John Doe"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyerPhone" className="text-muted-foreground text-sm">
                WhatsApp / Phone *
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="buyerPhone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+507 6000-0000"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyerEmail" className="text-muted-foreground text-sm">
                Email (optional)
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyerNote" className="text-muted-foreground text-sm">
                Note (optional)
              </Label>
              <Textarea
                id="buyerNote"
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
                placeholder="Any special requests..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Remember me toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Save my info for faster checkout</span>
              </div>
              <Switch
                checked={rememberMe}
                onCheckedChange={setRememberMe}
              />
            </div>
            {hasSavedInfo && (
              <p className="text-xs text-muted-foreground">
                ✓ Using your saved info
              </p>
            )}
          </div>
        )}

        {/* Save Info Prompt - shown after order if not already saved */}
        {showSavePrompt && (
          <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Save className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Save your info?</h3>
                <p className="text-sm text-muted-foreground">Speed up your next purchase</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              We'll remember your details for 120 days so you can checkout faster next time.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkipSave} className="flex-1">
                No thanks
              </Button>
              <Button onClick={handleSaveInfo} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                Save my info
              </Button>
            </div>
          </div>
        )}

        {/* Order Confirmation */}
        {orderPlaced && !isPaid && !showSavePrompt && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Order received!</h3>
              <p className="text-muted-foreground text-sm">
                Upload your payment proof below, or the seller will contact you.
              </p>
            </div>
            
            {/* Payment Proof Upload */}
            {storefront && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <PaymentProofUpload storefrontId={storefront.id} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          {!isBundle && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground">Total</span>
              <span className="text-3xl font-bold text-foreground">
                ${storefront?.price.toFixed(2)}
              </span>
            </div>
          )}

          {isBundle && !showCheckout && !orderPlaced && !isPaid && (
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm text-muted-foreground">{bundleItems.length} items</span>
              </div>
              <span className="text-3xl font-bold text-foreground">
                ${storefront?.price.toFixed(2)}
              </span>
            </div>
          )}

          {isPaid ? (
            <div className="w-full py-4 rounded-full bg-success/10 text-success font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Payment complete
            </div>
          ) : orderPlaced ? (
            <div className="w-full py-4 rounded-full bg-primary/10 text-primary font-semibold text-center flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Awaiting payment
            </div>
          ) : needsQuoteAcceptance ? (
            <Button
              onClick={handleAcceptQuote}
              disabled={acceptingQuote}
              className="w-full py-6 text-lg gap-2 bg-attention hover:bg-attention/90"
              size="lg"
            >
              <ThumbsUp className="w-5 h-5" />
              {acceptingQuote ? "Accepting..." : "Accept Quote"}
            </Button>
          ) : showCheckout ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={submitting || !buyerName.trim() || !buyerPhone.trim()}
                className="flex-1 py-6"
                size="lg"
              >
                {submitting ? "Placing order..." : "Place order"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full py-6 text-lg gap-2"
              size="lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Order now
            </Button>
          )}
        </div>
        
        {/* Version stamp + Powered by */}
        <div className="text-center py-3 space-y-1.5">
          {/* Version stamp for trust & audit */}
          <div className="text-xs text-muted-foreground/70 font-mono">
            Business Flow v{storefront?.version_major || 1}.{storefront?.version_minor || 0}.{storefront?.version_patch || 0}
            <span className="mx-1.5">—</span>
            Updated: {storefront?.version_updated_at 
              ? new Date(storefront.version_updated_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'N/A'}
            <span className="mx-1.5">—</span>
            Status: <span className={cn(
              "font-medium",
              isPaid ? "text-success" : 
              orderPlaced ? "text-primary" : 
              storefront?.status === "sent" ? "text-attention" : "text-muted-foreground"
            )}>
              {isPaid ? "Paid" : orderPlaced ? "Ordered" : storefront?.status === "sent" ? "Sent" : "Draft"}
            </span>
          </div>
          
          {/* Powered by */}
          <span className="powered-by">
            Powered by <a href="/" className="hover:text-primary transition-colors">Kitz</a>
          </span>
        </div>
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}