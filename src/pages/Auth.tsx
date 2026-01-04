import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe } from "lucide-react";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type AuthMode = "signin" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signUp, signIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const validation = forgotPasswordSchema.safeParse({ email });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast.error(error.message);
        } else {
          setResetEmailSent(true);
          toast.success(t.checkEmail);
        }
      } else if (mode === "signup") {
        const validation = signUpSchema.safeParse({ email, password, businessName, businessType });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, businessName, businessType || undefined);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Welcome to kitz.");
          navigate("/dashboard");
        }
      } else {
        const validation = signInSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast.error("Invalid email or password");
        } else {
          toast.success(t.welcomeBack + "!");
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setResetEmailSent(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  if (mode === "forgot" && resetEmailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h1 className="text-3xl font-semibold text-foreground">kitz.io</h1>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "ES" : "EN"}
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in text-center" style={{ animationDelay: "100ms" }}>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">{t.checkEmail}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t.resetLinkSent} <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => handleModeChange("signin")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToSignIn}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="text-3xl font-semibold text-foreground">kitz.io</h1>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Globe className="w-4 h-4" />
            {language === "en" ? "ES" : "EN"}
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in" style={{ animationDelay: "100ms" }}>
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => handleModeChange("signin")}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t.backToSignIn}
            </button>
          )}
          
          <h2 className="text-xl font-medium text-foreground mb-2">
            {mode === "signup" ? t.createAccount : mode === "forgot" ? t.resetPassword : t.welcomeBack}
          </h2>
          
          {mode === "forgot" && (
            <p className="text-sm text-muted-foreground mb-6">
              {t.enterEmailForReset}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="businessName">{t.businessName}</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Maria's Bakery"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">{t.businessType} (optional)</Label>
                  <Input
                    id="businessType"
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="Restaurant, Salon, Retail..."
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.password}</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => handleModeChange("forgot")}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {t.forgotPassword}
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? t.loading
                : mode === "signup" 
                  ? t.createAccount
                  : mode === "forgot" 
                    ? t.sendResetLink
                    : t.signIn
              }
            </Button>
          </form>

          {mode !== "forgot" && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => handleModeChange(mode === "signup" ? "signin" : "signup")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === "signup" ? t.alreadyHaveAccount : t.noAccount}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
