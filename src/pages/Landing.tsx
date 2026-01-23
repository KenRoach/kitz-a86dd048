import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, MessageCircle, Store, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { PublicLayout } from "@/components/layout/PublicLayout";

type FormState = "idle" | "form" | "success";

// Trilingual text helper
const txt = (lang: string, en: string, es: string, pt: string) => 
  lang === "pt" ? pt : lang === "es" ? es : en;

// Memoized decorative circles to prevent re-renders
const DecorativeCircles = memo(function DecorativeCircles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/10 animate-float-slow" />
      <div className="absolute top-20 right-10 w-60 h-60 rounded-full border border-white/10 animate-float-medium" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 -left-10 w-40 h-40 rounded-full border border-white/10 animate-float-fast" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full border border-white/10 animate-float-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-20 right-20 w-56 h-56 rounded-full border border-white/10 animate-float-medium" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-10 left-1/2 w-48 h-48 rounded-full border border-white/8 animate-float-fast" style={{ animationDelay: '0.8s' }} />
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-white/5 blur-xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 left-1/4 w-40 h-40 rounded-full bg-white/5 blur-xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
    </div>
  );
});

export default function Landing() {
  const { language, setLanguage } = useLanguage();
  const [formState, setFormState] = useState<FormState>("idle");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cycleLanguage = useCallback(() => {
    const langs = ["en", "es", "pt"] as const;
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  }, [language, setLanguage]);

  const handleGetStarted = useCallback(() => {
    // Navigate directly to auth page for signup
    window.location.href = "/auth";
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await supabase.from("activity_log").insert({
        type: "customer",
        message: `New lead: ${firstName} (${contactMethod === "whatsapp" ? whatsapp : email})`,
        user_id: "00000000-0000-0000-0000-000000000000"
      });
    } catch (error) {
      console.log("Lead logged");
    }

    setIsSubmitting(false);
    setFormState("success");
  }, [firstName, contactMethod, whatsapp, email]);

  const handleWhatsAppContinue = useCallback(() => {
    const message = encodeURIComponent(`Hi! I just signed up for kitz. My name is ${firstName}.`);
    window.open(`https://wa.me/50760001234?text=${message}`, "_blank");
  }, [firstName]);

  return (
    <PublicLayout>
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-soft relative overflow-hidden">

      <DecorativeCircles />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-white">kitz</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleLanguage}
              className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
              title={language === "en" ? "Cambiar idioma" : language === "es" ? "Change language" : "Mudar idioma"}
            >
              {language === "en" ? "ES" : language === "es" ? "PT" : "EN"}
            </button>
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                {txt(language, "Log in", "Iniciar sesión", "Entrar")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {formState === "idle" && (
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4 leading-tight">
                {txt(language, "Manage your business.", "Gestiona tu negocio.", "Gerencie seu negócio.")}
                <br />
                <span className="text-white/70">
                  {txt(language, "Simply.", "Simple.", "Simples.")}
                </span>
              </h1>
              
              <p className="text-base text-white/70 max-w-xs mx-auto mb-8">
                {txt(language, 
                  "Clients, sales, and marketing in one place.",
                  "Clientes, ventas y marketing en un solo lugar.",
                  "Clientes, vendas e marketing em um só lugar.")}
              </p>

              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 rounded-xl shadow-lg transition-all font-medium w-full sm:w-auto"
              >
                {txt(language, "Get started", "Comenzar", "Começar")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-xs text-white/40 mt-3">
                {txt(language, "Free to use", "Gratis", "Grátis")}
              </p>

              {/* Benefit icons */}
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-xs mx-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[11px] text-white/50">
                    {txt(language, "Clients", "Clientes", "Clientes")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Store className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[11px] text-white/50">
                    {txt(language, "Sales", "Ventas", "Vendas")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[11px] text-white/50">
                    {txt(language, "Marketing", "Marketing", "Marketing")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {formState === "form" && (
            <div className="animate-fade-in">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  {txt(language, "Start simple.", "Empieza simple.", "Comece simples.")}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {txt(language,
                    "We'll help you set things up when you're ready.",
                    "Te ayudaremos a configurar todo cuando estés listo.",
                    "Ajudaremos você a configurar quando estiver pronto.")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground text-sm">
                      {txt(language, "First name", "Nombre", "Nome")}
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={txt(language, "Your first name", "Tu nombre", "Seu nome")}
                      required
                      className="h-11 rounded-xl border-border bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">
                      {txt(language, "How should we reach you?", "¿Cómo te contactamos?", "Como podemos contactar você?")}
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setContactMethod("whatsapp")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                          contactMethod === "whatsapp"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactMethod("email")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                          contactMethod === "email"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  {contactMethod === "whatsapp" ? (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-foreground text-sm">
                        {txt(language, "WhatsApp number", "Número de WhatsApp", "Número do WhatsApp")}
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+507 6000-0000"
                        required
                        className="h-11 rounded-xl border-border bg-background"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-11 rounded-xl border-border bg-background"
                      />
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl text-sm font-medium"
                  >
                    {isSubmitting ? "..." : txt(language, "Continue", "Continuar", "Continuar")}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {txt(language, "No spam. No pressure.", "Sin spam. Sin presión.", "Sem spam. Sem pressão.")}
                  </p>
                </form>
              </div>
            </div>
          )}

          {formState === "success" && (
            <div className="animate-fade-in">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm mx-auto">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-success" />
                </div>
                
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  {txt(language, "You're in.", "¡Estás dentro!", "Você está dentro!")}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {txt(language,
                    "We'll reach out when it makes sense.",
                    "Te contactaremos cuando sea el momento.",
                    "Entraremos em contato quando fizer sentido.")}
                </p>

                {contactMethod === "whatsapp" && whatsapp && (
                  <Button 
                    onClick={handleWhatsAppContinue}
                    className="bg-success hover:bg-success/90 text-success-foreground h-11 px-5 rounded-xl text-sm font-medium w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {txt(language, "Continue on WhatsApp", "Continuar en WhatsApp", "Continuar no WhatsApp")}
                  </Button>
                )}

                <div className="mt-4">
                  <Link to="/auth">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
                      {txt(language, "Or create your account now", "O crea tu cuenta ahora", "Ou crie sua conta agora")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works section - only show when idle */}
      {formState === "idle" && (
        <section className="pb-32 px-4 relative z-10">
          <div className="max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white/90 text-center mb-8">
              {txt(language, "How it works", "Cómo funciona", "Como funciona")}
            </h2>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white/80">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {txt(language, "Create your profile", "Crea tu perfil", "Crie seu perfil")}
                  </h3>
                  <p className="text-xs text-white/50">
                    {txt(language,
                      "Add your business info and products in minutes.",
                      "Agrega tu info y productos en minutos.",
                      "Adicione suas informações e produtos em minutos.")}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white/80">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {txt(language, "Share your link", "Comparte tu link", "Compartilhe seu link")}
                  </h3>
                  <p className="text-xs text-white/50">
                    {txt(language,
                      "Send your storefront link via WhatsApp or social media.",
                      "Envía tu link por WhatsApp o redes sociales.",
                      "Envie seu link por WhatsApp ou redes sociais.")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white/80">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {txt(language, "Manage and grow", "Gestiona y crece", "Gerencie e cresça")}
                  </h3>
                  <p className="text-xs text-white/50">
                    {txt(language,
                      "Track clients and orders from one dashboard.",
                      "Sigue clientes y pedidos desde un panel.",
                      "Acompanhe clientes e pedidos de um só painel.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="font-medium text-white/90 text-sm">kitz</span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="text-xs text-white/50">
                {txt(language, 
                  "Simple management system for smart businesses",
                  "Sistema de gestión simple para negocios inteligentes",
                  "Sistema de gestão simples para negócios inteligentes")}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="mailto:hello@kitz.app" 
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {txt(language, "Contact", "Contacto", "Contato")}
              </a>
              <span className="text-white/30">·</span>
              <Link 
                to="/auth" 
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {txt(language, "Sign in", "Ingresar", "Entrar")}
              </Link>
              <span className="text-white/30">·</span>
              <span className="text-xs text-white/40">© 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </PublicLayout>
  );
}
