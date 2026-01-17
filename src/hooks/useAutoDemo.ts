import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// User-specific key to avoid cross-account contamination
const getAutoDemoKey = (userId: string) => `kitz_auto_demo_${userId}`;

// Single demo product for new users
const DEMO_PRODUCT = { title: "[Demo] Mi Servicio", price: 50.00 };

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
      
      const demoKey = getAutoDemoKey(user.id);
      
      // Check if demo already created for THIS user
      const hasCreatedDemo = localStorage.getItem(demoKey);
      if (hasCreatedDemo) {
        setDemoCreated(true);
        return;
      }

      // Skip demo creation for consultants - they have their own dashboard
      const { data: consultantRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "consultant")
        .maybeSingle();

      if (consultantRole) {
        localStorage.setItem(demoKey, "true");
        setDemoCreated(true);
        return;
      }

      // Check if user already has storefronts
      const { count } = await supabase
        .from("storefronts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count > 0) {
        localStorage.setItem(demoKey, "true");
        setDemoCreated(true);
        return;
      }

      setIsCreating(true);

      try {
        const slug = generateSlug(DEMO_PRODUCT.title);

        const { error } = await supabase.from("storefronts").insert({
          user_id: user.id,
          title: DEMO_PRODUCT.title,
          price: DEMO_PRODUCT.price,
          quantity: 1,
          slug,
          status: "sent",
          is_bundle: false,
          description: "Este es un enlace de demostración. ¡Puedes editarlo o eliminarlo!",
          seller_phone: profile?.phone || null,
          payment_cards: profile?.payment_cards ?? false,
          payment_yappy: profile?.payment_yappy ?? false,
          payment_cash: profile?.payment_cash ?? true,
          payment_pluxee: profile?.payment_pluxee ?? false,
        });

        if (!error) {
          await supabase.from("activity_log").insert({
            user_id: user.id,
            type: "storefront",
            message: `¡Bienvenido! Creamos tu primer enlace: ${DEMO_PRODUCT.title}`
          });

          localStorage.setItem(demoKey, "true");
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
