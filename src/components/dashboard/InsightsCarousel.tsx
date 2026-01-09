import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

interface Insight {
  id: string;
  icon: React.ElementType;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  actionLabel?: string;
  actionLabelEs?: string;
  route?: string;
  color: string;
}

const INSIGHTS: Insight[] = [
  {
    id: "swot",
    icon: Target,
    title: "Plan with SWOT Analysis",
    titleEs: "Planifica con Análisis FODA",
    description: "Identify your Strengths, Weaknesses, Opportunities, and Threats to make strategic decisions.",
    descriptionEs: "Identifica tus Fortalezas, Oportunidades, Debilidades y Amenazas para decisiones estratégicas.",
    actionLabel: "Try SWOT",
    actionLabelEs: "Probar FODA",
    route: "/profile",
    color: "text-violet-500"
  },
  {
    id: "pomodoro",
    icon: Clock,
    title: "Stay Focused with Pomodoro",
    titleEs: "Mantente Enfocado con Pomodoro",
    description: "Use the 25-minute focus technique to boost your productivity by 40%.",
    descriptionEs: "Usa la técnica de enfoque de 25 minutos para aumentar tu productividad un 40%.",
    actionLabel: "Start Timer",
    actionLabelEs: "Iniciar Timer",
    route: "/profile",
    color: "text-rose-500"
  },
  {
    id: "eisenhower",
    icon: Target,
    title: "Prioritize with Eisenhower Matrix",
    titleEs: "Prioriza con la Matriz Eisenhower",
    description: "Sort tasks by urgency and importance to focus on what really matters.",
    descriptionEs: "Ordena tareas por urgencia e importancia para enfocarte en lo que importa.",
    actionLabel: "Try Matrix",
    actionLabelEs: "Probar Matriz",
    route: "/profile",
    color: "text-blue-500"
  },
  {
    id: "instagram",
    icon: Sparkles,
    title: "Get Instagram Content Ideas",
    titleEs: "Obtén Ideas para Instagram",
    description: "AI-powered content suggestions tailored to your business type.",
    descriptionEs: "Sugerencias de contenido con IA adaptadas a tu tipo de negocio.",
    actionLabel: "Generate Ideas",
    actionLabelEs: "Generar Ideas",
    route: "/profile",
    color: "text-pink-500"
  },
  {
    id: "crm",
    icon: Users,
    title: "Know Your Customers",
    titleEs: "Conoce a tus Clientes",
    description: "Track customer lifecycle from leads to repeat buyers in your CRM.",
    descriptionEs: "Sigue el ciclo de vida del cliente desde leads hasta compradores repetidos.",
    actionLabel: "View CRM",
    actionLabelEs: "Ver CRM",
    route: "/profile",
    color: "text-emerald-500"
  },
  {
    id: "4dx",
    icon: TrendingUp,
    title: "Set Wildly Important Goals",
    titleEs: "Establece Metas Importantes",
    description: "Focus on your WIG (Wildly Important Goal) and track lead measures weekly.",
    descriptionEs: "Enfócate en tu meta WIG y sigue las medidas predictivas semanalmente.",
    actionLabel: "Set WIG",
    actionLabelEs: "Establecer WIG",
    route: "/dashboard",
    color: "text-amber-500"
  }
];

interface InsightsCarouselProps {
  className?: string;
}

export function InsightsCarousel({ className }: InsightsCarouselProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % INSIGHTS.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const insight = INSIGHTS[currentIndex];
  const Icon = insight.icon;

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + INSIGHTS.length) % INSIGHTS.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % INSIGHTS.length);
  };

  const handleAction = () => {
    if (insight.route) {
      navigate(insight.route);
    }
  };

  return (
    <Card 
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {language === "es" ? "Consejo Pro" : "Pro Tip"}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {INSIGHTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === currentIndex ? "bg-primary w-3" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 animate-fade-in" key={insight.id}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            "bg-gradient-to-br from-muted to-muted/50"
          )}>
            <Icon className={cn("w-5 h-5", insight.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground mb-1">
              {language === "es" ? insight.titleEs : insight.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {language === "es" ? insight.descriptionEs : insight.description}
            </p>
            
            {insight.actionLabel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAction}
                className="mt-2 h-7 px-2 text-xs gap-1 -ml-2"
              >
                {language === "es" ? insight.actionLabelEs : insight.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button 
              onClick={goToPrev}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button 
              onClick={goToNext}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
