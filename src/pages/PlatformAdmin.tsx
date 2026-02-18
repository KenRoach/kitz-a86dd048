import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserCog,
  CheckCircle,
  Clock,
  Search,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

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

interface DailyMetric {
  date: string;
  users: number;
  revenue: number;
  orders: number;
}

interface InactiveUser {
  user_id: string;
  business_name: string;
  last_active: string | null;
  days_inactive: number;
  storefronts_count: number;
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
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [recentOrders, setRecentOrders] = useState<StorefrontData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStorefrontCounts, setUserStorefrontCounts] = useState<Record<string, number>>({});

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
    await Promise.all([loadStats(), loadUsers(), loadRecentOrders(), loadDailyMetrics(), loadInactiveUsers()]);
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

  const loadUsers = async () => {
    const [usersRes, sfCountRes] = await Promise.all([
      supabase.from("profiles")
        .select("id, user_id, business_name, business_type, created_at, city, country, phone")
        .order("created_at", { ascending: false }).limit(500),
      supabase.from("storefronts").select("user_id"),
    ]);
    setAllUsers(usersRes.data || []);
    
    // Count storefronts per user
    const counts: Record<string, number> = {};
    (sfCountRes.data || []).forEach(s => { counts[s.user_id] = (counts[s.user_id] || 0) + 1; });
    setUserStorefrontCounts(counts);
  };

  const loadRecentOrders = async () => {
    const { data } = await supabase
      .from("storefronts")
      .select("id, title, price, status, created_at, user_id, customer_name, paid_at")
      .in("status", ["paid", "sent"])
      .order("created_at", { ascending: false })
      .limit(8);
    setRecentOrders(data || []);
  };

  const loadDailyMetrics = async () => {
    const metrics: DailyMetric[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();
      const [usersRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
        supabase.from("storefronts").select("price").eq("status", "paid").gte("paid_at", start).lte("paid_at", end),
      ]);
      const revenue = ordersRes.data?.reduce((s, o) => s + Number(o.price || 0), 0) || 0;
      metrics.push({ date: format(date, "dd"), users: usersRes.count || 0, orders: ordersRes.data?.length || 0, revenue });
    }
    setDailyMetrics(metrics);
  };

  const loadInactiveUsers = async () => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("user_id, last_active_date")
      .or(`last_active_date.lt.${sevenDaysAgo.toISOString()},last_active_date.is.null`);

    if (!statsData || statsData.length === 0) { setInactiveUsers([]); return; }

    const userIds = statsData.map(s => s.user_id);
    const [profilesRes, sfRes] = await Promise.all([
      supabase.from("profiles").select("user_id, business_name").in("user_id", userIds),
      supabase.from("storefronts").select("user_id").in("user_id", userIds),
    ]);

    const sfCounts: Record<string, number> = {};
    (sfRes.data || []).forEach(s => { sfCounts[s.user_id] = (sfCounts[s.user_id] || 0) + 1; });

    const inactive: InactiveUser[] = (profilesRes.data || []).map(p => {
      const stat = statsData.find(s => s.user_id === p.user_id);
      const lastActive = stat?.last_active_date;
      const daysInactive = lastActive
        ? Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return {
        user_id: p.user_id,
        business_name: p.business_name,
        last_active: lastActive,
        days_inactive: daysInactive,
        storefronts_count: sfCounts[p.user_id] || 0,
      };
    }).sort((a, b) => b.days_inactive - a.days_inactive).slice(0, 10);

    setInactiveUsers(inactive);
  };

  const getUserName = (userId: string) => allUsers.find(u => u.user_id === userId)?.business_name || "—";

  const handleViewUser = async (userData: UserData) => {
    setSelectedUser(userData);
    setUserDialogOpen(true);
    const [sfRes, rolesRes, statsRes] = await Promise.all([
      supabase.from("storefronts").select("*").eq("user_id", userData.user_id).order("created_at", { ascending: false }).limit(5),
      supabase.from("user_roles").select("role").eq("user_id", userData.user_id),
      supabase.from("user_stats").select("*").eq("user_id", userData.user_id).maybeSingle(),
    ]);
    setUserDetails({
      storefronts: sfRes.data || [],
      roles: rolesRes.data?.map(r => r.role) || [],
      stats: statsRes.data,
    });
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

  const filteredUsers = allUsers.filter(u =>
    u.business_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.business_type?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.city?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  );

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
  const totalUsersLast7 = dailyMetrics.slice(-7).reduce((s, d) => s + d.users, 0);
  const totalUsersPrev7 = dailyMetrics.slice(0, 7).reduce((s, d) => s + d.users, 0);
  const growthTrend = totalUsersLast7 >= totalUsersPrev7 ? "up" : "down";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
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

        {/* Top Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              {growthTrend === "up"
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                : <TrendingDown className="w-3.5 h-3.5 text-destructive ml-auto" />
              }
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Usuarios" : "Users"}
              {stats.newUsers7d > 0 && <span className="text-emerald-600 ml-1">+{stats.newUsers7d}</span>}
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
              {language === "es" ? "Revenue total" : "Total revenue"}
              {stats.revenueToday > 0 && <span className="text-emerald-600 ml-1">+${stats.revenueToday.toFixed(0)}</span>}
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
              {stats.pendingOrders} {language === "es" ? "pendientes" : "pending"}
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

        {/* Growth Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {language === "es" ? "Nuevos usuarios (14d)" : "New Users (14d)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyMetrics}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, language === "es" ? "Usuarios" : "Users"]} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                {language === "es" ? "Revenue (14d)" : "Revenue (14d)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Churn Alerts + Recent Orders */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Churn Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {language === "es" ? "Riesgo de churn" : "Churn Risk"}
                </span>
                {inactiveUsers.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{inactiveUsers.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inactiveUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  {language === "es" ? "Todos los usuarios activos 🎉" : "All users active 🎉"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {inactiveUsers.map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u.business_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {u.days_inactive >= 999
                            ? (language === "es" ? "Nunca activo" : "Never active")
                            : `${u.days_inactive}d ${language === "es" ? "inactivo" : "inactive"}`}
                          {u.storefronts_count > 0 && ` • ${u.storefronts_count} vitrinas`}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        u.days_inactive > 30 ? "bg-destructive" : u.days_inactive > 14 ? "bg-amber-500" : "bg-amber-400"
                      }`} />
                    </div>
                  ))}
                </div>
              )}
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
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {language === "es" ? "Sin órdenes recientes" : "No recent orders"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentOrders.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full User Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {language === "es" ? "Todos los usuarios" : "All Users"}
              </span>
              <Badge variant="secondary" className="text-[10px]">{filteredUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por nombre, tipo, ciudad..." : "Search by name, type, city..."}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[350px]">
              <div className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2.5 pr-1 hover:bg-muted/40 transition-colors rounded-md px-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{u.business_name}</p>
                        {userStorefrontCounts[u.user_id] > 0 && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {userStorefrontCounts[u.user_id]} {language === "es" ? "vitrinas" : "storefronts"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {u.business_type || "—"} • {u.city || u.country || "—"} • {format(new Date(u.created_at), "MMM dd, yyyy")}
                        {u.phone && ` • ${u.phone}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => handleViewUser(u)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {language === "es" ? "Sin resultados" : "No results"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Health Pulse */}
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
              <div className={`w-2.5 h-2.5 rounded-full ${inactiveUsers.length > 5 ? "bg-destructive" : inactiveUsers.length > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-sm">{language === "es" ? "Churn risk" : "Churn risk"}: {inactiveUsers.length}</span>
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

              {/* User stats */}
              {userDetails?.stats && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{userDetails.stats.total_storefronts || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{language === "es" ? "Vitrinas" : "Storefronts"}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{userDetails.stats.total_orders || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{language === "es" ? "Órdenes" : "Orders"}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">${Number(userDetails.stats.total_revenue || 0).toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {userDetails?.roles?.map((role: string) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                  {userDetails?.roles?.length === 0 && (
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Sin roles" : "No roles"}</span>
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
