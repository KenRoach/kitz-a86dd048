import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, Download, Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface ProfileQRCodeProps {
  url: string;
  businessName: string;
  logoUrl?: string | null;
  language?: "en" | "es";
}

export function ProfileQRCode({ url, businessName, logoUrl, language = "en" }: ProfileQRCodeProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 40;
    const size = 512;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 60; // Extra space for text

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, padding, padding, size, size);

      // Draw business name
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(businessName, canvas.width / 2, size + padding + 40);

      // Download
      const link = document.createElement("a");
      link.download = `${businessName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      URL.revokeObjectURL(svgUrl);
      toast.success(language === "es" ? "QR descargado!" : "QR downloaded!");
    };
    img.src = svgUrl;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: language === "es" 
            ? `Visita mi perfil de negocio: ${businessName}` 
            : `Check out my business profile: ${businessName}`,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(language === "es" ? "Enlace copiado!" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
        >
          <QrCode className="w-4 h-4 mr-1" />
          QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {language === "es" ? "Tu código QR" : "Your QR Code"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div 
            ref={qrRef}
            className="p-6 bg-white rounded-2xl shadow-lg"
          >
            <QRCodeSVG
              value={url}
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={logoUrl ? {
                src: logoUrl,
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              } : undefined}
            />
          </div>

          {/* Business Name */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{businessName}</h3>
            <p className="text-sm text-muted-foreground truncate max-w-[250px]">
              {url.replace(/^https?:\/\//, '')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleDownload}
              className="flex-1"
              variant="default"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "es" ? "Descargar" : "Download"}
            </Button>
            <Button 
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {language === "es" ? "Compartir" : "Share"}
            </Button>
          </div>

          <Button 
            onClick={handleCopyLink}
            variant="ghost"
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                {language === "es" ? "¡Copiado!" : "Copied!"}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                {language === "es" ? "Copiar enlace" : "Copy Link"}
              </>
            )}
          </Button>

          {/* Tip */}
          <p className="text-xs text-center text-muted-foreground px-4">
            {language === "es" 
              ? "Imprime este QR para que tus clientes puedan escanearlo y ver tu perfil" 
              : "Print this QR so customers can scan it to view your profile"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
