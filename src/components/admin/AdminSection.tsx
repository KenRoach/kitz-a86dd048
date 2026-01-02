import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface AdminSectionProps {
  title: string;
  description: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function AdminSection({ title, description, children, onClick }: AdminSectionProps) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full action-card text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h4 className="font-medium text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  );
}
