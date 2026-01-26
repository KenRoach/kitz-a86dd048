import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Loader2, Download, Sparkles, AlertCircle, User, Phone, Instagram, Mail } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_PROMPT_LENGTH = 500;

interface ContactInfo {
  businessName: string;
  phone: string;
  instagram: string;
  cta: string;
  email: string;
}

export function ImageGenerator() {
  const { language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [includeContact, setIncludeContact] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    businessName: "",
    phone: "",
    instagram: "",
    cta: "",
    email: "",
  });

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error(language === "en" ? "Please enter a description" : "Por favor ingresa una descripción");
      return;
    }

    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setImageError(false);

    try {
      const requestBody: { prompt: string; contactInfo?: ContactInfo } = {
        prompt: trimmedPrompt.slice(0, MAX_PROMPT_LENGTH),
      };

      if (includeContact) {
        requestBody.contactInfo = contactInfo;
      }

      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: requestBody,
      });

      if (error) {
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
  }, [prompt, isGenerating, language, includeContact, contactInfo]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;
    
    try {
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
        
        URL.revokeObjectURL(url);
      } else {
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

  const hasContactInfo = contactInfo.businessName || contactInfo.phone || contactInfo.instagram || contactInfo.cta || contactInfo.email;

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

        {/* Contact Info Toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {language === "en" ? "Add contact info" : "Agregar info de contacto"}
            </span>
          </div>
          <Switch 
            checked={includeContact} 
            onCheckedChange={(checked) => {
              setIncludeContact(checked);
              if (checked) setContactOpen(true);
            }} 
          />
        </div>

        {/* Contact Info Fields */}
        <Collapsible open={includeContact && contactOpen} onOpenChange={setContactOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
                !includeContact && "hidden"
              )}
            >
              <span>
                {language === "en" ? "Contact details" : "Datos de contacto"}
                {hasContactInfo && (
                  <span className="ml-2 text-xs text-primary">
                    ({language === "en" ? "configured" : "configurado"})
                  </span>
                )}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", contactOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {language === "en" ? "Business/Name" : "Negocio/Nombre"}
                </Label>
                <Input
                  value={contactInfo.businessName}
                  onChange={(e) => updateContactInfo("businessName", e.target.value)}
                  placeholder={language === "en" ? "Your business name" : "Nombre de tu negocio"}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  {language === "en" ? "Phone" : "Teléfono"}
                </Label>
                <Input
                  value={contactInfo.phone}
                  onChange={(e) => updateContactInfo("phone", e.target.value)}
                  placeholder="261-7275"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Instagram className="w-3 h-3" />
                  Instagram
                </Label>
                <Input
                  value={contactInfo.instagram}
                  onChange={(e) => updateContactInfo("instagram", e.target.value)}
                  placeholder="@tu_negocio"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  {language === "en" ? "Email (optional)" : "Email (opcional)"}
                </Label>
                <Input
                  value={contactInfo.email}
                  onChange={(e) => updateContactInfo("email", e.target.value)}
                  placeholder="tu@email.com"
                  type="email"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {language === "en" ? "Call to Action" : "Llamada a la acción"}
                </Label>
                <Input
                  value={contactInfo.cta}
                  onChange={(e) => updateContactInfo("cta", e.target.value)}
                  placeholder={language === "en" ? "Book your appointment today" : "Agenda tu cita hoy"}
                  className="h-9"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {language === "en" 
                ? "This info will appear as text overlay on your image"
                : "Esta info aparecerá como texto en tu imagen"}
            </p>
          </CollapsibleContent>
        </Collapsible>

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
