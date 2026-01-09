import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency_ms: number };
    storage: { status: string };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: HealthStatus["checks"] = {
    database: { status: "unknown", latency_ms: 0 },
    storage: { status: "unknown" },
  };

  let overallStatus: HealthStatus["status"] = "healthy";

  try {
    // Initialize Supabase client with service role for health checks
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check 1: Database connectivity and latency
    const dbStart = Date.now();
    try {
      const { error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      const dbLatency = Date.now() - dbStart;
      checks.database.latency_ms = dbLatency;
      
      if (error) {
        checks.database.status = "error";
        overallStatus = "degraded";
        console.error("Database check failed:", error.message);
      } else if (dbLatency > 1000) {
        checks.database.status = "slow";
        overallStatus = "degraded";
      } else {
        checks.database.status = "ok";
      }
    } catch (dbError) {
      checks.database.status = "error";
      overallStatus = "unhealthy";
      console.error("Database connection failed:", dbError);
    }

    // Check 2: Storage availability
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        checks.storage.status = "error";
        if (overallStatus === "healthy") overallStatus = "degraded";
      } else {
        checks.storage.status = "ok";
      }
    } catch (storageError) {
      checks.storage.status = "error";
      if (overallStatus === "healthy") overallStatus = "degraded";
    }

    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      checks,
    };

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === "healthy" ? 200 : 
                       overallStatus === "degraded" ? 200 : 503;

    return new Response(JSON.stringify(response, null, 2), {
      status: httpStatus,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Health check error:", error);
    
    const response: HealthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      checks,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
