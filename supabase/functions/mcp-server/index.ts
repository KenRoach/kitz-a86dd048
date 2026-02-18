import { Hono } from "https://deno.land/x/hono@v4.3.4/mod.ts";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const app = new Hono();

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function requireUserId(args: Record<string, unknown>): string {
  const uid = args.user_id as string;
  if (!uid) throw new Error("user_id is required");
  return uid;
}

const mcp = new McpServer({
  name: "kitz",
  version: "1.0.0",
});

// ── LIST CONTACTS ──
mcp.tool("list_contacts", {
  description: "List CRM contacts for a user. Returns name, phone, email, status, lead_score, lifetime_value, tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const, description: "The user's UUID" },
      status: { type: "string" as const, description: "Filter by status (active, inactive, lead)" },
      limit: { type: "number" as const, description: "Max results (default 50)" },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    let q = sb.from("crm_contacts").select("id,name,phone,email,status,lead_score,lifetime_value,tags,last_interaction_at").eq("user_id", uid).order("last_interaction_at", { ascending: false }).limit((args.limit as number) || 50);
    if (args.status) q = q.eq("status", args.status as string);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── GET CONTACT ──
mcp.tool("get_contact", {
  description: "Get a single CRM contact by ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      contact_id: { type: "string" as const },
    },
    required: ["user_id", "contact_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    const { data, error } = await sb.from("crm_contacts").select("*").eq("user_id", uid).eq("id", args.contact_id as string).single();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── CREATE CONTACT ──
mcp.tool("create_contact", {
  description: "Create a new CRM contact.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      name: { type: "string" as const },
      phone: { type: "string" as const },
      email: { type: "string" as const },
      source_channel: { type: "string" as const, description: "e.g. whatsapp, instagram, manual" },
      notes: { type: "string" as const },
    },
    required: ["user_id", "name"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    const { data, error } = await sb.from("crm_contacts").insert({
      user_id: uid,
      name: args.name as string,
      phone: (args.phone as string) || null,
      email: (args.email as string) || null,
      source_channel: (args.source_channel as string) || "manual",
      tags: [],
      notes: (args.notes as string) || null,
    }).select("id,name").single();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── LIST ORDERS ──
mcp.tool("list_orders", {
  description: "List orders for a user. Returns order details including payment/fulfillment status, total, contact info.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      payment_status: { type: "string" as const, description: "Filter: pending, paid, overdue" },
      fulfillment_status: { type: "string" as const, description: "Filter: pending, fulfilled, delivered" },
      limit: { type: "number" as const },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    let q = sb.from("orders").select("id,order_number,total,cost,margin,payment_status,fulfillment_status,payment_method,channel,contact_id,created_at,paid_at,delivered_at,risk_flag,notes").eq("user_id", uid).order("created_at", { ascending: false }).limit((args.limit as number) || 50);
    if (args.payment_status) q = q.eq("payment_status", args.payment_status as string);
    if (args.fulfillment_status) q = q.eq("fulfillment_status", args.fulfillment_status as string);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── LIST STOREFRONTS ──
mcp.tool("list_storefronts", {
  description: "List storefronts (payment links / product pages) for a user.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      status: { type: "string" as const, description: "Filter: draft, sent, paid" },
      limit: { type: "number" as const },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    let q = sb.from("storefronts").select("id,title,slug,price,status,fulfillment_status,buyer_name,buyer_phone,created_at,paid_at,is_bundle").eq("user_id", uid).order("created_at", { ascending: false }).limit((args.limit as number) || 50);
    if (args.status) q = q.eq("status", args.status as string);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── LIST FOLLOW-UPS ──
mcp.tool("list_follow_ups", {
  description: "List follow-up reminders. Shows pending tasks for customer outreach.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      status: { type: "string" as const, description: "pending, completed, overdue" },
      limit: { type: "number" as const },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    let q = sb.from("follow_ups").select("id,reason,status,due_at,completed_at,channel,contact_id,order_id").eq("user_id", uid).order("due_at", { ascending: true }).limit((args.limit as number) || 50);
    if (args.status) q = q.eq("status", args.status as string);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── CREATE FOLLOW-UP ──
mcp.tool("create_follow_up", {
  description: "Schedule a new follow-up reminder for a contact or order.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      reason: { type: "string" as const, description: "Why follow up" },
      due_at: { type: "string" as const, description: "ISO 8601 datetime" },
      contact_id: { type: "string" as const },
      order_id: { type: "string" as const },
      channel: { type: "string" as const, description: "whatsapp, email, phone" },
    },
    required: ["user_id", "reason", "due_at"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    const { data, error } = await sb.from("follow_ups").insert({
      user_id: uid,
      reason: args.reason as string,
      due_at: args.due_at as string,
      contact_id: (args.contact_id as string) || null,
      order_id: (args.order_id as string) || null,
      channel: (args.channel as string) || "whatsapp",
    }).select("id,reason,due_at").single();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── LIST PRODUCTS ──
mcp.tool("list_products", {
  description: "List product catalog items.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      category: { type: "string" as const },
      limit: { type: "number" as const },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    let q = sb.from("products").select("id,title,price,category,type,is_active,image_url").eq("user_id", uid).eq("is_active", true).order("created_at", { ascending: false }).limit((args.limit as number) || 50);
    if (args.category) q = q.eq("category", args.category as string);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

// ── BUSINESS SUMMARY ──
mcp.tool("business_summary", {
  description: "Get a high-level business summary: total orders, revenue, pending follow-ups, active contacts.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
    },
    required: ["user_id"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    const [orders, contacts, followups, storefronts] = await Promise.all([
      sb.from("orders").select("total,payment_status", { count: "exact" }).eq("user_id", uid),
      sb.from("crm_contacts").select("id", { count: "exact" }).eq("user_id", uid),
      sb.from("follow_ups").select("id", { count: "exact" }).eq("user_id", uid).eq("status", "pending"),
      sb.from("storefronts").select("id", { count: "exact" }).eq("user_id", uid),
    ]);
    const totalRevenue = (orders.data || [])
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const summary = {
      total_orders: orders.count || 0,
      total_revenue: totalRevenue,
      total_contacts: contacts.count || 0,
      pending_follow_ups: followups.count || 0,
      total_storefronts: storefronts.count || 0,
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(summary) }] };
  },
});

// ── SEND INBOX MESSAGE ──
mcp.tool("send_inbox_message", {
  description: "Store a message in the unified inbox. Useful for logging outbound communications.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      body: { type: "string" as const },
      subject: { type: "string" as const },
      sender_name: { type: "string" as const },
      sender_email: { type: "string" as const },
      direction: { type: "string" as const, description: "inbound or outbound" },
      contact_id: { type: "string" as const },
    },
    required: ["user_id", "body"],
  },
  handler: async (args: Record<string, unknown>) => {
    const uid = requireUserId(args);
    const sb = getSupabase();
    const { data, error } = await sb.from("inbox_messages").insert({
      user_id: uid,
      body: args.body as string,
      subject: (args.subject as string) || null,
      sender_name: (args.sender_name as string) || null,
      sender_email: (args.sender_email as string) || null,
      direction: (args.direction as string) || "outbound",
      channel: "email",
      contact_id: (args.contact_id as string) || null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  },
});

const transport = new StreamableHttpTransport();
const handler = transport.bind(mcp);

app.all("/*", async (c) => {
  return await handler(c.req.raw);
});

Deno.serve(app.fetch);
