import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TrendingUp, 
  Activity,
  Package,
  Eye,
  RefreshCw,
  Search,
  BarChart3,
  Globe,
  ArrowUp,
  Shield,
  Bot,
  Send,
  Store,
  UserCog,
  CheckCircle,
  Clock,
  FileText,
  Sparkles,
  Bell,
  Mail,
  AlertTriangle,
  UserPlus,
  Coins,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { 
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
  Bar
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
  pendingOrders: number;
  pendingRevenue: number;
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AlertLog {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function PlatformAdmin() {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalStorefronts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers7d: 0,
    newUsers7d: 0,
    ordersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    pendingRevenue: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [storefronts, setStorefronts] = useState<StorefrontData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [businessTypes, setBusinessTypes] = useState<{ name: string; value: number }[]>([]);
  const [countries, setCountries] = useState<{ name: string; value: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [storefrontSearch, setStorefrontSearch] = useState("");
  const [storefrontFilter, setStorefrontFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Alerts state
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  
  // User detail dialog
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const checkAdminAndLoadData = async () => {
    if (!user) return;

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
      loadStorefronts(),
      loadRecentActivity(),
      loadDailyMetrics(),
      loadBusinessTypeBreakdown(),
      loadCountryBreakdown(),
      loadAlertLogs(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success(language === "es" ? "Datos actualizados" : "Data refreshed");
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
      pendingStorefrontsRes,
      newUsersRes,
      todayOrdersRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("price").eq("status", "paid"),
      supabase.from("storefronts").select("price").eq("status", "sent"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("storefronts").select("price").eq("status", "paid").gte("paid_at", startOfToday).lte("paid_at", endOfToday),
      supabase.from("activity_log").select("user_id").gte("created_at", sevenDaysAgo),
    ]);

    const totalRevenue = paidStorefrontsRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
    const revenueToday = todayOrdersRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
    const pendingRevenue = pendingStorefrontsRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
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
      pendingOrders: pendingStorefrontsRes.data?.length || 0,
      pendingRevenue,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, business_name, business_type, created_at, city, country, phone")
      .order("created_at", { ascending: false })
      .limit(500);

    setUsers(data || []);
  };

  const loadStorefronts = async () => {
    const { data } = await supabase
      .from("storefronts")
      .select("id, title, price, status, created_at, user_id, customer_name, paid_at")
      .order("created_at", { ascending: false })
      .limit(500);

    setStorefronts(data || []);
  };

  const loadRecentActivity = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, type, message, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(100);

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
    const { data } = await supabase.from("profiles").select("business_type");
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
    const { data } = await supabase.from("profiles").select("country");
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

  const loadAlertLogs = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, type, message, created_at")
      .in("type", ["admin_alert", "revenue_milestone", "daily_summary", "new_signup_alert"])
      .order("created_at", { ascending: false })
      .limit(50);
    setAlertLogs(data || []);
  };

  const handleSendAlert = async (alertType: "new_signup" | "revenue_milestone" | "inactive_users" | "daily_summary") => {
    setSendingAlert(alertType);
    try {
      const alertData: Record<string, any> = {};
      
      if (alertType === "daily_summary") {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        const [newProfilesRes, ordersRes, activeRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStr),
          supabase.from("storefronts").select("price").gte("ordered_at", yesterdayStr),
          supabase.from("user_stats").select("user_id").gte("last_active_date", yesterdayStr),
        ]);
        
        alertData.newUsers = newProfilesRes.count || 0;
        alertData.totalOrders = ordersRes.data?.length || 0;
        alertData.revenue = ordersRes.data?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
        alertData.activeUsers = activeRes.data?.length || 0;
      } else if (alertType === "revenue_milestone") {
        const { data: paidStorefronts } = await supabase
          .from("storefronts")
          .select("price")
          .eq("status", "paid");
        alertData.totalRevenue = paidStorefronts?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
        alertData.milestone = alertData.totalRevenue;
        alertData.period = "All time";
      } else if (alertType === "inactive_users") {
        const inactiveDate = new Date();
        inactiveDate.setDate(inactiveDate.getDate() - 7);
        
        const { data: inactiveStats } = await supabase
          .from("user_stats")
          .select("user_id, last_active_date")
          .or(`last_active_date.lt.${inactiveDate.toISOString()},last_active_date.is.null`);
        
        const userIds = inactiveStats?.map(s => s.user_id) || [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, business_name")
          .in("user_id", userIds);
        
        alertData.users = profiles?.map(p => ({
          business_name: p.business_name,
          last_active: inactiveStats?.find(s => s.user_id === p.user_id)?.last_active_date,
        })) || [];
        alertData.inactiveDays = 7;
      } else if (alertType === "new_signup") {
        alertData.businessName = "Test Signup";
        alertData.email = "test@example.com";
        alertData.businessType = "Demo";
      }
      
      const response = await supabase.functions.invoke("admin-alerts", {
        body: { type: alertType, data: alertData },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast.success(language === "es" ? "Alerta enviada" : "Alert sent successfully");
      loadAlertLogs();
    } catch (error: any) {
      console.error("Alert error:", error);
      toast.error(language === "es" ? "Error al enviar alerta" : "Failed to send alert");
    } finally {
      setSendingAlert(null);
    }
  };

  const handleRunCheckAlerts = async () => {
    setSendingAlert("check");
    try {
      const response = await supabase.functions.invoke("check-alerts");
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      toast.success(
        language === "es" 
          ? `${result.alertsSent || 0} alertas procesadas` 
          : `${result.alertsSent || 0} alerts processed`
      );
      loadAlertLogs();
    } catch (error: any) {
      console.error("Check alerts error:", error);
      toast.error(language === "es" ? "Error al verificar alertas" : "Failed to check alerts");
    } finally {
      setSendingAlert(null);
    }
  };

  const handleViewUser = async (userData: UserData) => {
    setSelectedUser(userData);
    setUserDialogOpen(true);
    // Fetch user's storefronts and roles
    const [sfRes, rolesRes] = await Promise.all([
      supabase.from("storefronts").select("*").eq("user_id", userData.user_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("user_roles").select("role").eq("user_id", userData.user_id)
    ]);
    
    setUserDetails({
      storefronts: sfRes.data || [],
      roles: rolesRes.data?.map(r => r.role) || []
    });
  };

  const handleGrantRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: role as any });
    
    if (error) {
      toast.error("Failed to grant role");
      return;
    }
    
    toast.success(`Role ${role} granted`);
    // Refresh user details
    if (selectedUser) {
      handleViewUser(selectedUser);
    }
  };

  const handleMarkPaid = async (storefrontId: string) => {
    const { error } = await supabase
      .from("storefronts")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", storefrontId);
    
    if (error) {
      toast.error("Failed to mark as paid");
      return;
    }
    
    toast.success("Marked as paid");
    loadStorefronts();
    loadStats();
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await supabase.functions.invoke("admin-advisor", {
        body: {
          messages: [...chatMessages, { role: "user", content: userMessage }],
          language,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              fullContent += content;
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = fullContent;
                } else {
                  newMessages.push({ role: "assistant", content: fullContent });
                }
                return newMessages;
              });
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: language === "es" 
          ? "Error al procesar tu solicitud. Intenta de nuevo." 
          : "Error processing your request. Please try again."
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.business_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStorefronts = storefronts.filter(s => {
    const matchesSearch = 
      s.title?.toLowerCase().includes(storefrontSearch.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(storefrontSearch.toLowerCase());
    const matchesFilter = storefrontFilter === "all" || s.status === storefrontFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case "sent": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.business_name || "Unknown";
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {language === "es" ? "Centro de Control Kitz" : "Kitz Control Center"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "es" ? "Control total de la plataforma" : "Full platform control"}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600">+{stats.newUsers7d} this week</p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-green-600">+${stats.revenueToday.toFixed(0)} today</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-xl font-bold">{stats.totalOrders}</p>
                  <p className="text-xs text-blue-600">{stats.ordersToday} today</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">${stats.pendingRevenue.toFixed(0)}</p>
                  <p className="text-xs text-yellow-600">{stats.pendingOrders} orders</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{stats.activeUsers7d}</p>
                  <p className="text-xs text-muted-foreground">7 days</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="overview" className="gap-1 text-xs">
              <BarChart3 className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs">
              <Users className="w-3 h-3" />
              Users
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1 text-xs">
              <Store className="w-3 h-3" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1 text-xs">
              <Activity className="w-3 h-3" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 text-xs">
              <Bell className="w-3 h-3" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              AI Control
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Revenue (7 days)
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
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Users & Orders (7 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyMetrics}>
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Business Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {businessTypes.map((type, i) => (
                      <div key={type.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{type.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{type.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {countries.map((country, i) => (
                      <div key={country.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{country.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{country.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="outline">{filteredUsers.length} users</Badge>
            </div>

            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.business_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{u.business_type || "N/A"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.city ? `${u.city}, ${u.country || ""}` : u.country || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.phone || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(u.created_at), "MMM dd")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(u)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search storefronts..."
                  value={storefrontSearch}
                  onChange={(e) => setStorefrontSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={storefrontFilter} onValueChange={setStorefrontFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredStorefronts.length} orders</Badge>
            </div>

            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStorefronts.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                        <TableCell className="text-sm">{getUserName(s.user_id)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.customer_name || "—"}</TableCell>
                        <TableCell className="font-medium">${Number(s.price).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(s.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(s.created_at), "MMM dd")}</TableCell>
                        <TableCell>
                          {s.status === "sent" && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(s.id)} className="text-green-600">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-4">
                        <div className="mt-0.5">
                          {activity.type === "order" ? <ShoppingBag className="w-4 h-4 text-green-500" /> :
                           activity.type === "storefront" ? <Package className="w-4 h-4 text-blue-500" /> :
                           <Activity className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), "MMM dd, h:mm a")}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{getUserName(activity.user_id)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Alert Triggers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {language === "es" ? "Enviar Alertas Manuales" : "Send Manual Alerts"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleSendAlert("daily_summary")}
                    disabled={sendingAlert !== null}
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language === "es" ? "Resumen Diario" : "Daily Summary"}</p>
                      <p className="text-xs text-muted-foreground">{language === "es" ? "Enviar resumen de métricas" : "Send metrics summary email"}</p>
                    </div>
                    {sendingAlert === "daily_summary" && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleSendAlert("revenue_milestone")}
                    disabled={sendingAlert !== null}
                  >
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Coins className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language === "es" ? "Hito de Ingresos" : "Revenue Milestone"}</p>
                      <p className="text-xs text-muted-foreground">{language === "es" ? "Notificar logro de ingresos" : "Notify revenue achievement"}</p>
                    </div>
                    {sendingAlert === "revenue_milestone" && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleSendAlert("inactive_users")}
                    disabled={sendingAlert !== null}
                  >
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <UserX className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language === "es" ? "Usuarios Inactivos" : "Inactive Users"}</p>
                      <p className="text-xs text-muted-foreground">{language === "es" ? "Alertar sobre usuarios inactivos" : "Alert about inactive users"}</p>
                    </div>
                    {sendingAlert === "inactive_users" && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleSendAlert("new_signup")}
                    disabled={sendingAlert !== null}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <UserPlus className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language === "es" ? "Nuevo Registro (Test)" : "New Signup (Test)"}</p>
                      <p className="text-xs text-muted-foreground">{language === "es" ? "Enviar alerta de prueba" : "Send test signup alert"}</p>
                    </div>
                    {sendingAlert === "new_signup" && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
                  </Button>

                  <div className="pt-3 border-t">
                    <Button
                      className="w-full gap-2"
                      onClick={handleRunCheckAlerts}
                      disabled={sendingAlert !== null}
                    >
                      {sendingAlert === "check" ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      {language === "es" ? "Ejecutar Verificación Automática" : "Run Automated Check"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {language === "es" 
                        ? "Verifica hitos, usuarios inactivos y genera resumen" 
                        : "Checks milestones, inactive users, and generates summary"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Types Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {language === "es" ? "Tipos de Alertas" : "Alert Types"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <UserPlus className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{language === "es" ? "Nuevos Registros" : "New Signups"}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Notificación automática cuando un usuario se registra" 
                          : "Automatic notification when a user signs up"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Coins className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{language === "es" ? "Hitos de Ingresos" : "Revenue Milestones"}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Alertas al alcanzar $100, $500, $1K, $5K, etc." 
                          : "Alerts when reaching $100, $500, $1K, $5K, etc."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <UserX className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{language === "es" ? "Usuarios Inactivos" : "Inactive Users"}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Reporte semanal de usuarios sin actividad por 7+ días" 
                          : "Weekly report of users inactive for 7+ days"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <BarChart3 className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{language === "es" ? "Resumen Diario" : "Daily Summary"}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Métricas clave del día anterior" 
                          : "Key metrics from the previous day"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {language === "es" ? "Historial de Alertas" : "Alert History"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-border">
                    {alertLogs.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{language === "es" ? "No hay alertas recientes" : "No recent alerts"}</p>
                      </div>
                    ) : (
                      alertLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-4">
                          <div className="mt-0.5">
                            {log.type === "admin_alert" ? <Mail className="w-4 h-4 text-blue-500" /> :
                             log.type === "revenue_milestone" ? <Coins className="w-4 h-4 text-green-500" /> :
                             log.type === "daily_summary" ? <BarChart3 className="w-4 h-4 text-purple-500" /> :
                             log.type === "new_signup_alert" ? <UserPlus className="w-4 h-4 text-blue-500" /> :
                             <Bell className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{log.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.created_at), "MMM dd, h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Control Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Platform Control
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ask questions, get insights, and control the platform with AI
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 pt-0">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Start a conversation with the AI</p>
                        <p className="text-xs mt-1">Ask about users, revenue, trends, or request actions</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {[
                            "Show me top users by revenue",
                            "What's our growth this week?",
                            "Which users need attention?",
                            "Revenue forecast"
                          ].map((prompt) => (
                            <Button
                              key={prompt}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setChatInput(prompt);
                              }}
                            >
                              {prompt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-4 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Input
                    placeholder="Ask anything about the platform..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                    disabled={chatLoading}
                  />
                  <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                  <p className="text-muted-foreground">Type</p>
                  <p>{selectedUser.business_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p>{selectedUser.city ? `${selectedUser.city}, ${selectedUser.country}` : selectedUser.country || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
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
                    <span className="text-sm text-muted-foreground">No special roles</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Grant Role</p>
                <div className="flex gap-2">
                  {["consultant", "barbershop", "admin"].filter(r => !userDetails?.roles?.includes(r)).map(role => (
                    <Button 
                      key={role} 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGrantRole(selectedUser.user_id, role)}
                    >
                      + {role}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Recent Storefronts</p>
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
                    <span className="text-sm text-muted-foreground">No storefronts</span>
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
