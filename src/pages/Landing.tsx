import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  Shield, 
  DollarSign, 
  Users, 
  Store, 
  FileText,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Cobra Rápido",
    titleEn: "Get Paid Fast",
    description: "Recibe pagos al instante con enlaces compartibles",
    descriptionEn: "Receive payments instantly with shareable links"
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    titleEn: "Secure & Reliable",
    description: "Tu negocio y datos protegidos 24/7",
    descriptionEn: "Your business and data protected 24/7"
  },
  {
    icon: Store,
    title: "Tu Vitrina Digital",
    titleEn: "Your Digital Storefront",
    description: "Crea catálogos profesionales en minutos",
    descriptionEn: "Create professional catalogs in minutes"
  },
  {
    icon: FileText,
    title: "Todo Legal",
    titleEn: "Stay Compliant",
    description: "Facturas, reportes y documentos en orden",
    descriptionEn: "Invoices, reports and documents in order"
  },
  {
    icon: Users,
    title: "Gestión de Clientes",
    titleEn: "Customer Management",
    description: "Conoce y cuida a tus clientes",
    descriptionEn: "Know and care for your customers"
  },
  {
    icon: Zap,
    title: "Simple de Usar",
    titleEn: "Simple to Use",
    description: "Sin complicaciones técnicas",
    descriptionEn: "No technical complications"
  }
];

const benefits = [
  "Sin conocimientos técnicos requeridos",
  "Soporte en español 24/7",
  "Múltiples métodos de pago",
  "Reportes automáticos",
  "Comparte por WhatsApp"
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">kitz</span>
          </div>
          <Link to="/auth">
            <Button variant="default" size="sm">
              Comenzar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            La forma más simple de hacer negocios
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Tu negocio,{" "}
            <span className="text-primary">organizado y legal</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            La plataforma todo-en-uno para emprendedores, pequeños negocios y comerciantes. 
            Cobra rápido, mantente seguro y crece sin complicaciones.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                Crear mi cuenta gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>100% Gratis para empezar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Sin tarjeta requerida</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Soporte en español</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Diseñado para personas reales, no para expertos en tecnología
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 border border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Por qué kitz?
              </h2>
              <p className="text-muted-foreground text-lg">
                Hecho para emprendedores como tú
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-background/60 backdrop-blur-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Empieza hoy, es gratis
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Únete a miles de emprendedores que ya manejan su negocio de forma simple y segura
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-base px-10">
              Crear mi cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">kitz</span>
          </div>
          <p>© 2025 kitz. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
