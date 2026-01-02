import { cn } from "@/lib/utils";
import { DollarSign, MessageCircle, Clock, CheckCircle } from "lucide-react";

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
  payment: "bg-attention/10 text-attention border-attention/20",
  followup: "bg-primary/10 text-primary border-primary/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  confirm: "bg-success/10 text-success border-success/20",
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

  return (
    <div
      className="action-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onAction}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-2.5 rounded-xl border", colorMap[type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span className="suggestion-pill">{action}</span>
      </div>
    </div>
  );
}
