import { useState } from "react";
import { 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Mail, 
  Calendar, 
  Zap, 
  CreditCard,
  MapPin,
  BarChart3,
  ShoppingBag,
  Check,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // Messaging
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Send order updates & chat with customers",
    icon: MessageCircle,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    status: "available",
    category: "messaging",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Sync DMs & share storefronts to stories",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    status: "available",
    category: "social",
  },
  {
    id: "facebook",
    name: "Facebook / Messenger",
    description: "Manage page messages & marketplace",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    status: "coming_soon",
    category: "social",
  },
  // Payments
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept card payments worldwide",
    icon: CreditCard,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    status: "available",
    category: "payments",
  },
  // Productivity
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync bookings & appointments",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "available",
    category: "productivity",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing & customer lists",
    icon: Mail,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    status: "available",
    category: "productivity",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect 5,000+ apps automatically",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    status: "available",
    category: "productivity",
  },
  // Analytics
  {
    id: "google_business",
    name: "Google Business Profile",
    description: "Manage your Google listing & reviews",
    icon: MapPin,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    status: "available",
    category: "analytics",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Track storefront visits & conversions",
    icon: BarChart3,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    status: "coming_soon",
    category: "analytics",
  },
  // E-commerce
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products & inventory",
    icon: ShoppingBag,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    status: "coming_soon",
    category: "productivity",
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
      
      {isComingSoon ? (
        <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
          Notify me
        </Button>
      ) : (
        <Switch
          checked={isConnected}
          onCheckedChange={(checked) => onToggle(integration.id, checked)}
        />
      )}
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
  const paymentIntegrations = INTEGRATIONS.filter(i => i.category === "payments");
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

      {/* Payments */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Payments
        </h3>
        <div className="space-y-2">
          {paymentIntegrations.map((integration) => (
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
