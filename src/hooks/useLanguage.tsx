import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "es";

interface Translations {
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  
  // Navigation
  dashboard: string;
  storefronts: string;
  products: string;
  orderHistory: string;
  admin: string;
  home: string;
  orders: string;
  more: string;
  
  // Actions
  signOut: string;
  lightMode: string;
  darkMode: string;
  new: string;
  send: string;
  sendNow: string;
  edit: string;
  delete: string;
  cancel: string;
  save: string;
  copyLink: string;
  shareViaWhatsApp: string;
  shareViaInstagram: string;
  markAsPaid: string;
  sendReminder: string;
  
  // Dashboard
  totalBalance: string;
  vsYesterday: string;
  today: string;
  pending: string;
  drafts: string;
  completed: string;
  awaiting: string;
  toComplete: string;
  allTime: string;
  needsAttention: string;
  items: string;
  allCaughtUp: string;
  businessRunningSmooth: string;
  momentum: string;
  todaysEarnings: string;
  noPaymentsYet: string;
  earningsAppearHere: string;
  startSelling: string;
  createFirstStorefront: string;
  createStorefront: string;
  
  // Storefronts
  storefrontsTitle: string;
  storefrontsDesc: string;
  noStorefrontsYet: string;
  createFirstToStart: string;
  all: string;
  draft: string;
  sent: string;
  paid: string;
  ordered: string;
  completeStorefront: string;
  readyToShare: string;
  shareNow: string;
  awaitingPayment: string;
  deleteStorefront: string;
  deleteConfirm: string;
  
  // Order History
  orderHistoryTitle: string;
  orderHistoryDesc: string;
  noCustomersYet: string;
  customersAppearAuto: string;
  searchCustomers: string;
  spent: string;
  
  // Admin
  adminTitle: string;
  adminDesc: string;
  brand: string;
  businessLogo: string;
  storefrontImage: string;
  business: string;
  businessName: string;
  businessType: string;
  taxId: string;
  country: string;
  contactPresence: string;
  whatsappPhone: string;
  website: string;
  payments: string;
  creditDebitCards: string;
  cash: string;
  location: string;
  getLocation: string;
  saveSettings: string;
  saving: string;
  
  // Momentum
  excellent: string;
  goodProgress: string;
  buildingUp: string;
  needsFocus: string;
  low: string;
  high: string;
  basedOnActivity: string;
  
  // Status
  loading: string;
}

