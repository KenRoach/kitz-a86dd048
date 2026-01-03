import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, MessageCircle, MoreVertical, Pencil, Trash2, Send, CheckCircle, Clock, ImageIcon, Instagram, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  buyerName?: string | null;
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
  buyerName,
  delay = 0,
  onEdit,
  onDelete,
  onSend,
  onMarkPaid,
}: StorefrontCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const handleCopyLink = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied! Share it anywhere.");
    }
  };

  const handleWhatsAppShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (link) {
      const message = customerName
        ? `Hi ${customerName}! Here's your order for ${title} (${price}):\n\n${link}`
        : `Check out ${title} for ${price}:\n\n${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const handleInstagramShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Instagram doesn't have a direct share URL, so we copy the link and inform the user
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied! Paste it in your Instagram DM.");
    }
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (link && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out ${title} for ${price}`,
          url: link,
        });
      } catch (err) {
        // User cancelled or error
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const StatusIcon = statusConfig[status].icon;
  const hasOrder = !!buyerName;

  return (
    <>
      <div
        className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden card-hover animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex">
          {/* Image or placeholder */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/30" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-2.5 sm:p-3 min-w-0">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">{title}</h4>
                {customerName && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">For: {customerName}</p>
                )}
                {buyerName && status === "sent" && (
                  <p className="text-[10px] sm:text-xs text-primary truncate">Ordered: {buyerName}</p>
                )}
                {quantity > 1 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Qty: {quantity}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={cn("status-badge flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", statusConfig[status].color)}>
                  <StatusIcon className="w-3 h-3" />
                  {hasOrder && status === "sent" ? "Ordered" : statusConfig[status].label}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-card">
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
                          <MessageCircle className="w-4 h-4 mr-2 text-success" />
                          Share via WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInstagramShare()}>
                          <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                          Share via Instagram
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setQrDialogOpen(true)}>
                          <QrCode className="w-4 h-4 mr-2" />
                          Show QR code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink()}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1.5 sm:mt-2">
              <span className="text-base sm:text-lg font-bold text-foreground">{price}</span>
              {status === "draft" && (
                <button onClick={onSend} className="suggestion-pill text-[10px] sm:text-xs py-1 px-2 sm:py-1.5 sm:px-3">
                  <Send className="w-3 h-3" />
                  <span className="hidden sm:inline">Send now</span>
                  <span className="sm:hidden">Send</span>
                </button>
              )}
              {status === "sent" && link && (
                <div className="flex gap-1">
                  <button 
                    onClick={handleWhatsAppShare} 
                    className="p-1.5 sm:p-2 rounded-lg bg-success/10 hover:bg-success/20 transition-colors" 
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                  </button>
                  <button 
                    onClick={() => setQrDialogOpen(true)} 
                    className="p-1.5 sm:p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" 
                    title="QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </button>
                  <button 
                    onClick={handleCopyLink} 
                    className="p-1.5 sm:p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors" 
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              {status === "paid" && (
                <span className="text-[10px] sm:text-xs text-success font-semibold bg-success/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">Completed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG 
                value={link || ""} 
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Scan to view and order
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{price}</p>
            <button
              onClick={handleCopyLink}
              className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Copy className="w-4 h-4" />
              Copy link
            </button>
          </div>
        </DialogContent>
      </Dialog>

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