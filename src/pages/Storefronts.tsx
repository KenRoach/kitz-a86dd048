import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StorefrontCard } from "@/components/storefront/StorefrontCard";
import { StorefrontWizard } from "@/components/storefront/StorefrontWizard";
import { EditStorefrontDialog } from "@/components/storefront/EditStorefrontDialog";
import { QuickCreate } from "@/components/storefront/QuickCreate";
import { ShareDialog } from "@/components/storefront/ShareDialog";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { StorefrontsSkeleton } from "@/components/ui/dashboard-skeleton";
import { AnimatedCreateButton } from "@/components/ui/AnimatedCreateButton";

export type FulfillmentStatus = "pending" | "preparing" | "ready" | "complete";

interface ProductData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface Storefront {
  id: string;
  title: string;
  description: string | null;
  comment: string | null;
  price: number;
  quantity: number;
  status: "draft" | "sent" | "paid";
  slug: string;
  image_url: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  fulfillment_note: string | null;
  buyer_name: string | null;
  created_at: string;
  is_bundle: boolean;
  order_key: string | null;
  payment_proof_url: string | null;
  mode: "invoice" | "quote";
  valid_until: string | null;
  accepted_at: string | null;
  fulfillment_status: FulfillmentStatus;
  product_id: string | null;
}

type FilterStatus = "all" | "draft" | "sent" | "paid";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Date.now().toString(36);
};

