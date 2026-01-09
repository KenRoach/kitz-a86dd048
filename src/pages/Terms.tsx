import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEs = language === "es";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEs ? "Volver" : "Back"}
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          {isEs ? "Términos de Servicio" : "Terms of Service"}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {isEs ? "Última actualización: Enero 2025" : "Last updated: January 2025"}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "1. Aceptación de los Términos" : "1. Acceptance of Terms"}
            </h2>
            <p>
              {isEs
                ? "Al usar Kitz, aceptas estos términos de servicio. Si no estás de acuerdo, no uses la plataforma."
                : "By using Kitz, you accept these terms of service. If you disagree, do not use the platform."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "2. Descripción del Servicio" : "2. Service Description"}
            </h2>
            <p>
              {isEs
                ? "Kitz es una plataforma de gestión de ventas que te permite crear cotizaciones, gestionar productos, clientes y pagos para tu negocio."
                : "Kitz is a sales management platform that allows you to create quotes, manage products, customers, and payments for your business."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "3. Uso Aceptable" : "3. Acceptable Use"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{isEs ? "No uses la plataforma para actividades ilegales" : "Do not use the platform for illegal activities"}</li>
              <li>{isEs ? "No intentes acceder a cuentas de otros usuarios" : "Do not attempt to access other users' accounts"}</li>
              <li>{isEs ? "Mantén la seguridad de tu cuenta" : "Maintain the security of your account"}</li>
              <li>{isEs ? "No uses el servicio para enviar spam" : "Do not use the service to send spam"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "4. Propiedad Intelectual" : "4. Intellectual Property"}
            </h2>
            <p>
              {isEs
                ? "Tú mantienes la propiedad de todo el contenido que subes. Nos otorgas una licencia para usar ese contenido únicamente para proporcionar el servicio."
                : "You retain ownership of all content you upload. You grant us a license to use that content solely to provide the service."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "5. Limitación de Responsabilidad" : "5. Limitation of Liability"}
            </h2>
            <p>
              {isEs
                ? "El servicio se proporciona 'tal cual'. No garantizamos disponibilidad ininterrumpida. No somos responsables por pérdidas indirectas o consecuentes."
                : "The service is provided 'as is'. We do not guarantee uninterrupted availability. We are not liable for indirect or consequential losses."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "6. Terminación" : "6. Termination"}
            </h2>
            <p>
              {isEs
                ? "Puedes eliminar tu cuenta en cualquier momento. Nos reservamos el derecho de suspender cuentas que violen estos términos."
                : "You can delete your account at any time. We reserve the right to suspend accounts that violate these terms."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "7. Cambios a los Términos" : "7. Changes to Terms"}
            </h2>
            <p>
              {isEs
                ? "Podemos actualizar estos términos ocasionalmente. Te notificaremos de cambios significativos."
                : "We may update these terms occasionally. We will notify you of significant changes."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
