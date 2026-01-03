import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  selectedId?: string;
}

export function ProductSelector({ onSelect, selectedId }: ProductSelectorProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("products")
        .select("id, title, description, price, image_url, category")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("title", { ascending: true });
      
      setProducts((data || []) as Product[]);
      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-muted/30 rounded-xl">
        <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No products in catalog</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Add products first or enter details manually</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onSelect(product)}
          className={cn(
            "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
            selectedId === product.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          {/* Image */}
          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
            <p className="text-sm text-primary font-semibold">${product.price.toFixed(2)}</p>
          </div>
          
          {/* Selected indicator */}
          {selectedId === product.id && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
