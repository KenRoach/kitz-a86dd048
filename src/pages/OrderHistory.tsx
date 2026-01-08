import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, RefreshCw, FileText, ShoppingBag, XCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, startOfMonth } from "date-fns";

type FilterType = "all" | "sent" | "quotes" | "orders" | "cancelled";

interface HistoryItem {
  id: string;
  title: string;
  price: number;
  status: string;
  mode: string;
  customer_name: string | null;
  created_at: string;
  paid_at: string | null;
  ordered_at: string | null;
  is_bundle: boolean;
  quantity: number;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    const { data, error } = await supabase
      .from("storefronts")
      .select("id, title, price, status, mode, customer_name, created_at, paid_at, ordered_at, is_bundle, quantity")
      .in("status", ["sent", "paid", "cancelled"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    fetchHistory(true);
  };

  const filteredItems = items.filter((item) => {
    // Apply search filter
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    if (!matchesSearch) return false;

    // Apply status filter
    switch (filter) {
      case "sent":
        return item.status === "sent" && item.mode !== "quote";
      case "quotes":
        return item.mode === "quote";
      case "orders":
        return item.status === "paid";
      case "cancelled":
        return item.status === "cancelled";
      default:
        return true;
    }
  });

  const getStatusBadge = (item: HistoryItem) => {
    if (item.status === "cancelled") {
      return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
    }
    if (item.status === "paid") {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Paid</Badge>;
    }
    if (item.mode === "quote") {
      return <Badge variant="secondary" className="text-xs">Quote</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Sent</Badge>;
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return language === "es" ? "Hoy" : "Today";
    if (days === 1) return language === "es" ? "Ayer" : "Yesterday";
    if (days < 7) return language === "es" ? `Hace ${days} días` : `${days} days ago`;
    return format(date, "MMM d");
  };

  const filterTabs: { key: FilterType; label: string; icon: typeof FileText }[] = [
    { key: "all", label: language === "es" ? "Todo" : "All", icon: Clock },
    { key: "sent", label: language === "es" ? "Enviadas" : "Sent", icon: FileText },
    { key: "quotes", label: language === "es" ? "Aceptadas" : "Accepted", icon: FileText },
    { key: "orders", label: language === "es" ? "Pedidos" : "Orders", icon: ShoppingBag },
    { key: "cancelled", label: language === "es" ? "Cancelados" : "Cancelled", icon: XCircle },
  ];

  const getCounts = () => ({
    all: items.length,
    sent: items.filter(i => i.status === "sent" && i.mode !== "quote").length,
    quotes: items.filter(i => i.mode === "quote").length,
    orders: items.filter(i => i.status === "paid").length,
    cancelled: items.filter(i => i.status === "cancelled").length,
  });

  const getStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const paidItems = items.filter(i => i.status === "paid");
    const totalRevenue = paidItems.reduce((sum, i) => sum + i.price, 0);
    
    const weekRevenue = paidItems
      .filter(i => i.paid_at && new Date(i.paid_at) >= weekStart)
      .reduce((sum, i) => sum + i.price, 0);
    
    const monthRevenue = paidItems
      .filter(i => i.paid_at && new Date(i.paid_at) >= monthStart)
      .reduce((sum, i) => sum + i.price, 0);

    const weekOrders = paidItems.filter(i => i.paid_at && new Date(i.paid_at) >= weekStart).length;
    const monthOrders = paidItems.filter(i => i.paid_at && new Date(i.paid_at) >= monthStart).length;

    return { totalRevenue, weekRevenue, monthRevenue, weekOrders, monthOrders, totalOrders: paidItems.length };
  };

  const counts = getCounts();
  const stats = getStats();

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold text-foreground">
              {language === "es" ? "Historial" : "History"}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5">
              {language === "es" ? "Cotizaciones, pedidos y cancelaciones" : "Quotes, orders and cancellations"}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Summary Stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: "20ms" }}>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">{language === "es" ? "Esta semana" : "This week"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">${stats.weekRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.weekOrders} {language === "es" ? "pedidos" : "orders"}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">{language === "es" ? "Este mes" : "This month"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">${stats.monthRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.monthOrders} {language === "es" ? "pedidos" : "orders"}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs">{language === "es" ? "Total ventas" : "Total sales"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.totalOrders} {language === "es" ? "pedidos" : "orders"}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">{language === "es" ? "Pendientes" : "Pending"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{counts.sent}</p>
              <p className="text-xs text-muted-foreground">{language === "es" ? "por cobrar" : "awaiting payment"}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in" style={{ animationDelay: "30ms" }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 text-xs ${filter === tab.key ? "opacity-80" : "opacity-60"}`}>
                ({counts[tab.key]})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div className="relative animate-fade-in" style={{ animationDelay: "50ms" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={language === "es" ? "Buscar por título o cliente..." : "Search by title or customer..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title={language === "es" ? "Sin historial aún" : "No history yet"}
            description={language === "es" 
              ? "Aquí aparecerán tus cotizaciones y pedidos" 
              : "Your quotes and orders will appear here"}
            tips={
              language === "es" 
                ? [
                    "Crea y envía vitrinas para empezar",
                    "Los pedidos pagados aparecen automáticamente",
                    "Las cotizaciones se registran aquí"
                  ]
                : [
                    "Create and send storefronts to get started",
                    "Paid orders appear automatically",
                    "Quotes are tracked here"
                  ]
            }
          />
        )}

        {/* History List */}
        {!loading && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                      {getStatusBadge(item)}
                    </div>
                    {item.customer_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.customer_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelativeTime(item.created_at)}
                      {item.quantity > 1 && ` · ${item.quantity} items`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground">${item.price.toFixed(2)}</p>
                    {item.is_bundle && (
                      <p className="text-xs text-muted-foreground">Bundle</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No search results */}
        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {language === "es" 
              ? `No hay resultados para "${search || filter}"` 
              : `No results for "${search || filter}"`}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
