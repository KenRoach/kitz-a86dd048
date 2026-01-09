import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({ 
  content, 
  side = "top", 
  className,
  iconClassName 
}: HelpTooltipProps) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={cn(
            "inline-flex items-center justify-center rounded-full hover:bg-muted p-0.5 transition-colors",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className={cn("w-3.5 h-3.5 text-muted-foreground", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[250px] text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
