import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, RefreshCw, FileText, ShoppingBag, XCircle, Clock, DollarSign, TrendingUp, X, ChevronRight, Phone, Mail, Copy, CheckCircle, MessageSquare, Copy as Duplicate, CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, startOfMonth, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type FilterType = "all" | "sent" | "quotes" | "orders" | "cancelled";

type DateRangeType = "all" | "week" | "month" | "custom";

interface HistoryItem {
  id: string;
  title: string;
  price: number;
  status: string;
  mode: string;
  customer_name: string | null;
  customer_phone: string | null;
  buyer_email: string | null;
  description: string | null;
  image_url: string | null;
  slug: string;
  created_at: string;
  paid_at: string | null;
  ordered_at: string | null;
  accepted_at: string | null;
  is_bundle: boolean;
  quantity: number;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeType>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    const { data, error } = await supabase
      .from("storefronts")
      .select("id, title, price, status, mode, customer_name, customer_phone, buyer_email, description, image_url, slug, created_at, paid_at, ordered_at, accepted_at, is_bundle, quantity")
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

  const getStorefrontUrl = (slug: string) => {
    return `${window.location.origin}/s/${slug}`;
  };

  const handleCopyLink = async (item: HistoryItem) => {
    const url = getStorefrontUrl(item.slug);
    await navigator.clipboard.writeText(url);
    toast.success(language === "es" ? "Enlace copiado" : "Link copied");
  };

  const handleShareWhatsApp = (item: HistoryItem) => {
    const url = getStorefrontUrl(item.slug);
    const text = language === "es" 
      ? `Hola! Aquí está tu pedido: ${item.title} - $${item.price.toFixed(2)}\n${url}`
      : `Hi! Here's your order: ${item.title} - $${item.price.toFixed(2)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleMarkAsPaid = async (item: HistoryItem) => {
    setMarkingPaid(true);
    const { error } = await supabase
      .from("storefronts")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      toast.error(language === "es" ? "Error al marcar como pagado" : "Failed to mark as paid");
    } else {
      toast.success(language === "es" ? "Marcado como pagado" : "Marked as paid");
      setSelectedItem({ ...item, status: "paid", paid_at: new Date().toISOString() });
      fetchHistory();
    }
    setMarkingPaid(false);
  };

  const handleDuplicate = async (item: HistoryItem) => {
    if (!user) return;
    setDuplicating(true);

    const newSlug = `${item.slug.split("-")[0]}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from("storefronts")
      .insert({
        user_id: user.id,
        title: item.title,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        quantity: item.quantity,
        is_bundle: item.is_bundle,
        mode: item.mode,
        status: "draft",
        slug: newSlug,
      })
      .select("id")
      .single();

    if (error) {
      toast.error(language === "es" ? "Error al duplicar" : "Failed to duplicate");
    } else {
      toast.success(language === "es" ? "Vitrina duplicada como borrador" : "Storefront duplicated as draft");
      navigate("/storefronts");
    }
    setDuplicating(false);
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error(language === "es" ? "No hay datos para exportar" : "No data to export");
      return;
    }

    const headers = [
      language === "es" ? "Título" : "Title",
      language === "es" ? "Precio" : "Price",
      language === "es" ? "Estado" : "Status",
      language === "es" ? "Tipo" : "Type",
      language === "es" ? "Cliente" : "Customer",
      language === "es" ? "Teléfono" : "Phone",
      "Email",
      language === "es" ? "Cantidad" : "Quantity",
      language === "es" ? "Creado" : "Created",
      language === "es" ? "Pagado" : "Paid",
    ];

