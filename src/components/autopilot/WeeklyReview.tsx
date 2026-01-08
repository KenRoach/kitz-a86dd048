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
  highlights: string;
  lowlights: string;
  next_step: string;
}

export function WeeklyReview() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formData, setFormData] = useState<WeeklyReviewData>({
    highlights: "",
    lowlights: "",
    next_step: "",
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
      setFormData({ highlights: "", lowlights: "", next_step: "" });
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
              ✨ {language === "es" ? "Highlights" : "Highlights"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Qué salió bien esta semana?" 
                : "What went well this week?"}
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              ⚠️ {language === "es" ? "Lowlights" : "Lowlights"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Qué no salió como esperabas?" 
                : "What didn't go as expected?"}
              value={formData.lowlights}
              onChange={(e) => setFormData({ ...formData, lowlights: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              🎯 {language === "es" ? "Próximo Paso" : "Next Step"}
            </Label>
            <Textarea
              placeholder={language === "es" 
                ? "¿Cuál es tu próximo paso más importante?" 
                : "What's your most important next step?"}
              value={formData.next_step}
              onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
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
