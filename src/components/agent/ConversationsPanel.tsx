import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Mail, Phone, Inbox, User } from "lucide-react";

interface Conversation {
  id: string;
  channel: string;
  contact_name?: string;
  contact_identifier?: string;
  status: string;
  last_message_at: string;
  metadata: Record<string, unknown>;
}

interface ConversationsPanelProps {
  language: string;
}

export function ConversationsPanel({ language }: ConversationsPanelProps) {
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["agent-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("agent_conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp": return MessageSquare;
      case "email": return Mail;
      case "voice": return Phone;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "whatsapp": return "bg-green-500";
      case "email": return "bg-blue-500";
      case "voice": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      active: "default",
      resolved: "secondary",
      pending: "outline",
    };
    const labels: Record<string, { en: string; es: string }> = {
      active: { en: "Active", es: "Activo" },
      resolved: { en: "Resolved", es: "Resuelto" },
      pending: { en: "Pending", es: "Pendiente" },
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status]?.[language as "en" | "es"] || status}
      </Badge>
    );
  };

  const t = {
    noConversations: language === "es" 
      ? "No hay conversaciones aún" 
      : "No conversations yet",
    noConversationsDesc: language === "es"
      ? "Cuando los clientes te contacten por WhatsApp, email o voz, las conversaciones aparecerán aquí."
      : "When customers contact you via WhatsApp, email or voice, conversations will appear here.",
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground font-medium">{t.noConversations}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {t.noConversationsDesc}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2 pr-4">
        {conversations.map((conversation) => {
          const ChannelIcon = getChannelIcon(conversation.channel);
          const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), {
            addSuffix: true,
            locale: language === "es" ? es : undefined,
          });
          const initials = conversation.contact_name
            ?.split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";

          return (
            <Card 
              key={conversation.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with channel indicator */}
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getChannelColor(conversation.channel)} flex items-center justify-center ring-2 ring-background`}>
                      <ChannelIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium truncate">
                        {conversation.contact_name || conversation.contact_identifier || (language === "es" ? "Desconocido" : "Unknown")}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {conversation.contact_identifier && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.contact_identifier}
                        </p>
                      )}
                      {getStatusBadge(conversation.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
