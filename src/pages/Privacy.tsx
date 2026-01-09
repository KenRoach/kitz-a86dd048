import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
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
          {isEs ? "Política de Privacidad" : "Privacy Policy"}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {isEs ? "Última actualización: Enero 2025" : "Last updated: January 2025"}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "1. Información que Recopilamos" : "1. Information We Collect"}
            </h2>
            <p>
              {isEs
                ? "Recopilamos información que nos proporcionas directamente, incluyendo: nombre del negocio, correo electrónico, número de teléfono, y datos de productos/servicios que ingresas en la plataforma."
                : "We collect information you provide directly, including: business name, email, phone number, and product/service data you enter into the platform."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "2. Cómo Usamos tu Información" : "2. How We Use Your Information"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{isEs ? "Para operar y mantener tu cuenta" : "To operate and maintain your account"}</li>
              <li>{isEs ? "Para procesar tus transacciones y pedidos" : "To process your transactions and orders"}</li>
              <li>{isEs ? "Para enviarte notificaciones importantes" : "To send you important notifications"}</li>
              <li>{isEs ? "Para mejorar nuestros servicios" : "To improve our services"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "3. Compartir Información" : "3. Information Sharing"}
            </h2>
            <p>
              {isEs
                ? "No vendemos ni compartimos tu información personal con terceros, excepto cuando es necesario para proporcionar nuestros servicios (como enviar notificaciones por WhatsApp o email)."
                : "We do not sell or share your personal information with third parties, except when necessary to provide our services (such as sending notifications via WhatsApp or email)."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "4. Seguridad de Datos" : "4. Data Security"}
            </h2>
            <p>
              {isEs
                ? "Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo encriptación, control de acceso y monitoreo continuo."
                : "We implement technical and organizational security measures to protect your information, including encryption, access control, and continuous monitoring."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "5. Tus Derechos" : "5. Your Rights"}
            </h2>
            <p>
              {isEs
                ? "Tienes derecho a acceder, corregir o eliminar tu información personal. Puedes solicitar la exportación de tus datos o la eliminación de tu cuenta en cualquier momento."
                : "You have the right to access, correct, or delete your personal information. You can request data export or account deletion at any time."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              {isEs ? "6. Contacto" : "6. Contact"}
            </h2>
            <p>
              {isEs
                ? "Si tienes preguntas sobre esta política, contáctanos a través de la página de Sugerencias en la aplicación."
                : "If you have questions about this policy, contact us through the Suggestions page in the app."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
