// Configuration API centralisée pour le frontend
// Ce fichier doit être importé par tous les autres composants qui font des appels API

// URL de base du backend - récupérée depuis les variables d'environnement
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://elsa-gestion-backend-wf4l.onrender.com";

// URLs complètes pour les endpoints principaux
export const API_ENDPOINTS = {
  // Authentification
  LOGIN: `${API_BASE_URL}/api/login`,

  // Produits
  PRODUCTS: `${API_BASE_URL}/api/produits`,

  // Commandes
  ORDERS: `${API_BASE_URL}/api/orders`,

  // Utilisateurs
  USERS: `${API_BASE_URL}/api/users`,

  // Magasins/Warehouses
  WAREHOUSES: `${API_BASE_URL}/api/warehouses`,

  // Catégories
  CATEGORIES: `${API_BASE_URL}/api/categories`,

  // Taxes
  TAXES: `${API_BASE_URL}/api/taxes`,

  // Paiements
  PAYMENTS: `${API_BASE_URL}/api/payments`,

  // Entreprises
  COMPANIES: `${API_BASE_URL}/api/companies`,

  // Modes de paiement
  PAYMENT_MODES: `${API_BASE_URL}/api/payment-modes`,

  // Marques
  BRANDS: `${API_BASE_URL}/api/brands`,

  // Unités
  UNITS: `${API_BASE_URL}/api/units`,

  // Dépenses
  EXPENSES: `${API_BASE_URL}/api/expenses`,

  // Production
  PRODUCTION: `${API_BASE_URL}/api/production`,

  // Uploads/Images
  UPLOADS: {
    PRODUCTS: `${API_BASE_URL}/uploads/image_produits`,
    WAREHOUSES: `${API_BASE_URL}/uploads/warehouses`,
    CATEGORIES: `${API_BASE_URL}/uploads/category_images`,
    LOGOS: `${API_BASE_URL}/uploads/logos`,
    PROFILES: `${API_BASE_URL}/uploads/profiles`,
  },
};

// Configuration par défaut pour axios
export const DEFAULT_AXIOS_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Fonction utilitaire pour construire des URLs avec paramètres
export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  const queryParams = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
};
