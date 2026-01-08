import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, Download, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ImageGenerator() {
  const { language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(language === "en" ? "Please enter a description" : "Por favor ingresa una descripción");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success(language === "en" ? "Image generated!" : "¡Imagen generada!");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error(language === "en" ? "Failed to generate image" : "Error al generar imagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `marketing-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <Label>{language === "en" ? "Describe your image" : "Describe tu imagen"}</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={language === "en" 
              ? "E.g., A professional product photo of handmade soap with flowers..." 
              : "Ej., Una foto profesional de jabón artesanal con flores..."}
            className="min-h-[80px] resize-none"
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
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
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

        {generatedImage && (
          <div className="space-y-3 pt-4 border-t">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={generatedImage}
                alt="Generated marketing image"
                className="w-full h-auto"
              />
            </div>
            <Button variant="outline" onClick={handleDownload} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {language === "en" ? "Download" : "Descargar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
