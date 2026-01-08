import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Calendar, Plus, Trash2, Instagram, Image, Video, FileText, Clock } from "lucide-react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarItem {
  id: string;
  title: string;
  platform: string;
  scheduled_date: string;
  scheduled_time: string | null;
  content_type: string;
  notes: string | null;
  status: string;
}

const CONTENT_TYPES = [
  { value: "post", label: "Post", labelEs: "Publicación", icon: Image },
  { value: "reel", label: "Reel", labelEs: "Reel", icon: Video },
  { value: "story", label: "Story", labelEs: "Historia", icon: Clock },
  { value: "carousel", label: "Carousel", labelEs: "Carrusel", icon: FileText },
];

export function ContentCalendar() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("post");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  // Get current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: calendarItems = [], isLoading } = useQuery({
    queryKey: ["content-calendar", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("content_calendar")
        .select("*")
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data as CalendarItem[];
    },
    enabled: !!user,
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<CalendarItem, "id">) => {
      const { data, error } = await supabase
        .from("content_calendar")
        .insert({
          ...item,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success(language === "es" ? "Contenido agregado" : "Content added");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(language === "es" ? "Error al agregar contenido" : "Failed to add content");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_calendar")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success(language === "es" ? "Contenido eliminado" : "Content removed");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "planned" ? "posted" : "planned";
      const { error } = await supabase
        .from("content_calendar")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContentType("post");
    setScheduledTime("");
    setNotes("");
    setSelectedDate(null);
  };

  const handleAddItem = () => {
    if (!title.trim() || !selectedDate) return;

    addItemMutation.mutate({
      title: title.trim(),
      platform: "instagram",
      scheduled_date: format(selectedDate, "yyyy-MM-dd"),
      scheduled_time: scheduledTime || null,
      content_type: contentType,
      notes: notes.trim() || null,
      status: "planned",
    });
  };

  const openAddDialog = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getItemsForDay = (date: Date) => {
    return calendarItems.filter((item) =>
      isSameDay(new Date(item.scheduled_date), date)
    );
  };

  const getContentTypeIcon = (type: string) => {
    const found = CONTENT_TYPES.find((ct) => ct.value === type);
    return found ? found.icon : Image;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">
            {language === "es" ? "Calendario de Contenido" : "Content Calendar"}
          </CardTitle>
        </div>
        <CardDescription>
          {language === "es"
            ? "Planifica tus publicaciones de la semana"
            : "Plan your weekly posts"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Week View */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, idx) => {
            const dayItems = getItemsForDay(day);
            const dayName = format(day, "EEE", { locale: language === "es" ? es : undefined });
            const dayNum = format(day, "d");

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-colors",
                  isToday(day)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex flex-col items-center mb-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                    {dayName}
                  </span>
                  <span
                    className={cn(
                      "text-sm sm:text-base font-medium",
                      isToday(day) && "text-primary"
                    )}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Items for this day */}
                <div className="space-y-1">
                  {dayItems.slice(0, 2).map((item) => {
                    const Icon = getContentTypeIcon(item.content_type);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group text-[10px] sm:text-xs p-1 rounded cursor-pointer transition-all",
                          item.status === "posted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                        onClick={() => toggleStatusMutation.mutate({ id: item.id, status: item.status })}
                      >
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate flex-1">{item.title}</span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItemMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                        {item.scheduled_time && (
                          <span className="text-[8px] text-muted-foreground hidden sm:block">
                            {item.scheduled_time.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {dayItems.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayItems.length - 2} {language === "es" ? "más" : "more"}
                    </span>
                  )}
                </div>

                {/* Add button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 mt-1 text-[10px] opacity-50 hover:opacity-100"
                  onClick={() => openAddDialog(day)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>{language === "es" ? "Planificado" : "Planned"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            <span>{language === "es" ? "Publicado" : "Posted"}</span>
          </div>
          <span className="ml-auto text-[10px]">
            {language === "es" ? "Click para marcar como publicado" : "Click to mark as posted"}
          </span>
        </div>

        {/* Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === "es" ? "Agregar Contenido" : "Add Content"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {selectedDate && (
                <Badge variant="outline" className="mb-2">
                  {format(selectedDate, "PPPP", { locale: language === "es" ? es : undefined })}
                </Badge>
              )}

              <div className="space-y-2">
                <Label>{language === "es" ? "Título" : "Title"}</Label>
                <Input
                  placeholder={language === "es" ? "¿Qué vas a publicar?" : "What will you post?"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "es" ? "Tipo" : "Type"}</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          <div className="flex items-center gap-2">
                            <ct.icon className="w-4 h-4" />
                            {language === "es" ? ct.labelEs : ct.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === "es" ? "Hora (opcional)" : "Time (optional)"}</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "es" ? "Notas (opcional)" : "Notes (optional)"}</Label>
                <Textarea
                  placeholder={language === "es" ? "Ideas, hashtags, menciones..." : "Ideas, hashtags, mentions..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddItem}
                  disabled={!title.trim() || addItemMutation.isPending}
                >
                  {addItemMutation.isPending ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {language === "es" ? "Agregar" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
