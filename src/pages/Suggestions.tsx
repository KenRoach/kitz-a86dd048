import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, ChevronUp, MessageSquare, Loader2, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  vote_count: number;
  has_voted: boolean;
  comments: Comment[];
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
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

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
      comments: "comments",
      comment: "comment",
      addComment: "Add a comment...",
      noComments: "No comments yet. Be the first to share your thoughts!",
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
      comments: "comentarios",
      comment: "comentario",
      addComment: "Añade un comentario...",
      noComments: "Sin comentarios aún. ¡Sé el primero en compartir tus ideas!",
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

      // Fetch all comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("suggestion_comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Process suggestions with vote counts and comments
      const processedSuggestions: Suggestion[] = (suggestionsData || []).map((suggestion) => {
        const suggestionVotes = (votesData || []).filter(v => v.suggestion_id === suggestion.id);
        const suggestionComments = (commentsData || []).filter(c => c.suggestion_id === suggestion.id);
        return {
          ...suggestion,
          vote_count: suggestionVotes.length,
          has_voted: suggestionVotes.some(v => v.user_id === user.id),
          comments: suggestionComments,
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
        const { error } = await supabase
          .from("suggestion_votes")
          .delete()
          .eq("suggestion_id", suggestionId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("suggestion_votes").insert({
          suggestion_id: suggestionId,
          user_id: user.id,
        });

        if (error) throw error;
      }

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

  const handleAddComment = async (suggestionId: string) => {
    if (!user) return;
    
    const content = commentInputs[suggestionId]?.trim();
    if (!content) return;

    setSubmittingComment(suggestionId);
    try {
      const { data, error } = await supabase
        .from("suggestion_comments")
        .insert({
          suggestion_id: suggestionId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? { ...s, comments: [...s.comments, data] }
            : s
        )
      );
      setCommentInputs(prev => ({ ...prev, [suggestionId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(language === "es" ? "Error al comentar" : "Failed to add comment");
    } finally {
      setSubmittingComment(null);
    }
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
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
            {suggestions.map((suggestion) => {
              const isExpanded = expandedSuggestions.has(suggestion.id);
              const commentCount = suggestion.comments.length;

              return (
                <Card key={suggestion.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Vote button */}
                      <button
                        onClick={() => handleVote(suggestion.id, suggestion.has_voted)}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px] shrink-0 ${
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
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(suggestion.created_at), {
                              addSuffix: true,
                              locale: language === "es" ? es : enUS,
                            })}
                          </p>
                          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(suggestion.id)}>
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>
                                  {commentCount} {commentCount === 1 ? texts.comment : texts.comments}
                                </span>
                              </button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </div>

                        {/* Comments Section */}
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="mt-4 space-y-3">
                            <div className="border-t pt-3 space-y-3">
                              {suggestion.comments.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                  {texts.noComments}
                                </p>
                              ) : (
                                suggestion.comments.map((comment) => (
                                  <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-sm text-foreground">{comment.content}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDistanceToNow(new Date(comment.created_at), {
                                        addSuffix: true,
                                        locale: language === "es" ? es : enUS,
                                      })}
                                    </p>
                                  </div>
                                ))
                              )}

                              {/* Add comment input */}
                              <div className="flex gap-2">
                                <Input
                                  value={commentInputs[suggestion.id] || ""}
                                  onChange={(e) =>
                                    setCommentInputs(prev => ({
                                      ...prev,
                                      [suggestion.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={texts.addComment}
                                  maxLength={500}
                                  className="text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(suggestion.id);
                                    }
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleAddComment(suggestion.id)}
                                  disabled={
                                    !commentInputs[suggestion.id]?.trim() ||
                                    submittingComment === suggestion.id
                                  }
                                >
                                  {submittingComment === suggestion.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}