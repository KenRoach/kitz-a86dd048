import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, MessageCircle, MoreVertical, Pencil, Trash2, Send, CheckCircle, Clock, ImageIcon, Instagram, QrCode, Package, Hash, RotateCcw, Receipt, X, ZoomIn, ChefHat, PackageCheck, Truck } from "lucide-react";
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
import { Button } from "@/components/ui/button";

export type StorefrontStatus = "draft" | "sent" | "paid";
export type FulfillmentStatus = "pending" | "preparing" | "ready" | "complete";

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
  isBundle?: boolean;
  orderKey?: string | null;
  paymentProofUrl?: string | null;
  mode?: "invoice" | "quote";
  acceptedAt?: string | null;
  fulfillmentStatus?: FulfillmentStatus;
  delay?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onSend?: () => void;
  onMarkPaid?: () => void;
  onReorder?: () => void;
  onFulfillmentChange?: (status: FulfillmentStatus) => void;
}

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "bg-attention/10 text-attention" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-success/10 text-success" },
};

const fulfillmentConfig = {
  pending: { label: "Pending", color: "text-muted-foreground" },
  preparing: { label: "Preparing", color: "text-attention" },
  ready: { label: "Ready", color: "text-primary" },
  complete: { label: "Complete", color: "text-success" },
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
  isBundle = false,
  orderKey,
  paymentProofUrl,
  mode = "invoice",
  acceptedAt,
  fulfillmentStatus = "pending",
  delay = 0,
  onEdit,
  onDelete,
  onSend,
  onMarkPaid,
  onReorder,
  onFulfillmentChange,
}: StorefrontCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);

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
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const StatusIcon = statusConfig[status].icon;
  const hasOrder = !!buyerName;
  const hasPaymentProof = !!paymentProofUrl;

  return (
    <>
      <div
        className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden card-hover animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex">
          {/* Image or placeholder */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-muted flex items-center justify-center relative">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/30" />
            )}
            {isBundle && (
              <div className="absolute bottom-1 left-1 p-1 rounded-md bg-primary/90 text-primary-foreground">
                <Package className="w-3 h-3" />
              </div>
            )}
            {mode === "quote" && (
              <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-attention/90 text-white">
                Quote
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-2.5 sm:p-3 min-w-0">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">{title}</h4>
                  {orderKey && (
                    <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      <Hash className="w-2.5 h-2.5" />
                      {orderKey}
                    </span>
                  )}
                </div>
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
                    {hasPaymentProof && (
                      <DropdownMenuItem onClick={() => setProofDialogOpen(true)}>
                        <Receipt className="w-4 h-4 mr-2 text-action" />
                        View payment proof
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
                    {status === "paid" && onReorder && (
                      <DropdownMenuItem onClick={onReorder}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reorder
                      </DropdownMenuItem>
                    )}
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
              {status === "sent" && !hasPaymentProof && link && (
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
              {/* Payment proof indicator with verify button */}
              {status === "sent" && hasPaymentProof && (
                <button 
                  onClick={() => setProofDialogOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium bg-action/10 hover:bg-action/20 text-action px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-colors"
                >
                  <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>View proof</span>
                </button>
              )}
              {status === "paid" && fulfillmentStatus !== "complete" && onFulfillmentChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-colors flex items-center gap-1",
                      fulfillmentStatus === "pending" && "bg-muted text-muted-foreground hover:bg-muted/80",
                      fulfillmentStatus === "preparing" && "bg-attention/10 text-attention hover:bg-attention/20",
                      fulfillmentStatus === "ready" && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}>
                      {fulfillmentStatus === "pending" && <Clock className="w-3 h-3" />}
                      {fulfillmentStatus === "preparing" && <ChefHat className="w-3 h-3" />}
                      {fulfillmentStatus === "ready" && <PackageCheck className="w-3 h-3" />}
                      {fulfillmentConfig[fulfillmentStatus].label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 bg-card">
                    {fulfillmentStatus === "pending" && (
                      <DropdownMenuItem onClick={() => onFulfillmentChange("preparing")}>
                        <ChefHat className="w-4 h-4 mr-2 text-attention" />
                        Preparing
                      </DropdownMenuItem>
                    )}
                    {(fulfillmentStatus === "pending" || fulfillmentStatus === "preparing") && (
                      <DropdownMenuItem onClick={() => onFulfillmentChange("ready")}>
                        <PackageCheck className="w-4 h-4 mr-2 text-primary" />
                        Ready
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onFulfillmentChange("complete")}>
                      <CheckCircle className="w-4 h-4 mr-2 text-success" />
                      Complete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {status === "paid" && fulfillmentStatus === "complete" && (
                <span className="text-[10px] sm:text-xs text-success font-medium bg-success/10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Complete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-action" />
              Payment Proof
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order info */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium text-foreground">{title}</p>
                {buyerName && <p className="text-sm text-muted-foreground">From: {buyerName}</p>}
              </div>
              <span className="text-lg font-bold text-foreground">{price}</span>
            </div>
            
            {/* Proof image */}
            {paymentProofUrl && (
              <div className="relative group">
                <img 
                  src={paymentProofUrl} 
                  alt="Payment proof" 
                  className="w-full rounded-xl border border-border"
                />
                <a
                  href={paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-4 h-4" />
                </a>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setProofDialogOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setProofDialogOpen(false);
                  onMarkPaid?.();
                }}
                className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle className="w-4 h-4" />
                Verify & Mark Paid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
