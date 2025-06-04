// src/gestion-proforma/GestionProforma.tsx
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
  Descriptions,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  QrcodeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTaxes } from "../gestion-vente/useTaxes";
import { useSelection } from "../SelectionContext";
import { debounce } from "lodash";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
// Importations supplémentaires pour la génération PDF
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { generateProformaHTML } from "./ProformaHTMLTemplate";
// Ajouter l'import de html2pdf en haut du fichier si non présent
import html2pdf from "html2pdf.js";
import { useAuth } from "../context/AuthContext"; // Import useAuth hook
import type { TableProps } from "antd"; // Added import for TableProps

const { Option } = Select;
const { RangePicker } = DatePicker;

// Utilitaires et constantes
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

interface ProformaFormData {
  id?: number;
  invoice_number?: string;
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

interface ProformasState {
  proformas: any[];
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
  formData: ProformaFormData;
  showDeleted: boolean;
  activeTab: string;
}

type ProformasAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PROFORMAS"; payload: { proformas: any[]; total: number } }
  | { type: "DELETE_PROFORMA"; payload: number }
  | { type: "SET_CLIENTS"; payload: any[] }
  | { type: "SET_PRODUITS"; payload: Product[] }
  | { type: "SET_TAXES"; payload: any[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: DateRange }
  | { type: "SET_SELECTED_CLIENT"; payload: any }
  | { type: "TOGGLE_FORM"; payload: boolean }
  | { type: "SET_FORM_DATA"; payload: ProformaFormData }
  | { type: "UPDATE_FORM_DATA"; payload: ProformaFormData }
  | { type: "TOGGLE_SHOW_DELETED"; payload: boolean }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "RESET_FORM_DATA" }
  | {
      type: "UPDATE_PROFORMA_DETAIL";
      payload: { id: number; produitsVendus: ProduitVendu[] };
    };

const sectionStyle = {
  border: "1px solid #ccc",
  padding: "16px",
  borderRadius: "4px",
  marginBottom: "16px",
};

const BASE_URL = "http://localhost:3000";

const api = {
  async fetchProformas(params: any) {
    try {
      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append("order_type", "proforma");
      queryParams.append("page", params.page || "1");
      queryParams.append("limit", params.limit || "10");

      if (params.search) {
        queryParams.append("search", params.search);
      }

      if (params.client_id) {
        queryParams.append("user_id", params.client_id);
      }

      if (params.start_date && params.end_date) {
        queryParams.append("start_date", params.start_date);
        queryParams.append("end_date", params.end_date);
      }

      if (params.warehouse_id) {
        queryParams.append("warehouse", params.warehouse_id);
      }

      if (params.show_deleted) {
        queryParams.append("deleted", "1");
      }

      if (params.status) {
        queryParams.append("status", params.status);
      }

      // Effectuer la requête
      const url = `${BASE_URL}/api/orders?${queryParams.toString()}`;
      console.log("URL de récupération des proformas:", url);
      console.log("Paramètres de filtrage envoyés:", {
        warehouse_id: params.warehouse_id,
        order_type: "proforma",
        page: params.page,
        limit: params.limit,
      });

      // Log supplémentaire pour vérifier l'ID du magasin
      console.log(
        `🔍 Requête pour filtrer les proformas du magasin ID: ${params.warehouse_id}`
      );

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();

      // Vérifier si nous avons bien reçu l'objet attendu
      if (!data || !data.orders || !Array.isArray(data.orders)) {
        console.error("Format de réponse inattendu:", data);
        throw new Error("Format de réponse inattendu");
      }

      // Vérifier que toutes les proformas appartiennent bien au magasin sélectionné
      console.log(
        `Proformas récupérées: ${data.orders.length} pour le magasin ID ${params.warehouse_id}`
      );
      const proformasFromOtherWarehouses = data.orders.filter(
        (proforma: any) =>
          proforma.warehouse_id && proforma.warehouse_id !== params.warehouse_id
      );

      if (proformasFromOtherWarehouses.length > 0) {
        console.warn(
          "⚠️ Des proformas d'autres magasins ont été récupérées:",
          proformasFromOtherWarehouses
        );
      } else {
        console.log(
          "✅ Toutes les proformas appartiennent bien au magasin sélectionné"
        );
      }

      // Traiter les données reçues pour identifier les proformas converties
      data.orders.forEach((proforma: any) => {
        // Vérifier si cette proforma a déjà été convertie
        if (proforma.converted_to_sale || proforma.sale_id) {
          console.log(
            `Proforma #${proforma.id} déjà convertie en vente #${proforma.sale_id}`
          );
        }
      });

      return {
        proformas: data.orders,
        total: data.pagination?.total || data.orders.length,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des proformas:", error);
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
      console.log("Clients récupérés:", data);
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
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      throw error;
    }
  },

  async fetchTaxes() {
    try {
      const response = await fetch(`${BASE_URL}/api/taxes`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data.taxes;
    } catch (error) {
      console.error("Erreur lors de la récupération des taxes:", error);
      throw error;
    }
  },

  async createProforma(data: any) {
    try {
      // Générer un numéro de proforma personnalisé
      // Format: PRF-{YEAR}{MONTH}-{SEQUENTIAL_NUMBER}
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString().substr(-2); // Derniers 2 chiffres de l'année
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Mois sur 2 chiffres

      // Récupérer le dernier numéro de proforma pour incrémenter le compteur
      const lastProformas = await this.fetchProformas({
        limit: 1,
        order_type: "proforma",
        invoice_type: "standard",
      });

      let sequentialNumber = 1;
      if (
        lastProformas &&
        lastProformas.proformas &&
        lastProformas.proformas.length > 0
      ) {
        // Chercher d'abord un numéro commençant par PRF-
        const lastProformaWithPRF = lastProformas.proformas.find(
          (p: any) => p.invoice_number && p.invoice_number.startsWith("PRF-")
        );

        if (lastProformaWithPRF) {
          const match =
            lastProformaWithPRF.invoice_number.match(/PRF-\d{4}-(\d+)/);
          if (match && match[1]) {
            sequentialNumber = parseInt(match[1], 10) + 1;
          }
        } else {
          // Si aucun numéro ne commence par PRF-, prendre le dernier numéro de facture et ajouter 1
          sequentialNumber = lastProformas.proformas.length + 1;
        }
      }

      // Formater le numéro séquentiel avec des zéros à gauche (ex: 001, 010, 100)
      const formattedSequentialNumber = String(sequentialNumber).padStart(
        3,
        "0"
      );

      // Construire le numéro final de proforma
      const proformaNumber = `PRF-${year}${month}-${formattedSequentialNumber}`;

      // Convertir les données au format attendu par l'API de commandes
      const orderData = {
        company_id: data.company_id || 1, // Utiliser la valeur de l'entreprise du contexte si disponible
        warehouse_id: data.warehouse_id,
        order_date: data.Date_Facture,
        order_type: "proforma", // Type de commande (maintenant utilisé pour identifier les proformas)
        invoice_type: "standard", // Type de facture (maintenant standard pour les proformas)
        invoice_number: proformaNumber, // Utiliser notre numéro personnalisé
        user_id: Number(data.Client_ID), // Forcer la conversion en nombre
        discount: data.remise_globale || 0,
        notes: data.remarques || "",
        terms_condition: data.termes_conditions || "",
        order_status: data.Statut_Vente || "Commandé",
        payment_status: "Non applicable", // Pas de paiement pour les proformas
        tax_amount: data.Montant_Taxe || 0,
        tax_rate: 0,
        shipping: 0,
        subtotal: data.Montant_Total_HT || 0,
        total: data.Montant_TTC || 0,
        paid_amount: 0,
        due_amount: 0, // Pas de montant dû pour les proformas
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
          subtotal: p.prix_unitaire_HT * p.quantite,
        })),
      };

      console.log("Données formatées pour création de proforma:", orderData);

      // Appel API pour créer la proforma
      const response = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la création: ${errorText}`);
      }

      const result = await response.json();
      console.log("Résultat de la création de proforma:", result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la création de la proforma:", error);
      throw error;
    }
  },

  async updateProforma(id: number, data: any) {
    try {
      // Récupérer les détails de la proforma existante pour obtenir le numéro de facture
      const existingProforma = await this.fetchProformaDetail(id.toString());

      // Convertir les données au format attendu par l'API de commandes
      const orderData = {
        company_id: data.company_id || 1,
        warehouse_id: data.warehouse_id,
        order_date: data.Date_Facture,
        order_type: "proforma", // Type de commande maintenant utilisé pour identifier les proformas
        invoice_type: "standard", // Type de facture maintenant standard pour les proformas
        invoice_number: existingProforma.invoice_number, // Conserver le numéro existant
        user_id: Number(data.Client_ID),
        discount: data.remise_globale || 0,
        notes: data.remarques || "",
        terms_condition: data.termes_conditions || "",
        order_status: data.Statut_Vente || "Commandé",
        payment_status: "Non applicable", // Pas de paiement pour les proformas
        tax_amount: data.Montant_Taxe || 0,
        tax_rate: 0,
        shipping: 0,
        subtotal: data.Montant_Total_HT || 0,
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
          subtotal: p.prix_unitaire_HT * p.quantite,
        })),
      };

      console.log("Données formatées pour mise à jour de proforma:", orderData);

      const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la mise à jour: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la proforma:", error);
      throw error;
    }
  },

  async deleteProforma(id: number) {
    try {
      // Modification de la méthode de PATCH à DELETE et de l'URL
      const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la suppression de la proforma:", error);
      throw error;
    }
  },

  async fetchProformaDetail(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();

      // Vérifier que c'est bien une proforma
      if (data && data.order_type !== "proforma") {
        console.error("La commande récupérée n'est pas une proforma:", data);
        throw new Error("La commande récupérée n'est pas une proforma");
      }

      return data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du détail de la proforma:",
        error
      );
      throw error;
    }
  },

  async fetchOrderItems(orderId: string) {
    try {
      // Récupérer les éléments de la commande
      const response = await fetch(`${BASE_URL}/api/orders/${orderId}/items`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const items = await response.json();

      // Enrichir les produits avec leurs noms si nécessaire
      if (items && items.length > 0) {
        try {
          // Extraire les IDs des produits
          const productIds = items
            .map((item: any) => item.product_id)
            .filter(Boolean);

          if (productIds.length > 0) {
            // Récupérer les détails des produits
            const productResponse = await fetch(
              `${BASE_URL}/api/produits?ids=${productIds.join(",")}`
            );
            if (productResponse.ok) {
              const productData = await productResponse.json();

              if (
                productData &&
                productData.products &&
                Array.isArray(productData.products)
              ) {
                // Créer un dictionnaire pour un accès rapide aux détails des produits
                const productDetails: { [key: number]: any } = {};
                productData.products.forEach((product: any) => {
                  productDetails[product.id] = product;
                });

                // Enrichir chaque élément avec le nom du produit
                items.forEach((item: any) => {
                  if (item.product_id && productDetails[item.product_id]) {
                    item.product_name =
                      productDetails[item.product_id].name ||
                      `Produit #${item.product_id}`;
                  }
                });
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'enrichissement des produits:", error);
          // Continue avec les données non-enrichies
        }
      }

      return items;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de la commande:",
        error
      );
      throw error;
    }
  },

  async fetchWarehouses() {
    try {
      const response = await fetch(`${BASE_URL}/api/warehouses`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data.warehouses;
    } catch (error) {
      console.error("Erreur lors de la récupération des magasins:", error);
      throw error;
    }
  },

  async restoreProforma(id: number) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}/restore`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la restauration de la proforma:", error);
      throw error;
    }
  },

  async cancelProforma(id: number) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}/cancel`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de l'annulation de la proforma:", error);
      throw error;
    }
  },

  async fetchWarehouse(id: number) {
    try {
      const response = await fetch(`${BASE_URL}/api/warehouses/${id}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du magasin ID=${id}:`,
        error
      );
      throw error;
    }
  },

  async convertToSale(id: number) {
    try {
      // Faire une demande directe au backend pour convertir la proforma en vente
      // Le backend s'occupera de tous les aspects de la conversion
      console.log(`Demande de conversion de la proforma ${id} en vente...`);

      const response = await fetch(
        `${BASE_URL}/api/orders/${id}/convert-to-sale`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la conversion: ${errorText}`);
      }

      const result = await response.json();
      console.log("Résultat de la conversion:", result);

      return {
        id: result.saleId,
        orderId: result.saleId,
        invoice_number: result.invoice_number,
        message: result.message,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la conversion de proforma en vente:",
        error
      );
      throw error;
    }
  },

  async fetchProductDetails(productIds: number[]) {
    try {
      if (!productIds || productIds.length === 0) {
        return [];
      }

      console.log(
        `Récupération des détails pour les produits: ${productIds.join(", ")}`
      );

      // Convertir le tableau d'IDs en chaîne pour l'URL
      const idsParam = productIds.join(",");
      const response = await fetch(`${BASE_URL}/api/produits?ids=${idsParam}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.products || !Array.isArray(data.products)) {
        console.error("Format de réponse invalide pour les produits:", data);
        return [];
      }

      // Enrichir les produits avec les attributs nécessaires pour notre interface
      const enrichedProducts = data.products.map((product: any) => ({
        ...product,
        id_produit: product.id, // Assurer la compatibilité avec notre interface
        nom_produit: product.name || `Produit #${product.id}`, // Assurer que le nom est toujours disponible
      }));

      return enrichedProducts;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails des produits:",
        error
      );
      return [];
    }
  },
};

