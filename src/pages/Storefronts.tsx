import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StorefrontCard } from "@/components/storefront/StorefrontCard";
import { StorefrontWizard } from "@/components/storefront/StorefrontWizard";
import { EditStorefrontDialog } from "@/components/storefront/EditStorefrontDialog";
import { Plus, Send, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

type FilterStatus = "all" | "draft" | "sent" | "paid";

export default function Storefronts() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState<Storefront | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

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
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStorefronts();
  }, [user]);

  const getShareableLink = (slug: string) => `${window.location.origin}/s/${slug}`;

  const handleDelete = async (id: string) => {
    await supabase.from("storefronts").delete().eq("id", id);
    toast.success("Storefront deleted");
    fetchStorefronts();
  };

  const handleSend = async (id: string, title: string) => {
    await supabase.from("storefronts").update({ status: "sent" }).eq("id", id);
    await supabase.from("activity_log").insert({
      user_id: user?.id,
      type: "storefront",
      message: `Sent storefront: ${title}`,
    });
    toast.success("Storefront sent! Ready to share.");
    fetchStorefronts();
  };

  const handleMarkPaid = async (sf: Storefront) => {
    await supabase.from("storefronts").update({ status: "paid" }).eq("id", sf.id);

    // Log payment activity
    await supabase.from("activity_log").insert({
      user_id: user?.id,
      type: "payment",
      message: `Payment received: ${sf.title} — $${sf.price.toFixed(2)}`,
    });

    // Update customer if exists
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 animate-fade-in">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">{t.storefrontsTitle}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1 truncate">{t.storefrontsDesc}</p>
          </div>
          <Button onClick={() => setWizardOpen(true)} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.new}</span>
          </Button>
        </div>

        {/* Filter tabs */}
        {storefronts.length > 0 && (
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 animate-fade-in scrollbar-hide relative z-10" style={{ animationDelay: "50ms" }}>
            {(["all", "draft", "sent", "paid"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  "px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer select-none active:scale-95",
                  filter === status
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {statusLabels[status]}
                {counts[status] > 0 && (
                  <span className={cn(
                    "ml-1.5 md:ml-2 text-[10px] md:text-xs",
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
        {loading && <div className="text-center py-12 text-muted-foreground">{t.loading}</div>}

        {/* Empty state */}
        {!loading && storefronts.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t.noStorefrontsYet}</h3>
            <p className="text-muted-foreground mb-6">{t.createFirstToStart}</p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.createStorefront}
            </Button>
          </div>
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
                delay={index * 50}
                onEdit={() => setEditingStorefront(sf)}
                onDelete={() => handleDelete(sf.id)}
                onSend={() => handleSend(sf.id, sf.title)}
                onMarkPaid={() => handleMarkPaid(sf)}
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

        <StorefrontWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={fetchStorefronts} />
        <EditStorefrontDialog storefront={editingStorefront} open={!!editingStorefront} onClose={() => setEditingStorefront(null)} onUpdated={fetchStorefronts} />
      </div>
    </AppLayout>
  );
}
