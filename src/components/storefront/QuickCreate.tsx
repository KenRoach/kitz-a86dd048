import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface QuickCreateProps {
  onCreated: (slug: string, title: string, price: number) => void;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Date.now().toString(36);
};

export function QuickCreate({ onCreated }: QuickCreateProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const parseInput = (text: string) => {
    // Parse "title $price" or "title, $price" or just "title price"
    const priceMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)\s*$/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      const title = text.replace(priceMatch[0], "").replace(/[,\s]+$/, "").trim();
      return { title, price };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim()) return;

    const parsed = parseInput(input);
    if (!parsed || !parsed.title || parsed.price <= 0) {
      toast.error("Enter title and price (e.g., 'Chicken Bowl $12')");
      return;
    }

    setLoading(true);

    try {
      // Fetch seller's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, payment_cards, payment_yappy, payment_cash, payment_pluxee")
        .eq("user_id", user.id)
        .maybeSingle();

      const slug = generateSlug(parsed.title);

      const { error } = await supabase.from("storefronts").insert({
        user_id: user.id,
        title: parsed.title,
        price: parsed.price,
        quantity: 1,
        slug,
        status: "sent",
        is_bundle: false,
        seller_phone: profile?.phone || null,
        payment_cards: (profile as any)?.payment_cards ?? false,
        payment_yappy: (profile as any)?.payment_yappy ?? false,
        payment_cash: (profile as any)?.payment_cash ?? true,
        payment_pluxee: (profile as any)?.payment_pluxee ?? false,
      });

      if (error) {
        toast.error("Failed to create");
        return;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user.id,
        type: "storefront",
        message: `Quick create: ${parsed.title} — $${parsed.price.toFixed(2)}`
      });

      setInput("");
      onCreated(slug, parsed.title, parsed.price);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Quick: Chicken Bowl $12"
          className="pl-10 pr-4 py-5 text-sm bg-muted/50 border-dashed"
          disabled={loading}
        />
      </div>
      {input && parseInput(input) && (
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg"
        >
          {loading ? "..." : "Create"}
        </button>
      )}
    </form>
  );
}