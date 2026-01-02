import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type Step = "what" | "who" | "details" | "confirm";

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
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendNow, setSendNow] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["what", "who", "details", "confirm"];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "what":
        return title.trim().length > 0 && parseFloat(price) > 0;
      case "who":
        return true; // Optional
      case "details":
        return true; // Optional
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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("storefront-images").upload(fileName, imageFile);
    if (error) return null;
    const { data } = supabase.storage.from("storefront-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const slug = generateSlug(title);
      const totalPrice = parseFloat(price) * parseInt(quantity);

      const { error } = await supabase.from("storefronts").insert({
        user_id: user.id,
        title: title.trim(),
        description: null,
        price: totalPrice,
        quantity: parseInt(quantity),
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        fulfillment_note: fulfillmentNote.trim() || null,
        image_url: imageUrl,
        slug,
        status: sendNow ? "sent" : "draft",
      });

      if (error) {
        toast.error("Failed to create storefront");
        return;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user.id,
        type: "storefront",
        message: `Created storefront: ${title} — $${totalPrice.toFixed(2)}`
      });

      // If customer provided, add to CRM
      if (customerName.trim()) {
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", customerName.trim())
          .maybeSingle();

        if (!existing) {
          await supabase.from("customers").insert({
            user_id: user.id,
            name: customerName.trim(),
            phone: customerPhone.trim() || null,
            lifecycle: "lead",
            tags: ["New"]
          });

          await supabase.from("activity_log").insert({
            user_id: user.id,
            type: "customer",
            message: `New customer: ${customerName}`
          });
        }
      }

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
    setCustomerName("");
    setCustomerPhone("");
    setFulfillmentNote("");
    setImageFile(null);
    setImagePreview(null);
    setSendNow(true);
    onClose();
  };

  const totalPrice = (parseFloat(price) || 0) * (parseInt(quantity) || 1);

  const renderStep = () => {
    switch (step) {
      case "what":
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">What are you selling?</h3>
                <p className="text-sm text-muted-foreground">One item or bundle per storefront</p>
              </div>
            </div>

            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chicken Bowl, 24 Cupcakes, Haircut..."
                className="text-lg py-5"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>

            {parseFloat(price) > 0 && parseInt(quantity) > 1 && (
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">${totalPrice.toFixed(2)}</span>
              </p>
            )}

            {/* Image upload */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border border-dashed border-border rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add photo (optional)</span>
              </button>
            )}
          </div>
        );

      case "who":
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Who is this for?</h3>
              <p className="text-sm text-muted-foreground">Optional — helps you track the order</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Customer name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Maria Rodriguez"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phone (for WhatsApp)</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +1 555-0123"
              />
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground">Fulfillment details</h3>
              <p className="text-sm text-muted-foreground">How and when will you deliver?</p>
            </div>

            <Textarea
              value={fulfillmentNote}
              onChange={(e) => setFulfillmentNote(e.target.value)}
              placeholder="e.g., Pickup Friday 3pm, Delivery to 123 Main St..."
              className="min-h-[100px] resize-none"
              autoFocus
            />
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-foreground">Ready to share?</h3>
            </div>

            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {imagePreview && <img src={imagePreview} alt={title} className="w-full h-24 object-cover" />}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{title}</p>
                    {parseInt(quantity) > 1 && <p className="text-xs text-muted-foreground">Qty: {quantity}</p>}
                  </div>
                  <p className="text-xl font-semibold text-foreground">${totalPrice.toFixed(2)}</p>
                </div>
                {customerName && (
                  <p className="text-sm text-muted-foreground">For: {customerName}</p>
                )}
                {fulfillmentNote && (
                  <p className="text-sm text-muted-foreground">{fulfillmentNote}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSendNow(true)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                  sendNow
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Send className="w-4 h-4 inline mr-2" />
                Share now
              </button>
              <button
                onClick={() => setSendNow(false)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                  !sendNow
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                Save as draft
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex gap-1 p-4 pb-0 sticky top-0 bg-background z-10">
          {steps.map((s, i) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", i <= currentIndex ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        <div className="p-6">{renderStep()}</div>

        <div className="flex items-center justify-between p-6 pt-0 sticky bottom-0 bg-background">
          <Button variant="ghost" onClick={handleBack} disabled={currentIndex === 0} className={cn(currentIndex === 0 && "invisible")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === "confirm" ? (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : <><Check className="w-4 h-4 mr-2" />{sendNow ? "Create & Share" : "Save Draft"}</>}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              {step === "who" || step === "details" ? "Skip" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
