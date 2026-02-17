import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BatteryWarning, Zap, Hand } from "lucide-react";
import { useAICredits } from "@/hooks/useAICredits";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AIRechargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIRechargeModal({ open, onOpenChange }: AIRechargeModalProps) {
  const { refresh } = useAICredits();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEs = language === "es";

  const handleRecharge = async () => {
    if (!user) return;
    // For now, grant 50 free credits (replace with payment integration later)
    try {
      const { data, error } = await supabase.rpc("recharge_ai_credits", {
        p_user_id: user.id,
        p_amount: 50,
      });
      if (error) throw error;
      await refresh();
      toast.success(isEs ? `¡Recargado! ${data} créditos disponibles` : `Recharged! ${data} credits available`);
      onOpenChange(false);
    } catch (e) {
      console.error("Recharge error:", e);
      toast.error(isEs ? "Error al recargar" : "Recharge failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
            <BatteryWarning className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">
            {isEs ? "Batería IA Agotada" : "AI Battery Empty"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEs
              ? "El modo manual es gratis. Recarga para usar IA, Voz y Agentes."
              : "Manual mode is free. Recharge to use AI, Voice, and Agents."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleRecharge} className="gap-2">
            <Zap className="w-4 h-4" />
            {isEs ? "Recargar IA" : "Recharge AI"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <Hand className="w-4 h-4" />
            {isEs ? "Continuar en modo manual" : "Continue in Manual Mode"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
