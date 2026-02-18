import { memo } from "react";
import { CheckCircle } from "lucide-react";

const txt = (lang: string, en: string, es: string, pt: string) =>
  lang === "pt" ? pt : lang === "es" ? es : en;

interface PricingSectionProps {
  language: string;
}

const TIERS = (lang: string) => ({
  free: {
    stage: "Stage 1",
    title: txt(lang, "Kitz Platform", "Plataforma Kitz", "Plataforma Kitz"),
    price: txt(lang, "Free Forever", "Gratis Siempre", "Grátis Para Sempre"),
    description: txt(
      lang,
      "CRM, order management, and your own storefront — all free. Organize leads, track payments, and share checkout links at zero cost.",
      "CRM, gestión de pedidos y tu propia tienda — todo gratis. Organiza leads, rastrea pagos y comparte links de cobro sin costo.",
      "CRM, gestão de pedidos e sua própria loja — tudo grátis. Organize leads, acompanhe pagamentos e compartilhe links de cobrança sem custo."
    ),
    features: txt(
      lang,
      "Mini CRM for leads & customers|Order & payment tracking|Shareable storefront & checkout links|Community & playbooks access",
      "Mini CRM para leads y clientes|Rastreo de pedidos y pagos|Tienda y links de cobro compartibles|Comunidad y playbooks",
      "Mini CRM para leads e clientes|Rastreio de pedidos e pagamentos|Loja e links de cobrança compartilháveis|Comunidade e playbooks"
    ).split("|"),
  },
  ai: {
    stage: "Stage 2",
    title: txt(lang, "Kitz AI Autopilot", "Kitz IA Autopilot", "Kitz IA Autopilot"),
    price: txt(lang, "Coming Soon", "Próximamente", "Em Breve"),
    description: txt(
      lang,
      "Connect your WhatsApp via QR code and let Kitz AI handle follow-ups automatically when customers go silent or don't pay.",
      "Conecta tu WhatsApp vía código QR y deja que Kitz IA haga los seguimientos automáticos cuando los clientes no responden o no pagan.",
      "Conecte seu WhatsApp via QR code e deixe o Kitz IA fazer os follow-ups automáticos quando clientes somem ou não pagam."
    ),
    features: txt(
      lang,
      "WhatsApp auto follow-ups via QR connect|Smart payment reminders (planned)|AI lead scoring & nudges (planned)|Priority support (planned)",
      "Seguimientos auto WhatsApp vía QR|Recordatorios de pago inteligentes (planeado)|Scoring de leads con IA (planeado)|Soporte prioritario (planeado)",
      "Follow-ups auto WhatsApp via QR|Lembretes de pagamento inteligentes (planejado)|Scoring de leads com IA (planejado)|Suporte prioritário (planejado)"
    ).split("|"),
  },
});

const PricingSection = memo(function PricingSection({ language }: PricingSectionProps) {
  const tiers = TIERS(language);

  return (
    <section className="pb-32 px-4 relative z-10">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-white/90 text-center mb-8">
          {txt(language, "Simple Pricing", "Precios Simples", "Preços Simples")}
        </h2>

        <div className="space-y-4">
          {/* Free tier */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <span className="mb-3 inline-block rounded-full bg-success/20 px-3 py-1 text-[10px] font-bold uppercase text-success">
              {tiers.free.stage}
            </span>
            <h3 className="text-lg font-semibold text-white mb-1">{tiers.free.title}</h3>
            <p className="text-xl font-bold text-success mb-3">{tiers.free.price}</p>
            <p className="text-xs text-white/50 leading-relaxed mb-5">{tiers.free.description}</p>
            <div className="space-y-2">
              {tiers.free.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-success" /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* AI tier */}
          <div className="relative rounded-2xl bg-white/5 border-2 border-primary-soft/40 p-6">
            <div className="absolute -top-2.5 right-5 rounded-full bg-primary px-3 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
              {txt(language, "Recommended", "Recomendado", "Recomendado")}
            </div>
            <span className="mb-3 inline-block rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase text-primary-soft">
              {tiers.ai.stage}
            </span>
            <h3 className="text-lg font-semibold text-white mb-1">{tiers.ai.title}</h3>
            <p className="text-xl font-bold text-primary-soft mb-3">{tiers.ai.price}</p>
            <p className="text-xs text-white/50 leading-relaxed mb-5">{tiers.ai.description}</p>
            <div className="space-y-2">
              {tiers.ai.features.map((f, i) => {
                const isPlanned = f.includes("(planned)") || f.includes("(planeado)") || f.includes("(planejado)");
                const label = f.replace(/\s*\((planned|planeado|planejado)\)/, "");
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs ${isPlanned ? "text-white/30" : "text-white/60"}`}>
                    <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${isPlanned ? "text-white/20" : "text-primary-soft"}`} />
                    {label}
                    {isPlanned && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-medium text-white/40">
                        {txt(language, "planned", "planeado", "planejado")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default PricingSection;
