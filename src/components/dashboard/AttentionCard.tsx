import { cn } from "@/lib/utils";
import { DollarSign, MessageCircle, Clock, CheckCircle, ArrowRight } from "lucide-react";

export type AttentionType = "payment" | "followup" | "urgent" | "confirm";

interface AttentionCardProps {
  type: AttentionType;
  title: string;
  description: string;
  action: string;
  onAction?: () => void;
  delay?: number;
}

const iconMap = {
  payment: DollarSign,
  followup: MessageCircle,
  urgent: Clock,
  confirm: CheckCircle,
};

const colorMap = {
  payment: {
    bg: "bg-attention/10",
    text: "text-attention",
    iconBg: "bg-attention",
  },
  followup: {
    bg: "bg-primary/10",
    text: "text-primary",
    iconBg: "bg-primary",
  },
  urgent: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    iconBg: "bg-destructive",
  },
  confirm: {
    bg: "bg-success/10",
    text: "text-success",
    iconBg: "bg-success",
  },
};

export function AttentionCard({
  type,
  title,
  description,
  action,
  onAction,
  delay = 0,
}: AttentionCardProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <div
      className="neu-card-flat p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in group"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onAction}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0", colors.iconBg)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm sm:text-base">{title}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-primary shrink-0">
          <span className="text-xs sm:text-sm font-medium hidden sm:block">{action}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}