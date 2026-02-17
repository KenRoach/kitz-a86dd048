import { useState, useEffect } from "react";
import { Sparkles, MessageCircle, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface AiFloatingButtonProps {
  onClick: () => void;
}

// Standard tips
const TIPS_EN = [
  "Ask about revenue trends",
  "Get product insights",
  "Analyze customer behavior",
  "Boost your sales",
];

const TIPS_ES = [
  "Pregunta sobre ingresos",
  "Obtén insights de productos", 
  "Analiza comportamiento",
  "Aumenta tus ventas",
];

// Proactive feature suggestions based on unused features
const PROACTIVE_TIPS_EN = [
  "Try the Pomodoro timer for focus!",
  "Set your weekly goals with 4DX",
  "Use SWOT to plan your quarter",
  
  "Get Instagram content ideas with AI",
];

const PROACTIVE_TIPS_ES = [
  "¡Prueba el Pomodoro para enfocarte!",
  "Establece metas semanales con 4DX",
  "Usa FODA para planificar tu trimestre",
  
  "Obtén ideas para Instagram con IA",
];

export function AiFloatingButton({ onClick }: AiFloatingButtonProps) {
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [useProactive, setUseProactive] = useState(false);

  // Check for unused features and occasionally show proactive tips
  useEffect(() => {
    const unusedFeatures = [
      !localStorage.getItem("kitz_pomodoro_used"),
      !localStorage.getItem("kitz_goals_set"),
      !localStorage.getItem("kitz_swot_used"),
      !localStorage.getItem("kitz_instagram_used"),
    ].filter(Boolean).length;

    // If user has unused features, occasionally show proactive tips
    if (unusedFeatures > 2) {
      setUseProactive(Math.random() > 0.5);
    }
  }, []);

  const tips = useProactive 
    ? (language === "es" ? PROACTIVE_TIPS_ES : PROACTIVE_TIPS_EN)
    : (language === "es" ? TIPS_ES : TIPS_EN);

  // Rotate tips and show periodically
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
    }, 10000);

    const rotateInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);

    // Show first tip after 2 seconds
    const initialTimeout = setTimeout(() => setShowTip(true), 2000);
    const hideInitialTip = setTimeout(() => setShowTip(false), 5000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(rotateInterval);
      clearTimeout(initialTimeout);
      clearTimeout(hideInitialTip);
    };
  }, [tips.length]);

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[9999]" aria-label="AI Business Advisor">
      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full right-0 mb-3 transition-all duration-300 pointer-events-none",
          (showTip || isHovered) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        <div className="relative bg-card border border-border rounded-2xl px-4 py-3 shadow-lg min-w-[180px]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span>{tips[tipIndex]}</span>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
        </div>
      </div>

      {/* Glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-16 h-16 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-20 h-20 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Main button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={language === "es" ? "Abrir Asesor de Negocios IA" : "Open AI Business Advisor"}
        className={cn(
          "relative group h-16 w-16 rounded-full overflow-hidden",
          "bg-gradient-to-br from-primary via-primary to-primary/80",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          "md:h-14 md:w-14"
        )}
        style={{
          boxShadow: isHovered 
            ? '0 0 30px hsl(var(--primary) / 0.5), 0 10px 40px hsl(var(--primary) / 0.3)'
            : '0 4px 20px hsl(var(--primary) / 0.3)'
        }}
      >
        {/* Animated background gradient */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-tr from-primary via-violet-400 to-fuchsia-500",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          )}
        />

        {/* Shine effect */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
            "translate-x-[-100%] group-hover:translate-x-[100%]",
            "transition-transform duration-700 ease-in-out"
          )}
        />

        {/* Icon container */}
        <div className="relative z-10 flex items-center justify-center h-full w-full">
          {/* Sparkles icon - default */}
          <Sparkles 
            className={cn(
              "h-6 w-6 text-primary-foreground transition-all duration-300",
              isHovered ? "scale-0 rotate-180" : "scale-100 rotate-0"
            )}
          />
          
          {/* Message icon - on hover */}
          <MessageCircle 
            className={cn(
              "absolute h-6 w-6 text-primary-foreground transition-all duration-300",
              isHovered ? "scale-100 rotate-0" : "scale-0 -rotate-180"
            )}
          />
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute w-2 h-2 bg-white/60 rounded-full"
            style={{
              animation: 'orbit 3s linear infinite',
              top: '50%',
              left: '50%',
              transformOrigin: '-12px center',
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
            style={{
              animation: 'orbit 4s linear infinite reverse',
              top: '50%',
              left: '50%',
              transformOrigin: '-16px center',
            }}
          />
        </div>
      </button>

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
      </div>

      <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(24px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(24px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}
