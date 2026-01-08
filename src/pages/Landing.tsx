import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, MessageCircle, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

type FormState = "idle" | "form" | "success";

export default function Landing() {
  const { language, setLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show language modal on first visit (if no language preference saved)
    const hasSeenLanguageModal = localStorage.getItem("language-modal-shown");
    if (!hasSeenLanguageModal) {
      // Small delay for smooth appearance
      const timer = setTimeout(() => {
        setShowLanguageModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLanguageSelect = (lang: "en" | "es") => {
    setLanguage(lang);
    localStorage.setItem("language-modal-shown", "true");
    setShowLanguageModal(false);
  };

  const handleGetStarted = () => {
    setFormState("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleWhatsAppContinue = () => {
    const message = encodeURIComponent(`Hi! I just signed up for kitz. My name is ${firstName}.`);
    window.open(`https://wa.me/50760001234?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-soft relative overflow-hidden">
      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => handleLanguageSelect("en")}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-scale-in">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-7 h-7 text-primary" />
            </div>
            
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2 text-center">
              Choose your language
            </h2>
            <p className="text-muted-foreground mb-6 text-sm text-center">
              Elige tu idioma
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleLanguageSelect("en")}
                className="w-full py-4 px-6 rounded-xl text-left font-medium transition-all bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-between group"
              >
                <span>🇺🇸 English</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button
                onClick={() => handleLanguageSelect("es")}
                className="w-full py-4 px-6 rounded-xl text-left font-medium transition-all bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-between group"
              >
                <span>🇪🇸 Español</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative animated circles */}
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

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-white">kitz</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLanguageModal(true)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              title={language === "en" ? "Change language" : "Cambiar idioma"}
            >
              <Globe className="w-5 h-5" />
            </button>
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                {language === "en" ? "Log in" : "Iniciar sesión"}
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
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6 leading-tight">
                {language === "en" ? "Run your business." : "Maneja tu negocio."}
                <br />
                <span className="text-white/70">
                  {language === "en" ? "Without the noise." : "Sin complicaciones."}
                </span>
              </h1>
              
              <p className="text-lg text-white/80 max-w-md mx-auto mb-10 leading-relaxed">
                {language === "en" 
                  ? "A simple system to stay organized and in control."
                  : "Un sistema simple para mantenerte organizado y en control."}
              </p>

              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
              >
                {language === "en" ? "Get started" : "Comenzar"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {formState === "form" && (
            <div className="animate-fade-in">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  {language === "en" ? "Start simple." : "Empieza simple."}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {language === "en" 
                    ? "We'll help you set things up when you're ready."
                    : "Te ayudaremos a configurar todo cuando estés listo."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground text-sm">
                      {language === "en" ? "First name" : "Nombre"}
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={language === "en" ? "Your first name" : "Tu nombre"}
                      required
                      className="h-11 rounded-xl border-border bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">
                      {language === "en" ? "How should we reach you?" : "¿Cómo te contactamos?"}
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
                        {language === "en" ? "WhatsApp number" : "Número de WhatsApp"}
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
                    {isSubmitting ? "..." : (language === "en" ? "Continue" : "Continuar")}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {language === "en" ? "No spam. No pressure." : "Sin spam. Sin presión."}
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
                  {language === "en" ? "You're in." : "¡Estás dentro!"}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {language === "en" 
                    ? "We'll reach out when it makes sense."
                    : "Te contactaremos cuando sea el momento."}
                </p>

                {contactMethod === "whatsapp" && whatsapp && (
                  <Button 
                    onClick={handleWhatsAppContinue}
                    className="bg-success hover:bg-success/90 text-success-foreground h-11 px-5 rounded-xl text-sm font-medium w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {language === "en" ? "Continue on WhatsApp" : "Continuar en WhatsApp"}
                  </Button>
                )}

                <div className="mt-4">
                  <Link to="/auth">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
                      {language === "en" ? "Or create your account now" : "O crea tu cuenta ahora"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="font-medium text-white/90 text-sm">kitz</span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="text-xs text-white/50">
                {language === "en" ? "Simple tools for smart sellers" : "Herramientas simples para vendedores inteligentes"}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="mailto:hello@kitz.app" 
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {language === "en" ? "Contact" : "Contacto"}
              </a>
              <span className="text-white/30">·</span>
              <Link 
                to="/auth" 
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {language === "en" ? "Sign in" : "Ingresar"}
              </Link>
              <span className="text-white/30">·</span>
              <span className="text-xs text-white/40">© 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
