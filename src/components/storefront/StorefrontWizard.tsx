import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Sparkles, Check, Upload, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StorefrontWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "what" | "confirm";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Date.now().toString(36);
};

export function StorefrontWizard({ open, onClose, onCreated }: StorefrontWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("what");
  
  // Item fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendNow, setSendNow] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["what", "confirm"];
  const currentIndex = steps.indexOf(step);

  const totalPrice = (parseFloat(price) || 0) * (parseInt(quantity) || 1);

  const canProceed = () => {
    switch (step) {
      case "what":
        return title.trim().length > 0 && parseFloat(price) > 0;
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
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from("storefront-images").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("storefront-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch seller's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, payment_cards, payment_yappy, payment_cash, payment_pluxee")
        .eq("user_id", user.id)
        .maybeSingle();

      const slug = generateSlug(title);
      
      let mainImageUrl: string | null = null;
      if (imageFile) {
        mainImageUrl = await uploadImage(imageFile);
      }

      // Create the storefront
      const { error: storefrontError } = await supabase
        .from("storefronts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: null,
          price: totalPrice,
          quantity: parseInt(quantity),
          customer_name: null,
          customer_phone: null,
          fulfillment_note: null,
          image_url: mainImageUrl,
          slug,
          status: sendNow ? "sent" : "draft",
          is_bundle: false,
          seller_phone: profile?.phone || null,
          payment_cards: (profile as any)?.payment_cards ?? false,
          payment_yappy: (profile as any)?.payment_yappy ?? false,
          payment_cash: (profile as any)?.payment_cash ?? true,
          payment_pluxee: (profile as any)?.payment_pluxee ?? false,
        });

      if (storefrontError) {
        toast.error("Failed to create storefront");
        return;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user.id,
        type: "storefront",
        message: `Created storefront: ${title} — $${totalPrice.toFixed(2)}`
      });

      toast.success(sendNow ? "Storefront created and ready to share!" : "Storefront saved as draft");
      resetAndClose();
      onCreated();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep("what");
    setTitle("");
    setPrice("");
    setQuantity("1");
    setImageFile(null);
    setImagePreview(null);
    setSendNow(true);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case "what":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-foreground">What are you selling?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Create a shareable order link</p>
              </div>
            </div>

            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chicken Bowl, Cupcakes..."
                className="text-base py-4 sm:py-5"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground mb-1 block">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base sm:text-lg text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-7 sm:pl-8 text-base sm:text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-base sm:text-lg"
                />
              </div>
            </div>

            {parseFloat(price) > 0 && parseInt(quantity) > 1 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">${totalPrice.toFixed(2)}</span>
              </p>
            )}

            {/* Image upload */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-24 sm:h-32 object-cover rounded-xl" />
                <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 sm:py-4 border border-dashed border-border rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">Add photo (optional)</span>
              </button>
            )}
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-medium text-foreground">Ready to share?</h3>
            </div>

            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {imagePreview && (
                <img src={imagePreview} alt={title} className="w-full h-20 sm:h-24 object-cover" />
              )}
              <div className="p-3 sm:p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">{title}</p>
                    {parseInt(quantity) > 1 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Qty: {quantity}</p>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-foreground">${totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSendNow(true)}
                className={cn(
                  "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all",
                  sendNow
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                Share now
              </button>
              <button
                onClick={() => setSendNow(false)}
                className={cn(
                  "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all",
                  !sendNow
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                Save draft
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto p-0 gap-0 overflow-hidden max-h-[85vh] overflow-y-auto rounded-2xl">
        <div className="flex gap-1 p-3 sm:p-4 pb-0 sticky top-0 bg-background z-10">
          {steps.map((s, i) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", i <= currentIndex ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        <div className="p-4 sm:p-6">{renderStep()}</div>

        <div className="flex items-center justify-between p-4 sm:p-6 pt-0 sticky bottom-0 bg-background">
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={currentIndex === 0} className={cn(currentIndex === 0 && "invisible")}>
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {step === "confirm" ? (
            <Button onClick={handleCreate} disabled={loading} size="sm">
              {loading ? "Creating..." : <><Check className="w-4 h-4 mr-1 sm:mr-2" />{sendNow ? "Create & Share" : "Save Draft"}</>}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} size="sm">
              Continue
              <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}