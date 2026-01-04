import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

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
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Check if we already have a session (user clicked link)
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
        toast.success("Password updated successfully");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-semibold text-foreground">kitz.io</h1>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in text-center" style={{ animationDelay: "100ms" }}>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Password updated</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your password has been successfully reset
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to dashboard
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
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-semibold text-foreground">kitz.io</h1>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in text-center" style={{ animationDelay: "100ms" }}>
            <h2 className="text-xl font-medium text-foreground mb-2">Invalid or expired link</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-semibold text-foreground">kitz.io</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-medium text-foreground mb-2">Set new password</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
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
              <Label htmlFor="confirmPassword">Confirm password</Label>
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
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
