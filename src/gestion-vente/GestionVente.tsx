// src/gestion-vente/GestionVente.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
} from "react";
import {
  Layout,
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Modal,
  Form,
  InputNumber,
  Spin,
  message,
  Row,
  Col,
  Space,
  Statistic,
  Tag,
  Tabs,
  AutoComplete,
  Card,
  Checkbox,
} from "antd";
import type { TableProps, Breakpoint } from "antd"; // Corrected Breakpoint import
import {
  PlusOutlined,
  SearchOutlined,
  QrcodeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import BarcodeScanner from "./BarcodeScanner";
import ProductSearch from "./ProductSearch";
import { useTaxes } from "./useTaxes";
import { useSelection } from "../SelectionContext";
import { debounce } from "lodash";
import VenteDetailModal from "./components/VenteDetailModal";
import { InvoicePDF } from "./components/index";
import { generateInvoicePDF } from "./components/InvoicePDFGenerator";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { generateInvoiceHTML } from "./components/InvoiceHTMLTemplate";
// Import useAuth hook
import { useAuth } from "../context/AuthContext";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Remplaçons la définition du type AuthContextType par une version plus complète
interface AuthUser {
  id?: number | string;
  permissions?: string[];
  name?: string;
  email?: string;
  // Autres propriétés possibles...
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading?: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  hasPermission?: (permission: string) => boolean;
}

// Améliorons la fonction checkPermission pour qu'elle soit plus robuste
const checkPermission = (auth: any, permission: string): boolean => {
  // Vérifier si l'objet auth existe
  if (!auth) {
    console.warn(
      `Permission check failed: Auth context not available for: ${permission}`
    );
    return false;
  }

  // Ajouter des logs pour le débogage (à commenter en production)
  // console.debug(`Checking permission: ${permission}`);
  // console.debug(
  //   `Auth object structure:`,
  //   Object.keys(auth).length > 0 ? Object.keys(auth) : "Empty auth object"
  // );

  // Méthode 1: hasPermission est une méthode directement sur l'objet auth
  if (typeof auth.hasPermission === "function") {
    // console.debug(`Using auth.hasPermission method`);
    return auth.hasPermission(permission);
  }

  // Méthode 2: Si auth.user existe, vérifier s'il a une méthode hasPermission
  if (auth.user && typeof auth.user.hasPermission === "function") {
    // console.debug(`Using auth.user.hasPermission method`);
    return auth.user.hasPermission(permission);
  }

  // Méthode 3: Si auth.user.permissions est un tableau, vérifier directement
  if (
    auth.user &&
    auth.user.permissions &&
    Array.isArray(auth.user.permissions)
  ) {
    // console.debug(
    //   `Using auth.user.permissions array (${auth.user.permissions.length} permissions)`
    // );
    const hasPermission = auth.user.permissions.includes(permission);
    // console.debug(
    //   `Permission "${permission}" ${
    //     hasPermission ? "found" : "not found"
    //   } in user permissions`
    // );
    return hasPermission;
  }

  // Aucune des méthodes n'a fonctionné
  console.warn(
    `No valid permission checking mechanism found for: ${permission}`
  );
  return false;
};

const formatNumber = (value: number): string => {
  return Number(value).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

interface Product {
  id_produit: number;
  nom_produit: string;
  prix_vente: number;
  quantite_stock?: number;
  code_barre?: string;
}

interface ProduitVendu {
  produit_id: number;
  nom_produit: string;
  quantite: number;
  prix_unitaire_HT: number;
  remise?: number;
  taxe?: number | null;
  montant_taxe?: number;
  quantite_stock?: number;
  product_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_rate?: number;
  tax_id?: number;
  total_tax?: number;
  subtotal?: number;
  unit_id?: number;
}

interface VenteFormData {
  id?: number;
  Date_Facture: string;
  Statut_Vente: string;
  Client_ID: string;
  produitsVendus: ProduitVendu[];
  remise_globale: number;
  termes_conditions?: string;
  remarques?: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface VentesState {
  ventes: any[];
  clients: any[];
  produits: Product[];
  taxes: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  searchTerm: string;
  dateRange: DateRange;
  selectedClient: any | null;
  showForm: boolean;
  formData: VenteFormData;
  showDeleted: boolean;
  activeTab: string;
  selectedVenteIds: number[];
  globalTotalRevenue: number; // Add global revenue state
  globalTotalPaid: number; // Add global paid amount state
}

type VentesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_VENTES"; payload: { ventes: any[]; total: number } }
  | { type: "DELETE_VENTE"; payload: number }
  | { type: "SET_CLIENTS"; payload: any[] }
  | { type: "SET_PRODUITS"; payload: Product[] }
  | { type: "SET_TAXES"; payload: any[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: DateRange }
  | { type: "SET_SELECTED_CLIENT"; payload: any }
  | { type: "TOGGLE_FORM"; payload: boolean }
  | { type: "SET_FORM_DATA"; payload: VenteFormData }
  | { type: "UPDATE_FORM_DATA"; payload: VenteFormData }
  | { type: "TOGGLE_SHOW_DELETED"; payload: boolean }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "SET_SELECTED_VENTE_IDS"; payload: number[] }
  | { type: "ADD_SELECTED_VENTE_ID"; payload: number }
  | { type: "REMOVE_SELECTED_VENTE_ID"; payload: number }
  | { type: "CLEAR_SELECTED_VENTE_IDS" }
  | {
      type: "UPDATE_VENTE_DETAIL";
      payload: { id: number; produitsVendus: ProduitVendu[] };
    }
  | { type: "SET_GLOBAL_TOTALS"; payload: { revenue: number; paid: number } }; // Add action for global totals

const sectionStyle = {
  border: "1px solid #ccc",
  padding: "16px",
  borderRadius: "4px",
  marginBottom: "16px",
};

const BASE_URL = "http://localhost:3000";

const api = {
  // --- Mise à jour de fetchVentes pour combiner tous les filtres ---
  async fetchVentes(params: any) {
    // Construction dynamique des paramètres de la requête
    const queryParams: any = {
      order_type: "sales", // Spécifier que nous voulons des ventes
      // Add default sorting
      sort_by: "order_date",
      order: "desc",
    };

    if (params.Numero_Facture)
      queryParams.invoice_number = params.Numero_Facture;
    if (params.user_id) queryParams.user_id = params.user_id; // Pour les ventes, user_id représente le client
    if (params.dateDebut) queryParams.dateDebut = params.dateDebut;
    if (params.dateFin) queryParams.dateFin = params.dateFin;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.warehouse) queryParams.warehouse = params.warehouse; // Ajouter le support du filtrage par magasin
    if (params.include_deleted)
      queryParams.include_deleted = params.include_deleted;
    if (params.payment_status)
      queryParams.payment_status = params.payment_status;

    console.log("Paramètres d'API pour les ventes:", queryParams);

    const qs = new URLSearchParams(queryParams).toString();
    try {
      const response = await fetch(`${BASE_URL}/api/orders?${qs}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(
          `${response.status} ${response.statusText}: ${errorText}`
        );
      }

      const data = await response.json();
      // console.log("Réponse API des ventes:", data);

      if (!data || (!data.orders && !Array.isArray(data))) {
        console.error("Format de réponse invalide:", data);
        throw new Error("Format de réponse invalide");
      }

      const ventesArray = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data)
        ? data
        : [];
      const total = data.total || ventesArray.length;

      return { data: ventesArray, total };
    } catch (error) {
      console.error("Erreur lors de la récupération des ventes:", error);
      throw error;
    }
  },
  async fetchClients() {
    try {
      const response = await fetch(`${BASE_URL}/api/users/customers`);
      if (!response.ok) {
        console.error(
          `Erreur lors de la récupération des clients: ${response.status}`
        );
        throw new Error(
          `Erreur lors de la récupération des clients: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Clients récupérés :", data);
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      throw error;
    }
  },
  async fetchProduits(params: any = {}) {
    // Construction dynamique des paramètres de la requête
    const queryParams: any = {};

    if (params.search) queryParams.search = params.search;
    if (params.limit) queryParams.limit = params.limit;
    if (params.page) queryParams.page = params.page;
    if (params.warehouse) {
      queryParams.warehouse = params.warehouse;
      console.log(`Filtrage des produits par magasin ID=${params.warehouse}`);
    }
    if (params.categorie) queryParams.categorie = params.categorie;

    console.log("Paramètres de recherche des produits:", queryParams);

    const queryString = new URLSearchParams(queryParams).toString();
    try {
      const response = await fetch(`${BASE_URL}/api/produits?${queryString}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(
          `Erreur lors de la récupération des produits: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Réponse brute de l'API produits:", data);

      // Vérifier la structure de la réponse
      let productsData = [];
      let total = 0;

      if (data && data.products && Array.isArray(data.products)) {
        productsData = data.products;
        total = data.total || productsData.length;
        console.log(
          "Format standard détecté: object avec propriété 'products'"
        );
      } else if (Array.isArray(data)) {
        productsData = data;
        total = data.length;
        console.log("Format alternatif détecté: array direct");
      } else if (typeof data === "object" && data !== null) {
        // Essayer de trouver une propriété qui pourrait contenir des produits
        const possibleArrayKeys = Object.keys(data).filter(
          (key) =>
            Array.isArray(data[key]) &&
            data[key].length > 0 &&
            typeof data[key][0] === "object"
        );

        if (possibleArrayKeys.length > 0) {
          const key = possibleArrayKeys[0];
          console.log(
            `Format alternatif détecté: object avec propriété '${key}'`
          );
          productsData = data[key];
          total = productsData.length;
        } else {
          console.warn(
            "Format inconnu de réponse, aucun tableau de produits trouvé"
          );
        }
      }

      // Ajouter des logs pour le débogage
      console.log(`${productsData.length} produits récupérés pour la requête`);

      if (productsData.length > 0) {
        console.log(
          "Exemple de structure de produit:",
          Object.keys(productsData[0]).join(", ")
        );
        console.log("Premier produit:", productsData[0]);
      }

      // Normaliser les produits au format attendu par l'application
      const normalizedProducts = productsData.map((item: any) => {
        return {
          id_produit: item.id_produit || item.id || item.product_id,
          nom_produit:
            item.nom_produit ||
            item.name ||
            item.product_name ||
            "Produit inconnu",
          prix_vente:
            typeof item.prix_vente === "number"
              ? item.prix_vente
              : typeof item.sales_price === "number"
              ? item.sales_price
              : typeof item.unit_price === "number"
              ? item.unit_price
              : 0,
          quantite_stock:
            typeof item.quantite_stock === "number"
              ? item.quantite_stock
              : typeof item.current_stock === "number"
              ? item.current_stock
              : typeof item.quantity === "number"
              ? item.quantity
              : typeof item.stock === "number"
              ? item.stock
              : undefined,
          code_barre: item.code_barre || item.barcode || item.item_code,
        };
      });

      console.log("Produits normalisés:", normalizedProducts.length);

      return { data: normalizedProducts, total };
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      throw error;
    }
  },
  async fetchTaxes() {
    const response = await fetch(`${BASE_URL}/api/taxes`);
    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération des taxes: ${response.status}`
      );
    }
    const data = await response.json();
    return data.taxes || [];
  },
  async createVente(data: any) {
    try {
      // Convertir les données au format attendu par l'API de commandes
      const orderData = {
        company_id: data.company_id || 1, // Utiliser la valeur de l'entreprise du contexte si disponible
        warehouse_id: data.warehouse_id,
        order_date: data.Date_Facture,
        order_type: "sales", // Spécifier que c'est une vente
        invoice_type: data.invoice_type || "standard",
        user_id: Number(data.Client_ID), // Forcer la conversion en nombre
        discount: data.remise_globale || 0,
        notes: data.remarques || "",
        terms_condition: data.termes_conditions || "",
        order_status: data.Statut_Vente || "Commandé",
        payment_status: data.payment_status || "Non payé",
        tax_amount: data.Montant_Taxe || 0,
        tax_rate: 0,
        shipping: 0,
        subtotal: data.Montant_Total_HT || 0, // CORRECTION: Utiliser le montant base HT (avant remise)
        total: data.Montant_TTC || 0,
        paid_amount: 0,
        due_amount: data.Montant_TTC || 0,
        total_items: data.produitsVendus?.length || 0,
        total_quantity:
          data.produitsVendus?.reduce(
            (sum: number, p: ProduitVendu) => sum + p.quantite,
            0
          ) || 0,
        items: (data.produitsVendus || []).map((p: ProduitVendu) => ({
          product_id: p.produit_id,
          unit_id: p.unit_id || 1,
          quantity: p.quantite,
          unit_price: p.prix_unitaire_HT,
          discount_rate: p.remise || 0,
          tax_id: p.taxe || null,
          tax_rate: 0,
          tax_type: "amount",
          total_tax: p.montant_taxe || 0,
          total_discount: p.remise || 0,
          subtotal: p.prix_unitaire_HT * p.quantite - (p.remise || 0), // Sous-total après remise individuelle
        })),
      };

      console.log("Données formatées pour création de vente:", orderData);

      // Appel API pour créer la vente
      const response = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Erreur HTTP ${response.status} lors de la création de la vente:`,
          errorText
        );
        throw new Error(
          `Erreur lors de la création de la vente: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Réponse de création de vente:", result);
      return result;
    } catch (error) {
      console.error("Erreur détaillée lors de la création de la vente:", error);
      throw error;
    }
  },
  async updateVente(id: number, data: any) {
    try {
      // Convertir les données au format attendu par l'API de commandes
      const orderData = {
        company_id: data.company_id || 1,
        warehouse_id: data.warehouse_id,
        order_date: data.Date_Facture,
        order_type: "sales", // Spécifier que c'est une vente
        invoice_type: data.invoice_type || "standard",
        user_id: Number(data.Client_ID),
        discount: data.remise_globale || 0,
        notes: data.remarques || "",
        terms_condition: data.termes_conditions || "",
        order_status: data.Statut_Vente || "Commandé",
        payment_status: data.payment_status || "Non payé",
        tax_amount: data.Montant_Taxe || 0,
        tax_rate: 0,
        shipping: 0,
        subtotal: data.Montant_Total_HT || 0, // CORRECTION: Utiliser le montant base HT (avant remise)
        total: data.Montant_TTC || 0,
        total_items: data.produitsVendus?.length || 0,
        total_quantity:
          data.produitsVendus?.reduce(
            (sum: number, p: ProduitVendu) => sum + p.quantite,
            0
          ) || 0,
        items: (data.produitsVendus || []).map((p: ProduitVendu) => ({
          product_id: p.produit_id,
          unit_id: p.unit_id || 1,
          quantity: p.quantite,
          unit_price: p.prix_unitaire_HT,
          discount_rate: p.remise || 0,
          tax_id: p.taxe || null,
          tax_rate: 0,
          tax_type: "amount",
          total_tax: p.montant_taxe || 0,
          total_discount: p.remise || 0,
          subtotal: p.prix_unitaire_HT * p.quantite - (p.remise || 0), // Sous-total après remise individuelle
        })),
      };

      console.log("Données formatées pour mise à jour de vente:", orderData);

      const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Erreur HTTP ${response.status} lors de la mise à jour de la vente:`,
          errorText
        );
        throw new Error(
          `Erreur lors de la mise à jour de la vente: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Réponse de mise à jour de vente:", result);
      return result;
    } catch (error) {
      console.error(
        "Erreur détaillée lors de la mise à jour de la vente:",
        error
      );
      throw error;
    }
  },
  async deleteVente(id: number) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la suppression de la vente: ${response.status}`
      );
    }

    return await response.json();
  },
  async fetchVenteDetail(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}`);
      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération de la vente: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Détails de la vente récupérés:", data);

      // Gérer les différents formats de réponse possibles
      let orderData = data;
      if (data.order) {
        orderData = data.order;
      }

      // S'assurer que les champs nécessaires sont présents
      return {
        ...orderData,
        notes: orderData.notes || "",
        terms_condition: orderData.terms_condition || "",
        warehouse_id: orderData.warehouse_id || orderData.warehouse || 1,
        produitsVendus: orderData.items || orderData.order_items || [],
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de la vente ${id}:`, error);
      throw error;
    }
  },
  async fetchOrderItems(orderId: string) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${orderId}/items`);

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération des éléments de la vente: ${response.status}`
        );
      }

      const data = await response.json();
      console.log(`Éléments de la commande ${orderId} récupérés:`, data);

      // Gérer les différents formats de réponse possibles
      if (Array.isArray(data)) {
        return data;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (data.order_items && Array.isArray(data.order_items)) {
        return data.order_items;
      } else {
        console.warn(
          `Format de réponse inattendu pour les éléments de la commande ${orderId}:`,
          data
        );
        return [];
      }
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des éléments de la commande ${orderId}:`,
        error
      );
      throw error;
    }
  },
  async fetchWarehouses() {
    const response = await fetch(`${BASE_URL}/api/warehouses`);

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération des magasins: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  },
  async restoreVente(id: number) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/restore`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la restauration de la vente: ${response.status}`
      );
    }

    return await response.json();
  },
  async cancelVente(id: number) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/cancel`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de l'annulation de la vente: ${response.status}`
      );
    }

    return await response.json();
  },
  async fetchWarehouse(id: number) {
    if (!id) return null;

    try {
      const response = await fetch(`${BASE_URL}/api/warehouses/${id}`);
      if (!response.ok) {
        // Si l'API ne supporte pas la récupération d'un magasin spécifique,
        // récupérer tous les magasins et filtrer
        const allWarehousesResponse = await fetch(`${BASE_URL}/api/warehouses`);
        if (!allWarehousesResponse.ok) {
          throw new Error(
            `Erreur lors de la récupération des magasins: ${allWarehousesResponse.status}`
          );
        }

        const data = await allWarehousesResponse.json();
        const warehouses = Array.isArray(data) ? data : data.warehouses || [];
        const warehouse = warehouses.find(
          (w: any) => w.id === id || w.warehouse_id === id
        );

        console.log(`Magasin ${id} trouvé dans la liste:`, warehouse);
        return warehouse || null;
      }

      const data = await response.json();
      console.log(`Magasin ${id} récupéré:`, data);
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du magasin ${id}:`, error);
      // En cas d'erreur, retourner un objet par défaut
      return {
        id: id,
        name: "ELSA Technologies",
        address: "",
        phone: "",
        email: "",
      };
    }
  },
  async fetchProductDetails(productIds: number[]) {
    try {
      // Si aucun ID n'est fourni, retourner un tableau vide
      if (!productIds || productIds.length === 0) {
        return [];
      }

      console.log("Récupération des détails pour les produits:", productIds);

      // Récupérer les détails pour chaque produit
      const detailsPromises = productIds.map((id) =>
        fetch(`${BASE_URL}/api/produits/${id}`).then((res) =>
          res.ok ? res.json() : null
        )
      );

      const productsDetails = await Promise.all(detailsPromises);
      console.log("Détails des produits récupérés:", productsDetails);

      return productsDetails.filter(Boolean); // Filtrer les éventuelles réponses null
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails des produits:",
        error
      );
      return [];
    }
  },
  async fetchSalesSummary(warehouseId: number, companyId: number | null) {
    try {
      const queryParams: any = { warehouse_id: warehouseId };
      if (companyId) {
        queryParams.company_id = companyId;
      }
      const qs = new URLSearchParams(queryParams).toString();
      const response = await fetch(`${BASE_URL}/api/orders/summary?${qs}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Erreur HTTP ${response.status} lors de la récupération du résumé des ventes: ${errorText}`
        );
        throw new Error(
          `Erreur lors de la récupération du résumé des ventes: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Résumé des ventes récupéré:", data);
      // Assuming the backend returns { totalRevenue: number, totalPaid: number }
      return {
        totalRevenue: data.totalRevenue || 0,
        totalPaid: data.totalPaid || 0,
      };
    } catch (error) {
      console.error(
        "Erreur détaillée lors de la récupération du résumé des ventes:",
        error
      );
      // Return zero values in case of error
      return { totalRevenue: 0, totalPaid: 0 };
    }
  },
};

