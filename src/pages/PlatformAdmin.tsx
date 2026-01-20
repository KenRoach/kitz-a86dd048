import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Activity,
  Package,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  BarChart3,
  Globe,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface PlatformStats {
  totalUsers: number;
  totalStorefronts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers7d: number;
  newUsers7d: number;
  ordersToday: number;
  revenueToday: number;
}

interface UserData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  created_at: string;
  city: string | null;
  country: string | null;
}

interface ActivityData {
  id: string;
  type: string;
  message: string;
  created_at: string;
  user_id: string;
}

interface DailyMetric {
  date: string;
  users: number;
  orders: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function PlatformAdmin() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalStorefronts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers7d: 0,
    newUsers7d: 0,
    ordersToday: 0,
    revenueToday: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [businessTypes, setBusinessTypes] = useState<{ name: string; value: number }[]>([]);
  const [countries, setCountries] = useState<{ name: string; value: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [user]);

  const checkAdminAndLoadData = async () => {
    if (!user) return;

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadAllData();
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadRecentActivity(),
      loadDailyMetrics(),
      loadBusinessTypeBreakdown(),
      loadCountryBreakdown(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const loadStats = async () => {
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();
    const sevenDaysAgo = subDays(today, 7).toISOString();

    const [
      profilesRes,
      storefrontsRes,
      paidStorefrontsRes,
      newUsersRes,
      todayOrdersRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("price").eq("status", "paid"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("storefronts").select("price").eq("status", "paid").gte("paid_at", startOfToday).lte("paid_at", endOfToday),
      supabase.from("activity_log").select("user_id").gte("created_at", sevenDaysAgo),
    ]);

    const totalRevenue = paidStorefrontsRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
    const revenueToday = todayOrdersRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
    const uniqueActiveUsers = new Set(activityRes.data?.map(a => a.user_id) || []).size;

    setStats({
      totalUsers: profilesRes.count || 0,
      totalStorefronts: storefrontsRes.count || 0,
      totalOrders: paidStorefrontsRes.data?.length || 0,
      totalRevenue,
      activeUsers7d: uniqueActiveUsers,
      newUsers7d: newUsersRes.count || 0,
      ordersToday: todayOrdersRes.data?.length || 0,
      revenueToday,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, business_name, business_type, created_at, city, country")
      .order("created_at", { ascending: false })
      .limit(100);

    setUsers(data || []);
  };

  const loadRecentActivity = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, type, message, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    setActivities(data || []);
  };

  const loadDailyMetrics = async () => {
    const metrics: DailyMetric[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      const [usersRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
        supabase.from("storefronts").select("price").eq("status", "paid").gte("paid_at", start).lte("paid_at", end),
      ]);

      const revenue = ordersRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;

      metrics.push({
        date: format(date, "MMM dd"),
        users: usersRes.count || 0,
        orders: ordersRes.data?.length || 0,
        revenue,
      });
    }

    setDailyMetrics(metrics);
  };

  const loadBusinessTypeBreakdown = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("business_type");

    const typeCounts: Record<string, number> = {};
    data?.forEach(p => {
      const type = p.business_type || "Other";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const sorted = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setBusinessTypes(sorted);
  };

  const loadCountryBreakdown = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("country");

    const countryCounts: Record<string, number> = {};
    data?.forEach(p => {
      const country = p.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const sorted = Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setCountries(sorted);
  };

  const filteredUsers = users.filter(u => 
    u.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.business_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order": return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case "storefront": return <Package className="w-4 h-4 text-blue-500" />;
      case "view": return <Eye className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
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

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {language === "es" ? "Centro de Control" : "Control Center"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "es" ? "Monitorea y haz crecer Kitz" : "Monitor and grow Kitz"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {language === "es" ? "Actualizar" : "Refresh"}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Usuarios Totales" : "Total Users"}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <ArrowUp className="w-3 h-3" />
                    +{stats.newUsers7d} {language === "es" ? "esta semana" : "this week"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Ingresos Totales" : "Total Revenue"}
                  </p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <ArrowUp className="w-3 h-3" />
                    ${stats.revenueToday.toFixed(2)} {language === "es" ? "hoy" : "today"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Pedidos Totales" : "Total Orders"}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <ShoppingBag className="w-3 h-3" />
                    {stats.ordersToday} {language === "es" ? "hoy" : "today"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Usuarios Activos" : "Active Users"}
                  </p>
                  <p className="text-2xl font-bold">{stats.activeUsers7d}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {language === "es" ? "últimos 7 días" : "last 7 days"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {language === "es" ? "Ingresos (7 días)" : "Revenue (7 days)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* New Users & Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {language === "es" ? "Usuarios y Pedidos (7 días)" : "Users & Orders (7 days)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyMetrics}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdowns Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                {language === "es" ? "Tipos de Negocio" : "Business Types"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businessTypes.map((type, i) => (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm">{type.name}</span>
                    </div>
                    <Badge variant="secondary">{type.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {language === "es" ? "Países" : "Countries"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countries.map((country, i) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm">{country.name}</span>
                    </div>
                    <Badge variant="secondary">{country.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Users and Activity */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              {language === "es" ? "Usuarios" : "Users"}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              {language === "es" ? "Actividad" : "Activity"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === "es" ? "Buscar usuarios..." : "Search users..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Negocio" : "Business"}</TableHead>
                    <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
                    <TableHead>{language === "es" ? "Ubicación" : "Location"}</TableHead>
                    <TableHead>{language === "es" ? "Registro" : "Joined"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.slice(0, 20).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.business_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.business_type || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.city ? `${u.city}, ${u.country || ""}` : u.country || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activities.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-4">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.created_at), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
