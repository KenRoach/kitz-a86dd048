import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, ShoppingBag, Store, Users, Package, 
  DollarSign, MessageSquare, Bell, Calendar, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface ActivityListProps {
  language: string;
  limit?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "order":
    case "sale":
      return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
    case "storefront":
      return <Store className="w-4 h-4 text-consultant-cta" />;
    case "contact":
    case "lead":
      return <Users className="w-4 h-4 text-blue-500" />;
    case "product":
      return <Package className="w-4 h-4 text-consultant-accent" />;
    case "payment":
      return <DollarSign className="w-4 h-4 text-consultant-cta" />;
    case "message":
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case "reminder":
      return <Bell className="w-4 h-4 text-amber-500" />;
    case "calendar":
      return <Calendar className="w-4 h-4 text-blue-500" />;
    default:
      return <Activity className="w-4 h-4 text-consultant-muted" />;
  }
};

const getActivityBg = (type: string) => {
  switch (type) {
    case "order":
    case "sale":
      return "bg-emerald-500/10";
    case "storefront":
      return "bg-consultant-cta/10";
    case "contact":
    case "lead":
      return "bg-blue-500/10";
    case "product":
      return "bg-consultant-accent/10";
    case "payment":
      return "bg-consultant-cta/10";
    case "message":
      return "bg-purple-500/10";
    case "reminder":
      return "bg-amber-500/10";
    case "calendar":
      return "bg-blue-500/10";
    default:
      return "bg-consultant-section-alt";
  }
};

export function ActivityList({ language, limit = 10 }: ActivityListProps) {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-log", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="bg-consultant-section border-consultant-accent/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-consultant-section border-consultant-accent/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-consultant-header">
            <Clock className="w-4 h-4 text-consultant-cta" />
            {language === "es" ? "Actividad Reciente" : "Recent Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-consultant-muted text-center py-4">
            {language === "es" 
              ? "No hay actividad reciente" 
              : "No recent activity"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-consultant-section border-consultant-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-consultant-header">
          <Clock className="w-4 h-4 text-consultant-cta" />
          {language === "es" ? "Actividad Reciente" : "Recent Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-start gap-3 animate-fade-in"
          >
            <div className={`w-8 h-8 rounded-full ${getActivityBg(activity.type)} flex items-center justify-center flex-shrink-0`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-consultant-header leading-tight">
                {activity.message}
              </p>
              <p className="text-[10px] text-consultant-muted mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { 
                  addSuffix: true,
                  locale: language === "es" ? es : enUS
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