const initialState: VentesState = {
  ventes: [],
  clients: [],
  produits: [],
  taxes: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 0,
  searchTerm: "",
  dateRange: { start: "", end: "" },
  selectedClient: null,
  showForm: false,
  formData: {
    Date_Facture: dayjs().format("YYYY-MM-DD"),
    Statut_Vente: "Completé",
    Client_ID: "",
    produitsVendus: [],
    remise_globale: 0,
  },
  showDeleted: false,
  activeTab: "1",
  selectedVenteIds: [],
  globalTotalRevenue: 0, // Initialize global revenue
  globalTotalPaid: 0, // Initialize global paid amount
};

const ventesReducer = (
  state: VentesState,
  action: VentesAction
): VentesState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_VENTES":
      return {
        ...state,
        ventes: action.payload.ventes,
        totalPages: Math.ceil(action.payload.total / state.itemsPerPage),
      };
    case "DELETE_VENTE":
      return {
        ...state,
        ventes: state.ventes.filter((vente) => vente.id !== action.payload),
      };
    case "SET_CLIENTS":
      return { ...state, clients: action.payload };
    case "SET_PRODUITS":
      return { ...state, produits: action.payload };
    case "SET_TAXES":
      return { ...state, taxes: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, currentPage: 1 };
    case "SET_SELECTED_CLIENT":
      return { ...state, selectedClient: action.payload, currentPage: 1 };
    case "TOGGLE_FORM":
      return { ...state, showForm: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "UPDATE_FORM_DATA":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
          Client_ID: action.payload.Client_ID || state.formData.Client_ID,
        },
      };
    case "TOGGLE_SHOW_DELETED":
      return { ...state, showDeleted: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload };
    case "UPDATE_VENTE_DETAIL":
      return {
        ...state,
        ventes: state.ventes.map((vente) =>
          vente.id === action.payload.id
            ? { ...vente, produitsVendus: action.payload.produitsVendus }
            : vente
        ),
      };
    case "SET_SELECTED_VENTE_IDS":
      return { ...state, selectedVenteIds: action.payload };
    case "ADD_SELECTED_VENTE_ID":
      return {
        ...state,
        selectedVenteIds: [...state.selectedVenteIds, action.payload],
      };
    case "REMOVE_SELECTED_VENTE_ID":
      return {
        ...state,
        selectedVenteIds: state.selectedVenteIds.filter(
          (id) => id !== action.payload
        ),
      };
    case "CLEAR_SELECTED_VENTE_IDS":
      return { ...state, selectedVenteIds: [] };
    case "SET_GLOBAL_TOTALS":
      return {
        ...state,
        globalTotalRevenue: action.payload.revenue,
        globalTotalPaid: action.payload.paid,
      };
    default:
      return state;
  }
};

const VentesContext = createContext<{
  state: VentesState;
  dispatch: React.Dispatch<VentesAction>;
  api: typeof api;
  // Utilisons le type AuthContextType défini ci-dessus
  auth: AuthContextType | null;
} | null>(null);

interface VenteFormProps {
  visible: boolean;
  onClose: () => void;
  refreshSales: () => Promise<void>;
}

