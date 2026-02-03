import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";

interface FeedbackFormProps {
  /** storefrontId is REQUIRED – feedback is only allowed for paid storefronts */
  storefrontId: string;
  sellerId: string;
  onSuccess?: () => void;
  language?: "en" | "es";
}

export function FeedbackForm({ storefrontId, sellerId, onSuccess, language = "en" }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error(language === "es" ? "Por favor selecciona una calificación" : "Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("customer_feedback").insert({
        storefront_id: storefrontId,
        seller_id: sellerId,
        buyer_name: buyerName || null,
        rating,
        comment: comment || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success(language === "es" ? "¡Gracias por tu feedback!" : "Thank you for your feedback!");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(language === "es" ? "Error al enviar feedback" : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            {language === "es" ? "¡Feedback recibido!" : "Feedback received!"}
          </h3>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            {language === "es" 
              ? "Tu opinión nos ayuda a mejorar" 
              : "Your opinion helps us improve"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {language === "es" ? "Déjanos tu opinión" : "Leave your feedback"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{language === "es" ? "Calificación" : "Rating"} *</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyerName">{language === "es" ? "Tu nombre" : "Your name"}</Label>
            <Input
              id="buyerName"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={language === "es" ? "Opcional" : "Optional"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{language === "es" ? "Comentario" : "Comment"}</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === "es" ? "Cuéntanos tu experiencia..." : "Tell us about your experience..."}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0} className="w-full gap-2">
            <Send className="w-4 h-4" />
            {submitting 
              ? (language === "es" ? "Enviando..." : "Sending...") 
              : (language === "es" ? "Enviar feedback" : "Send feedback")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
