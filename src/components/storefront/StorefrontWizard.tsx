import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Sparkles, Check, Upload, X, Send, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BundleItemsInput, BundleItem, createEmptyItem } from "./BundleItemsInput";

interface StorefrontWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "type" | "what" | "details" | "confirm";
type StorefrontType = "single" | "bundle";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Date.now().toString(36);
};

export function StorefrontWizard({ open, onClose, onCreated }: StorefrontWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("type");
  const [storefrontType, setStorefrontType] = useState<StorefrontType>("single");
  
  // Single item fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Bundle fields
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([createEmptyItem()]);
  
  // Common fields
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendNow, setSendNow] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["type", "what", "details", "confirm"];
  const currentIndex = steps.indexOf(step);

  const getBundleTotal = () => {
    return bundleItems.reduce((sum, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseInt(item.quantity) || 1;
      return sum + (p * q);
    }, 0);
  };

  const canProceed = () => {
    switch (step) {
      case "type":
        return true;
      case "what":
        if (storefrontType === "single") {
          return title.trim().length > 0 && parseFloat(price) > 0;
        } else {
          return bundleTitle.trim().length > 0 && 
                 bundleItems.some(item => item.title.trim() && parseFloat(item.price) > 0);
        }
      case "details":
        return true;
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

      const isBundle = storefrontType === "bundle";
      const storefrontTitle = isBundle ? bundleTitle : title;
      const slug = generateSlug(storefrontTitle);
      
      // Calculate total price
      let totalPrice: number;
      let mainImageUrl: string | null = null;
      
      if (isBundle) {
        totalPrice = getBundleTotal();
        // Use first item's image as main image if available
        const firstItemWithImage = bundleItems.find(item => item.imageFile);
        if (firstItemWithImage?.imageFile) {
          mainImageUrl = await uploadImage(firstItemWithImage.imageFile);
        }
      } else {
        totalPrice = parseFloat(price) * parseInt(quantity);
        if (imageFile) {
          mainImageUrl = await uploadImage(imageFile);
        }
      }

      // Create the storefront
      const { data: storefrontData, error: storefrontError } = await supabase
        .from("storefronts")
        .insert({
          user_id: user.id,
          title: storefrontTitle.trim(),
          description: null,
          price: totalPrice,
          quantity: isBundle ? 1 : parseInt(quantity),
          customer_name: null,
          customer_phone: null,
          fulfillment_note: fulfillmentNote.trim() || null,
          image_url: mainImageUrl,
          slug,
          status: sendNow ? "sent" : "draft",
          is_bundle: isBundle,
          seller_phone: profile?.phone || null,
          payment_cards: (profile as any)?.payment_cards ?? false,
          payment_yappy: (profile as any)?.payment_yappy ?? false,
          payment_cash: (profile as any)?.payment_cash ?? true,
          payment_pluxee: (profile as any)?.payment_pluxee ?? false,
        })
        .select("id")
        .single();

      if (storefrontError || !storefrontData) {
        toast.error("Failed to create storefront");
        return;
      }

      // If bundle, insert bundle items
      if (isBundle) {
        const validItems = bundleItems.filter(item => item.title.trim() && parseFloat(item.price) > 0);
        
        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          let itemImageUrl: string | null = null;
          if (item.imageFile) {
            itemImageUrl = await uploadImage(item.imageFile);
          }
          
          await supabase.from("storefront_items").insert({
            storefront_id: storefrontData.id,
            title: item.title.trim(),
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity) || 1,
            image_url: itemImageUrl,
            sort_order: i,
          });
        }
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user.id,
        type: "storefront",
        message: `Created ${isBundle ? "bundle" : "storefront"}: ${storefrontTitle} — $${totalPrice.toFixed(2)}`
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
    setStep("type");
    setStorefrontType("single");
    setTitle("");
    setPrice("");
    setQuantity("1");
    setFulfillmentNote("");
    setImageFile(null);
    setImagePreview(null);
    setBundleTitle("");
    setBundleItems([createEmptyItem()]);
    setSendNow(true);
    onClose();
  };

  const totalPrice = storefrontType === "single" 
    ? (parseFloat(price) || 0) * (parseInt(quantity) || 1)
    : getBundleTotal();

  const displayTitle = storefrontType === "single" ? title : bundleTitle;

  const renderStep = () => {
    switch (step) {
      case "type":
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">What are you creating?</h3>
                <p className="text-sm text-muted-foreground">Choose a storefront type</p>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => { setStorefrontType("single"); handleNext(); }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all hover:border-primary/50",
                  storefrontType === "single" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <ShoppingBag className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Single Item</p>
                    <p className="text-sm text-muted-foreground">One product or service</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setStorefrontType("bundle"); handleNext(); }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all hover:border-primary/50",
                  storefrontType === "bundle" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Package className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Bundle</p>
                    <p className="text-sm text-muted-foreground">Multiple items in one order</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case "what":
        if (storefrontType === "single") {
          return (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">What are you selling?</h3>
                  <p className="text-sm text-muted-foreground">One item per storefront</p>
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
        } else {
          // Bundle
          return (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Create your bundle</h3>
                  <p className="text-sm text-muted-foreground">Add multiple items to one order</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Bundle name</label>
                <Input
                  value={bundleTitle}
                  onChange={(e) => setBundleTitle(e.target.value)}
                  placeholder="e.g., Party Package, Weekly Meal Prep..."
                  className="text-lg"
                  autoFocus
                />
              </div>

              <BundleItemsInput items={bundleItems} onChange={setBundleItems} />
            </div>
          );
        }

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
              {storefrontType === "single" && imagePreview && (
                <img src={imagePreview} alt={title} className="w-full h-24 object-cover" />
              )}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{displayTitle}</p>
                    {storefrontType === "single" && parseInt(quantity) > 1 && (
                      <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                    )}
                    {storefrontType === "bundle" && (
                      <p className="text-xs text-muted-foreground">
                        {bundleItems.filter(i => i.title.trim()).length} items
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-semibold text-foreground">${totalPrice.toFixed(2)}</p>
                </div>

                {/* Bundle items preview */}
                {storefrontType === "bundle" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {bundleItems.filter(i => i.title.trim()).map((item, idx) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.title}
                          {parseInt(item.quantity) > 1 && ` (×${item.quantity})`}
                        </span>
                        <span className="text-foreground">
                          ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
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

        {step !== "type" && (
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
                {step === "details" ? "Skip" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}