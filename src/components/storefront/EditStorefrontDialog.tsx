import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Storefront {
  id: string;
  title: string;
  description: string | null;
  price: number;
}

interface EditStorefrontDialogProps {
  storefront: Storefront | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditStorefrontDialog({ storefront, open, onClose, onUpdated }: EditStorefrontDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storefront) {
      setTitle(storefront.title);
      setDescription(storefront.description || "");
      setPrice(storefront.price.toString());
    }
  }, [storefront]);

  const handleSave = async () => {
    if (!storefront) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("storefronts")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
        })
        .eq("id", storefront.id);

      if (error) {
        toast.error("Failed to update storefront");
        return;
      }

      toast.success("Storefront updated");
      onClose();
      onUpdated();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit storefront</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label htmlFor="edit-price">Price</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
