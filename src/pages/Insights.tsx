import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { useBusinessOS } from "@/hooks/useBusinessOS";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Target } from "lucide-react";

export default function Insights() {
  const { language } = useLanguage();
  const { getInsights } = useBusinessOS();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInsights().then(d => { setData(d); setLoading(false); });
  }, [getInsights]);

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;
  if (!data) return <AppLayout><p className="text-center text-muted-foreground py-12">No data available</p></AppLayout>;

  const dailyEntries = Object.entries(data.dailyRevenue || {}) as [string, number][];
  const maxRevenue = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">{language === "es" ? "Métricas" : "Insights"}</h1>

        {/* Key Numbers */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-semibold">${Number(data.totalRevenue).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Ingresos totales" : "Total Revenue"}</p>
          </Card>
          <Card className="p-4">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-semibold">${Number(data.totalMargin).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Margen total" : "Total Margin"}</p>
          </Card>
          <Card className="p-4">
            <ShoppingCart className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-semibold">{data.paidOrders}/{data.totalOrders}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Órdenes pagadas" : "Paid Orders"}</p>
          </Card>
          <Card className="p-4">
            <Target className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-2xl font-semibold">{data.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Conversión" : "Conversion"}</p>
          </Card>
        </div>

        {/* Revenue Chart (simple bars) */}
        <Card className="p-4">
          <h2 className="text-sm font-medium mb-4">{language === "es" ? "Ingresos (7 días)" : "Revenue (7 days)"}</h2>
          <div className="flex items-end gap-1 h-32">
            {dailyEntries.map(([date, value]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t-sm relative overflow-hidden"
                  style={{ height: `${Math.max((value / maxRevenue) * 100, 4)}%` }}
                >
                  <div className="absolute inset-0 bg-primary rounded-t-sm" style={{ height: "100%" }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Lead Distribution */}
        <Card className="p-4">
          <h2 className="text-sm font-medium mb-3">{language === "es" ? "Distribución de leads" : "Lead Distribution"}</h2>
          <div className="space-y-2">
            {[
              { label: "🔥 Hot", count: data.hotLeads, color: "bg-red-500" },
              { label: "☀️ Warm", count: data.warmLeads, color: "bg-orange-500" },
              { label: "❄️ Cold", count: data.coldLeads, color: "bg-blue-500" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-3">
                <span className="text-sm w-16">{l.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${l.color} rounded-full`}
                    style={{ width: `${data.totalContacts > 0 ? (l.count / data.totalContacts * 100) : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{l.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
