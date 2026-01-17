import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GoogleCalendarConnectProps {
  language?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleCalendarConnect({ language = "es", onConnectionChange }: GoogleCalendarConnectProps) {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const isSpanish = language === "es";

  useEffect(() => {
    checkConnection();
  }, [session]);

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state && session?.user?.id === state) {
      handleOAuthCallback(code);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [session]);

  const checkConnection = async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "check-connection" },
      });

      if (error) throw error;
      setIsConnected(data.connected);
      onConnectionChange?.(data.connected);
    } catch (error) {
      console.error("Error checking connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { 
          action: "exchange-code", 
          code,
          redirectUri 
        },
      });

      if (error) throw error;
      
      setIsConnected(true);
      onConnectionChange?.(true);
      toast.success(isSpanish ? "Google Calendar conectado" : "Google Calendar connected");
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      toast.error(error.message || (isSpanish ? "Error al conectar" : "Connection error"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { 
          action: "get-auth-url",
          redirectUri 
        },
      });

      if (error) throw error;
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Error getting auth URL:", error);
      toast.error(error.message || (isSpanish ? "Error al conectar" : "Connection error"));
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "disconnect" },
      });

      if (error) throw error;
      
      setIsConnected(false);
      onConnectionChange?.(false);
      toast.success(isSpanish ? "Google Calendar desconectado" : "Google Calendar disconnected");
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(error.message || (isSpanish ? "Error al desconectar" : "Disconnect error"));
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {isSpanish ? "Verificando..." : "Checking..."}
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4 mr-1" />
          <span>{isSpanish ? "Conectado" : "Connected"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Calendar className="h-4 w-4 mr-2" />
      )}
      {isSpanish ? "Conectar Google Calendar" : "Connect Google Calendar"}
    </Button>
  );
}
