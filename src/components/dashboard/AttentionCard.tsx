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
      className="neu-card-flat p-4 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in group"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onAction}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors.iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium hidden sm:block">{action}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}