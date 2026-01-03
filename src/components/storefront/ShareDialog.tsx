import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, QrCode, Check, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  link: string;
  title: string;
  price: number;
}

type ShareMethod = "whatsapp" | "copy" | "qr" | "native";

const SHARE_PREFERENCE_KEY = "lastShareMethod";

export function ShareDialog({ open, onClose, link, title, price }: ShareDialogProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastMethod, setLastMethod] = useState<ShareMethod>("whatsapp");

  useEffect(() => {
    const saved = localStorage.getItem(SHARE_PREFERENCE_KEY) as ShareMethod;
    if (saved) setLastMethod(saved);
  }, []);

  const savePreference = (method: ShareMethod) => {
    localStorage.setItem(SHARE_PREFERENCE_KEY, method);
    setLastMethod(method);
  };

  const handleWhatsApp = () => {
    savePreference("whatsapp");
    const message = `Check out ${title} for $${price.toFixed(2)}:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    onClose();
  };

  const handleCopy = () => {
    savePreference("copy");
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    savePreference("native");
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} for $${price.toFixed(2)}`,
          url: link,
        });
        onClose();
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleShowQR = () => {
    savePreference("qr");
    setShowQR(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Share your storefront</DialogTitle>
        </DialogHeader>

        {showQR ? (
          <div className="flex flex-col items-center py-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG value={link} size={180} level="H" includeMargin />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-bold text-foreground">${price.toFixed(2)}</p>
            <Button variant="ghost" onClick={() => setShowQR(false)} className="mt-3">
              Back to share options
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {/* Quick action - last used method */}
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">Quick share</p>
              {lastMethod === "whatsapp" && (
                <Button onClick={handleWhatsApp} className="w-full gap-2 bg-success hover:bg-success/90">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              )}
              {lastMethod === "copy" && (
                <Button onClick={handleCopy} className="w-full gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              )}
              {lastMethod === "native" && (
                <Button onClick={handleNativeShare} className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
              {lastMethod === "qr" && (
                <Button onClick={handleShowQR} className="w-full gap-2">
                  <QrCode className="w-4 h-4" />
                  Show QR Code
                </Button>
              )}
            </div>

            {/* All options */}
            <div className="grid grid-cols-2 gap-2">
              {lastMethod !== "whatsapp" && (
                <Button variant="outline" onClick={handleWhatsApp} className="gap-2">
                  <MessageCircle className="w-4 h-4 text-success" />
                  WhatsApp
                </Button>
              )}
              {lastMethod !== "copy" && (
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </Button>
              )}
              {lastMethod !== "qr" && (
                <Button variant="outline" onClick={handleShowQR} className="gap-2">
                  <QrCode className="w-4 h-4" />
                  QR
                </Button>
              )}
              {lastMethod !== "native" && navigator.share && (
                <Button variant="outline" onClick={handleNativeShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  More
                </Button>
              )}
            </div>

            <Button variant="ghost" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}