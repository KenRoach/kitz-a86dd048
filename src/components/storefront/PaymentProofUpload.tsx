import { useState, useRef } from "react";
import { Camera, Upload, X, CheckCircle, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentProofUploadProps {
  storefrontId: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export function PaymentProofUpload({ storefrontId, onUploadComplete }: PaymentProofUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${storefrontId}/payment-proof-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("storefront-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("storefront-images")
        .getPublicUrl(fileName);

      // Update storefront with payment proof URL
      const { error: updateError } = await supabase
        .from("storefronts")
        .update({ payment_proof_url: urlData.publicUrl })
        .eq("id", storefrontId);

      if (updateError) throw updateError;

      setUploaded(true);
      onUploadComplete?.(urlData.publicUrl);
      toast.success("Payment proof uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploaded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  if (uploaded && preview) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-2xl p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
            <img src={preview} alt="Payment proof" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Proof uploaded</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The seller will verify your payment
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Remove"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-action" />
        <span className="text-sm font-medium text-foreground">Upload payment proof</span>
      </div>
      
      {preview ? (
        <div className="relative">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            </div>
          )}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera capture - primary on mobile */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-action/30 bg-action/5 transition-all",
              "hover:border-action/50 hover:bg-action/10 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-action/10 flex items-center justify-center">
              <Camera className="w-6 h-6 text-action" />
            </div>
            <span className="text-sm font-medium text-foreground">Take photo</span>
          </button>

          {/* File upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border transition-all",
              "hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Choose file</span>
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Screenshot of Yappy, bank transfer, or receipt photo
      </p>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
