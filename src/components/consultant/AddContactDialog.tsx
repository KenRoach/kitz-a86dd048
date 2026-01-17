import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: "en" | "es";
}

const SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "link", label: "Link" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", labelEs: "Referido", labelEn: "Referral" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

export function AddContactDialog({ open, onOpenChange, language = "es" }: AddContactDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("whatsapp");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("consultant_contacts")
        .insert({
          user_id: user.id,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          source,
          funnel_stage: "atraccion",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-contacts"] });
      toast.success(language === "es" ? "Contacto agregado" : "Contact added");
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(language === "es" ? "Error al agregar" : "Failed to add");
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSource("whatsapp");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(language === "es" ? "Nombre requerido" : "Name required");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {language === "es" ? "Nuevo Contacto" : "New Contact"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{language === "es" ? "Nombre" : "Name"} *</Label>
            <Input
              placeholder={language === "es" ? "Nombre del contacto" : "Contact name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Label>
              <Input
                type="tel"
                placeholder="+507..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === "es" ? "Origen" : "Source"}</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label || (language === "es" ? opt.labelEs : opt.labelEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={addMutation.isPending}
            >
              {language === "es" ? "Agregar" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
