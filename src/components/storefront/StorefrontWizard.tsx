import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Sparkles, Check, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StorefrontWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "name" | "image" | "description" | "price" | "confirm";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
};

export function StorefrontWizard({ open, onClose, onCreated }: StorefrontWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("name");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["name", "image", "description", "price", "confirm"];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "name":
        return title.trim().length > 0;
      case "image":
        return true; // Optional
      case "description":
        return true; // Optional
      case "price":
        return parseFloat(price) > 0;
      case "confirm":
        return true;
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

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

  const handleCreate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast.error("Failed to upload image");
          setLoading(false);
          return;
        }
      }

      const slug = generateSlug(title);
      const { error } = await supabase.from("storefronts").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        comment: comment.trim() || null,
        price: parseFloat(price),
        image_url: imageUrl,
        slug,
        status: "draft",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a storefront with this name");
        } else {
          toast.error("Failed to create storefront");
        }
        return;
      }

      toast.success("Storefront created!");
      resetAndClose();
      onCreated();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep("name");
    setTitle("");
    setDescription("");
    setComment("");
    setPrice("");
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case "name":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">What are you selling?</h3>
                <p className="text-sm text-muted-foreground">Give it a clear, catchy name</p>
              </div>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chicken Bowl, Birthday Cupcakes, Haircut..."
              className="text-lg py-6"
              autoFocus
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Add a photo</h3>
              <p className="text-sm text-muted-foreground">Show customers what they are getting</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl"
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
                className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                <div className="p-3 rounded-full bg-muted">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </button>
            )}
            <p className="text-xs text-muted-foreground text-center">Optional — you can skip this</p>
          </div>
        );

      case "description":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Describe "{title}"</h3>
              <p className="text-sm text-muted-foreground">Help customers know what they are getting</p>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grilled chicken with rice, beans, and fresh vegetables..."
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <div>
              <label className="text-sm text-muted-foreground">Add a note (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Best seller! Usually ready in 15 min..."
                className="min-h-[60px] resize-none mt-1.5"
              />
            </div>
          </div>
        );

      case "price":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">How much for "{title}"?</h3>
              <p className="text-sm text-muted-foreground">Set your price</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="text-3xl py-8 pl-10 font-semibold"
                autoFocus
              />
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Ready to create?</h3>
              <p className="text-sm text-muted-foreground">Here is what you are about to share</p>
            </div>
            
            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="text-lg font-medium text-foreground">{title}</p>
                </div>
                {description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-foreground">{description}</p>
                  </div>
                )}
                {comment && (
                  <div>
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="text-foreground text-sm italic">{comment}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-semibold text-foreground">${parseFloat(price).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Your link will be ready to share after creation
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0 sticky top-0 bg-background z-10">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 pt-0 sticky bottom-0 bg-background">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={cn(currentIndex === 0 && "invisible")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === "confirm" ? (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create storefront
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              {step === "image" || step === "description" ? "Skip" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