export default function Storefronts() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState<Storefront | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [username, setUsername] = useState<string | null>(null);
  const [productToCreate, setProductToCreate] = useState<ProductData | null>(null);
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState<{ link: string; title: string; price: number } | null>(null);

  // Check if we came from Products page with a product to create storefront from
  useEffect(() => {
    const state = location.state as { createFromProduct?: ProductData } | null;
    if (state?.createFromProduct) {
      setProductToCreate(state.createFromProduct);
      setWizardOpen(true);
      // Clear the state so it doesn't re-trigger on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch username on mount
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.username) {
        setUsername(data.username);
      }
    };
    fetchUsername();
  }, [user]);

  const fetchStorefronts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("storefronts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching storefronts:", error);
    } else {
      setStorefronts(
        (data || []).map((s) => ({
          ...s,
          quantity: s.quantity || 1,
          status: s.status as "draft" | "sent" | "paid",
          is_bundle: s.is_bundle || false,
          mode: (s.mode || "invoice") as "invoice" | "quote",
          fulfillment_status: (s.fulfillment_status || "pending") as FulfillmentStatus,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStorefronts();
  }, [user]);

  const getShareableLink = (slug: string) => {
    if (username) {
      return `${window.location.origin}/p/@${username}/${slug}`;
    }
    return `${window.location.origin}/s/${slug}`;
  };

  const handleDelete = async (id: string) => {
    await supabase.from("storefronts").delete().eq("id", id);
    toast.success("Storefront deleted");
    fetchStorefronts();
  };

  const handleSend = async (id: string, title: string, slug: string, price: number) => {
    await supabase.from("storefronts").update({ status: "sent" }).eq("id", id);
    await supabase.from("activity_log").insert({
      user_id: user?.id,
      type: "storefront",
      message: `Sent storefront: ${title}`,
    });
    toast.success("Storefront sent!");
    
    // Show share dialog
    setShareData({ link: getShareableLink(slug), title, price });
    setShareDialogOpen(true);
    
    fetchStorefronts();
  };

  const handleMarkPaid = async (sf: Storefront) => {
    await supabase.from("storefronts").update({ 
      status: "paid",
      paid_at: new Date().toISOString(),
      fulfillment_status: "pending"
    }).eq("id", sf.id);

    await supabase.from("activity_log").insert({
      user_id: user?.id,
      type: "payment",
      message: `Payment received: ${sf.title} — $${sf.price.toFixed(2)}`,
    });

    if (sf.customer_name) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user?.id)
        .eq("name", sf.customer_name)
        .maybeSingle();

      if (customer) {
        const newTotal = (customer.total_spent || 0) + sf.price;
        const newCount = (customer.order_count || 0) + 1;
        const newLifecycle = newCount >= 3 ? "repeat" : newCount >= 1 ? "active" : "lead";

        await supabase
          .from("customers")
          .update({
            total_spent: newTotal,
            order_count: newCount,
            lifecycle: newLifecycle,
            last_interaction: new Date().toISOString(),
          })
          .eq("id", customer.id);
      }
    }

    toast.success("Marked as paid!");
    fetchStorefronts();
  };

  const handleReorder = async (sf: Storefront) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, payment_cards, payment_yappy, payment_cash, payment_pluxee")
        .eq("user_id", user.id)
        .maybeSingle();

      const slug = generateSlug(sf.title);

      const { error } = await supabase.from("storefronts").insert({
        user_id: user.id,
        title: sf.title,
        description: sf.description,
        price: sf.price,
        quantity: sf.quantity,
        image_url: sf.image_url,
        customer_name: sf.customer_name,
        customer_phone: sf.customer_phone,
        slug,
        status: "sent",
        is_bundle: sf.is_bundle,
        seller_phone: profile?.phone || null,
        payment_cards: (profile as any)?.payment_cards ?? false,
        payment_yappy: (profile as any)?.payment_yappy ?? false,
        payment_cash: (profile as any)?.payment_cash ?? true,
        payment_pluxee: (profile as any)?.payment_pluxee ?? false,
      });

      if (error) {
        toast.error("Failed to reorder");
        return;
      }

      await supabase.from("activity_log").insert({
        user_id: user.id,
        type: "storefront",
        message: `Reordered: ${sf.title} — $${sf.price.toFixed(2)}`
      });

      // Show share dialog for the new order
      setShareData({ link: getShareableLink(slug), title: sf.title, price: sf.price });
      setShareDialogOpen(true);

      fetchStorefronts();
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleQuickCreate = (slug: string, title: string, price: number) => {
    setShareData({ link: getShareableLink(slug), title, price });
    setShareDialogOpen(true);
    fetchStorefronts();
  };

  const handleWizardCreated = () => {
    fetchStorefronts();
    // The wizard will close itself, we need to show share for the latest storefront
    // We'll fetch and show share for the most recent one
    setTimeout(async () => {
      const { data } = await supabase
        .from("storefronts")
        .select("slug, title, price")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setShareData({ link: getShareableLink(data.slug), title: data.title, price: data.price });
        setShareDialogOpen(true);
      }
    }, 300);
  };

  const filteredStorefronts = filter === "all" ? storefronts : storefronts.filter((s) => s.status === filter);

  const counts = {
    all: storefronts.length,
    draft: storefronts.filter((s) => s.status === "draft").length,
    sent: storefronts.filter((s) => s.status === "sent").length,
    paid: storefronts.filter((s) => s.status === "paid").length,
  };

  const statusLabels = { all: t.all, draft: t.draft, sent: t.sent, paid: t.paid };

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 animate-fade-in">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-semibold text-foreground">{t.storefrontsTitle}</h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5 truncate">{t.storefrontsDesc}</p>
          </div>
          <AnimatedCreateButton 
            onClick={() => setWizardOpen(true)} 
            label={t.new} 
          />
        </div>

        {/* Quick Create */}
        <div className="animate-fade-in" style={{ animationDelay: "25ms" }}>
          <QuickCreate onCreated={handleQuickCreate} />
        </div>

        {/* Filter tabs */}
        {storefronts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 animate-fade-in scrollbar-hide relative z-10" style={{ animationDelay: "50ms" }}>
            {(["all", "draft", "sent", "paid"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  "px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer select-none active:scale-95",
                  filter === status
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {statusLabels[status]}
                {counts[status] > 0 && (
                  <span className={cn(
                    "ml-1 md:ml-2 text-[9px] md:text-xs",
                    filter === status ? "opacity-80" : "opacity-60"
                  )}>
                    ({counts[status]})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && <StorefrontsSkeleton />}

        {/* Empty state */}
        {!loading && storefronts.length === 0 && (
          <EmptyState
            icon={Store}
            title={t.noStorefrontsYet}
            description="Storefronts are shareable links you send to customers. Create one in seconds and get paid faster."
            actionLabel={t.createStorefront}
            onAction={() => setWizardOpen(true)}
            tips={[
              "Use Quick Create above for instant links",
              "AI helps suggest pricing and descriptions",
              "Share via WhatsApp, email, or QR code"
            ]}
          />
        )}

        {/* Storefronts list */}
        {!loading && filteredStorefronts.length > 0 && (
          <div className="space-y-3">
            {filteredStorefronts.map((sf, index) => (
              <StorefrontCard
                key={sf.id}
                id={sf.id}
                title={sf.title}
                price={`$${sf.price.toFixed(2)}`}
                status={sf.status}
                customerName={sf.customer_name}
                quantity={sf.quantity}
                link={getShareableLink(sf.slug)}
                imageUrl={sf.image_url}
                buyerName={sf.buyer_name}
                isBundle={sf.is_bundle}
                orderKey={sf.order_key}
                paymentProofUrl={sf.payment_proof_url}
                mode={sf.mode}
                acceptedAt={sf.accepted_at}
                fulfillmentStatus={sf.fulfillment_status}
                delay={index * 50}
                onEdit={() => setEditingStorefront(sf)}
                onDelete={() => handleDelete(sf.id)}
                onSend={() => handleSend(sf.id, sf.title, sf.slug, sf.price)}
                onMarkPaid={() => handleMarkPaid(sf)}
                onReorder={() => handleReorder(sf)}
                onFulfillmentChange={async (newStatus) => {
                  await supabase.from("storefronts").update({ fulfillment_status: newStatus }).eq("id", sf.id);
                  fetchStorefronts();
                }}
              />
            ))}
          </div>
        )}

        {/* Empty filter state */}
        {!loading && storefronts.length > 0 && filteredStorefronts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No {filter} storefronts
          </div>
        )}

        <StorefrontWizard 
          open={wizardOpen} 
          onClose={() => {
            setWizardOpen(false);
            setProductToCreate(null);
          }} 
          onCreated={handleWizardCreated}
          initialProduct={productToCreate}
        />
        <EditStorefrontDialog storefront={editingStorefront} open={!!editingStorefront} onClose={() => setEditingStorefront(null)} onUpdated={fetchStorefronts} />
        
        {shareData && (
          <ShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            link={shareData.link}
            title={shareData.title}
            price={shareData.price}
          />
        )}
      </div>
    </AppLayout>
  );
}