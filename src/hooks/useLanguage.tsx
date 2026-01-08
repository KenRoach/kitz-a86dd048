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
  suggestions: string;
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
  
  // Auth
  welcomeBack: string;
  createAccount: string;
  signIn: string;
  forgotPassword: string;
  resetPassword: string;
  sendResetLink: string;
  enterEmailForReset: string;
  checkEmail: string;
  resetLinkSent: string;
  backToSignIn: string;
  noAccount: string;
  alreadyHaveAccount: string;
  email: string;
  password: string;
  confirmPassword: string;
  newPassword: string;
  setNewPassword: string;
  enterNewPassword: string;
  passwordUpdated: string;
  passwordResetSuccess: string;
  goToDashboard: string;
  invalidResetLink: string;
  linkExpired: string;
  
  // Storefront Wizard
  whatTypeOfOrder: string;
  chooseHowToSell: string;
  singleItem: string;
  oneProductOrService: string;
  bundle: string;
  multipleItemsTogether: string;
  continueBtn: string;
  createYourBundle: string;
  addItemsToPackage: string;
  bundleName: string;
  whatAreYouSelling: string;
  pickFromCatalog: string;
  fromCatalog: string;
  manualEntry: string;
  title: string;
  aiSuggest: string;
  price: string;
  quantity: string;
  description: string;
  addPhoto: string;
  changePhoto: string;
  reviewOrder: string;
  readyToCreate: string;
  invoice: string;
  quote: string;
  saveAsDraft: string;
  createAndShare: string;
  creating: string;
  back: string;
  
  // Share Dialog
  shareYourStorefront: string;
  quickShare: string;
  copied: string;
  showQrCode: string;
  backToShareOptions: string;
  share: string;
  qr: string;
  done: string;
  scanToViewOrder: string;
  
  // Storefront Card
  for: string;
  qty: string;
  viewProof: string;
  paymentProof: string;
  from: string;
  close: string;
  verifyMarkPaid: string;
  reorder: string;
  showQr: string;
  preparing: string;
  ready: string;
  complete: string;
  
  // Bundle Items
  item: string;
  itemName: string;
  addAnotherItem: string;
  bundleTotal: string;
  
  // Product Selector
  noProductsInCatalog: string;
  addProductsFirst: string;
  
  // Products Page
  newProduct: string;
  editProduct: string;
  noProductsYet: string;
  buildCatalogOnce: string;
  createProduct: string;
  aiGeneratesDesc: string;
  addImagesForSales: string;
  organizeByCategories: string;
  productName: string;
  category: string;
  selectCategory: string;
  food: string;
  drinks: string;
  clothing: string;
  accessories: string;
  services: string;
  digital: string;
  other: string;
  uploadImage: string;
  active: string;
  generateDesc: string;
  saveChanges: string;
  
  // Admin Page
  saveAllChanges: string;
  instagram: string;
  city: string;
  address: string;
  gettingLocation: string;
  integrations: string;
  
  // Public Pages
  sendMessage: string;
  sending: string;
  orderNow: string;
  orderDetails: string;
  yourName: string;
  yourPhone: string;
  noteOptional: string;
  placeOrder: string;
  placingOrder: string;
  orderPlaced: string;
  orderPlacedDesc: string;
  backToStore: string;
  
  // Empty States
  noOrdersYet: string;
  ordersAppearHere: string;
  
  // Misc
  total: string;
  optional: string;
  viewAll: string;
  seeAll: string;
  linkCopied: string;
  error: string;
  success: string;
  confirm: string;
  
  // Fulfillment
  fulfillmentPending: string;
  fulfillmentPreparing: string;
  fulfillmentReady: string;
  fulfillmentComplete: string;
  
  // Admin Page Extended
  profileQrCode: string;
  scanToVisit: string;
  profileUsername: string;
  onlinePayments: string;
  localPayments: string;
  acceptCardsWorldwide: string;
  mobilePayments: string;
  inPersonPayments: string;
  employeeBenefitCards: string;
  
  // Public Profile
  notFound: string;
  profileNotFoundDesc: string;
  contact: string;
  verifiedSeller: string;
  trusted: string;
  highRepeat: string;
  availableNow: string;
  accepts: string;
  links: string;
  poweredBy: string;
  contactBusiness: string;
  sendInquiry: string;
  yourMessage: string;
  messagePlaceholder: string;
  rememberMe: string;
  messageSent: string;
  willGetBack: string;
  
  // Public Storefront
  storefrontNotFound: string;
  storefrontNotFoundDesc: string;
  goHome: string;
  thisIsQuote: string;
  reviewQuote: string;
  quoteAccepted: string;
  proceedToOrder: string;
  orderSummary: string;
  itemsCount: string;
  deliveryInfo: string;
  acceptedPayments: string;
  yourDetails: string;
  specialRequests: string;
  saveInfoFaster: string;
  usingSavedInfo: string;
  saveYourInfo: string;
  speedUpPurchase: string;
  rememberDays: string;
  noThanks: string;
  saveMyInfo: string;
  orderReceived: string;
  uploadPaymentProof: string;
  paymentComplete: string;
  awaitingPaymentStatus: string;
  acceptQuote: string;
  accepting: string;
  
  // Chat Widget
  support: string;
  instantReplies: string;
  chatGreeting: string;
  howCanIHelp: string;
  typeQuestion: string;
  typing: string;
  openChat: string;
  closeChat: string;
  
  // Business Advisor
  businessAdvisor: string;
  aiInsights: string;
  yourAiAdvisor: string;
  advisorIntro: string;
  quickQuestions: string;
  analyzingData: string;
  speak: string;
  stop: string;
  listening: string;
  speaking: string;
  askAboutBusiness: string;
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
    suggestions: "Suggestions",
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
    
    welcomeBack: "Welcome back",
    createAccount: "Create your account",
    signIn: "Sign in",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset password",
    sendResetLink: "Send reset link",
    enterEmailForReset: "Enter your email and we'll send you a reset link",
    checkEmail: "Check your email",
    resetLinkSent: "We sent a password reset link to",
    backToSignIn: "Back to sign in",
    noAccount: "Don't have an account? Create one",
    alreadyHaveAccount: "Already have an account? Sign in",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    newPassword: "New password",
    setNewPassword: "Set new password",
    enterNewPassword: "Enter your new password below",
    passwordUpdated: "Password updated",
    passwordResetSuccess: "Your password has been successfully reset",
    goToDashboard: "Go to dashboard",
    invalidResetLink: "Invalid or expired link",
    linkExpired: "This password reset link is no longer valid. Please request a new one.",
    
    // Storefront Wizard
    whatTypeOfOrder: "What type of order?",
    chooseHowToSell: "Choose how you want to sell",
    singleItem: "Single item",
    oneProductOrService: "One product or service",
    bundle: "Bundle",
    multipleItemsTogether: "Multiple items together",
    continueBtn: "Continue",
    createYourBundle: "Create your bundle",
    addItemsToPackage: "Add items to your package",
    bundleName: "Bundle name",
    whatAreYouSelling: "What are you selling?",
    pickFromCatalog: "Pick from catalog or enter manually",
    fromCatalog: "From catalog",
    manualEntry: "Manual entry",
    title: "Title",
    aiSuggest: "AI Suggest",
    price: "Price",
    quantity: "Quantity",
    description: "Description",
    addPhoto: "Add photo",
    changePhoto: "Change",
    reviewOrder: "Review your order",
    readyToCreate: "Ready to create",
    invoice: "Invoice",
    quote: "Quote",
    saveAsDraft: "Save as draft",
    createAndShare: "Create & Share",
    creating: "Creating...",
    back: "Back",
    
    // Share Dialog
    shareYourStorefront: "Share your storefront",
    quickShare: "Quick share",
    copied: "Copied!",
    showQrCode: "Show QR Code",
    backToShareOptions: "Back to share options",
    share: "Share",
    qr: "QR",
    done: "Done",
    scanToViewOrder: "Scan to view and order",
    
    // Storefront Card
    for: "For",
    qty: "Qty",
    viewProof: "View proof",
    paymentProof: "Payment Proof",
    from: "From",
    close: "Close",
    verifyMarkPaid: "Verify & Mark Paid",
    reorder: "Reorder",
    showQr: "Show QR code",
    preparing: "Preparing",
    ready: "Ready",
    complete: "Complete",
    
    // Bundle Items
    item: "Item",
    itemName: "Item name",
    addAnotherItem: "Add another item",
    bundleTotal: "Bundle total",
    
    // Product Selector
    noProductsInCatalog: "No products in catalog",
    addProductsFirst: "Add products first or enter details manually",
    
    // Products Page
    newProduct: "New Product",
    editProduct: "Edit Product",
    noProductsYet: "No products yet",
    buildCatalogOnce: "Build your product catalog once, reuse across all your storefronts.",
    createProduct: "Create product",
    aiGeneratesDesc: "AI generates descriptions for you",
    addImagesForSales: "Add images for better sales",
    organizeByCategories: "Organize by categories",
    productName: "Product name",
    category: "Category",
    selectCategory: "Select category",
    food: "Food",
    drinks: "Drinks",
    clothing: "Clothing",
    accessories: "Accessories",
    services: "Services",
    digital: "Digital",
    other: "Other",
    uploadImage: "Upload image",
    active: "Active",
    generateDesc: "Generate",
    saveChanges: "Save changes",
    
    // Admin Page
    saveAllChanges: "Save all changes",
    instagram: "Instagram",
    city: "City",
    address: "Address",
    gettingLocation: "Getting location...",
    integrations: "Integrations",
    
    // Public Pages
    sendMessage: "Send Message",
    sending: "Sending...",
    orderNow: "Order Now",
    orderDetails: "Order Details",
    yourName: "Your name",
    yourPhone: "Your phone",
    noteOptional: "Note (optional)",
    placeOrder: "Place Order",
    placingOrder: "Placing order...",
    orderPlaced: "Order Placed!",
    orderPlacedDesc: "The seller will contact you shortly.",
    backToStore: "Back to store",
    
    // Empty States
    noOrdersYet: "No orders yet",
    ordersAppearHere: "Orders will appear here",
    
    // Misc
    total: "Total",
    optional: "optional",
    viewAll: "View all",
    seeAll: "See all",
    linkCopied: "Link copied!",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    
    // Fulfillment
    fulfillmentPending: "Pending",
    fulfillmentPreparing: "Preparing",
    fulfillmentReady: "Ready",
    fulfillmentComplete: "Complete",
    
    // Admin Page Extended
    profileQrCode: "Profile QR Code",
    scanToVisit: "Scan to visit your profile",
    profileUsername: "Profile username",
    onlinePayments: "Online payments",
    localPayments: "Local payments",
    acceptCardsWorldwide: "Accept cards worldwide",
    mobilePayments: "Banco General mobile payments",
    inPersonPayments: "In-person payments",
    employeeBenefitCards: "Employee benefit cards",
    
    // Public Profile
    notFound: "Not found",
    profileNotFoundDesc: "This profile doesn't exist or has been removed.",
    contact: "Contact",
    verifiedSeller: "Verified Seller",
    trusted: "Trusted",
    highRepeat: "High Repeat",
    availableNow: "Available Now",
    accepts: "Accepts",
    links: "Links",
    poweredBy: "Powered by Kitz • Share your link to grow",
    contactBusiness: "Contact",
    sendInquiry: "Send a message or inquiry",
    yourMessage: "Message",
    messagePlaceholder: "Hi! I'm interested in...",
    rememberMe: "Remember me for faster contact",
    messageSent: "Message Sent!",
    willGetBack: "will get back to you soon.",
    
    // Public Storefront
    storefrontNotFound: "Storefront not found",
    storefrontNotFoundDesc: "This link may have expired or doesn't exist.",
    goHome: "Go home",
    thisIsQuote: "This is a quote",
    reviewQuote: "Review the details and accept this quote to proceed with your order.",
    quoteAccepted: "Quote accepted!",
    proceedToOrder: "You can now proceed to place your order.",
    orderSummary: "Order Summary",
    itemsCount: "items",
    deliveryInfo: "Delivery info",
    acceptedPayments: "Accepted payments",
    yourDetails: "Your details",
    specialRequests: "Any special requests...",
    saveInfoFaster: "Save my info for faster checkout",
    usingSavedInfo: "Using your saved info",
    saveYourInfo: "Save your info?",
    speedUpPurchase: "Speed up your next purchase",
    rememberDays: "We'll remember your details for 120 days so you can checkout faster next time.",
    noThanks: "No thanks",
    saveMyInfo: "Save my info",
    orderReceived: "Order received!",
    uploadPaymentProof: "Upload your payment proof below, or the seller will contact you.",
    paymentComplete: "Payment complete",
    awaitingPaymentStatus: "Awaiting payment",
    acceptQuote: "Accept Quote",
    accepting: "Accepting...",
    
    // Chat Widget
    support: "Support",
    instantReplies: "Instant replies 24/7",
    chatGreeting: "Hello!",
    howCanIHelp: "How can I help you today?",
    typeQuestion: "Type your question...",
    typing: "Typing...",
    openChat: "Open support chat",
    closeChat: "Close chat",
    
    // Business Advisor
    businessAdvisor: "Business Advisor",
    aiInsights: "AI-powered insights for your business",
    yourAiAdvisor: "Your AI Business Advisor",
    advisorIntro: "I have access to your products, orders, and customers. Ask me anything about growing your revenue!",
    quickQuestions: "Quick questions",
    analyzingData: "Analyzing your data...",
    speak: "Speak",
    stop: "Stop",
    listening: "Listening...",
    speaking: "Speaking...",
    askAboutBusiness: "Ask about your business...",
  },
  es: {
    goodMorning: "Buenos días",
    goodAfternoon: "Buenas tardes",
    goodEvening: "Buenas noches",
    
    dashboard: "Inicio",
    storefronts: "Tiendas",
    products: "Productos",
    orderHistory: "Historial",
    suggestions: "Sugerencias",
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
    
    storefrontsTitle: "Tiendas",
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
    
    welcomeBack: "Bienvenido",
    createAccount: "Crea tu cuenta",
    signIn: "Iniciar sesión",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetPassword: "Restablecer contraseña",
    sendResetLink: "Enviar enlace",
    enterEmailForReset: "Ingresa tu email y te enviaremos un enlace para restablecer",
    checkEmail: "Revisa tu email",
    resetLinkSent: "Enviamos un enlace de restablecimiento a",
    backToSignIn: "Volver a iniciar sesión",
    noAccount: "¿No tienes cuenta? Crea una",
    alreadyHaveAccount: "¿Ya tienes cuenta? Inicia sesión",
    email: "Email",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    newPassword: "Nueva contraseña",
    setNewPassword: "Establecer nueva contraseña",
    enterNewPassword: "Ingresa tu nueva contraseña abajo",
    passwordUpdated: "Contraseña actualizada",
    passwordResetSuccess: "Tu contraseña ha sido restablecida exitosamente",
    goToDashboard: "Ir al dashboard",
    invalidResetLink: "Enlace inválido o expirado",
    linkExpired: "Este enlace ya no es válido. Por favor solicita uno nuevo.",
    
    // Storefront Wizard
    whatTypeOfOrder: "¿Qué tipo de pedido?",
    chooseHowToSell: "Elige cómo quieres vender",
    singleItem: "Artículo único",
    oneProductOrService: "Un producto o servicio",
    bundle: "Paquete",
    multipleItemsTogether: "Varios artículos juntos",
    continueBtn: "Continuar",
    createYourBundle: "Crea tu paquete",
    addItemsToPackage: "Agrega artículos a tu paquete",
    bundleName: "Nombre del paquete",
    whatAreYouSelling: "¿Qué estás vendiendo?",
    pickFromCatalog: "Elige del catálogo o ingresa manualmente",
    fromCatalog: "Del catálogo",
    manualEntry: "Manual",
    title: "Título",
    aiSuggest: "Sugerir con IA",
    price: "Precio",
    quantity: "Cantidad",
    description: "Descripción",
    addPhoto: "Agregar foto",
    changePhoto: "Cambiar",
    reviewOrder: "Revisa tu pedido",
    readyToCreate: "Listo para crear",
    invoice: "Factura",
    quote: "Cotización",
    saveAsDraft: "Guardar borrador",
    createAndShare: "Crear y compartir",
    creating: "Creando...",
    back: "Volver",
    
    // Share Dialog
    shareYourStorefront: "Comparte tu vitrina",
    quickShare: "Compartir rápido",
    copied: "¡Copiado!",
    showQrCode: "Mostrar código QR",
    backToShareOptions: "Volver a opciones",
    share: "Compartir",
    qr: "QR",
    done: "Listo",
    scanToViewOrder: "Escanea para ver y ordenar",
    
    // Storefront Card
    for: "Para",
    qty: "Cant",
    viewProof: "Ver comprobante",
    paymentProof: "Comprobante de Pago",
    from: "De",
    close: "Cerrar",
    verifyMarkPaid: "Verificar y Marcar Pagado",
    reorder: "Reordenar",
    showQr: "Mostrar código QR",
    preparing: "Preparando",
    ready: "Listo",
    complete: "Completado",
    
    // Bundle Items
    item: "Artículo",
    itemName: "Nombre del artículo",
    addAnotherItem: "Agregar otro artículo",
    bundleTotal: "Total del paquete",
    
    // Product Selector
    noProductsInCatalog: "Sin productos en catálogo",
    addProductsFirst: "Agrega productos primero o ingresa detalles manualmente",
    
    // Products Page
    newProduct: "Nuevo Producto",
    editProduct: "Editar Producto",
    noProductsYet: "Sin productos aún",
    buildCatalogOnce: "Crea tu catálogo una vez, reutilízalo en todas tus vitrinas.",
    createProduct: "Crear producto",
    aiGeneratesDesc: "La IA genera descripciones por ti",
    addImagesForSales: "Añade imágenes para mejores ventas",
    organizeByCategories: "Organiza por categorías",
    productName: "Nombre del producto",
    category: "Categoría",
    selectCategory: "Seleccionar categoría",
    food: "Comida",
    drinks: "Bebidas",
    clothing: "Ropa",
    accessories: "Accesorios",
    services: "Servicios",
    digital: "Digital",
    other: "Otro",
    uploadImage: "Subir imagen",
    active: "Activo",
    generateDesc: "Generar",
    saveChanges: "Guardar cambios",
    
    // Admin Page
    saveAllChanges: "Guardar todos los cambios",
    instagram: "Instagram",
    city: "Ciudad",
    address: "Dirección",
    gettingLocation: "Obteniendo ubicación...",
    integrations: "Integraciones",
    
    // Public Pages
    sendMessage: "Enviar Mensaje",
    sending: "Enviando...",
    orderNow: "Ordenar Ahora",
    orderDetails: "Detalles del Pedido",
    yourName: "Tu nombre",
    yourPhone: "Tu teléfono",
    noteOptional: "Nota (opcional)",
    placeOrder: "Hacer Pedido",
    placingOrder: "Procesando pedido...",
    orderPlaced: "¡Pedido Realizado!",
    orderPlacedDesc: "El vendedor te contactará pronto.",
    backToStore: "Volver a la tienda",
    
    // Empty States
    noOrdersYet: "Sin pedidos aún",
    ordersAppearHere: "Los pedidos aparecerán aquí",
    
    // Misc
    total: "Total",
    optional: "opcional",
    viewAll: "Ver todo",
    seeAll: "Ver todo",
    linkCopied: "¡Enlace copiado!",
    error: "Error",
    success: "Éxito",
    confirm: "Confirmar",
    
    // Fulfillment
    fulfillmentPending: "Pendiente",
    fulfillmentPreparing: "Preparando",
    fulfillmentReady: "Listo",
    fulfillmentComplete: "Completado",
    
    // Admin Page Extended
    profileQrCode: "Código QR del Perfil",
    scanToVisit: "Escanea para visitar tu perfil",
    profileUsername: "Nombre de usuario",
    onlinePayments: "Pagos en línea",
    localPayments: "Pagos locales",
    acceptCardsWorldwide: "Acepta tarjetas mundialmente",
    mobilePayments: "Pagos móviles Banco General",
    inPersonPayments: "Pagos en persona",
    employeeBenefitCards: "Tarjetas de beneficios",
    
    // Public Profile
    notFound: "No encontrado",
    profileNotFoundDesc: "Este perfil no existe o fue eliminado.",
    contact: "Contactar",
    verifiedSeller: "Vendedor Verificado",
    trusted: "Confiable",
    highRepeat: "Alta Repetición",
    availableNow: "Disponible Ahora",
    accepts: "Acepta",
    links: "Enlaces",
    poweredBy: "Powered by Kitz • Comparte tu enlace para crecer",
    contactBusiness: "Contactar",
    sendInquiry: "Enviar mensaje o consulta",
    yourMessage: "Mensaje",
    messagePlaceholder: "¡Hola! Me interesa...",
    rememberMe: "Recordarme para contacto más rápido",
    messageSent: "¡Mensaje Enviado!",
    willGetBack: "te responderá pronto.",
    
    // Public Storefront
    storefrontNotFound: "Vitrina no encontrada",
    storefrontNotFoundDesc: "Este enlace puede haber expirado o no existe.",
    goHome: "Ir al inicio",
    thisIsQuote: "Esta es una cotización",
    reviewQuote: "Revisa los detalles y acepta esta cotización para proceder con tu pedido.",
    quoteAccepted: "¡Cotización aceptada!",
    proceedToOrder: "Ahora puedes proceder a hacer tu pedido.",
    orderSummary: "Resumen del Pedido",
    itemsCount: "artículos",
    deliveryInfo: "Info de entrega",
    acceptedPayments: "Pagos aceptados",
    yourDetails: "Tus datos",
    specialRequests: "Alguna solicitud especial...",
    saveInfoFaster: "Guardar mis datos para checkout más rápido",
    usingSavedInfo: "Usando tus datos guardados",
    saveYourInfo: "¿Guardar tus datos?",
    speedUpPurchase: "Acelera tu próxima compra",
    rememberDays: "Recordaremos tus datos por 120 días para que tu próximo checkout sea más rápido.",
    noThanks: "No, gracias",
    saveMyInfo: "Guardar mis datos",
    orderReceived: "¡Pedido recibido!",
    uploadPaymentProof: "Sube tu comprobante de pago abajo, o el vendedor te contactará.",
    paymentComplete: "Pago completado",
    awaitingPaymentStatus: "Esperando pago",
    acceptQuote: "Aceptar Cotización",
    accepting: "Aceptando...",
    
    // Chat Widget
    support: "Soporte",
    instantReplies: "Respuestas instantáneas 24/7",
    chatGreeting: "¡Hola!",
    howCanIHelp: "¿En qué puedo ayudarte hoy?",
    typeQuestion: "Escribe tu pregunta...",
    typing: "Escribiendo...",
    openChat: "Abrir chat de soporte",
    closeChat: "Cerrar chat",
    
    // Business Advisor
    businessAdvisor: "Asesor de Negocios",
    aiInsights: "Insights de IA para tu negocio",
    yourAiAdvisor: "Tu Asesor de IA",
    advisorIntro: "Tengo acceso a tus productos, pedidos y clientes. ¡Pregúntame cómo aumentar tus ingresos!",
    quickQuestions: "Preguntas rápidas",
    analyzingData: "Analizando tus datos...",
    speak: "Hablar",
    stop: "Parar",
    listening: "Escuchando...",
    speaking: "Hablando...",
    askAboutBusiness: "Pregunta sobre tu negocio...",
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
