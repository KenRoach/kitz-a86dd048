import { ConsultantContact } from "./ConsultantContactCard";
import { Clock, MessageSquare, CreditCard, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

interface DailyAssistantPanelProps {
  contacts: ConsultantContact[];
  language?: "en" | "es" | "pt";
}

interface AttentionItem {
  id: string;
  icon: React.ReactNode;
  message: string;
  count?: number;
}

export function DailyAssistantPanel({ contacts, language = "es" }: DailyAssistantPanelProps) {
  const items: AttentionItem[] = [];

  // Contacts in Nutrición waiting
  const nutricionContacts = contacts.filter(c => c.funnel_stage === "nutricion");
  if (nutricionContacts.length > 0) {
    items.push({
      id: "nutricion",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      message: language === "es" 
        ? `${nutricionContacts.length} contacto${nutricionContacts.length > 1 ? "s" : ""} esperando en Nutrición`
        : `${nutricionContacts.length} contact${nutricionContacts.length > 1 ? "s" : ""} waiting in Nurturing`,
      count: nutricionContacts.length,
    });
  }

  // Pending payments in Conversación
  const pendingPayments = contacts.filter(c => c.funnel_stage === "conversacion" && c.payment_pending);
  if (pendingPayments.length > 0) {
    items.push({
      id: "payment",
      icon: <CreditCard className="w-4 h-4 text-purple-500" />,
      message: language === "es" 
        ? `${pendingPayments.length} conversación${pendingPayments.length > 1 ? "es" : ""} pendiente de pago`
        : `${pendingPayments.length} conversation${pendingPayments.length > 1 ? "s" : ""} pending payment`,
      count: pendingPayments.length,
    });
  }

  // Overdue follow-ups (no interaction in 3+ days)
  const overdueContacts = contacts.filter(c => {
    if (!c.last_interaction || c.funnel_stage === "retencion") return false;
    const daysSince = differenceInDays(new Date(), new Date(c.last_interaction));
    return daysSince >= 3;
  });
  if (overdueContacts.length > 0) {
    items.push({
      id: "overdue",
      icon: <AlertCircle className="w-4 h-4 text-action" />,
      message: language === "es" 
        ? `${overdueContacts.length} seguimiento${overdueContacts.length > 1 ? "s" : ""} vencido${overdueContacts.length > 1 ? "s" : ""}`
        : `${overdueContacts.length} follow-up${overdueContacts.length > 1 ? "s" : ""} overdue`,
      count: overdueContacts.length,
    });
  }

  // High attention contacts
  const highAttention = contacts.filter(c => c.is_high_attention && c.funnel_stage === "conversacion");
  if (highAttention.length > 0 && !items.find(i => i.id === "payment")) {
    items.push({
      id: "attention",
      icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
      message: language === "es" 
        ? `${highAttention.length} contacto${highAttention.length > 1 ? "s" : ""} requiere${highAttention.length === 1 ? "" : "n"} atención`
        : `${highAttention.length} contact${highAttention.length > 1 ? "s" : ""} need${highAttention.length === 1 ? "s" : ""} attention`,
      count: highAttention.length,
    });
  }

  // All calm
  if (items.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <span className="text-lg">✓</span>
        </div>
        <p className="font-medium text-foreground text-sm">
          {language === "es" ? "Todo en orden" : "All caught up"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "es" 
            ? "No hay acciones pendientes por hoy" 
            : "No pending actions for today"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-medium text-foreground mb-4">
        {language === "es" 
          ? "Esto necesita tu atención hoy" 
          : "Here's what needs your attention today"}
      </h3>
      <div className="space-y-3">
        {items.slice(0, 4).map(item => (
          <div 
            key={item.id}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <p className="text-sm text-foreground">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