const initialState: ProformasState = {
  proformas: [],
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
    Date_Facture: new Date().toISOString().split("T")[0],
    Statut_Vente: "Commandé",
    Client_ID: "",
    produitsVendus: [],
    remise_globale: 0,
    termes_conditions: "",
    remarques: "",
  },
  showDeleted: false,
  activeTab: "all",
};

const proformasReducer = (
  state: ProformasState,
  action: ProformasAction
): ProformasState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PROFORMAS":
      return {
        ...state,
        proformas: action.payload.proformas,
        totalPages: Math.ceil(action.payload.total / state.itemsPerPage),
      };
    case "DELETE_PROFORMA":
      return {
        ...state,
        proformas: state.proformas.filter((p) => p.id !== action.payload),
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
      return {
        ...state,
        showForm: action.payload,
      };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "UPDATE_FORM_DATA":
      return { ...state, formData: action.payload };
    case "TOGGLE_SHOW_DELETED":
      return { ...state, showDeleted: action.payload, currentPage: 1 };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload, currentPage: 1 };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload };
    case "RESET_FORM_DATA":
      return {
        ...state,
        formData: {
          Date_Facture: new Date().toISOString().split("T")[0],
          Statut_Vente: "Commandé",
          Client_ID: "",
          produitsVendus: [],
          remise_globale: 0,
          termes_conditions: "",
          remarques: "",
        },
      };
    case "UPDATE_PROFORMA_DETAIL":
      return {
        ...state,
        proformas: state.proformas.map((p) =>
          p.id === action.payload.id
            ? { ...p, produitsVendus: action.payload.produitsVendus }
            : p
        ),
      };
    default:
      return state;
  }
};

const ProformasContext = createContext<{
  state: ProformasState;
  dispatch: React.Dispatch<ProformasAction>;
  api: typeof api;
} | null>(null);

interface ProformaFormProps {
  visible: boolean;
  onClose: () => void;
  refreshProformas: () => Promise<void>;
  onAfterSave?: () => void;
}

