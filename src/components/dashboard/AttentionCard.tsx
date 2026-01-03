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
    bg: "bg-action/10",
    text: "text-action",
    iconBg: "bg-action",
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
      className="bg-card rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onAction}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.iconBg)}>
          <Icon className="w-5 h-5 text-card" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-action shrink-0">
          <span className="text-xs font-medium hidden sm:block">{action}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}