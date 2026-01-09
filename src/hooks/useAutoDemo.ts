import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AUTO_DEMO_KEY = "kitz_auto_demo_created";

const DEMO_PRODUCTS = [
  { title: "Sample Product", price: 25.00 },
  { title: "Quick Service", price: 50.00 },
  { title: "Premium Package", price: 99.00 },
];

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Date.now().toString(36);
};

export function useAutoDemo() {
  const { user, profile } = useAuth();
  const [demoCreated, setDemoCreated] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const createDemoStorefront = async () => {
      if (!user || isCreating) return;
      
      // Check if demo already created
      const hasCreatedDemo = localStorage.getItem(AUTO_DEMO_KEY);
      if (hasCreatedDemo) {
        setDemoCreated(true);
        return;
      }

      // Check if user already has storefronts
      const { count } = await supabase
        .from("storefronts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count > 0) {
        localStorage.setItem(AUTO_DEMO_KEY, "true");
        setDemoCreated(true);
        return;
      }

      setIsCreating(true);

      try {
        // Pick a random demo product
        const demo = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
        const slug = generateSlug(demo.title);

        const { error } = await supabase.from("storefronts").insert({
          user_id: user.id,
          title: demo.title,
          price: demo.price,
          quantity: 1,
          slug,
          status: "draft",
          is_bundle: false,
          description: "Your first shareable link is ready! Edit or share it now.",
          seller_phone: profile?.phone || null,
          payment_cards: profile?.payment_cards ?? false,
          payment_yappy: profile?.payment_yappy ?? false,
          payment_cash: profile?.payment_cash ?? true,
          payment_pluxee: profile?.payment_pluxee ?? false,
        });

        if (!error) {
          // Log activity
          await supabase.from("activity_log").insert({
            user_id: user.id,
            type: "storefront",
            message: `Welcome! Created your first link: ${demo.title}`
          });

          localStorage.setItem(AUTO_DEMO_KEY, "true");
          setDemoCreated(true);
        }
      } catch (err) {
        console.error("Failed to create demo:", err);
      } finally {
        setIsCreating(false);
      }
    };

    createDemoStorefront();
  }, [user, profile, isCreating]);

  return { demoCreated, isCreating };
}
