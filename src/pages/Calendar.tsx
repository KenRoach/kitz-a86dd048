import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight,
  Clock, Package, Users, Bell, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "follow_up" | "order" | "delivery" | "custom";
  status?: string;
  meta?: Record<string, any>;
}

export default function Calendar() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", date: "", time: "", notes: "" });
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = format(monthStart, "yyyy-MM-dd");
    const end = format(monthEnd, "yyyy-MM-dd");

    const [followUps, orders, calendar] = await Promise.all([
      supabase
        .from("follow_ups")
        .select("id, reason, due_at, status, channel")
        .eq("user_id", user.id)
        .gte("due_at", `${start}T00:00:00`)
        .lte("due_at", `${end}T23:59:59`),
      supabase
        .from("orders")
        .select("id, order_number, notes, total, created_at, delivered_at, fulfillment_status, payment_status")
        .eq("user_id", user.id)
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`),
      supabase
        .from("content_calendar")
        .select("id, title, scheduled_date, scheduled_time, status, notes")
        .eq("user_id", user.id)
        .gte("scheduled_date", start)
        .lte("scheduled_date", end),
    ]);

    const mapped: CalendarEvent[] = [];

    (followUps.data || []).forEach((f) => {
      mapped.push({
        id: `fu-${f.id}`,
        title: f.reason,
        date: new Date(f.due_at),
        type: "follow_up",
        status: f.status,
        meta: { channel: f.channel },
      });
    });

    (orders.data || []).forEach((o) => {
      mapped.push({
        id: `ord-${o.id}`,
        title: `${o.order_number || "Order"} — $${Number(o.total).toFixed(2)}`,
        date: new Date(o.created_at),
        type: "order",
        status: o.payment_status,
      });
      if (o.delivered_at) {
        mapped.push({
          id: `del-${o.id}`,
          title: `Delivered: ${o.order_number || "Order"}`,
          date: new Date(o.delivered_at),
          type: "delivery",
          status: "DELIVERED",
        });
      }
    });

    (calendar.data || []).forEach((c) => {
      mapped.push({
        id: `cal-${c.id}`,
        title: c.title,
        date: new Date(c.scheduled_date + "T" + (c.scheduled_time || "09:00")),
        type: "custom",
        status: c.status || "planned",
        meta: { notes: c.notes },
      });
    });

    setEvents(mapped);
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async () => {
    if (!user || !createForm.title || !createForm.date) return;
    const { error } = await supabase.from("content_calendar").insert({
      user_id: user.id,
      title: createForm.title,
      scheduled_date: createForm.date,
      scheduled_time: createForm.time || null,
      notes: createForm.notes || null,
      status: "planned",
    });
    if (error) { toast.error("Error creating event"); return; }
    toast.success(language === "es" ? "Evento creado" : "Event created");
    setCreateForm({ title: "", date: "", time: "", notes: "" });
    setShowCreate(false);
    fetchEvents();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const typeColors: Record<string, string> = {
    follow_up: "bg-amber-500",
    order: "bg-blue-500",
    delivery: "bg-emerald-500",
    custom: "bg-primary",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    follow_up: <Bell className="w-3.5 h-3.5" />,
    order: <Package className="w-3.5 h-3.5" />,
    delivery: <CheckCircle2 className="w-3.5 h-3.5" />,
    custom: <CalendarDays className="w-3.5 h-3.5" />,
  };

  const weekDays = language === "es"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {language === "es" ? "Calendario" : "Calendar"}
          </h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                {language === "es" ? "Nuevo" : "New"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "es" ? "Nuevo evento" : "New Event"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{language === "es" ? "Título" : "Title"}</Label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder={language === "es" ? "Ej: Llamar a cliente" : "E.g. Call customer"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{language === "es" ? "Fecha" : "Date"}</Label>
                    <Input
                      type="date"
                      value={createForm.date}
                      onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{language === "es" ? "Hora" : "Time"}</Label>
                    <Input
                      type="time"
                      value={createForm.time}
                      onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>{language === "es" ? "Notas" : "Notes"}</Label>
                  <Textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!createForm.title || !createForm.date}>
                  {language === "es" ? "Crear evento" : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-base font-medium">
            {format(currentMonth, language === "es" ? "MMMM yyyy" : "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
          {weekDays.map((d) => (
            <div key={d} className="bg-muted py-2 text-center text-[10px] font-medium text-muted-foreground uppercase">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const inMonth = day.getMonth() === currentMonth.getMonth();
            const selected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`bg-card min-h-[60px] md:min-h-[80px] p-1 text-left transition-colors relative
                  ${!inMonth ? "opacity-30" : ""}
                  ${selected ? "ring-2 ring-primary ring-inset" : ""}
                  ${isToday(day) ? "bg-primary/5" : ""}
                  hover:bg-muted/50
                `}
              >
                <span className={`text-xs font-medium block mb-0.5 ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${typeColors[e.type]}`} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {language === "es" ? "Seguimiento" : "Follow-up"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {language === "es" ? "Orden" : "Order"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {language === "es" ? "Entrega" : "Delivery"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {language === "es" ? "Evento" : "Event"}</span>
        </div>

        {/* Selected day events */}
        {selectedDate && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {format(selectedDate, language === "es" ? "EEEE d 'de' MMMM" : "EEEE, MMM d")}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {language === "es" ? "Sin eventos" : "No events"}
              </p>
            ) : (
              selectedEvents.map((event) => (
                <Card key={event.id} className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${typeColors[event.type]}`}>
                      {typeIcons[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {format(event.date, "h:mm a")}
                        </span>
                        {event.status && (
                          <Badge variant="secondary" className="text-[9px] h-4">
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
