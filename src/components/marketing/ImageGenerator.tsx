import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, Download, Sparkles, AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_PROMPT_LENGTH = 500;

export function ImageGenerator() {
  const { language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error(language === "en" ? "Please enter a description" : "Por favor ingresa una descripción");
      return;
    }

    if (isGenerating) return; // Prevent double-click

    setIsGenerating(true);
    setGeneratedImage(null);
    setImageError(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: { prompt: trimmedPrompt.slice(0, MAX_PROMPT_LENGTH) },
      });

      if (error) {
        // Check for specific error types from the edge function response
        if (error.message?.includes("429") || error.message?.includes("rate limit")) {
          toast.error(language === "en" 
            ? "Too many requests. Please wait a moment." 
            : "Demasiadas solicitudes. Espera un momento.");
          return;
        }
        if (error.message?.includes("402") || error.message?.includes("credits")) {
          toast.error(language === "en" 
            ? "AI credits exhausted. Please try again later." 
            : "Créditos de IA agotados. Intenta más tarde.");
          return;
        }
        throw error;
      }

      if (data?.error) {
        // Handle errors returned in the response body
        if (data.error.includes("rate limit") || data.error.includes("429")) {
          toast.error(language === "en" 
            ? "Too many requests. Please wait a moment." 
            : "Demasiadas solicitudes. Espera un momento.");
          return;
        }
        if (data.error.includes("credits") || data.error.includes("402")) {
          toast.error(language === "en" 
            ? "AI credits exhausted. Please try again later." 
            : "Créditos de IA agotados. Intenta más tarde.");
          return;
        }
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setImageLoading(true);
        setGeneratedImage(data.imageUrl);
        toast.success(language === "en" ? "Image generated!" : "¡Imagen generada!");
      } else {
        throw new Error("No image returned");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error(language === "en" ? "Failed to generate image" : "Error al generar imagen");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, language]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;
    
    try {
      // For base64 images, we need to convert to blob for reliable download
      if (generatedImage.startsWith("data:")) {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `marketing-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(url);
      } else {
        // For regular URLs, fetch and download as blob
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `marketing-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
      
      toast.success(language === "en" ? "Image downloaded!" : "¡Imagen descargada!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(language === "en" ? "Failed to download" : "Error al descargar");
    }
  }, [generatedImage, language]);

  const handlePromptChange = (value: string) => {
    if (value.length <= MAX_PROMPT_LENGTH) {
      setPrompt(value);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const quickPrompts = [
    language === "en" ? "Product showcase with elegant background" : "Exhibición de producto con fondo elegante",
    language === "en" ? "Sale banner with vibrant colors" : "Banner de oferta con colores vibrantes",
    language === "en" ? "Social media post for new arrival" : "Post de redes sociales para nuevo producto",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImagePlus className="w-5 h-5 text-primary" />
          {language === "en" ? "Create Image" : "Crear Imagen"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{language === "en" ? "Describe your image" : "Describe tu imagen"}</Label>
            <span className="text-xs text-muted-foreground">
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </span>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={language === "en" 
              ? "E.g., A professional product photo of handmade soap with flowers..." 
              : "Ej., Una foto profesional de jabón artesanal con flores..."}
            className="min-h-[80px] resize-none"
            maxLength={MAX_PROMPT_LENGTH}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {language === "en" ? "Quick ideas" : "Ideas rápidas"}
          </Label>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(qp)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {language === "en" ? "Generating..." : "Generando..."}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {language === "en" ? "Generate Image" : "Generar Imagen"}
            </>
          )}
        </Button>

        {(generatedImage || isGenerating) && (
          <div className="space-y-3 pt-4 border-t">
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Creating your image..." : "Creando tu imagen..."}
                    </p>
                  </div>
                </div>
              ) : imageError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Failed to load image" : "Error al cargar imagen"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {imageLoading && (
                    <Skeleton className="absolute inset-0" />
                  )}
                  <img
                    src={generatedImage!}
                    alt="Generated marketing image"
                    className={`w-full h-auto transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </>
              )}
            </div>
            {generatedImage && !imageError && !isGenerating && (
              <Button variant="outline" onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {language === "en" ? "Download" : "Descargar"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
