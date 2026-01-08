import { 
  MessageCircle, 
  Instagram, 
  Calendar, 
  Zap, 
  MapPin,
  ExternalLink,
  FileSpreadsheet,
  HardDrive,
  FileText,
  ClipboardList,
  Palette,
  Send,
  BookOpen,
  Link,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  url?: string;
  category: "sharing" | "productivity" | "analytics";
}

const INTEGRATIONS: Integration[] = [
  // Sharing - Share storefront links
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Comparte el link de tu storefront por chat",
    icon: MessageCircle,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    url: "https://wa.me/?text=",
    category: "sharing",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Comparte en historias o bio",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    category: "sharing",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Envía el link por mensaje",
    icon: Send,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    url: "https://t.me/share/url?url=",
    category: "sharing",
  },
  // Productivity - Free tools
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Exporta pedidos a hojas de cálculo",
    icon: FileSpreadsheet,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    url: "https://sheets.google.com",
    category: "productivity",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Almacena fotos y documentos",
    icon: HardDrive,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    url: "https://drive.google.com",
    category: "productivity",
  },
  {
    id: "google_forms",
    name: "Google Forms",
    description: "Formularios de pedidos personalizados",
    icon: ClipboardList,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    url: "https://forms.google.com",
    category: "productivity",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincroniza citas y reservaciones",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    url: "https://calendar.google.com",
    category: "productivity",
  },
  {
    id: "google_docs",
    name: "Google Docs",
    description: "Cotizaciones y documentos",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    url: "https://docs.google.com",
    category: "productivity",
  },
  {
    id: "canva",
    name: "Canva",
    description: "Diseña posts y materiales gratis",
    icon: Palette,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    url: "https://canva.com",
    category: "productivity",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notas y gestión de proyectos",
    icon: BookOpen,
    color: "text-stone-700 dark:text-stone-300",
    bgColor: "bg-stone-500/10",
    url: "https://notion.so",
    category: "productivity",
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Automatiza flujos de trabajo",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    url: "https://n8n.io",
    category: "productivity",
  },
  // Analytics
  {
    id: "google_business",
    name: "Google Business Profile",
    description: "Gestiona tu perfil en Google",
    icon: MapPin,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    url: "https://business.google.com",
    category: "analytics",
  },
];

interface IntegrationCardProps {
  integration: Integration;
}

function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon;

  const handleClick = () => {
    if (integration.url) {
      window.open(integration.url, "_blank", "noopener,noreferrer");
    } else {
      toast.info(`Usa ${integration.name} para compartir`, {
        description: "Copia el link de tu storefront y pégalo en la app.",
      });
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 transition-all hover:border-border hover:shadow-sm hover:bg-muted/30 w-full text-left"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", integration.bgColor)}>
        <Icon className={cn("w-5 h-5", integration.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground text-sm">{integration.name}</span>
        <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export function IntegrationsSection() {
  const sharingIntegrations = INTEGRATIONS.filter(i => i.category === "sharing");
  const productivityIntegrations = INTEGRATIONS.filter(i => i.category === "productivity");
  const analyticsIntegrations = INTEGRATIONS.filter(i => i.category === "analytics");

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">Cómo funciona</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Crea un storefront → Copia el link → Compártelo por WhatsApp, Instagram o donde quieras. 
              El cliente ve el producto, hace el pedido y sube su comprobante de pago.
            </p>
          </div>
        </div>
      </div>

      {/* Sharing */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-action uppercase tracking-wider flex items-center gap-2">
          <Link className="w-3.5 h-3.5" />
          Compartir Storefronts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sharingIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Productivity & Tools */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Herramientas Gratis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {productivityIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Analytics & Discovery */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Visibilidad
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {analyticsIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>
    </div>
  );
}
