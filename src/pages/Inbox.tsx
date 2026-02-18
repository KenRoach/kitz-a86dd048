import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppQR } from "@/components/inbox/WhatsAppQR";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox as InboxIcon, MessageCircle, Mail, Search,
  ExternalLink, Phone, Clock, CheckCheck, Circle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface InboxMessage {
  id: string;
  channel: string;
  direction: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  contact_id: string | null;
}

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  last_interaction_at: string | null;
}

export default function Inbox() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tab, setTab] = useState("whatsapp");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [profile, setProfile] = useState<{ phone: string | null; business_name: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Build webhook URL for email forwarding
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      setWebhookUrl(`${projectUrl}/functions/v1/inbox-webhook`);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [contactsRes, messagesRes, profileRes] = await Promise.all([
      supabase
        .from("crm_contacts")
        .select("id, name, phone, email, last_interaction_at")
        .eq("user_id", user.id)
        .not("phone", "is", null)
        .order("last_interaction_at", { ascending: false })
        .limit(100),
      supabase
        .from("inbox_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("profiles")
        .select("phone, business_name")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setContacts((contactsRes.data as Contact[]) || []);
    setMessages((messagesRes.data as InboxMessage[]) || []);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAsRead = async (id: string) => {
    await supabase.from("inbox_messages").update({ is_read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const filteredMessages = messages.filter((m) =>
    m.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase()) ||
    m.body.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(language === "es" ? "URL copiada" : "Webhook URL copied");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {language === "es" ? "Bandeja" : "Inbox"}
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} {language === "es" ? "sin leer" : "unread"}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="whatsapp" className="flex-1 gap-1.5">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 gap-1.5">
              <Mail className="w-4 h-4" />
              Email
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5 ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "es" ? "Buscar..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="mt-3 space-y-3">
            {user && (
              <WhatsAppQR
                userId={user.id}
                businessPhone={profile?.phone ?? null}
                businessName={profile?.business_name ?? "My Business"}
              />
            )}
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-base font-medium mb-1">
                  {language === "es" ? "Sin contactos con teléfono" : "No contacts with phone"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {language === "es"
                    ? "Los contactos con número de teléfono aparecerán aquí para enviar WhatsApp"
                    : "Contacts with phone numbers will appear here for WhatsApp messaging"}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-emerald-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 shrink-0"
                      onClick={() => openWhatsApp(contact.phone!, contact.name)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Chat</span>
                    </Button>
                  </div>
                  {contact.last_interaction_at && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-[52px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(contact.last_interaction_at), "MMM d, h:mm a")}
                    </p>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-3 space-y-3">
            {/* Setup info */}
            {messages.length === 0 && (
              <Card className="p-4 border-dashed border-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">
                        {language === "es" ? "Configura el reenvío de email" : "Set up email forwarding"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "es"
                          ? "En tu Gmail o Outlook, crea una regla de reenvío a esta URL. Los emails llegarán aquí automáticamente."
                          : "In your Gmail or Outlook, create a forwarding rule to this webhook URL. Emails will arrive here automatically."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="text-xs font-mono bg-muted"
                    />
                    <Button size="sm" variant="outline" onClick={copyWebhook}>
                      {language === "es" ? "Copiar" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {language === "es"
                      ? "O usa servicios como Zapier/Make para reenviar emails a este webhook."
                      : "Or use services like Zapier/Make to forward emails to this webhook."}
                  </p>
                </div>
              </Card>
            )}

            {/* Email messages list */}
            {filteredMessages.length > 0 && (
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${!msg.is_read ? "border-l-2 border-l-primary" : ""}`}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.is_read) markAsRead(msg.id);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {msg.is_read ? (
                          <CheckCheck className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Circle className="w-4 h-4 text-primary fill-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${!msg.is_read ? "font-semibold" : "font-medium"}`}>
                            {msg.sender_name || msg.sender_email || "Unknown"}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(msg.created_at), "MMM d")}
                          </span>
                        </div>
                        {msg.subject && (
                          <p className="text-xs font-medium text-foreground/80 truncate">{msg.subject}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {msg.body.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {messages.length > 0 && filteredMessages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {language === "es" ? "Sin resultados" : "No matching messages"}
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Email detail dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-lg">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">{selectedMessage.subject || "(No subject)"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {selectedMessage.sender_name || selectedMessage.sender_email}
                    </span>
                    {selectedMessage.sender_email && selectedMessage.sender_name && (
                      <span className="text-xs">&lt;{selectedMessage.sender_email}&gt;</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(selectedMessage.created_at), "EEEE, MMM d 'at' h:mm a")}
                  </p>
                  <ScrollArea className="max-h-[400px]">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.body}
                    </div>
                  </ScrollArea>
                  {selectedMessage.sender_email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => window.open(`mailto:${selectedMessage.sender_email}`, "_blank")}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {language === "es" ? "Responder" : "Reply"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
