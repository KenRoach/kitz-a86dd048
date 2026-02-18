import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  DollarSign,
  ShoppingBag,
  Activity,
  Eye,
  RefreshCw,
  Shield,
  Store,
  UserCog,
  CheckCircle,
  Clock,
  TrendingUp,
  Flame,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

interface PlatformStats {
  totalUsers: number;
  totalRevenue: number;
  activeUsers7d: number;
  newUsers7d: number;
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  pendingRevenue: number;
  totalPaidOrders: number;
}

interface UserData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  created_at: string;
  city: string | null;
  country: string | null;
  phone: string | null;
}

interface StorefrontData {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  customer_name: string | null;
  paid_at: string | null;
}

export default function PlatformAdmin() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalRevenue: 0, activeUsers7d: 0, newUsers7d: 0,
    ordersToday: 0, revenueToday: 0, pendingOrders: 0, pendingRevenue: 0, totalPaidOrders: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [recentOrders, setRecentOrders] = useState<StorefrontData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  // User detail dialog
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) return;
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) { navigate("/dashboard"); return; }
    setIsAdmin(true);
    await loadAll();
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadRecentUsers(), loadRecentOrders()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success(language === "es" ? "Actualizado" : "Refreshed");
  };

  const loadStats = async () => {
    const today = new Date();
    const startOfTodayStr = startOfDay(today).toISOString();
    const endOfTodayStr = endOfDay(today).toISOString();
    const sevenDaysAgo = subDays(today, 7).toISOString();

    const [profilesRes, paidRes, pendingRes, newUsersRes, todayOrdersRes, activityRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("price").eq("status", "paid"),
      supabase.from("storefronts").select("price").eq("status", "sent"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("storefronts").select("price").eq("status", "paid").gte("paid_at", startOfTodayStr).lte("paid_at", endOfTodayStr),
      supabase.from("activity_log").select("user_id").gte("created_at", sevenDaysAgo),
    ]);

    const totalRevenue = paidRes.data?.reduce((s, o) => s + Number(o.price || 0), 0) || 0;
    const revenueToday = todayOrdersRes.data?.reduce((s, o) => s + Number(o.price || 0), 0) || 0;
    const pendingRevenue = pendingRes.data?.reduce((s, o) => s + Number(o.price || 0), 0) || 0;
    const uniqueActive = new Set(activityRes.data?.map(a => a.user_id) || []).size;

    setStats({
      totalUsers: profilesRes.count || 0,
      totalRevenue,
      activeUsers7d: uniqueActive,
      newUsers7d: newUsersRes.count || 0,
      ordersToday: todayOrdersRes.data?.length || 0,
      revenueToday,
      pendingOrders: pendingRes.data?.length || 0,
      pendingRevenue,
      totalPaidOrders: paidRes.data?.length || 0,
    });
  };

  const loadRecentUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, business_name, business_type, created_at, city, country, phone")
      .order("created_at", { ascending: false })
      .limit(500);
    setAllUsers(data || []);
    setRecentUsers((data || []).slice(0, 8));
  };

  const loadRecentOrders = async () => {
    const { data } = await supabase
      .from("storefronts")
      .select("id, title, price, status, created_at, user_id, customer_name, paid_at")
      .in("status", ["paid", "sent"])
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentOrders(data || []);
  };

  const getUserName = (userId: string) => {
    return allUsers.find(u => u.user_id === userId)?.business_name || "—";
  };

  const handleViewUser = async (userData: UserData) => {
    setSelectedUser(userData);
    setUserDialogOpen(true);
    const [sfRes, rolesRes] = await Promise.all([
      supabase.from("storefronts").select("*").eq("user_id", userData.user_id).order("created_at", { ascending: false }).limit(5),
      supabase.from("user_roles").select("role").eq("user_id", userData.user_id),
    ]);
    setUserDetails({ storefronts: sfRes.data || [], roles: rolesRes.data?.map(r => r.role) || [] });
  };

  const handleGrantRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) { toast.error("Failed"); return; }
    toast.success(`Role ${role} granted`);
    if (selectedUser) handleViewUser(selectedUser);
  };

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from("storefronts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success(language === "es" ? "Marcado como pagado" : "Marked as paid");
    loadRecentOrders();
    loadStats();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Paid</Badge>;
      case "sent": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Pending</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  const activePct = stats.totalUsers > 0 ? Math.round((stats.activeUsers7d / stats.totalUsers) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              {language === "es" ? "Centro de Control" : "Control Center"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {language === "es" ? "Actualizar" : "Refresh"}
          </Button>
        </div>

        {/* Top Metrics — the numbers that matter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Usuarios" : "Users"}
              {stats.newUsers7d > 0 && (
                <span className="text-emerald-600 ml-1">+{stats.newUsers7d} {language === "es" ? "esta semana" : "this week"}</span>
              )}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Ingresos totales" : "Total revenue"}
              {stats.revenueToday > 0 && (
                <span className="text-emerald-600 ml-1">+${stats.revenueToday.toFixed(0)} {language === "es" ? "hoy" : "today"}</span>
              )}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">${stats.pendingRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} {language === "es" ? "órdenes pendientes" : "pending orders"}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activePct}%</p>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers7d} {language === "es" ? "activos (7d)" : "active (7d)"}
            </p>
          </Card>
        </div>

        {/* Two columns: Recent Users + Recent Orders */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {language === "es" ? "Usuarios recientes" : "Recent Users"}
                </span>
                <Badge variant="secondary" className="text-[10px]">{stats.totalUsers}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.business_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.business_type || "—"} • {u.city || u.country || "—"} • {format(new Date(u.created_at), "MMM dd")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => handleViewUser(u)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  {language === "es" ? "Órdenes recientes" : "Recent Orders"}
                </span>
                <Badge variant="secondary" className="text-[10px]">{stats.totalPaidOrders} paid</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentOrders.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    {language === "es" ? "Sin órdenes recientes" : "No recent orders"}
                  </div>
                ) : (
                  recentOrders.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {getUserName(s.user_id)} → {s.customer_name || "—"} • {format(new Date(s.created_at), "MMM dd")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium">${Number(s.price).toFixed(2)}</span>
                        {getStatusBadge(s.status)}
                        {s.status === "sent" && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMarkPaid(s.id)}>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Pulse — quick glance */}
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {language === "es" ? "Pulso de salud" : "Health Pulse"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stats.newUsers7d > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-sm">{language === "es" ? "Crecimiento" : "Growth"}: {stats.newUsers7d > 0 ? "✓" : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activePct >= 30 ? "bg-emerald-500" : activePct >= 10 ? "bg-amber-500" : "bg-destructive"}`} />
              <span className="text-sm">{language === "es" ? "Retención" : "Retention"}: {activePct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stats.ordersToday > 0 ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              <span className="text-sm">{language === "es" ? "Ventas hoy" : "Sales today"}: {stats.ordersToday}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stats.pendingOrders > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-sm">{language === "es" ? "Por cobrar" : "To collect"}: {stats.pendingOrders}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              {selectedUser?.business_name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "es" ? "Tipo" : "Type"}</p>
                  <p>{selectedUser.business_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "es" ? "Ubicación" : "Location"}</p>
                  <p>{selectedUser.city ? `${selectedUser.city}, ${selectedUser.country}` : selectedUser.country || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "es" ? "Teléfono" : "Phone"}</p>
                  <p>{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "es" ? "Registro" : "Joined"}</p>
                  <p>{format(new Date(selectedUser.created_at), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {userDetails?.roles?.map((role: string) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                  {userDetails?.roles?.length === 0 && (
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Sin roles especiales" : "No special roles"}</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === "es" ? "Asignar rol" : "Grant Role"}</p>
                <div className="flex gap-2">
                  {["consultant", "barbershop", "admin"].filter(r => !userDetails?.roles?.includes(r)).map(role => (
                    <Button key={role} variant="outline" size="sm" onClick={() => handleGrantRole(selectedUser.user_id, role)}>
                      + {role}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === "es" ? "Vitrinas recientes" : "Recent Storefronts"}</p>
                <div className="space-y-2">
                  {userDetails?.storefronts?.slice(0, 5).map((sf: any) => (
                    <div key={sf.id} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">{sf.title}</span>
                      <div className="flex items-center gap-2">
                        <span>${Number(sf.price).toFixed(2)}</span>
                        {getStatusBadge(sf.status)}
                      </div>
                    </div>
                  ))}
                  {userDetails?.storefronts?.length === 0 && (
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Sin vitrinas" : "No storefronts"}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
