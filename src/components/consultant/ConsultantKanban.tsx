import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ConsultantContactCard, ConsultantContact } from "./ConsultantContactCard";
import { ConsultantContactPanel } from "./ConsultantContactPanel";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    description: "Primer contacto",
    descriptionEn: "First contact"
  },
  { 
    id: "nutricion", 
    label: "Nutrición", 
    labelEn: "Nurturing",
    color: "bg-consultant-cta",
    bgColor: "bg-consultant-cta/10",
    borderColor: "border-consultant-cta/20",
    description: "Construyendo relación",
    descriptionEn: "Building relationship"
  },
  { 
    id: "conversacion", 
    label: "Conversación", 
    labelEn: "Conversation",
    color: "bg-consultant-accent",
    bgColor: "bg-consultant-accent/10",
    borderColor: "border-consultant-accent/20",
    description: "Diálogo activo",
    descriptionEn: "Active dialogue"
  },
  { 
    id: "retencion", 
    label: "Retención", 
    labelEn: "Retention",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    description: "Cliente confirmado",
    descriptionEn: "Confirmed client"
  },
];

export function ConsultantKanban({ language = "es", onAddContact }: ConsultantKanbanProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<ConsultantContact | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const scrollToStage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const stageWidth = container.offsetWidth;
      container.scrollTo({
        left: index * stageWidth,
        behavior: "smooth"
      });
      setActiveStageIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const stageWidth = container.offsetWidth;
      const newIndex = Math.round(container.scrollLeft / stageWidth);
      if (newIndex !== activeStageIndex && newIndex >= 0 && newIndex < FUNNEL_STAGES.length) {
        setActiveStageIndex(newIndex);
      }
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FUNNEL_STAGES.map(stage => (
            <div key={stage.id} className="bg-muted/30 rounded-2xl p-4 min-h-[300px] animate-pulse" />
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="sm:hidden bg-muted/30 rounded-2xl p-4 min-h-[400px] animate-pulse" />
      </>
    );
  }

  return (
    <>
      {/* Mobile: Swipeable single column view */}
      <div className="sm:hidden space-y-3">
        {/* Stage indicator dots + navigation */}
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-consultant-muted hover:text-consultant-header"
            onClick={() => scrollToStage(Math.max(0, activeStageIndex - 1))}
            disabled={activeStageIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            {FUNNEL_STAGES.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => scrollToStage(index)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all",
                  index === activeStageIndex
                    ? "bg-consultant-header text-consultant-section"
                    : "bg-consultant-section-alt text-consultant-muted"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                {index === activeStageIndex && (
                  <span className="text-xs font-medium">
                    {language === "es" ? stage.label : stage.labelEn}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-consultant-muted hover:text-consultant-header"
            onClick={() => scrollToStage(Math.min(FUNNEL_STAGES.length - 1, activeStageIndex + 1))}
            disabled={activeStageIndex === FUNNEL_STAGES.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Swipeable container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FUNNEL_STAGES.map((stage, index) => {
            const stageContacts = getContactsByStage(stage.id);
            return (
              <div 
                key={stage.id}
                className="flex-none w-full snap-center pr-4 last:pr-0"
              >
                <div className={cn("rounded-2xl p-4 min-h-[400px] flex flex-col border", stage.bgColor, stage.borderColor)}>
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                      <div>
                        <h3 className="font-semibold text-consultant-header">
                          {language === "es" ? stage.label : stage.labelEn}
                        </h3>
                        <p className="text-xs text-consultant-muted">
                          {language === "es" ? stage.description : stage.descriptionEn}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-consultant-header bg-consultant-section px-2.5 py-1 rounded-full border border-consultant-accent/20">
                      {stageContacts.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[350px]">
                    {stageContacts.length === 0 ? (
                      <div className="text-center py-12 text-sm text-consultant-muted">
                        <p className="mb-2">{language === "es" ? "Sin contactos" : "No contacts"}</p>
                        {stage.id === "atraccion" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={onAddContact}
                            className="border-consultant-cta text-consultant-cta hover:bg-consultant-cta/10"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {language === "es" ? "Agregar" : "Add"}
                          </Button>
                        )}
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

                  {/* Add button for atraccion with contacts */}
                  {stage.id === "atraccion" && stageContacts.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full text-consultant-cta hover:bg-consultant-cta/10"
                      onClick={onAddContact}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {language === "es" ? "Agregar contacto" : "Add contact"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Swipe hint - only show briefly */}
        <p className="text-center text-xs text-consultant-muted">
          {language === "es" ? "← Desliza para cambiar etapa →" : "← Swipe to change stage →"}
        </p>
      </div>

      {/* Desktop: Grid view */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FUNNEL_STAGES.map(stage => {
          const stageContacts = getContactsByStage(stage.id);
          return (
            <div 
              key={stage.id} 
              className={cn("rounded-2xl p-3 min-h-[300px] flex flex-col border", stage.bgColor, stage.borderColor)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                  <div>
                    <h3 className="font-medium text-sm text-consultant-header">
                      {language === "es" ? stage.label : stage.labelEn}
                    </h3>
                    <p className="text-[10px] text-consultant-muted">
                      {language === "es" ? stage.description : stage.descriptionEn}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-consultant-header bg-consultant-section px-2 py-0.5 rounded-full border border-consultant-accent/20">
                  {stageContacts.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                {stageContacts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-consultant-muted">
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
                  className="mt-2 w-full text-xs text-consultant-cta hover:bg-consultant-cta/10"
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
