import { cn } from "@/lib/utils";

interface MomentumScoreProps {
  score: number;
}

export function MomentumScore({ score }: MomentumScoreProps) {
  const getColor = () => {
    if (score >= 70) return "text-momentum-high";
    if (score >= 40) return "text-momentum-mid";
    return "text-momentum-low";
  };

  const getStrokeColor = () => {
    if (score >= 70) return "stroke-momentum-high";
    if (score >= 40) return "stroke-momentum-mid";
    return "stroke-momentum-low";
  };

  const getMessage = () => {
    if (score >= 80) return "Excellent momentum";
    if (score >= 60) return "Good progress";
    if (score >= 40) return "Building momentum";
    return "Needs attention";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn("transition-all duration-700", getStrokeColor())}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-3xl font-semibold", getColor())}>
              {score}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">Momentum</h3>
          <p className="text-sm text-muted-foreground mt-1">{getMessage()}</p>
        </div>
      </div>
    </div>
  );
}
