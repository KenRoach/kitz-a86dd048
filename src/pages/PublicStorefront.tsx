import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageIcon, MessageCircle, CheckCircle, ArrowLeft, CreditCard, Banknote, Smartphone, Globe, ShoppingBag, User, Phone, Mail, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  seller_phone: string | null;
  payment_cards: boolean;
  payment_yappy: boolean;
  payment_cash: boolean;
  payment_pluxee: boolean;
  buyer_name: string | null;
  ordered_at: string | null;
  is_bundle: boolean;
}

export default function PublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [bundleItems, setBundleItems] = useState<StorefrontItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Buyer form
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  useEffect(() => {
    const fetchStorefront = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("storefronts")
        .select("id, title, description, price, quantity, status, image_url, customer_name, fulfillment_note, seller_phone, payment_cards, payment_yappy, payment_cash, payment_pluxee, buyer_name, ordered_at, is_bundle")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStorefront(data as Storefront);
        
        // If already ordered, show that
        if (data.ordered_at || data.buyer_name) {
          setOrderPlaced(true);
        }

        // Fetch bundle items if it's a bundle
        if (data.is_bundle) {
          const { data: items } = await supabase
            .from("storefront_items")
            .select("*")
            .eq("storefront_id", data.id)
            .order("sort_order", { ascending: true });
          
          if (items) {
            setBundleItems(items as StorefrontItem[]);
          }
        }
      }
      setLoading(false);
    };

    fetchStorefront();
  }, [slug]);

  const handlePlaceOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke("place-order", {
        body: {
          slug,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerNote: buyerNote.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setOrderPlaced(true);
      setShowCheckout(false);
      toast.success("Order placed! The seller will contact you soon.");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = `Hi! I'd like to pay for: ${storefront?.title} ($${storefront?.price.toFixed(2)})`;
    const phone = storefront?.seller_phone?.replace(/[^0-9+]/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

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

  // Collect enabled payment methods
  const paymentMethods = [
    { enabled: storefront?.payment_cards, icon: CreditCard, label: "Cards", color: "text-primary" },
    { enabled: storefront?.payment_yappy, icon: Smartphone, label: "Yappy", color: "text-attention" },
    { enabled: storefront?.payment_cash, icon: Banknote, label: "Cash", color: "text-success" },
    { enabled: storefront?.payment_pluxee, icon: Globe, label: "Pluxee", color: "text-muted-foreground" },
  ].filter(m => m.enabled);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">kitz.io</span>
          {isPaid && (
            <span className="flex items-center gap-1 text-sm font-medium text-success">
              <CheckCircle className="w-4 h-4" />
              Paid
            </span>
          )}
          {orderPlaced && !isPaid && (
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              <ShoppingBag className="w-4 h-4" />
              Order placed
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto p-4 pb-48">
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
            {/* Product image for single items */}
            <div className="aspect-square rounded-2xl bg-muted overflow-hidden mb-6">
              {storefront?.image_url ? (
                <img
                  src={storefront.image_url}
                  alt={storefront.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

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
              {bundleItems.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {/* Item image */}
                  <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  
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
          </div>
        )}

        {/* Order Confirmation */}
        {orderPlaced && !isPaid && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Order received!</h3>
            <p className="text-muted-foreground text-sm">
              The seller has been notified and will contact you to arrange payment.
            </p>
            {storefront?.seller_phone && (
              <Button
                variant="outline"
                onClick={handleWhatsAppContact}
                className="mt-4 gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message seller on WhatsApp
              </Button>
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
      </div>
    </div>
  );
}