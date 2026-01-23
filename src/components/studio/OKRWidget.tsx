import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Target, 
  Plus,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OKRWidgetProps {
  language: "en" | "es" | "pt";
}

interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
}

interface Objective {
  id: string;
  title: string;
  keyResults: KeyResult[];
}

export function OKRWidget({ language }: OKRWidgetProps) {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`studio_okrs_${user?.id}`);
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        title: language === "es" ? "Lanzar MVP de fintech" : language === "pt" ? "Lançar MVP de fintech" : "Launch Fintech MVP",
        keyResults: [
          { id: "kr1", title: language === "es" ? "Usuarios beta" : language === "pt" ? "Usuários beta" : "Beta users", current: 25, target: 100 },
          { id: "kr2", title: language === "es" ? "Funciones core" : language === "pt" ? "Funções core" : "Core features", current: 3, target: 5 },
        ]
      },
      {
        id: "2", 
        title: language === "es" ? "Escalar estudio de animación" : language === "pt" ? "Escalar estúdio de animação" : "Scale Animation Studio",
        keyResults: [
          { id: "kr3", title: language === "es" ? "Proyectos mensuales" : language === "pt" ? "Projetos mensais" : "Monthly projects", current: 4, target: 8 },
          { id: "kr4", title: language === "es" ? "Ingresos ($K)" : language === "pt" ? "Receita ($K)" : "Revenue ($K)", current: 15, target: 30 },
        ]
      }
    ];
  });
  const [newObjective, setNewObjective] = useState("");

  const t = {
    en: { title: "OKRs", addObj: "Add Objective", quarter: "Q1 2025" },
    es: { title: "OKRs", addObj: "Agregar Objetivo", quarter: "T1 2025" },
    pt: { title: "OKRs", addObj: "Adicionar Objetivo", quarter: "T1 2025" },
  }[language];

  const saveObjectives = (newObjs: Objective[]) => {
    setObjectives(newObjs);
    localStorage.setItem(`studio_okrs_${user?.id}`, JSON.stringify(newObjs));
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const newObj: Objective = {
      id: Date.now().toString(),
      title: newObjective,
      keyResults: [],
    };
    saveObjectives([...objectives, newObj]);
    setNewObjective("");
  };

  const updateKeyResult = (objId: string, krId: string, newCurrent: number) => {
    const updated = objectives.map(obj => {
      if (obj.id === objId) {
        return {
          ...obj,
          keyResults: obj.keyResults.map(kr => 
            kr.id === krId ? { ...kr, current: Math.min(newCurrent, kr.target) } : kr
          )
        };
      }
      return obj;
    });
    saveObjectives(updated);
  };

  const deleteObjective = (objId: string) => {
    saveObjectives(objectives.filter(o => o.id !== objId));
  };

  const getObjectiveProgress = (obj: Objective) => {
    if (obj.keyResults.length === 0) return 0;
    const total = obj.keyResults.reduce((sum, kr) => sum + (kr.current / kr.target) * 100, 0);
    return Math.round(total / obj.keyResults.length);
  };

  return (
    <Card className="border-studio-accent/20 bg-studio-section">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-studio-header flex items-center gap-2">
            <Target className="w-4 h-4 text-studio-cta" />
            {t.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">{t.quarter}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {objectives.map(obj => {
          const progress = getObjectiveProgress(obj);
          return (
            <div key={obj.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-studio-header flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-studio-cta" />
                  {obj.title}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={progress >= 70 ? "default" : progress >= 40 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {progress}%
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => deleteObjective(obj.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              
              <div className="pl-5 space-y-2">
                {obj.keyResults.map(kr => {
                  const krProgress = Math.round((kr.current / kr.target) * 100);
                  return (
                    <div key={kr.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted">{kr.title}</span>
                        <button 
                          className="font-mono text-studio-header hover:text-studio-cta"
                          onClick={() => updateKeyResult(obj.id, kr.id, kr.current + 1)}
                        >
                          {kr.current}/{kr.target}
                        </button>
                      </div>
                      <Progress value={krProgress} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add new objective */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            placeholder={t.addObj}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addObjective()}
          />
          <Button size="sm" onClick={addObjective} className="h-8 bg-studio-cta hover:bg-studio-cta/90">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
