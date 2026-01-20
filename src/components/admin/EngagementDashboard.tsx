import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { format } from "date-fns";
import { StarRating } from "@/components/feedback/StarRating";
import {
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Users,
  TrendingUp,
  Plus,
  Send,
  Star,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

interface NPSMetrics {
  promoters: number;
  passives: number;
  detractors: number;
  total_responses: number;
  nps_score: number;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  buyer_name: string | null;
  created_at: string;
  storefront_id: string | null;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  is_active: boolean;
  created_at: string;
}

export function EngagementDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [npsMetrics, setNpsMetrics] = useState<NPSMetrics | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);
  
  // Create survey dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    survey_type: "nps",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadNPSMetrics(),
      loadFeedback(),
      loadSurveys(),
    ]);
    setLoading(false);
  };

  const loadNPSMetrics = async () => {
    const { data, error } = await supabase
      .from("survey_responses")
      .select("nps_score")
      .not("nps_score", "is", null);

    if (!error && data) {
      const promoters = data.filter((r) => r.nps_score >= 9).length;
      const passives = data.filter((r) => r.nps_score >= 7 && r.nps_score <= 8).length;
      const detractors = data.filter((r) => r.nps_score <= 6).length;
      const total = data.length;
      const nps = total > 0 
        ? Math.round((promoters / total * 100) - (detractors / total * 100)) 
        : 0;

      setNpsMetrics({
        promoters,
        passives,
        detractors,
        total_responses: total,
        nps_score: nps,
      });
    }
  };

  const loadFeedback = async () => {
    const { data, error } = await supabase
      .from("customer_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setFeedbackList(data);
      setTotalFeedback(data.length);
      if (data.length > 0) {
        const avg = data.reduce((sum, f) => sum + f.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    }
  };

  const loadSurveys = async () => {
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSurveys(data);
    }
  };

  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim() || !user) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("surveys").insert({
        title: newSurvey.title,
        description: newSurvey.description || null,
        survey_type: newSurvey.survey_type,
        created_by: user.id,
        questions: newSurvey.survey_type === "nps" ? [
          { type: "nps", question: "How likely are you to recommend us?" }
        ] : [],
      });

      if (error) throw error;

      toast.success(language === "es" ? "Encuesta creada" : "Survey created");
      setCreateDialogOpen(false);
      setNewSurvey({ title: "", description: "", survey_type: "nps" });
      loadSurveys();
    } catch (error) {
      console.error("Error creating survey:", error);
      toast.error(language === "es" ? "Error al crear" : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const toggleSurveyActive = async (surveyId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("surveys")
      .update({ is_active: !isActive })
      .eq("id", surveyId);

    if (!error) {
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, is_active: !isActive } : s))
      );
      toast.success(
        isActive
          ? (language === "es" ? "Encuesta pausada" : "Survey paused")
          : (language === "es" ? "Encuesta activada" : "Survey activated")
      );
    }
  };

  const getNPSColor = (score: number) => {
    if (score >= 50) return "text-green-600";
    if (score >= 0) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">NPS Score</p>
                <p className={`text-2xl font-bold ${getNPSColor(npsMetrics?.nps_score || 0)}`}>
                  {npsMetrics?.nps_score || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Promotores" : "Promoters"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {npsMetrics?.promoters || 0}
                </p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Calificación" : "Avg Rating"}
                </p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "es" ? "Feedback Total" : "Total Feedback"}
                </p>
                <p className="text-2xl font-bold">{totalFeedback}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback" className="gap-1">
            <Star className="w-3 h-3" />
            {language === "es" ? "Feedback" : "Feedback"}
          </TabsTrigger>
          <TabsTrigger value="surveys" className="gap-1">
            <ClipboardList className="w-3 h-3" />
            {language === "es" ? "Encuestas" : "Surveys"}
          </TabsTrigger>
          <TabsTrigger value="nps" className="gap-1">
            <BarChart3 className="w-3 h-3" />
            NPS
          </TabsTrigger>
        </TabsList>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {language === "es" ? "Comentarios recientes" : "Recent Feedback"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-3 h-3 mr-1" />
                {language === "es" ? "Actualizar" : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {feedbackList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === "es" ? "Sin feedback aún" : "No feedback yet"}
                    </p>
                  ) : (
                    feedbackList.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <StarRating value={item.rating} readonly size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-muted-foreground mb-1">
                            "{item.comment}"
                          </p>
                        )}
                        {item.buyer_name && (
                          <p className="text-xs text-muted-foreground">
                            — {item.buyer_name}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surveys Tab */}
        <TabsContent value="surveys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {language === "es" ? "Encuestas" : "Surveys"}
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="w-3 h-3" />
                    {language === "es" ? "Nueva" : "New"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === "es" ? "Crear encuesta" : "Create Survey"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === "es" ? "Título" : "Title"}</Label>
                      <Input
                        value={newSurvey.title}
                        onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                        placeholder={language === "es" ? "Encuesta de satisfacción" : "Customer satisfaction survey"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "es" ? "Descripción" : "Description"}</Label>
                      <Textarea
                        value={newSurvey.description}
                        onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                        placeholder={language === "es" ? "Opcional" : "Optional"}
                      />
                    </div>
                    <Button onClick={handleCreateSurvey} disabled={creating} className="w-full">
                      {creating 
                        ? (language === "es" ? "Creando..." : "Creating...") 
                        : (language === "es" ? "Crear encuesta" : "Create Survey")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {surveys.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === "es" ? "Sin encuestas aún" : "No surveys yet"}
                    </p>
                  ) : (
                    surveys.map((survey) => (
                      <div key={survey.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{survey.title}</h4>
                            {survey.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {survey.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={survey.is_active ? "default" : "secondary"}>
                              {survey.is_active 
                                ? (language === "es" ? "Activa" : "Active") 
                                : (language === "es" ? "Pausada" : "Paused")}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSurveyActive(survey.id, survey.is_active)}
                            >
                              {survey.is_active 
                                ? (language === "es" ? "Pausar" : "Pause") 
                                : (language === "es" ? "Activar" : "Activate")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NPS Tab */}
        <TabsContent value="nps">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">NPS Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">Net Promoter Score</p>
                  <p className={`text-5xl font-bold ${getNPSColor(npsMetrics?.nps_score || 0)}`}>
                    {npsMetrics?.nps_score || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {npsMetrics?.total_responses || 0} {language === "es" ? "respuestas" : "responses"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <p className="text-2xl font-bold text-green-600">
                      {npsMetrics?.promoters || 0}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      {language === "es" ? "Promotores" : "Promoters"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">9-10</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                    <p className="text-2xl font-bold text-yellow-600">
                      {npsMetrics?.passives || 0}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      {language === "es" ? "Pasivos" : "Passives"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">7-8</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <p className="text-2xl font-bold text-red-600">
                      {npsMetrics?.detractors || 0}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      {language === "es" ? "Detractores" : "Detractors"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">0-6</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
