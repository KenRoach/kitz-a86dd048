import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Globe } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success(t.passwordUpdated);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h1 className="text-3xl font-semibold text-foreground">Kitz</h1>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "ES" : "EN"}
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in text-center" style={{ animationDelay: "100ms" }}>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">{t.passwordUpdated}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t.passwordResetSuccess}
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              {t.goToDashboard}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h1 className="text-3xl font-semibold text-foreground">Kitz</h1>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "ES" : "EN"}
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in text-center" style={{ animationDelay: "100ms" }}>
            <h2 className="text-xl font-medium text-foreground mb-2">{t.invalidResetLink}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t.linkExpired}
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
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
          <h1 className="text-3xl font-semibold text-foreground">Kitz</h1>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Globe className="w-4 h-4" />
            {language === "en" ? "ES" : "EN"}
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-medium text-foreground mb-2">{t.setNewPassword}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t.enterNewPassword}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">{t.newPassword}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.loading : t.setNewPassword}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
