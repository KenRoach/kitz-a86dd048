import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface ApiKeySectionProps {
  language: string;
}

export function ApiKeySection({ language }: ApiKeySectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [keyName, setKeyName] = useState("");

  const es = language === "es";

  const loadKeys = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: { action: "list" },
      });
      if (error) throw error;
      setKeys(data.keys || []);
    } catch {
      toast.error(es ? "Error cargando llaves" : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, [es]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: { action: "generate", name: keyName || "Default" },
      });
      if (error) throw error;
      setNewKey(data.api_key);
      setShowKey(true);
      setKeyName("");
      loadKeys();
      toast.success(es ? "Llave creada" : "API key created");
    } catch {
      toast.error(es ? "Error generando llave" : "Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("generate-api-key", {
        body: { action: "revoke", key_id: id },
      });
      if (error) throw error;
      loadKeys();
      toast.success(es ? "Llave revocada" : "Key revoked");
    } catch {
      toast.error(es ? "Error revocando" : "Failed to revoke");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(es ? "Copiado" : "Copied");
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiEndpoint = `https://${projectId}.supabase.co/functions/v1/inbound-api`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Key className="w-4 h-4 text-primary" />
          {es ? "Llaves de API" : "API Keys"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {es
            ? "Genera una llave para que workspace.kitz.services envíe datos a tu cuenta (contactos, órdenes, vitrinas)."
            : "Generate a key so workspace.kitz.services can push data to your account (contacts, orders, storefronts)."}
        </p>

        {/* API Endpoint */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Endpoint
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-foreground flex-1 break-all">{apiEndpoint}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(apiEndpoint)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* New key reveal */}
        {newKey && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-primary">
              {es ? "⚠️ Copia esta llave ahora. No se mostrará de nuevo." : "⚠️ Copy this key now. It won't be shown again."}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs flex-1 break-all font-mono">
                {showKey ? newKey : "•".repeat(40)}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(newKey)}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setNewKey(null)}>
              {es ? "Cerrar" : "Dismiss"}
            </Button>
          </div>
        )}

        {/* Generate new key */}
        <div className="flex gap-2">
          <Input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder={es ? "Nombre (ej: KITZ)" : "Name (e.g., KITZ)"}
            className="text-sm"
          />
          <Button size="sm" onClick={handleGenerate} disabled={generating} className="shrink-0 gap-1.5">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {es ? "Crear" : "Create"}
          </Button>
        </div>

        {/* Existing keys */}
        {loading ? (
          <p className="text-xs text-muted-foreground">{es ? "Cargando..." : "Loading..."}</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-muted-foreground">{es ? "Sin llaves" : "No keys yet"}</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{k.name}</span>
                    <Badge variant={k.is_active ? "default" : "secondary"} className="text-[10px] h-4">
                      {k.is_active ? (es ? "Activa" : "Active") : (es ? "Revocada" : "Revoked")}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {k.key_prefix}...
                    {k.last_used_at && (
                      <span className="ml-2">
                        {es ? "Último uso:" : "Last used:"} {new Date(k.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                {k.is_active && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(k.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
