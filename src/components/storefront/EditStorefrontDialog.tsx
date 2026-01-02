import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Storefront {
  id: string;
  title: string;
  description: string | null;
  comment: string | null;
  price: number;
  image_url: string | null;
}

interface EditStorefrontDialogProps {
  storefront: Storefront | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditStorefrontDialog({ storefront, open, onClose, onUpdated }: EditStorefrontDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storefront) {
      setTitle(storefront.title);
      setDescription(storefront.description || "");
      setComment(storefront.comment || "");
      setPrice(storefront.price.toString());
      setImageUrl(storefront.image_url);
      setImagePreview(storefront.image_url);
      setImageFile(null);
    }
  }, [storefront]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return imageUrl;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("storefront-images")
      .upload(fileName, imageFile);

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("storefront-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

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
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage();
        if (finalImageUrl === null && imageFile) {
          toast.error("Failed to upload image");
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("storefronts")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          comment: comment.trim() || null,
          price: parseFloat(price),
          image_url: finalImageUrl,
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit storefront</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Image */}
          <div>
            <Label>Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative mt-1.5">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 mt-1.5 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
              </button>
            )}
          </div>

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
              className="mt-1.5 min-h-[80px] resize-none"
            />
          </div>

          <div>
            <Label htmlFor="edit-comment">Note</Label>
            <Textarea
              id="edit-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Best seller! Usually ready in 15 min..."
              className="mt-1.5 min-h-[60px] resize-none"
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
