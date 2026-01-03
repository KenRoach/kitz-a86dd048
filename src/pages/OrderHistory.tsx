import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CustomerCard } from "@/components/crm/CustomerCard";
import { CustomerProfile } from "@/components/crm/CustomerProfile";
import { Search, Users, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomersSkeleton } from "@/components/ui/dashboard-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lifecycle: "lead" | "active" | "repeat";
  tags: string[];
  total_spent: number;
  order_count: number;
  last_interaction: string;
  created_at: string;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("last_interaction", { ascending: false });

    if (!error && data) {
      setCustomers(data.map(c => ({
        ...c,
        lifecycle: c.lifecycle as "lead" | "active" | "repeat",
        tags: c.tags || []
      })));
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
    return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">{t.orderHistoryTitle}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">{t.orderHistoryDesc}</p>
        </div>

        {/* Search */}
        {customers.length > 0 && (
          <div className="relative animate-fade-in" style={{ animationDelay: "50ms" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.searchCustomers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Loading */}
        {loading && <CustomersSkeleton />}

        {!loading && customers.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title={t.noCustomersYet}
            description="Your customers will appear here automatically when they place orders through your storefronts."
            tips={[
              "Create and share a storefront to get started",
              "Customers are added when orders come in",
              "Track spending, orders, and engagement"
            ]}
          />
        )}

        {/* Customer list */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="space-y-3">
            {filteredCustomers.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                id={customer.id}
                name={customer.name}
                lastInteraction={getRelativeTime(customer.last_interaction)}
                totalSpent={`$${customer.total_spent.toFixed(2)}`}
                lifecycle={customer.lifecycle}
                tags={customer.tags}
                delay={index * 50}
                onClick={() => setSelectedCustomer(customer)}
              />
            ))}
          </div>
        )}

        {/* No search results */}
        {!loading && customers.length > 0 && filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No customers match "{search}"
          </div>
        )}

        {/* Customer profile drawer */}
        {selectedCustomer && (
          <>
            <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setSelectedCustomer(null)} />
            <CustomerProfile
              customer={{
                ...selectedCustomer,
                orders: selectedCustomer.order_count,
                history: [] // Will be populated from activity_log in future
              }}
              onClose={() => setSelectedCustomer(null)}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
