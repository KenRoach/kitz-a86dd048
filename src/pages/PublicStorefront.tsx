import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImageIcon, MessageCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export default function PublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStorefront = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("storefronts")
        .select("id, title, description, price, quantity, status, image_url, customer_name, fulfillment_note")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStorefront(data);
      }
      setLoading(false);
    };

    fetchStorefront();
  }, [slug]);

  const handleWhatsAppContact = () => {
    const message = `Hi! I'd like to pay for: ${storefront?.title} ($${storefront?.price.toFixed(2)})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
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
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto p-4 pb-32">
        {/* Product image */}
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

        {/* Product details */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{storefront?.title}</h1>
            {storefront?.customer_name && (
              <p className="text-muted-foreground mt-1">For: {storefront.customer_name}</p>
            )}
          </div>

          {storefront?.description && (
            <p className="text-muted-foreground">{storefront.description}</p>
          )}

          {storefront?.fulfillment_note && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Delivery info:</span>{" "}
                {storefront.fulfillment_note}
              </p>
            </div>
          )}

          {(storefront?.quantity || 1) > 1 && (
            <p className="text-sm text-muted-foreground">Quantity: {storefront?.quantity}</p>
          )}
        </div>
      </main>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">
              ${storefront?.price.toFixed(2)}
            </span>
          </div>

          {isPaid ? (
            <div className="w-full py-4 rounded-xl bg-success/10 text-success font-medium text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Payment complete
            </div>
          ) : (
            <Button
              onClick={handleWhatsAppContact}
              className="w-full py-6 text-lg gap-2"
              size="lg"
            >
              <MessageCircle className="w-5 h-5" />
              Contact to pay
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
