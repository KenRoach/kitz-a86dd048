import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Upload, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface BundleItem {
  id: string;
  title: string;
  price: string;
  quantity: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface BundleItemsInputProps {
  items: BundleItem[];
  onChange: (items: BundleItem[]) => void;
}

const createEmptyItem = (): BundleItem => ({
  id: crypto.randomUUID(),
  title: "",
  price: "",
  quantity: "1",
  imageFile: null,
  imagePreview: null,
});

export function BundleItemsInput({ items, onChange }: BundleItemsInputProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addItem = () => {
    onChange([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BundleItem>) => {
    onChange(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleImageSelect = (id: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateItem(id, { imageFile: file, imagePreview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    updateItem(id, { imageFile: null, imagePreview: null });
  };

  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="bg-muted/30 rounded-xl p-4 space-y-3 relative group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GripVertical className="w-4 h-4" />
              <span>Item {index + 1}</span>
            </div>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>

          <Input
            value={item.title}
            onChange={(e) => updateItem(item.id, { title: e.target.value })}
            placeholder="Item name"
            className="bg-background"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: e.target.value })}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>

          {/* Image upload */}
          <input
            ref={(el) => { fileInputRefs.current[item.id] = el; }}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageSelect(item.id, file);
            }}
            className="hidden"
          />
          {item.imagePreview ? (
            <div className="relative">
              <img src={item.imagePreview} alt="Preview" className="w-full h-20 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(item.id)}
                className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRefs.current[item.id]?.click()}
              className="w-full py-2 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add photo</span>
            </button>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Add another item
      </Button>

      {items.length > 0 && total > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Bundle total</span>
          <span className="text-xl font-bold text-foreground">${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export { createEmptyItem };
