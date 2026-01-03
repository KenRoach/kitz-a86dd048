import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFabProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function MobileFab({ onClick, label = "New", className }: MobileFabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden",
        "flex items-center gap-2 px-6 py-4 rounded-full",
        "bg-primary text-primary-foreground font-semibold text-base",
        "shadow-lg shadow-primary/30 active:scale-95 transition-transform",
        className
      )}
    >
      <Plus className="w-5 h-5" />
      {label}
    </button>
  );
}
