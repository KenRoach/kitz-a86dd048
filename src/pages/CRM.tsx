import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import {
  Plus, Search, Phone, Mail, Flame, Snowflake, Sun, ArrowRight,
  User, Users, Clock, DollarSign, Tag
} from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source_channel: string | null;
  tags: string[];
  lead_score: string;
  lifetime_value: number;
  last_interaction_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function CRM() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source_channel: "manual", lead_score: "WARM", notes: "" });

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("last_interaction_at", { ascending: false, nullsFirst: false });
    setContacts((data as Contact[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const fetchTimeline = useCallback(async (contactId: string) => {
    const { data } = await supabase
      .from("contact_timeline")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(20);
    setTimeline(data || []);
  }, []);

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
    fetchTimeline(c.id);
  };

  const handleAddContact = async () => {
    if (!user || !form.name.trim()) return;
    const { error } = await supabase.from("crm_contacts").insert({
      user_id: user.id,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      source_channel: form.source_channel,
      lead_score: form.lead_score,
      notes: form.notes || null,
      last_interaction_at: new Date().toISOString(),
    });
    if (error) { toast.error("Error adding contact"); return; }
    toast.success(language === "es" ? "Contacto agregado" : "Contact added");
    setForm({ name: "", phone: "", email: "", source_channel: "manual", lead_score: "WARM", notes: "" });
    setShowAdd(false);
    fetchContacts();
  };

  const addTimelineEntry = async (contactId: string, type: string, content: string) => {
    if (!user) return;
    await supabase.from("contact_timeline").insert({
      user_id: user.id,
      contact_id: contactId,
      event_type: type,
      content,
    });
    fetchTimeline(contactId);
  };

  const scoreIcon = (score: string) => {
    switch (score) {
      case "HOT": return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case "COLD": return <Snowflake className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Sun className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  const scoreBadgeClass = (score: string) => {
    switch (score) {
      case "HOT": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "COLD": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    }
  };

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.lead_score === filter || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;

  // Contact Detail View
  if (selectedContact) {
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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={scoreBadgeClass(selectedContact.lead_score)}>
                  {scoreIcon(selectedContact.lead_score)}
                  <span className="ml-1">{selectedContact.lead_score}</span>
                </Badge>
                {selectedContact.status === "vip" && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">VIP</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <Card className="p-4 space-y-3">
            {selectedContact.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedContact.phone}</span>
              </div>
            )}
            {selectedContact.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{selectedContact.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>${Number(selectedContact.lifetime_value).toFixed(2)} lifetime</span>
            </div>
            {selectedContact.tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {selectedContact.tags.map(t => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
            {selectedContact.notes && (
              <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
            )}
          </Card>

          {/* Add Note */}
          <Card className="p-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const note = fd.get("note") as string;
              if (!note.trim()) return;
              await addTimelineEntry(selectedContact.id, "note", note);
              (e.target as HTMLFormElement).reset();
              toast.success(language === "es" ? "Nota agregada" : "Note added");
            }} className="flex gap-2">
              <Input name="note" placeholder={language === "es" ? "Agregar nota..." : "Add note..."} className="flex-1" />
              <Button type="submit" size="sm">{language === "es" ? "Agregar" : "Add"}</Button>
            </form>
          </Card>

          {/* Timeline */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {language === "es" ? "Línea de tiempo" : "Timeline"}
            </h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{language === "es" ? "Sin actividad" : "No activity yet"}</p>
            ) : (
              <div className="space-y-2">
                {timeline.map(t => (
                  <Card key={t.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{t.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.event_type} · {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">CRM</h1>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{language === "es" ? "Nuevo" : "New"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "es" ? "Nuevo contacto" : "New Contact"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>{language === "es" ? "Nombre" : "Name"} *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>{language === "es" ? "Teléfono" : "Phone"}</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Lead Score</Label>
                  <Select value={form.lead_score} onValueChange={v => setForm(p => ({ ...p, lead_score: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOT">🔥 Hot</SelectItem>
                      <SelectItem value="WARM">☀️ Warm</SelectItem>
                      <SelectItem value="COLD">❄️ Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{language === "es" ? "Notas" : "Notes"}</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleAddContact} className="w-full">{language === "es" ? "Agregar" : "Add Contact"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={language === "es" ? "Buscar..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
              <SelectItem value="HOT">🔥 Hot</SelectItem>
              <SelectItem value="WARM">☀️ Warm</SelectItem>
              <SelectItem value="COLD">❄️ Cold</SelectItem>
              <SelectItem value="vip">⭐ VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contact List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "No hay contactos aún" : "No contacts yet"}
            </p>
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <Badge variant="secondary" className={`text-[10px] ${scoreBadgeClass(c.lead_score)}`}>
                        {c.lead_score}
                      </Badge>
                      {c.status === "vip" && <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-700">VIP</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.phone || c.email || c.source_channel} · ${Number(c.lifetime_value).toFixed(2)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
