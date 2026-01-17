import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ConsultantContactCard, ConsultantContact } from "./ConsultantContactCard";
import { ConsultantContactPanel } from "./ConsultantContactPanel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConsultantKanbanProps {
  language?: "en" | "es";
  onAddContact?: () => void;
}

const FUNNEL_STAGES = [
  { 
    id: "atraccion", 
    label: "Atracción", 
    labelEn: "Attraction",
    color: "bg-blue-500",
    description: "Primer contacto",
    descriptionEn: "First contact"
  },
  { 
    id: "nutricion", 
    label: "Nutrición", 
    labelEn: "Nurturing",
    color: "bg-amber-500",
    description: "Construyendo relación",
    descriptionEn: "Building relationship"
  },
  { 
    id: "conversacion", 
    label: "Conversación", 
    labelEn: "Conversation",
    color: "bg-purple-500",
    description: "Diálogo activo",
    descriptionEn: "Active dialogue"
  },
  { 
    id: "retencion", 
    label: "Retención", 
    labelEn: "Retention",
    color: "bg-emerald-500",
    description: "Cliente confirmado",
    descriptionEn: "Confirmed client"
  },
];

export function ConsultantKanban({ language = "es", onAddContact }: ConsultantKanbanProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<ConsultantContact | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["consultant-contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consultant_contacts")
        .select("*")
        .order("last_interaction", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as ConsultantContact[];
    },
    enabled: !!user,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const updates: Record<string, unknown> = {
        funnel_stage: stage,
        stage_entered_at: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
      };

      // Auto-mark high attention for conversacion
      if (stage === "conversacion") {
        updates.is_high_attention = true;
      }

      const { error } = await supabase
        .from("consultant_contacts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
      toast.success(language === "es" ? "Etapa actualizada" : "Stage updated");
    },
  });

  const getContactsByStage = (stageId: string) => {
    return contacts.filter(c => c.funnel_stage === stageId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FUNNEL_STAGES.map(stage => (
          <div key={stage.id} className="bg-muted/30 rounded-2xl p-4 min-h-[300px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FUNNEL_STAGES.map(stage => {
          const stageContacts = getContactsByStage(stage.id);
          return (
            <div 
              key={stage.id} 
              className="bg-muted/20 rounded-2xl p-3 min-h-[300px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                  <div>
                    <h3 className="font-medium text-sm text-foreground">
                      {language === "es" ? stage.label : stage.labelEn}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {language === "es" ? stage.description : stage.descriptionEn}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {stageContacts.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                {stageContacts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {language === "es" ? "Sin contactos" : "No contacts"}
                  </div>
                ) : (
                  stageContacts.map(contact => (
                    <ConsultantContactCard
                      key={contact.id}
                      contact={contact}
                      language={language}
                      onClick={() => setSelectedContact(contact)}
                    />
                  ))
                )}
              </div>

              {/* Add button for atraccion */}
              {stage.id === "atraccion" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 w-full text-xs"
                  onClick={onAddContact}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === "es" ? "Agregar" : "Add"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Detail Panel */}
      {selectedContact && (
        <ConsultantContactPanel
          contact={selectedContact}
          language={language}
          onClose={() => setSelectedContact(null)}
          onStageChange={(stage) => {
            updateStageMutation.mutate({ id: selectedContact.id, stage });
            setSelectedContact(null);
          }}
        />
      )}
    </>
  );
}
