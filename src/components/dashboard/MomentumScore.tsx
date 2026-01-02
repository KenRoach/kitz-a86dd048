import { cn } from "@/lib/utils";

interface MomentumScoreProps {
  score: number;
}

export function MomentumScore({ score }: MomentumScoreProps) {
  const getColor = () => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-attention";
    return "text-destructive";
  };

  const getStrokeColor = () => {
    if (score >= 70) return "stroke-success";
    if (score >= 40) return "stroke-attention";
    return "stroke-destructive";
  };

  const getBgColor = () => {
    if (score >= 70) return "bg-success/10";
    if (score >= 40) return "bg-attention/10";
    return "bg-destructive/10";
  };

  const getMessage = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good progress";
    if (score >= 40) return "Building up";
    return "Needs focus";
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="neu-card-flat p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">Momentum</h3>
        <span className={cn("text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full", getBgColor(), getColor())}>
          {getMessage()}
        </span>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0">
          <svg className="w-16 h-16 sm:w-24 sm:h-24 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="8"
              className="stroke-muted"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn("transition-all duration-1000 ease-out", getStrokeColor())}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-xl sm:text-3xl font-bold", getColor())}>
              {score}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">Low</span>
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000", 
                score >= 70 ? "bg-success" : score >= 40 ? "bg-attention" : "bg-destructive"
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Based on activity & conversions
          </p>
        </div>
      </div>
    </div>
  );
}