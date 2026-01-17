import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Clock, DollarSign, Scissors, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface BarbershopService {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ServicesManagerProps {
  language: string;
}

export function ServicesManager({ language }: ServicesManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<BarbershopService | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "30",
    is_active: true,
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["barbershop-services", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_services")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      
      if (error) throw error;
      return data as BarbershopService[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("barbershop_services").insert({
        user_id: user!.id,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        duration_minutes: parseInt(data.duration_minutes) || 30,
        is_active: data.is_active,
        sort_order: services.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-services"] });
      toast.success(language === "es" ? "Servicio creado" : "Service created");
      resetForm();
    },
    onError: () => {
      toast.error(language === "es" ? "Error al crear servicio" : "Error creating service");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("barbershop_services")
        .update({
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price) || 0,
          duration_minutes: parseInt(data.duration_minutes) || 30,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-services"] });
      toast.success(language === "es" ? "Servicio actualizado" : "Service updated");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbershop_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-services"] });
      toast.success(language === "es" ? "Servicio eliminado" : "Service deleted");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", duration_minutes: "30", is_active: true });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (service: BarbershopService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
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
          {language === "es" ? "Servicios" : "Services"}
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
                {editingService 
                  ? (language === "es" ? "Editar Servicio" : "Edit Service")
                  : (language === "es" ? "Nuevo Servicio" : "New Service")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder={language === "es" ? "Corte de cabello" : "Haircut"}
                  required
                />
              </div>
              <div>
                <Label>{language === "es" ? "Descripción" : "Description"}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder={language === "es" ? "Incluye lavado y secado" : "Includes wash and dry"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === "es" ? "Precio ($)" : "Price ($)"}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                    placeholder="15.00"
                    required
                  />
                </div>
                <div>
                  <Label>{language === "es" ? "Duración (min)" : "Duration (min)"}</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(p => ({ ...p, duration_minutes: e.target.value }))}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                />
                <Label>{language === "es" ? "Activo" : "Active"}</Label>
              </div>
              <Button type="submit" className="w-full bg-barbershop-cta hover:bg-barbershop-cta/90">
                {editingService 
                  ? (language === "es" ? "Guardar" : "Save")
                  : (language === "es" ? "Crear" : "Create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Scissors className="w-10 h-10 mx-auto mb-3 text-barbershop-muted" />
            <p className="text-sm text-barbershop-muted">
              {language === "es" 
                ? "Agrega tus servicios para que los clientes puedan reservar"
                : "Add your services so clients can book"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <Card key={service.id} className={`${!service.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-barbershop-muted cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-barbershop-header">{service.name}</h4>
                      {!service.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {language === "es" ? "Inactivo" : "Inactive"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-barbershop-muted">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${service.price.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(service.id)}
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
