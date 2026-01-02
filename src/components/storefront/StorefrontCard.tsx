import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Copy, MessageCircle, MoreVertical, Pencil, Trash2, Send, CheckCircle, Clock, ImageIcon } from "lucide-react";
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

export type StorefrontStatus = "draft" | "sent" | "paid";

interface StorefrontCardProps {
  id: string;
  title: string;
  price: string;
  status: StorefrontStatus;
  customerName?: string | null;
  quantity?: number;
  link?: string;
  imageUrl?: string | null;
  delay?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onSend?: () => void;
  onMarkPaid?: () => void;
}

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "bg-attention/10 text-attention" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-success/10 text-success" },
};

export function StorefrontCard({
  id,
  title,
  price,
  status,
  customerName,
  quantity = 1,
  link,
  imageUrl,
  delay = 0,
  onEdit,
  onDelete,
  onSend,
  onMarkPaid,
}: StorefrontCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopyLink = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  const handleWhatsAppShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (link) {
      const message = customerName
        ? `Hi ${customerName}! Here is your order for ${title} (${price}):\n\n${link}`
        : `Check out ${title} for ${price}:\n\n${link}`;
      window.open(`https://wa.me/${customerName ? "" : ""}?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <>
      <div
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden card-hover animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex">
          {/* Image or placeholder */}
          <div className="w-20 h-20 flex-shrink-0 bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-foreground truncate">{title}</h4>
                {customerName && (
                  <p className="text-xs text-muted-foreground truncate">For: {customerName}</p>
                )}
                {quantity > 1 && (
                  <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={cn("status-badge flex items-center gap-1", statusConfig[status].color)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[status].label}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {status === "draft" && (
                      <DropdownMenuItem onClick={onSend}>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </DropdownMenuItem>
                    )}
                    {status === "sent" && (
                      <DropdownMenuItem onClick={onMarkPaid}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as paid
                      </DropdownMenuItem>
                    )}
                    {link && status !== "draft" && (
                      <>
                        <DropdownMenuItem onClick={() => handleWhatsAppShare()}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink()}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-semibold text-foreground">{price}</span>
              {status === "draft" && (
                <button onClick={onSend} className="suggestion-pill text-xs py-1">
                  <Send className="w-3 h-3" />
                  Send now
                </button>
              )}
              {status === "sent" && link && (
                <div className="flex gap-1">
                  <button onClick={handleWhatsAppShare} className="p-1.5 rounded hover:bg-success/10 transition-colors" title="WhatsApp">
                    <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-success" />
                  </button>
                  <button onClick={handleCopyLink} className="p-1.5 rounded hover:bg-muted transition-colors" title="Copy">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              {status === "paid" && (
                <span className="text-xs text-success font-medium">Completed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete storefront?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleteDialogOpen(false); onDelete?.(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