const VenteForm: React.FC<VenteFormProps> = ({
  visible,
  onClose,
  refreshSales,
}) => {
  const context = useContext(VentesContext);
  if (!context) throw new Error("VenteForm must be used within VentesContext");
  // Get auth from the context provided by GestionVentes
  const { state, dispatch, api, auth } = context;
  const [form] = Form.useForm();
  const [searchKey, setSearchKey] = useState<number>(0);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filteredTaxes, setFilteredTaxes] = useState<any[]>([]);
  const { selectedWarehouse, selectedCompany } = useSelection();

  // Type l'objet auth correctement
  const typedAuth = auth as AuthContextType;

  // Determine if the form is for editing or creating
  const isEditing = !!state.formData.id;

  // Determine required permissions
  const canCreate = checkPermission(
    typedAuth,
    "Gestion Commerciale.Ventes.Ventes.create"
  );
  const canEdit = checkPermission(
    typedAuth,
    "Gestion Commerciale.Ventes.Ventes.edit"
  );
  const hasRequiredPermission = isEditing ? canEdit : canCreate;

  // Logging pour debugging
  useEffect(() => {
    console.log("VenteForm - selectedWarehouse:", selectedWarehouse);
    console.log("VenteForm - selectedCompany:", selectedCompany);
  }, [selectedWarehouse, selectedCompany]);

  // Filtrer les clients en fonction du magasin sélectionné
  useEffect(() => {
    if (selectedWarehouse && state.clients.length > 0) {
      const filtered = state.clients.filter(
        (client) =>
          !client.warehouse_id || client.warehouse_id === selectedWarehouse
      );
      console.log(
        `Clients filtrés pour le magasin ${selectedWarehouse}:`,
        filtered.length
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(state.clients);
    }
  }, [selectedWarehouse, state.clients]);

  // Filtrer les taxes en fonction de l'entreprise sélectionnée
  useEffect(() => {
    if (selectedCompany && state.taxes.length > 0) {
      const filtered = state.taxes.filter(
        (tax) => !tax.company_id || tax.company_id === selectedCompany
      );
      console.log(
        `Taxes filtrées pour l'entreprise ${selectedCompany}:`,
        filtered.length
      );
      setFilteredTaxes(filtered);
    } else {
      setFilteredTaxes(state.taxes);
    }
  }, [selectedCompany, state.taxes]);

  // Calcul des totaux suivant la logique spécifiée
  const calculerTotaux = useCallback(() => {
    const produitsVendus = state.formData.produitsVendus;

    // 1. Base HT initiale = Σ (quantité × PU HT)
    const baseHT = produitsVendus.reduce(
      (sum, p) =>
        sum + (Number(p.prix_unitaire_HT) || 0) * (Number(p.quantite) || 0),
      0
    );

    // 2. Remises commerciales (remises individuelles + remise globale)
    const remisesIndividuelles = produitsVendus.reduce(
      (sum, p) => sum + (Number(p.remise) || 0),
      0
    );
    const remiseGlobale = Number(state.formData.remise_globale) || 0;
    const totalRemises = remisesIndividuelles + remiseGlobale;

    // 3. Montant net HT = Base HT – total_remises
    const montantNetHT = baseHT - totalRemises;

    // 4. Taxe = Montant net HT × taux_Taxe (calculée par produit sur le montant net)
    const totalTaxes = produitsVendus.reduce((sum, p) => {
      if (!p.taxe) return sum;
      const tax = filteredTaxes.find((t: any) => t.id === p.taxe);
      if (!tax) return sum;

      // Calculer la part de ce produit dans le montant net HT
      const produitBaseHT =
        (Number(p.prix_unitaire_HT) || 0) * (Number(p.quantite) || 0);
      const produitRemise = Number(p.remise) || 0;

      // Calculer la proportion de remise globale qui s'applique à ce produit
      const proportionRemiseGlobale =
        baseHT > 0 ? (produitBaseHT / baseHT) * remiseGlobale : 0;

      // Montant net HT pour ce produit
      const produitNetHT =
        produitBaseHT - produitRemise - proportionRemiseGlobale;

      // Taxe sur le montant net HT de ce produit
      const taxeRate = Number(tax.rate) || 0;
      return sum + (produitNetHT * taxeRate) / 100;
    }, 0);

    // 5. Total TTC = Montant net HT + Taxe
    const totalTTC = montantNetHT + totalTaxes;

    return {
      totalHT: baseHT, // Base HT initiale
      montantNetHT, // Montant net HT après remises
      totalRemises,
      totalTaxes,
      totalTTC,
    };
  }, [
    state.formData.produitsVendus,
    state.formData.remise_globale,
    filteredTaxes,
  ]);

  useEffect(() => {
    form.setFieldsValue({
      ...state.formData,
      Date_Facture: dayjs(state.formData.Date_Facture),
    });

    // Logs pour déboguer
    console.log("Client_ID dans formData:", state.formData.Client_ID);
    console.log(
      "Valeur actuelle du champ Client dans le formulaire:",
      form.getFieldValue("Client_ID")
    );

    // Si Client_ID est défini dans formData mais pas dans le formulaire, le définir manuellement
    if (state.formData.Client_ID && !form.getFieldValue("Client_ID")) {
      console.log("Mise à jour du champ Client_ID dans le formulaire");
      form.setFieldValue("Client_ID", state.formData.Client_ID);
    }
  }, [state.formData, form]);

  const { totalHT, montantNetHT, totalRemises, totalTaxes, totalTTC } =
    calculerTotaux();

  const onFinish = async (values: any) => {
    // Permission check before submitting
    if (!hasRequiredPermission) {
      message.error(
        "Vous n'avez pas la permission d'ajouter ou de modifier une vente."
      );
      return;
    }

    // Vérification des données requises
    if (!selectedWarehouse) {
      message.error("Veuillez sélectionner un magasin");
      return;
    }

    if (!values.Client_ID) {
      message.error("Veuillez sélectionner un client");
      return;
    }

    if (state.formData.produitsVendus.length === 0) {
      message.error("Veuillez ajouter au moins un produit");
      return;
    }

    try {
      // Utiliser les calculs corrects de la fonction calculerTotaux
      const {
        totalHT: baseHT,
        montantNetHT,
        totalRemises: totalRemisesCalc,
        totalTaxes: totalTax,
        totalTTC: montantTTC,
      } = calculerTotaux();

      const mappedProduitsVendus = state.formData.produitsVendus.map((p) => {
        // Calculer la taxe individuelle selon la nouvelle logique
        let montant_taxe = 0;
        if (p.taxe) {
          const tax = filteredTaxes.find((t: any) => t.id === p.taxe);
          if (tax) {
            const produitBaseHT =
              (Number(p.prix_unitaire_HT) || 0) * (Number(p.quantite) || 0);
            const produitRemise = Number(p.remise) || 0;
            const remiseGlobale = Number(values.remise_globale) || 0;

            // Calculer la proportion de remise globale qui s'applique à ce produit
            const proportionRemiseGlobale =
              baseHT > 0 ? (produitBaseHT / baseHT) * remiseGlobale : 0;

            // Montant net HT pour ce produit
            const produitNetHT =
              produitBaseHT - produitRemise - proportionRemiseGlobale;

            // Taxe sur le montant net HT de ce produit
            const taxeRate = Number(tax.rate) || 0;
            montant_taxe = (produitNetHT * taxeRate) / 100;
          }
        }

        return {
          ...p,
          taxe: p.taxe ? Number(p.taxe) : null,
          montant_taxe: Number(montant_taxe) || 0,
          prix_unitaire_HT: Number(p.prix_unitaire_HT) || 0,
          quantite: Number(p.quantite) || 0,
          remise: Number(p.remise || 0),
        };
      });

      const venteData = {
        // Ajout de warehouse_id qui est obligatoire pour l'API
        warehouse_id: selectedWarehouse,
        // Ajout de company_id récupéré du contexte
        company_id: selectedCompany,
        Date_Facture: values.Date_Facture.format("YYYY-MM-DD"),
        Statut_Vente: values.Statut_Vente,
        Client_ID: values.Client_ID || state.formData.Client_ID,
        Montant_Total_HT: baseHT, // Base HT initiale
        Montant_Net_HT: montantNetHT, // Nouveau champ : Montant net HT après remises
        Montant_TTC: montantTTC, // Total TTC
        Montant_Remise: totalRemisesCalc, // Total des remises
        Montant_Taxe: totalTax, // Total des taxes
        remise_globale: values.remise_globale || 0,
        termes_conditions: values.termes_conditions || "",
        remarques: values.remarques || "",
        produitsVendus: mappedProduitsVendus,
        // Statut de paiement initial
        payment_status: "Non payé",
      };

      console.log("Données de vente avant envoi à l'API:", venteData);
      console.log("Calculs détaillés:", {
        baseHT,
        totalRemisesCalc,
        montantNetHT,
        totalTax,
        montantTTC,
      });

      if (state.formData.id) {
        // Permission check specifically for editing
        if (!canEdit) {
          message.error("Vous n'avez pas la permission de modifier une vente.");
          return;
        }
        await api.updateVente(state.formData.id, venteData);
        message.success("Vente mise à jour avec succès");
      } else {
        // Permission check specifically for creating
        if (!canCreate) {
          message.error("Vous n'avez pas la permission d'ajouter une vente.");
          return;
        }
        await api.createVente(venteData);
        message.success("Vente ajoutée avec succès");
      }

      form.resetFields();
      dispatch({
        type: "SET_FORM_DATA",
        payload: {
          ...initialState.formData,
          Date_Facture: dayjs().format("YYYY-MM-DD"),
          Statut_Vente: "Completé",
          Client_ID: "",
          remise_globale: 0,
          produitsVendus: [],
        },
      });
      onClose();
      refreshSales();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la vente:", error);
      message.error("Erreur lors de l'enregistrement de la vente");
    }
  };

  const handleProductSelect = (product: Product) => {
    // Permission check before adding product
    if (!hasRequiredPermission) {
      message.error(
        "Vous n'avez pas la permission d'ajouter ou de modifier des produits."
      );
      return;
    }

    if (product.quantite_stock === undefined || product.quantite_stock <= 0) {
      message.error(
        "L'article n'a plus de stock disponible et ne peut être ajouté."
      );
      return;
    }

    // Sauvegarde du client actuellement sélectionné dans le formulaire
    const currentClientId = form.getFieldValue("Client_ID");
    console.log("Client ID actuel avant ajout de produit:", currentClientId);

    console.log("Produit sélectionné:", product);

    // Vérifier si le produit existe déjà dans le panier
    const existingProductIndex = state.formData.produitsVendus.findIndex(
      (p) => p.produit_id === product.id_produit
    );

    if (existingProductIndex !== -1) {
      // Le produit existe déjà, incrémenter sa quantité
      const updatedProduitsVendus = [...state.formData.produitsVendus];

      // Vérifier si l'augmentation de quantité ne dépasse pas le stock disponible
      const currentQuantity =
        updatedProduitsVendus[existingProductIndex].quantite;

      if (
        product.quantite_stock !== undefined &&
        currentQuantity + 1 > product.quantite_stock
      ) {
        message.warning("La quantité demandée dépasse le stock disponible.");
        return;
      }

      // Incrémenter la quantité et mettre à jour les champs associés
      updatedProduitsVendus[existingProductIndex].quantite += 1;
      updatedProduitsVendus[existingProductIndex].quantity =
        updatedProduitsVendus[existingProductIndex].quantite;

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: {
          id: state.formData.id,
          Date_Facture: state.formData.Date_Facture,
          Statut_Vente: state.formData.Statut_Vente,
          Client_ID: currentClientId || state.formData.Client_ID, // Utiliser la valeur courante du formulaire
          remise_globale: state.formData.remise_globale,
          termes_conditions: state.formData.termes_conditions,
          remarques: state.formData.remarques,
          produitsVendus: updatedProduitsVendus,
        },
      });

      // Réappliquer la valeur client_ID après le dispatch pour s'assurer qu'elle n'est pas perdue
      setTimeout(() => {
        if (currentClientId) {
          console.log("Réapplication du Client_ID:", currentClientId);
          form.setFieldValue("Client_ID", currentClientId);
        }
      }, 0);

      // Incrémenter la clé pour reset le champ de recherche
      setSearchKey((prev) => prev + 1);
      message.success(
        `Quantité de ${product.nom_produit} augmentée à ${currentQuantity + 1}`
      );
    } else {
      // Le produit n'existe pas encore, l'ajouter au panier
      // Créer un nouvel objet produitVendu avec les champs mappés correctement
      const produitVendu: ProduitVendu = {
        produit_id: product.id_produit,
        nom_produit: product.nom_produit,
        quantite: 1,
        prix_unitaire_HT: product.prix_vente,
        remise: 0,
        taxe: null,
        montant_taxe: 0,
        quantite_stock: product.quantite_stock,
        // Ajouter les champs compatibles avec l'API
        product_id: product.id_produit,
        product_name: product.nom_produit,
        quantity: 1,
        unit_price: product.prix_vente,
        discount_rate: 0,
        tax_id: undefined,
        total_tax: 0,
        subtotal: product.prix_vente,
        unit_id: undefined,
      };

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: {
          id: state.formData.id,
          Date_Facture: state.formData.Date_Facture,
          Statut_Vente: state.formData.Statut_Vente,
          Client_ID: currentClientId || state.formData.Client_ID, // Utiliser la valeur courante du formulaire
          remise_globale: state.formData.remise_globale,
          termes_conditions: state.formData.termes_conditions,
          remarques: state.formData.remarques,
          produitsVendus: [...state.formData.produitsVendus, produitVendu],
        },
      });

      // Réappliquer la valeur client_ID après le dispatch pour s'assurer qu'elle n'est pas perdue
      setTimeout(() => {
        if (currentClientId) {
          console.log("Réapplication du Client_ID:", currentClientId);
          form.setFieldValue("Client_ID", currentClientId);
        }
      }, 0);

      // Incrémenter la clé pour reset le champ de recherche
      setSearchKey((prev) => prev + 1);
      message.success(`${product.nom_produit} ajouté au panier`);
    }
  };

  // Disable form fields if user lacks permission
  const formDisabled = !hasRequiredPermission;

  return (
    <Modal
      visible={visible}
      title={state.formData.id ? "Modifier une vente" : "Ajouter une vente"} // No permission check needed for title
      width="95%"
      style={{ maxWidth: 1100 }}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Annuler
        </Button>,
        // Disable submit button based on permission
        <Button
          key="submit"
          type="primary"
          onClick={form.submit}
          disabled={!hasRequiredPermission} // Disable if no permission
        >
          {state.formData.id ? "Modifier" : "Ajouter"}
        </Button>,
      ]}
    >
      {/* Disable the entire form if the user doesn't have the required permission */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        preserve={true}
        disabled={formDisabled} // Apply disabled prop to the Form
        onValuesChange={(changedValues, allValues) => {
          // Si Client_ID a changé, l'enregistrer explicitement dans notre état
          if ("Client_ID" in changedValues) {
            console.log(
              "Client_ID a changé dans le formulaire:",
              changedValues.Client_ID
            );
            dispatch({
              type: "UPDATE_FORM_DATA",
              payload: {
                ...state.formData,
                Client_ID: changedValues.Client_ID,
              },
            });
          }
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="Client_ID"
              label="Client"
              rules={[{ required: true, message: "Sélectionnez un client" }]}
            >
              <Select
                placeholder="Sélectionner un client" /* disabled is inherited */
              >
                {filteredClients.map((client: any) => (
                  <Option key={client.id} value={client.id}>
                    {client.name ||
                      client.company_name ||
                      client.Nom_Raison_Sociale ||
                      "Client inconnu"}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="Date_Facture"
              label="Date"
              rules={[{ required: true, message: "Sélectionnez une date" }]}
            >
              <DatePicker
                style={{ width: "100%" }} /* disabled is inherited */
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="Statut_Vente"
              label="Statut"
              rules={[{ required: true, message: "Sélectionnez un statut" }]}
            >
              <Select /* disabled is inherited */>
                <Option value="Commandé">Commandé</Option>
                <Option value="En traitement">En traitement</Option>
                <Option value="Expédié">Expédié</Option>
                <Option value="Livré">Livré</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item label="Rechercher un produit">
              <Row gutter={16}>
                <Col span={18}>
                  {/* ProductSearch component needs to inherit disabled state or check internally */}
                  {/* Assuming ProductSearch respects inherited 'disabled' or needs modification */}
                  <ProductSearch
                    key={searchKey}
                    api={api}
                    warehouse={selectedWarehouse}
                    onSelect={(product: Product) =>
                      handleProductSelect(product)
                    }
                    // Supprimons la prop disabled qui cause l'erreur
                    // disabled={formDisabled}
                  />
                  {/* Affichons un message ou overlay si le form est désactivé */}
                  {formDisabled && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(255, 255, 255, 0.6)",
                        zIndex: 1,
                        cursor: "not-allowed",
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label=" ">
              {/* Barcode scan button */}
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => {
                  // Permission check before opening scanner modal
                  if (!hasRequiredPermission) {
                    message.error(
                      "Vous n'avez pas la permission d'ajouter des produits."
                    );
                    return;
                  }
                  Modal.info({
                    title: "Scanner un code-barres",
                    width: 640,
                    maskClosable: true,
                    content: (
                      <div style={{ marginTop: 20 }}>
                        <BarcodeScanner
                          onScan={async (barcode) => {
                            // Permission check inside scanner callback as well
                            if (!hasRequiredPermission) {
                              message.error(
                                "Permission refusée pendant le scan."
                              );
                              Modal.destroyAll();
                              return;
                            }
                            try {
                              console.log("Code-barres scanné:", barcode);
                              const response = await api.fetchProduits({
                                search: barcode,
                                warehouse: selectedWarehouse,
                              });

                              if (response.data && response.data.length > 0) {
                                const product = response.data[0];
                                console.log(
                                  "Produit trouvé par scan:",
                                  product
                                );
                                handleProductSelect(product);
                                Modal.destroyAll(); // Fermer la modal
                              } else {
                                message.warning(
                                  "Aucun produit trouvé avec ce code-barres."
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Erreur lors de la recherche par code-barres:",
                                error
                              );
                              message.error(
                                "Erreur lors de la recherche du produit."
                              );
                            }
                          }}
                        />
                        <p style={{ textAlign: "center", marginTop: 15 }}>
                          Placez le code-barres devant la caméra pour le scanner
                        </p>
                      </div>
                    ),
                    onOk: () => {},
                  });
                }}
                disabled={formDisabled} // Disable button if form is disabled
              >
                Scanner un code-barres
              </Button>
            </Form.Item>
          </Col>
        </Row>
        <div className="overflow-x-auto">
          <Table
            dataSource={state.formData.produitsVendus}
            rowKey={(record: any) => record.produit_id.toString()}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          >
            <Table.Column
              title="Produit"
              dataIndex="nom_produit"
              render={(value: any, record: any) => (
                <Space direction="vertical" size="small">
                  <span>{value}</span>
                  {record.quantite_stock !== undefined && (
                    <span style={{ fontSize: "0.85em", color: "#888" }}>
                      Stock disponible: {record.quantite_stock}
                    </span>
                  )}
                </Space>
              )}
            />
            <Table.Column
              title="Prix unitaire HT"
              dataIndex="prix_unitaire_HT"
              render={(value: any, record: any, index: number) => (
                <InputNumber
                  min={0}
                  value={value}
                  addonAfter="CFA"
                  formatter={(val: any) =>
                    val !== undefined && val !== null
                      ? formatNumber(Number(val))
                      : ""
                  }
                  parser={(val: any) => (val ? val.replace(/\D/g, "") : "")}
                  onChange={(newValue: any) => {
                    const updatedProducts = [...state.formData.produitsVendus];
                    updatedProducts[index].prix_unitaire_HT = newValue || 0;
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        ...state.formData,
                        produitsVendus: updatedProducts,
                      },
                    });
                  }}
                  disabled={formDisabled} // Disable input
                />
              )}
            />
            <Table.Column
              title="Quantité"
              dataIndex="quantite"
              render={(value: any, record: any, index: number) => (
                <InputNumber
                  min={1}
                  max={record.quantite_stock || undefined}
                  value={value}
                  formatter={(val: any) =>
                    val !== undefined && val !== null
                      ? formatNumber(Number(val))
                      : ""
                  }
                  parser={(val: any) => (val ? val.replace(/\D/g, "") : "")}
                  onChange={(newValue: any) => {
                    if (
                      record.quantite_stock !== undefined &&
                      newValue > record.quantite_stock
                    ) {
                      message.warning(
                        "Quantité supérieure au stock disponible !"
                      );
                      return;
                    }
                    const updatedProducts = [...state.formData.produitsVendus];
                    updatedProducts[index].quantite = newValue || 1;
                    updatedProducts[index].quantity = newValue || 1;
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        ...state.formData,
                        produitsVendus: updatedProducts,
                      },
                    });
                  }}
                  disabled={formDisabled} // Disable input
                />
              )}
            />
            <Table.Column
              title="Remise"
              dataIndex="remise"
              render={(value: any, record: any, index: number) => (
                <InputNumber
                  min={0}
                  value={value || 0}
                  formatter={(val: any) =>
                    val !== undefined && val !== null
                      ? formatNumber(Number(val))
                      : ""
                  }
                  parser={(val: any) => (val ? val.replace(/\D/g, "") : "")}
                  onChange={(newValue: any) => {
                    const updatedProducts = [...state.formData.produitsVendus];
                    updatedProducts[index].remise = newValue || 0;
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        ...state.formData,
                        produitsVendus: updatedProducts,
                      },
                    });
                  }}
                  disabled={formDisabled} // Disable input
                />
              )}
            />
            <Table.Column
              title="Taxe"
              dataIndex="taxe"
              render={(value: any, record: any, index: number) => (
                <Select
                  value={value}
                  style={{ width: 120 }}
                  onChange={(newValue: any) => {
                    const updatedProducts = [...state.formData.produitsVendus];
                    updatedProducts[index].taxe = newValue;
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        ...state.formData,
                        produitsVendus: updatedProducts,
                      },
                    });
                  }}
                  disabled={formDisabled} // Disable select
                >
                  <Option value={null}>Aucune</Option>
                  {filteredTaxes.map((tax: any) => (
                    <Option key={tax.id} value={tax.id}>
                      {tax.name} ({tax.rate}%)
                    </Option>
                  ))}
                </Select>
              )}
            />
            <Table.Column
              title="Montant taxe"
              render={(_: any, record: any) => {
                // Calculer selon la nouvelle logique
                if (!record.taxe) return "0 CFA";

                const tax = filteredTaxes.find(
                  (t: any) => t.id === record.taxe
                );
                if (!tax) return "0 CFA";

                const produitBaseHT =
                  (Number(record.prix_unitaire_HT) || 0) *
                  (Number(record.quantite) || 0);
                const produitRemise = Number(record.remise) || 0;

                // Pour le calcul individuel dans le tableau, on ignore la remise globale
                // car elle sera appliquée au niveau du total
                const produitNetHT = produitBaseHT - produitRemise;
                const taxeRate = Number(tax.rate) || 0;
                const montantTaxe = (produitNetHT * taxeRate) / 100;

                return formatNumber(montantTaxe) + " CFA";
              }}
            />
            <Table.Column
              title="Total TTC"
              render={(_: any, record: any) => {
                const produitBaseHT =
                  (Number(record.prix_unitaire_HT) || 0) *
                  (Number(record.quantite) || 0);
                const produitRemise = Number(record.remise) || 0;
                const produitNetHT = produitBaseHT - produitRemise;

                // Calcul de la taxe pour ce produit
                let montantTaxe = 0;
                if (record.taxe) {
                  const tax = filteredTaxes.find(
                    (t: any) => t.id === record.taxe
                  );
                  if (tax) {
                    const taxeRate = Number(tax.rate) || 0;
                    montantTaxe = (produitNetHT * taxeRate) / 100;
                  }
                }

                const total = produitNetHT + montantTaxe;
                return formatNumber(total) + " CFA";
              }}
            />
            <Table.Column
              title="Action"
              render={(_: any, record: any, index: number) => (
                // Disable delete button based on permission
                <Button
                  type="link"
                  danger
                  disabled={formDisabled} // Disable button
                  onClick={() => {
                    // Permission check inside onClick
                    if (!hasRequiredPermission) return;
                    const updatedProducts =
                      state.formData.produitsVendus.filter(
                        (_: any, i: number) => i !== index
                      );
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        ...state.formData,
                        produitsVendus: updatedProducts,
                      },
                    });
                  }}
                >
                  <DeleteOutlined />
                </Button>
              )}
            />
          </Table>
        </div>
        <Row
          gutter={16}
          style={{ marginTop: 16 }}
          className="bg-gray-50 p-4 rounded"
        >
          <Col xs={12} md={4}>
            <Statistic
              title="Base HT"
              value={formatNumber(totalHT)}
              suffix=" CFA"
            />
          </Col>
          <Col xs={12} md={4}>
            <Statistic
              title="Total Remises"
              value={formatNumber(totalRemises)}
              suffix=" CFA"
            />
          </Col>
          <Col xs={12} md={4}>
            <Statistic
              title="Montant Net HT"
              value={formatNumber(montantNetHT)}
              suffix=" CFA"
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Statistic
              title="Total Taxes"
              value={formatNumber(totalTaxes)}
              suffix=" CFA"
            />
          </Col>
          <Col xs={12} md={4}>
            <Statistic
              title="Total TTC"
              value={formatNumber(totalTTC)}
              suffix=" CFA"
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Form.Item name="termes_conditions" label="Termes et conditions">
              <Input.TextArea rows={4} /* disabled is inherited */ />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="remarques" label="Remarques">
              <Input.TextArea rows={4} /* disabled is inherited */ />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

