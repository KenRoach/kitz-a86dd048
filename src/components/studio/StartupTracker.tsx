import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Rocket, 
  FileText, 
  Users, 
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StartupTrackerProps {
  language: "en" | "es" | "pt";
}

interface Milestone {
  id: string;
  title: string;
  titleEs: string;
  titlePt: string;
  category: "product" | "team" | "funding" | "growth";
  completed: boolean;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { id: "1", title: "Define MVP features", titleEs: "Definir features MVP", titlePt: "Definir features MVP", category: "product", completed: false },
  { id: "2", title: "Create pitch deck", titleEs: "Crear pitch deck", titlePt: "Criar pitch deck", category: "funding", completed: false },
  { id: "3", title: "Validate with 10 customers", titleEs: "Validar con 10 clientes", titlePt: "Validar com 10 clientes", category: "growth", completed: false },
  { id: "4", title: "Recruit co-founder", titleEs: "Reclutar co-fundador", titlePt: "Recrutar co-fundador", category: "team", completed: false },
  { id: "5", title: "Launch beta", titleEs: "Lanzar beta", titlePt: "Lançar beta", category: "product", completed: false },
  { id: "6", title: "First paying customer", titleEs: "Primer cliente pagado", titlePt: "Primeiro cliente pagante", category: "growth", completed: false },
];

const CATEGORIES = {
  product: { icon: Rocket, colorClass: "text-purple-600 bg-purple-500/10" },
  team: { icon: Users, colorClass: "text-blue-600 bg-blue-500/10" },
  funding: { icon: DollarSign, colorClass: "text-emerald-600 bg-emerald-500/10" },
  growth: { icon: TrendingUp, colorClass: "text-amber-600 bg-amber-500/10" },
};

export function StartupTracker({ language }: StartupTrackerProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    if (typeof window === "undefined") return DEFAULT_MILESTONES;
    const saved = localStorage.getItem(`startup_milestones_${user?.id}`);
    return saved ? JSON.parse(saved) : DEFAULT_MILESTONES;
  });

  const t = {
    en: { 
      title: "Fintech Launch Tracker", 
      progress: "Launch Progress",
      product: "Product",
      team: "Team", 
      funding: "Funding",
      growth: "Growth",
    },
    es: { 
      title: "Tracker de Lanzamiento Fintech", 
      progress: "Progreso de Lanzamiento",
      product: "Producto",
      team: "Equipo", 
      funding: "Financiamiento",
      growth: "Crecimiento",
    },
    pt: { 
      title: "Tracker de Lançamento Fintech", 
      progress: "Progresso de Lançamento",
      product: "Produto",
      team: "Equipe", 
      funding: "Financiamento",
      growth: "Crescimento",
    },
  }[language];

  const toggleMilestone = (id: string) => {
    const updated = milestones.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    setMilestones(updated);
    localStorage.setItem(`startup_milestones_${user?.id}`, JSON.stringify(updated));
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  const getMilestoneTitle = (m: Milestone) => {
    if (language === "es") return m.titleEs;
    if (language === "pt") return m.titlePt;
    return m.title;
  };

  const getCategoryLabel = (cat: string) => {
    return t[cat as keyof typeof t] || cat;
  };

  return (
    <Card className="border-studio-accent/20 bg-studio-section">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-studio-header flex items-center gap-2">
            <Rocket className="w-4 h-4 text-studio-cta" />
            {t.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            {completedCount}/{milestones.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-studio-muted">{t.progress}</span>
            <span className="font-medium text-studio-header">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-4 gap-2">
          {(["product", "team", "funding", "growth"] as const).map(cat => {
            const catMilestones = milestones.filter(m => m.category === cat);
            const catCompleted = catMilestones.filter(m => m.completed).length;
            const CatIcon = CATEGORIES[cat].icon;
            
            return (
              <div 
                key={cat}
                className={`p-2 rounded-lg text-center ${CATEGORIES[cat].colorClass}`}
              >
                <CatIcon className="w-4 h-4 mx-auto mb-1" />
                <p className="text-[10px] font-medium">{getCategoryLabel(cat)}</p>
                <p className="text-xs font-bold">{catCompleted}/{catMilestones.length}</p>
              </div>
            );
          })}
        </div>

        {/* Milestones list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {milestones.map(milestone => {
            const CatIcon = CATEGORIES[milestone.category].icon;
            return (
              <label
                key={milestone.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-studio-section-alt cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={milestone.completed}
                  onCheckedChange={() => toggleMilestone(milestone.id)}
                />
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${CATEGORIES[milestone.category].colorClass}`}>
                  <CatIcon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-sm flex-1 ${milestone.completed ? "line-through text-studio-muted" : "text-studio-header"}`}>
                  {getMilestoneTitle(milestone)}
                </span>
                {milestone.completed && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
