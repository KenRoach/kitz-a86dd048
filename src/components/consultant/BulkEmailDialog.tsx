import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Send, Users, AlertCircle } from "lucide-react";
import { ConsultantContact } from "./ConsultantContactCard";

interface BulkEmailDialogProps {
  open: boolean;
  onClose: () => void;
  contacts: ConsultantContact[];
  language?: "en" | "es" | "pt";
}

export function BulkEmailDialog({ open, onClose, contacts, language = "es" }: BulkEmailDialogProps) {
  const { profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const nutricionContacts = contacts.filter(c => c.funnel_stage === "nutricion");
  const contactsWithEmail = nutricionContacts.filter(c => c.email);

  const toggleContact = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === contactsWithEmail.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contactsWithEmail.map(c => c.id));
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast.error(language === "es" ? "Selecciona al menos un contacto" : "Select at least one contact");
      return;
    }
    if (!subject.trim()) {
      toast.error(language === "es" ? "El asunto es requerido" : "Subject is required");
      return;
    }
    if (!message.trim()) {
      toast.error(language === "es" ? "El mensaje es requerido" : "Message is required");
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          contactIds: selectedIds,
          subject,
          message,
          senderName: profile?.business_name || "Kitz",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          language === "es" 
            ? `✅ ${data.sent} email(s) enviado(s)${data.failed > 0 ? `, ${data.failed} fallido(s)` : ""}`
            : `✅ ${data.sent} email(s) sent${data.failed > 0 ? `, ${data.failed} failed` : ""}`
        );
        onClose();
        setSelectedIds([]);
        setSubject("");
        setMessage("");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Error sending emails");
    } finally {
      setSending(false);
    }
  };

  const templates = [
    {
      name: language === "es" ? "Recordatorio de servicio" : "Service reminder",
      subject: language === "es" ? "Información importante para ti" : "Important information for you",
      message: language === "es" 
        ? "Hola {nombre},\n\nQuería recordarte sobre nuestros servicios y cómo podemos ayudarte a alcanzar tus metas.\n\n¿Te gustaría agendar una llamada esta semana?\n\nSaludos cordiales"
        : "Hi {name},\n\nI wanted to remind you about our services and how we can help you achieve your goals.\n\nWould you like to schedule a call this week?\n\nBest regards"
    },
    {
      name: language === "es" ? "Oferta especial" : "Special offer",
      subject: language === "es" ? "🎉 Oferta exclusiva para ti" : "🎉 Exclusive offer for you",
      message: language === "es"
        ? "Hola {nombre},\n\nTengo una oferta especial que quiero compartir contigo.\n\nPor tiempo limitado, puedes acceder a [describe tu oferta].\n\n¿Te interesa conocer más detalles?\n\nSaludos"
        : "Hi {name},\n\nI have a special offer I want to share with you.\n\nFor a limited time, you can access [describe your offer].\n\nWould you like to know more details?\n\nBest regards"
    }
  ];

  const applyTemplate = (template: typeof templates[0]) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {language === "es" ? "Email Masivo - Nutrición" : "Bulk Email - Nurturing"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {language === "es" ? "Contactos en Nutrición" : "Contacts in Nurturing"}
              </Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedIds.length === contactsWithEmail.length 
                  ? (language === "es" ? "Deseleccionar" : "Deselect all")
                  : (language === "es" ? "Seleccionar todos" : "Select all")
                }
              </Button>
            </div>

            {contactsWithEmail.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "No hay contactos con email en la etapa Nutrición"
                    : "No contacts with email in Nurturing stage"
                  }
                </p>
              </div>
            ) : (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {contactsWithEmail.map(contact => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {selectedIds.length} {language === "es" ? "seleccionado(s)" : "selected"}
            </p>
          </div>

          {/* Templates */}
          <div>
            <Label className="mb-2 block">
              {language === "es" ? "Plantillas rápidas" : "Quick templates"}
            </Label>
            <div className="flex gap-2 flex-wrap">
              {templates.map((template, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">
              {language === "es" ? "Asunto" : "Subject"}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={language === "es" ? "Asunto del email..." : "Email subject..."}
              className="mt-1.5"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              {language === "es" ? "Mensaje" : "Message"}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === "es" 
                ? "Escribe tu mensaje... Usa {nombre} para personalizar"
                : "Write your message... Use {name} to personalize"
              }
              className="mt-1.5 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" 
                ? "Tip: Usa {nombre} para incluir el nombre del contacto"
                : "Tip: Use {name} to include the contact's name"
              }
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || selectedIds.length === 0 || !subject || !message}
          >
            <Send className="w-4 h-4 mr-2" />
            {sending 
              ? (language === "es" ? "Enviando..." : "Sending...")
              : (language === "es" ? `Enviar (${selectedIds.length})` : `Send (${selectedIds.length})`)
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