interface VentesTableProps {
  refreshSales: () => Promise<void>;
}

const VentesTable: React.FC<VentesTableProps> = ({ refreshSales }) => {
  const context = useContext(VentesContext);
  if (!context) {
    throw new Error("VentesTable must be used within a VentesContext.Provider");
  }
  // Get auth from context
  const { state, dispatch, api, auth } = context;

  // Type l'objet auth correctement
  const typedAuth = auth as AuthContextType;

  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [detailVente, setDetailVente] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const { selectedWarehouse, selectedCompany } = useSelection();
  // Removed useAuth here as it's passed via context

  // Logging pour debugging
  useEffect(() => {
    // console.log("VentesTable - selectedWarehouse:", selectedWarehouse);
    // console.log("VentesTable - selectedCompany:", selectedCompany);
  }, [selectedWarehouse, selectedCompany]);

  const loadVenteDetails = async (record: any) => {
    if (!record.produitsVendus) {
      try {
        setLoading(true);
        console.log("Chargement des détails de la vente ID:", record.id);

        const venteDetail = await api.fetchVenteDetail(record.id);
        const orderItems = await api.fetchOrderItems(record.id);

        console.log("Détails de la vente récupérés:", venteDetail);
        console.log("Éléments de la vente récupérés:", orderItems);

        const updatedRecord = { ...record, produitsVendus: orderItems };

        // Mettre à jour l'état avec les produits vendus
        dispatch({
          type: "UPDATE_VENTE_DETAIL",
          payload: { id: record.id, produitsVendus: orderItems },
        });

        return updatedRecord;
      } catch (error) {
        console.error(
          "Erreur lors du chargement des détails de la vente:",
          error
        );
        message.error("Erreur lors du chargement des détails de la vente");
      } finally {
        setLoading(false);
      }
    }
    return record;
  };

  const loadVenteDetailsForModal = async (record: any) => {
    try {
      setLoading(true);

      // Extraire l'ID, que record soit un objet ou un ID directement
      const recordId = typeof record === "object" ? record.id : record;

      console.log("Chargement des détails pour le modal - vente ID:", recordId);

      // Récupérer les détails de la vente
      const venteDetail = await api.fetchVenteDetail(recordId);
      console.log("Détails de la vente récupérés pour le modal:", venteDetail);

      // Si record n'est pas un objet, utiliser seulement les données de venteDetail
      const baseRecord = typeof record === "object" ? record : {};

      // Créer une copie de l'enregistrement avec les détails mis à jour
      const updatedRecord = {
        ...baseRecord,
        id: recordId, // S'assurer que l'ID est présent
        // S'assurer que les notes et termes_condition sont inclus
        notes:
          venteDetail.notes || (typeof record === "object" ? record.notes : ""),
        terms_condition:
          venteDetail.terms_condition ||
          (typeof record === "object" ? record.terms_condition : ""),
        warehouse_id:
          venteDetail.warehouse_id ||
          (typeof record === "object" ? record.warehouse_id : null),
      };

      // Vérifier si les produitsVendus sont déjà inclus dans la réponse
      if (venteDetail.produitsVendus && venteDetail.produitsVendus.length > 0) {
        console.log(
          "Produits vendus trouvés dans la réponse de l'API pour le modal:",
          venteDetail.produitsVendus
        );
        updatedRecord.produitsVendus = venteDetail.produitsVendus;
        setDetailVente(updatedRecord);
        return updatedRecord;
      }

      // Si les produitsVendus ne sont pas inclus, récupérer les éléments de la vente séparément
      const orderItems = await api.fetchOrderItems(recordId);
      console.log("Éléments de la vente récupérés pour le modal:", orderItems);

      if (!orderItems || orderItems.length === 0) {
        console.warn(
          "Aucun produit trouvé pour la vente ID (modal):",
          recordId
        );

        // Utiliser invoice_number s'il est disponible dans l'objet
        const invoiceNumber =
          typeof record === "object" && record.invoice_number
            ? record.invoice_number
            : venteDetail.invoice_number || recordId;

        message.warning(`Aucun produit trouvé pour la vente #${invoiceNumber}`);
        updatedRecord.produitsVendus = [];
        setDetailVente(updatedRecord);
        return updatedRecord;
      }

      // Mettre à jour l'enregistrement avec les produits vendus
      updatedRecord.produitsVendus = orderItems;

      // Mettre à jour l'état du détail de la vente
      setDetailVente(updatedRecord);

      return updatedRecord;
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails de la vente pour le modal:",
        error
      );
      // Ne pas afficher ce message d'erreur si on est en train de rafraîchir après un paiement
      if (typeof record !== "object" || !record.id) {
        message.error("Erreur lors du chargement des détails de la vente");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadVenteForEdit = async (record: any) => {
    // Permission check before loading data for edit
    if (!checkPermission(typedAuth, "Gestion Commerciale.Ventes.Ventes.edit")) {
      message.error("Vous n'avez pas la permission de modifier cette vente.");
      return;
    }
    try {
      setLoading(true);
      console.log(
        "Chargement des détails pour modification de la vente ID:",
        record.id
      );

      // Récupérer les détails de la vente
      const venteData = await api.fetchVenteDetail(String(record.id));
      console.log("Données brutes récupérées pour modification:", venteData);

      // Vérifier si les produitsVendus sont déjà inclus dans la réponse
      let produitsVendus = [];

      if (venteData.produitsVendus && venteData.produitsVendus.length > 0) {
        console.log(
          "Produits vendus trouvés dans la réponse de l'API:",
          venteData.produitsVendus
        );

        // Mapper les éléments de la vente au format attendu par le formulaire
        produitsVendus = venteData.produitsVendus.map((item: any) => ({
          produit_id: item.product_id,
          nom_produit:
            item.product_name ||
            state.produits.find(
              (p: Product) => p.id_produit === Number(item.product_id)
            )?.nom_produit ||
            "Produit " + item.product_id,
          quantite: Number(item.quantity) || 0,
          prix_unitaire_HT: Number(item.unit_price) || 0,
          remise: Number(item.discount_rate) || 0,
          taxe: item.tax_id,
          montant_taxe: Number(item.total_tax) || 0,
        }));
      } else {
        // Si les produitsVendus ne sont pas inclus, récupérer les éléments de la vente séparément
        const orderItems = await api.fetchOrderItems(record.id);
        console.log(
          "Éléments de la vente récupérés pour modification:",
          orderItems
        );

        if (orderItems && orderItems.length > 0) {
          // Mapper les éléments de la vente au format attendu par le formulaire
          produitsVendus = orderItems.map((item: any) => ({
            produit_id: item.product_id,
            nom_produit:
              item.product_name ||
              state.produits.find(
                (p: Product) => p.id_produit === Number(item.product_id)
              )?.nom_produit ||
              "Produit " + item.product_id,
            quantite: Number(item.quantity) || 0,
            prix_unitaire_HT: Number(item.unit_price) || 0,
            remise: Number(item.discount_rate) || 0,
            taxe: item.tax_id,
            montant_taxe: Number(item.total_tax) || 0,
          }));
        }
      }

      // Préparer les données du formulaire
      const formattedData: VenteFormData = {
        id: venteData.id,
        Date_Facture: venteData.order_date || dayjs().format("YYYY-MM-DD"),
        Statut_Vente: venteData.order_status || "Commandé",
        Client_ID: String(venteData.user_id), // Convertir en string pour compatibilité avec le formulaire
        remise_globale: venteData.discount || 0,
        termes_conditions: venteData.terms_condition || "",
        remarques: venteData.notes || "",
        produitsVendus: produitsVendus,
      };

      console.log("Données formatées pour le formulaire:", formattedData);

      // Mettre à jour l'état avec les données du formulaire et ouvrir le formulaire
      dispatch({ type: "SET_FORM_DATA", payload: formattedData });
      dispatch({ type: "TOGGLE_FORM", payload: true });
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails de la vente pour modification:",
        error
      );
      message.error("Erreur lors du chargement des détails de la vente");
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une fonction pour récupérer les informations du magasin
  const fetchWarehouseInfo = useCallback(async () => {
    if (selectedWarehouse) {
      try {
        const warehouse = await api.fetchWarehouse(selectedWarehouse);
        if (warehouse) {
          setWarehouseData(warehouse);
          console.log("Informations du magasin récupérées:", warehouse);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du magasin:", error);
      }
    }
  }, [selectedWarehouse]); // api retiré car c'est un objet stable

  // Charger les informations du magasin au chargement du composant
  useEffect(() => {
    fetchWarehouseInfo();
  }, [fetchWarehouseInfo]);

  // Ajouter handleTabChange qui était manquant
  const handleTabChange = (activeKey: string) => {
    console.log("Tab changed to:", activeKey);
    dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey });
  };

  // Define columns inside the component with access to auth from context
  const columns: TableProps<any>["columns"] = [
    {
      // Column: Selection Checkbox
      title: (
        <Checkbox
          checked={
            state.ventes.length > 0 &&
            state.selectedVenteIds.length === state.ventes.length
          }
          indeterminate={
            state.selectedVenteIds.length > 0 &&
            state.selectedVenteIds.length < state.ventes.length
          }
          onChange={(e) => {
            const allIds = state.ventes.map((v) => v.id);
            dispatch({
              type: "SET_SELECTED_VENTE_IDS",
              payload: e.target.checked ? allIds : [],
            });
          }}
        />
      ),
      dataIndex: "selection",
      key: "selection",
      width: 50, // Fixed width for selection
      render: (_: any, record: any) => (
        <Checkbox
          checked={state.selectedVenteIds.includes(record.id)}
          onChange={(e) => {
            dispatch({
              type: e.target.checked
                ? "ADD_SELECTED_VENTE_ID"
                : "REMOVE_SELECTED_VENTE_ID",
              payload: record.id,
            });
          }}
        />
      ),
    },
    {
      title: "Numéro de facture",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 150, // Added width
    },
    {
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (text: string): string => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a: any, b: any) => {
        const dateA = dayjs(a.order_date);
        const dateB = dayjs(b.order_date);
        return dateB.valueOf() - dateA.valueOf(); // Tri décroissant (du plus récent au plus ancien)
      },
      defaultSortOrder: "descend",
      width: 130, // Added width
    },
    {
      title: "Client",
      key: "client",
      render: (_: any, record: any): React.ReactNode => {
        if (!record.user_id) {
          return "Non spécifié";
        }

        // Rechercher le client dans la liste des clients
        if (record.entity_name || record.user_name) {
          return record.entity_name || record.user_name;
        }

        const client = state.clients.find(
          (c: any) => c.id === Number(record.user_id)
        );

        if (client) {
          return (
            client.name ||
            client.company_name ||
            client.Nom_Raison_Sociale ||
            "Client " + client.id
          );
        }

        return "Inconnu";
      },
      width: 200, // Added width
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      width: 150, // Added width
    },
    {
      title: "Statut",
      dataIndex: "order_status",
      key: "order_status",
      render: (status: string) => {
        let color = "green";
        if (status === "En attente") color = "orange";
        if (status === "Annulé") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
      width: 150, // Added width
    },
    {
      title: "Statut paiement",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => {
        let color = "";
        let displayText = status;

        if (status === "Non payé") {
          color = "red";
          displayText = "Non payé";
        } else if (status === "Partiel" || status === "Partiellement payé") {
          color = "orange";
          displayText = "Partiellement payé";
        } else if (status === "Payé") {
          color = "green";
          displayText = "Payé";
        }

        return <Tag color={color}>{displayText}</Tag>;
      },
      width: 150, // Added width
    },
    {
      title: "Montant payé",
      dataIndex: "paid_amount",
      key: "paid_amount",
      align: "right", // Align numbers to the right
      render: (amount: number) => `${formatNumber(amount || 0)} CFA`,
      width: 130, // Added width
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right", // Align numbers to the right
      render: (total: number) => `${formatNumber(total)} CFA`,
      width: 120, // Added width
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 120, // Adjusted width to accommodate buttons
      render: (_: any, record: any) => {
        // Get permissions at the start of render
        const canView = checkPermission(
          typedAuth,
          "Gestion Commerciale.Ventes.Ventes.view"
        );
        const canEdit = checkPermission(
          typedAuth,
          "Gestion Commerciale.Ventes.Ventes.edit"
        );
        const canDelete = checkPermission(
          typedAuth,
          "Gestion Commerciale.Ventes.Ventes.delete"
        );
        // Assume view permission is needed for download
        const canDownload = canView;

        // Disable edit if already paid or deleted
        const isEditDisabled =
          record.is_deleted === 1 || record.paid_amount > 0;
        // Disable delete if already paid or not deletable flag is set
        const isDeleteDisabled =
          record.paid_amount > 0 || record.is_deletable === 0;
        // Disable restore if not deleted
        const isRestoreDisabled = record.is_deleted !== 1;
        // Disable cancel if not paid > 0
        const isCancelDisabled = !(record.paid_amount > 0);

        return (
          <Space size="small">
            {/* View Button */}
            {canView && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setDetailVente(record);
                  setShowDetailModal(true);
                  loadVenteDetailsForModal(record);
                }}
              />
            )}
            {/* Edit Button */}
            {canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={async () => {
                  // Double check condition before calling load
                  if (record.paid_amount > 0) {
                    Modal.warning({
                      /* ... */
                    });
                    return;
                  }
                  loadVenteForEdit(record); // loadVenteForEdit already checks permission
                }}
                disabled={isEditDisabled} // Disable based on record status
              />
            )}
            {/* Conditional Delete/Restore/Cancel Buttons */}
            {canDelete && record.is_deleted === 1 ? (
              // Restore Button
              <Button
                type="primary"
                disabled={isRestoreDisabled} // Should always be enabled if deleted=1
                onClick={() =>
                  Modal.confirm({
                    title: "Confirmation",
                    content: "Voulez-vous restaurer cette vente ?",
                    onOk: async () => {
                      // Permission check inside onOk is good practice but redundant if button is hidden/disabled
                      if (!canDelete) return;
                      try {
                        await api.restoreVente(record.id);
                        await refreshSales();
                        message.success("Vente restaurée avec succès");
                      } catch (error) {
                        message.error("Erreur lors de la restauration");
                      }
                    },
                  })
                }
              >
                Restaurer
              </Button>
            ) : canDelete && record.paid_amount > 0 ? (
              // Cancel Button (if paid)
              <Button
                danger
                disabled={isCancelDisabled} // Disable if not paid
                onClick={() =>
                  Modal.confirm({
                    title: "Confirmation",
                    content:
                      "Cette vente contient des paiements. Voulez-vous l'annuler ?",
                    onOk: async () => {
                      if (!canDelete) return;
                      try {
                        await api.cancelVente(record.id);
                        await refreshSales();
                        message.success("Vente annulée avec succès");
                      } catch (error) {
                        message.error("Erreur lors de l'annulation");
                      }
                    },
                  })
                }
              >
                Annuler
              </Button>
            ) : (
              // Delete Button (if not paid and not deleted)
              canDelete && (
                <Button
                  danger
                  disabled={isDeleteDisabled} // Disable based on record status/flag
                  onClick={() => {
                    if (record.is_deletable === 0) {
                      message.error("Cette vente ne peut pas être supprimée");
                      return;
                    }
                    Modal.confirm({
                      title: "Confirmation",
                      content: "Voulez-vous vraiment supprimer cette vente ?",
                      onOk: async () => {
                        if (!canDelete) return;
                        try {
                          await api.deleteVente(record.id);
                          dispatch({
                            type: "DELETE_VENTE",
                            payload: record.id,
                          });
                          message.success("Vente supprimée avec succès");
                        } catch (error) {
                          message.error("Erreur lors de la suppression");
                        }
                      },
                    });
                  }}
                >
                  Supprimer
                </Button>
              )
            )}
            {/* Download Button */}
            {canDownload && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadInvoice(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  // Configuration pour les lignes expansibles
  const expandable = {
    expandedRowRender: (record: any) => {
      const items = record.produitsVendus || [];
      const detailColumns = [
        {
          title: "Produit",
          dataIndex: "product_id",
          key: "produit",
          render: (product_id: any, record: any): string => {
            const prod = state.produits.find(
              (p: Product) => Number(p.id_produit) === Number(product_id)
            );
            return prod ? prod.nom_produit : "Produit inconnu";
          },
        },
        {
          title: "Quantité",
          dataIndex: "quantity",
          key: "quantite",
        },
        {
          title: "Prix unitaire",
          dataIndex: "unit_price",
          key: "prix_unitaire",
          render: (value: any): string => `${formatNumber(value)} CFA`,
        },
        {
          title: "Remise",
          dataIndex: "discount_rate",
          key: "remise",
          render: (value: any): string => `${formatNumber(value || 0)} CFA`,
        },
        {
          title: "Taxe",
          dataIndex: "tax_id",
          key: "taxe",
          render: (tax_id: any): string => {
            if (!tax_id) return "Aucune";
            const tax = state.taxes.find((t: any) => t.id === tax_id);
            return tax ? `${tax.name} (${tax.rate}%)` : "Inconnue";
          },
        },
        {
          title: "Total",
          dataIndex: "subtotal",
          key: "total",
          render: (value: any): string => `${formatNumber(value)} CFA`,
        },
      ];
      return (
        <Table
          dataSource={items}
          columns={detailColumns}
          pagination={false}
          bordered
          size="small"
          rowKey={(record: any, index) =>
            record.id ? record.id.toString() : (index ?? 0).toString()
          }
        />
      );
    },
    onExpand: (expanded: boolean, record: any) => {
      if (expanded) {
        setExpandedRowKeys((prev) => [...prev, record.id]);
        loadVenteDetails(record);
      } else {
        setExpandedRowKeys((prev) => prev.filter((key) => key !== record.id));
      }
    },
    expandedRowKeys: expandedRowKeys,
  };

  // Ajouter company_id aux paramètres de recherche
  // SUPPRESSION du useEffect problématique qui causait une boucle infinie
  // Ce useEffect était en conflit avec refreshSales dans le composant parent
  // et appelait api.fetchVentes sans dispatcher le résultat

  // Modifier la fonction qui gère le clic sur le bouton de téléchargement
  const handleDownloadInvoice = async (record: any) => {
    // Permission Check: Assumes 'view' is sufficient for download
    if (!checkPermission(typedAuth, "Gestion Commerciale.Ventes.Ventes.view")) {
      message.error(
        "Vous n'avez pas la permission de télécharger les factures."
      );
      return;
    }
    try {
      setLoading(true);
      message.loading({
        content: "Préparation de la facture...",
        key: "invoice-loading",
      });

      // 1. Récupérer les détails complets de la vente
      const venteDetail = await api.fetchVenteDetail(record.id);
      console.log("Détails complets de la vente pour la facture:", venteDetail);

      // 2. Récupérer les items si nécessaire
      let produitsVendus = venteDetail.produitsVendus || [];
      if (!produitsVendus.length) {
        const orderItems = await api.fetchOrderItems(record.id);
        produitsVendus = orderItems;
      }

      // 3. Récupérer les détails complets des produits avec leurs unités
      try {
        const productIds = produitsVendus
          .map((p: any) => p.product_id)
          .filter(Boolean);

        if (productIds.length > 0) {
          const productDetails = await api.fetchProductDetails(productIds);
          console.log("Détails des produits récupérés:", productDetails);

          // Enrichir les produits vendus avec leurs détails complets
          produitsVendus = produitsVendus.map((produit: any) => {
            const details = productDetails.find(
              (p: any) => p.id === produit.product_id
            );
            if (details) {
              return {
                ...produit,
                unit_short_name: details.unit_short_name,
                unit_name: details.unit_name,
                product_name: details.name || produit.product_name,
              };
            }
            return produit;
          });

          console.log(
            "Produits vendus enrichis avec les détails des unités:",
            produitsVendus
          );
        }
      } catch (detailsError) {
        console.error(
          "Erreur lors de l'enrichissement des produits:",
          detailsError
        );
        // Continuer avec les données existantes
      }

      // 4. Récupérer les informations du magasin
      const warehouse = await api.fetchWarehouse(record.warehouse_id);
      console.log("Informations du magasin pour la facture:", warehouse);

      // 5. Récupérer les paiements associés à cette commande
      let payments = [];
      try {
        const response = await fetch(
          `${BASE_URL}/api/orders/${record.id}/payments`
        );
        if (response.ok) {
          payments = await response.json();
          console.log("Paiements récupérés pour la facture:", payments);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des paiements:", error);
        // Continuer sans les paiements
      }

      // 6. Préparer les données pour la facture
      const invoiceData = {
        ...venteDetail,
        produitsVendus,
        warehouse,
        payments, // Ajouter les paiements
        client: state.clients.find((c) => c.id === venteDetail.user_id),
      };

      // 7. Générer le HTML de la facture
      const invoiceHTML = generateInvoiceHTML({
        order: invoiceData,
        clientObj: invoiceData.client,
        warehouse: warehouse,
        paymentStatus: invoiceData.payment_status,
        montantVerse: invoiceData.paid_amount || 0,
        montantDu: invoiceData.due_amount || 0,
        totals: {
          subtotal: invoiceData.subtotal,
          totalDiscount: invoiceData.discount || 0,
          totalTax: invoiceData.tax_amount || 0,
          total: invoiceData.total,
        },
        formattedDate: dayjs(invoiceData.order_date).format("DD/MM/YYYY"),
        formatNumber,
      });

      // 8. Nom du fichier
      const fileName = `Facture_${invoiceData.invoice_number}.pdf`;

      // 9. Appeler l'API backend pour générer le PDF avec html-pdf-node
      try {
        // Utiliser fetch pour appeler l'endpoint avec le HTML complet
        const response = await fetch(
          `${BASE_URL}/api/orders/generate-sale-invoice-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              htmlContent: invoiceHTML,
              fileName: fileName,
            }),
          }
        );

        if (!response.ok) {
          // Si la réponse n'est pas OK, tenter d'extraire le message d'erreur
          let errorMessage = "Erreur serveur lors de la génération du PDF";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error("Impossible de parser l'erreur JSON:", e);
          }
          throw new Error(errorMessage);
        }

        // Récupérer le blob PDF
        const pdfBlob = await response.blob();

        // Créer une URL à partir du blob
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Créer un lien invisible et déclencher le téléchargement
        const downloadLink = document.createElement("a");
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(pdfUrl);
        }, 100);

        message.success({
          content: "Facture générée avec succès",
          key: "invoice-loading",
        });
      } catch (pdfError: unknown) {
        console.error("Erreur lors de la génération du PDF:", pdfError);
        message.error(
          "Erreur lors de la génération de la facture: " +
            (pdfError instanceof Error ? pdfError.message : "Erreur inconnue")
        );
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de la facture:", error);
      message.error({
        content: `Erreur lors du téléchargement de la facture: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        key: "invoice-loading",
      });
    } finally {
      setLoading(false);
    }
  };

  // Nouvelle fonction pour exporter les ventes vers Excel
  const handleExportToExcel = async () => {
    // Permission Check: Assume 'view' is sufficient for export
    if (!checkPermission(typedAuth, "Gestion Commerciale.Ventes.Ventes.view")) {
      message.error("Vous n'avez pas la permission d'exporter les ventes.");
      return;
    }
    try {
      setLoading(true);
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });

      // Utiliser les mêmes filtres que ceux appliqués actuellement au tableau
      const params: any = {
        order_type: "sales",
        page: 1,
        limit: 1000, // Limite élevée pour récupérer toutes les données
      };

      // Filtres appliqués
      const filtresAppliques: string[] = [];

      // Filtre de magasin (via RightSideNav)
      if (selectedWarehouse) {
        const warehouseId =
          typeof selectedWarehouse === "object"
            ? selectedWarehouse.id
            : selectedWarehouse;
        params.warehouse = warehouseId;
        filtresAppliques.push(`Magasin: ID ${warehouseId}`);
      }

      // Filtre de client
      if (state.selectedClient) {
        params.user_id = state.selectedClient.id;
        const clientName =
          state.selectedClient.name ||
          state.selectedClient.company_name ||
          state.selectedClient.Nom_Raison_Sociale ||
          `Client ID ${state.selectedClient.id}`;
        filtresAppliques.push(`Client: ${clientName}`);
      }

      // Filtre de recherche textuelle
      if (state.searchTerm) {
        params.search = state.searchTerm;
        filtresAppliques.push(`Recherche: "${state.searchTerm}"`);
      }

      // Filtre de plage de dates
      if (state.dateRange.start && state.dateRange.end) {
        params.dateDebut = state.dateRange.start;
        params.dateFin = state.dateRange.end;
        filtresAppliques.push(
          `Période: du ${state.dateRange.start} au ${state.dateRange.end}`
        );
      }

      // Filtre de statut de paiement (par onglet actif)
      if (state.activeTab !== "all") {
        let statusFilter = "";
        switch (state.activeTab) {
          case "unpaid":
            statusFilter = "Non payé";
            break;
          case "partially_paid":
            statusFilter = "Partiellement payé";
            break;
          case "paid":
            statusFilter = "Payé";
            break;
        }

        if (statusFilter) {
          params.payment_status = statusFilter;
          filtresAppliques.push(`Statut de paiement: ${statusFilter}`);
        }
      }

      // Filtre pour inclure ou non les ventes supprimées
      params.include_deleted = state.showDeleted ? "true" : "false";
      if (state.showDeleted) {
        filtresAppliques.push("Inclut les ventes supprimées");
      }

      console.log("Paramètres d'exportation:", params);
      console.log("Filtres appliqués:", filtresAppliques);

      // Récupérer les données filtrées
      const response = await fetch(
        `${BASE_URL}/api/orders?${new URLSearchParams(params).toString()}`
      );
      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const ventesToExport = data.orders || [];

      console.log(`${ventesToExport.length} ventes récupérées pour l'export`);

      // Si aucune vente trouvée, afficher un message et arrêter
      if (ventesToExport.length === 0) {
        message.warning({
          content: "Aucune vente trouvée avec les filtres appliqués",
          key: "exportLoading",
        });
        setLoading(false);
        return;
      }

      // Formater les données pour l'export
      const formattedData = ventesToExport.map((vente: any) => {
        // Trouver le client
        const client = state.clients.find((c) => c.id === vente.user_id);
        const clientName = client
          ? client.name ||
            client.company_name ||
            client.Nom_Raison_Sociale ||
            "Client inconnu"
          : "Client inconnu";

        return {
          Date: dayjs(vente.order_date).format("DD/MM/YYYY"),
          "N° Facture": vente.invoice_number,
          Client: clientName,
          Magasin: vente.warehouse_name || "Non spécifié",
          Statut: vente.order_status || "Non spécifié",
          "Statut paiement": vente.payment_status || "Non spécifié",
          "Montant HT": vente.subtotal || 0,
          Taxes: vente.tax_amount || 0,
          Remise: vente.discount || 0,
          "Montant total": vente.total || 0,
          "Montant payé": vente.paid_amount || 0,
          "Reste à payer": vente.due_amount || 0,
          Devise: "XOF",
        };
      });

      // Créer un classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");

      // Ajuster la largeur des colonnes
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 15 }, // N° Facture
        { wch: 25 }, // Client
        { wch: 20 }, // Magasin
        { wch: 15 }, // Statut
        { wch: 18 }, // Statut paiement
        { wch: 15 }, // Montant HT
        { wch: 15 }, // Taxes
        { wch: 15 }, // Remise
        { wch: 15 }, // Montant total
        { wch: 15 }, // Montant payé
        { wch: 15 }, // Reste à payer
        { wch: 8 }, // Devise
      ];
      worksheet["!cols"] = columnWidths;

      // Générer le fichier Excel
      const today = dayjs().format("YYYY-MM-DD");
      const filename = `Ventes_${today}.xlsx`;
      XLSX.writeFile(workbook, filename);

      // Afficher un message de succès avec les filtres appliqués
      const filtresMsg =
        filtresAppliques.length > 0
          ? `Filtres appliqués: ${filtresAppliques.join(", ")}`
          : "Aucun filtre appliqué";

      message.success({
        content: (
          <>
            <div>Export Excel réussi!</div>
            <div
              style={{ fontSize: "12px", marginTop: "5px" }}
            >{`${ventesToExport.length} ventes exportées dans "${filename}"`}</div>
            <div style={{ fontSize: "12px" }}>{filtresMsg}</div>
          </>
        ),
        key: "exportLoading",
        duration: 5, // Afficher le message plus longtemps
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      message.error({
        content: `Erreur lors de l'export Excel: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        key: "exportLoading",
      });
    } finally {
      setLoading(false);
    }
  };

  // Define handleMultipleDelete function
  const handleMultipleDelete = () => {
    // Permission Check
    if (
      !checkPermission(typedAuth, "Gestion Commerciale.Ventes.Ventes.delete")
    ) {
      message.error("Vous n'avez pas la permission de supprimer des ventes.");
      return;
    }
    if (state.selectedVenteIds.length === 0) return;

    Modal.confirm({
      title: `Êtes-vous sûr de vouloir supprimer ${state.selectedVenteIds.length} vente(s) ?`,
      content: "Cette action est irréversible.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        try {
          setLoading(true);
          // Use Promise.all to delete multiple ventes in parallel
          const deletePromises = state.selectedVenteIds.map((id) =>
            api.deleteVente(id)
          );
          await Promise.all(deletePromises);
          message.success(
            `${state.selectedVenteIds.length} vente(s) supprimée(s) avec succès`
          );
          // Clear selected IDs
          dispatch({ type: "CLEAR_SELECTED_VENTE_IDS" });
          // Refresh sales list
          await refreshSales();
        } catch (error) {
          console.error("Erreur lors de la suppression des ventes:", error);
          message.error("Erreur lors de la suppression des ventes");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Multiple Delete Button */}
        {checkPermission(
          typedAuth,
          "Gestion Commerciale.Ventes.Ventes.delete"
        ) &&
          state.selectedVenteIds.length > 0 && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleMultipleDelete}
            >
              Supprimer ({state.selectedVenteIds.length})
            </Button>
          )}
        {/* Spacer or adjust layout if needed when delete button isn't shown */}
        {state.selectedVenteIds.length === 0 && <div />}

        {/* Export Button */}
        {checkPermission(
          typedAuth,
          "Gestion Commerciale.Ventes.Ventes.view"
        ) && (
          <Button
            icon={<FileExcelOutlined style={{ color: "#217346" }} />}
            onClick={handleExportToExcel}
          >
            Exporter sur Excel
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        {" "}
        {/* Added overflow-x-auto to this div */}
        <Table
          dataSource={state.ventes}
          columns={columns}
          rowKey="id"
          scroll={{ x: "max-content" }} // Added scroll prop
          expandable={expandable}
          pagination={{
            current: state.currentPage,
            pageSize: state.itemsPerPage,
            total: state.totalPages * state.itemsPerPage,
            onChange: (page) => {
              dispatch({ type: "SET_PAGE", payload: page });
            },
            onShowSizeChange: (current, size) => {
              dispatch({ type: "SET_ITEMS_PER_PAGE", payload: size });
              dispatch({ type: "SET_PAGE", payload: 1 }); // Revenir à la première page après changement de taille
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} ventes`,
            pageSizeOptions: ["10", "20", "50", "100"],
            position: ["bottomRight"],
          }}
          sortDirections={["descend", "ascend"]}
        />
      </div>

      {/* Modalités pour les détails de la vente et autres fonctionnalités à ajouter */}
      <VenteDetailModal
        order={detailVente}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        produits={state.produits}
        taxes={state.taxes}
        clients={state.clients}
        refreshOrderDetails={loadVenteDetailsForModal}
        refreshSales={refreshSales}
      />

      {state.showForm && (
        <VenteForm
          visible={state.showForm}
          onClose={() => dispatch({ type: "TOGGLE_FORM", payload: false })}
          refreshSales={refreshSales}
        />
      )}

      {/* Composant pour générer et télécharger les factures */}
      {invoiceData && (
        <InvoicePDF
          order={invoiceData}
          clients={state.clients}
          produits={state.produits}
          taxes={state.taxes}
          companyName={warehouseData?.name || "ELSA Technologies"}
          warehouseName={warehouseData?.name || "ELSA Technologies"}
          warehouse={invoiceData.warehouse || warehouseData}
        />
      )}
    </>
  );
};

const GestionVentes: React.FC = () => {
  const [state, dispatch] = useReducer(ventesReducer, initialState);
  const { selectedWarehouse, selectedCompany } = useSelection();
  const { taxes } = useTaxes(api);
  const BASE_URL = "http://localhost:3000";
  // Get auth at the top level to pass down via context
  const auth = useAuth();

  // État pour les clients filtrés par magasin (pour le filtre principal)
  const [filteredClientsForFilter, setFilteredClientsForFilter] = useState<
    any[]
  >([]);

  // IMPORTANT: Move all hooks before any conditionals
  useEffect(() => {
    dispatch({ type: "SET_TAXES", payload: taxes });
  }, [taxes]);

  // Filtrer les clients pour le filtre principal basé sur le magasin sélectionné
  useEffect(() => {
    if (selectedWarehouse && state.clients.length > 0) {
      const filtered = state.clients.filter(
        (client) =>
          !client.warehouse_id || client.warehouse_id === selectedWarehouse
      );
      console.log(
        `Clients filtrés pour le filtre principal (magasin ${selectedWarehouse}):`,
        filtered.length
      );
      setFilteredClientsForFilter(filtered);
    } else {
      setFilteredClientsForFilter(state.clients);
    }
  }, [selectedWarehouse, state.clients]);

  // Combined useEffect for fetching data based on warehouse/company changes
  useEffect(() => {
    // console.log(
    //   "Warehouse or Company changed:",
    //   selectedWarehouse,
    //   selectedCompany
    // );
    const warehouseId = selectedWarehouse?.id ?? selectedWarehouse; // Handle object or ID
    const companyId = selectedCompany?.id ?? selectedCompany;

    if (warehouseId) {
      // Fetch initial clients and products for the selected warehouse
      const loadInitialData = async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          const [clientsResponse, produitsResponse, summaryResponse] =
            await Promise.all([
              api.fetchClients(), // Consider filtering clients by warehouse/company backend if possible
              api.fetchProduits({
                limit: 1000, // Still loading products for the form
                warehouse: warehouseId,
              }),
              // Fetch global totals
              api.fetchSalesSummary(warehouseId, companyId),
            ]);

          // console.log(
          //   `Chargement initial des produits pour le magasin ${warehouseId}`
          // );
          dispatch({ type: "SET_CLIENTS", payload: clientsResponse });
          dispatch({ type: "SET_PRODUITS", payload: produitsResponse.data });
          // Update global totals state
          dispatch({
            type: "SET_GLOBAL_TOTALS",
            payload: {
              revenue: summaryResponse.totalRevenue,
              paid: summaryResponse.totalPaid,
            },
          });
        } catch (error) {
          console.error(
            "Erreur lors du chargement initial des données:",
            error
          );
          dispatch({
            type: "SET_ERROR",
            payload: "Erreur lors du chargement des données initiales.",
          });
          message.error("Erreur lors du chargement des données.");
          // Reset totals on error
          dispatch({
            type: "SET_GLOBAL_TOTALS",
            payload: { revenue: 0, paid: 0 },
          });
        } finally {
          // Defer setting loading to false until sales are also loaded
          // dispatch({ type: 'SET_LOADING', payload: false });
        }
      };
      loadInitialData();
    } else {
      // Reset lists and totals if no warehouse is selected
      dispatch({ type: "SET_CLIENTS", payload: [] });
      dispatch({ type: "SET_PRODUITS", payload: [] });
      dispatch({ type: "SET_VENTES", payload: { ventes: [], total: 0 } });
      dispatch({
        type: "SET_GLOBAL_TOTALS",
        payload: { revenue: 0, paid: 0 },
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [selectedWarehouse, selectedCompany]); // Depend on selectedWarehouse and selectedCompany

  const refreshSales = useCallback(async () => {
    const warehouseId = selectedWarehouse?.id ?? selectedWarehouse;
    const companyId = selectedCompany?.id ?? selectedCompany;

    if (!warehouseId) {
      // console.log("refreshSales skipped: No warehouse selected");
      dispatch({ type: "SET_VENTES", payload: { ventes: [], total: 0 } });
      return; // Don't fetch sales if no warehouse
    }

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const params: any = {
        page: state.currentPage,
        limit: state.itemsPerPage,
        Numero_Facture: state.searchTerm,
        warehouse: warehouseId,
        company_id: companyId, // Include companyId
        include_deleted: state.showDeleted ? "true" : "false",
        // Add default sorting for the list view
        sort_by: "order_date",
        order: "desc",
      };

      // ... (rest of the refreshSales logic for filters) ...
      if (state.selectedClient) {
        params.user_id = state.selectedClient.id;
      }
      if (state.dateRange.start) params.dateDebut = state.dateRange.start;
      if (state.dateRange.end) params.dateFin = state.dateRange.end;
      if (state.activeTab === "unpaid") params.payment_status = "Non payé";
      if (state.activeTab === "partially_paid")
        params.payment_status = "Partiellement payé";
      if (state.activeTab === "paid") params.payment_status = "Payé";

      // console.log("Paramètres de rafraîchissement des ventes:", params);

      const response = await api.fetchVentes(params);
      dispatch({
        type: "SET_VENTES",
        payload: { ventes: response.data, total: response.total },
      });
    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Erreur lors du chargement des ventes",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.currentPage,
    state.itemsPerPage,
    state.searchTerm,
    state.selectedClient,
    state.dateRange,
    state.showDeleted,
    state.activeTab,
    selectedWarehouse,
    selectedCompany,
    // dispatch retiré car c'est une fonction stable de useReducer
  ]);

  // useEffect to trigger refreshSales when filters change
  useEffect(() => {
    // console.log(
    //   "Déclenchement du refreshSales (filters):",
    //   state.activeTab, // etc.
    //   selectedWarehouse
    // );
    refreshSales();
  }, [
    // Seulement inclure refreshSales comme dépendance
    // Toutes les autres dépendances sont déjà dans refreshSales
    refreshSales,
  ]);

  // Conditional return AFTER all hooks are defined
  // Check if auth context has finished loading
  if (!auth) {
    return <Spin tip="Chargement de l'authentification..."></Spin>;
  }

  // Typons correctement l'objet auth pour éviter les erreurs TypeScript
  const typedAuth = auth as AuthContextType;

  // Vérifions si l'utilisateur est chargé
  if (!typedAuth.user) {
    return <Spin tip="Chargement des informations utilisateur..."></Spin>;
  }

  // Version débogage: afficher les permissions disponibles
  // console.debug("User permissions:", typedAuth.user.permissions);

  // Now safely check permissions after loading - sans utiliser @ts-ignore
  const canCreate = checkPermission(
    typedAuth,
    "Gestion Commerciale.Ventes.Ventes.create"
  );
  // View permission is fundamental for the component
  const canView = checkPermission(
    typedAuth,
    "Gestion Commerciale.Ventes.Ventes.view"
  );
  // View deleted permission (using view for now)
  const canViewDeleted = canView; // Or potentially delete permission if required

  const openVenteForm = () => {
    // Permission check before opening form
    if (!canCreate) {
      message.error("Vous n'avez pas la permission de créer une vente.");
      return;
    }

    // Original logic for openVenteForm
    const warehouseId = selectedWarehouse?.id ?? selectedWarehouse;
    if (!warehouseId) {
      Modal.warning({
        title: "Sélection requise",
        content: "Veuillez sélectionner un magasin avant de créer une vente.",
      });
      return;
    }
    // Reset form data with current context
    dispatch({
      type: "SET_FORM_DATA",
      payload: {
        ...initialState.formData,
        Date_Facture: dayjs().format("YYYY-MM-DD"),
        Statut_Vente: "Completé",
        Client_ID: "", // Ensure client is reset
        produitsVendus: [],
        remise_globale: 0,
      },
    });
    dispatch({ type: "TOGGLE_FORM", payload: true });
  };

  const handleTabChange = (activeKey: string) => {
    // No permission check needed to change tabs
    console.log("Tab changed to:", activeKey);
    dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey });
  };

  // If user doesn't even have view permission, show a message or redirect
  if (!canView) {
    return (
      <Layout>
        <Layout.Content style={{ padding: "24px", textAlign: "center" }}>
          <Card>
            <p>
              Vous n'avez pas la permission de visualiser le module de gestion
              des ventes.
            </p>
            {/* Optionally add a button to go back or contact admin */}
          </Card>
        </Layout.Content>
      </Layout>
    );
  }

  return (
    // Pass auth down through the context
    <VentesContext.Provider value={{ state, dispatch, api, auth: typedAuth }}>
      <Layout>
        <Layout.Content style={{ padding: "16px" }} className="p-sm md:p-md">
          {/* Main Header Row for actions and filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md mb-md">
            {/* Left/Center Section: Button and Filters */}
            <div className="w-full lg:w-auto flex flex-col gap-md flex-grow">
              {/* Create Button */}
              {canCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openVenteForm}
                  className="w-full sm:w-auto lg:max-w-xs" // Responsive width
                >
                  Nouvelle vente
                </Button>
              )}
              {/* Filters - Updated structure for horizontal alignment on md+ */}
              {canView && (
                <div className="flex flex-col md:flex-row gap-sm items-center">
                  <Input
                    placeholder="Rechercher par numéro de facture..."
                    prefix={<SearchOutlined />}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_SEARCH",
                        payload: e.target.value.trim(),
                      })
                    }
                    className="w-full md:flex-1 lg:max-w-md"
                  />
                  <Select
                    placeholder="Client"
                    allowClear
                    onChange={(value: number) => {
                      const selectedClient = filteredClientsForFilter.find(
                        (c) => c.id === value
                      );
                      dispatch({
                        type: "SET_SELECTED_CLIENT",
                        payload: selectedClient,
                      });
                    }}
                    className="w-full md:flex-1 lg:max-w-xs"
                  >
                    {filteredClientsForFilter.map((client) => (
                      <Option key={client.id} value={client.id}>
                        {client.name ||
                          client.company_name ||
                          client.Nom_Raison_Sociale ||
                          "Client inconnu"}
                      </Option>
                    ))}
                  </Select>
                  <RangePicker
                    onChange={(dates, dateStrings) =>
                      dispatch({
                        type: "SET_DATE_RANGE",
                        payload: {
                          start: dateStrings[0] || "",
                          end: dateStrings[1] || "",
                        },
                      })
                    }
                    className="w-full md:flex-1 lg:max-w-md"
                  />
                </div>
              )}
            </div>

            {/* Right Section: Indicators Card - REMOVED */}
            {/* {canView && (
              <div className="w-full lg:w-auto lg:max-w-sm xl:max-w-md">
                <Card
                  size="small"
                  bordered={false}
                  className="bg-gray-50 rounded-lg w-full"
                >
                  <Row gutter={[16, 8]}> 
                    <Col xs={24} sm={12}>
                      <Statistic
                        title="CA Global Magasin"
                        value={formatNumber(state.globalTotalRevenue)}
                        suffix="CFA"
                        valueStyle={{ fontSize: "1rem" }} 
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic
                        title="Payé Global Magasin"
                        value={formatNumber(state.globalTotalPaid)}
                        suffix="CFA"
                        valueStyle={{ fontSize: "1rem" }}
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
            )} */}
          </div>

          {/* Tabs */}
          {canView && (
            <Tabs
              activeKey={state.activeTab}
              onChange={handleTabChange}
              className="mb-md"
            />
          )}

          {/* Show/Hide Deleted Button */}
          {canViewDeleted && (
            <div className="mb-md">
              <Button
                type={state.showDeleted ? "primary" : "default"}
                onClick={() => {
                  dispatch({
                    type: "TOGGLE_SHOW_DELETED",
                    payload: !state.showDeleted,
                  });
                }}
                className="w-full sm:w-auto"
              >
                {state.showDeleted
                  ? "Masquer les ventes supprimées"
                  : "Afficher les ventes supprimées"}
              </Button>
            </div>
          )}

          {/* Loading or Table */}
          {state.loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            // Render table only if user has view permission
            canView && <VentesTable refreshSales={refreshSales} />
          )}
        </Layout.Content>
      </Layout>
    </VentesContext.Provider>
  );
};

export default GestionVentes;
