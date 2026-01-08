import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LayoutGrid, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SwotData {
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}

export function SwotAnalysis() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [swotData, setSwotData] = useState<SwotData>({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from localStorage
  const { isLoading } = useQuery({
    queryKey: ["swot-analysis", user?.id],
    queryFn: async () => {
      const stored = localStorage.getItem(`swot-analysis-${user?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSwotData(parsed);
        return parsed as SwotData;
      }
      return null;
    },
    enabled: !!user,
  });

  // Fetch profile for AI context
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("business_name, business_type")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SwotData) => {
      localStorage.setItem(`swot-analysis-${user?.id}`, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analysis", user?.id] });
      toast.success(language === "es" ? "Análisis guardado" : "Analysis saved");
    },
  });

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("business-advisor", {
        body: {
          message: `Generate a SWOT analysis for my ${profile?.business_type || "small"} business called "${profile?.business_name || "my business"}". 
            Return ONLY a JSON object with these exact keys: strengths, weaknesses, opportunities, threats. 
            Each value should be 2-3 bullet points as a single string with line breaks.
            Focus on practical, actionable insights for a small business or freelancer.`,
          language,
        },
      });

      if (response.error) throw response.error;

      // Try to parse JSON from response
      const text = response.data?.response || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSwotData({
          strengths: parsed.strengths || "",
          weaknesses: parsed.weaknesses || "",
          opportunities: parsed.opportunities || "",
          threats: parsed.threats || "",
        });
        toast.success(language === "es" ? "Análisis generado" : "Analysis generated");
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(language === "es" ? "Error al generar análisis" : "Failed to generate analysis");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(swotData);
  };

  const quadrants = [
    {
      key: "strengths" as const,
      label: language === "es" ? "Fortalezas" : "Strengths",
      emoji: "💪",
      color: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      placeholder: language === "es" 
        ? "¿Qué haces bien? ¿Qué te diferencia?" 
        : "What do you do well? What sets you apart?",
    },
    {
      key: "weaknesses" as const,
      label: language === "es" ? "Debilidades" : "Weaknesses",
      emoji: "🔧",
      color: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      placeholder: language === "es" 
        ? "¿Qué puedes mejorar? ¿Qué te falta?" 
        : "What can you improve? What do you lack?",
    },
    {
      key: "opportunities" as const,
      label: language === "es" ? "Oportunidades" : "Opportunities",
      emoji: "🚀",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      placeholder: language === "es" 
        ? "¿Qué tendencias puedes aprovechar?" 
        : "What trends can you capitalize on?",
    },
    {
      key: "threats" as const,
      label: language === "es" ? "Amenazas" : "Threats",
      emoji: "⚠️",
      color: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      placeholder: language === "es" 
        ? "¿Qué obstáculos enfrentas? ¿Qué hace tu competencia?" 
        : "What obstacles do you face? What is your competition doing?",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">
              {language === "es" ? "Análisis SWOT" : "SWOT Analysis"}
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {language === "es" ? "Generar con IA" : "Generate with AI"}
          </Button>
        </div>
        <CardDescription>
          {language === "es"
            ? "Evalúa fortalezas, debilidades, oportunidades y amenazas"
            : "Evaluate strengths, weaknesses, opportunities and threats"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quadrants.map((q) => (
            <div
              key={q.key}
              className={cn("rounded-lg border p-3 space-y-2", q.color)}
            >
              <div className="flex items-center gap-2">
                <span>{q.emoji}</span>
                <span className="text-sm font-medium">{q.label}</span>
              </div>
              <Textarea
                placeholder={q.placeholder}
                value={swotData[q.key]}
                onChange={(e) =>
                  setSwotData({ ...swotData, [q.key]: e.target.value })
                }
                rows={3}
                className="bg-background/50 border-0 resize-none text-sm"
              />
            </div>
          ))}
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
          {language === "es" ? "Guardar Análisis" : "Save Analysis"}
        </Button>
      </CardContent>
    </Card>
  );
}
