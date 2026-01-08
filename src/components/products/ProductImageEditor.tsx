import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, RotateCw, Check, ImagePlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ProductImageEditorProps {
  imagePreview: string | null;
  onImageChange: (file: File | null, preview: string | null) => void;
  onEnhanceWithAI?: () => Promise<void>;
  enhancing?: boolean;
  language?: "en" | "es";
}

const COMPRESSION_MAX_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.85;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number = 16 / 9) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
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

  // Calculate crop dimensions in pixels
  const cropX = (crop.x / 100) * image.naturalWidth;
  const cropY = (crop.y / 100) * image.naturalHeight;
  const cropWidth = (crop.width / 100) * image.naturalWidth;
  const cropHeight = (crop.height / 100) * image.naturalHeight;

  // Handle rotation
  const radians = (rotation * Math.PI) / 180;
  const isRotated90or270 = rotation === 90 || rotation === 270;
  
  if (isRotated90or270) {
    canvas.width = cropHeight;
    canvas.height = cropWidth;
  } else {
    canvas.width = cropWidth;
    canvas.height = cropHeight;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  
  if (isRotated90or270) {
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      -cropWidth / 2,
      -cropHeight / 2,
      cropWidth,
      cropHeight
    );
  } else {
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      -cropWidth / 2,
      -cropHeight / 2,
      cropWidth,
      cropHeight
    );
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/jpeg",
      COMPRESSION_QUALITY
    );
  });
}

async function compressImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      if (width > COMPRESSION_MAX_DIMENSION || height > COMPRESSION_MAX_DIMENSION) {
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
            resolve(compressedBlob);
          } else {
            resolve(blob);
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

export function ProductImageEditor({
  imagePreview,
  onImageChange,
  onEnhanceWithAI,
  enhancing = false,
  language = "en"
}: ProductImageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(language === "es" ? "La imagen debe ser menor a 10MB" : "Image must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(language === "es" ? "Por favor selecciona una imagen" : "Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImage(e.target?.result as string);
      setIsEditing(true);
      setRotation(0);
      setCrop(undefined);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirmEdit = async () => {
    if (!editingImage || !crop) return;

    setProcessing(true);

    try {
      const croppedBlob = await getCroppedImage(editingImage, crop, rotation);
      const compressedBlob = await compressImage(croppedBlob);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const file = new File([compressedBlob], `product-${Date.now()}.jpg`, { type: "image/jpeg" });
        onImageChange(file, preview);
      };
      reader.readAsDataURL(compressedBlob);

      setIsEditing(false);
      setEditingImage(null);
      setRotation(0);
      setCrop(undefined);
      toast.success(language === "es" ? "¡Imagen lista!" : "Image ready!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(language === "es" ? "Error al procesar imagen" : "Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingImage(null);
    setRotation(0);
    setCrop(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    onImageChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Editing mode with crop and rotate
  if (isEditing && editingImage) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {language === "es" ? "Editar imagen" : "Edit image"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={processing}
            className="gap-1.5"
            aria-label="Rotate image 90 degrees"
          >
            <RotateCw className="w-4 h-4" />
            {language === "es" ? "Rotar" : "Rotate"}
          </Button>
        </div>

        <div className="relative bg-muted rounded-xl overflow-hidden">
          <div 
            className="flex items-center justify-center p-2"
            style={{ maxHeight: "300px" }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={16 / 9}
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
          
          {processing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Procesando..." : "Processing..."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            disabled={processing}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1.5" />
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={handleConfirmEdit}
            disabled={processing}
            className="flex-1 gap-1.5"
          >
            <Check className="w-4 h-4" />
            {language === "es" ? "Listo" : "Done"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {language === "es" 
            ? "Arrastra para recortar • Toca rotar para ajustar" 
            : "Drag to crop • Tap rotate to adjust orientation"}
        </p>
      </div>
    );
  }

  // Normal display mode with preview or upload prompt
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {language === "es" ? "Imagen" : "Image"}
        </span>
        {imagePreview && onEnhanceWithAI && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEnhanceWithAI}
            disabled={enhancing}
            className="gap-1.5 text-xs h-7"
          >
            {enhancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            {language === "es" ? "Mejorar con IA" : "Enhance with AI"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={() => !enhancing && fileInputRef.current?.click()}
        className={cn(
          "w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden bg-muted/50 transition-all relative",
          imagePreview ? "border-transparent" : "border-border hover:border-primary/50"
        )}
      >
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            {enhancing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === "es" ? "Mejorando imagen..." : "Enhancing image..."}
                  </p>
                </div>
              </div>
            )}
            {!enhancing && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    {language === "es" ? "Cambiar" : "Change"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-6">
            <ImagePlus className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "Clic para subir imagen" : "Click to upload image"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {language === "es" ? "Podrás recortar y rotar" : "You can crop and rotate"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
