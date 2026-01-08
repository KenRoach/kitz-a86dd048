import { use4DX } from "@/hooks/use4DX";
import { useLanguage } from "@/hooks/useLanguage";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Store, Users, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function FourDXWidget() {
  const { t, language } = useLanguage();
  const { goals, wigProgress, leadMeasures, commitments, loading } = use4DX();
  const navigate = useNavigate();

  if (loading || !goals) return null;

  const getProgressStatus = () => {
    if (!wigProgress) return { text: t.onTrack, color: "text-muted-foreground", bg: "bg-muted" };
    if (wigProgress.percentage >= 100) return { text: t.aheadOfPace, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" };
    
    const now = new Date();
    let expectedPercent = 50;
    
    if (goals.wig_period === 'weekly') {
      const dayOfWeek = now.getDay() || 7;
      expectedPercent = (dayOfWeek / 7) * 100;
    } else if (goals.wig_period === 'monthly') {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      expectedPercent = (dayOfMonth / daysInMonth) * 100;
    }
    
    if (wigProgress.percentage >= expectedPercent) {
      return { text: t.onTrack, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" };
    }
    return { text: t.behindPace, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" };
  };

  const status = getProgressStatus();
  const completedCommitments = commitments.filter(c => c.completed).length;
  const storefrontProgress = ((leadMeasures?.storefrontsCreated || 0) / (goals.storefronts_target || 5)) * 100;
  const followupProgress = ((leadMeasures?.followupsCompleted || 0) / (goals.followups_target || 10)) * 100;

  return (
    <div 
      onClick={() => navigate("/admin")}
      className="bg-card rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{t.wig}</h3>
            <p className="text-[10px] text-muted-foreground capitalize">{goals.wig_period}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px]", status.color, status.bg)}>
            {status.text}
          </Badge>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* WIG Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-primary" />
            <span className="font-medium">
              {goals.wig_type === 'revenue' ? '$' : ''}
              {wigProgress?.current.toLocaleString() || 0}
            </span>
            <span className="text-muted-foreground">
              / {goals.wig_type === 'revenue' ? '$' : ''}{wigProgress?.target.toLocaleString() || 0}
            </span>
          </div>
          <span className="font-semibold text-primary">
            {Math.round(wigProgress?.percentage || 0)}%
          </span>
        </div>
        <Progress value={wigProgress?.percentage || 0} className="h-2" />
      </div>

      {/* Lead Measures - Compact */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Store className="w-3 h-3 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.min(storefrontProgress, 100)}%` }} 
              />
            </div>
          </div>
          <span className="text-[10px] font-medium shrink-0">
            {leadMeasures?.storefrontsCreated || 0}/{goals.storefronts_target}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Users className="w-3 h-3 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.min(followupProgress, 100)}%` }} 
              />
            </div>
          </div>
          <span className="text-[10px] font-medium shrink-0">
            {leadMeasures?.followupsCompleted || 0}/{goals.followups_target}
          </span>
        </div>
      </div>

      {/* Commitments count */}
      {commitments.length > 0 && (
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">{t.weeklyCommitments}</span>
          <Badge variant="secondary" className="text-[10px]">
            {completedCommitments}/{commitments.length}
          </Badge>
        </div>
      )}
    </div>
  );
}
