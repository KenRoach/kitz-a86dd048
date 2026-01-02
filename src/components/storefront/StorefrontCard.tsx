import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Copy, MessageCircle, MoreVertical, Pencil, Trash2, Share2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type StorefrontStatus = "draft" | "shared" | "paid";

interface StorefrontCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  status: StorefrontStatus;
  link?: string;
  imageUrl?: string | null;
  comment?: string | null;
  delay?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const statusLabels = {
  draft: "Draft",
  shared: "Shared",
  paid: "Paid",
};

export function StorefrontCard({
  id,
  title,
  description,
  price,
  status,
  link,
  imageUrl,
  comment,
  delay = 0,
  onEdit,
  onDelete,
  onShare,
}: StorefrontCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link) {
      const message = `Hi! Check out ${title} for ${price}\n\n${description ? description + "\n\n" : ""}Order here: ${link}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  return (
    <>
      <div
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden card-hover animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-muted flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-medium text-foreground">{title}</h4>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
              )}
              {comment && (
                <p className="text-xs text-muted-foreground/70 mt-1 italic">{comment}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn("status-badge", `status-${status}`)}>
                {statusLabels[status]}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {status === "draft" && (
                    <DropdownMenuItem onClick={onShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {link && (
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
            <span className="text-lg font-semibold text-foreground">{price}</span>
            <div className="flex items-center gap-1">
              {status !== "draft" && link && (
                <>
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-2 rounded-lg hover:bg-success/10 transition-colors group"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </>
              )}
              {status === "draft" && (
                <button
                  onClick={onShare}
                  className="suggestion-pill text-xs"
                >
                  <Share2 className="w-3 h-3" />
                  Share now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete storefront?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
