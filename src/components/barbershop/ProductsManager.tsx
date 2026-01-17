import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Package, DollarSign, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";

interface BarbershopProduct {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  external_link: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ProductsManagerProps {
  language: string;
}

export function ProductsManager({ language }: ProductsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarbershopProduct | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    external_link: "",
    is_active: true,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["barbershop-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_products")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      
      if (error) throw error;
      return data as BarbershopProduct[];
    },
    enabled: !!user,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/products/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("storefront-images")
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from("storefront-images")
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { imageUrl?: string }) => {
      setUploading(true);
      let imageUrl = data.imageUrl;
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase.from("barbershop_products").insert({
        user_id: user!.id,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        image_url: imageUrl || null,
        external_link: data.external_link || null,
        is_active: data.is_active,
        sort_order: products.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-products"] });
      toast.success(language === "es" ? "Producto creado" : "Product created");
      resetForm();
    },
    onError: () => {
      toast.error(language === "es" ? "Error al crear producto" : "Error creating product");
    },
    onSettled: () => setUploading(false),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      setUploading(true);
      let imageUrl = editingProduct?.image_url;
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase
        .from("barbershop_products")
        .update({
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price) || 0,
          image_url: imageUrl,
          external_link: data.external_link || null,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-products"] });
      toast.success(language === "es" ? "Producto actualizado" : "Product updated");
      resetForm();
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbershop_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-products"] });
      toast.success(language === "es" ? "Producto eliminado" : "Product deleted");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", external_link: "", is_active: true });
    setEditingProduct(null);
    setSelectedFile(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (product: BarbershopProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      external_link: product.external_link || "",
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-barbershop-header">
          {language === "es" ? "Productos" : "Products"}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-barbershop-cta hover:bg-barbershop-cta/90">
              <Plus className="w-4 h-4" />
              {language === "es" ? "Nuevo" : "New"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct 
                  ? (language === "es" ? "Editar Producto" : "Edit Product")
                  : (language === "es" ? "Nuevo Producto" : "New Product")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{language === "es" ? "Imagen" : "Image"}</Label>
                <div 
                  className="mt-1.5 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-barbershop-cta transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile || editingProduct?.image_url ? (
                    <div className="flex items-center justify-center gap-2">
                      <Package className="w-5 h-5 text-barbershop-cta" />
                      <p className="text-sm text-barbershop-muted">
                        {selectedFile?.name || (language === "es" ? "Imagen actual" : "Current image")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5 text-barbershop-muted" />
                      <p className="text-sm text-barbershop-muted">
                        {language === "es" ? "Subir imagen" : "Upload image"}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label>{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder={language === "es" ? "Pomada para cabello" : "Hair pomade"}
                  required
                />
              </div>
              <div>
                <Label>{language === "es" ? "Descripción" : "Description"}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder={language === "es" ? "Fijación fuerte, acabado mate" : "Strong hold, matte finish"}
                />
              </div>
              <div>
                <Label>{language === "es" ? "Precio ($)" : "Price ($)"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                  placeholder="12.00"
                  required
                />
              </div>
              <div>
                <Label>{language === "es" ? "Link externo (opcional)" : "External link (optional)"}</Label>
                <Input
                  value={formData.external_link}
                  onChange={(e) => setFormData(p => ({ ...p, external_link: e.target.value }))}
                  placeholder="https://amazon.com/..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                />
                <Label>{language === "es" ? "Activo" : "Active"}</Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-barbershop-cta hover:bg-barbershop-cta/90"
                disabled={uploading}
              >
                {uploading 
                  ? (language === "es" ? "Guardando..." : "Saving...")
                  : editingProduct 
                    ? (language === "es" ? "Guardar" : "Save")
                    : (language === "es" ? "Crear" : "Create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-barbershop-muted" />
            <p className="text-sm text-barbershop-muted">
              {language === "es" 
                ? "Agrega productos que recomiendas a tus clientes"
                : "Add products you recommend to your clients"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <Card key={product.id} className={`${!product.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-barbershop-section-alt flex items-center justify-center">
                      <Package className="w-5 h-5 text-barbershop-muted" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-barbershop-header">{product.name}</h4>
                      {product.external_link && (
                        <ExternalLink className="w-3 h-3 text-barbershop-muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-barbershop-muted">
                      <DollarSign className="w-3 h-3" />
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
