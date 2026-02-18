import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { MessageCircle, QrCode, Copy, Check, Share2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppQRProps {
  userId: string;
  businessPhone: string | null;
  businessName: string;
}

export function WhatsAppQR({ userId, businessPhone, businessName }: WhatsAppQRProps) {
  const { language } = useLanguage();
  const [phone, setPhone] = useState(businessPhone || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(!!businessPhone);

  const cleanPhone = phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${cleanPhone}`;
  const message = language === "es"
    ? `Hola! Escríbeme por WhatsApp 👋\n${waLink}`
    : `Hi! Message me on WhatsApp 👋\n${waLink}`;

  const savePhone = async () => {
    if (!cleanPhone || cleanPhone.length < 7) {
      toast.error(language === "es" ? "Número inválido" : "Invalid number");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    } else {
      toast.success(language === "es" ? "¡Número guardado!" : "Phone saved!");
      setShowQR(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    toast.success(language === "es" ? "Link copiado" : "Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, text: message, url: waLink });
      } catch { handleCopy(); }
    } else {
      handleCopy();
    }
  };

  if (!showQR) {
    return (
      <Card className="p-4 border-dashed border-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-medium">
                {language === "es" ? "Activa tu WhatsApp" : "Activate WhatsApp"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "es"
                  ? "Ingresa tu número de WhatsApp para generar un QR que tus clientes puedan escanear."
                  : "Enter your WhatsApp number to generate a QR code your customers can scan."}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="+507 6000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={savePhone} disabled={saving || !phone.trim()}>
                {saving
                  ? (language === "es" ? "Guardando..." : "Saving...")
                  : (language === "es" ? "Activar" : "Activate")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm">
          <QRCodeSVG value={waLink} size={160} level="H" includeMargin />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {language === "es"
            ? "Tus clientes escanean → abren WhatsApp contigo"
            : "Customers scan → open WhatsApp with you"}
        </p>
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (language === "es" ? "Copiado" : "Copied") : (language === "es" ? "Copiar link" : "Copy link")}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" />
            {language === "es" ? "Compartir" : "Share"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowQR(false)}>
          {language === "es" ? "Cambiar número" : "Change number"}
        </Button>
      </div>
    </Card>
  );
}
