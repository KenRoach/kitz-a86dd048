import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface LevelDisplayProps {
  level: number;
  xp: number;
  progress: {
    current: number;
    next: number;
    percent: number;
  };
  size?: "sm" | "lg";
}

export function LevelDisplay({ level, xp, progress, size = "lg" }: LevelDisplayProps) {
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return "Master";
    if (lvl >= 7) return "Expert";
    if (lvl >= 5) return "Pro";
    if (lvl >= 3) return "Rising";
    return "Starter";
  };

  const getLevelColor = (lvl: number) => {
    if (lvl >= 10) return "from-purple-500 to-pink-500";
    if (lvl >= 7) return "from-amber-400 to-orange-500";
    if (lvl >= 5) return "from-blue-400 to-cyan-500";
    if (lvl >= 3) return "from-green-400 to-emerald-500";
    return "from-zinc-400 to-zinc-500";
  };

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
          getLevelColor(level)
        )}>
          {level}
        </div>
        <div className="flex-1">
          <Progress value={progress.percent} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-muted/30 rounded-2xl p-6 border border-border/50">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
          getLevelColor(level)
        )}>
          <span className="text-2xl font-bold text-white">{level}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{getLevelTitle(level)}</h3>
            <div className="flex">
              {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
                <Star 
                  key={i} 
                  className="w-4 h-4 text-amber-400 fill-amber-400" 
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress value={progress.percent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.current} / {progress.next} XP to Level {level + 1}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total XP</span>
        <span className="font-semibold">{xp.toLocaleString()}</span>
      </div>
    </div>
  );
}
