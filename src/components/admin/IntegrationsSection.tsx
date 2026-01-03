import { useState } from "react";
import { 
  MessageCircle, 
  Instagram, 
  Calendar, 
  Zap, 
  MapPin,
  Check,
  ExternalLink
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status: "connected" | "available" | "coming_soon";
  category: "messaging" | "social" | "payments" | "productivity" | "analytics";
}

const INTEGRATIONS: Integration[] = [
  // Messaging - Most important for Panama
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envía actualizaciones y chatea con clientes",
    icon: MessageCircle,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    status: "available",
    category: "messaging",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Comparte storefronts en historias",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    status: "available",
    category: "social",
  },
  // Productivity - Available in Panama
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincroniza citas y reservaciones",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "available",
    category: "productivity",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecta +5,000 apps automáticamente",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    status: "available",
    category: "productivity",
  },
  // Analytics - Available in Panama
  {
    id: "google_business",
    name: "Google Business Profile",
    description: "Gestiona tu perfil y reseñas en Google",
    icon: MapPin,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    status: "available",
    category: "analytics",
  },
];

interface IntegrationCardProps {
  integration: Integration;
  isConnected: boolean;
  onToggle: (id: string, connected: boolean) => void;
}

function IntegrationCard({ integration, isConnected, onToggle }: IntegrationCardProps) {
  const Icon = integration.icon;
  const isComingSoon = integration.status === "coming_soon";

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border border-border/50 transition-all",
        isComingSoon ? "opacity-60" : "hover:border-border hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", integration.bgColor)}>
          <Icon className={cn("w-5 h-5", integration.color)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{integration.name}</span>
            {isComingSoon && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">Soon</Badge>
            )}
            {isConnected && (
              <Badge className="text-xs px-1.5 py-0 bg-success/10 text-success border-0">
                <Check className="w-3 h-3 mr-0.5" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{integration.description}</p>
        </div>
      </div>
      
      <Switch
        checked={isConnected}
        onCheckedChange={(checked) => onToggle(integration.id, checked)}
      />
    </div>
  );
}

export function IntegrationsSection() {
  // In a real app, this would come from the database
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());

  const handleToggle = (id: string, connected: boolean) => {
    if (connected) {
      // Show a toast explaining what would happen
      toast.info(`Connect ${INTEGRATIONS.find(i => i.id === id)?.name}`, {
        description: "API connection coming soon. We'll notify you when it's ready.",
        action: {
          label: "Got it",
          onClick: () => {},
        },
      });
      setConnectedIntegrations(prev => new Set([...prev, id]));
    } else {
      setConnectedIntegrations(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Integration disconnected");
    }
  };

  const messagingIntegrations = INTEGRATIONS.filter(i => i.category === "messaging" || i.category === "social");
  const productivityIntegrations = INTEGRATIONS.filter(i => i.category === "productivity");
  const analyticsIntegrations = INTEGRATIONS.filter(i => i.category === "analytics");

  return (
    <div className="space-y-6">
      {/* Messaging & Social */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Messaging & Social
        </h3>
        <div className="space-y-2">
          {messagingIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={connectedIntegrations.has(integration.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Productivity & Tools */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Productivity & Tools
        </h3>
        <div className="space-y-2">
          {productivityIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={connectedIntegrations.has(integration.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Analytics & Discovery */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Analytics & Discovery
        </h3>
        <div className="space-y-2">
          {analyticsIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={connectedIntegrations.has(integration.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Request Integration */}
      <div className="pt-4 border-t border-border">
        <button 
          onClick={() => toast.info("We'd love to hear from you!", {
            description: "Email us at hello@yourbusiness.com with your integration request.",
          })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Request an integration
        </button>
      </div>
    </div>
  );
}
