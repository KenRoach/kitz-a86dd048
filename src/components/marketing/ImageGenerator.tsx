import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ImagePlus, Loader2, Download, Sparkles, AlertCircle, User, Phone, Instagram, Mail,
  Edit3, RotateCcw, Sun, Moon, Contrast, Palette, Thermometer, History, ChevronDown
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_PROMPT_LENGTH = 500;

interface ContactInfo {
  businessName: string;
  phone: string;
  instagram: string;
  cta: string;
  email: string;
}

interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
  isEdit?: boolean;
}

type QuickAdjustment = "brighter" | "darker" | "more_contrast" | "more_saturated" | "warmer" | "cooler";

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
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // History state
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const addToHistory = useCallback((imageUrl: string, promptText: string, isEdit = false) => {
    const newItem: ImageHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      prompt: promptText,
      timestamp: new Date(),
      isEdit,
    };
    setImageHistory(prev => {
      const updated = [...prev, newItem];
      return updated.slice(-10); // Keep last 10
    });
    setCurrentHistoryIndex(imageHistory.length);
  }, [imageHistory.length]);

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
    setIsEditMode(false);

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
        addToHistory(data.imageUrl, trimmedPrompt, false);
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
  }, [prompt, isGenerating, language, includeContact, contactInfo, addToHistory]);

  const handleEdit = useCallback(async (instruction?: string, quickAdjustment?: QuickAdjustment) => {
    if (!generatedImage) return;
    
    const editText = instruction || editInstruction.trim();
    if (!editText && !quickAdjustment) {
      toast.error(language === "en" ? "Please enter edit instructions" : "Por favor ingresa instrucciones de edición");
      return;
    }

    setIsEditing(true);

    try {
      const { data, error } = await supabase.functions.invoke("edit-marketing-image", {
        body: {
          imageUrl: generatedImage,
          instruction: editText,
          quickAdjustment,
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error(language === "en" ? "Too many requests. Wait a moment." : "Demasiadas solicitudes. Espera un momento.");
          return;
        }
        if (error.message?.includes("402")) {
          toast.error(language === "en" ? "AI credits exhausted." : "Créditos de IA agotados.");
          return;
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setImageLoading(true);
        setGeneratedImage(data.imageUrl);
        addToHistory(data.imageUrl, quickAdjustment || editText, true);
        setEditInstruction("");
        toast.success(language === "en" ? "Image updated!" : "¡Imagen actualizada!");
      }
    } catch (error: any) {
      console.error("Error editing image:", error);
      toast.error(language === "en" ? "Failed to edit image" : "Error al editar imagen");
    } finally {
      setIsEditing(false);
    }
  }, [generatedImage, editInstruction, language, addToHistory]);

  const handleQuickAdjustment = useCallback((adjustment: QuickAdjustment) => {
    handleEdit(undefined, adjustment);
  }, [handleEdit]);

  const handleRegenerate = useCallback(() => {
    if (prompt.trim()) {
      handleGenerate();
    }
  }, [prompt, handleGenerate]);

  const restoreFromHistory = useCallback((item: ImageHistoryItem, index: number) => {
    setGeneratedImage(item.imageUrl);
    setCurrentHistoryIndex(index);
    setShowHistory(false);
    toast.success(language === "en" ? "Image restored" : "Imagen restaurada");
  }, [language]);

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

  const quickAdjustments: { key: QuickAdjustment; icon: React.ReactNode; label: string }[] = [
    { key: "brighter", icon: <Sun className="w-3.5 h-3.5" />, label: language === "en" ? "Brighter" : "Más claro" },
    { key: "darker", icon: <Moon className="w-3.5 h-3.5" />, label: language === "en" ? "Darker" : "Más oscuro" },
    { key: "more_contrast", icon: <Contrast className="w-3.5 h-3.5" />, label: language === "en" ? "Contrast" : "Contraste" },
    { key: "more_saturated", icon: <Palette className="w-3.5 h-3.5" />, label: language === "en" ? "Vivid" : "Vívido" },
    { key: "warmer", icon: <Thermometer className="w-3.5 h-3.5" />, label: language === "en" ? "Warm" : "Cálido" },
    { key: "cooler", icon: <Thermometer className="w-3.5 h-3.5 rotate-180" />, label: language === "en" ? "Cool" : "Frío" },
  ];

  const hasContactInfo = contactInfo.businessName || contactInfo.phone || contactInfo.instagram || contactInfo.cta || contactInfo.email;

  return (
    <>
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
                {isGenerating || isEditing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {isEditing 
                          ? (language === "en" ? "Editing your image..." : "Editando tu imagen...")
                          : (language === "en" ? "Creating your image..." : "Creando tu imagen...")}
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
              
              {generatedImage && !imageError && !isGenerating && !isEditing && (
                <>
                  {/* Quick Adjustments */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {language === "en" ? "Quick adjustments" : "Ajustes rápidos"}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {quickAdjustments.map((adj) => (
                        <button
                          key={adj.key}
                          onClick={() => handleQuickAdjustment(adj.key)}
                          disabled={isEditing}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          {adj.icon}
                          {adj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Edit Mode */}
                  <Collapsible open={isEditMode} onOpenChange={setIsEditMode}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Edit3 className="w-4 h-4" />
                        {language === "en" ? "Edit with AI" : "Editar con IA"}
                        <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", isEditMode && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <Textarea
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder={language === "en" 
                          ? "E.g., Add more flowers, change background to blue, make text bigger..." 
                          : "Ej., Agrega más flores, cambia el fondo a azul, haz el texto más grande..."}
                        className="min-h-[60px] resize-none text-sm"
                        maxLength={MAX_PROMPT_LENGTH}
                      />
                      <Button 
                        onClick={() => handleEdit()} 
                        disabled={isEditing || !editInstruction.trim()}
                        size="sm"
                        className="w-full"
                      >
                        {isEditing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {language === "en" ? "Editing..." : "Editando..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {language === "en" ? "Apply Edit" : "Aplicar Edición"}
                          </>
                        )}
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {language === "en" ? "Redo" : "Rehacer"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowHistory(true)}
                      disabled={imageHistory.length === 0}
                      className="gap-1.5"
                    >
                      <History className="w-4 h-4" />
                      {language === "en" ? "History" : "Historial"}
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleDownload}
                      className="gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      {language === "en" ? "Save" : "Guardar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {language === "en" ? "Image History" : "Historial de Imágenes"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-3 pr-2">
            {imageHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {language === "en" ? "No images in history yet" : "Aún no hay imágenes en el historial"}
              </p>
            ) : (
              imageHistory.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => restoreFromHistory(item, index)}
                  className={cn(
                    "w-full flex gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left",
                    currentHistoryIndex === index && "border-primary bg-primary/5"
                  )}
                >
                  <img 
                    src={item.imageUrl} 
                    alt="" 
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {item.isEdit 
                        ? (language === "en" ? "Edited" : "Editado")
                        : (language === "en" ? "Generated" : "Generado")}
                    </p>
                    <p className="text-sm truncate">{item.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </button>
              )).reverse()
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
