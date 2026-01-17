import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { contactId, contactName, contactEmail, eventDate, eventTime, eventTitle, eventDescription } = await req.json();

    // Get user's Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Google Calendar not connected. Please connect your Google account first.");
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    if (new Date(tokenData.expires_at) <= new Date()) {
      const refreshedTokens = await refreshAccessToken(tokenData.refresh_token);
      accessToken = refreshedTokens.access_token;
      
      // Update tokens in database
      await supabase
        .from("user_google_tokens")
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Create calendar event
    const startDateTime = new Date(`${eventDate}T${eventTime || "10:00"}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event = {
      summary: eventTitle || `Reunión con ${contactName}`,
      description: eventDescription || `Reunión de seguimiento con ${contactName}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "America/Panama",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/Panama",
      },
      attendees: contactEmail ? [{ email: contactEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const calendarData = await calendarResponse.json();

    if (calendarData.error) {
      throw new Error(calendarData.error.message || "Failed to create calendar event");
    }

    // Update contact with calendar reminder sent flag
    if (contactId) {
      await supabase
        .from("consultant_contacts")
        .update({ 
          calendar_reminder_sent: true,
          last_interaction: new Date().toISOString()
        })
        .eq("id", contactId)
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: calendarData.id,
        eventLink: calendarData.htmlLink 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
