import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, CheckCircle, ImageIcon, Loader2, RefreshCw, RotateCw, Crop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface PaymentProofUploadProps {
  storefrontId: string;
  onUploadComplete?: (imageUrl: string) => void;
}

interface FileInfo {
  name: string;
  size: number;
  originalSize: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_MAX_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.8;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      mediaWidth / mediaHeight,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImage(
  imageSrc: string,
  crop: CropType,
  rotation: number
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Calculate rotated dimensions
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const cropWidth = (crop.width / 100) * image.naturalWidth;
  const cropHeight = (crop.height / 100) * image.naturalHeight;

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  const cropX = (crop.x / 100) * image.naturalWidth;
  const cropY = (crop.y / 100) * image.naturalHeight;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/jpeg",
      COMPRESSION_QUALITY
    );
  });
}

async function compressImage(blob: Blob): Promise<{ blob: Blob; wasCompressed: boolean }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;
      let wasCompressed = false;

      if (width > COMPRESSION_MAX_DIMENSION || height > COMPRESSION_MAX_DIMENSION) {
        wasCompressed = true;
        if (width > height) {
          height = Math.round((height * COMPRESSION_MAX_DIMENSION) / width);
          width = COMPRESSION_MAX_DIMENSION;
        } else {
          width = Math.round((width * COMPRESSION_MAX_DIMENSION) / height);
          height = COMPRESSION_MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob && compressedBlob.size < blob.size) {
            resolve({ blob: compressedBlob, wasCompressed: true });
          } else {
            resolve({ blob, wasCompressed: false });
          }
        },
        "image/jpeg",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(blob);
  });
}

export function PaymentProofUpload({ storefrontId, onUploadComplete }: PaymentProofUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [pendingFile, setPendingFile] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [rotation, setRotation] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetInputs = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, []);

  const uploadFile = useCallback(async (file: Blob, fileName: string) => {
    setUploading(true);
    setUploadError(false);
    setUploadProgress(0);

    try {
      const uploadPromise = new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

        const { data: { publicUrl } } = supabase.storage
          .from("storefront-images")
          .getPublicUrl(fileName);

        const uploadUrl = publicUrl.replace("/object/public/", "/object/");
        
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(file);
      });

      await uploadPromise;

      const { data: urlData } = supabase.storage
        .from("storefront-images")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("storefronts")
        .update({ payment_proof_url: urlData.publicUrl } as any)
        .eq("id", storefrontId);

      if (updateError) throw updateError;

      setUploaded(true);
      setPendingFile(null);
      onUploadComplete?.(urlData.publicUrl);
      toast.success("Payment proof uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(true);
      toast.error("Upload failed. Tap retry to try again.");
    } finally {
      setUploading(false);
    }
  }, [storefrontId, onUploadComplete]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      resetInputs();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 10MB");
      resetInputs();
      return;
    }

    // Enter editing mode
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImage(e.target?.result as string);
      setIsEditing(true);
      setRotation(0);
      setCrop(undefined);
    };
    reader.readAsDataURL(file);
    setOriginalFile(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirmEdit = async () => {
    if (!editingImage || !crop || !originalFile) return;

    setIsEditing(false);
    setCompressing(true);

    try {
      // Get cropped and rotated image
      const croppedBlob = await getCroppedImage(editingImage, crop, rotation);
      
      // Compress the result
      const { blob: compressedBlob, wasCompressed } = await compressImage(croppedBlob);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedBlob);

      setFileInfo({
        name: originalFile.name,
        size: compressedBlob.size,
        originalSize: originalFile.size,
      });

      if (wasCompressed) {
        toast.success(`Compressed: ${formatFileSize(originalFile.size)} → ${formatFileSize(compressedBlob.size)}`);
      }

      setCompressing(false);
      setEditingImage(null);

      const fileExt = originalFile.name.split(".").pop() || "jpg";
      const fileName = `${storefrontId}/payment-proof-${Date.now()}.${fileExt}`;
      setPendingFile(compressedBlob);

      await uploadFile(compressedBlob, fileName);
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process image");
      setCompressing(false);
      resetInputs();
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingImage(null);
    setRotation(0);
    setCrop(undefined);
    setOriginalFile(null);
    resetInputs();
  };

  const handleRetry = async () => {
    if (!pendingFile) return;
    const fileName = `${storefrontId}/payment-proof-${Date.now()}.jpg`;
    await uploadFile(pendingFile, fileName);
  };

  const handleRemove = () => {
    setPreview(null);
    setUploaded(false);
    setUploadError(false);
    setFileInfo(null);
    setPendingFile(null);
    setOriginalFile(null);
    resetInputs();
  };

  // Editing mode
  if (isEditing && editingImage) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Edit image</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="gap-1.5"
              aria-label="Rotate image 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
              Rotate
            </Button>
          </div>
        </div>

        <div className="relative bg-muted rounded-xl overflow-hidden">
          <div 
            className="flex items-center justify-center p-2"
            style={{ maxHeight: "300px" }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              className="max-h-[280px]"
            >
              <img
                ref={imgRef}
                src={editingImage}
                alt="Edit preview"
                onLoad={onImageLoad}
                className="max-h-[280px] w-auto"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </ReactCrop>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            className="flex-1"
            aria-label="Cancel editing"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            className="flex-1 gap-1.5"
            aria-label="Confirm and upload"
          >
            <Check className="w-4 h-4" />
            Done
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Drag to crop • Tap rotate to adjust orientation
        </p>
      </div>
    );
  }

  // Success state
  if (uploaded && preview) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-2xl p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
            <img src={preview} alt="Payment proof uploaded" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Proof uploaded</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The seller will verify your payment
            </p>
            {fileInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(fileInfo.size)}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Remove uploaded proof"
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
            <img src={preview} alt="Payment proof preview" className="w-full h-full object-cover" />
          </div>
          
          {fileInfo && !uploading && !compressing && (
            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1">
              <p className="text-xs text-foreground truncate max-w-[150px]">{fileInfo.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(fileInfo.size)}</p>
            </div>
          )}

          {compressing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 w-3/4 max-w-[200px]">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <div className="w-full space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <span className="text-xs text-muted-foreground block text-center">
                    Uploading... {uploadProgress}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {uploadError && !uploading && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-4">
                <p className="text-sm text-destructive font-medium">Upload failed</p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label="Retry upload"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!uploading && !compressing && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 gap-3"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("ring-2", "ring-primary");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-2", "ring-primary");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("ring-2", "ring-primary");
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              if (fileInputRef.current) {
                fileInputRef.current.files = dataTransfer.files;
                fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }}
        >
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || compressing}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-action/30 bg-action/5 transition-all",
              "hover:border-action/50 hover:bg-action/10 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Take photo with camera"
          >
            <div className="w-12 h-12 rounded-full bg-action/10 flex items-center justify-center">
              <Camera className="w-6 h-6 text-action" />
            </div>
            <span className="text-sm font-medium text-foreground">Take photo</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || compressing}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border transition-all",
              "hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Choose file from device"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Choose file</span>
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Screenshot of Yappy, bank transfer, or receipt photo • Max 10MB
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
