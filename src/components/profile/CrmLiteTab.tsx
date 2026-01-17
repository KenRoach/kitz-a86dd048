import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useConsultantRole } from "@/hooks/useConsultantRole";
import { 
  Users, Plus, Search, Phone, Mail, Trash2, 
  UserPlus, DollarSign, ShoppingBag, Clock,
  ChevronRight, X, Send, MessageSquare, Kanban
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lifecycle: string;
  tags: string[] | null;
  order_count: number | null;
  total_spent: number | null;
  last_interaction: string | null;
  created_at: string;
}

const LIFECYCLE_OPTIONS = [
  { value: "lead", label: "Lead", labelEs: "Prospecto", color: "bg-muted text-muted-foreground" },
  { value: "active", label: "Active", labelEs: "Activo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "repeat", label: "Repeat", labelEs: "Recurrente", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

export function CrmLiteTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isConsultant } = useConsultantRole();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterLifecycle, setFilterLifecycle] = useState<string>("all");
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lifecycle, setLifecycle] = useState("lead");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("last_interaction", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (customer: { name: string; phone: string | null; email: string | null; lifecycle: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          lifecycle: customer.lifecycle,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(language === "es" ? "Cliente agregado" : "Customer added");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(language === "es" ? "Error al agregar" : "Failed to add");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(language === "es" ? "Cliente actualizado" : "Customer updated");
      setSelectedCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(language === "es" ? "Cliente eliminado" : "Customer deleted");
      setSelectedCustomer(null);
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setLifecycle("lead");
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error(language === "es" ? "Nombre requerido" : "Name required");
      return;
    }
    addMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      lifecycle,
    });
  };

  const getLifecycleConfig = (value: string) => {
    return LIFECYCLE_OPTIONS.find(l => l.value === value) || LIFECYCLE_OPTIONS[0];
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesLifecycle = filterLifecycle === "all" || c.lifecycle === filterLifecycle;
    return matchesSearch && matchesLifecycle;
  });

  // Stats
  const stats = {
    total: customers.length,
    leads: customers.filter(c => c.lifecycle === "lead").length,
    active: customers.filter(c => c.lifecycle === "active").length,
    repeat: customers.filter(c => c.lifecycle === "repeat").length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">
                {language === "es" ? "Clientes" : "Customers"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.leads}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active + stats.repeat}</p>
              <p className="text-xs text-muted-foreground">
                {language === "es" ? "Activos" : "Active"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">
                {language === "es" ? "Ingresos" : "Revenue"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Consultant Funnel Link */}
      {isConsultant && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-4">
            <Link 
              to="/consultant"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Kanban className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {language === "es" ? "Vista de Embudo" : "Funnel View"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" 
                      ? "Gestiona contactos por etapa" 
                      : "Manage contacts by stage"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main CRM Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-primary" />
              CRM Lite
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConsultant && (
                <Link to="/consultant">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Kanban className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {language === "es" ? "Embudo" : "Funnel"}
                    </span>
                  </Button>
                </Link>
              )}
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {language === "es" ? "Agregar" : "Add"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar clientes..." : "Search customers..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterLifecycle} onValueChange={setFilterLifecycle}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                {LIFECYCLE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {language === "es" ? l.labelEs : l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es" ? "Cargando..." : "Loading..."}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {customers.length === 0 
                ? (language === "es" ? "No hay clientes aún" : "No customers yet")
                : (language === "es" ? "Sin resultados" : "No results")}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredCustomers.map((customer) => {
                const lifecycleConfig = getLifecycleConfig(customer.lifecycle);
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{customer.name}</span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", lifecycleConfig.color)}>
                          {language === "es" ? lifecycleConfig.labelEs : lifecycleConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">${(customer.total_spent || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {customer.order_count || 0} {language === "es" ? "pedidos" : "orders"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {language === "es" ? "Nuevo Cliente" : "New Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{language === "es" ? "Nombre" : "Name"} *</Label>
              <Input
                placeholder={language === "es" ? "Nombre del cliente" : "Customer name"}
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
              <Label>{language === "es" ? "Estado" : "Status"}</Label>
              <Select value={lifecycle} onValueChange={setLifecycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {language === "es" ? l.labelEs : l.label}
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
                  setIsDialogOpen(false);
                }}
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdd}
                disabled={addMutation.isPending}
              >
                {language === "es" ? "Agregar" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <>
          <div 
            className="fixed inset-0 bg-foreground/20 z-40" 
            onClick={() => setSelectedCustomer(null)} 
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-semibold">{selectedCustomer.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Contact Actions */}
              <div className="flex gap-2">
                {selectedCustomer.phone && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`tel:${selectedCustomer.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {language === "es" ? "Llamar" : "Call"}
                    </a>
                  </Button>
                )}
                {selectedCustomer.email && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`mailto:${selectedCustomer.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
                {selectedCustomer.phone && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <svg className="w-4 h-4 mr-2 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>

              {/* WhatsApp Message Composer */}
              {selectedCustomer.phone && (
                <div className="space-y-2 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    {language === "es" ? "Enviar mensaje por WhatsApp" : "Send WhatsApp Message"}
                  </Label>
                  <Textarea
                    placeholder={language === "es" 
                      ? `Hola ${selectedCustomer.name}, ¿cómo estás?...` 
                      : `Hi ${selectedCustomer.name}, how are you?...`}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={3}
                    className="bg-background"
                  />
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!whatsappMessage.trim()}
                    onClick={() => {
                      if (!whatsappMessage.trim()) return;
                      const phone = selectedCustomer.phone.replace(/\D/g, '');
                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                      // Update last interaction
                      updateMutation.mutate({ id: selectedCustomer.id, last_interaction: new Date().toISOString() });
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {language === "es" ? "Abrir en WhatsApp" : "Open in WhatsApp"}
                  </Button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{language === "es" ? "Total gastado" : "Total spent"}</p>
                  <p className="text-xl font-bold">${(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{language === "es" ? "Pedidos" : "Orders"}</p>
                  <p className="text-xl font-bold">{selectedCustomer.order_count || 0}</p>
                </div>
              </div>

              {/* Lifecycle */}
              <div className="space-y-2">
                <Label>{language === "es" ? "Estado" : "Status"}</Label>
                <Select 
                  value={selectedCustomer.lifecycle} 
                  onValueChange={(value) => updateMutation.mutate({ id: selectedCustomer.id, lifecycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE_OPTIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {language === "es" ? l.labelEs : l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.last_interaction && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {language === "es" ? "Última interacción" : "Last interaction"}: {formatDistanceToNow(new Date(selectedCustomer.last_interaction), { addSuffix: true, locale: language === "es" ? es : undefined })}
                  </div>
                )}
              </div>

              {/* Delete */}
              <Button 
                variant="destructive" 
                className="w-full mt-6"
                onClick={() => {
                  if (confirm(language === "es" ? "¿Eliminar este cliente?" : "Delete this customer?")) {
                    deleteMutation.mutate(selectedCustomer.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === "es" ? "Eliminar cliente" : "Delete customer"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}