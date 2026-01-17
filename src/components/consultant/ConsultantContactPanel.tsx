import { useState } from "react";
import { ConsultantContact } from "./ConsultantContactCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, Phone, Mail, MessageSquare, Clock, Calendar, 
  ChevronRight, Check, Send
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GoogleCalendarConnect } from "./GoogleCalendarConnect";
import { CalendarInviteDialog } from "./CalendarInviteDialog";
interface ConsultantContactPanelProps {
  contact: ConsultantContact;
  language?: "en" | "es";
  onClose: () => void;
  onStageChange: (stage: string) => void;
}

const STAGES = [
  { id: "atraccion", label: "Atracción", labelEn: "Attraction" },
  { id: "nutricion", label: "Nutrición", labelEn: "Nurturing" },
  { id: "conversacion", label: "Conversación", labelEn: "Conversation" },
  { id: "retencion", label: "Retención", labelEn: "Retention" },
];

export function ConsultantContactPanel({ 
  contact, 
  language = "es", 
  onClose, 
  onStageChange 
}: ConsultantContactPanelProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(contact.notes || "");
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [showCalendarInvite, setShowCalendarInvite] = useState(false);
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<ConsultantContact>) => {
      const { error } = await supabase
        .from("consultant_contacts")
        .update({ ...updates, last_interaction: new Date().toISOString() })
        .eq("id", contact.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
      toast.success(language === "es" ? "Actualizado" : "Updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("consultant_contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
      toast.success(language === "es" ? "Contacto eliminado" : "Contact deleted");
      onClose();
    },
  });

  const timeInStage = formatDistanceToNow(new Date(contact.stage_entered_at), {
    addSuffix: false,
    locale: language === "es" ? es : undefined,
  });

  const handleWhatsApp = () => {
    if (contact.phone) {
      const phone = contact.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
      updateMutation.mutate({});
    }
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ notes });
  };

  const currentStageIndex = STAGES.findIndex(s => s.id === contact.funnel_stage);
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-foreground/20 z-40" 
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold">{contact.name}</h2>
              <p className="text-xs text-muted-foreground capitalize">{contact.source}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Contact Actions */}
          <div className="flex gap-2">
            {contact.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={handleWhatsApp}
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                WhatsApp
              </Button>
            )}
            {contact.email && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
              >
                <Mail className="w-4 h-4 text-blue-500" />
                Email
              </Button>
            )}
            {contact.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => window.open(`tel:${contact.phone}`, "_blank")}
              >
                <Phone className="w-4 h-4" />
                {language === "es" ? "Llamar" : "Call"}
              </Button>
            )}
          </div>

          {/* Stage Info */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {language === "es" ? "Etapa actual" : "Current stage"}
              </span>
              <span className="font-medium text-sm capitalize">
                {STAGES.find(s => s.id === contact.funnel_stage)?.[language === "es" ? "label" : "labelEn"]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {language === "es" ? "Tiempo en etapa" : "Time in stage"}
              </span>
              <span className="font-medium text-sm">{timeInStage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {language === "es" ? "Creado" : "Created"}
              </span>
              <span className="text-sm">
                {format(new Date(contact.created_at), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
              </span>
            </div>
          </div>

          {/* Move to Next Stage */}
          {nextStage && (
            <Button 
              className="w-full gap-2" 
              onClick={() => onStageChange(nextStage.id)}
            >
              {language === "es" ? "Mover a" : "Move to"} {language === "es" ? nextStage.label : nextStage.labelEn}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* Payment Actions for Conversacion */}
          {contact.funnel_stage === "conversacion" && !contact.paid_at && (
            <div className="bg-action/5 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                💰 {language === "es" ? "Acciones de pago" : "Payment Actions"}
              </h4>
              {!contact.payment_pending ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => updateMutation.mutate({ payment_pending: true })}
                >
                  <Send className="w-4 h-4" />
                  {language === "es" ? "Marcar enlace enviado" : "Mark link sent"}
                </Button>
              ) : (
                <Button 
                  className="w-full gap-2"
                  onClick={() => {
                    updateMutation.mutate({ paid_at: new Date().toISOString(), payment_pending: false });
                    onStageChange("retencion");
                  }}
                >
                  <Check className="w-4 h-4" />
                  {language === "es" ? "Confirmar pago recibido" : "Confirm payment received"}
                </Button>
              )}
            </div>
          )}

          {/* Retention Actions */}
          {contact.funnel_stage === "retencion" && (
            <div className="bg-emerald-500/5 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                ✓ {language === "es" ? "Cliente confirmado" : "Confirmed Client"}
              </h4>
              
              {/* Google Calendar Connection */}
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">
                  Google Calendar
                </span>
                <GoogleCalendarConnect 
                  language={language} 
                  onConnectionChange={setIsCalendarConnected}
                />
              </div>
              
              {!contact.attendance_confirmed ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => updateMutation.mutate({ attendance_confirmed: true })}
                >
                  <Check className="w-4 h-4" />
                  {language === "es" ? "Confirmar asistencia" : "Confirm attendance"}
                </Button>
              ) : (
                <p className="text-sm text-emerald-600 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {language === "es" ? "Asistencia confirmada" : "Attendance confirmed"}
                </p>
              )}
              
              {/* Calendar Invite Button */}
              {!contact.calendar_reminder_sent ? (
                <Button 
                  variant={isCalendarConnected ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-2"
                  disabled={!isCalendarConnected}
                  onClick={() => setShowCalendarInvite(true)}
                >
                  <Calendar className="w-4 h-4" />
                  {language === "es" ? "Enviar invitación de calendario" : "Send calendar invite"}
                </Button>
              ) : (
                <p className="text-sm text-emerald-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === "es" ? "Invitación enviada" : "Invite sent"}
                </p>
              )}
              
              {!isCalendarConnected && (
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "Conecta tu Google Calendar para enviar invitaciones automáticas"
                    : "Connect your Google Calendar to send automatic invites"}
                </p>
              )}
            </div>
          )}
          
          {/* Calendar Invite Dialog */}
          <CalendarInviteDialog
            open={showCalendarInvite}
            onOpenChange={setShowCalendarInvite}
            contact={{
              id: contact.id,
              name: contact.name,
              email: contact.email,
            }}
            language={language}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
            }}
          />

          {/* Notes */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Notas" : "Notes"}
            </h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === "es" ? "Agregar notas sobre este contacto..." : "Add notes about this contact..."}
              className="min-h-[100px] text-sm"
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSaveNotes}
              disabled={notes === contact.notes}
            >
              {language === "es" ? "Guardar notas" : "Save notes"}
            </Button>
          </div>

          {/* Manual Stage Selection */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Mover a etapa" : "Move to stage"}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(stage => (
                <Button
                  key={stage.id}
                  variant={contact.funnel_stage === stage.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  disabled={contact.funnel_stage === stage.id}
                  onClick={() => onStageChange(stage.id)}
                >
                  {language === "es" ? stage.label : stage.labelEn}
                </Button>
              ))}
            </div>
          </div>

          {/* Delete */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(language === "es" ? "¿Eliminar este contacto?" : "Delete this contact?")) {
                deleteMutation.mutate();
              }
            }}
          >
            {language === "es" ? "Eliminar contacto" : "Delete contact"}
          </Button>
        </div>
      </div>
    </>
  );
}