const ProformaForm: React.FC<ProformaFormProps> = ({
  visible,
  onClose,
  refreshProformas,
  onAfterSave,
}) => {
  const { state, dispatch, api } = useContext(ProformasContext)!;
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState("");
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [barcodeVisible, setBarcodeVisible] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const { selectedWarehouse, selectedCompany } = useSelection();

  // useEffect simplifié pour initialiser le formulaire
  useEffect(() => {
    if (visible) {
      console.log("Formulaire ouvert, formData:", state.formData);

      if (state.formData.id) {
        // Mode édition - Charger les données de la proforma
        console.log("Mode édition - Chargement des données:", state.formData);
        form.setFieldsValue({
          Date_Facture: dayjs(state.formData.Date_Facture),
          Statut_Vente: state.formData.Statut_Vente,
          Client_ID: parseInt(state.formData.Client_ID), // Convertir en nombre pour correspondre aux valeurs du Select
          remise_globale: state.formData.remise_globale,
          termes_conditions: state.formData.termes_conditions,
          remarques: state.formData.remarques,
        });
      } else {
        // Mode création - Valeurs par défaut
        console.log("Mode création - Initialisation du formulaire");
        form.setFieldsValue({
          Date_Facture: dayjs(),
          Statut_Vente: "Commandé",
          Client_ID: undefined,
          remise_globale: 0,
          termes_conditions: "",
          remarques: "",
        });
      }
    }
  }, [visible, state.formData, form]);

  // Filtrer les clients en fonction du magasin sélectionné
  const filteredClients = state.clients.filter((client: any) => {
    // Si pas de magasin sélectionné, montrer tous les clients
    if (!selectedWarehouse) return true;

    // Si le client n'a pas de détail de magasin, ne pas le montrer
    if (!client.detail_warehouse_id) return false;

    // Vérifier si le client appartient au magasin sélectionné
    return client.detail_warehouse_id === selectedWarehouse;
  });

  const onFinish = async (values: any) => {
    // Vérification des données requises
    if (!selectedWarehouse) {
      message.error(
        "Veuillez sélectionner un magasin dans la barre de navigation"
      );
      return;
    }

    if (!selectedCompany) {
      message.error(
        "Veuillez sélectionner une entreprise dans la barre de navigation"
      );
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
      const mappedProduitsVendus = state.formData.produitsVendus.map((p) => {
        const base = p.prix_unitaire_HT * p.quantite;
        const taxRate = p.taxe
          ? Number(state.taxes.find((t: any) => t.id === p.taxe)?.rate || 0)
          : 0;
        const montant_taxe = (base * taxRate) / 100;
        return {
          ...p,
          taxe: p.taxe ? Number(p.taxe) : null,
          montant_taxe: Number(montant_taxe) || 0,
          prix_unitaire_HT: Number(p.prix_unitaire_HT) || 0,
          quantite: Number(p.quantite) || 0,
          remise: Number(p.remise || 0),
        };
      });

      const totalTax = mappedProduitsVendus.reduce(
        (sum, p) => sum + (p.montant_taxe || 0),
        0
      );
      const montantTotalHT = mappedProduitsVendus.reduce(
        (sum, p) => sum + (p.prix_unitaire_HT || 0) * (p.quantite || 0),
        0
      );
      const totalRemisesCalc =
        mappedProduitsVendus.reduce((sum, p) => sum + (p.remise || 0), 0) +
        (values.remise_globale || 0);

      const montantTTC =
        Number(montantTotalHT) - Number(totalRemisesCalc) + Number(totalTax);

      const dataToSubmit = {
        ...values,
        Date_Facture: values.Date_Facture.format("YYYY-MM-DD"),
        produitsVendus: mappedProduitsVendus,
        Montant_Total_HT: montantTotalHT,
        Montant_TTC: montantTTC,
        Montant_Taxe: totalTax,
        warehouse_id: selectedWarehouse,
        company_id: selectedCompany,
      };

      console.log("Données formulaire à soumettre:", dataToSubmit);

      setLoading(true);

      // Si le formulaire a un ID, c'est une mise à jour
      if (state.formData.id) {
        const result = await api.updateProforma(
          state.formData.id,
          dataToSubmit
        );
        if (result) {
          message.success("Proforma mise à jour avec succès");
        }
      } else {
        // Sinon, c'est une création
        const result = await api.createProforma(dataToSubmit);
        if (result) {
          message.success("Proforma créée avec succès");
        }
      }

      await refreshProformas();

      // Déclencher le rafraîchissement des détails si c'est une modification
      if (state.formData.id && onAfterSave) {
        onAfterSave();
      }

      onClose();
    } catch (error: any) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      message.error(
        error.message || "Erreur lors de la soumission du formulaire"
      );
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (value: string) => {
    if (!value || value.length < 2) {
      setProductOptions([]);
      return;
    }

    try {
      const response = await api.fetchProduits({
        search: value,
        warehouse: selectedWarehouse,
      });

      console.log("Résultats de recherche de produits:", response);

      if (response && response.products) {
        const options = response.products.map((product: any) => ({
          value: product.id,
          label: `${product.name} - ${product.sales_price || 0} FCFA`,
          product,
        }));
        setProductOptions(options);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche de produits:", error);
    }
  };

  const debouncedSearch = useCallback(debounce(searchProducts, 300), [
    selectedWarehouse,
  ]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleProductSelect = (product: Product) => {
    // Vérifier si le produit existe déjà dans la liste
    const existingIndex = state.formData.produitsVendus.findIndex(
      (p) => p.produit_id === product.id_produit
    );

    if (existingIndex >= 0) {
      // Si le produit existe déjà, augmenter la quantité de 1
      const updatedProducts = [...state.formData.produitsVendus];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantite: (updatedProducts[existingIndex].quantite || 0) + 1,
      };

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: { ...state.formData, produitsVendus: updatedProducts },
      });
    } else {
      // Sinon, ajouter le produit à la liste
      const newProduct: ProduitVendu = {
        produit_id: product.id_produit,
        nom_produit: product.nom_produit,
        quantite: 1,
        prix_unitaire_HT: product.prix_vente,
        remise: 0,
        taxe: null, // Par défaut pas de taxe
        quantite_stock: product.quantite_stock,
      };

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: {
          ...state.formData,
          produitsVendus: [...state.formData.produitsVendus, newProduct],
        },
      });
    }

    // Réinitialiser la recherche
    setSearchValue("");
    setProductOptions([]);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Rechercher le produit par code-barres
      const response = await api.fetchProduits({
        barcode: barcode,
        warehouse: selectedWarehouse,
      });

      if (response && response.products && response.products.length > 0) {
        const product = response.products[0];
        handleProductSelect({
          id_produit: product.id,
          nom_produit: product.name,
          prix_vente: product.sales_price,
          quantite_stock: product.current_stock,
          code_barre: product.item_code,
        });
        message.success(`Produit "${product.name}" ajouté`);
      } else {
        message.warning("Aucun produit trouvé avec ce code-barres");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche par code-barres:", error);
      message.error("Erreur lors de la recherche du produit");
    }
  };

  // Calculer les montants totaux
  const subTotal = state.formData.produitsVendus.reduce(
    (sum, p) => sum + p.prix_unitaire_HT * p.quantite,
    0
  );

  const totalDiscount =
    state.formData.produitsVendus.reduce((sum, p) => sum + (p.remise || 0), 0) +
    (form.getFieldValue("remise_globale") || 0);

  const totalTax = state.formData.produitsVendus.reduce((sum, p) => {
    if (!p.taxe) return sum;
    const taxRate = state.taxes.find((t: any) => t.id === p.taxe)?.rate || 0;
    return sum + (p.prix_unitaire_HT * p.quantite * taxRate) / 100;
  }, 0);

  const grandTotal = subTotal - totalDiscount + totalTax;

  return (
    <Modal
      key={state.formData.id ? `edit-${state.formData.id}` : "create"}
      title={
        state.formData.id
          ? `Modifier Proforma ${
              state.formData.invoice_number || state.formData.id
            }`
          : "Nouvelle Proforma"
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      <Spin spinning={loading}>
        {/* Information contextuelle pour l'édition */}
        {state.formData.id && (
          <Alert
            message={`Mode édition: ${
              state.formData.invoice_number || `Proforma #${state.formData.id}`
            }`}
            description={(() => {
              const client = filteredClients.find(
                (c) => c.id === parseInt(state.formData.Client_ID)
              );
              const clientName =
                client?.name ||
                client?.company_name ||
                client?.Nom_Raison_Sociale ||
                `Client ID: ${state.formData.Client_ID}`;
              return `Client: ${clientName} • Produits: ${state.formData.produitsVendus.length}`;
            })()}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Alerte si aucun magasin n'est sélectionné */}
        {!selectedWarehouse && (
          <Alert
            message="Magasin requis"
            description="Veuillez sélectionner un magasin dans la barre de navigation avant de créer une proforma."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={!selectedWarehouse}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="Client_ID"
                label="Client"
                rules={[{ required: true, message: "Sélectionnez un client" }]}
              >
                <Select placeholder="Sélectionner un client">
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
            <Col span={8}>
              <Form.Item
                name="Date_Facture"
                label="Date"
                rules={[{ required: true, message: "Sélectionnez une date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="Statut_Vente"
                label="Statut"
                rules={[{ required: true, message: "Sélectionnez un statut" }]}
              >
                <Select>
                  <Option value="Commandé">Commandé</Option>
                  <Option value="En traitement">En traitement</Option>
                  <Option value="Expédié">Expédié</Option>
                  <Option value="Livré">Livré</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={sectionStyle}>
            <div style={{ marginBottom: 16, display: "flex" }}>
              <AutoComplete
                value={searchValue}
                options={productOptions}
                style={{ width: "100%", marginRight: 8 }}
                onSearch={handleSearchChange}
                placeholder="Rechercher un produit..."
                onSelect={(value, option) => {
                  const product = (option as any).product;
                  handleProductSelect({
                    id_produit: product.id,
                    nom_produit: product.name,
                    prix_vente: product.sales_price,
                    quantite_stock: product.current_stock,
                  });
                  setSearchValue("");
                }}
              />
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => setBarcodeVisible(true)}
              >
                Scanner
              </Button>
            </div>

            <Table
              dataSource={state.formData.produitsVendus}
              rowKey={(record, index) => `${record.produit_id}-${index}`}
              pagination={false}
              size="small"
            >
              <Table.Column title="Produit" dataIndex="nom_produit" />
              <Table.Column
                title="Prix unitaire"
                dataIndex="prix_unitaire_HT"
                render={(value: any, record: any, index: number) => (
                  <InputNumber
                    min={0}
                    value={value}
                    formatter={(val: any) => (val ? formatNumber(val) : "")}
                    parser={(val: any) => val.replace(/\D/g, "")}
                    onChange={(newValue: any) => {
                      const updatedProducts = [
                        ...state.formData.produitsVendus,
                      ];
                      updatedProducts[index].prix_unitaire_HT = newValue;
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          ...state.formData,
                          produitsVendus: updatedProducts,
                        },
                      });
                    }}
                  />
                )}
              />
              <Table.Column
                title="Quantité"
                dataIndex="quantite"
                render={(value: any, record: any, index: number) => (
                  <InputNumber
                    min={1}
                    value={value}
                    onChange={(newValue: any) => {
                      const updatedProducts = [
                        ...state.formData.produitsVendus,
                      ];
                      updatedProducts[index].quantite = newValue;
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          ...state.formData,
                          produitsVendus: updatedProducts,
                        },
                      });
                    }}
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
                      const updatedProducts = [
                        ...state.formData.produitsVendus,
                      ];
                      updatedProducts[index].remise = newValue || 0;
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          ...state.formData,
                          produitsVendus: updatedProducts,
                        },
                      });
                    }}
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
                      const updatedProducts = [
                        ...state.formData.produitsVendus,
                      ];
                      updatedProducts[index].taxe = newValue;
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          ...state.formData,
                          produitsVendus: updatedProducts,
                        },
                      });
                    }}
                  >
                    <Option value={null}>Aucune</Option>
                    {state.taxes.map((tax: any) => (
                      <Option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%)
                      </Option>
                    ))}
                  </Select>
                )}
              />
              <Table.Column
                title="Total"
                render={(text: any, record: any) => {
                  const base = record.prix_unitaire_HT * record.quantite;
                  const remise = record.remise || 0;
                  const taxRate = record.taxe
                    ? state.taxes.find((t: any) => t.id === record.taxe)
                        ?.rate || 0
                    : 0;
                  const tax = (base * taxRate) / 100;
                  return formatNumber(base - remise + tax);
                }}
              />
              <Table.Column
                title="Actions"
                render={(text: any, record: any, index: number) => (
                  <Button
                    type="link"
                    danger
                    onClick={() => {
                      const updatedProducts = [
                        ...state.formData.produitsVendus,
                      ];
                      updatedProducts.splice(index, 1);
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          ...state.formData,
                          produitsVendus: updatedProducts,
                        },
                      });
                    }}
                  >
                    Supprimer
                  </Button>
                )}
              />
            </Table>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="termes_conditions" label="Termes et conditions">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="remarques" label="Remarques">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Card title="Résumé">
                <Row>
                  <Col span={12}>Sous-total:</Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    {formatNumber(subTotal)} FCFA
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <Form.Item
                      name="remise_globale"
                      label="Remise globale"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={0}
                        formatter={(value: any) =>
                          value !== undefined && value !== null
                            ? formatNumber(Number(value))
                            : ""
                        }
                        parser={(value: any) =>
                          value ? Number(value.replace(/\D/g, "")) : 0
                        }
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    {formatNumber(totalDiscount)} FCFA
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>Taxes:</Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    {formatNumber(totalTax)} FCFA
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <strong>Total:</strong>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    <strong>{formatNumber(grandTotal)} FCFA</strong>
                  </Col>
                </Row>
              </Card>
              <div style={{ marginTop: 24, textAlign: "right" }}>
                <Button onClick={onClose} style={{ marginRight: 8 }}>
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  Enregistrer
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Spin>

      {/* Scanner de code-barres */}
      {barcodeVisible && (
        <Modal
          title="Scanner un code-barres"
          open={barcodeVisible}
          onCancel={() => setBarcodeVisible(false)}
          footer={null}
        >
          <div style={{ textAlign: "center" }}>
            <BarcodeScanner onDetected={handleBarcodeScanned} />
          </div>
        </Modal>
      )}
    </Modal>
  );
};

// Composant BarcodeScanner
const BarcodeScanner: React.FC<{ onDetected: (barcode: string) => void }> = ({
  onDetected,
}) => {
  const [barcode, setBarcode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcode.trim()) {
      onDetected(barcode.trim());
      setBarcode("");
    }
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <p>Scannez un code-barres ou saisissez-le manuellement :</p>
      <Input
        placeholder="Code-barres..."
        value={barcode}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button
        type="primary"
        onClick={() => {
          if (barcode.trim()) {
            onDetected(barcode.trim());
            setBarcode("");
          }
        }}
        style={{ marginTop: 10 }}
      >
        Valider
      </Button>
    </div>
  );
};

// Composant ProductSearch pour la recherche de produits
const ProductSearch: React.FC<{
  onSelect: (product: Product) => void;
  warehouseId?: number | null;
}> = ({ onSelect, warehouseId }) => {
  const [options, setOptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const { state } = useContext(ProformasContext)!;

  const searchProducts = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 2) {
        setOptions([]);
        return;
      }

      try {
        // Filtrer les produits localement (à adapter selon votre besoin)
        const filteredProducts = state.produits.filter(
          (p) =>
            p.nom_produit.toLowerCase().includes(value.toLowerCase()) &&
            (p.quantite_stock || 0) > 0
        );

        setOptions(
          filteredProducts.map((p) => ({
            value: p.id_produit,
            label: `${p.nom_produit} - ${formatNumber(p.prix_vente)} FCFA`,
            product: p,
          }))
        );
      } catch (error) {
        console.error("Erreur lors de la recherche des produits:", error);
      }
    }, 300),
    [state.produits]
  );

  useEffect(() => {
    searchProducts(searchText);
  }, [searchText, searchProducts]);

  return (
    <AutoComplete
      value={searchText}
      options={options}
      style={{ width: "100%" }}
      onSearch={(value) => setSearchText(value)}
      placeholder="Rechercher un produit..."
      onSelect={(value, option) => {
        const product = (option as any).product;
        onSelect(product);
        setSearchText("");
      }}
    />
  );
};

// Composant pour l'affichage détaillé des produits dans les lignes développées
const ExpandedRowContent: React.FC<{
  record: any;
  refreshTrigger?: number;
}> = ({ record, refreshTrigger }) => {
  const { state, api } = useContext(ProformasContext)!;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const orderItems = await api.fetchOrderItems(record.id);

        // Enrichir les items avec les noms des produits si nécessaire
        const enrichedItems = await Promise.all(
          orderItems.map(async (item: any) => {
            // Si l'item a déjà un product_name, l'utiliser
            if (item.product_name) {
              return item;
            }

            // Sinon, chercher dans l'état local
            const localProduct = state.produits.find(
              (p) => p.id_produit === item.product_id
            );
            if (localProduct) {
              return { ...item, product_name: localProduct.nom_produit };
            }

            // En dernier recours, essayer de récupérer le détail du produit
            try {
              const productDetails = await api.fetchProductDetails([
                item.product_id,
              ]);
              if (productDetails && productDetails.length > 0) {
                return {
                  ...item,
                  product_name:
                    productDetails[0].nom_produit || productDetails[0].name,
                };
              }
            } catch (error) {
              console.warn(
                `Impossible de récupérer le nom du produit ${item.product_id}:`,
                error
              );
            }

            // Si tout échoue, utiliser un nom par défaut
            return { ...item, product_name: `Produit #${item.product_id}` };
          })
        );

        setItems(enrichedItems);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [record.id, api, state.produits, refreshTrigger]);

  return (
    <Spin spinning={loading}>
      <Card title="Détails des produits" size="small" bordered={false}>
        <Table
          dataSource={items}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: "Produit",
              dataIndex: "product_name",
              render: (productName: string, record: any) => {
                return productName || `Produit #${record.product_id}`;
              },
            },
            {
              title: "Prix unitaire",
              dataIndex: "unit_price",
              render: (price: number) => `${formatNumber(price)} FCFA`,
            },
            {
              title: "Quantité",
              dataIndex: "quantity",
            },
            {
              title: "Remise",
              dataIndex: "discount_rate",
              render: (discount: number) =>
                discount ? `${formatNumber(discount)} FCFA` : "0 FCFA",
            },
            {
              title: "Taxe",
              dataIndex: "tax_id",
              render: (id: number) => {
                const tax = state.taxes.find((t: any) => t.id === id);
                return tax ? `${tax.name} (${tax.rate}%)` : "Aucune";
              },
            },
            {
              title: "Total",
              dataIndex: "subtotal",
              render: (subtotal: number) => `${formatNumber(subtotal)} FCFA`,
            },
          ]}
        />
      </Card>
    </Spin>
  );
};

