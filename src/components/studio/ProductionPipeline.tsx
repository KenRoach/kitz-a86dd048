import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  GripVertical, 
  Film, 
  Palette, 
  Clapperboard, 
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PipelineItem {
  id: string;
  title: string;
  stage: "concept" | "storyboard" | "animation" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignee?: string;
}

interface ProductionPipelineProps {
  language: "en" | "es" | "pt";
}

const STAGES = [
  { id: "concept", icon: Palette, labelEn: "Concept", labelEs: "Concepto", labelPt: "Conceito", color: "bg-blue-500/10 border-blue-500/30" },
  { id: "storyboard", icon: Clapperboard, labelEn: "Storyboard", labelEs: "Storyboard", labelPt: "Storyboard", color: "bg-amber-500/10 border-amber-500/30" },
  { id: "animation", icon: Film, labelEn: "Animation", labelEs: "Animación", labelPt: "Animação", color: "bg-purple-500/10 border-purple-500/30" },
  { id: "review", icon: Play, labelEn: "Review", labelEs: "Revisión", labelPt: "Revisão", color: "bg-cyan-500/10 border-cyan-500/30" },
  { id: "done", icon: CheckCircle2, labelEn: "Done", labelEs: "Listo", labelPt: "Pronto", color: "bg-emerald-500/10 border-emerald-500/30" },
];

export function ProductionPipeline({ language }: ProductionPipelineProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<PipelineItem[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`studio_pipeline_${user?.id}`);
    return saved ? JSON.parse(saved) : [
      { id: "1", title: "Client Logo Animation", stage: "animation", priority: "high" },
      { id: "2", title: "Product Explainer", stage: "storyboard", priority: "medium" },
      { id: "3", title: "Social Media Pack", stage: "concept", priority: "low" },
    ];
  });
  const [newTask, setNewTask] = useState("");

  const t = {
    en: { title: "Production Pipeline", add: "Add Task", empty: "No tasks" },
    es: { title: "Pipeline de Producción", add: "Agregar", empty: "Sin tareas" },
    pt: { title: "Pipeline de Produção", add: "Adicionar", empty: "Sem tarefas" },
  }[language];

  const saveItems = (newItems: PipelineItem[]) => {
    setItems(newItems);
    localStorage.setItem(`studio_pipeline_${user?.id}`, JSON.stringify(newItems));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const newItem: PipelineItem = {
      id: Date.now().toString(),
      title: newTask,
      stage: "concept",
      priority: "medium",
    };
    saveItems([...items, newItem]);
    setNewTask("");
  };

  const moveToNextStage = (itemId: string) => {
    const stageOrder = ["concept", "storyboard", "animation", "review", "done"];
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentIdx = stageOrder.indexOf(item.stage);
        if (currentIdx < stageOrder.length - 1) {
          return { ...item, stage: stageOrder[currentIdx + 1] as PipelineItem["stage"] };
        }
      }
      return item;
    }));
  };

  const deleteTask = (itemId: string) => {
    saveItems(items.filter(item => item.id !== itemId));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive" className="text-[9px] px-1 py-0">!</Badge>;
      case "medium": return <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-700">M</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="border-studio-accent/20 bg-studio-section">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-studio-header flex items-center gap-2">
            <Film className="w-4 h-4 text-studio-cta" />
            {t.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {items.filter(i => i.stage !== "done").length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new task */}
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={language === "es" ? "Nueva tarea..." : language === "pt" ? "Nova tarefa..." : "New task..."}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button size="sm" onClick={addTask} className="h-8 bg-studio-cta hover:bg-studio-cta/90">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Stages horizontal scroll */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {STAGES.map(stage => {
              const StageIcon = stage.icon;
              const stageItems = items.filter(item => item.stage === stage.id);
              const label = language === "es" ? stage.labelEs : language === "pt" ? stage.labelPt : stage.labelEn;
              
              return (
                <div 
                  key={stage.id}
                  className={`min-w-[140px] p-2 rounded-lg border ${stage.color}`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <StageIcon className="w-3.5 h-3.5 text-studio-muted" />
                    <span className="text-xs font-medium text-studio-header">{label}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">
                      {stageItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {stageItems.slice(0, 3).map(item => (
                      <div 
                        key={item.id}
                        className="bg-white rounded p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => moveToNextStage(item.id)}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-0.5" />
                          <span className="text-studio-header line-clamp-2 flex-1">{item.title}</span>
                          {getPriorityBadge(item.priority)}
                        </div>
                      </div>
                    ))}
                    {stageItems.length > 3 && (
                      <p className="text-[10px] text-center text-studio-muted">
                        +{stageItems.length - 3} more
                      </p>
                    )}
                    {stageItems.length === 0 && (
                      <p className="text-[10px] text-center text-studio-muted py-2">{t.empty}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
