import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StorefrontCard } from "@/components/storefront/StorefrontCard";
import { StorefrontWizard } from "@/components/storefront/StorefrontWizard";
import { EditStorefrontDialog } from "@/components/storefront/EditStorefrontDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Storefront {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: "draft" | "shared" | "paid";
  slug: string;
  created_at: string;
}

export default function Storefronts() {
  const { user } = useAuth();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState<Storefront | null>(null);

  const fetchStorefronts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("storefronts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching storefronts:", error);
    } else {
      setStorefronts((data || []).map(s => ({
        ...s,
        description: s.description ?? null,
        status: s.status as "draft" | "shared" | "paid"
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStorefronts();
  }, [user]);

  const getShareableLink = (slug: string) => {
    return `${window.location.origin}/s/${slug}`;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("storefronts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete storefront");
    } else {
      toast.success("Storefront deleted");
      fetchStorefronts();
    }
  };

  const handleShare = async (id: string) => {
    const { error } = await supabase
      .from("storefronts")
      .update({ status: "shared" })
      .eq("id", id);

    if (error) {
      toast.error("Failed to share storefront");
    } else {
      toast.success("Storefront is now live and shareable!");
      fetchStorefronts();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Storefronts</h1>
            <p className="text-muted-foreground mt-1">Share links and get paid instantly.</p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New storefront
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        )}

        {/* Empty State */}
        {!loading && storefronts.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No storefronts yet</h3>
            <p className="text-muted-foreground mb-6">Create your first storefront to start selling</p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create storefront
            </Button>
          </div>
        )}

        {/* Storefronts Grid */}
        {!loading && storefronts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storefronts.map((storefront, index) => (
              <StorefrontCard
                key={storefront.id}
                id={storefront.id}
                title={storefront.title}
                description={storefront.description || ""}
                price={`$${storefront.price.toFixed(2)}`}
                status={storefront.status}
                link={getShareableLink(storefront.slug)}
                delay={index * 100}
                onEdit={() => setEditingStorefront(storefront)}
                onDelete={() => handleDelete(storefront.id)}
                onShare={() => handleShare(storefront.id)}
              />
            ))}
          </div>
        )}

        {/* Wizard */}
        <StorefrontWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={fetchStorefronts}
        />

        {/* Edit Dialog */}
        <EditStorefrontDialog
          storefront={editingStorefront}
          open={!!editingStorefront}
          onClose={() => setEditingStorefront(null)}
          onUpdated={fetchStorefronts}
        />
      </div>
    </AppLayout>
  );
}
