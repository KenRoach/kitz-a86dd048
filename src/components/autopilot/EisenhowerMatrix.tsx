import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Zap,
  TrendingUp,
  TrendingDown,
  XCircle,
  Grid3X3,
} from "lucide-react";

type Quadrant = "high_value_low_effort" | "high_value_high_effort" | "low_value_low_effort" | "low_value_high_effort";

interface EisenhowerTask {
  id: string;
  title: string;
  quadrant: Quadrant;
  completed: boolean;
}

const quadrantConfig: Record<Quadrant, { label: string; labelEs: string; tag: string; tagEs: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  high_value_low_effort: {
    label: "Quick Wins",
    labelEs: "Victorias Rápidas",
    tag: "High Value / Low Effort",
    tagEs: "Alto Valor / Bajo Esfuerzo",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  high_value_high_effort: {
    label: "Big Projects",
    labelEs: "Proyectos Grandes",
    tag: "High Value / High Effort",
    tagEs: "Alto Valor / Alto Esfuerzo",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  },
  low_value_low_effort: {
    label: "Fill-ins",
    labelEs: "Relleno",
    tag: "Low Value / Low Effort",
    tagEs: "Bajo Valor / Bajo Esfuerzo",
    icon: <TrendingDown className="h-4 w-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  },
  low_value_high_effort: {
    label: "Avoid",
    labelEs: "Evitar",
    tag: "Low Value / High Effort",
    tagEs: "Bajo Valor / Alto Esfuerzo",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  },
};

export function EisenhowerMatrix() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<EisenhowerTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("high_value_low_effort");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("eisenhower_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("created_at", { ascending: false });
    
    if (data) setTasks(data as EisenhowerTask[]);
    setLoading(false);
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;
    
    const { data, error } = await supabase
      .from("eisenhower_tasks")
      .insert({
        user_id: user.id,
        title: newTask.trim(),
        quadrant: selectedQuadrant,
      })
      .select()
      .single();

    if (error) {
      toast.error(language === "es" ? "Error al agregar tarea" : "Failed to add task");
      return;
    }

    setTasks([data as EisenhowerTask, ...tasks]);
    setNewTask("");
    toast.success(language === "es" ? "Tarea agregada" : "Task added");
  };

  const toggleTask = async (task: EisenhowerTask) => {
    const { error } = await supabase
      .from("eisenhower_tasks")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", task.id);

    if (!error) {
      setTasks(tasks.filter((t) => t.id !== task.id));
      toast.success(language === "es" ? "¡Tarea completada!" : "Task completed!");
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from("eisenhower_tasks")
      .delete()
      .eq("id", id);

    if (!error) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const getQuadrantTasks = (quadrant: Quadrant) =>
    tasks.filter((t) => t.quadrant === quadrant);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="h-5 w-5" />
            {language === "es" ? "Matriz de Eisenhower" : "Eisenhower Matrix"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {language === "es" ? "Cargando..." : "Loading..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="h-5 w-5" />
            {language === "es" ? "Matriz de Eisenhower" : "Eisenhower Matrix"}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {tasks.length} {language === "es" ? "tareas" : "tasks"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Task Row */}
        <div className="flex gap-2">
          <Input
            placeholder={language === "es" ? "Nueva tarea..." : "New task..."}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1"
          />
          <select
            value={selectedQuadrant}
            onChange={(e) => setSelectedQuadrant(e.target.value as Quadrant)}
            className="px-2 py-1 border rounded-md bg-background text-sm"
          >
            {(Object.keys(quadrantConfig) as Quadrant[]).map((q) => (
              <option key={q} value={q}>
                {language === "es" ? quadrantConfig[q].labelEs : quadrantConfig[q].label}
              </option>
            ))}
          </select>
          <Button size="icon" onClick={addTask} disabled={!newTask.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(quadrantConfig) as Quadrant[]).map((quadrant) => {
            const config = quadrantConfig[quadrant];
            const quadrantTasks = getQuadrantTasks(quadrant);

            return (
              <div
                key={quadrant}
                className={`rounded-lg border p-3 ${config.bgColor} min-h-[120px]`}
              >
                <div className={`mb-2 ${config.color}`}>
                  <div className="flex items-center gap-1.5">
                    {config.icon}
                    <span className="text-xs font-medium">
                      {language === "es" ? config.labelEs : config.label}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-70">
                    {language === "es" ? config.tagEs : config.tag}
                  </span>
                  {quadrantTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1">
                      {quadrantTasks.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  {quadrantTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 bg-background/80 rounded px-2 py-1 group"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs flex-1 truncate">{task.title}</span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                  {quadrantTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {language === "es" ? "Sin tareas" : "No tasks"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-1 pt-2 border-t">
          <div>⬆️ {language === "es" ? "Alto Valor" : "High Value"} → ⬇️ {language === "es" ? "Bajo Valor" : "Low Value"}</div>
          <div>⬅️ {language === "es" ? "Bajo Esfuerzo" : "Low Effort"} → ➡️ {language === "es" ? "Alto Esfuerzo" : "High Effort"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
