import { cn } from "@/lib/utils";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export type StorefrontStatus = "draft" | "shared" | "paid";

interface StorefrontCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  status: StorefrontStatus;
  link?: string;
  delay?: number;
}

const statusLabels = {
  draft: "Draft",
  shared: "Shared",
  paid: "Paid",
};

export function StorefrontCard({
  title,
  description,
  price,
  status,
  link,
  delay = 0,
}: StorefrontCardProps) {
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div
      className="action-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <span className={cn("status-badge", `status-${status}`)}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-lg font-semibold text-foreground">{price}</span>
        <div className="flex items-center gap-2">
          {link && (
            <>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