    const rows = filteredItems.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      item.price.toFixed(2),
      item.status,
      item.mode,
      item.customer_name ? `"${item.customer_name.replace(/"/g, '""')}"` : "",
      item.customer_phone || "",
      item.buyer_email || "",
      item.quantity,
      format(new Date(item.created_at), "yyyy-MM-dd"),
      item.paid_at ? format(new Date(item.paid_at), "yyyy-MM-dd") : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historial-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(language === "es" ? "CSV exportado" : "CSV exported");
  };

  const getDateRangeFilter = (item: HistoryItem): boolean => {
    const itemDate = new Date(item.created_at);
    const now = new Date();

    switch (dateRange) {
      case "week":
        return isAfter(itemDate, startOfWeek(now, { weekStartsOn: 1 }));
      case "month":
        return isAfter(itemDate, startOfMonth(now));
      case "custom":
        if (customStartDate && isBefore(itemDate, startOfDay(customStartDate))) return false;
        if (customEndDate && isAfter(itemDate, endOfDay(customEndDate))) return false;
        return true;
      default:
        return true;
    }
  };

  const filteredItems = items.filter((item) => {
    // Apply search filter
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    if (!matchesSearch) return false;

    // Apply date range filter
    if (!getDateRangeFilter(item)) return false;

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportCSV}
              disabled={loading || filteredItems.length === 0}
              className="shrink-0"
              title={language === "es" ? "Exportar CSV" : "Export CSV"}
            >
              <Download className="h-4 w-4" />
            </Button>
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

        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "40ms" }}>
          <button
            onClick={() => { setDateRange("all"); setCustomStartDate(undefined); setCustomEndDate(undefined); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateRange === "all"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {language === "es" ? "Todo el tiempo" : "All time"}
          </button>
          <button
            onClick={() => setDateRange("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateRange === "week"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {language === "es" ? "Esta semana" : "This week"}
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateRange === "month"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {language === "es" ? "Este mes" : "This month"}
          </button>

          {/* Custom Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === "custom"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {dateRange === "custom" && customStartDate && customEndDate
                  ? `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d")}`
                  : (language === "es" ? "Personalizado" : "Custom")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{language === "es" ? "Desde" : "From"}</p>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      setCustomStartDate(date);
                      if (date) setDateRange("custom");
                    }}
                    className={cn("rounded-md border pointer-events-auto")}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{language === "es" ? "Hasta" : "To"}</p>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      setCustomEndDate(date);
                      if (date) setDateRange("custom");
                    }}
                    disabled={(date) => customStartDate ? isBefore(date, customStartDate) : false}
                    className={cn("rounded-md border pointer-events-auto")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
                onClick={() => setSelectedItem(item)}
                className="bg-card border border-border rounded-xl p-4 animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
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
                  <div className="flex items-center gap-2">
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">${item.price.toFixed(2)}</p>
                      {item.is_bundle && (
                        <p className="text-xs text-muted-foreground">Bundle</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
        {/* Detail Panel */}
        {selectedItem && (
          <>
            <div 
              className="fixed inset-0 bg-foreground/20 z-40" 
              onClick={() => setSelectedItem(null)} 
            />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto animate-fade-in">
              <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{language === "es" ? "Detalles" : "Details"}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Image */}
                {selectedItem.image_url && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Title & Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{selectedItem.title}</h3>
                    {getStatusBadge(selectedItem)}
                  </div>
                  <p className="text-2xl font-bold text-foreground">${selectedItem.price.toFixed(2)}</p>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </div>
                )}

                {/* Customer Info */}
                {(selectedItem.customer_name || selectedItem.customer_phone || selectedItem.buyer_email) && (
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <h4 className="font-medium text-foreground text-sm">{language === "es" ? "Cliente" : "Customer"}</h4>
                    {selectedItem.customer_name && (
                      <p className="text-foreground">{selectedItem.customer_name}</p>
                    )}
                    {selectedItem.customer_phone && (
                      <a href={`tel:${selectedItem.customer_phone}`} className="flex items-center gap-2 text-sm text-primary">
                        <Phone className="w-4 h-4" />
                        {selectedItem.customer_phone}
                      </a>
                    )}
                    {selectedItem.buyer_email && (
                      <a href={`mailto:${selectedItem.buyer_email}`} className="flex items-center gap-2 text-sm text-primary">
                        <Mail className="w-4 h-4" />
                        {selectedItem.buyer_email}
                      </a>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h4 className="font-medium text-foreground text-sm">{language === "es" ? "Fechas" : "Dates"}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{language === "es" ? "Creado" : "Created"}</p>
                      <p className="text-foreground">{format(new Date(selectedItem.created_at), "MMM d, yyyy")}</p>
                    </div>
                    {selectedItem.ordered_at && (
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Ordenado" : "Ordered"}</p>
                        <p className="text-foreground">{format(new Date(selectedItem.ordered_at), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    {selectedItem.accepted_at && (
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Aceptado" : "Accepted"}</p>
                        <p className="text-foreground">{format(new Date(selectedItem.accepted_at), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    {selectedItem.paid_at && (
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Pagado" : "Paid"}</p>
                        <p className="text-foreground">{format(new Date(selectedItem.paid_at), "MMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground">{language === "es" ? "Tipo" : "Type"}</p>
                    <p className="text-foreground capitalize">{selectedItem.mode}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground">{language === "es" ? "Cantidad" : "Quantity"}</p>
                    <p className="text-foreground">{selectedItem.quantity}</p>
                  </div>
                  {selectedItem.is_bundle && (
                    <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                      <p className="text-muted-foreground">Bundle</p>
                      <p className="text-foreground">{language === "es" ? "Sí" : "Yes"}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="font-medium text-foreground text-sm mb-3">{language === "es" ? "Acciones" : "Actions"}</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Copy Link */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(selectedItem)}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {language === "es" ? "Copiar enlace" : "Copy link"}
                    </Button>

                    {/* Share WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(selectedItem)}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>

                    {/* Mark as Paid - only for sent items */}
                    {selectedItem.status === "sent" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarkAsPaid(selectedItem)}
                        disabled={markingPaid}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {markingPaid 
                          ? (language === "es" ? "Marcando..." : "Marking...") 
                          : (language === "es" ? "Marcar pagado" : "Mark paid")}
                      </Button>
                    )}

                    {/* Duplicate */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(selectedItem)}
                      disabled={duplicating}
                      className="w-full"
                    >
                      <Duplicate className="w-4 h-4 mr-2" />
                      {duplicating 
                        ? (language === "es" ? "Duplicando..." : "Duplicating...") 
                        : (language === "es" ? "Duplicar" : "Duplicate")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
