import { 
  Rocket, Store, Package, Boxes, DollarSign, TrendingUp, 
  Trophy, Banknote, Gem, Flame, Zap, Crown, UserCheck, 
  Users, Network, Award, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge as BadgeData } from "@/hooks/useBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap: Record<string, LucideIcon> = {
  rocket: Rocket,
  store: Store,
  package: Package,
  boxes: Boxes,
  "dollar-sign": DollarSign,
  "trending-up": TrendingUp,
  trophy: Trophy,
  banknote: Banknote,
  gem: Gem,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  "user-check": UserCheck,
  users: Users,
  network: Network,
};

const levelColors: Record<number, string> = {
  1: "from-zinc-400 to-zinc-500",
  2: "from-blue-400 to-blue-600",
  3: "from-amber-400 to-amber-600",
};

const levelBgColors: Record<number, string> = {
  1: "bg-zinc-100 dark:bg-zinc-800",
  2: "bg-blue-50 dark:bg-blue-900/30",
  3: "bg-amber-50 dark:bg-amber-900/30",
};

interface BadgeIconProps {
  badge: BadgeData;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function BadgeIcon({ badge, earned = false, size = "md", showTooltip = true }: BadgeIconProps) {
  const { language } = useLanguage();
  const Icon = iconMap[badge.icon] || Award;
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const name = language === "es" ? badge.name_es : badge.name;
  const description = language === "es" ? badge.description_es : badge.description;

  const content = (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all",
        sizeClasses[size],
        earned
          ? `bg-gradient-to-br ${levelColors[badge.level]} shadow-lg`
          : "bg-muted/50 opacity-40 grayscale"
      )}
    >
      <Icon className={cn(iconSizes[size], earned ? "text-white" : "text-muted-foreground")} />
      {earned && badge.level >= 2 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center text-[10px] font-bold border-2 border-current">
          {badge.level}
        </div>
      )}
    </div>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {!earned && (
          <p className="text-xs text-primary mt-1">+{badge.points_required} XP</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface BadgeCardProps {
  badge: BadgeData;
  earned?: boolean;
  earnedAt?: string;
}

export function BadgeCard({ badge, earned = false, earnedAt }: BadgeCardProps) {
  const { language } = useLanguage();
  
  const name = language === "es" ? badge.name_es : badge.name;
  const description = language === "es" ? badge.description_es : badge.description;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        earned
          ? `${levelBgColors[badge.level]} border-primary/20`
          : "bg-muted/30 border-border/50 opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <BadgeIcon badge={badge} earned={earned} size="md" showTooltip={false} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          {earned && earnedAt && (
            <p className="text-[10px] text-primary mt-1">
              {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!earned && (
            <p className="text-[10px] text-muted-foreground mt-1">
              +{badge.points_required} XP
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
