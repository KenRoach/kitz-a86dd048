import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { GanttChart, Plus, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, differenceInDays, isWithinInterval, isBefore, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  status: "planned" | "in_progress" | "completed";
}

const COLORS = [
  { value: "blue", bg: "bg-blue-500", light: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "green", bg: "bg-emerald-500", light: "bg-emerald-100 dark:bg-emerald-900/30" },
  { value: "purple", bg: "bg-purple-500", light: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "orange", bg: "bg-orange-500", light: "bg-orange-100 dark:bg-orange-900/30" },
  { value: "pink", bg: "bg-pink-500", light: "bg-pink-100 dark:bg-pink-900/30" },
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned", labelEs: "Planificado" },
  { value: "in_progress", label: "In Progress", labelEs: "En Progreso" },
  { value: "completed", label: "Completed", labelEs: "Completado" },
];

export function ProjectGantt() {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [projects, setProjects] = useState<Project[]>(() => {
    if (!user) return [];
    const stored = localStorage.getItem(`gantt-projects-${user.id}`);
    return stored ? JSON.parse(stored).map((p: Project) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
    })) : [];
  });
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("blue");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");

  // Calculate visible week
  const baseWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const visibleWeekStart = addWeeks(baseWeek, weekOffset);
  const visibleDays = Array.from({ length: 14 }, (_, i) => addDays(visibleWeekStart, i));

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    if (user) {
      localStorage.setItem(`gantt-projects-${user.id}`, JSON.stringify(newProjects));
    }
  };

  const resetForm = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setColor("blue");
    setStatus("planned");
    setEditingProject(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setStartDate(format(project.startDate, "yyyy-MM-dd"));
    setEndDate(format(project.endDate, "yyyy-MM-dd"));
    setColor(project.color);
    setStatus(project.status);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error(language === "es" ? "Completa todos los campos" : "Fill all fields");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isBefore(end, start)) {
      toast.error(language === "es" ? "La fecha de fin debe ser posterior" : "End date must be after start");
      return;
    }

    if (editingProject) {
      const updated = projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: name.trim(), startDate: start, endDate: end, color, status }
          : p
      );
      saveProjects(updated);
      toast.success(language === "es" ? "Proyecto actualizado" : "Project updated");
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: name.trim(),
        startDate: start,
        endDate: end,
        color,
        status,
      };
      saveProjects([...projects, newProject]);
      toast.success(language === "es" ? "Proyecto agregado" : "Project added");
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
    toast.success(language === "es" ? "Proyecto eliminado" : "Project removed");
  };

  const getColorClasses = (colorValue: string) => {
    return COLORS.find(c => c.value === colorValue) || COLORS[0];
  };

  const getProjectBar = (project: Project, dayIndex: number, day: Date) => {
    const isInRange = isWithinInterval(day, { start: project.startDate, end: project.endDate });
    if (!isInRange) return null;

    const isStart = differenceInDays(day, project.startDate) === 0;
    const isEnd = differenceInDays(project.endDate, day) === 0;
    const colorClasses = getColorClasses(project.color);

    return (
      <div
        className={cn(
          "h-6 cursor-pointer transition-opacity hover:opacity-80",
          colorClasses.bg,
          isStart && "rounded-l-md ml-0.5",
          isEnd && "rounded-r-md mr-0.5",
          project.status === "completed" && "opacity-60"
        )}
        onClick={() => handleOpenEdit(project)}
        title={project.name}
      />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GanttChart className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">
              {language === "es" ? "Cronograma de Proyectos" : "Project Timeline"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {projects.length} {language === "es" ? "proyectos" : "projects"}
            </Badge>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-1" />
              {language === "es" ? "Agregar" : "Add"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            {format(visibleWeekStart, "MMM d", { locale: language === "es" ? es : undefined })} - {format(addDays(visibleWeekStart, 13), "MMM d, yyyy", { locale: language === "es" ? es : undefined })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Gantt Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header Row - Days */}
            <div className="grid grid-cols-[120px_repeat(14,1fr)] border-b pb-2 mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {language === "es" ? "Proyecto" : "Project"}
              </div>
              {visibleDays.map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-muted-foreground">
                    {format(day, "EEE", { locale: language === "es" ? es : undefined })}
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    differenceInDays(day, new Date()) === 0 && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Project Rows */}
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {language === "es" 
                  ? "No hay proyectos. Agrega uno para empezar." 
                  : "No projects. Add one to get started."}
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="grid grid-cols-[120px_repeat(14,1fr)] items-center py-1 border-b border-border/50 group">
                  <div className="flex items-center gap-2 pr-2">
                    <div className={cn("w-2 h-2 rounded-full", getColorClasses(project.color).bg)} />
                    <span className="text-xs truncate flex-1">{project.name}</span>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  {visibleDays.map((day, i) => (
                    <div key={i} className="h-6">
                      {getProjectBar(project, i, day)}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
          {STATUS_OPTIONS.map((s) => (
            <div key={s.value} className="flex items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded bg-primary",
                s.value === "completed" && "opacity-60"
              )} />
              <span>{language === "es" ? s.labelEs : s.label}</span>
            </div>
          ))}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {editingProject 
                  ? (language === "es" ? "Editar Proyecto" : "Edit Project")
                  : (language === "es" ? "Nuevo Proyecto" : "New Project")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  placeholder={language === "es" ? "Nombre del proyecto" : "Project name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "es" ? "Inicio" : "Start"}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "es" ? "Fin" : "End"}</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "es" ? "Color" : "Color"}</Label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          c.bg,
                          color === c.value && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "es" ? "Estado" : "Status"}</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {language === "es" ? s.labelEs : s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Button className="flex-1" onClick={handleSave}>
                  {editingProject
                    ? (language === "es" ? "Guardar" : "Save")
                    : (language === "es" ? "Agregar" : "Add")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}