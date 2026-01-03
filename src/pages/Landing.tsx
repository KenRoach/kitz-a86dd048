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

    // Log the lead capture to activity_log (anonymous)
    try {
      await supabase.from("activity_log").insert({
        type: "customer",
        message: `New lead: ${firstName} (${contactMethod === "whatsapp" ? whatsapp : email})`,
        user_id: "00000000-0000-0000-0000-000000000000" // Anonymous placeholder
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-foreground">kitz</span>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {formState === "idle" && (
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
                Run your business.
                <br />
                <span className="text-muted-foreground">Without the noise.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
                A simple system to stay organized and in control.
              </p>

              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-action hover:bg-action/90 text-action-foreground text-base px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Get started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {formState === "form" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                Start simple.
              </h2>
              <p className="text-muted-foreground mb-8">
                We'll help you set things up when you're ready.
              </p>

              <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-5 text-left">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    required
                    className="h-12 rounded-xl border-border bg-card"
                  />
                </div>

                {/* Contact method toggle */}
                <div className="space-y-2">
                  <Label className="text-foreground">How should we reach you?</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setContactMethod("whatsapp")}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
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
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
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
                    <Label htmlFor="whatsapp" className="text-foreground">WhatsApp number</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+507 6000-0000"
                      required
                      className="h-12 rounded-xl border-border bg-card"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 rounded-xl border-border bg-card"
                    />
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-action hover:bg-action/90 text-action-foreground h-12 rounded-xl text-base font-medium"
                >
                  {isSubmitting ? "..." : "Continue"}
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  No spam. No pressure.
                </p>
              </form>
            </div>
          )}

          {formState === "success" && (
            <div className="animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              
              <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                You're in.
              </h2>
              <p className="text-muted-foreground mb-8">
                We'll reach out when it makes sense.
              </p>

              {contactMethod === "whatsapp" && whatsapp && (
                <Button 
                  onClick={handleWhatsAppContinue}
                  className="bg-success hover:bg-success/90 text-success-foreground h-12 px-6 rounded-xl text-base font-medium"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Continue on WhatsApp
                </Button>
              )}

              <div className="mt-8">
                <Link to="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Or create your account now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2025 kitz
        </p>
      </footer>
    </div>
  );
}