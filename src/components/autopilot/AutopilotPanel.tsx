import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutopilot, AutopilotOpportunity } from "@/hooks/useAutopilot";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Bot, Zap, Store, Users, Play, Loader2, 
  CheckCircle, Clock, AlertCircle, Sparkles,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AutopilotPanel() {
  const { language } = useLanguage();
  const {
    settings,
    actions,
    opportunities,
    loading,
    analyzing,
    updateSettings,
    analyzeOpportunities,
    executeAction,
  } = useAutopilot();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isEnabled = settings?.enabled || false;

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card className={cn(
        "transition-all",
        isEnabled 
          ? "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10" 
          : ""
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isEnabled 
                  ? "bg-primary text-primary-foreground shadow-lg animate-pulse" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  AI Autopilot
                  {isEnabled && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <Zap className="w-3 h-3 mr-1" />
                      {language === "es" ? "Activo" : "Active"}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "Deja que la IA trabaje por ti dentro de tus límites" 
                    : "Let AI work for you within your boundaries"}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <>
          {/* Action Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Storefront Creation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">
                      {language === "es" ? "Crear Vitrinas" : "Create Storefronts"}
                    </CardTitle>
                  </div>
                  <Switch
                    checked={settings?.auto_create_storefronts || false}
                    onCheckedChange={(checked) => updateSettings({ auto_create_storefronts: checked })}
                  />
                </div>
                <CardDescription>
                  {language === "es" 
                    ? "Auto-generar vitrinas para productos activos" 
                    : "Auto-generate storefronts for active products"}
                </CardDescription>
              </CardHeader>
              {settings?.auto_create_storefronts && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>{language === "es" ? "Máximo por día" : "Max per day"}</Label>
                      <span className="font-medium">{settings.max_storefronts_per_day}</span>
                    </div>
                    <Slider
                      value={[settings.max_storefronts_per_day]}
                      onValueChange={([v]) => updateSettings({ max_storefronts_per_day: v })}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>{language === "es" ? "Precio mínimo" : "Min price"}</Label>
                      <span className="font-medium">${settings.min_product_price}</span>
                    </div>
                    <Slider
                      value={[settings.min_product_price]}
                      onValueChange={([v]) => updateSettings({ min_product_price: v })}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Customer Follow-up */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">
                      {language === "es" ? "Seguimiento de Clientes" : "Customer Follow-up"}
                    </CardTitle>
                  </div>
                  <Switch
                    checked={settings?.auto_followup_customers || false}
                    onCheckedChange={(checked) => updateSettings({ auto_followup_customers: checked })}
                  />
                </div>
                <CardDescription>
                  {language === "es" 
                    ? "Recordar hacer seguimiento a clientes inactivos" 
                    : "Remind to follow up with inactive customers"}
                </CardDescription>
              </CardHeader>
              {settings?.auto_followup_customers && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>{language === "es" ? "Después de días" : "After days"}</Label>
                      <span className="font-medium">{settings.followup_after_days}</span>
                    </div>
                    <Slider
                      value={[settings.followup_after_days]}
                      onValueChange={([v]) => updateSettings({ followup_after_days: v })}
                      min={3}
                      max={30}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>{language === "es" ? "Máximo por día" : "Max per day"}</Label>
                      <span className="font-medium">{settings.max_followups_per_day}</span>
                    </div>
                    <Slider
                      value={[settings.max_followups_per_day]}
                      onValueChange={([v]) => updateSettings({ max_followups_per_day: v })}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Opportunities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base">
                    {language === "es" ? "Oportunidades" : "Opportunities"}
                  </CardTitle>
                  {opportunities.length > 0 && (
                    <Badge variant="secondary">{opportunities.length}</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeOpportunities}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-1.5">{language === "es" ? "Analizar" : "Analyze"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {language === "es" 
                      ? "Haz clic en Analizar para encontrar oportunidades" 
                      : "Click Analyze to find opportunities"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp, i) => (
                    <OpportunityCard 
                      key={i} 
                      opportunity={opp} 
                      onExecute={() => executeAction(opp.type, opp.payload)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          {actions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  {language === "es" ? "Acciones Recientes" : "Recent Actions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          action.status === 'completed' 
                            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                            : action.status === 'failed'
                            ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {action.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : action.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{action.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(action.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function OpportunityCard({ 
  opportunity, 
  onExecute 
}: { 
  opportunity: AutopilotOpportunity; 
  onExecute: () => void;
}) {
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    await onExecute();
    setExecuting(false);
  };

  const priorityColors = {
    high: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
    medium: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
    low: "border-muted bg-muted/50",
  };

  return (
    <div className={cn(
      "p-3 rounded-xl border transition-all",
      priorityColors[opportunity.priority]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {opportunity.type === 'create_storefront' ? (
              <Store className="w-4 h-4 text-primary" />
            ) : (
              <Users className="w-4 h-4 text-primary" />
            )}
            <p className="font-medium text-sm truncate">{opportunity.title}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{opportunity.description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleExecute}
          disabled={executing}
          className="shrink-0"
        >
          {executing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Need to import useState for the inner component
import { useState } from "react";
