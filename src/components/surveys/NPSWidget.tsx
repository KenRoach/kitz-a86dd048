import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Meh, X, Check } from "lucide-react";

interface NPSWidgetProps {
  surveyId: string;
  title?: string;
  onComplete?: () => void;
  onDismiss?: () => void;
  language?: "en" | "es";
}

export function NPSWidget({ surveyId, title, onComplete, onDismiss, language = "en" }: NPSWidgetProps) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [step, setStep] = useState<"score" | "feedback" | "done">("score");
  const [submitting, setSubmitting] = useState(false);

  const handleScoreSelect = (value: number) => {
    setScore(value);
    setStep("feedback");
  };

  const handleSubmit = async () => {
    if (score === null || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("survey_responses").insert({
        survey_id: surveyId,
        user_id: user.id,
        nps_score: score,
        answers: { feedback },
      });

      if (error) throw error;

      setStep("done");
      toast.success(language === "es" ? "¡Gracias por tu feedback!" : "Thank you for your feedback!");
      onComplete?.();
    } catch (error) {
      console.error("Error submitting NPS:", error);
      toast.error(language === "es" ? "Error al enviar" : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (value: number) => {
    if (value <= 6) return "bg-red-100 hover:bg-red-200 text-red-700 border-red-200";
    if (value <= 8) return "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-200";
    return "bg-green-100 hover:bg-green-200 text-green-700 border-green-200";
  };

  const getScoreSelectedColor = (value: number) => {
    if (value <= 6) return "bg-red-500 text-white border-red-500";
    if (value <= 8) return "bg-yellow-500 text-white border-yellow-500";
    return "bg-green-500 text-white border-green-500";
  };

  if (step === "done") {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            {language === "es" ? "¡Gracias!" : "Thank you!"}
          </h3>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            {language === "es" 
              ? "Tu opinión nos ayuda a mejorar" 
              : "Your feedback helps us improve"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 w-6 h-6"
          onClick={onDismiss}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {title || (language === "es" 
            ? "¿Qué tan probable es que nos recomiendes?" 
            : "How likely are you to recommend us?")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === "score" && (
          <div className="space-y-3">
            <div className="flex gap-1 justify-center flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => handleScoreSelect(value)}
                  className={cn(
                    "w-8 h-8 rounded-lg border text-sm font-medium transition-all",
                    score === value ? getScoreSelectedColor(value) : getScoreColor(value)
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                {language === "es" ? "Poco probable" : "Not likely"}
              </span>
              <span className="flex items-center gap-1">
                {language === "es" ? "Muy probable" : "Very likely"}
                <ThumbsUp className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        {step === "feedback" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {score !== null && score <= 6 && <ThumbsDown className="w-4 h-4 text-red-500" />}
              {score !== null && score >= 7 && score <= 8 && <Meh className="w-4 h-4 text-yellow-500" />}
              {score !== null && score >= 9 && <ThumbsUp className="w-4 h-4 text-green-500" />}
              <span className="font-medium">
                {language === "es" ? `Calificación: ${score}/10` : `Score: ${score}/10`}
              </span>
            </div>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                score !== null && score <= 6
                  ? (language === "es" ? "¿Qué podemos mejorar?" : "What can we improve?")
                  : (language === "es" ? "¿Qué te gustó más?" : "What did you like the most?")
              }
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("score")}
              >
                {language === "es" ? "Volver" : "Back"}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting 
                  ? (language === "es" ? "Enviando..." : "Sending...") 
                  : (language === "es" ? "Enviar" : "Submit")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
