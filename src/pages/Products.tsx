import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Pencil, 
  Loader2,
  Package,
  Wand2,
  Briefcase,
  Calendar,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsSkeleton } from "@/components/ui/dashboard-skeleton";
import { AnimatedCreateButton } from "@/components/ui/AnimatedCreateButton";
import { ProductImageEditor } from "@/components/products/ProductImageEditor";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
}

const PRODUCT_TYPES = [
  { value: "product", label: "Product", labelEs: "Producto" },
  { value: "service", label: "Service", labelEs: "Servicio" },
  { value: "session", label: "Session/Workshop", labelEs: "Sesión/Taller" }
];

const CATEGORIES = [
  { value: "food", label: "Food & Beverages", labelEs: "Alimentos y Bebidas" },
  { value: "clothing", label: "Clothing & Apparel", labelEs: "Ropa y Accesorios" },
  { value: "electronics", label: "Electronics", labelEs: "Electrónica" },
  { value: "home", label: "Home & Garden", labelEs: "Hogar y Jardín" },
  { value: "health", label: "Health & Beauty", labelEs: "Salud y Belleza" },
  { value: "services", label: "Services", labelEs: "Servicios" },
  { value: "digital", label: "Digital Products", labelEs: "Productos Digitales" },
  { value: "handmade", label: "Handmade & Crafts", labelEs: "Artesanías" },
  { value: "consulting", label: "Consulting", labelEs: "Consultoría" },
  { value: "training", label: "Training & Workshops", labelEs: "Capacitación y Talleres" },
  { value: "other", label: "Other", labelEs: "Otro" }
];

export default function Products() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [enhancingImage, setEnhancingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    type: "product",
    keywords: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load products");
      return;
    }
    
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/product-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("storefront-images").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("storefront-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const generateDescription = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a product title first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          title: formData.title,
          category: formData.category,
          keywords: formData.keywords
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setFormData(prev => ({ ...prev, description: data.description }));
      toast.success("Description generated!");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const enhanceImage = async () => {
    if (!imagePreview) {
      toast.error(language === "es" ? "Primero sube una imagen" : "Please upload an image first");
      return;
    }

    setEnhancingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: {
          imageUrl: imagePreview,
          enhancementType: "general"
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.enhancedImageUrl) {
        setImagePreview(data.enhancedImageUrl);
        // Convert base64 to file for upload
        const response = await fetch(data.enhancedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], "enhanced-image.png", { type: "image/png" });
        setImageFile(file);
        toast.success(language === "es" ? "¡Imagen mejorada!" : "Image enhanced!");
      }
    } catch (error) {
      console.error("Error enhancing image:", error);
      toast.error(language === "es" ? "Error al mejorar imagen" : "Failed to enhance image");
    } finally {
      setEnhancingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingProduct?.image_url || null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price) || 0,
        category: formData.category || null,
        type: formData.type || "product",
        image_url: imageUrl,
        user_id: user.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);
        
        if (error) throw error;
        toast.success("Product created");
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"?`)) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    toast.success("Product deleted");
    fetchProducts();
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      type: product.type || "product",
      keywords: ""
    });
    setImagePreview(product.image_url);
    setImageFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", price: "", category: "", type: "product", keywords: "" });
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "service": return Briefcase;
      case "session": return Calendar;
      default: return Package;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = PRODUCT_TYPES.find(t => t.value === type);
    return language === "es" ? typeConfig?.labelEs : typeConfig?.label;
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <ProductsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 animate-fade-in">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-semibold text-foreground">
              {language === "es" ? "Productos y/o Servicios" : "Products & Services"}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5 truncate">
              {language === "es" 
                ? "Tu catálogo reutilizable con IA." 
                : "Your reusable catalog with AI."}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <AnimatedCreateButton 
                onClick={openNewDialog} 
                label={language === "es" ? "Nuevo" : "New"} 
              />
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {editingProduct 
                    ? (language === "es" ? "Editar Producto" : "Edit Product")
                    : (language === "es" ? "Nuevo Producto" : "New Product")}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                {/* Image Upload with Crop/Rotate/AI Enhance */}
                <ProductImageEditor
                  imagePreview={imagePreview}
                  onImageChange={(file, preview) => {
                    setImageFile(file);
                    setImagePreview(preview);
                  }}
                  onEnhanceWithAI={enhanceImage}
                  enhancing={enhancingImage}
                  language={language}
                />

                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-muted-foreground">
                    {language === "es" ? "Título" : "Title"} *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={language === "es" ? "Nombre del producto o servicio" : "Product or service name"}
                    className="mt-1.5"
                  />
                </div>

                {/* Type */}
                <div>
                  <Label className="text-muted-foreground">
                    {language === "es" ? "Tipo" : "Type"}
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === "es" ? type.labelEs : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-muted-foreground">
                    {language === "es" ? "Categoría" : "Category"}
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === "es" ? cat.labelEs : cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price" className="text-muted-foreground">
                    {language === "es" ? "Precio" : "Price"} ($)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="mt-1.5"
                  />
                </div>

                {/* Keywords for AI */}
                <div>
                  <Label htmlFor="keywords" className="text-muted-foreground">
                    {language === "es" ? "Palabras clave (para IA)" : "Keywords (for AI)"}
                  </Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder={language === "es" ? "ej: orgánico, artesanal, local" : "e.g. organic, handmade, local"}
                    className="mt-1.5"
                  />
                </div>

                {/* Description with AI button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="description" className="text-muted-foreground">
                      {language === "es" ? "Descripción" : "Description"}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateDescription}
                      disabled={generatingDescription || !formData.title.trim()}
                      className="gap-1.5 text-xs h-7"
                    >
                      {generatingDescription ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      {language === "es" ? "Generar con IA" : "Generate with AI"}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={language === "es" 
                      ? "Describe tu producto o usa IA para generarlo..." 
                      : "Describe your product or use AI to generate it..."}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !formData.title.trim()}
                    className="flex-1 gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {language === "es" ? "Guardar" : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={language === "es" ? "Sin productos aún" : "No products yet"}
            description={language === "es" 
              ? "Crea tu catálogo de productos para reutilizarlos fácilmente en tus vitrinas."
              : "Build your product catalog once, reuse across all your storefronts."}
            actionLabel={language === "es" ? "Crear producto" : "Create product"}
            onAction={openNewDialog}
            tips={language === "es" 
              ? ["La IA genera descripciones automáticamente", "Añade imágenes para mejores ventas", "Organiza por categorías"]
              : ["AI generates descriptions for you", "Add images for better sales", "Organize by categories"]}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="neu-card-flat overflow-hidden group animate-fade-in"
              >
                {/* Image */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Type & Category badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {product.type && product.type !== "product" && (
                      <span className="px-2 py-0.5 bg-primary/90 backdrop-blur text-primary-foreground text-xs rounded-full flex items-center gap-1">
                        {product.type === "service" ? <Briefcase className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {getTypeLabel(product.type)}
                      </span>
                    )}
                    {product.category && (
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur text-white text-xs rounded-full">
                        {language === "es" 
                          ? CATEGORIES.find(c => c.value === product.category)?.labelEs || product.category
                          : CATEGORIES.find(c => c.value === product.category)?.label || product.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                      <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {/* Create Storefront from Product */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-2"
                    onClick={() => navigate('/storefronts', { 
                      state: { 
                        createFromProduct: {
                          id: product.id,
                          title: product.title,
                          description: product.description,
                          price: product.price,
                          image_url: product.image_url
                        }
                      }
                    })}
                  >
                    <Send className="w-4 h-4" />
                    {language === "es" ? "Crear vitrina" : "Create Storefront"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
