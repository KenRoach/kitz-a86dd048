import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Store, 
  Phone, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft,
  User,
  Check,
  Sparkles
} from "lucide-react";

interface ProfileSetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

interface FormData {
  businessName: string;
  businessType: string;
  phone: string;
  username: string;
  paymentCash: boolean;
  paymentCards: boolean;
  paymentYappy: boolean;
}

const steps = [
  { id: "business", icon: Store },
  { id: "contact", icon: Phone },
  { id: "payments", icon: CreditCard },
];

export function ProfileSetupWizard({ open, onComplete }: ProfileSetupWizardProps) {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: profile?.business_name || "",
    businessType: profile?.business_type || "",
    phone: profile?.phone || "",
    username: profile?.username || "",
    paymentCash: profile?.payment_cash ?? true,
    paymentCards: profile?.payment_cards ?? false,
    paymentYappy: profile?.payment_yappy ?? false,
  });

  const t = {
    en: {
      setupTitle: "Set up your business",
      setupSubtitle: "Just a few details to get started",
      businessStep: "Business",
      contactStep: "Contact",
      paymentsStep: "Payments",
      businessName: "Business name",
      businessNamePlaceholder: "Maria's Bakery",
      businessType: "What do you sell?",
      businessTypePlaceholder: "Cakes, pastries, bread...",
      whatsappPhone: "WhatsApp number",
      whatsappPhonePlaceholder: "+507 6000-0000",
      whatsappTip: "Customers will contact you here",
      username: "Your profile link",
      usernamePrefix: "kitz.app/p/",
      usernamePlaceholder: "mariasbakery",
      usernameTip: "Share this link to showcase your business",
      paymentsTitle: "How do you accept payments?",
      paymentsTip: "Select all that apply",
      cash: "Cash",
      cards: "Credit / Debit cards",
      yappy: "Yappy",
      back: "Back",
      next: "Next",
      finish: "Let's go!",
      allSet: "You're all set!",
      welcomeMessage: "Your business profile is ready. Start creating storefronts and sharing with customers.",
    },
    es: {
      setupTitle: "Configura tu negocio",
      setupSubtitle: "Solo unos detalles para empezar",
      businessStep: "Negocio",
      contactStep: "Contacto",
      paymentsStep: "Pagos",
      businessName: "Nombre del negocio",
      businessNamePlaceholder: "Panadería María",
      businessType: "¿Qué vendes?",
      businessTypePlaceholder: "Pasteles, repostería, pan...",
      whatsappPhone: "Número de WhatsApp",
      whatsappPhonePlaceholder: "+507 6000-0000",
      whatsappTip: "Los clientes te contactarán aquí",
      username: "Tu enlace de perfil",
      usernamePrefix: "kitz.app/p/",
      usernamePlaceholder: "panaderiamaria",
      usernameTip: "Comparte este enlace para mostrar tu negocio",
      paymentsTitle: "¿Cómo aceptas pagos?",
      paymentsTip: "Selecciona todos los que apliquen",
      cash: "Efectivo",
      cards: "Tarjetas de crédito / débito",
      yappy: "Yappy",
      back: "Atrás",
      next: "Siguiente",
      finish: "¡Vamos!",
      allSet: "¡Todo listo!",
      welcomeMessage: "Tu perfil de negocio está listo. Comienza a crear vitrinas y comparte con tus clientes.",
    }
  }[language];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        business_name: formData.businessName,
        business_type: formData.businessType,
        phone: formData.phone,
        username: formData.username.toLowerCase().replace(/[^a-z0-9]/g, ""),
        payment_cash: formData.paymentCash,
        payment_cards: formData.paymentCards,
        payment_yappy: formData.paymentYappy,
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error(language === "es" 
          ? "Este nombre de usuario ya está en uso" 
          : "This username is already taken");
      } else {
        toast.error(error.message);
      }
      return;
    }

    localStorage.setItem("kitz_profile_setup_complete", "true");
    toast.success(t.allSet);
    onComplete();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.businessName.trim().length > 0;
      case 1:
        return formData.phone.trim().length > 0;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" hideClose>
        {/* Progress indicator */}
        <div className="flex gap-1.5 p-4 pb-0">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t.setupTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.setupSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-4">
          {currentStep === 0 && (
            <>
              <div>
                <Label htmlFor="businessName">{t.businessName}</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder={t.businessNamePlaceholder}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="businessType">{t.businessType}</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder={t.businessTypePlaceholder}
                  className="mt-1.5"
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div>
                <Label htmlFor="phone">{t.whatsappPhone}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.whatsappPhonePlaceholder}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">{t.whatsappTip}</p>
              </div>
              <div>
                <Label htmlFor="username">{t.username}</Label>
                <div className="flex items-center mt-1.5">
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">
                    {t.usernamePrefix}
                  </span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") 
                    })}
                    placeholder={t.usernamePlaceholder}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{t.usernameTip}</p>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <p className="text-sm font-medium text-foreground">{t.paymentsTitle}</p>
              <p className="text-xs text-muted-foreground -mt-2">{t.paymentsTip}</p>
              
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={formData.paymentCash}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, paymentCash: checked as boolean })
                    }
                  />
                  <span className="text-sm text-foreground">{t.cash}</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={formData.paymentCards}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, paymentCards: checked as boolean })
                    }
                  />
                  <span className="text-sm text-foreground">{t.cards}</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={formData.paymentYappy}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, paymentYappy: checked as boolean })
                    }
                  />
                  <span className="text-sm text-foreground">{t.yappy}</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            className={cn("gap-2", currentStep === 0 ? "w-full" : "flex-1")}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              language === "es" ? "Guardando..." : "Saving..."
            ) : currentStep === steps.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                {t.finish}
              </>
            ) : (
              <>
                {t.next}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
