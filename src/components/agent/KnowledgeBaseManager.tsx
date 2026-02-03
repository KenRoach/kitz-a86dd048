import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, BookOpen, Search, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface KnowledgeBaseManagerProps {
  language: string;
}

interface KBEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  usage_count: number;
}

export function KnowledgeBaseManager({ language }: KnowledgeBaseManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newEntry, setNewEntry] = useState({
    category: "general",
    question: "",
    answer: "",
    keywords: "",
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["knowledge-base", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as KBEntry[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (entry: typeof newEntry) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("knowledge_base").insert({
        user_id: user.id,
        category: entry.category,
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords.split(",").map(k => k.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      setIsAddOpen(false);
      setNewEntry({ category: "general", question: "", answer: "", keywords: "" });
      toast.success(language === "es" ? "Entrada añadida" : "Entry added");
    },
    onError: () => {
      toast.error(language === "es" ? "Error al añadir" : "Failed to add");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success(language === "es" ? "Eliminado" : "Deleted");
    },
  });

  const filteredEntries = entries.filter(e => 
    e.question.toLowerCase().includes(search.toLowerCase()) ||
    e.answer.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(entries.map(e => e.category))];

  const t = {
    title: language === "es" ? "Base de Conocimiento" : "Knowledge Base",
    subtitle: language === "es" 
      ? "FAQs y respuestas para el agente de soporte" 
      : "FAQs and answers for the support agent",
    add: language === "es" ? "Añadir Entrada" : "Add Entry",
    search: language === "es" ? "Buscar..." : "Search...",
    question: language === "es" ? "Pregunta" : "Question",
    answer: language === "es" ? "Respuesta" : "Answer",
    category: language === "es" ? "Categoría" : "Category",
    keywords: language === "es" ? "Palabras clave (separadas por coma)" : "Keywords (comma separated)",
    save: language === "es" ? "Guardar" : "Save",
    empty: language === "es" 
      ? "No hay entradas. Añade FAQs para que el agente pueda responder preguntas." 
      : "No entries. Add FAQs so the agent can answer questions.",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t.add}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.add}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">{t.category}</label>
                  <Input
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                    placeholder="general, payments, shipping..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.question}</label>
                  <Textarea
                    value={newEntry.question}
                    onChange={(e) => setNewEntry({ ...newEntry, question: e.target.value })}
                    placeholder={language === "es" ? "¿Cuáles son los métodos de pago?" : "What payment methods do you accept?"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.answer}</label>
                  <Textarea
                    value={newEntry.answer}
                    onChange={(e) => setNewEntry({ ...newEntry, answer: e.target.value })}
                    rows={4}
                    placeholder={language === "es" ? "Aceptamos Yappy, tarjetas, efectivo..." : "We accept Yappy, cards, cash..."}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.keywords}</label>
                  <Input
                    value={newEntry.keywords}
                    onChange={(e) => setNewEntry({ ...newEntry, keywords: e.target.value })}
                    placeholder="pago, tarjeta, yappy"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => addMutation.mutate(newEntry)}
                  disabled={!newEntry.question || !newEntry.answer || addMutation.isPending}
                >
                  {t.save}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="pl-9"
          />
        </div>

        {/* Category badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <Badge 
                key={cat} 
                variant="outline" 
                className="cursor-pointer"
                onClick={() => setSearch(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-auto">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {entry.category}
                      </Badge>
                      {entry.usage_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {language === "es" ? `Usado ${entry.usage_count}x` : `Used ${entry.usage_count}x`}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{entry.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.answer}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
