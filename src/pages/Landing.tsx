import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FormState = "idle" | "form" | "success";

export default function Landing() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute top-20 right-10 w-60 h-60 rounded-full border border-white/10" />
        <div className="absolute bottom-40 -left-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 right-20 w-56 h-56 rounded-full border border-white/10" />
        <div className="absolute top-10 left-1/2 w-48 h-48 rounded-full border border-white/8" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-white">kitz</span>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {formState === "idle" && (
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6 leading-tight">
                Run your business.
                <br />
                <span className="text-white/70">Without the noise.</span>
              </h1>
              
              <p className="text-lg text-white/80 max-w-md mx-auto mb-10 leading-relaxed">
                A simple system to stay organized and in control.
              </p>

              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
              >
                Get started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {formState === "form" && (
            <div className="animate-fade-in">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  Start simple.
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  We'll help you set things up when you're ready.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground text-sm">First name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      required
                      className="h-11 rounded-xl border-border bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">How should we reach you?</Label>
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
                      <Label htmlFor="whatsapp" className="text-foreground text-sm">WhatsApp number</Label>
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
                    {isSubmitting ? "..." : "Continue"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    No spam. No pressure.
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
                  You're in.
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  We'll reach out when it makes sense.
                </p>

                {contactMethod === "whatsapp" && whatsapp && (
                  <Button 
                    onClick={handleWhatsAppContinue}
                    className="bg-success hover:bg-success/90 text-success-foreground h-11 px-5 rounded-xl text-sm font-medium w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Continue on WhatsApp
                  </Button>
                )}

                <div className="mt-4">
                  <Link to="/auth">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
                      Or create your account now
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
      <footer className="fixed bottom-0 left-0 right-0 py-4 px-4 text-center z-10">
        <p className="text-xs text-white/60">
          © 2025 kitz
        </p>
      </footer>
    </div>
  );
}
