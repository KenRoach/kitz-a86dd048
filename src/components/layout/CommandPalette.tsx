import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, ShoppingCart, BarChart3, Store,
  Package, Bot, Settings, Plus, Search
} from "lucide-react";

const ROUTES = [
  { icon: LayoutDashboard, label: "Home", labelEs: "Inicio", path: "/dashboard", keywords: ["dashboard", "inicio", "home"] },
  { icon: Users, label: "CRM", labelEs: "CRM", path: "/crm", keywords: ["contacts", "leads", "contactos", "crm"] },
  { icon: ShoppingCart, label: "Orders", labelEs: "Órdenes", path: "/orders", keywords: ["orders", "ordenes", "payments", "pagos"] },
  { icon: BarChart3, label: "Insights", labelEs: "Métricas", path: "/insights", keywords: ["insights", "metrics", "revenue", "metricas"] },
  { icon: Store, label: "Storefronts", labelEs: "Vitrinas", path: "/storefronts", keywords: ["storefronts", "vitrinas", "links", "payment links"] },
  { icon: Package, label: "Products", labelEs: "Productos", path: "/products", keywords: ["products", "productos", "catalog", "catalogo"] },
  { icon: Bot, label: "AI Agent", labelEs: "Agente IA", path: "/agent", keywords: ["agent", "agente", "ai", "bot", "automation"] },
  { icon: Settings, label: "Settings", labelEs: "Ajustes", path: "/settings", keywords: ["settings", "ajustes", "config", "profile"] },
];

const ACTIONS = [
  { icon: Plus, label: "New Contact", labelEs: "Nuevo Contacto", path: "/crm", keywords: ["add contact", "new contact", "crear contacto"] },
  { icon: Plus, label: "New Order", labelEs: "Nueva Orden", path: "/orders", keywords: ["add order", "new order", "crear orden"] },
  { icon: Plus, label: "New Storefront", labelEs: "Nueva Vitrina", path: "/storefronts", keywords: ["add storefront", "new storefront", "crear vitrina"] },
  { icon: Plus, label: "New Product", labelEs: "Nuevo Producto", path: "/products", keywords: ["add product", "new product", "crear producto"] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  // ⌘K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <>
      {/* Trigger for external use */}
      <button
        onClick={() => setOpen(true)}
        className="hidden"
        id="kitz-command-trigger"
      />
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={language === "es" ? "¿Qué necesitas?" : "What do you need?"} />
        <CommandList>
          <CommandEmpty>
            {language === "es" ? "Sin resultados." : "No results found."}
          </CommandEmpty>
          <CommandGroup heading={language === "es" ? "Navegar" : "Navigate"}>
            {ROUTES.map((route) => (
              <CommandItem
                key={route.path}
                value={[route.label, route.labelEs, ...route.keywords].join(" ")}
                onSelect={() => handleSelect(route.path)}
              >
                <route.icon className="mr-2 h-4 w-4" />
                <span>{language === "es" ? route.labelEs : route.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={language === "es" ? "Acciones" : "Actions"}>
            {ACTIONS.map((action, i) => (
              <CommandItem
                key={i}
                value={[action.label, action.labelEs, ...action.keywords].join(" ")}
                onSelect={() => handleSelect(action.path)}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span>{language === "es" ? action.labelEs : action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function openCommandPalette() {
  document.getElementById("kitz-command-trigger")?.click();
}
