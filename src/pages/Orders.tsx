import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, Package, DollarSign, AlertTriangle,
  CheckCircle2, Clock, XCircle
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string | null;
  total: number;
  cost: number;
  margin: number;
  payment_status: string;
  fulfillment_status: string;
  payment_method: string | null;
  delivery_provider: string | null;
  notes: string | null;
  risk_flag: boolean;
  risk_reason: string | null;
  channel: string | null;
  contact_id: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
}

const STATUS_FLOW = ["NEW", "PAID", "DELIVERED", "CANCELLED"] as const;

export default function Orders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", total: "", cost: "" });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (page === 0) {
      setOrders((data as Order[]) || []);
    } else {
      setOrders(prev => [...prev, ...((data as Order[]) || [])]);
    }
    setLoading(false);
  }, [user, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCreateOrder = async () => {
    if (!user) return;
    const total = parseFloat(createForm.total) || 0;
    const cost = parseFloat(createForm.cost) || 0;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      total,
      subtotal: total,
      cost,
      notes: createForm.title,
    });
    if (error) { toast.error("Error creating order"); return; }
    toast.success(language === "es" ? "Orden creada" : "Order created");
    setCreateForm({ title: "", total: "", cost: "" });
    setShowCreate(false);
    fetchOrders();
  };

  const updateStatus = async (orderId: string, field: string, value: string) => {
    const update: any = { [field]: value };
    if (field === "payment_status" && value === "PAID") update.paid_at = new Date().toISOString();
    if (field === "fulfillment_status" && value === "DELIVERED") update.delivered_at = new Date().toISOString();

    await supabase.from("orders").update(update).eq("id", orderId);
    fetchOrders();
    toast.success(language === "es" ? "Actualizado" : "Updated");
  };

  const statusBadge = (order: Order) => {
    if (order.fulfillment_status === "CANCELLED") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (order.fulfillment_status === "DELIVERED") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (order.payment_status === "PAID") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  };

  const statusLabel = (order: Order) => {
    if (order.fulfillment_status === "CANCELLED") return language === "es" ? "Cancelada" : "Cancelled";
    if (order.fulfillment_status === "DELIVERED") return language === "es" ? "Entregada" : "Delivered";
    if (order.payment_status === "PAID") return language === "es" ? "Pagada" : "Paid";
    return language === "es" ? "Nueva" : "New";
  };

  const statusIcon = (order: Order) => {
    if (order.fulfillment_status === "CANCELLED") return <XCircle className="w-4 h-4 text-red-500" />;
    if (order.fulfillment_status === "DELIVERED") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (order.payment_status === "PAID") return <Package className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.notes?.toLowerCase().includes(search.toLowerCase());
    if (tab === "all") return matchSearch !== false;
    if (tab === "new") return o.payment_status !== "PAID" && o.fulfillment_status !== "DELIVERED" && o.fulfillment_status !== "CANCELLED";
    if (tab === "paid") return o.payment_status === "PAID" && o.fulfillment_status !== "DELIVERED" && o.fulfillment_status !== "CANCELLED";
    if (tab === "delivered") return o.fulfillment_status === "DELIVERED";
    if (tab === "cancelled") return o.fulfillment_status === "CANCELLED";
    return true;
  });

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{language === "es" ? "Órdenes" : "Orders"}</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{language === "es" ? "Nueva" : "New"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{language === "es" ? "Nueva orden" : "New Order"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>{language === "es" ? "Descripción" : "Description"}</Label>
                  <Input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Total ($)</Label>
                    <Input type="number" value={createForm.total} onChange={e => setCreateForm(p => ({ ...p, total: e.target.value }))} /></div>
                  <div><Label>{language === "es" ? "Costo" : "Cost"} ($)</Label>
                    <Input type="number" value={createForm.cost} onChange={e => setCreateForm(p => ({ ...p, cost: e.target.value }))} /></div>
                </div>
                <Button onClick={handleCreateOrder} className="w-full">{language === "es" ? "Crear" : "Create Order"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">{language === "es" ? "Todas" : "All"}</TabsTrigger>
            <TabsTrigger value="new" className="flex-1">{language === "es" ? "Nuevas" : "New"}</TabsTrigger>
            <TabsTrigger value="paid" className="flex-1">{language === "es" ? "Pagadas" : "Paid"}</TabsTrigger>
            <TabsTrigger value="delivered" className="flex-1">{language === "es" ? "Entregadas" : "Delivered"}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={language === "es" ? "Buscar..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Order List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {orders.length === 0
                ? (language === "es" ? "Sin órdenes aún" : "No orders yet")
                : (language === "es" ? "Sin resultados" : "No matching orders")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {orders.length === 0
                ? (language === "es" ? "Crea tu primera orden o recibe una desde una vitrina" : "Create your first order or receive one from a storefront")
                : (language === "es" ? "Prueba con otro filtro" : "Try a different tab or search")}
            </p>
            {orders.length === 0 && (
              <Button onClick={() => setShowCreate(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                {language === "es" ? "Nueva orden" : "New Order"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(order => (
              <Card key={order.id} className={`p-4 hover-calm ${order.risk_flag ? "border-destructive/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{statusIcon(order)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{order.order_number || "Draft"}</p>
                      <Badge variant="secondary" className={`text-[10px] ${statusBadge(order)}`}>
                        {statusLabel(order)}
                      </Badge>
                      {order.risk_flag && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                    </div>
                    {order.notes && <p className="text-xs text-muted-foreground truncate mb-1">{order.notes}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">${Number(order.total).toFixed(2)}</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {order.payment_status !== "PAID" && order.fulfillment_status !== "CANCELLED" && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(order.id, "payment_status", "PAID")}>
                        <DollarSign className="w-3 h-3 mr-1" />{language === "es" ? "Pagado" : "Paid"}
                      </Button>
                    )}
                    {order.payment_status === "PAID" && order.fulfillment_status !== "DELIVERED" && order.fulfillment_status !== "CANCELLED" && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(order.id, "fulfillment_status", "DELIVERED")}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />{language === "es" ? "Entregado" : "Delivered"}
                      </Button>
                    )}
                    {order.fulfillment_status !== "DELIVERED" && order.fulfillment_status !== "CANCELLED" && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => updateStatus(order.id, "fulfillment_status", "CANCELLED")}>
                        <XCircle className="w-3 h-3 mr-1" />{language === "es" ? "Cancelar" : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length >= PAGE_SIZE && (
              <Button variant="outline" className="w-full" onClick={() => setPage(p => p + 1)}>
                {language === "es" ? "Cargar más" : "Load more"}
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
