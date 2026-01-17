import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface CalendarInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  language?: string;
  onSuccess?: () => void;
}

export function CalendarInviteDialog({
  open,
  onOpenChange,
  contact,
  language = "es",
  onSuccess,
}: CalendarInviteDialogProps) {
  const isSpanish = language === "es";
  const [isLoading, setIsLoading] = useState(false);
  const [eventDate, setEventDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("10:00");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const handleSend = async () => {
    if (!contact) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-calendar-event", {
        body: {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          eventDate,
          eventTime,
          eventTitle: eventTitle || (isSpanish ? `Reunión con ${contact.name}` : `Meeting with ${contact.name}`),
          eventDescription: eventDescription || (isSpanish ? `Reunión de seguimiento` : `Follow-up meeting`),
        },
      });

      if (error) throw error;

      toast.success(
        isSpanish 
          ? `Invitación enviada a ${contact.name}` 
          : `Invite sent to ${contact.name}`,
        {
          description: data.eventLink ? (
            <a href={data.eventLink} target="_blank" rel="noopener noreferrer" className="underline">
              {isSpanish ? "Ver en Google Calendar" : "View in Google Calendar"}
            </a>
          ) : undefined
        }
      );
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
      setEventTime("10:00");
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || (isSpanish ? "Error al crear evento" : "Error creating event"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isSpanish ? "Enviar invitación de calendario" : "Send Calendar Invite"}
          </DialogTitle>
          <DialogDescription>
            {contact && (
              isSpanish 
                ? `Crear evento para ${contact.name}${contact.email ? ` (${contact.email})` : ""}`
                : `Create event for ${contact.name}${contact.email ? ` (${contact.email})` : ""}`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isSpanish ? "Fecha" : "Date"}</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label>{isSpanish ? "Hora" : "Time"}</Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isSpanish ? "Título del evento" : "Event title"}</Label>
            <Input
              placeholder={isSpanish ? `Reunión con ${contact?.name || "contacto"}` : `Meeting with ${contact?.name || "contact"}`}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{isSpanish ? "Descripción (opcional)" : "Description (optional)"}</Label>
            <Textarea
              placeholder={isSpanish ? "Detalles de la reunión..." : "Meeting details..."}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={3}
            />
          </div>

          {!contact?.email && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {isSpanish 
                ? "⚠️ Este contacto no tiene email. La invitación se creará pero no se enviará automáticamente."
                : "⚠️ This contact has no email. The event will be created but no invite will be sent."}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isSpanish ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSpanish ? "Enviar invitación" : "Send invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