// Composant pour la fenêtre modale de détail d'une proforma
interface ProformaDetailModalProps {
  visible: boolean;
  order: any;
  onClose: () => void;
  produits: Product[];
  taxes: any[];
  clients: any[];
  refreshOrderDetails: (record: any) => Promise<void>;
  refreshProformas: () => Promise<void>;
  onDownloadInvoice?: (record: any) => Promise<void>;
}

const ProformaDetailModal: React.FC<ProformaDetailModalProps> = ({
  visible,
  order,
  onClose,
  produits,
  taxes,
  clients,
  refreshOrderDetails,
  refreshProformas,
  onDownloadInvoice,
}) => {
  const { api } = useContext(ProformasContext)!;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const auth: any = useAuth(); // Utiliser le type any pour contourner les erreurs TypeScript

  // Fonction de vérification des permissions sécurisée
  const hasPermission = (permission: string): boolean => {
    // Ajouter des logs pour déboguer
    console.log(`[ProformaDetailModal] Vérification permission: ${permission}`);
    console.log(`[ProformaDetailModal] Auth object:`, auth);
    console.log(
      `[ProformaDetailModal] HasPermission function exists:`,
      typeof auth?.hasPermission === "function"
    );

    const result =
      typeof auth?.hasPermission === "function"
        ? auth.hasPermission(permission)
        : false;

    console.log(`[ProformaDetailModal] Résultat vérification: ${result}`);
    return result;
  };

  if (!order) return null;

  const client = clients.find((c) => c.id === order.user_id) || {
    name: "Client inconnu",
  };

  // Calculer les totaux à partir des items si disponibles
  const items = order.items || [];
  const subtotal =
    order.subtotal ||
    items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const totalDiscount = order.discount || 0;
  const totalTax = order.tax_amount || 0;
  const total = order.total || subtotal - totalDiscount + totalTax;

  // Fonction pour ouvrir les détails de la vente générée à partir de la proforma
  const openSaleDetails = () => {
    if (order.converted_sale_id) {
      navigate(`/gestion-vente?id=${order.converted_sale_id}`);
    }
  };

  const handleConvert = async () => {
    // Vérifier si l'utilisateur a la permission de convertir
    if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.convert")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour convertir une proforma en vente."
      );
      return;
    }

    try {
      setLoading(true);
      Modal.confirm({
        title: "Confirmation",
        content:
          "Êtes-vous sûr de vouloir convertir cette proforma en commande de vente?",
        okText: "Oui",
        cancelText: "Non",
        onOk: async () => {
          try {
            const result = await api.convertToSale(order.id);

            if (result) {
              message.success(
                "Proforma convertie en commande de vente avec succès"
              );

              // Pour s'assurer que les données locales sont correctement mises à jour
              console.log("Avant rafraîchissement:", order);

              // Mettre à jour les propriétés de l'objet order directement
              order.is_converted = 1;
              order.converted_sale_id = result.orderId || result.id;
              order.sale_invoice_number = result.invoice_number;

              // Force le rendu du composant en modifiant l'état
              setActiveTab(activeTab);

              // Rafraîchir la liste des proformas
              await refreshProformas();

              // Rafraîchir les détails de la proforma pour obtenir le lien vers la vente
              if (refreshOrderDetails) {
                try {
                  await refreshOrderDetails(order);

                  // Afficher les détails après rafraîchissement pour vérifier
                  console.log(
                    "Après rafraîchissement, la proforma a maintenant:",
                    {
                      id: order.id,
                      is_converted: order.is_converted,
                      converted_sale_id: order.converted_sale_id,
                    }
                  );
                } catch (refreshError) {
                  console.error(
                    "Erreur lors du rafraîchissement des détails:",
                    refreshError
                  );
                }
              }

              // Proposer de naviguer vers la vente créée
              Modal.confirm({
                title: "Vente créée",
                content: "Souhaitez-vous accéder à la vente créée?",
                okText: "Oui",
                cancelText: "Non",
                onOk: () => {
                  // Naviguer vers le module de gestion des ventes avec l'ID
                  navigate(`/gestion-vente?id=${result.orderId || result.id}`);
                },
              });
            }
          } catch (error) {
            console.error("Erreur lors de la conversion:", error);
            message.error("Erreur lors de la conversion en vente");
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      console.error("Erreur lors de la conversion:", error);
      message.error("Erreur lors de la conversion en vente");
      setLoading(false);
    }
  };

  // Vérifier si la proforma a déjà été convertie en vente
  const isConverted = order.is_converted === 1 || order.is_converted === true;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>
            Détails Proforma #{order.invoice_number || order.reference}{" "}
            {order.is_deleted === 1 && <Tag color="red">Supprimé</Tag>}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
        <Button
          key="download"
          type="default"
          icon={<DownloadOutlined />}
          onClick={() => {
            if (onDownloadInvoice) {
              onDownloadInvoice(order);
            }
          }}
        >
          Télécharger
        </Button>,
        isConverted ? (
          <Button
            key="viewSale"
            type="primary"
            icon={<EyeOutlined />}
            onClick={openSaleDetails}
          >
            Voir la facture de vente
          </Button>
        ) : (
          // Utiliser un composant Fragment pour rendre la condition plus claire
          <>
            {/* Vérification de permission pour le bouton de conversion */}
            {(() => {
              const canConvert = hasPermission(
                "Gestion Commerciale.Ventes.ProformaDevis.convert"
              );
              console.log(
                "[ProformaDetailModal] Affichage bouton convertir:",
                canConvert
              );

              return canConvert ? (
                <Button
                  key="convert"
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={handleConvert}
                  loading={loading}
                  disabled={
                    order.order_status === "Annulé" ||
                    order.is_deleted ||
                    isConverted
                  }
                >
                  Convertir en vente
                </Button>
              ) : null;
            })()}
          </>
        ),
        hasPermission("Gestion Commerciale.Ventes.ProformaDevis.edit") &&
          !order?.is_deleted &&
          !order?.is_converted && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                // Code pour ouvrir l'édition
              }}
            >
              Modifier
            </Button>
          ),
        hasPermission("Gestion Commerciale.Ventes.ProformaDevis.delete") &&
          !order?.is_deleted &&
          !order?.is_converted && (
            <Button
              key="delete"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                // Code pour confirmer la suppression
                Modal.confirm({
                  title: "Supprimer cette proforma ?",
                  content: "Cette action est irréversible.",
                  onOk: async () => {
                    try {
                      await api.deleteProforma(order.id);
                      message.success("Proforma supprimée avec succès");
                      refreshProformas();
                      onClose();
                    } catch (error) {
                      console.error("Erreur lors de la suppression:", error);
                      message.error("Erreur lors de la suppression");
                    }
                  },
                });
              }}
            >
              Supprimer
            </Button>
          ),
      ].filter(Boolean)} // Filtrer les valeurs false/null pour éviter les erreurs React
    >
      <Spin spinning={loading}>
        {isConverted && (
          <Alert
            message={
              <Space>
                <span>Cette proforma a été convertie en facture de vente.</span>
                <button
                  onClick={openSaleDetails}
                  style={{
                    cursor: "pointer",
                    color: "#1890ff",
                    background: "none",
                    border: "none",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                  type="button"
                >
                  Voir la facture #
                  {order.sale_invoice_number ||
                    `Vente #${order.converted_sale_id}`}
                </button>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "details",
              label: "Informations générales",
              children: (
                <>
                  <Card title="Informations de la proforma">
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="N° Proforma">
                        {order.invoice_number}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {dayjs(order.order_date).format("DD/MM/YYYY")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Client">
                        {client.name || client.company_name || "Client inconnu"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Magasin">
                        {order.warehouse_name || "Non spécifié"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut">
                        <Tag
                          color={
                            order.order_status === "Annulé"
                              ? "red"
                              : order.order_status === "En attente"
                              ? "orange"
                              : "green"
                          }
                        >
                          {order.order_status || "Non spécifié"}
                        </Tag>
                      </Descriptions.Item>
                      {isConverted && (
                        <Descriptions.Item label="Vente générée">
                          <button
                            onClick={openSaleDetails}
                            style={{
                              cursor: "pointer",
                              color: "#1890ff",
                              background: "none",
                              border: "none",
                              padding: 0,
                              textDecoration: "underline",
                            }}
                            type="button"
                          >
                            {order.sale_invoice_number || "Voir la vente"}
                          </button>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Montant Total HT">
                        {formatNumber(subtotal)} FCFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Remise">
                        {formatNumber(totalDiscount)} FCFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Taxes">
                        {formatNumber(totalTax)} FCFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant Total TTC">
                        {formatNumber(total)} FCFA
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <div style={{ marginTop: "20px" }}>
                    <h3>Produits</h3>
                    <Table
                      dataSource={items}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    >
                      <Table.Column
                        title="Produit"
                        render={(_, record: any) => {
                          const productId = record.product_id;
                          const productName =
                            record.product_name ||
                            produits.find((p) => p.id_produit === productId)
                              ?.nom_produit ||
                            `Produit #${productId}`;
                          return productName;
                        }}
                      />
                      <Table.Column
                        title="Prix unitaire"
                        dataIndex="unit_price"
                        render={(price) => `${formatNumber(price)} FCFA`}
                      />
                      <Table.Column title="Quantité" dataIndex="quantity" />
                      <Table.Column
                        title="Remise"
                        dataIndex="discount_rate"
                        render={(discount) =>
                          discount ? `${formatNumber(discount)} FCFA` : "0 FCFA"
                        }
                      />
                      <Table.Column
                        title="Taxe"
                        dataIndex="tax_id"
                        render={(id) => {
                          if (!id) return "Aucune";
                          const tax = taxes.find((t) => t.id === id);
                          return tax ? `${tax.name} (${tax.rate}%)` : "Aucune";
                        }}
                      />
                      <Table.Column
                        title="Total"
                        dataIndex="subtotal"
                        render={(subtotal) => `${formatNumber(subtotal)} FCFA`}
                      />
                    </Table>
                  </div>

                  <Card style={{ marginTop: "20px" }} title="Notes et termes">
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Remarques">
                        {order.notes || "Aucune remarque"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Termes et conditions">
                        {order.terms_condition || "Aucun terme spécifié"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </>
              ),
            },
          ]}
        />
      </Spin>
    </Modal>
  );
};

interface ProformasTableProps {
  refreshProformas: () => Promise<void>;
}

const ProformasTable: React.FC<ProformasTableProps> = ({
  refreshProformas,
}) => {
  const { state, dispatch, api } = useContext(ProformasContext)!;
  const [detailProforma, setDetailProforma] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const { selectedWarehouse } = useSelection();
  const auth: any = useAuth(); // Utiliser le type any pour contourner les erreurs TypeScript

  // Fonction de vérification des permissions sécurisée
  const hasPermission = (permission: string): boolean => {
    return typeof auth?.hasPermission === "function"
      ? auth.hasPermission(permission)
      : false;
  };

  useEffect(() => {
    const fetchWarehouseInfo = async () => {
      if (selectedWarehouse) {
        try {
          const warehouse = await api.fetchWarehouse(selectedWarehouse);
          setWarehouseData(warehouse);
        } catch (error) {
          console.error("Erreur lors de la récupération du magasin:", error);
        }
      }
    };
    fetchWarehouseInfo();
  }, [selectedWarehouse, api]);

  const loadProformaDetails = async (record: any) => {
    try {
      setLoading(true);

      // Récupérer les détails de la proforma et ses éléments
      const proforma = await api.fetchProformaDetail(record.id);
      const items = await api.fetchOrderItems(record.id);

      console.log("Détails de la proforma chargés:", {
        id: proforma.id,
        invoice_number: proforma.invoice_number,
        is_converted: proforma.is_converted,
        converted_sale_id: proforma.converted_sale_id,
      });

      // Si la proforma a été convertie en vente, récupérer les informations de la vente
      if (
        (proforma.is_converted === 1 || proforma.is_converted === true) &&
        proforma.converted_sale_id
      ) {
        try {
          const saleResponse = await fetch(
            `${BASE_URL}/api/orders/${proforma.converted_sale_id}`
          );
          if (saleResponse.ok) {
            const saleData = await saleResponse.json();
            proforma.sale_invoice_number = saleData.invoice_number;
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des détails de la vente:",
            error
          );
        }
      }

      return { ...proforma, items };
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      message.error("Erreur lors du chargement des détails");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadProformaDetailsForModal = async (record: any) => {
    try {
      setLoading(true);
      const details = await loadProformaDetails(record);

      if (details) {
        console.log("Détails chargés pour le modal:", {
          id: details.id,
          is_converted: details.is_converted,
          converted_sale_id: details.converted_sale_id,
          invoice_number: details.invoice_number,
        });

        // Mettre à jour le state local
        setDetailProforma({
          ...details,
          // S'assurer que ces propriétés sont correctement définies
          is_converted: details.is_converted || 0,
        });

        setShowDetailModal(true);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails pour le modal:",
        error
      );
      message.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const loadProformaForEdit = async (record: any) => {
    // Vérifier si l'utilisateur a la permission d'éditer
    if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.edit")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour modifier une proforma/devis."
      );
      return;
    }

    try {
      setLoading(true);
      const proforma = await api.fetchProformaDetail(record.id);
      const items = await api.fetchOrderItems(record.id);

      if (!proforma) {
        message.error("Impossible de charger les détails de la proforma");
        return;
      }

      // Convertir les données pour le format du formulaire
      const proformaData = {
        id: proforma.id,
        invoice_number: proforma.invoice_number,
        Date_Facture: proforma.order_date,
        Statut_Vente: proforma.order_status,
        Client_ID: String(proforma.user_id), // Convertir en string pour compatibilité avec le formulaire
        remise_globale: proforma.discount || 0,
        termes_conditions: proforma.terms_condition || "",
        remarques: proforma.notes || "",
        produitsVendus: (items || []).map((item: any) => {
          // Essayer de trouver le nom du produit dans l'état local d'abord
          let nomProduit = state.produits.find(
            (p) => p.id_produit === item.product_id
          )?.nom_produit;

          // Si pas trouvé dans l'état local, utiliser le nom depuis l'item s'il existe
          if (!nomProduit && item.product_name) {
            nomProduit = item.product_name;
          }

          // Sinon, utiliser un nom par défaut
          if (!nomProduit) {
            nomProduit = `Produit #${item.product_id}`;
          }

          console.log(
            `Produit ${item.product_id}: nom trouvé = "${nomProduit}"`
          );

          return {
            produit_id: item.product_id,
            nom_produit: nomProduit,
            quantite: item.quantity,
            prix_unitaire_HT: item.unit_price,
            remise: item.discount_rate || 0,
            taxe: item.tax_id,
          };
        }),
      };

      // Mettre à jour les données du formulaire
      console.log(
        "Données de proforma à charger dans le formulaire:",
        proformaData
      );
      dispatch({ type: "SET_FORM_DATA", payload: proformaData });

      // Ouvrir le formulaire immédiatement après avoir mis à jour les données
      dispatch({ type: "TOGGLE_FORM", payload: true });
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      message.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour forcer le rechargement des détails des produits après modification
  const triggerDetailRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDelete = async (id: number) => {
    // Vérifier si l'utilisateur a la permission de supprimer
    if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.delete")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour supprimer une proforma/devis."
      );
      return;
    }

    Modal.confirm({
      title: "Confirmation",
      content: "Êtes-vous sûr de vouloir supprimer cette proforma?",
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        try {
          await api.deleteProforma(id);
          message.success("Proforma supprimée avec succès");
          dispatch({ type: "DELETE_PROFORMA", payload: id });
          await refreshProformas();
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleRestore = async (id: number) => {
    Modal.confirm({
      title: "Confirmation",
      content: "Êtes-vous sûr de vouloir restaurer cette proforma?",
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        try {
          await api.restoreProforma(id);
          message.success("Proforma restaurée avec succès");
          await refreshProformas();
        } catch (error) {
          console.error("Erreur lors de la restauration:", error);
          message.error("Erreur lors de la restauration");
        }
      },
    });
  };

  const handleCancel = async (id: number) => {
    Modal.confirm({
      title: "Confirmation",
      content: "Êtes-vous sûr de vouloir annuler cette proforma?",
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        try {
          await api.cancelProforma(id);
          message.success("Proforma annulée avec succès");
          await refreshProformas();
        } catch (error) {
          console.error("Erreur lors de l'annulation:", error);
          message.error("Erreur lors de l'annulation");
        }
      },
    });
  };

  const handleDownloadInvoice = async (record: any) => {
    try {
      setLoading(true);
      message.loading({
        content: "Préparation de la facture...",
        key: "invoice-loading",
      });

      // Récupérer les détails complets de la proforma
      const proformaDetail = await api.fetchProformaDetail(
        record.id.toString()
      );
      let produitsVendus = proformaDetail.produitsVendus || [];
      if (produitsVendus.length === 0) {
        const orderItems = await api.fetchOrderItems(record.id.toString());
        produitsVendus = orderItems;
        proformaDetail.produitsVendus = produitsVendus;
      }

      // Enrichir les détails des produits
      try {
        // S'assurer que nous avons bien tous les IDs produits quelle que soit la nomenclature utilisée
        const productIds = produitsVendus
          .map((p: any) => {
            // Considérer toutes les variations possibles de l'ID du produit
            const productId = p.produit_id || p.product_id;
            if (!productId) {
              console.warn("Produit sans ID détecté:", p);
            }
            return productId;
          })
          .filter(Boolean);

        console.log(
          `Enrichissement des données pour ${productIds.length} produits`
        );

        if (productIds.length > 0) {
          const productDetails = await api.fetchProductDetails(productIds);
          console.log(`${productDetails.length} détails de produits récupérés`);

          produitsVendus = produitsVendus.map((p: any) => {
            const productId = p.produit_id || p.product_id;
            const details = productDetails.find((d: any) => d.id === productId);

            if (details) {
              return {
                ...p,
                unit_short_name: details.unit_short_name || "",
                unit_name: details.unit_name || "",
                product_name:
                  details.name ||
                  p.nom_produit ||
                  p.product_name ||
                  `Produit #${productId}`,
              };
            }

            // Si pas de détails trouvés, garder les informations existantes
            return {
              ...p,
              product_name:
                p.nom_produit || p.product_name || `Produit #${productId}`,
            };
          });

          proformaDetail.produitsVendus = produitsVendus;
        }
      } catch (enrichError) {
        console.error(
          "Erreur lors de l'enrichissement des produits:",
          enrichError
        );
        // Ne pas bloquer le processus en cas d'erreur, continuer avec les données disponibles
      }

      // Récupérer les informations du magasin
      const warehouse = await api.fetchWarehouse(record.warehouse_id);

      // Préparer l'objet invoiceData
      const invoiceData = {
        ...proformaDetail,
        produitsVendus,
        warehouse,
        client: state.clients.find((c: any) => c.id === proformaDetail.user_id),
      };

      // Générer le contenu HTML de la facture proforma
      const invoiceHTML = generateProformaHTML({
        order: invoiceData,
        clientObj: invoiceData.client,
        warehouse: warehouse,
        totals: {
          subtotal: invoiceData.subtotal,
          totalDiscount: invoiceData.discount || 0,
          totalTax: invoiceData.tax_amount || 0,
          total: invoiceData.total,
        },
        formattedDate: dayjs(invoiceData.order_date).format("DD/MM/YYYY"),
        formatNumber: formatNumber,
      });

      // Nom du fichier
      const fileName = `Proforma_${invoiceData.invoice_number}.pdf`;

      // Appeler l'API backend pour générer le PDF
      try {
        // Utiliser fetch pour appeler l'endpoint avec le HTML complet
        const response = await fetch(
          `${BASE_URL}/api/orders/generate-proforma-pdf`,
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
      console.error(
        "Erreur lors de la génération de la facture proforma:",
        error
      );
      message.error("Erreur lors de la génération de la facture proforma");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      // Exporter les données vers Excel
      const dataForExcel = state.proformas.map((p: any) => ({
        Numéro: p.invoice_number,
        Date: dayjs(p.order_date).format("DD/MM/YYYY"),
        Client:
          state.clients.find((c: any) => c.id === p.user_id)?.name ||
          "Client inconnu",
        Magasin:
          p.warehouse_name || `Magasin #${p.warehouse_id}` || "Non spécifié",
        Statut: p.order_status,
        "Total HT": p.subtotal,
        "Total TTC": p.total,
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Proformas");

      // Générer le fichier Excel
      XLSX.writeFile(wb, "Proformas.xlsx");

      message.success("Export Excel réussi");
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      message.error("Erreur lors de l'export Excel");
    } finally {
      setLoading(false);
    }
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "Numéro",
      dataIndex: "invoice_number",
      key: "invoice_number",
      sorter: (a: any, b: any) =>
        a.invoice_number.localeCompare(b.invoice_number),
    },
    {
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a: any, b: any) =>
        new Date(a.order_date).getTime() - new Date(b.order_date).getTime(),
      responsive: ["xs"],
    },
    {
      title: "Client",
      dataIndex: "user_id",
      key: "user_id",
      render: (clientId: number) => {
        const client = state.clients.find((c: any) => c.id === clientId);
        return client ? client.name : "Client inconnu";
      },
      responsive: ["md"],
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      render: (warehouseName: string, record: any) => {
        const displayName =
          warehouseName || `Magasin #${record.warehouse_id}` || "Non spécifié";
        const isCurrentWarehouse = record.warehouse_id === selectedWarehouse;

        return (
          <span
            style={{
              fontWeight: isCurrentWarehouse ? "bold" : "normal",
              color: isCurrentWarehouse ? "#1890ff" : "inherit",
            }}
          >
            {displayName}
            {isCurrentWarehouse && " ✓"}
          </span>
        );
      },
      responsive: ["lg"],
    },
    {
      title: "Statut",
      key: "conversion_status",
      align: "center" as const,
      render: function (value: any, record: any) {
        return (
          <Space size="middle">
            {record.order_status === "Annulé" ? (
              <Tag color="red">Annulée</Tag>
            ) : record.is_converted ? (
              <Tag color="blue">Convertie</Tag>
            ) : (
              <Tag color="green">Active</Tag>
            )}
          </Space>
        );
      },
      responsive: ["lg"],
    },
    {
      title: "Montant HT",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (amount: number) => `${formatNumber(amount || 0)} FCFA`,
      sorter: (a: any, b: any) => (a.subtotal || 0) - (b.subtotal || 0),
      responsive: ["md"],
    },
    {
      title: "Montant Taxes",
      dataIndex: "tax_amount",
      key: "tax_amount",
      render: (amount: number) => `${formatNumber(amount || 0)} FCFA`,
      sorter: (a: any, b: any) => (a.tax_amount || 0) - (b.tax_amount || 0),
      responsive: ["lg"],
    },
    {
      title: "Montant TTC",
      dataIndex: "total",
      key: "total",
      render: (amount: number) => `${formatNumber(amount)} FCFA`,
      sorter: (a: any, b: any) => a.total - b.total,
      responsive: ["xs"],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: any) => (
        <Space size="small">
          {/* Bouton Voir - accessible à tous ceux qui ont la permission view */}
          <Button
            type="link"
            onClick={() => loadProformaDetailsForModal(record)}
            icon={<EyeOutlined />}
          >
            Voir
          </Button>

          {/* Bouton Modifier - seulement si l'utilisateur a la permission edit */}
          {hasPermission("Gestion Commerciale.Ventes.ProformaDevis.edit") &&
            !record.is_deleted &&
            !record.is_converted && (
              <Button
                type="link"
                onClick={() => loadProformaForEdit(record)}
                icon={<EditOutlined />}
              >
                Modifier
              </Button>
            )}

          {/* Bouton Supprimer - seulement si l'utilisateur a la permission delete */}
          {hasPermission("Gestion Commerciale.Ventes.ProformaDevis.delete") &&
            !record.is_deleted &&
            !record.is_converted && (
              <Button
                type="link"
                danger
                onClick={() => handleDelete(record.id)}
                icon={<DeleteOutlined />}
              >
                Supprimer
              </Button>
            )}

          {record.is_deleted && (
            <Button
              type="dashed"
              onClick={() => handleRestore(record.id)}
              size="small"
            >
              Restaurer
            </Button>
          )}
          {!record.is_deleted && record.order_status !== "Annulé" && (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => loadProformaDetailsForModal(record)}
              size="small"
              disabled={record.is_converted}
            >
              Convertir
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button
          icon={<FileExcelOutlined style={{ color: "#217346" }} />}
          onClick={handleExportToExcel}
        >
          Exporter sur Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table
          dataSource={state.proformas}
          columns={columns}
          rowKey="id"
          scroll={{ x: "max-content" }}
          expandable={{
            expandedRowRender: (record) => (
              <ExpandedRowContent
                record={record}
                refreshTrigger={refreshTrigger}
              />
            ),
            expandRowByClick: false,
          }}
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
              `${range[0]}-${range[1]} sur ${total} proformas`,
            pageSizeOptions: ["10", "20", "50", "100"],
            position: ["bottomRight"],
          }}
          sortDirections={["descend", "ascend"]}
          loading={state.loading}
        />
      </div>

      {/* Modal pour afficher les détails */}
      <ProformaDetailModal
        order={detailProforma}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        produits={state.produits}
        taxes={state.taxes}
        clients={state.clients}
        refreshOrderDetails={loadProformaDetailsForModal}
        refreshProformas={refreshProformas}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {state.showForm && (
        <ProformaForm
          visible={state.showForm}
          onClose={() => {
            // Réinitialiser complètement les données du formulaire à la fermeture
            dispatch({ type: "RESET_FORM_DATA" });
            dispatch({ type: "TOGGLE_FORM", payload: false });
          }}
          refreshProformas={refreshProformas}
          onAfterSave={triggerDetailRefresh}
        />
      )}
    </>
  );
};

// Composant principal
const GestionProformas: React.FC = () => {
  const [state, dispatch] = useReducer(proformasReducer, initialState);
  const [currentWarehouse, setCurrentWarehouse] = useState<number | null>(null);
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const { selectedWarehouse, selectedCompany } = useSelection();
  const { taxes } = useTaxes(api); // Assuming 'api' is correctly defined above
  const auth: any = useAuth(); // Utiliser le type any pour contourner les erreurs TypeScript

  // Fonction de vérification des permissions sécurisée
  const hasPermission = (permission: string): boolean => {
    // console.log(`[GestionProformas] Vérification permission: ${permission}`);
    const result =
      typeof auth?.hasPermission === "function"
        ? auth.hasPermission(permission)
        : false;
    // console.log(`[GestionProformas] Résultat vérification: ${result}`);
    return result;
  };

  // Vérifier si l'utilisateur a la permission de voir ce module
  useEffect(() => {
    if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.view")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour accéder à ce module."
      );
    }
  }, [auth]); // Added auth to dependency array

  useEffect(() => {
    dispatch({ type: "SET_TAXES", payload: taxes });
  }, [taxes]);

  // Surveiller les changements de magasin sélectionné
  useEffect(() => {
    if (selectedWarehouse !== currentWarehouse) {
      console.log(
        "Nouvelle valeur de selectedWarehouse détectée:",
        selectedWarehouse
      );
      console.log("Entreprise associée (selectedCompany):", selectedCompany);

      setCurrentWarehouse(selectedWarehouse);
    }
  }, [selectedWarehouse, currentWarehouse, selectedCompany]);

  // Charger les données du magasin sélectionné
  useEffect(() => {
    const fetchWarehouseInfo = async () => {
      if (selectedWarehouse) {
        try {
          const warehouse = await api.fetchWarehouse(selectedWarehouse);
          setWarehouseData(warehouse);
        } catch (error) {
          console.error("Erreur lors de la récupération du magasin:", error);
          setWarehouseData(null);
        }
      } else {
        setWarehouseData(null);
      }
    };
    fetchWarehouseInfo();
  }, [selectedWarehouse]);

  // Appel initial au montage du composant
  useEffect(() => {
    console.log("Montage initial du composant GestionProformas");
    refreshProformas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProformas = useCallback(async () => {
    // Ne pas exécuter si aucun magasin n'est sélectionné
    if (!selectedWarehouse) {
      console.log(
        "Aucun magasin sélectionné, arrêt du chargement des proformas"
      );
      return;
    }

    console.log(
      `🔄 Rechargement des proformas pour le magasin ID: ${selectedWarehouse}`
    );
    console.log(
      `📍 Magasin sélectionné: ${warehouseData?.name || "Nom non chargé"}`
    );
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const requestParams = {
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchTerm,
        client_id: state.selectedClient?.id,
        start_date: state.dateRange.start,
        end_date: state.dateRange.end,
        warehouse_id: selectedWarehouse,
        show_deleted: state.showDeleted,
        status: state.activeTab,
      };

      console.log("Paramètres de requête pour les proformas:", requestParams);

      const result = await api.fetchProformas(requestParams);

      console.log(
        `✅ ${result.proformas.length} proformas récupérées avec succès`
      );

      dispatch({
        type: "SET_PROFORMAS",
        payload: { proformas: result.proformas, total: result.total },
      });
    } catch (error) {
      console.error("Erreur lors du chargement des proformas:", error);
      message.error("Erreur lors du chargement des proformas");
      dispatch({
        type: "SET_ERROR",
        payload: "Erreur lors du chargement des proformas",
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
    selectedWarehouse,
    state.activeTab,
  ]);

  useEffect(() => {
    refreshProformas();
  }, [
    state.currentPage,
    state.searchTerm,
    state.selectedClient,
    state.dateRange,
    state.showDeleted,
    selectedWarehouse,
    refreshProformas,
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      // Ne charger les données que si un magasin est sélectionné
      if (!currentWarehouse) {
        console.log(
          "Aucun magasin sélectionné, pas de chargement des données initiales"
        );
        // Réinitialiser les données existantes si aucun magasin n'est sélectionné
        dispatch({ type: "SET_CLIENTS", payload: [] });
        dispatch({ type: "SET_PRODUITS", payload: [] });
        dispatch({
          type: "SET_PROFORMAS",
          payload: { proformas: [], total: 0 },
        });
        return;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const [clientsResponse, produitsResponse] = await Promise.all([
          api.fetchClients(),
          api.fetchProduits({
            limit: 1000,
            warehouse: currentWarehouse,
          }),
        ]);

        console.log(
          `Chargement initial des produits pour le magasin ${currentWarehouse}`
        );
        dispatch({ type: "SET_CLIENTS", payload: clientsResponse });
        dispatch({ type: "SET_PRODUITS", payload: produitsResponse.products });
      } catch (error) {
        console.error("Erreur lors du chargement initial des données:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Erreur lors du chargement des données initiales.",
        });
        message.error("Erreur lors du chargement des données.");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadInitialData();
  }, [currentWarehouse]);

  const openProformaForm = () => {
    // Vérifier si l'utilisateur a la permission de créer un proforma
    if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.create")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour créer un proforma/devis."
      );
      return;
    }

    if (!selectedWarehouse) {
      Modal.warning({
        title: "Magasin non sélectionné",
        content:
          "Veuillez sélectionner un magasin avant de créer ou modifier une proforma.",
      });
      return;
    }

    // Réinitialiser les données du formulaire pour la création
    dispatch({ type: "RESET_FORM_DATA" });
    dispatch({ type: "TOGGLE_FORM", payload: true });
  };

  // Si l'utilisateur n'a pas la permission de voir ce module, afficher un message
  if (!hasPermission("Gestion Commerciale.Ventes.ProformaDevis.view")) {
    return <div>Accès non autorisé</div>;
  }

  // Si aucun magasin n'est sélectionné, afficher un message d'information
  if (!selectedWarehouse) {
    return (
      <ProformasContext.Provider value={{ state, dispatch, api }}>
        <Layout>
          <Layout.Content className="p-3 md:p-5">
            <Card>
              <div className="text-center py-16">
                <Alert
                  message="Magasin requis"
                  description="Veuillez sélectionner un magasin dans la barre de navigation pour accéder à la gestion des proformas."
                  type="info"
                  showIcon
                  style={{
                    maxWidth: 600,
                    margin: "0 auto",
                  }}
                />
              </div>
            </Card>
          </Layout.Content>
        </Layout>
      </ProformasContext.Provider>
    );
  }

  return (
    <ProformasContext.Provider value={{ state, dispatch, api }}>
      <Layout>
        <Layout.Content className="p-3 md:p-5">
          <Row
            justify="space-between"
            align="middle"
            className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <Col className="w-full sm:w-auto">
              {/* N'afficher le bouton que si l'utilisateur a la permission de créer */}
              {hasPermission(
                "Gestion Commerciale.Ventes.ProformaDevis.create"
              ) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openProformaForm}
                >
                  Nouvelle proforma
                </Button>
              )}
            </Col>
            <Col className="w-full sm:w-auto sm:flex-grow">
              <div className="flex flex-col md:flex-row md:flex-wrap items-center gap-2 w-full">
                <Input
                  placeholder="Rechercher par numéro..."
                  prefix={<SearchOutlined />}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_SEARCH",
                      payload: e.target.value.trim(),
                    })
                  }
                  className="w-full md:flex-1 md:min-w-[180px]"
                />
                <Select
                  placeholder="Client"
                  className="w-full md:flex-1 md:min-w-[180px]"
                  allowClear
                  onChange={(value: number) => {
                    const selectedClient = state.clients.find(
                      (c) => c.id === value
                    );
                    dispatch({
                      type: "SET_SELECTED_CLIENT",
                      payload: selectedClient,
                    });
                  }}
                >
                  {state.clients.map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.name ||
                        client.company_name ||
                        client.Nom_Raison_Sociale ||
                        "Client inconnu"}
                    </Option>
                  ))}
                </Select>
                <RangePicker
                  onChange={(dates, dateStrings) => {
                    if (dates) {
                      dispatch({
                        type: "SET_DATE_RANGE",
                        payload: {
                          start: dateStrings[0],
                          end: dateStrings[1],
                        },
                      });
                    } else {
                      dispatch({
                        type: "SET_DATE_RANGE",
                        payload: { start: "", end: "" },
                      });
                    }
                  }}
                />
                <Button
                  onClick={() =>
                    dispatch({
                      type: "TOGGLE_SHOW_DELETED",
                      payload: !state.showDeleted,
                    })
                  }
                  type={state.showDeleted ? "primary" : "default"}
                  className="w-full md:w-auto"
                >
                  {state.showDeleted
                    ? "Masquer supprimés"
                    : "Afficher supprimés"}
                </Button>
              </div>
            </Col>
          </Row>

          <Card>
            {/* Affichage du magasin sélectionné */}
            <div
              style={{
                marginBottom: 16,
                padding: 8,
                backgroundColor: "#f0f9ff",
                borderRadius: 4,
                border: "1px solid #bae6fd",
              }}
            >
              <Space>
                <span style={{ fontWeight: "bold", color: "#0369a1" }}>
                  Magasin sélectionné:
                </span>
                <span style={{ color: "#0c4a6e" }}>
                  {warehouseData?.name || `Magasin ID ${selectedWarehouse}`}
                </span>
              </Space>
            </div>
            <ProformasTable refreshProformas={refreshProformas} />
          </Card>
        </Layout.Content>
      </Layout>
    </ProformasContext.Provider>
  );
};

export default GestionProformas;
