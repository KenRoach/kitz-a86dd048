import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt, decrypt } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: "Vault not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, agent_id, key_name, secret_value } = await req.json();

    switch (action) {
      case "list": {
        const { data } = await supabase
          .from("agent_secrets")
          .select("id, agent_id, key_name, last_rotated_at, created_at")
          .eq("agent_id", agent_id);
        return new Response(JSON.stringify({ secrets: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set": {
        if (!key_name || !secret_value) {
          return new Response(JSON.stringify({ error: "key_name and secret_value required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const encrypted = await encrypt(secret_value, encryptionKey);
        const { error } = await supabase.from("agent_secrets").upsert(
          {
            user_id: user.id,
            agent_id,
            key_name,
            encrypted_value: encrypted,
            last_rotated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "agent_id,key_name" }
        );
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get": {
        const { data } = await supabase
          .from("agent_secrets")
          .select("encrypted_value")
          .eq("agent_id", agent_id)
          .eq("key_name", key_name)
          .single();
        if (!data) {
          return new Response(JSON.stringify({ error: "Secret not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const decrypted = await decrypt(data.encrypted_value, encryptionKey);
        return new Response(JSON.stringify({ value: decrypted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabase
          .from("agent_secrets")
          .delete()
          .eq("agent_id", agent_id)
          .eq("key_name", key_name);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Vault error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
