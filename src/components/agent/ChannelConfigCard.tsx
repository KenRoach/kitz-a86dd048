import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageSquare, Mail, Phone, Settings, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

type Channel = "whatsapp" | "email" | "voice";

interface ChannelConfig {
  id?: string;
  channel: Channel;
  is_enabled: boolean;
  config: Json;
}

interface ChannelConfigCardProps {
  channel: Channel;
  config?: ChannelConfig;
  language: string;
}

const channelInfo = {
  whatsapp: {
    icon: MessageSquare,
    color: "text-green-600 bg-green-500/10",
    setupUrl: "https://business.whatsapp.com/",
    fields: ["phone_number_id", "access_token", "webhook_verify_token"],
  },
  email: {
    icon: Mail,
    color: "text-blue-600 bg-blue-500/10",
    setupUrl: "https://resend.com/",
    fields: ["from_email", "reply_to"],
  },
  voice: {
    icon: Phone,
    color: "text-purple-600 bg-purple-500/10",
    setupUrl: "https://elevenlabs.io/",
    fields: ["agent_id", "voice_id", "first_message"],
  },
};

export function ChannelConfigCard({ channel, config, language }: ChannelConfigCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<Record<string, string>>({});

  const info = channelInfo[channel];
  const Icon = info.icon;
  const isEnabled = config?.is_enabled ?? false;
  
  const getConfigObject = (cfg: Json | undefined): Record<string, unknown> => {
    if (typeof cfg === "object" && cfg !== null && !Array.isArray(cfg)) {
      return cfg as Record<string, unknown>;
    }
    return {};
  };
  
  const configObj = getConfigObject(config?.config);

  const labels: Record<Channel, { name: string; desc: string }> = {
    whatsapp: {
      name: "WhatsApp Business",
      desc: language === "es" 
        ? "Responde mensajes automáticamente" 
        : "Auto-respond to messages",
    },
    email: {
      name: "Email",
      desc: language === "es" 
        ? "Gestiona correos entrantes" 
        : "Handle incoming emails",
    },
    voice: {
      name: language === "es" ? "Llamadas de Voz" : "Voice Calls",
      desc: language === "es" 
        ? "Agente de voz con ElevenLabs" 
        : "Voice agent with ElevenLabs",
    },
  };

  const fieldLabels: Record<string, { label: string; placeholder: string }> = {
    phone_number_id: {
      label: "Phone Number ID",
      placeholder: "123456789...",
    },
    access_token: {
      label: "Access Token",
      placeholder: "EAABs...",
    },
    webhook_verify_token: {
      label: "Webhook Verify Token",
      placeholder: "my_secure_token",
    },
    from_email: {
      label: language === "es" ? "Email de envío" : "From Email",
      placeholder: "noreply@yourdomain.com",
    },
    reply_to: {
      label: language === "es" ? "Responder a" : "Reply To",
      placeholder: "support@yourdomain.com",
    },
    agent_id: {
      label: "ElevenLabs Agent ID",
      placeholder: "agent_...",
    },
    voice_id: {
      label: "Voice ID",
      placeholder: "JBFqnCBsd6RMkjVDRZzb",
    },
    first_message: {
      label: language === "es" ? "Mensaje inicial" : "First Message",
      placeholder: language === "es" ? "Hola, ¿en qué puedo ayudarte?" : "Hi, how can I help you?",
    },
  };

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error("Not authenticated");
      
      if (config?.id) {
        const { error } = await supabase
          .from("agent_configs")
          .update({ is_enabled: enabled })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_configs")
          .insert({
            user_id: user.id,
            channel,
            is_enabled: enabled,
            config: {},
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-configs"] });
      toast.success(language === "es" ? "Canal actualizado" : "Channel updated");
    },
    onError: () => {
      toast.error(language === "es" ? "Error al actualizar" : "Failed to update");
    },
  });

  const hasConfig = info.fields.some(field => configObj[field]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const configData: Record<string, string> = { ...(configObj as Record<string, string>), ...localConfig };
      
      if (config?.id) {
        const { error } = await supabase
          .from("agent_configs")
          .update({ config: configData as Json })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_configs")
          .insert([{
            user_id: user.id,
            channel,
            is_enabled: false,
            config: configData as Json,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-configs"] });
      toast.success(language === "es" ? "Configuración guardada" : "Configuration saved");
      setIsOpen(false);
    },
    onError: () => {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    },
  });

  return (
    <Card className={`relative overflow-hidden transition-all ${isEnabled ? "ring-2 ring-primary/20" : ""}`}>
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isEnabled ? "bg-primary" : "bg-muted"}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending}
          />
        </div>
        <CardTitle className="text-lg mt-3">{labels[channel].name}</CardTitle>
        <CardDescription>{labels[channel].desc}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Configuration status */}
        <div className="flex items-center gap-2 text-sm">
          {hasConfig ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-600">
                {language === "es" ? "Configurado" : "Configured"}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600">
                {language === "es" ? "Requiere configuración" : "Needs setup"}
              </span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <Settings className="w-4 h-4" />
                {language === "es" ? "Configurar" : "Configure"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {labels[channel].name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {info.fields.map(field => {
                  const fieldInfo = fieldLabels[field];
                  const currentValue = (configObj[field] as string) || "";
                  
                  return (
                    <div key={field} className="space-y-2">
                      <Label>{fieldInfo.label}</Label>
                      <Input
                        type={field.includes("token") || field.includes("access") ? "password" : "text"}
                        placeholder={fieldInfo.placeholder}
                        defaultValue={currentValue}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, [field]: e.target.value }))}
                      />
                    </div>
                  );
                })}

                <div className="pt-4 border-t">
                  <a 
                    href={info.setupUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {language === "es" ? "Ir a la documentación" : "View documentation"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                >
                  {language === "es" ? "Guardar" : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
