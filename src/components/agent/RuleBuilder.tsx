import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Plus, Zap, MessageSquare, Mail, Phone, ArrowRight, 
  Trash2, Edit2, ToggleLeft, GripVertical 
} from "lucide-react";

import type { Json } from "@/integrations/supabase/types";

export interface Rule {
  id: string;
  name: string;
  description?: string | null;
  trigger_type: string;
  trigger_config: Json;
  action_type: string;
  action_config: Json;
  approval_required: boolean;
  is_active: boolean;
  priority: number;
}

interface RuleBuilderProps {
  rules: Rule[];
  language: string;
}

const triggerTypes = [
  { value: "message_received", label: { en: "Message received", es: "Mensaje recibido" }, icon: MessageSquare },
  { value: "email_received", label: { en: "Email received", es: "Email recibido" }, icon: Mail },
  { value: "missed_call", label: { en: "Missed call", es: "Llamada perdida" }, icon: Phone },
  { value: "keyword_match", label: { en: "Keyword match", es: "Coincidencia de palabra" }, icon: Zap },
  { value: "no_response_24h", label: { en: "No response 24h", es: "Sin respuesta 24h" }, icon: Zap },
];

const actionTypes = [
  { value: "auto_reply", label: { en: "Auto reply", es: "Respuesta automática" } },
  { value: "forward_email", label: { en: "Forward email", es: "Reenviar email" } },
  { value: "initiate_call", label: { en: "Initiate voice call", es: "Iniciar llamada" } },
  { value: "create_task", label: { en: "Create task", es: "Crear tarea" } },
  { value: "notify_owner", label: { en: "Notify me", es: "Notificarme" } },
  { value: "ai_response", label: { en: "AI-generated response", es: "Respuesta con IA" } },
];

export function RuleBuilder({ rules, language }: RuleBuilderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [actionType, setActionType] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [responseTemplate, setResponseTemplate] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerType("");
    setActionType("");
    setApprovalRequired(true);
    setResponseTemplate("");
    setEditingRule(null);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description || "");
    setTriggerType(rule.trigger_type);
    setActionType(rule.action_type);
    setApprovalRequired(rule.approval_required);
    setResponseTemplate((rule.action_config as any)?.template || "");
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const ruleData = {
        user_id: user.id,
        name,
        description,
        trigger_type: triggerType,
        trigger_config: {},
        action_type: actionType,
        action_config: { template: responseTemplate },
        approval_required: approvalRequired,
        priority: rules.length,
      };

      if (editingRule) {
        const { error } = await supabase
          .from("agent_rules")
          .update(ruleData)
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_rules")
          .insert(ruleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-rules"] });
      toast.success(language === "es" ? "Regla guardada" : "Rule saved");
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(language === "es" ? "Error al guardar" : "Failed to save");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("agent_rules")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-rules"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-rules"] });
      toast.success(language === "es" ? "Regla eliminada" : "Rule deleted");
    },
  });

  const t = {
    addRule: language === "es" ? "Nueva Regla" : "New Rule",
    noRules: language === "es" 
      ? "No hay reglas configuradas. Crea una para automatizar respuestas." 
      : "No rules configured. Create one to automate responses.",
    when: language === "es" ? "Cuando" : "When",
    then: language === "es" ? "Entonces" : "Then",
    name: language === "es" ? "Nombre de la regla" : "Rule name",
    description: language === "es" ? "Descripción (opcional)" : "Description (optional)",
    trigger: language === "es" ? "Disparador" : "Trigger",
    action: language === "es" ? "Acción" : "Action",
    requireApproval: language === "es" ? "Requiere mi aprobación" : "Require my approval",
    responseTemplate: language === "es" ? "Plantilla de respuesta" : "Response template",
    save: language === "es" ? "Guardar" : "Save",
    cancel: language === "es" ? "Cancelar" : "Cancel",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "es" ? "Reglas de Automatización" : "Automation Rules"}
        </h3>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t.addRule}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRule 
                  ? (language === "es" ? "Editar Regla" : "Edit Rule") 
                  : t.addRule}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t.name}</Label>
                <Input
                  placeholder={language === "es" ? "Ej: Respuesta rápida WhatsApp" : "Ex: Quick WhatsApp reply"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Input
                  placeholder={language === "es" ? "Describe qué hace esta regla" : "Describe what this rule does"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.trigger}</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map(trigger => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label[language as "en" | "es"] || trigger.label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.action}</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map(action => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label[language as "en" | "es"] || action.label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(actionType === "auto_reply" || actionType === "ai_response") && (
                <div className="space-y-2">
                  <Label>{t.responseTemplate}</Label>
                  <Textarea
                    placeholder={language === "es" 
                      ? "Hola {{nombre}}, gracias por contactarnos..." 
                      : "Hi {{name}}, thanks for reaching out..."}
                    value={responseTemplate}
                    onChange={(e) => setResponseTemplate(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "es" 
                      ? "Usa {{nombre}}, {{email}} para variables" 
                      : "Use {{name}}, {{email}} for variables"}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{t.requireApproval}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" 
                      ? "Revisar antes de enviar (modo híbrido)" 
                      : "Review before sending (hybrid mode)"}
                  </p>
                </div>
                <Switch
                  checked={approvalRequired}
                  onCheckedChange={setApprovalRequired}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t.cancel}
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={!name || !triggerType || !actionType || saveMutation.isPending}
              >
                {t.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">{t.noRules}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const trigger = triggerTypes.find(t => t.value === rule.trigger_type);
            const action = actionTypes.find(a => a.value === rule.action_type);
            const TriggerIcon = trigger?.icon || Zap;
            
            return (
              <Card key={rule.id} className={`transition-all ${!rule.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{rule.name}</h4>
                        {rule.approval_required && (
                          <Badge variant="outline" className="text-[10px]">
                            {language === "es" ? "Aprobación" : "Approval"}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TriggerIcon className="w-4 h-4" />
                        <span>{trigger?.label[language as "en" | "es"] || trigger?.label.en}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{action?.label[language as "en" | "es"] || action?.label.en}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEdit(rule)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
