import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  CheckCircle2, XCircle, Clock, MessageSquare, Mail, 
  Phone, AlertCircle, Inbox
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

export interface PendingAction {
  id: string;
  action_type: string;
  action_data: Json;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface PendingActionsQueueProps {
  actions: PendingAction[];
  language: string;
}

export function PendingActionsQueue({ actions, language }: PendingActionsQueueProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("agent_pending_actions")
        .update({ 
          status, 
          processed_at: new Date().toISOString() 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["agent-pending-actions"] });
      const message = status === "approved"
        ? (language === "es" ? "Acción aprobada" : "Action approved")
        : (language === "es" ? "Acción rechazada" : "Action rejected");
      toast.success(message);
    },
    onError: () => {
      toast.error(language === "es" ? "Error al procesar" : "Failed to process");
    },
  });

  const getActionData = (data: Json): { channel?: string; recipient?: string; content?: string; subject?: string } => {
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return data as { channel?: string; recipient?: string; content?: string; subject?: string };
    }
    return {};
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case "whatsapp": return MessageSquare;
      case "email": return Mail;
      case "voice": return Phone;
      default: return AlertCircle;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, { en: string; es: string }> = {
      auto_reply: { en: "Auto Reply", es: "Respuesta Automática" },
      forward_email: { en: "Forward Email", es: "Reenviar Email" },
      initiate_call: { en: "Voice Call", es: "Llamada de Voz" },
      ai_response: { en: "AI Response", es: "Respuesta IA" },
      notify_owner: { en: "Notification", es: "Notificación" },
    };
    return labels[actionType]?.[language as "en" | "es"] || actionType;
  };

  const t = {
    noActions: language === "es" 
      ? "No hay acciones pendientes de aprobación" 
      : "No actions pending approval",
    approve: language === "es" ? "Aprobar" : "Approve",
    reject: language === "es" ? "Rechazar" : "Reject",
    to: language === "es" ? "Para" : "To",
    content: language === "es" ? "Contenido" : "Content",
    createdAgo: language === "es" ? "hace" : "ago",
  };

  if (actions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">{t.noActions}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "es" 
              ? "Las acciones que requieran tu aprobación aparecerán aquí" 
              : "Actions requiring your approval will appear here"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "es" ? "Cola de Aprobación" : "Approval Queue"}
        </h3>
        <Badge variant="secondary">
          {actions.length} {language === "es" ? "pendientes" : "pending"}
        </Badge>
      </div>

      <div className="space-y-3">
      {actions.map((action) => {
          const actionData = getActionData(action.action_data);
          const ChannelIcon = getChannelIcon(actionData.channel);
          const timeAgo = formatDistanceToNow(new Date(action.created_at), {
            addSuffix: true,
            locale: language === "es" ? es : undefined,
          });

          return (
            <Card key={action.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Channel Icon */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ChannelIcon className="w-5 h-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getActionLabel(action.action_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                    </div>

                    {actionData.recipient && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t.to}: </span>
                        <span className="font-medium">{actionData.recipient}</span>
                      </p>
                    )}

                    {actionData.subject && (
                      <p className="text-sm font-medium mt-1">
                        {actionData.subject}
                      </p>
                    )}

                    {actionData.content && (
                      <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="line-clamp-3">{actionData.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => updateMutation.mutate({ id: action.id, status: "approved" })}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive"
                      onClick={() => updateMutation.mutate({ id: action.id, status: "rejected" })}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                      {t.reject}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
