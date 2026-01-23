import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "es" | "pt";

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
  
  // 4DX Methodology
  fourDxTitle: string;
  wig: string;
  wigFull: string;
  leadMeasures: string;
  scoreboard: string;
  cadence: string;
  setYourWig: string;
  weeklyGoal: string;
  dailyGoal: string;
  monthlyGoal: string;
  revenue: string;
  newOrders: string;
  newCustomers: string;
  target: string;
  current: string;
  storefrontsCreated: string;
  followupsCompleted: string;
  ofTarget: string;
  onTrack: string;
  behindPace: string;
  aheadOfPace: string;
  weeklyReview: string;
  daily: string;
  weekly: string;
  monthly: string;
  period: string;
  predictLeadMeasures: string;
  activitiesThatDriveResults: string;
  
  // 4DX Cadence
  weeklyCommitments: string;
  thisWeeksCommitments: string;
  whatWillYouCommit: string;
  addCommitment: string;
  noCommitmentsYet: string;
  commitToActions: string;
  completedOf: string;
  markComplete: string;
  weekOf: string;
  newWeekPrompt: string;
  reviewLastWeek: string;
  lastWeekResults: string;
  commitmentPlaceholder: string;
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
    
    // Goal Methodology
    fourDxTitle: "Goals & Targets",
    wig: "Main Goal",
    wigFull: "Your Most Important Goal",
    leadMeasures: "Key Activities",
    scoreboard: "Scoreboard",
    cadence: "Weekly Rhythm",
    setYourWig: "Set your goal",
    weeklyGoal: "Weekly goal",
    dailyGoal: "Daily goal",
    monthlyGoal: "Monthly goal",
    revenue: "Revenue",
    newOrders: "Orders",
    newCustomers: "Customers",
    target: "Target",
    current: "Current",
    storefrontsCreated: "Storefronts created",
    followupsCompleted: "Follow-ups completed",
    ofTarget: "of target",
    onTrack: "On track",
    behindPace: "Behind pace",
    aheadOfPace: "Ahead of pace",
    weeklyReview: "Weekly review",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    period: "Period",
    predictLeadMeasures: "Predictive activities",
    activitiesThatDriveResults: "Activities that drive results",
    
    // 4DX Cadence
    weeklyCommitments: "Weekly Commitments",
    thisWeeksCommitments: "This week's commitments",
    whatWillYouCommit: "What will you commit to this week?",
    addCommitment: "Add commitment",
    noCommitmentsYet: "No commitments yet",
    commitToActions: "Commit to specific actions that drive your lead measures",
    completedOf: "completed",
    markComplete: "Mark complete",
    weekOf: "Week of",
    newWeekPrompt: "It's a new week! Set your commitments.",
    reviewLastWeek: "Review last week",
    lastWeekResults: "Last week's results",
    commitmentPlaceholder: "e.g., Create 3 storefronts for top products",
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
    
    // Goal Methodology
    fourDxTitle: "Metas y Objetivos",
    wig: "Meta Principal",
    wigFull: "Tu Meta Más Importante",
    leadMeasures: "Actividades Clave",
    scoreboard: "Marcador",
    cadence: "Ritmo Semanal",
    setYourWig: "Define tu meta",
    weeklyGoal: "Meta semanal",
    dailyGoal: "Meta diaria",
    monthlyGoal: "Meta mensual",
    revenue: "Ingresos",
    newOrders: "Pedidos",
    newCustomers: "Clientes",
    target: "Meta",
    current: "Actual",
    storefrontsCreated: "Vitrinas creadas",
    followupsCompleted: "Seguimientos completados",
    ofTarget: "de la meta",
    onTrack: "En camino",
    behindPace: "Por debajo",
    aheadOfPace: "Por encima",
    weeklyReview: "Revisión semanal",
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
    period: "Período",
    predictLeadMeasures: "Actividades predictivas",
    activitiesThatDriveResults: "Actividades que impulsan resultados",
    
    // 4DX Cadence
    weeklyCommitments: "Compromisos Semanales",
    thisWeeksCommitments: "Compromisos de esta semana",
    whatWillYouCommit: "¿A qué te comprometes esta semana?",
    addCommitment: "Agregar compromiso",
    noCommitmentsYet: "Sin compromisos aún",
    commitToActions: "Comprométete a acciones específicas que impulsen tus medidas",
    completedOf: "completados",
    markComplete: "Marcar completo",
    weekOf: "Semana del",
    newWeekPrompt: "¡Es una nueva semana! Define tus compromisos.",
    reviewLastWeek: "Revisar semana pasada",
    lastWeekResults: "Resultados de la semana pasada",
    commitmentPlaceholder: "ej., Crear 3 vitrinas para productos top",
  },
  pt: {
    goodMorning: "Bom dia",
    goodAfternoon: "Boa tarde",
    goodEvening: "Boa noite",
    
    dashboard: "Painel",
    storefronts: "Vitrines",
    products: "Produtos",
    orderHistory: "Histórico",
    suggestions: "Sugestões",
    admin: "Admin",
    home: "Início",
    orders: "Pedidos",
    more: "Mais",
    
    signOut: "Sair",
    lightMode: "Modo claro",
    darkMode: "Modo escuro",
    new: "Novo",
    send: "Enviar",
    sendNow: "Enviar agora",
    edit: "Editar",
    delete: "Excluir",
    cancel: "Cancelar",
    save: "Salvar",
    copyLink: "Copiar link",
    shareViaWhatsApp: "Compartilhar via WhatsApp",
    shareViaInstagram: "Compartilhar via Instagram",
    markAsPaid: "Marcar como pago",
    sendReminder: "Enviar lembrete",
    
    totalBalance: "Saldo Total",
    vsYesterday: "vs ontem",
    today: "Hoje",
    pending: "Pendente",
    drafts: "Rascunhos",
    completed: "Concluído",
    awaiting: "aguardando",
    toComplete: "para completar",
    allTime: "total",
    needsAttention: "Requer Atenção",
    items: "itens",
    allCaughtUp: "Tudo em dia",
    businessRunningSmooth: "Negócio funcionando bem",
    momentum: "Impulso",
    todaysEarnings: "Ganhos de Hoje",
    noPaymentsYet: "Nenhum pagamento hoje",
    earningsAppearHere: "Ganhos aparecerão aqui",
    startSelling: "Começar a vender",
    createFirstStorefront: "Crie sua primeira vitrine e compartilhe com clientes",
    createStorefront: "Criar vitrine",
    
    storefrontsTitle: "Vitrines",
    storefrontsDesc: "Um link por pedido. Compartilhe e receba.",
    noStorefrontsYet: "Nenhuma vitrine ainda",
    createFirstToStart: "Crie a primeira para começar a vender",
    all: "Todos",
    draft: "Rascunho",
    sent: "Enviado",
    paid: "Pago",
    ordered: "Pedido",
    completeStorefront: "Completar vitrine",
    readyToShare: "pronto para compartilhar",
    shareNow: "Compartilhar agora",
    awaitingPayment: "Aguardando pagamento",
    deleteStorefront: "Excluir vitrine?",
    deleteConfirm: "Isso excluirá permanentemente",
    
    orderHistoryTitle: "Histórico de Pedidos",
    orderHistoryDesc: "Memória do seu negócio — atualizada automaticamente.",
    noCustomersYet: "Nenhum cliente ainda",
    customersAppearAuto: "Clientes aparecem aqui automaticamente",
    searchCustomers: "Buscar clientes...",
    spent: "Gasto",
    
    adminTitle: "Admin",
    adminDesc: "Configure uma vez. Tudo funciona daqui.",
    brand: "Marca",
    businessLogo: "Logo do negócio",
    storefrontImage: "Imagem da vitrine",
    business: "Negócio",
    businessName: "Nome do negócio",
    businessType: "Tipo de negócio",
    taxId: "CNPJ",
    country: "País",
    contactPresence: "Contato & Presença",
    whatsappPhone: "WhatsApp / Telefone",
    website: "Website",
    payments: "Pagamentos",
    creditDebitCards: "Cartões de crédito/débito",
    cash: "Dinheiro",
    location: "Localização",
    getLocation: "Obter localização",
    saveSettings: "Salvar configurações",
    saving: "Salvando...",
    
    excellent: "Excelente",
    goodProgress: "Bom progresso",
    buildingUp: "Crescendo",
    needsFocus: "Precisa de foco",
    low: "Baixo",
    high: "Alto",
    basedOnActivity: "Baseado em atividade e conversões",
    
    loading: "Carregando...",
    
    welcomeBack: "Bem-vindo de volta",
    createAccount: "Crie sua conta",
    signIn: "Entrar",
    forgotPassword: "Esqueceu a senha?",
    resetPassword: "Redefinir senha",
    sendResetLink: "Enviar link",
    enterEmailForReset: "Digite seu email e enviaremos um link",
    checkEmail: "Verifique seu email",
    resetLinkSent: "Enviamos um link de redefinição para",
    backToSignIn: "Voltar para login",
    noAccount: "Não tem conta? Crie uma",
    alreadyHaveAccount: "Já tem conta? Entre",
    email: "Email",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    newPassword: "Nova senha",
    setNewPassword: "Definir nova senha",
    enterNewPassword: "Digite sua nova senha abaixo",
    passwordUpdated: "Senha atualizada",
    passwordResetSuccess: "Sua senha foi redefinida com sucesso",
    goToDashboard: "Ir para o painel",
    invalidResetLink: "Link inválido ou expirado",
    linkExpired: "Este link não é mais válido. Solicite um novo.",
    
    whatTypeOfOrder: "Que tipo de pedido?",
    chooseHowToSell: "Escolha como vender",
    singleItem: "Item único",
    oneProductOrService: "Um produto ou serviço",
    bundle: "Pacote",
    multipleItemsTogether: "Vários itens juntos",
    continueBtn: "Continuar",
    createYourBundle: "Crie seu pacote",
    addItemsToPackage: "Adicione itens ao pacote",
    bundleName: "Nome do pacote",
    whatAreYouSelling: "O que você está vendendo?",
    pickFromCatalog: "Escolha do catálogo ou digite",
    fromCatalog: "Do catálogo",
    manualEntry: "Digitar",
    title: "Título",
    aiSuggest: "Sugestão IA",
    price: "Preço",
    quantity: "Quantidade",
    description: "Descrição",
    addPhoto: "Adicionar foto",
    changePhoto: "Alterar",
    reviewOrder: "Revisar pedido",
    readyToCreate: "Pronto para criar",
    invoice: "Fatura",
    quote: "Orçamento",
    saveAsDraft: "Salvar rascunho",
    createAndShare: "Criar e Compartilhar",
    creating: "Criando...",
    back: "Voltar",
    
    shareYourStorefront: "Compartilhar vitrine",
    quickShare: "Compartilhamento rápido",
    copied: "Copiado!",
    showQrCode: "Mostrar QR Code",
    backToShareOptions: "Voltar às opções",
    share: "Compartilhar",
    qr: "QR",
    done: "Feito",
    scanToViewOrder: "Escaneie para ver e pedir",
    
    for: "Para",
    qty: "Qtd",
    viewProof: "Ver comprovante",
    paymentProof: "Comprovante de Pagamento",
    from: "De",
    close: "Fechar",
    verifyMarkPaid: "Verificar e Marcar Pago",
    reorder: "Repetir pedido",
    showQr: "Mostrar QR code",
    preparing: "Preparando",
    ready: "Pronto",
    complete: "Concluído",
    
    item: "Item",
    itemName: "Nome do item",
    addAnotherItem: "Adicionar outro item",
    bundleTotal: "Total do pacote",
    
    noProductsInCatalog: "Nenhum produto no catálogo",
    addProductsFirst: "Adicione produtos primeiro ou digite manualmente",
    
    newProduct: "Novo Produto",
    editProduct: "Editar Produto",
    noProductsYet: "Nenhum produto ainda",
    buildCatalogOnce: "Monte seu catálogo uma vez, reutilize em todas as vitrines.",
    createProduct: "Criar produto",
    aiGeneratesDesc: "IA gera descrições para você",
    addImagesForSales: "Adicione imagens para melhores vendas",
    organizeByCategories: "Organize por categorias",
    productName: "Nome do produto",
    category: "Categoria",
    selectCategory: "Selecionar categoria",
    food: "Alimentos",
    drinks: "Bebidas",
    clothing: "Roupas",
    accessories: "Acessórios",
    services: "Serviços",
    digital: "Digital",
    other: "Outro",
    uploadImage: "Enviar imagem",
    active: "Ativo",
    generateDesc: "Gerar",
    saveChanges: "Salvar alterações",
    
    saveAllChanges: "Salvar todas as alterações",
    instagram: "Instagram",
    city: "Cidade",
    address: "Endereço",
    gettingLocation: "Obtendo localização...",
    integrations: "Integrações",
    
    sendMessage: "Enviar Mensagem",
    sending: "Enviando...",
    orderNow: "Pedir Agora",
    orderDetails: "Detalhes do Pedido",
    yourName: "Seu nome",
    yourPhone: "Seu telefone",
    noteOptional: "Observação (opcional)",
    placeOrder: "Fazer Pedido",
    placingOrder: "Fazendo pedido...",
    orderPlaced: "Pedido Feito!",
    orderPlacedDesc: "O vendedor entrará em contato em breve.",
    backToStore: "Voltar à loja",
    
    noOrdersYet: "Nenhum pedido ainda",
    ordersAppearHere: "Pedidos aparecerão aqui",
    
    total: "Total",
    optional: "opcional",
    viewAll: "Ver todos",
    seeAll: "Ver todos",
    linkCopied: "Link copiado!",
    error: "Erro",
    success: "Sucesso",
    confirm: "Confirmar",
    
    fulfillmentPending: "Pendente",
    fulfillmentPreparing: "Preparando",
    fulfillmentReady: "Pronto",
    fulfillmentComplete: "Concluído",
    
    profileQrCode: "QR Code do Perfil",
    scanToVisit: "Escaneie para visitar seu perfil",
    profileUsername: "Nome de usuário",
    onlinePayments: "Pagamentos online",
    localPayments: "Pagamentos locais",
    acceptCardsWorldwide: "Aceite cartões mundialmente",
    mobilePayments: "Pagamentos mobile",
    inPersonPayments: "Pagamentos presenciais",
    employeeBenefitCards: "Cartões de benefícios",
    
    notFound: "Não encontrado",
    profileNotFoundDesc: "Este perfil não existe ou foi removido.",
    contact: "Contato",
    verifiedSeller: "Vendedor Verificado",
    trusted: "Confiável",
    highRepeat: "Alta Recorrência",
    availableNow: "Disponível Agora",
    accepts: "Aceita",
    links: "Links",
    poweredBy: "Desenvolvido por Kitz • Compartilhe seu link",
    contactBusiness: "Contato",
    sendInquiry: "Envie uma mensagem",
    yourMessage: "Mensagem",
    messagePlaceholder: "Olá! Tenho interesse em...",
    rememberMe: "Lembrar para contatos futuros",
    messageSent: "Mensagem Enviada!",
    willGetBack: "entrará em contato em breve.",
    
    storefrontNotFound: "Vitrine não encontrada",
    storefrontNotFoundDesc: "Este link pode ter expirado ou não existe.",
    goHome: "Ir para início",
    thisIsQuote: "Este é um orçamento",
    reviewQuote: "Revise os detalhes e aceite para fazer o pedido.",
    quoteAccepted: "Orçamento aceito!",
    proceedToOrder: "Agora você pode fazer o pedido.",
    orderSummary: "Resumo do Pedido",
    itemsCount: "itens",
    deliveryInfo: "Info de entrega",
    acceptedPayments: "Pagamentos aceitos",
    yourDetails: "Seus dados",
    specialRequests: "Pedidos especiais...",
    saveInfoFaster: "Salvar meus dados para checkout rápido",
    usingSavedInfo: "Usando seus dados salvos",
    saveYourInfo: "Salvar seus dados?",
    speedUpPurchase: "Acelere sua próxima compra",
    rememberDays: "Lembraremos seus dados por 120 dias para checkout mais rápido.",
    noThanks: "Não, obrigado",
    saveMyInfo: "Salvar meus dados",
    orderReceived: "Pedido recebido!",
    uploadPaymentProof: "Envie seu comprovante abaixo, ou o vendedor entrará em contato.",
    paymentComplete: "Pagamento concluído",
    awaitingPaymentStatus: "Aguardando pagamento",
    acceptQuote: "Aceitar Orçamento",
    accepting: "Aceitando...",
    
    support: "Suporte",
    instantReplies: "Respostas instantâneas 24/7",
    chatGreeting: "Olá!",
    howCanIHelp: "Como posso ajudar você hoje?",
    typeQuestion: "Digite sua pergunta...",
    typing: "Digitando...",
    openChat: "Abrir chat de suporte",
    closeChat: "Fechar chat",
    
    businessAdvisor: "Consultor de Negócios",
    aiInsights: "Insights de IA para seu negócio",
    yourAiAdvisor: "Seu Consultor de IA",
    advisorIntro: "Tenho acesso aos seus produtos, pedidos e clientes. Pergunte-me como aumentar sua receita!",
    quickQuestions: "Perguntas rápidas",
    analyzingData: "Analisando seus dados...",
    speak: "Falar",
    stop: "Parar",
    listening: "Ouvindo...",
    speaking: "Falando...",
    askAboutBusiness: "Pergunte sobre seu negócio...",
    
    fourDxTitle: "Metas e Objetivos",
    wig: "Meta Principal",
    wigFull: "Sua Meta Mais Importante",
    leadMeasures: "Atividades Chave",
    scoreboard: "Placar",
    cadence: "Ritmo Semanal",
    setYourWig: "Defina sua meta",
    weeklyGoal: "Meta semanal",
    dailyGoal: "Meta diária",
    monthlyGoal: "Meta mensal",
    revenue: "Receita",
    newOrders: "Pedidos",
    newCustomers: "Clientes",
    target: "Meta",
    current: "Atual",
    storefrontsCreated: "Vitrines criadas",
    followupsCompleted: "Acompanhamentos concluídos",
    ofTarget: "da meta",
    onTrack: "No caminho",
    behindPace: "Atrás",
    aheadOfPace: "À frente",
    weeklyReview: "Revisão semanal",
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
    period: "Período",
    predictLeadMeasures: "Atividades preditivas",
    activitiesThatDriveResults: "Atividades que geram resultados",
    
    weeklyCommitments: "Compromissos Semanais",
    thisWeeksCommitments: "Compromissos desta semana",
    whatWillYouCommit: "Com o que você se compromete esta semana?",
    addCommitment: "Adicionar compromisso",
    noCommitmentsYet: "Nenhum compromisso ainda",
    commitToActions: "Comprometa-se com ações específicas",
    completedOf: "concluídos",
    markComplete: "Marcar concluído",
    weekOf: "Semana de",
    newWeekPrompt: "É uma nova semana! Defina seus compromissos.",
    reviewLastWeek: "Revisar semana passada",
    lastWeekResults: "Resultados da semana passada",
    commitmentPlaceholder: "ex., Criar 3 vitrines para produtos top",
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
    if (saved) return saved as Language;
    
    // Auto-detect from browser on first visit (calm default)
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("es")) return "es";
    if (browserLang.startsWith("pt")) return "pt";
    return "en";
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
