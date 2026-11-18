/**
 * Central Application Configuration
 * MoversGo Tunisie - Plateforme Marketplace Professionnelle de Déménagement
 */

export const APP_CONFIG = {
  name: "MoversGo",
  country: "Tunisie",
  currency: "DT",
  currencyFullName: "Dinar Tunisien",
  legalName: "MoversGo Technologies SARL (Tunisie)",
  taxId: "1748293/A/M/000", // Matricule Fiscal Tunisien
  rneNumber: "B0145892023", // Registre National des Entreprises
  tagline: "La 1ère plateforme de déménagement professionnel en Tunisie",
  description: "Mise en relation directe entre particuliers et sociétés de déménagement certifiées en Tunisie. Comparez vos devis gratuitement sur le Grand Tunis, Sousse, Sfax et tout le territoire.",
  version: "2.0.0",
  contact: {
    email: "contact@moversgo.tn",
    supportEmail: "support@moversgo.tn",
    phone: "+216 71 889 400",
    mobilePhone: "+216 98 450 320",
    address: "Immeuble Matrix, Rue du Lac Malaren, Les Berges du Lac 2, 1053 Tunis, Tunisie",
    workingHours: "Lun - Sam : 08h00 - 19h00"
  },
  socials: {
    linkedin: "https://linkedin.com/company/moversgo-tn",
    facebook: "https://facebook.com/moversgo.tn",
    instagram: "https://instagram.com/moversgo.tn"
  },
  governorates: [
    "Tunis", "Ariana", "Ben Arous", "Manouba",
    "Nabeul (Hammamet)", "Sousse", "Monastir", "Sfax",
    "Bizerte", "Mahdia", "Gabès", "Médenine (Djerba)",
    "Kairouan", "Gafsa", "Béja", "Jendouba",
    "Kasserine", "Sidi Bouzid", "Siliana", "Kef",
    "Tozeur", "Kebili", "Tataouine", "Zaghouan"
  ],
  governorateCoordinates: {
    "Tunis": { lat: 36.8065, lng: 10.1815 },
    "Ariana": { lat: 36.8665, lng: 10.1647 },
    "Ben Arous": { lat: 36.7533, lng: 10.2289 },
    "Manouba": { lat: 36.8080, lng: 10.0972 },
    "Nabeul (Hammamet)": { lat: 36.4561, lng: 10.7376 },
    "Nabeul": { lat: 36.4561, lng: 10.7376 },
    "Sousse": { lat: 35.8256, lng: 10.6369 },
    "Monastir": { lat: 35.7779, lng: 10.8261 },
    "Mahdia": { lat: 35.5047, lng: 11.0622 },
    "Sfax": { lat: 34.7406, lng: 10.7603 },
    "Bizerte": { lat: 37.2744, lng: 9.8739 },
    "Gabès": { lat: 33.8815, lng: 10.0982 },
    "Médenine (Djerba)": { lat: 33.3549, lng: 10.5055 },
    "Médenine": { lat: 33.3549, lng: 10.5055 },
    "Kairouan": { lat: 35.6781, lng: 10.0963 },
    "Gafsa": { lat: 34.4250, lng: 8.7842 },
    "Béja": { lat: 36.7256, lng: 9.1817 },
    "Jendouba": { lat: 36.5011, lng: 8.7802 },
    "Kasserine": { lat: 35.1676, lng: 8.8365 },
    "Sidi Bouzid": { lat: 35.0382, lng: 9.4849 },
    "Siliana": { lat: 36.0850, lng: 9.3708 },
    "Kef": { lat: 36.1742, lng: 8.7049 },
    "Tozeur": { lat: 33.9197, lng: 8.1335 },
    "Kebili": { lat: 33.7050, lng: 8.9715 },
    "Tataouine": { lat: 32.9297, lng: 10.4518 },
    "Zaghouan": { lat: 36.4029, lng: 10.1429 },
  },
  roles: {
    CLIENT: "client",
    COMPANY: "company",
    ADMIN: "admin"
  },
  routes: {
    public: {
      home: "/",
      howItWorks: "/how-it-works",
      companies: "/companies",
      companyDetail: (id = ":id") => `/companies/${id}`,
      pricing: "/pricing",
      faq: "/faq",
      contact: "/contact",
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    },
    auth: {
      login: "/login",
      register: "/register",
      registerClient: "/register/client",
      registerCompany: "/register/company",
      forgotPassword: "/forgot-password",
      resetPassword: "/reset-password",
      verifyEmail: "/verify-email",
    },
    client: {
      dashboard: "/client/dashboard",
      requests: "/client/requests",
      newRequest: "/client/requests/new",
      requestDetail: (id = ":id") => `/client/requests/${id}`,
      editRequest: (id = ":id") => `/client/requests/${id}/edit`,
      quotes: "/client/quotes",
      quoteDetail: (id = ":id") => `/client/quotes/${id}`,
      compare: "/client/compare",
      bookings: "/client/bookings",
      bookingDetail: (id = ":id") => `/client/bookings/${id}`,
      messages: "/client/messages",
      messageDetail: (id = ":id") => `/client/messages/${id}`,
      payments: "/client/payments",
      paymentDetail: (id = ":id") => `/client/payments/${id}`,
      reviews: "/client/reviews",
      newReview: "/client/reviews/new",
      notifications: "/client/notifications",
      profile: "/client/profile",
      settings: "/client/settings",
    },
    company: {
      dashboard: "/company/dashboard",
      requests: "/company/requests",
      requestDetail: (id = ":id") => `/company/requests/${id}`,
      quotes: "/company/quotes",
      newQuote: (requestId = ":requestId") => `/company/quotes/new/${requestId}`,
      quoteDetail: (id = ":id") => `/company/quotes/${id}`,
      editQuote: (id = ":id") => `/company/quotes/${id}/edit`,
      bookings: "/company/bookings",
      bookingDetail: (id = ":id") => `/company/bookings/${id}`,
      calendar: "/company/calendar",
      messages: "/company/messages",
      messageDetail: (id = ":id") => `/company/messages/${id}`,
      reviews: "/company/reviews",
      documents: "/company/documents",
      statistics: "/company/statistics",
      notifications: "/company/notifications",
      profile: "/company/profile",
      settings: "/company/settings",
    },
    admin: {
      dashboard: "/admin/dashboard",
      users: "/admin/users",
      userDetail: (id = ":id") => `/admin/users/${id}`,
      companies: "/admin/companies",
      companyDetail: (id = ":id") => `/admin/companies/${id}`,
      pendingCompanies: "/admin/companies/pending",
      requests: "/admin/requests",
      requestDetail: (id = ":id") => `/admin/requests/${id}`,
      quotes: "/admin/quotes",
      bookings: "/admin/bookings",
      payments: "/admin/payments",
      transactions: "/admin/transactions",
      reviews: "/admin/reviews",
      reviewsModeration: "/admin/reviews/moderation",
      categories: "/admin/categories",
      content: "/admin/content",
      faq: "/admin/faq",
      reports: "/admin/reports",
      analytics: "/admin/analytics",
      support: "/admin/support",
      supportDetail: (id = ":id") => `/admin/support/${id}`,
      notifications: "/admin/notifications",
      settings: "/admin/settings",
    }
  },
  statusConfigs: {
    // Request statuses
    pending: { label: "En attente de devis", color: "amber", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    quoted: { label: "Devis reçus", color: "blue", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    booked: { label: "Réservé & Confirmé", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    in_progress: { label: "Tournée en cours", color: "indigo", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    completed: { label: "Livré & Terminé", color: "green", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    cancelled: { label: "Annulé", color: "rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },

    // Quote statuses
    submitted: { label: "Devis transmis", color: "blue", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    accepted: { label: "Offre retenue", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    rejected: { label: "Décliné", color: "gray", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
    expired: { label: "Délai expiré", color: "rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },

    // Company verification
    verified: { label: "Certifié & Agréé RNE", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    under_review: { label: "Dossier en audit", color: "amber", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    rejected_company: { label: "Dossier non validé", color: "rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    suspended: { label: "Compte suspendu", color: "rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },

    // Payment statuses
    paid: { label: "Acompte réglé", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    refunded: { label: "Remboursé", color: "purple", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    failed: { label: "Paiement rejeté", color: "rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  }
};

/**
 * Returns default GPS coordinates for a Tunisian governorate
 */
export function getCoordinatesForGovernorate(governorate) {
  if (!governorate) return APP_CONFIG.governorateCoordinates["Tunis"];
  const clean = governorate.trim();
  return APP_CONFIG.governorateCoordinates[clean] || APP_CONFIG.governorateCoordinates["Tunis"];
}

/**
 * HTML5 Geolocation Promise wrapper
 */
export function getCurrentGpsLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas supportée par votre navigateur."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = "Impossible d'obtenir votre position GPS.";
        if (err.code === 1) msg = "Autorisation de géolocalisation refusée par l'utilisateur.";
        else if (err.code === 2) msg = "Position GPS indisponible.";
        else if (err.code === 3) msg = "Délai d'attente GPS dépassé.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

