import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAutopilot, AutopilotOpportunity } from "@/hooks/useAutopilot";
import { use4DX } from "@/hooks/use4DX";
import { useLanguage } from "@/hooks/useLanguage";
import { EisenhowerMatrix } from "./EisenhowerMatrix";
import { InstagramIdeas } from "./InstagramIdeas";
import { ContentCalendar } from "./ContentCalendar";
import { 
  Bot, Zap, Store, Users, Play, Loader2, 
  CheckCircle, Clock, AlertCircle, Sparkles,
  RefreshCw, Target, TrendingUp, Trophy,
  Calendar, Plus, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AutopilotPanel() {
  const { t, language } = useLanguage();
  const {
    settings,
    actions,
    opportunities,
    loading: autopilotLoading,
    analyzing,
    updateSettings,
    analyzeOpportunities,
    executeAction,
  } = useAutopilot();

  const {
    goals,
    leadMeasures,
    wigProgress,
    commitments,
    lastWeekCommitments,
    loading: goalsLoading,
    updateGoals,
    addCommitment,
    toggleCommitment,
    deleteCommitment,
  } = use4DX();

  const [newCommitment, setNewCommitment] = useState("");
  const [showLastWeek, setShowLastWeek] = useState(false);

  const loading = autopilotLoading || goalsLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isEnabled = settings?.enabled || false;

  const getProgressStatus = () => {
    if (!wigProgress) return { text: t.onTrack, color: "text-muted-foreground" };
    if (wigProgress.percentage >= 100) return { text: t.aheadOfPace, color: "text-green-600" };
    
    // Calculate expected progress based on period
    const now = new Date();
    let expectedPercent = 50; // Default to 50% for simplicity
    
    if (goals?.wig_period === 'weekly') {
      const dayOfWeek = now.getDay() || 7;
      expectedPercent = (dayOfWeek / 7) * 100;
    } else if (goals?.wig_period === 'monthly') {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      expectedPercent = (dayOfMonth / daysInMonth) * 100;
    }
    
    if (wigProgress.percentage >= expectedPercent) {
      return { text: t.onTrack, color: "text-green-600" };
    }
    return { text: t.behindPace, color: "text-amber-600" };
  };

  const progressStatus = getProgressStatus();

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
                  AI Mode
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
          {/* Goals Scoreboard */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">{t.fourDxTitle}</CardTitle>
              </div>
              <CardDescription>{t.wigFull}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WIG Configuration */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t.target}</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground self-center">$</span>
                    <Input
                      type="number"
                      value={goals?.wig_target || 500}
                      onChange={(e) => updateGoals({ wig_target: Number(e.target.value) })}
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t.period}</Label>
                  <Select
                    value={goals?.wig_period || 'weekly'}
                    onValueChange={(v) => updateGoals({ wig_period: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t.daily}</SelectItem>
                      <SelectItem value="weekly">{t.weekly}</SelectItem>
                      <SelectItem value="monthly">{t.monthly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{language === "es" ? "Tipo" : "Type"}</Label>
                  <Select
                    value={goals?.wig_type || 'revenue'}
                    onValueChange={(v) => updateGoals({ wig_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">{t.revenue}</SelectItem>
                      <SelectItem value="orders">{t.newOrders}</SelectItem>
                      <SelectItem value="customers">{t.newCustomers}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Visual Scoreboard */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {goals?.wig_type === 'revenue' ? '$' : ''}
                      {wigProgress?.current.toLocaleString() || 0}
                      <span className="text-muted-foreground">
                        {' / '}
                        {goals?.wig_type === 'revenue' ? '$' : ''}
                        {wigProgress?.target.toLocaleString() || 0}
                      </span>
                    </span>
                  </div>
                  <Badge variant="outline" className={progressStatus.color}>
                    {progressStatus.text}
                  </Badge>
                </div>
                <Progress 
                  value={wigProgress?.percentage || 0} 
                  className="h-4" 
                />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(wigProgress?.percentage || 0)}% {t.ofTarget}
                </p>
              </div>

              {/* Lead Measures */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t.leadMeasures}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t.activitiesThatDriveResults}</p>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Storefronts Lead Measure */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">{t.storefrontsCreated}</span>
                      </div>
                      <span className="text-sm font-bold">
                        {leadMeasures?.storefrontsCreated || 0}/{goals?.storefronts_target || 5}
                      </span>
                    </div>
                    <Progress 
                      value={((leadMeasures?.storefrontsCreated || 0) / (goals?.storefronts_target || 5)) * 100} 
                      className="h-2" 
                    />
                    <div className="mt-2">
                      <Slider
                        value={[goals?.storefronts_target || 5]}
                        onValueChange={([v]) => updateGoals({ storefronts_target: v })}
                        min={1}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">{t.target}: {goals?.storefronts_target || 5}</p>
                    </div>
                  </div>

                  {/* Follow-ups Lead Measure */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">{t.followupsCompleted}</span>
                      </div>
                      <span className="text-sm font-bold">
                        {leadMeasures?.followupsCompleted || 0}/{goals?.followups_target || 10}
                      </span>
                    </div>
                    <Progress 
                      value={((leadMeasures?.followupsCompleted || 0) / (goals?.followups_target || 10)) * 100} 
                      className="h-2" 
                    />
                    <div className="mt-2">
                      <Slider
                        value={[goals?.followups_target || 10]}
                        onValueChange={([v]) => updateGoals({ followups_target: v })}
                        min={1}
                        max={30}
                        step={1}
                        className="mt-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">{t.target}: {goals?.followups_target || 10}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Cadence */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">{t.weeklyCommitments}</CardTitle>
              </div>
              <CardDescription>{t.commitToActions}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new commitment */}
              <div className="flex gap-2">
                <Input
                  placeholder={t.commitmentPlaceholder}
                  value={newCommitment}
                  onChange={(e) => setNewCommitment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCommitment.trim()) {
                      addCommitment(newCommitment);
                      setNewCommitment("");
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={() => {
                    if (newCommitment.trim()) {
                      addCommitment(newCommitment);
                      setNewCommitment("");
                    }
                  }}
                  disabled={!newCommitment.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* This week's commitments */}
              {commitments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.noCommitmentsYet}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{t.thisWeeksCommitments}</span>
                    <Badge variant="outline">
                      {commitments.filter(c => c.completed).length}/{commitments.length} {t.completedOf}
                    </Badge>
                  </div>
                  {commitments.map((commitment) => (
                    <div
                      key={commitment.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        commitment.completed 
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={commitment.completed}
                        onCheckedChange={(checked) => toggleCommitment(commitment.id, checked as boolean)}
                        className="shrink-0"
                      />
                      <span className={cn(
                        "flex-1 text-sm",
                        commitment.completed && "line-through text-muted-foreground"
                      )}>
                        {commitment.commitment}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCommitment(commitment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Last week's review */}
              {lastWeekCommitments.length > 0 && (
                <Collapsible open={showLastWeek} onOpenChange={setShowLastWeek}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-sm">{t.lastWeekResults}</span>
                      {showLastWeek ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      {lastWeekCommitments.filter(c => c.completed).length}/{lastWeekCommitments.length} {t.completedOf}
                    </div>
                    {lastWeekCommitments.map((commitment) => (
                      <div
                        key={commitment.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg text-sm",
                          commitment.completed 
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {commitment.completed ? (
                          <CheckCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        )}
                        <span className={commitment.completed ? "line-through" : ""}>
                          {commitment.commitment}
                        </span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>

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

          {/* Eisenhower Matrix */}
          <EisenhowerMatrix />

          {/* Instagram Ideas */}
          <InstagramIdeas />

          {/* Content Calendar */}
          <ContentCalendar />

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
