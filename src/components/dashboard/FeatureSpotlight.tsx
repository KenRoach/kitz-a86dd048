import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  X,
  ArrowRight,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Instagram,
  Users,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

interface Feature {
  id: string;
  icon: React.ElementType;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  route: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    id: "pomodoro",
    icon: Clock,
    name: "Pomodoro Timer",
    nameEs: "Temporizador Pomodoro",
    description: "Focus for 25 minutes, then take a break",
    descriptionEs: "Enfócate 25 minutos, luego descansa",
    route: "/profile",
    color: "bg-rose-500/10 text-rose-500"
  },
  {
    id: "eisenhower",
    icon: Target,
    name: "Priority Matrix",
    nameEs: "Matriz de Prioridades",
    description: "Organize tasks by importance & urgency",
    descriptionEs: "Organiza tareas por importancia y urgencia",
    route: "/profile",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    id: "swot",
    icon: Brain,
    name: "SWOT Analysis",
    nameEs: "Análisis FODA",
    description: "Strategic planning for your business",
    descriptionEs: "Planificación estratégica para tu negocio",
    route: "/profile",
    color: "bg-violet-500/10 text-violet-500"
  },
  {
    id: "habits",
    icon: TrendingUp,
    name: "Habit Tracker",
    nameEs: "Seguimiento de Hábitos",
    description: "Build consistent daily routines",
    descriptionEs: "Crea rutinas diarias consistentes",
    route: "/profile",
    color: "bg-emerald-500/10 text-emerald-500"
  },
  {
    id: "calendar",
    icon: Calendar,
    name: "Content Calendar",
    nameEs: "Calendario de Contenido",
    description: "Plan your social media posts",
    descriptionEs: "Planifica tus publicaciones en redes",
    route: "/profile",
    color: "bg-amber-500/10 text-amber-500"
  },
  {
    id: "instagram",
    icon: Instagram,
    name: "Instagram Ideas",
    nameEs: "Ideas para Instagram",
    description: "AI-generated content suggestions",
    descriptionEs: "Sugerencias de contenido con IA",
    route: "/profile",
    color: "bg-pink-500/10 text-pink-500"
  },
  {
    id: "crm",
    icon: Users,
    name: "CRM Lite",
    nameEs: "CRM Lite",
    description: "Track your customer relationships",
    descriptionEs: "Gestiona relaciones con clientes",
    route: "/profile",
    color: "bg-cyan-500/10 text-cyan-500"
  }
];

interface FeatureSpotlightProps {
  className?: string;
  maxFeatures?: number;
}

export function FeatureSpotlight({ className, maxFeatures = 4 }: FeatureSpotlightProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [usedFeatures, setUsedFeatures] = useState<string[]>([]);

  useEffect(() => {
    // Check which features have been used
    const used: string[] = [];
    const keys = [
      "kitz_pomodoro_used",
      "kitz_eisenhower_used", 
      "kitz_swot_used",
      "kitz_habits_used",
      "kitz_calendar_used",
      "kitz_instagram_used",
      "kitz_crm_used"
    ];
    
    keys.forEach(key => {
      if (localStorage.getItem(key)) {
        used.push(key.replace("kitz_", "").replace("_used", ""));
      }
    });
    
    setUsedFeatures(used);
    
    // Check if spotlight is dismissed
    if (localStorage.getItem("kitz_feature_spotlight_dismissed")) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("kitz_feature_spotlight_dismissed", "true");
    setDismissed(true);
  };

  // Get features not yet used
  const unusedFeatures = FEATURES.filter(f => !usedFeatures.includes(f.id)).slice(0, maxFeatures);

  if (dismissed || unusedFeatures.length === 0) return null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {language === "es" ? "Herramientas que no has probado" : "Features you haven't tried"}
          </CardTitle>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {unusedFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.route)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all text-left group"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", feature.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {language === "es" ? feature.nameEs : feature.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {language === "es" ? feature.descriptionEs : feature.description}
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
