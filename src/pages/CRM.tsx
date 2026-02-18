import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Phone, User, Users, Clock, ArrowRight, MessageCircle, Bell,
  Bot, Send, Mail, Copy
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  lifetime_value: number;
  last_interaction_at: string | null;
  created_at: string;
}

interface FollowUp {
  id: string;
  reason: string;
  due_at: string;
  status: string;
  suggested_message?: string | null;
  channel?: string | null;
  step?: number;
  sequence_type?: string;
}

export default function CRM() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("crm_contacts")
      .select("id, name, phone, email, notes, lifetime_value, last_interaction_at, created_at")
      .eq("user_id", user.id)
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (page === 0) {
      setContacts((data as Contact[]) || []);
    } else {
      setContacts(prev => [...prev, ...((data as Contact[]) || [])]);
    }
    setLoading(false);
  }, [user, page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const fetchContactDetails = useCallback(async (contactId: string) => {
    if (!user) return;
    const [timelineRes, followUpsRes, ordersRes] = await Promise.all([
      supabase.from("contact_timeline").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20),
      supabase.from("follow_ups").select("*").eq("contact_id", contactId).eq("user_id", user.id).order("due_at", { ascending: true }).limit(10),
      supabase.from("orders").select("id, order_number, total, payment_status, fulfillment_status, created_at").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(10),
    ]);
    setTimeline(timelineRes.data || []);
    setFollowUps((followUpsRes.data as FollowUp[]) || []);
    setOrders(ordersRes.data || []);
  }, [user]);

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
    fetchContactDetails(c.id);
  };

  const handleAddContact = async () => {
    if (!user || !form.name.trim()) return;
    const { error } = await supabase.from("crm_contacts").insert({
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone || null,
      notes: form.notes || null,
      last_interaction_at: new Date().toISOString(),
    });
    if (error) { toast.error("Error adding contact"); return; }
    toast.success(language === "es" ? "Contacto agregado" : "Contact added");
    setForm({ name: "", phone: "", notes: "" });
    setShowAdd(false);
    fetchContacts();
  };

  const addNote = async (contactId: string, note: string) => {
    if (!user) return;
    await supabase.from("contact_timeline").insert({
      user_id: user.id,
      contact_id: contactId,
      event_type: "note",
      content: note,
    });
    await supabase.from("crm_contacts").update({ last_interaction_at: new Date().toISOString() }).eq("id", contactId);
    fetchContactDetails(contactId);
  };

  const completeFollowUp = async (id: string) => {
    await supabase.from("follow_ups").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (selectedContact) fetchContactDetails(selectedContact.id);
    toast.success(language === "es" ? "Seguimiento completado" : "Follow-up completed");
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;

  // Contact Detail View
  if (selectedContact) {
    const pendingFollowUps = followUps.filter(f => f.status === "pending");
    return (
      <AppLayout>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="gap-1">
            ← {language === "es" ? "Volver" : "Back"}
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{selectedContact.name}</h1>
              {selectedContact.phone && (
                <a href={`https://wa.me/${selectedContact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {selectedContact.phone}
                  <MessageCircle className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                ${Number(selectedContact.lifetime_value).toFixed(2)} {language === "es" ? "total" : "lifetime"}
              </p>
            </div>
          </div>

          {selectedContact.notes && (
            <Card className="p-3">
              <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
            </Card>
          )}

          {/* Pending Follow-ups */}
          {pendingFollowUps.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                {language === "es" ? "Seguimientos pendientes" : "Pending Follow-ups"}
              </h2>
              {pendingFollowUps.map(f => (
                <Card key={f.id} className="p-3 border-orange-200 dark:border-orange-800/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{f.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Vence" : "Due"}: {new Date(f.due_at).toLocaleDateString()}
                        {f.step && <span className="ml-1">• Step {f.step}</span>}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => completeFollowUp(f.id)}>
                      ✓
                    </Button>
                  </div>
                  {f.suggested_message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-muted/60 border border-border/50">
                      <div className="flex items-start gap-2">
                        <Bot className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground/80 leading-relaxed">{f.suggested_message}</p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {f.channel === "whatsapp" && selectedContact?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-6 px-2 gap-1"
                            onClick={() => {
                              const cleaned = selectedContact.phone!.replace(/\D/g, "");
                              window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(f.suggested_message!)}`, "_blank");
                              completeFollowUp(f.id);
                            }}
                          >
                            <Send className="w-3 h-3" />
                            WhatsApp
                          </Button>
                        )}
                        {f.channel === "email" && selectedContact?.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-6 px-2 gap-1"
                            onClick={() => {
                              window.open(`mailto:${selectedContact.email}?body=${encodeURIComponent(f.suggested_message!)}`, "_blank");
                              completeFollowUp(f.id);
                            }}
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] h-6 px-2 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(f.suggested_message!);
                            toast.success(language === "es" ? "Copiado" : "Copied");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </section>
          )}

          {/* Order History */}
          {orders.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">{language === "es" ? "Órdenes" : "Orders"}</h2>
              {orders.map(o => (
                <Card key={o.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{o.order_number || "Draft"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${Number(o.total).toFixed(2)}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {o.fulfillment_status === "DELIVERED" ? (language === "es" ? "Entregada" : "Delivered") :
                         o.payment_status === "PAID" ? (language === "es" ? "Pagada" : "Paid") :
                         (language === "es" ? "Nueva" : "New")}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}

          {/* Add Note */}
          <Card className="p-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const note = fd.get("note") as string;
              if (!note.trim()) return;
              await addNote(selectedContact.id, note);
              (e.target as HTMLFormElement).reset();
              toast.success(language === "es" ? "Nota agregada" : "Note added");
            }} className="flex gap-2">
              <Input name="note" placeholder={language === "es" ? "Agregar nota..." : "Add note..."} className="flex-1" />
              <VoiceInputButton onTranscript={(t) => {
                const input = document.querySelector<HTMLInputElement>('input[name="note"]');
                if (input) { const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set; nativeSet?.call(input, (input.value ? input.value + " " : "") + t); input.dispatchEvent(new Event('input', { bubbles: true })); }
              }} />
              <Button type="submit" size="sm">{language === "es" ? "Agregar" : "Add"}</Button>
            </form>
          </Card>

          {/* Timeline */}
          {timeline.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === "es" ? "Historial" : "History"}
              </h2>
              {timeline.map(t => (
                <Card key={t.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{t.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{language === "es" ? "Clientes" : "Customers"}</h1>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{language === "es" ? "Nuevo" : "New"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "es" ? "Nuevo cliente" : "New Customer"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>{language === "es" ? "Nombre" : "Name"} *</Label>
                  <div className="flex items-center gap-1.5">
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="flex-1" />
                    <VoiceInputButton onTranscript={(t) => setForm(p => ({ ...p, name: t }))} />
                  </div></div>
                <div><Label>{language === "es" ? "Teléfono" : "Phone"}</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+507..." /></div>
                <div><Label>{language === "es" ? "Notas" : "Notes"}</Label>
                  <div className="flex items-start gap-1.5">
                    <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="flex-1" />
                    <VoiceInputButton onTranscript={(t) => setForm(p => ({ ...p, notes: p.notes ? p.notes + " " + t : t }))} className="mt-1" />
                  </div></div>
                <Button onClick={handleAddContact} className="w-full">{language === "es" ? "Agregar" : "Add Customer"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={language === "es" ? "Buscar por nombre o teléfono..." : "Search by name or phone..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Contact List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {contacts.length === 0
                ? (language === "es" ? "Sin clientes aún" : "No customers yet")
                : (language === "es" ? "Sin resultados" : "No results")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {contacts.length === 0
                ? (language === "es" ? "Se agregan automáticamente cuando alguien ordena desde tu vitrina" : "They get added automatically when someone orders from your storefront")
                : (language === "es" ? "Intenta con otro nombre" : "Try a different search")}
            </p>
            {contacts.length === 0 && (
              <Button onClick={() => setShowAdd(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                {language === "es" ? "Agregar cliente" : "Add Customer"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <Card key={c.id} className="p-4 hover-calm cursor-pointer" onClick={() => handleSelectContact(c)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.phone || (language === "es" ? "Sin teléfono" : "No phone")}
                      {c.lifetime_value > 0 && ` · $${Number(c.lifetime_value).toFixed(2)}`}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            ))}
            {filtered.length >= PAGE_SIZE && (
              <Button variant="outline" className="w-full" onClick={() => setPage(p => p + 1)}>
                {language === "es" ? "Cargar más" : "Load more"}
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
