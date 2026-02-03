import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Sparkles, MessageSquare, Mail, Phone, Check, 
  ArrowRight, Loader2, Wand2 
} from "lucide-react";

interface AISetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
}

type Step = "describe" | "channels" | "generating" | "complete";

export function AISetupWizard({ open, onOpenChange, language }: AISetupWizardProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["whatsapp"]);
  const [generatedRules, setGeneratedRules] = useState<any[]>([]);

  const resetWizard = () => {
    setStep("describe");
    setDescription("");
    setSelectedChannels(["whatsapp"]);
    setGeneratedRules([]);
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      // Simulate AI generation (in production, call an edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate rules based on description
      const rules = [];
      
      if (selectedChannels.includes("whatsapp")) {
        rules.push({
          name: language === "es" ? "Respuesta automática WhatsApp" : "WhatsApp Auto Reply",
          trigger_type: "message_received",
          action_type: "ai_response",
          action_config: { 
            template: language === "es" 
              ? `¡Hola! Gracias por contactar a ${profile?.business_name || "nuestro negocio"}. ${description}` 
              : `Hi! Thanks for contacting ${profile?.business_name || "our business"}. ${description}`
          },
          approval_required: true,
        });
      }
      
      if (selectedChannels.includes("email")) {
        rules.push({
          name: language === "es" ? "Respuesta email entrante" : "Incoming Email Response",
          trigger_type: "email_received",
          action_type: "ai_response",
          action_config: { 
            template: language === "es"
              ? `Gracias por su mensaje. Un miembro de nuestro equipo le responderá pronto.`
              : `Thank you for your message. A team member will respond shortly.`
          },
          approval_required: true,
        });
      }
      
      if (selectedChannels.includes("voice")) {
        rules.push({
          name: language === "es" ? "Llamada perdida - seguimiento" : "Missed Call - Follow Up",
          trigger_type: "missed_call",
          action_type: "auto_reply",
          action_config: { 
            template: language === "es"
              ? `Notamos que intentaste llamarnos. ¿En qué podemos ayudarte?`
              : `We noticed you tried to call. How can we help you?`
          },
          approval_required: false,
        });
      }

      // Add a follow-up rule
      rules.push({
        name: language === "es" ? "Seguimiento 24h sin respuesta" : "24h No Response Follow-up",
        trigger_type: "no_response_24h",
        action_type: "notify_owner",
        action_config: {},
        approval_required: false,
      });

      return rules;
    },
    onSuccess: (rules) => {
      setGeneratedRules(rules);
      setStep("complete");
    },
    onError: () => {
      toast.error(language === "es" ? "Error al generar reglas" : "Failed to generate rules");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      // Enable channels
      for (const channel of selectedChannels) {
        await supabase
          .from("agent_configs")
          .upsert({
            user_id: user.id,
            channel,
            is_enabled: true,
            config: {},
          }, { onConflict: "user_id,channel" });
      }
      
      // Save rules
      for (let i = 0; i < generatedRules.length; i++) {
        await supabase
          .from("agent_rules")
          .insert({
            user_id: user.id,
            ...generatedRules[i],
            trigger_config: {},
            is_active: true,
            priority: i,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-configs"] });
      queryClient.invalidateQueries({ queryKey: ["agent-rules"] });
      toast.success(language === "es" ? "¡Agente configurado!" : "Agent configured!");
      onOpenChange(false);
      resetWizard();
    },
    onError: () => {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    },
  });

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const t = {
    title: language === "es" ? "Configuración con IA" : "AI-Assisted Setup",
    step1Title: language === "es" ? "Describe tu negocio" : "Describe your business",
    step1Desc: language === "es" 
      ? "Cuéntanos sobre tu negocio y cómo quieres que el agente responda a tus clientes."
      : "Tell us about your business and how you want the agent to respond to customers.",
    step2Title: language === "es" ? "Selecciona canales" : "Select channels",
    step2Desc: language === "es"
      ? "¿En qué canales quieres que tu agente esté activo?"
      : "Which channels do you want your agent to be active on?",
    generating: language === "es" ? "Generando reglas..." : "Generating rules...",
    complete: language === "es" ? "¡Listo para activar!" : "Ready to activate!",
    completeDesc: language === "es"
      ? "Hemos creado estas reglas basadas en tu descripción:"
      : "We've created these rules based on your description:",
    next: language === "es" ? "Siguiente" : "Next",
    back: language === "es" ? "Atrás" : "Back",
    generate: language === "es" ? "Generar reglas" : "Generate rules",
    activate: language === "es" ? "Activar agente" : "Activate agent",
    placeholder: language === "es"
      ? "Ej: Somos una barbería en Ciudad de Panamá. Queremos responder rápido a citas, preguntas sobre precios y horarios..."
      : "Ex: We're a barbershop in Panama City. We want to quickly respond to appointments, pricing questions and hours...",
  };

  const channels = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "bg-green-500" },
    { id: "email", label: "Email", icon: Mail, color: "bg-blue-500" },
    { id: "voice", label: language === "es" ? "Voz (11Labs)" : "Voice (11Labs)", icon: Phone, color: "bg-purple-500" },
  ];

  const getStepProgress = () => {
    switch (step) {
      case "describe": return 25;
      case "channels": return 50;
      case "generating": return 75;
      case "complete": return 100;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetWizard();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {step === "describe" && t.step1Desc}
                {step === "channels" && t.step2Desc}
                {step === "generating" && t.generating}
                {step === "complete" && t.completeDesc}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <Progress value={getStepProgress()} className="h-1" />

        <div className="py-4">
          {/* Step 1: Description */}
          {step === "describe" && (
            <div className="space-y-4">
              <Label>{t.step1Title}</Label>
              <Textarea
                placeholder={t.placeholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep("channels")}
                  disabled={!description.trim()}
                  className="gap-1.5"
                >
                  {t.next}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Channels */}
          {step === "channels" && (
            <div className="space-y-4">
              <Label>{t.step2Title}</Label>
              <div className="grid grid-cols-3 gap-3">
                {channels.map(channel => {
                  const isSelected = selectedChannels.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${channel.color} mx-auto flex items-center justify-center mb-2`}>
                        <channel.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium">{channel.label}</p>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("describe")}>
                  {t.back}
                </Button>
                <Button 
                  onClick={() => {
                    setStep("generating");
                    generateMutation.mutate();
                  }}
                  disabled={selectedChannels.length === 0}
                  className="gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.generate}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === "generating" && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t.generating}</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="space-y-4">
              <div className="space-y-2">
                {generatedRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Check className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.approval_required 
                          ? (language === "es" ? "Requiere aprobación" : "Requires approval")
                          : (language === "es" ? "Automático" : "Automatic")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("channels")}>
                  {t.back}
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t.activate}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
