import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { ClipboardList, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface WeeklyReviewData {
  wins: string;
  lessons: string;
  next_week: string;
  gratitude: string;
}

export function WeeklyReview() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formData, setFormData] = useState<WeeklyReviewData>({
    wins: "",
    lessons: "",
    next_week: "",
    gratitude: "",
  });

  const weekKey = format(selectedWeek, "yyyy-MM-dd");

  // For now, store in localStorage as we don't have a dedicated table
  const { data: savedReview, isLoading } = useQuery({
    queryKey: ["weekly-review", user?.id, weekKey],
    queryFn: async () => {
      const stored = localStorage.getItem(`weekly-review-${user?.id}-${weekKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFormData(parsed);
        return parsed as WeeklyReviewData;
      }
      setFormData({ wins: "", lessons: "", next_week: "", gratitude: "" });
      return null;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: WeeklyReviewData) => {
      localStorage.setItem(`weekly-review-${user?.id}-${weekKey}`, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-review", user?.id, weekKey] });
      toast.success(language === "es" ? "Revisión guardada" : "Review saved");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const goToPreviousWeek = () => setSelectedWeek(subWeeks(selectedWeek, 1));
  const goToNextWeek = () => setSelectedWeek(addWeeks(selectedWeek, 1));

  const isCurrentWeek = format(selectedWeek, "yyyy-MM-dd") === format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">
            {language === "es" ? "Revisión Semanal" : "Weekly Review"}
          </CardTitle>
        </div>
        <CardDescription>
          {language === "es"
            ? "Reflexiona sobre tu semana y planifica la próxima"
            : "Reflect on your week and plan ahead"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <Badge variant={isCurrentWeek ? "default" : "outline"}>
              {isCurrentWeek
                ? language === "es" ? "Esta Semana" : "This Week"
                : format(selectedWeek, "MMM d", { locale: language === "es" ? es : undefined })}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {format(selectedWeek, "PPP", { locale: language === "es" ? es : undefined })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextWeek} disabled={isCurrentWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Review Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              🏆 {language === "es" ? "Victorias de la Semana" : "Wins This Week"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Qué lograste? ¿Qué salió bien?" 
                : "What did you accomplish? What went well?"}
              value={formData.wins}
              onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              📚 {language === "es" ? "Lecciones Aprendidas" : "Lessons Learned"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Qué aprendiste? ¿Qué harías diferente?" 
                : "What did you learn? What would you do differently?"}
              value={formData.lessons}
              onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              🎯 {language === "es" ? "Enfoque de la Próxima Semana" : "Next Week Focus"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Cuáles son tus 3 prioridades principales?" 
                : "What are your top 3 priorities?"}
              value={formData.next_week}
              onChange={(e) => setFormData({ ...formData, next_week: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              🙏 {language === "es" ? "Gratitud" : "Gratitude"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Por qué estás agradecido esta semana?" 
                : "What are you grateful for this week?"}
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          className="w-full gap-2"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {language === "es" ? "Guardar Revisión" : "Save Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
