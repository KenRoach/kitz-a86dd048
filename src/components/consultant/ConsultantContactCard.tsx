import { cn } from "@/lib/utils";
import { MessageSquare, Mail, Link2, Instagram, Users, MoreHorizontal, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export interface ConsultantContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  funnel_stage: string;
  stage_entered_at: string;
  notes: string | null;
  last_interaction: string | null;
  is_high_attention: boolean;
  payment_pending: boolean;
  paid_at: string | null;
  attendance_confirmed: boolean;
  calendar_reminder_sent: boolean;
  tags: string[] | null;
  created_at: string;
}

interface ConsultantContactCardProps {
  contact: ConsultantContact;
  onClick?: () => void;
  language?: "en" | "es" | "pt";
}

const sourceIcons: Record<string, React.ReactNode> = {
  whatsapp: (
    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  email: <Mail className="w-3 h-3 text-blue-500" />,
  link: <Link2 className="w-3 h-3 text-consultant-accent" />,
  instagram: <Instagram className="w-3 h-3 text-pink-500" />,
  referral: <Users className="w-3 h-3 text-consultant-cta" />,
  other: <MoreHorizontal className="w-3 h-3 text-consultant-muted" />,
};

export function ConsultantContactCard({ contact, onClick, language = "es" }: ConsultantContactCardProps) {
  const timeInStage = formatDistanceToNow(new Date(contact.stage_entered_at), {
    addSuffix: false,
    locale: language === "es" ? es : undefined,
  });

  const lastInteraction = contact.last_interaction
    ? formatDistanceToNow(new Date(contact.last_interaction), {
        addSuffix: true,
        locale: language === "es" ? es : undefined,
      })
    : language === "es" ? "Sin interacción" : "No interaction";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-consultant-section rounded-xl p-3 border border-consultant-accent/20 cursor-pointer transition-all",
        "hover:border-consultant-cta/50 hover:shadow-sm",
        contact.is_high_attention && "ring-2 ring-consultant-accent/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-consultant-cta/10 flex items-center justify-center text-consultant-cta font-medium text-sm shrink-0">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-sm text-consultant-header truncate">{contact.name}</h4>
            <div className="flex items-center gap-1 text-[10px] text-consultant-muted">
              {sourceIcons[contact.source] || sourceIcons.other}
              <span className="capitalize">{contact.source}</span>
            </div>
          </div>
        </div>
        {contact.payment_pending && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-consultant-cta/10 text-consultant-cta font-medium shrink-0">
            💰
          </span>
        )}
      </div>

      {/* Time in stage */}
      <div className="flex items-center gap-1.5 text-[11px] text-consultant-muted mb-2">
        <Clock className="w-3 h-3" />
        <span>{language === "es" ? "En etapa:" : "In stage:"} {timeInStage}</span>
      </div>

      {/* Last interaction */}
      <p className="text-[11px] text-consultant-muted truncate">
        {language === "es" ? "Última:" : "Last:"} {lastInteraction}
      </p>

      {/* High attention badge */}
      {contact.is_high_attention && (
        <div className="mt-2 text-[10px] text-consultant-accent font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-consultant-accent animate-pulse" />
          {language === "es" ? "Alta atención" : "High attention"}
        </div>
      )}
    </div>
  );
}
