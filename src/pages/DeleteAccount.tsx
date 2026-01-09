import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export default function DeleteAccount() {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const isEs = language === "es";

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [
        { data: profile },
        { data: products },
        { data: storefronts },
        { data: customers },
        { data: activity },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("products").select("*").eq("user_id", user.id),
        supabase.from("storefronts").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
        supabase.from("activity_log").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile,
        products: products || [],
        storefronts: storefronts || [],
        customers: customers || [],
        activityLog: activity || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kitz-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(isEs ? "Datos exportados correctamente" : "Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(isEs ? "Error al exportar datos" : "Error exporting data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmation !== "DELETE") return;

    setIsDeleting(true);
    try {
      // Delete all user data in order (respecting foreign keys)
      await Promise.all([
        supabase.from("activity_log").delete().eq("user_id", user.id),
        supabase.from("autopilot_settings").delete().eq("user_id", user.id),
        supabase.from("autopilot_actions").delete().eq("user_id", user.id),
        supabase.from("autopilot_queue").delete().eq("user_id", user.id),
        supabase.from("content_calendar").delete().eq("user_id", user.id),
        supabase.from("eisenhower_tasks").delete().eq("user_id", user.id),
        supabase.from("habits").delete().eq("user_id", user.id),
        supabase.from("user_badges").delete().eq("user_id", user.id),
        supabase.from("user_commitments").delete().eq("user_id", user.id),
        supabase.from("user_goals").delete().eq("user_id", user.id),
        supabase.from("user_stats").delete().eq("user_id", user.id),
        supabase.from("user_roles").delete().eq("user_id", user.id),
        supabase.from("suggestion_votes").delete().eq("user_id", user.id),
        supabase.from("suggestion_comments").delete().eq("user_id", user.id),
        supabase.from("suggestions").delete().eq("user_id", user.id),
      ]);

      // Delete storefronts (and their items via cascade)
      await supabase.from("storefronts").delete().eq("user_id", user.id);
      
      // Delete remaining data
      await Promise.all([
        supabase.from("products").delete().eq("user_id", user.id),
        supabase.from("customers").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);

      // Sign out and redirect
      await signOut();
      toast.success(isEs ? "Cuenta eliminada" : "Account deleted");
      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(isEs ? "Error al eliminar cuenta" : "Error deleting account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEs ? "Volver" : "Back"}
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          {isEs ? "Eliminar Cuenta" : "Delete Account"}
        </h1>

        {/* Export Data Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {isEs ? "Exportar tus Datos" : "Export Your Data"}
            </CardTitle>
            <CardDescription>
              {isEs
                ? "Descarga una copia de todos tus datos antes de eliminar tu cuenta."
                : "Download a copy of all your data before deleting your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting 
                ? (isEs ? "Exportando..." : "Exporting...")
                : (isEs ? "Descargar mis datos" : "Download my data")}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isEs ? "Zona de Peligro" : "Danger Zone"}
            </CardTitle>
            <CardDescription>
              {isEs
                ? "Esta acción es irreversible. Todos tus datos serán eliminados permanentemente."
                : "This action is irreversible. All your data will be permanently deleted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isEs
                  ? "Esto eliminará: tu perfil, productos, cotizaciones, clientes, estadísticas y todo el historial asociado a tu cuenta."
                  : "This will delete: your profile, products, quotes, customers, statistics, and all history associated with your account."}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isEs
                  ? 'Escribe "DELETE" para confirmar:'
                  : 'Type "DELETE" to confirm:'}
              </label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
                className="max-w-xs"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmation !== "DELETE" || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting 
                ? (isEs ? "Eliminando..." : "Deleting...")
                : (isEs ? "Eliminar mi cuenta permanentemente" : "Permanently delete my account")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
