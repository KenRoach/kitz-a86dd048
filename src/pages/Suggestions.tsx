import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, ChevronUp, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  vote_count: number;
  has_voted: boolean;
}

export default function Suggestions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const t = {
    en: {
      title: "Suggestions",
      desc: "Share your ideas and vote on features you want to see.",
      newSuggestion: "New Suggestion",
      titleLabel: "Title",
      titlePlaceholder: "What feature would you like to see?",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Tell us more about your idea...",
      submit: "Submit",
      noSuggestions: "No suggestions yet",
      beFirst: "Be the first to suggest a feature!",
      votes: "votes",
      vote: "vote",
    },
    es: {
      title: "Sugerencias",
      desc: "Comparte tus ideas y vota por las funciones que quieres ver.",
      newSuggestion: "Nueva Sugerencia",
      titleLabel: "Título",
      titlePlaceholder: "¿Qué función te gustaría ver?",
      descriptionLabel: "Descripción",
      descriptionPlaceholder: "Cuéntanos más sobre tu idea...",
      submit: "Enviar",
      noSuggestions: "Sin sugerencias aún",
      beFirst: "¡Sé el primero en sugerir una función!",
      votes: "votos",
      vote: "voto",
    },
  };

  const texts = t[language];

  const fetchSuggestions = async () => {
    if (!user) return;
    
    try {
      // Fetch suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from("suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (suggestionsError) throw suggestionsError;

      // Fetch all votes
      const { data: votesData, error: votesError } = await supabase
        .from("suggestion_votes")
        .select("suggestion_id, user_id");

      if (votesError) throw votesError;

      // Process suggestions with vote counts
      const processedSuggestions: Suggestion[] = (suggestionsData || []).map((suggestion) => {
        const suggestionVotes = (votesData || []).filter(v => v.suggestion_id === suggestion.id);
        return {
          ...suggestion,
          vote_count: suggestionVotes.length,
          has_voted: suggestionVotes.some(v => v.user_id === user.id),
        };
      });

      // Sort by vote count (descending)
      processedSuggestions.sort((a, b) => b.vote_count - a.vote_count);

      setSuggestions(processedSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("suggestions").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success(language === "es" ? "¡Sugerencia enviada!" : "Suggestion submitted!");
      setTitle("");
      setDescription("");
      setDialogOpen(false);
      fetchSuggestions();
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error(language === "es" ? "Error al enviar" : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string, hasVoted: boolean) => {
    if (!user) return;

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from("suggestion_votes")
          .delete()
          .eq("suggestion_id", suggestionId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase.from("suggestion_votes").insert({
          suggestion_id: suggestionId,
          user_id: user.id,
        });

        if (error) throw error;
      }

      // Update local state optimistically
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? {
                ...s,
                vote_count: hasVoted ? s.vote_count - 1 : s.vote_count + 1,
                has_voted: !hasVoted,
              }
            : s
        ).sort((a, b) => b.vote_count - a.vote_count)
      );
    } catch (error) {
      console.error("Error voting:", error);
      toast.error(language === "es" ? "Error al votar" : "Failed to vote");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{texts.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{texts.desc}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {texts.newSuggestion}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{texts.newSuggestion}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.titleLabel}</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={texts.titlePlaceholder}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.descriptionLabel}</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={texts.descriptionPlaceholder}
                    rows={4}
                    maxLength={1000}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    texts.submit
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-foreground">{texts.noSuggestions}</h3>
              <p className="text-sm text-muted-foreground mt-1">{texts.beFirst}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Vote button */}
                    <button
                      onClick={() => handleVote(suggestion.id, suggestion.has_voted)}
                      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                        suggestion.has_voted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      <ChevronUp className="w-5 h-5" />
                      <span className="text-sm font-semibold">{suggestion.vote_count}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{suggestion.title}</h3>
                      {suggestion.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(suggestion.created_at), {
                          addSuffix: true,
                          locale: language === "es" ? es : enUS,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}