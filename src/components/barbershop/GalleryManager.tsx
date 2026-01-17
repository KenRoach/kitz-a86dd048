import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Image, Star, StarOff, Upload } from "lucide-react";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  user_id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  is_featured: boolean;
  sort_order: number;
}

interface GalleryManagerProps {
  language: string;
}

export function GalleryManager({ language }: GalleryManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["barbershop-gallery", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_gallery")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!user,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    
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
    mutationFn: async ({ file, title, description }: { file: File; title: string; description: string }) => {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      
      const { error } = await supabase.from("barbershop_gallery").insert({
        user_id: user!.id,
        image_url: imageUrl,
        title: title || null,
        description: description || null,
        sort_order: images.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-gallery"] });
      toast.success(language === "es" ? "Imagen agregada" : "Image added");
      resetForm();
    },
    onError: () => {
      toast.error(language === "es" ? "Error al subir imagen" : "Error uploading image");
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbershop_gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-gallery"] });
      toast.success(language === "es" ? "Imagen eliminada" : "Image deleted");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("barbershop_gallery")
        .update({ is_featured: !isFeatured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-gallery"] });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "" });
    setSelectedFile(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(language === "es" ? "Selecciona una imagen" : "Select an image");
      return;
    }
    createMutation.mutate({ file: selectedFile, ...formData });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-barbershop-header">
          {language === "es" ? "Galería" : "Gallery"}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-barbershop-cta hover:bg-barbershop-cta/90">
              <Plus className="w-4 h-4" />
              {language === "es" ? "Agregar" : "Add"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Agregar Imagen" : "Add Image"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{language === "es" ? "Imagen" : "Image"}</Label>
                <div 
                  className="mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-barbershop-cta transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <Image className="w-8 h-8 mx-auto text-barbershop-cta" />
                      <p className="text-sm text-barbershop-muted">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-barbershop-muted" />
                      <p className="text-sm text-barbershop-muted">
                        {language === "es" ? "Haz clic para seleccionar" : "Click to select"}
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
                <Label>{language === "es" ? "Título (opcional)" : "Title (optional)"}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder={language === "es" ? "Corte degradado" : "Fade haircut"}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-barbershop-cta hover:bg-barbershop-cta/90"
                disabled={uploading}
              >
                {uploading 
                  ? (language === "es" ? "Subiendo..." : "Uploading...")
                  : (language === "es" ? "Agregar" : "Add")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Image className="w-10 h-10 mx-auto mb-3 text-barbershop-muted" />
            <p className="text-sm text-barbershop-muted">
              {language === "es" 
                ? "Agrega fotos de tus mejores cortes"
                : "Add photos of your best cuts"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group aspect-square">
              <img
                src={image.image_url}
                alt={image.title || "Gallery image"}
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => toggleFeaturedMutation.mutate({ id: image.id, isFeatured: image.is_featured })}
                >
                  {image.is_featured ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => deleteMutation.mutate(image.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {image.is_featured && (
                <Star className="absolute top-2 right-2 w-4 h-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