const translations: Record<Language, Translations> = {
  en: {
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    
    dashboard: "Dashboard",
    storefronts: "Storefronts",
    products: "Products",
    orderHistory: "Order History",
    admin: "Admin",
    home: "Home",
    orders: "Orders",
    more: "More",
    
    signOut: "Sign out",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    new: "New",
    send: "Send",
    sendNow: "Send now",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    copyLink: "Copy link",
    shareViaWhatsApp: "Share via WhatsApp",
    shareViaInstagram: "Share via Instagram",
    markAsPaid: "Mark as paid",
    sendReminder: "Send reminder",
    
    totalBalance: "Total Balance",
    vsYesterday: "vs yesterday",
    today: "Today",
    pending: "Pending",
    drafts: "Drafts",
    completed: "Completed",
    awaiting: "awaiting",
    toComplete: "to complete",
    allTime: "all time",
    needsAttention: "Needs Attention",
    items: "items",
    allCaughtUp: "All caught up",
    businessRunningSmooth: "Business is running smoothly",
    momentum: "Momentum",
    todaysEarnings: "Today's Earnings",
    noPaymentsYet: "No payments yet today",
    earningsAppearHere: "Earnings will appear here",
    startSelling: "Start selling",
    createFirstStorefront: "Create your first storefront and share it with customers to get paid",
    createStorefront: "Create storefront",
    
    storefrontsTitle: "Storefronts",
    storefrontsDesc: "One link per order. Share and get paid.",
    noStorefrontsYet: "No storefronts yet",
    createFirstToStart: "Create your first to start selling",
    all: "All",
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    ordered: "Ordered",
    completeStorefront: "Complete storefront",
    readyToShare: "is ready to share",
    shareNow: "Share now",
    awaitingPayment: "Awaiting payment",
    deleteStorefront: "Delete storefront?",
    deleteConfirm: "This will permanently delete",
    
    orderHistoryTitle: "Order History",
    orderHistoryDesc: "Your business memory — auto-updated from orders.",
    noCustomersYet: "No customers yet",
    customersAppearAuto: "Customers appear here automatically when you create storefronts",
    searchCustomers: "Search customers...",
    spent: "Spent",
    
    adminTitle: "Admin",
    adminDesc: "Set it once. Everything runs from here.",
    brand: "Brand",
    businessLogo: "Business logo",
    storefrontImage: "Storefront image",
    business: "Business",
    businessName: "Business name",
    businessType: "Business type",
    taxId: "Tax ID (RUC)",
    country: "Country",
    contactPresence: "Contact & Presence",
    whatsappPhone: "WhatsApp / Phone",
    website: "Website",
    payments: "Payments",
    creditDebitCards: "Credit / Debit cards",
    cash: "Cash",
    location: "Location",
    getLocation: "Get location",
    saveSettings: "Save settings",
    saving: "Saving...",
    
    excellent: "Excellent",
    goodProgress: "Good progress",
    buildingUp: "Building up",
    needsFocus: "Needs focus",
    low: "Low",
    high: "High",
    basedOnActivity: "Based on activity & conversions",
    
    loading: "Loading...",
  },
  es: {
    goodMorning: "Buenos días",
    goodAfternoon: "Buenas tardes",
    goodEvening: "Buenas noches",
    
    dashboard: "Inicio",
    storefronts: "Vitrinas",
    products: "Productos",
    orderHistory: "Historial",
    admin: "Admin",
    home: "Inicio",
    orders: "Pedidos",
    more: "Más",
    
    signOut: "Cerrar sesión",
    lightMode: "Modo claro",
    darkMode: "Modo oscuro",
    new: "Nuevo",
    send: "Enviar",
    sendNow: "Enviar ahora",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    save: "Guardar",
    copyLink: "Copiar enlace",
    shareViaWhatsApp: "Compartir por WhatsApp",
    shareViaInstagram: "Compartir por Instagram",
    markAsPaid: "Marcar como pagado",
    sendReminder: "Enviar recordatorio",
    
    totalBalance: "Balance Total",
    vsYesterday: "vs ayer",
    today: "Hoy",
    pending: "Pendiente",
    drafts: "Borradores",
    completed: "Completados",
    awaiting: "esperando",
    toComplete: "por completar",
    allTime: "total",
    needsAttention: "Requiere Atención",
    items: "elementos",
    allCaughtUp: "Todo al día",
    businessRunningSmooth: "Tu negocio marcha bien",
    momentum: "Impulso",
    todaysEarnings: "Ganancias de Hoy",
    noPaymentsYet: "Sin pagos hoy",
    earningsAppearHere: "Las ganancias aparecerán aquí",
    startSelling: "Empieza a vender",
    createFirstStorefront: "Crea tu primera vitrina y compártela con clientes para recibir pagos",
    createStorefront: "Crear vitrina",
    
    storefrontsTitle: "Vitrinas",
    storefrontsDesc: "Un enlace por pedido. Comparte y cobra.",
    noStorefrontsYet: "Sin vitrinas aún",
    createFirstToStart: "Crea tu primera vitrina para empezar",
    all: "Todas",
    draft: "Borrador",
    sent: "Enviada",
    paid: "Pagada",
    ordered: "Ordenada",
    completeStorefront: "Completar vitrina",
    readyToShare: "lista para compartir",
    shareNow: "Compartir",
    awaitingPayment: "Esperando pago",
    deleteStorefront: "¿Eliminar vitrina?",
    deleteConfirm: "Esto eliminará permanentemente",
    
    orderHistoryTitle: "Historial de Pedidos",
    orderHistoryDesc: "La memoria de tu negocio — actualizada automáticamente.",
    noCustomersYet: "Sin clientes aún",
    customersAppearAuto: "Los clientes aparecen aquí automáticamente al crear vitrinas",
    searchCustomers: "Buscar clientes...",
    spent: "Gastó",
    
    adminTitle: "Admin",
    adminDesc: "Configúralo una vez. Todo funciona desde aquí.",
    brand: "Marca",
    businessLogo: "Logo del negocio",
    storefrontImage: "Imagen de vitrina",
    business: "Negocio",
    businessName: "Nombre del negocio",
    businessType: "Tipo de negocio",
    taxId: "RUC",
    country: "País",
    contactPresence: "Contacto y Presencia",
    whatsappPhone: "WhatsApp / Teléfono",
    website: "Sitio web",
    payments: "Pagos",
    creditDebitCards: "Tarjetas de crédito / débito",
    cash: "Efectivo",
    location: "Ubicación",
    getLocation: "Obtener ubicación",
    saveSettings: "Guardar configuración",
    saving: "Guardando...",
    
    excellent: "Excelente",
    goodProgress: "Buen progreso",
    buildingUp: "Creciendo",
    needsFocus: "Necesita enfoque",
    low: "Bajo",
    high: "Alto",
    basedOnActivity: "Basado en actividad y conversiones",
    
    loading: "Cargando...",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  getGreeting: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  const t = translations[language];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getGreeting }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
