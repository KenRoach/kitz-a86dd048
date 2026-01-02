import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StorefrontWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "name" | "description" | "price" | "confirm";

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
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ["name", "description", "price", "confirm"];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "name":
        return title.trim().length > 0;
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

  const handleCreate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const slug = generateSlug(title);
      const { error } = await supabase.from("storefronts").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
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
    setPrice("");
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

      case "description":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Describe "{title}"</h3>
              <p className="text-sm text-muted-foreground">Help customers know what they're getting</p>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grilled chicken with rice, beans, and fresh vegetables..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Optional — you can skip this</p>
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
              <p className="text-sm text-muted-foreground">Here's what you're about to share</p>
            </div>
            
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
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
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-semibold text-foreground">${parseFloat(price).toFixed(2)}</p>
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
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
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
        <div className="flex items-center justify-between p-6 pt-0">
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
              {step === "description" ? "Skip" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
