import React, { useState, useEffect, useReducer, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tabs,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Divider,
  InputNumber,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
  Spin,
  Layout,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UndoOutlined,
  DollarOutlined,
  PrinterOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import "./GestionRetourVente.css";
import * as XLSX from "xlsx";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";
import type { TableProps } from "antd";

// Define interface for AuthContext based on what's available in AuthContext.js
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  hasPermission: (permissionKey: string) => boolean;
  refreshUserPermissions: (force?: boolean) => Promise<void>;
}

// Contexte de sélection (même utilisation que dans GestionRetourAchat)
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Interfaces – inchangées, mais pour rappel, l'interface Fournisseur représente ici un Client
interface Fournisseur {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  company_id: number;
  user_id?: number;
}

interface Product {
  id: number;
  name: string;
  item_code: string;
  purchase_price: number;
  sales_price: number;
  current_stock: number;
  warehouse_name?: string;
  categorie_nom?: string;
  unit_name?: string;
  unit_short_name?: string;
  taxe_name?: string;
  taxe_rate?: number;
}

interface RetourAchatItem {
  id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  max_quantity?: number;
  original_quantity?: number; // Quantité originale de la commande
  returned_quantity?: number; // Quantité déjà retournée
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  original_order_id?: number;
  original_order_item_id?: number;
  selectOpen?: boolean;
}

interface RetourAchat {
  id: number;
  invoice_number: string;
  reference: string;
  order_date: string;
  total: number;
  due_amount: number;
  paid_amount: number;
  payment_status: string;
  order_status: string;
  user_id: number;
  user_name: string;
  warehouse_id: number;
  warehouse_name: string;
  company_id: number;
  items?: RetourAchatItem[];
  shipping_cost?: number;
  discount_amount?: number;
  discount_type?: string;
  tax_amount?: number;
  tax_id?: number;
  tax_rate?: number;
  notes?: string;
  terms_condition?: string;
  created_at?: string;
  original_order_id?: number;
  is_deleted?: number;
  is_deletable?: number;
}

interface Tax {
  id: number;
  name: string;
  rate: number;
}

interface Payment {
  id: number;
  payment_number: string;
  date: string;
  amount: number;
  payment_mode_name: string;
  remarks?: string;
}

interface Warehouse {
  id: number;
  name: string;
  is_active: boolean;
  company_id: number;
}

// Classe API pour la gestion des retours de vente
class RetourVenteAPI {
  retourVentes: RetourAchat[] = [];

  async fetchRetourVentes(params: any = {}) {
    try {
      const requestParams = { ...params, order_type: "sales_return" };

      // Ensure we have proper pagination parameters
      if (!requestParams.page) requestParams.page = 1;
      if (!requestParams.limit) requestParams.limit = 10;

      console.log("Fetching sales returns with params:", requestParams);

      const response = await axios.get("/api/orders", {
        params: requestParams,
      });

      // Conserver une copie locale des données pour les réutiliser si nécessaire
      const ordersData = response.data.orders || [];
      this.retourVentes = ordersData.map((order: RetourAchat) => {
        // Préserver les items précédemment chargés si disponibles
        const existingOrder = this.retourVentes.find((r) => r.id === order.id);
        if (
          existingOrder &&
          existingOrder.items &&
          existingOrder.items.length > 0
        ) {
          return { ...order, items: existingOrder.items };
        }
        return order;
      });

      // Calculer le nombre total d'éléments
      const totalItems =
        response.data.total || response.data.pagination?.totalItems || 0;

      // Log detailed response info
      console.log("Sales returns API response:", {
        count: this.retourVentes.length,
        total: totalItems,
        pageInfo: `Page ${requestParams.page}, limit ${requestParams.limit}`,
      });

      return {
        retourVentes: this.retourVentes,
        totalItems: totalItems,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des retours de vente:",
        error
      );
      throw error;
    }
  }

  async createRetourVente(data: any) {
    const response = await axios.post("/api/orders", {
      ...data,
      order_type: "sales_return",
    });
    return response.data;
  }

  async updateRetourVente(id: number, data: any) {
    const response = await axios.put(`/api/orders/${id}`, data);
    return response.data;
  }

  async deleteRetourVente(id: number) {
    const response = await axios.delete(`/api/orders/${id}`);
    return response.data;
  }

  async cancelRetourVente(id: number) {
    const payload = { order_status: "Annulé", cancelled: 1, is_deletable: 0 };
    const response = await axios.put(`/api/orders/${id}`, payload);
    return response.data;
  }

  async restoreRetourVente(id: number) {
    const response = await axios.post(`/api/orders/${id}/restore`);
    return response.data;
  }

  async fetchVentesForReturn(clientId: number, warehouseId: number) {
    console.log(
      "Appel fetchVentesForReturn avec clientId:",
      clientId,
      "warehouseId:",
      warehouseId,
      "Types:",
      typeof clientId,
      typeof warehouseId
    );

    if (!clientId || !warehouseId) {
      console.warn(
        "ClientId ou warehouseId manquant dans fetchVentesForReturn"
      );
      return [];
    }

    try {
      // Ensure we're passing numbers to the API
      const userId = Number(clientId);
      const whId = Number(warehouseId);

      console.log("Paramètres normalisés pour l'API:", {
        user_id: userId,
        warehouse_id: whId,
      });

      // Utiliser les noms de paramètres attendus par l'API
      const response = await axios.get("/api/orders/available-for-return", {
        params: {
          user_id: userId, // Le backend attend user_id et non clientId
          warehouse_id: whId,
        },
      });

      console.log("Réponse API available-for-return:", response.data);

      if (response.data && Array.isArray(response.data.orders)) {
        return response.data.orders.filter(
          (order: any) =>
            // Vérifier les différentes variations possibles du statut
            order.order_status === "Complété" ||
            order.order_status === "Completed" ||
            order.order_status === "Livré" ||
            order.order_status === "Delivered"
        );
      } else {
        console.warn("Format de réponse inattendu:", response.data);
        return [];
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des ventes pour retour:",
        error
      );

      // En cas d'erreur, essayer avec l'ancien endpoint comme fallback
      try {
        console.log(
          "Tentative avec l'ancien endpoint de récupération des ventes"
        );
        const fallbackResponse = await axios.get("/api/orders", {
          params: {
            user_id: clientId,
            warehouse: warehouseId,
            order_type: "sales",
            order_status: "Completed",
          },
        });

        if (
          fallbackResponse.data &&
          Array.isArray(fallbackResponse.data.orders)
        ) {
          console.log(
            "Ventes récupérées avec l'ancien endpoint:",
            fallbackResponse.data.orders.length
          );
          return fallbackResponse.data.orders;
        } else {
          return [];
        }
      } catch (fallbackError) {
        console.error(
          "Échec du fallback pour la récupération des ventes:",
          fallbackError
        );
        return [];
      }
    }
  }

  async fetchFournisseurs(params: any = {}) {
    console.log("fetchFournisseurs (clients) - Paramètres reçus:", params);
    const requestParams = {
      user_type: "customers",
      status: "active",
      ...params,
    };

    // Convertir warehouse en warehouseId pour l'API des clients
    if (requestParams.warehouse) {
      requestParams.warehouseId = requestParams.warehouse;
      delete requestParams.warehouse;
    }

    console.log(
      "fetchFournisseurs (clients) - Paramètres finaux:",
      requestParams
    );

    try {
      console.log("Tentative d'utilisation de l'API spécifique aux clients");
      const response = await axios.get("/api/users/customers", {
        params: requestParams,
      });
      console.log("Réponse de l'API clients:", response.data);

      // Vérification des données reçues
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log("Analyse des IDs des clients reçus:");
        response.data.forEach((client: any, index: number) => {
          if (index < 5) {
            // Limiter à 5 pour éviter trop de logs
            console.log(
              `Client ${index + 1}: ID=${client.id}, Nom=${client.name}`
            );
          }
        });
        return response.data;
      } else {
        console.warn(
          "La réponse n'est pas un tableau ou est vide:",
          response.data
        );
        return [];
      }
    } catch (specificApiError) {
      console.warn(
        "L'API spécifique aux clients a échoué, tentative avec l'API générique",
        specificApiError
      );

      // Fallback à l'API générique avec les bons paramètres
      console.log(
        "fetchFournisseurs (clients) - Paramètres envoyés à l'API générique:",
        requestParams
      );
      const response = await axios.get("/api/users", { params: requestParams });
      console.log(
        "fetchFournisseurs (clients) - Réponse API status:",
        response.status
      );

      let fournisseursData = [];
      if (
        response.data &&
        response.data.users &&
        Array.isArray(response.data.users)
      ) {
        fournisseursData = response.data.users;
      } else if (Array.isArray(response.data)) {
        fournisseursData = response.data;
      }

      console.log(`Clients récupérés: ${fournisseursData.length}`);
      if (fournisseursData.length > 0) {
        console.log("Premier client:", fournisseursData[0]);
        // Analyse des IDs des clients
        fournisseursData.slice(0, 5).forEach((client: any, index: number) => {
          console.log(
            `Client ${index + 1}: ID=${client.id}, Nom=${client.name}`
          );
        });
      }

      return fournisseursData;
    }
  }

  async fetchProduits(params: any = {}) {
    const response = await axios.get("/api/produits", { params });
    return response.data.products;
  }

  async fetchTaxes() {
    const response = await axios.get("/api/taxes");
    return response.data.taxes;
  }

  async fetchOrderItems(orderId: string) {
    try {
      console.log(`Récupération des articles pour la commande ${orderId}`);
      const response = await axios.get(`/api/orders/${orderId}/items`);

      // Vérifier que nous avons une réponse valide
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(
            `${response.data.length} articles trouvés pour la commande ${orderId}`
          );
          return response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          console.log(
            `${response.data.items.length} articles trouvés dans la propriété 'items' pour la commande ${orderId}`
          );
          return response.data.items;
        }
      }

      // Si aucun article n'est trouvé, retourner un tableau vide
      console.warn(`Aucun article trouvé pour la commande ${orderId}`);
      return [];
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des articles pour la commande ${orderId}:`,
        error
      );
      return [];
    }
  }

  // Récupérer les quantités déjà retournées pour une commande d'origine
  async fetchReturnedQuantities(
    originalOrderId: string,
    excludeReturnId?: number
  ) {
    try {
      console.log(
        `Récupération des quantités retournées pour la commande d'origine ${originalOrderId}`
      );
      let url = `/api/orders/${originalOrderId}/returned-quantities`;

      // Si un ID de retour à exclure est spécifié, l'ajouter aux paramètres
      if (excludeReturnId) {
        url += `?exclude_return_id=${excludeReturnId}`;
        console.log(
          `Exclusion du retour ID ${excludeReturnId} du calcul des quantités retournées`
        );
      }

      const response = await axios.get(url);

      if (response.data && Array.isArray(response.data)) {
        console.log(
          `${response.data.length} produits avec quantités retournées trouvés pour la commande d'origine ${originalOrderId}`
        );
        return response.data;
      }

      // Si aucune quantité retournée n'est trouvée, retourner un tableau vide
      console.log(
        `Aucune quantité retournée trouvée pour la commande d'origine ${originalOrderId}`
      );
      return [];
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des quantités retournées pour la commande d'origine ${originalOrderId}:`,
        error
      );
      return [];
    }
  }

  async fetchWarehouses() {
    const response = await axios.get("/api/warehouses", {
      params: { is_active: true },
    });
    return response.data.warehouses;
  }

  async fetchWarehouse(id: number) {
    if (!id) {
      console.error("ID d'entrepôt invalide (null ou undefined)");
      return null;
    }
    try {
      console.log(`Tentative de récupération de l'entrepôt avec ID: ${id}`);
      if (isNaN(id)) {
        console.error("ID d'entrepôt n'est pas un nombre valide:", id);
        return null;
      }
      try {
        const response = await axios.get(`/api/warehouses/${id}`);
        console.log(`Entrepôt ${id} récupéré avec succès:`, response.data);
        return response.data;
      } catch (directError) {
        console.warn(
          `Erreur lors de la récupération directe de l'entrepôt ${id}:`,
          directError
        );
        console.log(
          "Tentative de récupération via la liste complète des entrepôts"
        );
        const allWarehousesResponse = await axios.get("/api/warehouses");
        if (
          allWarehousesResponse.data &&
          allWarehousesResponse.data.warehouses
        ) {
          const warehouses = allWarehousesResponse.data.warehouses;
          const warehouse = warehouses.find(
            (w: any) => Number(w.id) === Number(id)
          );
          if (warehouse) {
            console.log(
              `Entrepôt ${id} trouvé dans la liste complète:`,
              warehouse
            );
            return warehouse;
          }
        }
        console.error(`Entrepôt ${id} non trouvé dans la liste des entrepôts`);
        return {
          id: id,
          name: `Entrepôt ${id}`,
          address: "",
          phone: "",
          email: "",
        };
      }
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de l'entrepôt ${id}:`,
        error
      );
      return {
        id: id,
        name: `Entrepôt ${id}`,
        address: "",
        phone: "",
        email: "",
      };
    }
  }
}

const retourVenteAPI = new RetourVenteAPI();

// Reducer et état
interface RetourVentesState {
  retourVentes: RetourAchat[];
  fournisseurs: Fournisseur[];
  produits: Product[];
  taxes: Tax[];
  loading: boolean;
  currentRetourVente: RetourAchat | null;
  retourAchatItems: RetourAchatItem[];
  orderPayments: Payment[];
  warehouses: Warehouse[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number; // Nouvelle propriété
  error: string | null;
  currentWarehouse: any;
  activeTab?: string;
}

type RetourVentesAction =
  | {
      type: "FETCH_RETOUR_VENTES_SUCCESS";
      payload: RetourAchat[];
      totalItems: number;
    }
  | { type: "FETCH_FOURNISSEURS_SUCCESS"; payload: Fournisseur[] }
  | { type: "FETCH_PRODUITS_SUCCESS"; payload: Product[] }
  | { type: "FETCH_TAXES_SUCCESS"; payload: Tax[] }
  | { type: "FETCH_WAREHOUSES_SUCCESS"; payload: Warehouse[] }
  | { type: "SET_CURRENT_RETOUR_VENTE"; payload: RetourAchat }
  | { type: "SET_RETOUR_ACHAT_ITEMS"; payload: RetourAchatItem[] }
  | { type: "SET_ORDER_PAYMENTS"; payload: Payment[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_CURRENT_WAREHOUSE"; payload: any }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number };

const retourVentesReducer = (
  state: RetourVentesState,
  action: RetourVentesAction
): RetourVentesState => {
  switch (action.type) {
    case "FETCH_RETOUR_VENTES_SUCCESS":
      return {
        ...state,
        retourVentes: action.payload,
        totalItems: action.totalItems,
        loading: false,
      };
    case "FETCH_FOURNISSEURS_SUCCESS":
      return { ...state, fournisseurs: action.payload, loading: false };
    case "FETCH_PRODUITS_SUCCESS":
      return { ...state, produits: action.payload, loading: false };
    case "FETCH_TAXES_SUCCESS":
      return { ...state, taxes: action.payload, loading: false };
    case "FETCH_WAREHOUSES_SUCCESS":
      return { ...state, warehouses: action.payload, loading: false };
    case "SET_CURRENT_RETOUR_VENTE":
      return { ...state, currentRetourVente: action.payload };
    case "SET_RETOUR_ACHAT_ITEMS":
      return { ...state, retourAchatItems: action.payload };
    case "SET_ORDER_PAYMENTS":
      return { ...state, orderPayments: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_CURRENT_WAREHOUSE":
      return { ...state, currentWarehouse: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload };
    default:
      return state;
  }
};

// Formatter les nombres pour l'affichage
const formatNumber = (value: any): string => {
  if (value === undefined || value === null) return "0";
  return Math.round(parseFloat(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Composant PaymentFormModal pour les retours de vente
interface PaymentFormModalProps {
  visible: boolean;
  onClose: () => void;
  order: RetourAchat | null;
  onPaymentAdded: () => void;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  visible,
  onClose,
  order,
  onPaymentAdded,
}) => {
  const [form] = Form.useForm();
  const [amount, setAmount] = useState<number>(0);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedWarehouse } = useSelection();

  // Calcul du statut de paiement
  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): string => {
    if (paidAmount <= 0) return "Non payé";
    else if (paidAmount < totalAmount) return "Partiellement payé";
    else return "Payé";
  };

  const fetchPaymentModes = async () => {
    try {
      console.log("Récupération des modes de paiement...");
      try {
        const response = await axios.get("/api/payment-modes");
        if (response.data && response.data.paymentModes) {
          setPaymentModes(response.data.paymentModes);
          return;
        } else if (response.data && response.data.payment_modes) {
          setPaymentModes(response.data.payment_modes);
          return;
        } else if (Array.isArray(response.data)) {
          setPaymentModes(response.data);
          return;
        }
      } catch (primaryError) {
        console.warn("Première tentative échouée:", primaryError);
      }
      try {
        console.log("Tentative avec API alternative...");
        const altResponse = await axios.get("/api/payment-modes/list");
        if (altResponse.data) {
          if (Array.isArray(altResponse.data)) {
            setPaymentModes(altResponse.data);
            return;
          } else if (
            altResponse.data.paymentModes ||
            altResponse.data.payment_modes
          ) {
            setPaymentModes(
              altResponse.data.paymentModes || altResponse.data.payment_modes
            );
            return;
          }
        }
      } catch (secondaryError) {
        console.warn("Deuxième tentative échouée:", secondaryError);
      }
      console.log("Utilisation des modes de paiement par défaut");
      const defaultModes = [
        { id: 1, name: "Espèces" },
        { id: 2, name: "Chèque" },
        { id: 3, name: "Virement bancaire" },
      ];
      setPaymentModes(defaultModes);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des modes de paiement:",
        error
      );
      message.error("Impossible de charger les modes de paiement");
      const fallbackModes = [
        { id: 1, name: "Espèces" },
        { id: 2, name: "Virement" },
      ];
      setPaymentModes(fallbackModes);
    }
  };

  useEffect(() => {
    if (visible && order) {
      fetchPaymentModes();
      form.setFieldsValue({
        date: dayjs(),
        amount: order.due_amount,
        payment_mode_id: undefined,
        notes: "",
      });
      setAmount(order.due_amount);
    }
  }, [visible, order, form]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <DollarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <span>Ajouter un paiement pour le retour de vente</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="95%"
      style={{ maxWidth: 1000, top: 20 }}
      footer={[
        <Button key="back" onClick={onClose}>
          Fermer
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!order || amount <= 0 || amount > order.due_amount}
          onClick={async () => {
            if (!order) return;
            setLoading(true);
            try {
              const newPaidAmount = Number(order.paid_amount) + Number(amount);
              const newDueAmount = Number(order.total) - newPaidAmount;
              const newPaymentStatus = calculatePaymentStatus(
                newPaidAmount,
                order.total
              );
              const paymentData = {
                payment: {
                  company_id:
                    order.company_id || selectedWarehouse?.company_id || 1,
                  warehouse_id:
                    order.warehouse_id || selectedWarehouse?.id || 1,
                  payment_type: "out", // Pour les retours de vente, l'argent sort (remboursement)
                  date: dayjs().format("YYYY-MM-DD"),
                  amount: amount,
                  payment_mode_id: form.getFieldValue("payment_mode_id"),
                  user_id: order.user_id,
                  notes:
                    form.getFieldValue("notes") ||
                    "Paiement pour retour de vente",
                  orders: [{ order_id: order.id, amount: amount }],
                },
                order: {
                  id: order.id,
                  paid_amount: newPaidAmount,
                  due_amount: newDueAmount,
                  payment_status: newPaymentStatus,
                },
              };
              try {
                const response = await axios.post(
                  "/api/payments/process-order-payment",
                  paymentData
                );
                message.success("Paiement ajouté avec succès");
                onPaymentAdded();
                onClose();
              } catch (primaryError) {
                console.error(
                  "Erreur avec l'endpoint principal:",
                  primaryError
                );
                try {
                  const alternativeResponse = await axios.post(
                    "/api/payments",
                    paymentData.payment
                  );
                  await axios.put(`/api/orders/${order.id}`, {
                    paid_amount: newPaidAmount,
                    due_amount: newDueAmount,
                    payment_status: newPaymentStatus,
                  });
                  message.success(
                    "Paiement ajouté avec succès (méthode alternative)"
                  );
                  onPaymentAdded();
                  onClose();
                } catch (secondaryError) {
                  console.error(
                    "Erreur avec l'endpoint alternatif:",
                    secondaryError
                  );
                  message.error(
                    "Erreur lors de l'ajout du paiement. Veuillez réessayer."
                  );
                }
              }
            } catch (error) {
              console.error("Erreur lors de l'ajout du paiement:", error);
              message.error("Erreur lors de l'ajout du paiement");
            } finally {
              setLoading(false);
            }
          }}
        >
          Enregistrer le paiement
        </Button>,
      ]}
      destroyOnClose
    >
      {order && (
        <div>
          <div className="payment-info-box">
            <Row gutter={24}>
              <Col span={12}>
                <Statistic
                  title="N° de facture"
                  value={order.invoice_number}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Client"
                  value={order.user_name}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
            </Row>
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Montant total"
                  value={formatNumber(order.total)}
                  prefix="FCFA"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Déjà payé"
                  value={formatNumber(order.paid_amount)}
                  prefix="FCFA"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Reste à payer"
                  value={formatNumber(order.due_amount)}
                  prefix="FCFA"
                  valueStyle={{
                    color: order.due_amount > 0 ? "#ff4d4f" : "#52c41a",
                  }}
                />
              </Col>
            </Row>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              if (!order) return;
              setLoading(true);
              try {
                const newPaidAmount =
                  Number(order.paid_amount) + Number(values.amount);
                const newDueAmount = Number(order.total) - newPaidAmount;
                const newPaymentStatus = calculatePaymentStatus(
                  newPaidAmount,
                  order.total
                );
                const paymentData = {
                  payment: {
                    company_id:
                      order.company_id || selectedWarehouse?.company_id || 1,
                    warehouse_id:
                      order.warehouse_id || selectedWarehouse?.id || 1,
                    payment_type: "out", // Pour les retours de vente, l'argent sort (remboursement)
                    date: values.date.format("YYYY-MM-DD"),
                    amount: values.amount,
                    payment_mode_id: values.payment_mode_id,
                    user_id: order.user_id,
                    notes: values.notes || "Paiement pour retour de vente",
                    orders: [{ order_id: order.id, amount: values.amount }],
                  },
                  order: {
                    id: order.id,
                    paid_amount: newPaidAmount,
                    due_amount: newDueAmount,
                    payment_status: newPaymentStatus,
                  },
                };
                try {
                  const response = await axios.post(
                    "/api/payments/process-order-payment",
                    paymentData
                  );
                  message.success("Paiement ajouté avec succès");
                  onPaymentAdded();
                  onClose();
                } catch (primaryError) {
                  console.error(
                    "Erreur avec l'endpoint principal:",
                    primaryError
                  );
                  try {
                    const alternativeResponse = await axios.post(
                      "/api/payments",
                      paymentData.payment
                    );
                    await axios.put(`/api/orders/${order.id}`, {
                      paid_amount: newPaidAmount,
                      due_amount: newDueAmount,
                      payment_status: newPaymentStatus,
                    });
                    message.success(
                      "Paiement ajouté avec succès (méthode alternative)"
                    );
                    onPaymentAdded();
                    onClose();
                  } catch (secondaryError) {
                    console.error(
                      "Erreur avec l'endpoint alternatif:",
                      secondaryError
                    );
                    message.error(
                      "Erreur lors de l'ajout du paiement. Veuillez réessayer."
                    );
                  }
                }
              } catch (error) {
                console.error("Erreur lors de l'ajout du paiement:", error);
                message.error("Erreur lors de l'ajout du paiement");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Form.Item
              name="date"
              label="Date de paiement"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker className="full-width" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="amount"
              label="Montant"
              rules={[
                { required: true, message: "Veuillez entrer le montant" },
                {
                  validator: (_, value) => {
                    if (value <= 0) {
                      return Promise.reject(
                        "Le montant doit être supérieur à 0"
                      );
                    }
                    if (value > order.due_amount) {
                      return Promise.reject(
                        "Le montant ne peut pas dépasser le montant restant à payer"
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                className="full-width"
                min={0.01}
                max={order.due_amount}
                step={0.01}
                precision={2}
                onChange={(value) => setAmount(value as number)}
              />
            </Form.Item>
            <Form.Item
              name="payment_mode_id"
              label="Mode de paiement"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner un mode de paiement",
                },
              ]}
            >
              {paymentModes && paymentModes.length > 0 ? (
                <Select placeholder="Sélectionner un mode de paiement">
                  {Array.isArray(paymentModes) ? (
                    paymentModes.map((mode) => (
                      <Option key={mode.id} value={mode.id}>
                        {mode.name}
                      </Option>
                    ))
                  ) : (
                    <Option value="" disabled>
                      Chargement des modes de paiement...
                    </Option>
                  )}
                </Select>
              ) : (
                <div>
                  <Alert
                    message="Aucun mode de paiement disponible"
                    description="Veuillez d'abord configurer des modes de paiement dans les paramètres du système."
                    type="warning"
                    showIcon
                  />
                  <Select
                    placeholder="Aucun mode de paiement disponible"
                    disabled
                  />
                </div>
              )}
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={4} placeholder="Notes sur le paiement" />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};

// Composant OrderDetailModal pour les retours de vente
interface OrderDetailModalProps {
  order: RetourAchat | null;
  visible: boolean;
  onClose: () => void;
  produits: Product[];
  taxes: Tax[];
  fournisseurs: Fournisseur[];
  refreshOrderDetails: () => void;
  refreshRetourVentes: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  visible,
  onClose,
  produits,
  taxes,
  fournisseurs,
  refreshOrderDetails,
  refreshRetourVentes,
}) => {
  // Use any type for auth to bypass TypeScript's strict checking
  const auth: any = useAuth();

  // Safe access to hasPermission with fallback
  const hasPermission = (permission: string): boolean => {
    return typeof auth?.hasPermission === "function"
      ? auth.hasPermission(permission)
      : false;
  };

  const [activeTab, setActiveTab] = useState("details");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentDetailVisible, setPaymentDetailVisible] = useState(false);
  const { selectedWarehouse } = useSelection();

  // Définition de la fonction handleUpdateProduct ici pour être disponible dans le scope du composant
  const handleUpdateProduct = (index: number, key: string, value: any) => {
    console.log(`Mise à jour du produit ${index}, ${key} = ${value}`);
    // Note: comme il s'agit d'un modal de détail, nous ne modifions pas réellement les données
    // Cette fonction est ajoutée uniquement pour éviter les erreurs de compilation
  };

  const openPaymentDetails = (paymentId: number) => {
    const payment = payments.find((p) => p.id === paymentId);
    setSelectedPayment(payment);
    setActiveTab("payments");
  };

  const fetchOrderPayments = async (orderId: number) => {
    setLoadingPayments(true);
    try {
      console.log(
        `Récupération des paiements pour le retour de vente ID ${orderId}...`
      );

      // Vérification de sécurité pour éviter les requêtes avec un ID invalide
      if (!orderId || orderId <= 0) {
        console.error("ID de retour de vente invalide:", orderId);
        setPayments([]);
        setLoadingPayments(false);
        return;
      }

      // Essayer d'abord d'obtenir les paiements via l'endpoint spécifique
      const response = await axios.get(`/api/orders/${orderId}/payments`);
      console.log(
        `Réponse API /api/orders/${orderId}/payments:`,
        response.data
      );

      let paymentsData = [];
      if (response.data && Array.isArray(response.data)) {
        paymentsData = response.data;
        console.log(
          `${paymentsData.length} paiements trouvés pour le retour de vente #${orderId}`
        );
      }

      // Si aucun paiement n'est trouvé mais que le montant payé est supérieur à 0
      if (paymentsData.length === 0 && order && order.paid_amount > 0) {
        console.log(
          `Aucun paiement trouvé pour le retour #${orderId} mais montant payé: ${order.paid_amount}`
        );

        try {
          // Essayer de récupérer les détails du retour qui pourraient inclure les paiements
          console.log(
            `Tentative de récupération via l'API principale pour le retour #${orderId}`
          );
          const orderResponse = await axios.get(`/api/orders/${orderId}`);
          console.log(
            `Réponse API /api/orders/${orderId}:`,
            orderResponse.data
          );

          if (
            orderResponse.data &&
            orderResponse.data.payments &&
            orderResponse.data.payments.length > 0
          ) {
            paymentsData = orderResponse.data.payments;
            console.log(
              `${paymentsData.length} paiements récupérés depuis l'API principale pour #${orderId}`
            );
          } else {
            console.log(
              `Aucun paiement trouvé via l'API principale pour le retour #${orderId}`
            );

            // Créer un paiement d'information seulement si le montant payé est supérieur à 0
            if (order.paid_amount > 0) {
              const virtualPayment = {
                id: 999999,
                payment_number: `INFO-RETOUR-${orderId}`,
                date: order.order_date,
                amount: order.paid_amount,
                payment_mode_name: "Information manquante",
                remarks: `Le retour de vente #${orderId} indique un montant payé de ${order.paid_amount} FCFA, mais les détails du paiement ne sont pas disponibles.`,
              };
              paymentsData.push(virtualPayment);
            }
          }
        } catch (orderError) {
          console.error(
            `Erreur lors de la récupération des détails du retour #${orderId}:`,
            orderError
          );

          // Fournir un message informatif à l'utilisateur
          if (order.paid_amount > 0) {
            const virtualPayment = {
              id: 999999,
              payment_number: `ERREUR-${orderId}`,
              date: order.order_date,
              amount: order.paid_amount,
              payment_mode_name: "Erreur de récupération",
              remarks: `Impossible de récupérer les informations de paiement pour le retour #${orderId}. Veuillez consulter l'historique des paiements dans le module financier.`,
            };
            paymentsData.push(virtualPayment);
          }
        }
      }

      setPayments(paymentsData);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des paiements pour le retour #${orderId}:`,
        error
      );

      // Si l'erreur est due à l'absence d'endpoint /payments, essayer l'API principale
      if (order && order.paid_amount > 0) {
        try {
          console.log(
            `Tentative de récupération alternative pour le retour #${orderId}`
          );
          const fallbackResponse = await axios.get(`/api/orders/${orderId}`);
          if (fallbackResponse.data && fallbackResponse.data.payments) {
            setPayments(fallbackResponse.data.payments);
            return;
          }
        } catch (fallbackError) {
          console.error(
            `Erreur lors de la récupération alternative pour #${orderId}:`,
            fallbackError
          );
        }
      }

      message.error(
        `Impossible de charger les paiements pour le retour #${orderId}`
      );
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (order && visible) {
      fetchOrderPayments(order.id);
    }
  }, [order, visible]);

  useEffect(() => {
    if (!visible) {
      setActiveTab("details");
    }
  }, [visible]);

  if (!order) return null;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <span>Détails du retour de vente - {order?.invoice_number}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="95%"
      style={{ maxWidth: 1000, top: 20 }}
      footer={[
        <Button key="back" onClick={onClose}>
          Fermer
        </Button>,

        // Only show edit button if user has edit permission
        hasPermission("Gestion Commerciale.Ventes.RetourVente.edit") &&
          !order?.is_deleted && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                // Your edit logic here
                onClose();
                // Open edit form with order data
              }}
              disabled={order?.paid_amount > 0}
            >
              Modifier
            </Button>
          ),

        // Only show delete button if user has delete permission
        hasPermission("Gestion Commerciale.Ventes.RetourVente.delete") &&
          !order?.is_deleted && (
            <Button
              key="delete"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                // Your delete logic here
                Modal.confirm({
                  title: "Confirmation",
                  content:
                    "Voulez-vous vraiment supprimer ce retour de vente ?",
                  onOk: async () => {
                    try {
                      await retourVenteAPI.deleteRetourVente(order?.id || 0);
                      message.success("Retour de vente supprimé avec succès");
                      refreshRetourVentes();
                      onClose();
                    } catch (error) {
                      message.error("Erreur lors de la suppression");
                    }
                  },
                });
              }}
              disabled={order?.is_deletable === 0}
            >
              Supprimer
            </Button>
          ),
      ].filter(Boolean)} // Filter out false values
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        tabBarExtraContent={
          <Space>
            <Tooltip title="Imprimer">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => {
                  message.info("Fonction d'impression en développement");
                }}
              />
            </Tooltip>
            {order.due_amount > 0 && order.order_status !== "annulé" && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => {
                  setPaymentModalVisible(true);
                }}
              >
                Ajouter un paiement
              </Button>
            )}
          </Space>
        }
      >
        <TabPane tab="Détails de la commande" key="details">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Informations du retour de vente" bordered={false}>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    N° de facture:
                  </Col>
                  <Col span={12} className="detail-value">
                    {order.invoice_number}
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Date du retour:
                  </Col>
                  <Col span={12} className="detail-value">
                    {dayjs(order.order_date).format("DD/MM/YYYY")}
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Statut:
                  </Col>
                  <Col span={12} className="detail-value">
                    <Tag
                      color={
                        order.order_status === "complété"
                          ? "success"
                          : order.order_status === "annulé"
                          ? "error"
                          : "processing"
                      }
                    >
                      {order.order_status}
                    </Tag>
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Client:
                  </Col>
                  <Col span={12} className="detail-value">
                    {order.user_name || "Non spécifié"}
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Entrepôt:
                  </Col>
                  <Col span={12} className="detail-value">
                    {order.warehouse_name || "Non spécifié"}
                  </Col>
                </Row>
                {order.original_order_id && (
                  <Row className="detail-row">
                    <Col span={12} className="detail-label">
                      Vente d'origine:
                    </Col>
                    <Col span={12} className="detail-value">
                      {order.original_order_id}
                    </Col>
                  </Row>
                )}
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Notes:
                  </Col>
                  <Col span={12} className="detail-value">
                    {order.notes || "-"}
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Informations de paiement" bordered={false}>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Montant total:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.total)} FCFA
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Montant payé:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.paid_amount)} FCFA
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Montant restant:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.due_amount)} FCFA
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Statut de paiement:
                  </Col>
                  <Col span={12} className="detail-value">
                    <Tag
                      color={
                        order.payment_status === "Payé"
                          ? "success"
                          : order.payment_status === "Non payé"
                          ? "error"
                          : "warning"
                      }
                    >
                      {order.payment_status}
                    </Tag>
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Frais de livraison:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.shipping_cost || 0)} FCFA
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Remise:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.discount_amount || 0)} FCFA
                  </Col>
                </Row>
                <Row className="detail-row">
                  <Col span={12} className="detail-label">
                    Taxe:
                  </Col>
                  <Col span={12} className="detail-value">
                    {formatNumber(order.tax_amount || 0)} FCFA
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Divider orientation="left">Articles retournés</Divider>
          <div className="overflow-x-auto">
            <Table
              dataSource={order.items || []}
              rowKey={(item) =>
                `${item.product_id}_${
                  item.id || Math.random().toString(36).substr(2, 9)
                }`
              }
              pagination={false}
              bordered
              size="small"
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Produit",
                  dataIndex: "product_name",
                  key: "product_name",
                },
                {
                  title: "Quantité",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 150,
                  render: (text, record) => (
                    <div>
                      <span>{text}</span>
                      {record.max_quantity !== undefined && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "4px",
                          }}
                        >
                          Max: {record.max_quantity}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Prix unitaire",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 150,
                  render: (text) => `${formatNumber(text)} FCFA`,
                },
                {
                  title: "Remise",
                  dataIndex: "discount_rate",
                  key: "discount_rate",
                  width: 100,
                  render: (text) => `${text}%`,
                },
                {
                  title: "Taxe",
                  dataIndex: "tax_rate",
                  key: "tax_rate",
                  width: 150,
                  render: (text) => `${text}%`,
                },
                {
                  title: "Sous-total",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  width: 150,
                  render: (text) => `${formatNumber(text)} FCFA`,
                },
              ]}
              summary={() => <Table.Summary.Row></Table.Summary.Row>}
            />
          </div>
        </TabPane>
        <TabPane tab="Historique des paiements" key="payments">
          <div className="overflow-x-auto">
            <Table
              dataSource={payments}
              rowKey="id"
              loading={loadingPayments}
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "N° de paiement",
                  dataIndex: "payment_number",
                  key: "payment_number",
                },
                {
                  title: "Date",
                  dataIndex: "date",
                  key: "date",
                  render: (text) => dayjs(text).format("DD/MM/YYYY"),
                },
                {
                  title: "Mode de paiement",
                  dataIndex: "payment_mode_name",
                  key: "payment_mode_name",
                },
                {
                  title: "Montant",
                  dataIndex: "amount",
                  key: "amount",
                  render: (text) => `${formatNumber(text)} FCFA`,
                },
                {
                  title: "Notes",
                  dataIndex: "remarks",
                  key: "remarks",
                  ellipsis: true,
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 100,
                  render: (_, record) => (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => openPaymentDetails(record.id)}
                    >
                      Détails
                    </Button>
                  ),
                },
              ]}
            />
          </div>
          {payments.length === 0 && !loadingPayments && (
            <div className="empty-payments">
              <p>Aucun paiement enregistré pour ce retour de vente.</p>
              {order.due_amount > 0 && order.order_status !== "annulé" && (
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => setPaymentModalVisible(true)}
                >
                  Ajouter un paiement
                </Button>
              )}
            </div>
          )}
        </TabPane>
      </Tabs>
      {paymentModalVisible && (
        <PaymentFormModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          order={order}
          onPaymentAdded={() => {
            setPaymentModalVisible(false);
            refreshOrderDetails();
            refreshRetourVentes();
          }}
        />
      )}
      <Modal
        title="Détails du paiement"
        open={paymentDetailVisible}
        onCancel={() => setPaymentDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPayment && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <div className="payment-detail-item">
                  <div className="payment-detail-label">N° de paiement:</div>
                  <div className="payment-detail-value">
                    {selectedPayment.payment_number}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="payment-detail-item">
                  <div className="payment-detail-label">Date:</div>
                  <div className="payment-detail-value">
                    {dayjs(selectedPayment.date).format("DD/MM/YYYY")}
                  </div>
                </div>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <div className="payment-detail-item">
                  <div className="payment-detail-label">Mode de paiement:</div>
                  <div className="payment-detail-value">
                    {selectedPayment.payment_mode_name}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="payment-detail-item">
                  <div className="payment-detail-label">Montant:</div>
                  <div className="payment-detail-value">
                    {formatNumber(selectedPayment.amount)} FCFA
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <div className="payment-detail-item">
                  <div className="payment-detail-label">Notes:</div>
                  <div className="payment-detail-value">
                    {selectedPayment.remarks || "Aucune note"}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

// Composant du formulaire de retour de vente
interface RetourVenteFormProps {
  visible: boolean;
  onClose: () => void;
  refreshRetourVentes: () => void;
  retourVenteToEdit?: RetourAchat | null;
  isEditing?: boolean;
}

const RetourVenteForm: React.FC<RetourVenteFormProps> = ({
  visible,
  onClose,
  refreshRetourVentes,
  retourVenteToEdit,
  isEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<RetourAchatItem[]>(
    []
  );
  const [originalOrders, setOriginalOrders] = useState<any[]>([]);
  const [selectedOriginalOrder, setSelectedOriginalOrder] = useState<
    number | null
  >(null);
  const [originalOrderItems, setOriginalOrderItems] = useState<any[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const { selectedWarehouse } = useSelection();
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (visible && isEditing && retourVenteToEdit) {
      initFormWithExistingData();
    }
  }, [visible, isEditing, retourVenteToEdit]);

  const initFormWithExistingData = async () => {
    if (!retourVenteToEdit) return;
    try {
      setLoading(true);
      // Ensure we're setting a number for user_id
      const userId = Number(retourVenteToEdit.user_id);
      setSelectedSupplier(userId);
      console.log("Client ID défini (initForm):", userId, typeof userId);

      const originalOrderId = retourVenteToEdit.original_order_id || null;
      setSelectedOriginalOrder(originalOrderId);
      if (retourVenteToEdit.tax_id && taxes.length > 0) {
        const tax = taxes.find((t) => t.id === retourVenteToEdit.tax_id);
        if (tax) {
          setSelectedTax(tax);
        }
      }

      // Récupérer les articles du retour en cours d'édition
      let itemsToUse = retourVenteToEdit.items || [];
      if (itemsToUse.length === 0) {
        const items = await retourVenteAPI.fetchOrderItems(
          String(retourVenteToEdit.id)
        );
        itemsToUse = items;
      }

      // Variables pour stocker les données des articles originaux et retournés
      let originalItems: any[] = [];
      let returnedQuantities: any[] = [];

      // Si nous avons un original_order_id, récupérer les articles originaux et les quantités retournées
      if (originalOrderId) {
        try {
          // Récupérer les articles de la commande d'origine
          const response = await axios.get(
            `/api/orders/${originalOrderId}/items`
          );
          if (response.data && Array.isArray(response.data)) {
            originalItems = response.data;
          }

          // Récupérer les quantités déjà retournées pour cette commande (sauf celles du retour en cours d'édition)
          returnedQuantities = await retourVenteAPI.fetchReturnedQuantities(
            String(originalOrderId),
            retourVenteToEdit.id
          );
          console.log(
            "Quantités déjà retournées (hors retour actuel):",
            returnedQuantities
          );
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des données de la commande d'origine:",
            error
          );
        }
      }

      // Créer un dictionnaire des quantités retournées par product_id et order_item_id pour un accès rapide
      const returnedQuantitiesMap: { [key: string]: number } = {};
      returnedQuantities.forEach((item: any) => {
        // Créer une clé unique combinant l'ID du produit et l'ID de l'article de commande s'il existe
        const key = item.original_order_item_id
          ? `${item.product_id}-${item.original_order_item_id}`
          : `${item.product_id}`;
        returnedQuantitiesMap[key] = item.returned_quantity;
      });

      // Formatter les articles du retour en tenant compte des quantités maximales
      const formattedItems = itemsToUse.map((item: any) => {
        // Trouver l'article correspondant dans la commande d'origine
        const originalItem = originalItems.find(
          (origItem) =>
            origItem.id === item.original_order_item_id ||
            origItem.product_id === item.product_id
        );

        // Déterminer la quantité originale (si on a l'article d'origine, sinon utiliser la quantité actuelle)
        const originalQuantity = originalItem
          ? Number(originalItem.quantity)
          : Number(item.quantity);

        // Déterminer la quantité déjà retournée pour cet article (hors retour actuel)
        const key = item.original_order_item_id
          ? `${item.product_id}-${item.original_order_item_id}`
          : `${item.product_id}`;
        const returnedQty = returnedQuantitiesMap[key] || 0;

        // Calculer la quantité maximale disponible (quantité originale - quantités déjà retournées + quantité du retour actuel)
        // On ajoute la quantité du retour actuel car il s'agit d'une modification, pas d'un nouveau retour
        const maxQuantity = Math.max(
          0,
          originalQuantity - returnedQty + Number(item.quantity)
        );

        console.log(
          `Article ${item.product_name}: quantité originale=${originalQuantity}, quantité retournée=${returnedQty}, quantité actuelle=${item.quantity}, max disponible=${maxQuantity}`
        );

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          max_quantity: maxQuantity,
          unit_price: Number(item.unit_price),
          discount_rate: Number(item.discount_rate || 0),
          tax_rate: Number(item.tax_rate || 0),
          tax_amount: Number(item.tax_amount || 0),
          subtotal: Number(item.subtotal),
          original_order_id: retourVenteToEdit.original_order_id,
          original_order_item_id: item.original_order_item_id,
        };
      });

      setSelectedProducts(formattedItems);
      form.setFieldsValue({
        supplier_id: retourVenteToEdit.user_id,
        order_date: dayjs(retourVenteToEdit.order_date),
        order_status: retourVenteToEdit.order_status,
        original_order_id: retourVenteToEdit.original_order_id,
        tax_id: retourVenteToEdit.tax_id,
        terms_condition:
          retourVenteToEdit.terms_condition || retourVenteToEdit.notes || "",
        remarks: retourVenteToEdit.notes || "",
      });
      if (retourVenteToEdit.user_id && selectedWarehouse) {
        try {
          const orders = await retourVenteAPI.fetchVentesForReturn(
            userId, // Use the userId constant instead of retourVenteToEdit.user_id
            Number(selectedWarehouse)
          );
          setOriginalOrders(orders || []);
          if (
            originalOrderId &&
            !orders.some((order: any) => order.id === originalOrderId)
          ) {
            try {
              const originalOrderDetails = await axios.get(
                `/api/orders/${originalOrderId}`
              );
              if (originalOrderDetails.data) {
                setOriginalOrders([...orders, originalOrderDetails.data]);
              }
            } catch (orderError) {
              console.error(
                "Erreur lors de la récupération de la vente d'origine:",
                orderError
              );
            }
          }
          if (originalOrderId && originalItems.length > 0) {
            setOriginalOrderItems(originalItems);
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des ventes d'origine:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation du formulaire avec les données existantes:",
        error
      );
      message.error("Erreur lors du chargement des données du retour de vente");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setSelectedProducts([]);
    setSelectedSupplier(null);
    setSelectedOriginalOrder(null);
    setOriginalOrderItems([]);
    setSubTotal(0);
    setDiscountAmount(0);
    setTaxAmount(0);
    setGrandTotal(0);
    onClose(); // Ferme le formulaire
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const warehouseId = selectedWarehouse
          ? Number(selectedWarehouse)
          : null;
        if (!warehouseId) {
          message.warning("Veuillez sélectionner un magasin d'abord");
          setLoading(false);
          return;
        }
        const suppliersRes = await retourVenteAPI.fetchFournisseurs({
          warehouse: warehouseId,
        });
        setFournisseurs(suppliersRes);
        try {
          const taxesRes = await retourVenteAPI.fetchTaxes();
          setTaxes(taxesRes || []);
        } catch (taxesError) {
          console.error("Erreur lors du chargement des taxes:", taxesError);
          setTaxes([]);
        }
        await loadWarehouseTerms(warehouseId);
      } catch (error) {
        console.error("Error loading form data:", error);
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadData();
    } else {
      resetForm();
    }
  }, [visible, selectedWarehouse]);

  const loadWarehouseTerms = async (warehouseId: number) => {
    if (!warehouseId) {
      console.error("ID d'entrepôt non fourni à loadWarehouseTerms");
      return;
    }
    try {
      console.log(
        `Chargement des termes et conditions pour l'entrepôt ${warehouseId}`
      );
      const warehouse = await retourVenteAPI.fetchWarehouse(warehouseId);
      if (warehouse) {
        if (warehouse.terms_condition) {
          form.setFieldsValue({ terms_condition: warehouse.terms_condition });
        } else {
          form.setFieldsValue({ terms_condition: "" });
        }
      } else {
        form.setFieldsValue({ terms_condition: "" });
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement des termes et conditions:`,
        error
      );
      form.setFieldsValue({ terms_condition: "" });
    }
  };

  // Fonction pour charger les commandes d'origine
  const loadOriginalOrders = async (supplierIdParam?: number) => {
    const supplierId = supplierIdParam || selectedSupplier;
    if (!supplierId) {
      console.log(
        "Aucun client sélectionné, impossible de charger les ventes d'origine"
      );
      setOriginalOrders([]);
      return;
    }
    console.log(
      "Chargement des ventes d'origine pour client:",
      supplierId,
      "entrepôt:",
      selectedWarehouse.id,
      "Types:",
      typeof supplierId,
      typeof selectedWarehouse.id
    );
    setLoading(true);
    try {
      // Vérifier si supplierId existe dans les fournisseurs
      const clientExiste = fournisseurs.some((f) => f.id === supplierId);
      if (!clientExiste) {
        console.error(
          `Client avec ID ${supplierId} non trouvé dans la liste des clients!`
        );
        message.error("Client introuvable dans la base de données");
        setOriginalOrders([]);
        setLoading(false);
        return;
      }
      const userId = Number(supplierId);
      // Vérifier si selectedWarehouse est un objet ou directement une valeur
      const warehouseId =
        typeof selectedWarehouse === "object"
          ? Number(selectedWarehouse.id)
          : Number(selectedWarehouse);

      // Vérifier si warehouseId est un nombre valide
      if (isNaN(warehouseId)) {
        console.error(
          "L'ID d'entrepôt n'est pas un nombre valide:",
          selectedWarehouse
        );
        message.error("ID d'entrepôt invalide");
        setOriginalOrders([]);
        setLoading(false);
        return;
      }
      console.log("Paramètres normalisés pour l'API:", {
        user_id: userId,
        warehouse_id: warehouseId,
      });

      try {
        console.log(
          "Tentative avec l'API principale: /api/orders/available-for-return"
        );
        const response = await axios.get("/api/orders/available-for-return", {
          params: { user_id: userId, warehouse_id: warehouseId },
        });

        // Filtrer les commandes selon le statut de manière insensible à la casse
        const filteredOrders = response.data.orders.filter((order: any) => {
          const status = order.order_status.toLowerCase();
          return (
            status === "complété" ||
            status === "completed" ||
            status === "livré" ||
            status === "delivered"
          );
        });

        if (filteredOrders.length > 0) {
          setOriginalOrders(filteredOrders);
          console.log(
            `${filteredOrders.length} ventes trouvées pour le retour`
          );
        } else {
          console.warn("Aucune vente avec statut valide trouvée");
          setOriginalOrders([]);
          message.warning({
            content: (
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  Aucune vente disponible
                </div>
                <div>
                  Seules les ventes avec le statut "Complété" ou "Livré" peuvent
                  être retournées.
                </div>
              </div>
            ),
            duration: 5,
            style: { width: "400px", marginTop: "20px" },
          });
        }
      } catch (apiError) {
        console.error(
          "Erreur avec l'API principale, tentative avec API alternative:",
          apiError
        );

        // Fallback: utiliser l'API standard des commandes avec filtre
        try {
          console.log("Tentative avec l'API alternative: /api/orders");
          const alternativeResponse = await axios.get("/api/orders", {
            params: {
              user_id: userId,
              warehouse_id: warehouseId,
              order_type: "sales",
              is_deleted: 0,
            },
          });

          // S'assurer que nous avons des commandes et filtrer par statut
          if (alternativeResponse.data && alternativeResponse.data.orders) {
            const filteredAlternativeOrders =
              alternativeResponse.data.orders.filter((order: any) => {
                if (!order.order_status) return false;
                const status = order.order_status.toLowerCase();
                return (
                  status === "complété" ||
                  status === "completed" ||
                  status === "livré" ||
                  status === "delivered"
                );
              });

            if (filteredAlternativeOrders.length > 0) {
              setOriginalOrders(filteredAlternativeOrders);
              console.log(
                `${filteredAlternativeOrders.length} ventes trouvées via l'API alternative`
              );
            } else {
              console.warn(
                "Aucune vente avec statut valide trouvée via l'API alternative"
              );
              setOriginalOrders([]);
              message.warning({
                content: (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Aucune vente disponible
                    </div>
                    <div>
                      Seules les ventes avec le statut "Complété" ou "Livré"
                      peuvent être retournées.
                    </div>
                  </div>
                ),
                duration: 5,
                style: { width: "400px", marginTop: "20px" },
              });
            }
          } else {
            throw new Error(
              "Format de réponse invalide dans l'API alternative"
            );
          }
        } catch (alternativeError) {
          console.error(
            "Échec également de l'API alternative:",
            alternativeError
          );
          setOriginalOrders([]);
          message.error({
            content: (
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  Erreur lors du chargement des ventes
                </div>
                <div>
                  Les deux API ont échoué. Veuillez contacter l'administrateur
                  système.
                </div>
              </div>
            ),
            duration: 5,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des ventes d'origine:", error);
      setOriginalOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (selectedProducts.length === 0) {
      message.error("Veuillez ajouter au moins un produit au retour de vente");
      return;
    }
    setLoading(true);
    try {
      const companyId =
        fournisseurs.find((s) => s.id === selectedSupplier)?.company_id || 1;
      const totalItems = selectedProducts.length;
      const totalQuantity = selectedProducts.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const orderData = {
        company_id: companyId,
        order_type: "sales_return",
        user_id: values.supplier_id,
        warehouse_id: selectedWarehouse,
        order_date: values.order_date.format("YYYY-MM-DD"),
        order_status: values.order_status,
        discount: discountAmount,
        tax_id: selectedTax ? selectedTax.id : null,
        tax_rate: selectedTax ? selectedTax.rate : null,
        tax_amount: taxAmount,
        subtotal: subTotal,
        total: grandTotal,
        paid_amount: isEditing ? retourVenteToEdit?.paid_amount || 0 : 0,
        due_amount: isEditing
          ? grandTotal - (retourVenteToEdit?.paid_amount || 0)
          : grandTotal,
        payment_status: isEditing
          ? calculatePaymentStatus(
              retourVenteToEdit?.paid_amount || 0,
              grandTotal
            )
          : "Non payé",
        terms_condition: values.terms_condition || "",
        notes: values.remarks || "",
        staff_user_id: null,
        total_items: totalItems,
        total_quantity: totalQuantity,
        original_order_id: selectedOriginalOrder,
        items: selectedProducts.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate,
          tax_rate: selectedTax ? selectedTax.rate : item.tax_rate,
          tax_amount: selectedTax
            ? (item.unit_price *
                item.quantity *
                (1 - item.discount_rate / 100) *
                selectedTax.rate) /
              100
            : item.tax_amount,
          subtotal: item.subtotal,
          original_order_item_id: item.original_order_item_id,
          id: isEditing && item.id ? item.id : undefined,
        })),
      };
      console.log("Données du retour de vente à envoyer:", orderData);
      if (isEditing && retourVenteToEdit) {
        await retourVenteAPI.updateRetourVente(retourVenteToEdit.id, orderData);
        message.success("Retour de vente mis à jour avec succès");
      } else {
        await retourVenteAPI.createRetourVente(orderData);
        message.success("Retour de vente enregistré avec succès");
      }
      resetForm();
      refreshRetourVentes();
      onClose();
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du retour de vente:",
        error
      );
      message.error("Erreur lors de l'enregistrement du retour de vente");
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): string => {
    if (paidAmount <= 0) return "Non payé";
    else if (paidAmount < totalAmount) return "Partiellement payé";
    else return "Payé";
  };

  const handleUpdateProduct = (index: number, key: string, value: any) => {
    const updatedProducts = [...selectedProducts];
    const product = { ...updatedProducts[index] };

    // Si on met à jour la quantité, vérifier qu'elle ne dépasse pas le maximum autorisé
    if (key === "quantity") {
      const maxQty = product.max_quantity ?? 0;
      const numericValue = Number(value);

      // Si la valeur saisie dépasse la quantité maximale, la limiter au maximum
      if (numericValue > maxQty) {
        value = maxQty;
        message.warning(
          `La quantité de retour est limitée à ${maxQty} pour ce produit`,
          3
        );
      }

      // Si la valeur est négative, la limiter à 0
      if (numericValue < 0) {
        value = 0;
      }
    }

    // Mettre à jour la valeur
    (product as any)[key] = value;

    // Recalculer les valeurs financières
    const quantity = product.quantity;
    const unitPrice = product.unit_price;
    const discountRate = product.discount_rate;
    const discountAmount = (unitPrice * quantity * discountRate) / 100;
    const taxableAmount = unitPrice * quantity - discountAmount;
    const taxRate = product.tax_rate;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const subtotal = taxableAmount + taxAmount;
    product.tax_amount = taxAmount;
    product.subtotal = subtotal;
    updatedProducts[index] = product;
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  useEffect(() => {
    const newSubTotal = selectedProducts.reduce((total, item) => {
      const itemPrice = item.unit_price * item.quantity;
      const itemDiscount = (itemPrice * item.discount_rate) / 100;
      return total + (itemPrice - itemDiscount);
    }, 0);
    setSubTotal(newSubTotal);

    const newDiscountAmount = selectedProducts.reduce((total, item) => {
      const itemPrice = item.unit_price * item.quantity;
      const itemDiscount = (itemPrice * item.discount_rate) / 100;
      return total + itemDiscount;
    }, 0);
    setDiscountAmount(newDiscountAmount);

    let newTaxAmount = 0;
    if (selectedTax) {
      newTaxAmount = (newSubTotal * selectedTax.rate) / 100;
      const updatedProducts = selectedProducts.map((item, idx) => {
        if (idx === idx) {
          const quantity = item.quantity;
          const unitPrice = item.unit_price;
          const discountRate = item.discount_rate;
          const discountAmount = (unitPrice * quantity * discountRate) / 100;
          const taxableAmount = unitPrice * quantity - discountAmount;
          const itemTaxAmount = (taxableAmount * selectedTax.rate) / 100;
          return {
            ...item,
            tax_rate: selectedTax.rate,
            tax_amount: itemTaxAmount,
            subtotal: taxableAmount + itemTaxAmount,
          };
        }
        return item;
      });
      if (
        JSON.stringify(updatedProducts) !== JSON.stringify(selectedProducts)
      ) {
        setSelectedProducts(updatedProducts);
      }
    } else {
      newTaxAmount = selectedProducts.reduce(
        (total, item) => total + item.tax_amount,
        0
      );
    }
    setTaxAmount(newTaxAmount);
    const newGrandTotal = newSubTotal + newTaxAmount;
    setGrandTotal(newGrandTotal);
  }, [selectedProducts, selectedTax]);

  useEffect(() => {
    const loadOriginalOrderItems = async () => {
      if (!selectedOriginalOrder) {
        setSelectedProducts([]);
        return;
      }
      try {
        setLoadingProducts(true);
        console.log(
          `Chargement des produits pour la vente ${selectedOriginalOrder}`
        );

        // Récupérer les articles de la commande d'origine
        const response = await axios.get(
          `/api/orders/${selectedOriginalOrder}/items`
        );
        if (!response.data || !Array.isArray(response.data)) {
          message.error("Impossible de charger les articles de la commande", 3);
          setSelectedProducts([]);
          return;
        }

        console.log(
          `${response.data.length} produits trouvés pour la vente`,
          response.data
        );

        // Récupérer les quantités déjà retournées pour cette commande
        const returnedQuantities = await retourVenteAPI.fetchReturnedQuantities(
          String(selectedOriginalOrder)
        );
        console.log("Quantités déjà retournées:", returnedQuantities);

        // Créer une map des quantités disponibles par ID d'article
        const availableQuantitiesMap: { [key: string]: any } = {};
        returnedQuantities.forEach((item: any) => {
          availableQuantitiesMap[item.original_order_item_id] = item;
        });

        // Créer les éléments de retour avec la quantité maximale ajustée
        const returnItems: RetourAchatItem[] = response.data.map(
          (item: any) => {
            const unitPrice = item.unit_price;
            const originalQuantity = item.quantity;
            const discountRate = item.discount_rate || 0;
            const discountAmount =
              (unitPrice * originalQuantity * discountRate) / 100;
            const taxableAmount = unitPrice * originalQuantity - discountAmount;
            const taxRate = item.tax_rate || 0;
            const taxAmount = (taxableAmount * taxRate) / 100;
            const subtotal = taxableAmount + taxAmount;

            // Récupérer les informations de quantité retournée
            const availableInfo = availableQuantitiesMap[item.id] || {
              original_quantity: originalQuantity,
              returned_quantity: 0,
              available_quantity: originalQuantity,
            };

            // Calculer la quantité maximale disponible pour retour
            const maxQuantity = availableInfo.available_quantity;

            console.log(
              `Article ${
                item.product_name || item.nom_produit
              }: quantité originale=${originalQuantity}, quantité retournée=${
                availableInfo.returned_quantity
              }, max disponible=${maxQuantity}`
            );

            return {
              product_id: item.product_id,
              product_name: item.product_name || item.nom_produit,
              quantity: maxQuantity > 0 ? 1 : 0, // Par défaut 1, ou 0 si rien n'est disponible
              original_quantity: originalQuantity,
              returned_quantity: availableInfo.returned_quantity,
              max_quantity: maxQuantity,
              unit_price: unitPrice,
              discount_rate: discountRate,
              tax_rate: taxRate,
              tax_amount: taxAmount,
              subtotal,
              original_order_id: selectedOriginalOrder,
              original_order_item_id: item.id,
            };
          }
        );

        // Filtrer pour ne garder que les produits avec une quantité disponible
        const availableItems = returnItems.filter(
          (item) => (item.max_quantity ?? 0) > 0
        );

        if (availableItems.length === 0) {
          message.warning(
            "Tous les articles de cette commande ont déjà été retournés",
            5
          );
        }

        setSelectedProducts(availableItems);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des articles de la commande:",
          error
        );
        message.error("Erreur lors du chargement des articles de la commande");
        setSelectedProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadOriginalOrderItems();
  }, [selectedOriginalOrder]);

  // Modifier le gestionnaire du changement de client pour forcer le rechargement des ventes
  const handleClientChange = (value: number) => {
    console.log("Client sélectionné:", value, typeof value);

    // Vérifier si le client existe dans la liste
    const clientFound = fournisseurs.find((f) => f.id === value);
    if (!clientFound) {
      console.error(
        `Client avec ID ${value} non trouvé dans la liste des clients!`
      );
      message.error("Client sélectionné n'existe pas dans la base de données");
      return;
    }

    console.log("Client trouvé dans la liste:", clientFound);

    // Ensure we're setting a number
    const userId = Number(value);
    setSelectedSupplier(userId);
    console.log("Client ID défini:", userId, typeof userId);

    // Réinitialiser la vente d'origine sélectionnée et les produits à chaque changement de client
    setSelectedOriginalOrder(null);
    setSelectedProducts([]);
    setOriginalOrders([]);

    // Si un client est sélectionné, charger les ventes disponibles
    if (userId && selectedWarehouse) {
      console.log("Chargement des ventes pour le nouveau client");
      loadOriginalOrders(userId);
    }
  };

  const handleOriginalOrderChange = async (value: any) => {
    console.log("Commande d'origine sélectionnée:", value);

    // Réinitialiser les produits sélectionnés
    setSelectedProducts([]);

    // Si aucune valeur n'est sélectionnée
    if (!value) {
      setSelectedOriginalOrder(null);
      return;
    }

    // Mettre à jour l'état de la commande d'origine sélectionnée
    setSelectedOriginalOrder(value);
    // Les produits seront chargés automatiquement via le useEffect qui surveille selectedOriginalOrder
  };

  // Calculer les totaux en fonction des produits sélectionnés
  const calculateTotals = (products: RetourAchatItem[] = selectedProducts) => {
    if (!products || products.length === 0) {
      setSubTotal(0);
      setTaxAmount(0);
      setDiscountAmount(0);
      setGrandTotal(0);
      form.setFieldsValue({
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total: 0,
      });
      return;
    }

    // Calculer le sous-total (sans les taxes et remises)
    let newSubTotal = 0;
    let newTaxAmount = 0;

    // Calculer pour chaque produit
    products.forEach((product) => {
      const quantity = product.quantity || 0;
      const unitPrice = product.unit_price || 0;
      const discountRate = product.discount_rate || 0;
      const taxRate = product.tax_rate || 0;

      // Prix de base
      const baseAmount = quantity * unitPrice;

      // Remise
      const productDiscountAmount = (baseAmount * discountRate) / 100;

      // Montant taxable
      const taxableAmount = baseAmount - productDiscountAmount;

      // Taxe
      const productTaxAmount = (taxableAmount * taxRate) / 100;

      // Ajouter au total
      newSubTotal += taxableAmount;
      newTaxAmount += productTaxAmount;
    });

    // Récupérer les valeurs actuelles du formulaire
    const totalDiscountAmount = form.getFieldValue("discount_amount") || 0;
    const shippingCost = form.getFieldValue("shipping_cost") || 0;

    // Calculer le total final
    const newGrandTotal =
      newSubTotal + newTaxAmount - totalDiscountAmount + shippingCost;

    // Mettre à jour les états
    setSubTotal(newSubTotal);
    setTaxAmount(newTaxAmount);
    setDiscountAmount(totalDiscountAmount);
    setGrandTotal(newGrandTotal);

    // Mettre à jour les champs du formulaire
    form.setFieldsValue({
      subtotal: newSubTotal.toFixed(2),
      tax_amount: newTaxAmount.toFixed(2),
      total: newGrandTotal.toFixed(2),
    });

    console.log("Totaux calculés:", {
      subTotal: newSubTotal,
      taxAmount: newTaxAmount,
      discountAmount: totalDiscountAmount,
      shippingCost: shippingCost,
      grandTotal: newGrandTotal,
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <PlusOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <span>
            {isEditing
              ? "Modifier le retour de vente"
              : "Nouveau retour de vente"}
          </span>
        </div>
      }
      open={visible}
      onCancel={resetForm}
      width="95%"
      style={{ maxWidth: 1000, top: 20 }}
      footer={[
        <Button key="back" onClick={resetForm}>
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => form.submit()}
          loading={loading}
        >
          {isEditing ? "Mettre à jour" : "Enregistrer"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          order_date: dayjs(),
          order_status: "completed",
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="supplier_id"
              label="Client"
              rules={[
                { required: true, message: "Veuillez sélectionner un client" },
              ]}
            >
              <Select
                placeholder="Sélectionner un client"
                onChange={handleClientChange}
              >
                {fournisseurs.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="order_date"
              label="Date du retour"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker className="full-width" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="order_status"
              label="Statut retour de vente"
              rules={[
                { required: true, message: "Veuillez sélectionner un statut" },
              ]}
            >
              <Select placeholder="Sélectionner un statut">
                <Option value="pending">En attente</Option>
                <Option value="completed">Complété</Option>
                <Option value="cancelled">Annulé</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Vente d'origine"
              name="original_order_id"
              rules={
                isEditing
                  ? []
                  : [
                      {
                        required: true,
                        message: "Veuillez sélectionner une vente d'origine",
                      },
                    ]
              }
            >
              <Select
                placeholder={
                  selectedSupplier
                    ? "Sélectionner une vente d'origine"
                    : "Veuillez d'abord sélectionner un client"
                }
                onChange={handleOriginalOrderChange}
                disabled={!selectedSupplier}
                loading={loading}
                optionFilterProp="children"
                showSearch
                style={{ width: "100%" }}
                notFoundContent={
                  loading ? (
                    <Spin size="small" />
                  ) : (
                    <Empty
                      description={
                        selectedSupplier
                          ? "Aucune vente disponible pour ce client"
                          : "Veuillez sélectionner un client"
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )
                }
              >
                {Array.isArray(originalOrders) && originalOrders.length > 0 ? (
                  originalOrders.map((order) => (
                    <Option key={order.id} value={order.id}>
                      {order.invoice_number} -{" "}
                      {dayjs(order.order_date).format("DD/MM/YYYY")} -{" "}
                      {formatNumber(order.total)} FCFA{" "}
                      {order.order_status && (
                        <Tag
                          color={
                            order.order_status.toLowerCase() === "completed"
                              ? "green"
                              : "blue"
                          }
                        >
                          {order.order_status}
                        </Tag>
                      )}
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>
                    {selectedSupplier
                      ? "Aucune vente disponible pour ce client"
                      : "Veuillez d'abord sélectionner un client"}
                  </Option>
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="Taxe globale" name="tax_id">
              <Select
                placeholder="Sélectionner une taxe (optionnel)"
                allowClear
                onChange={(value) => {
                  if (value) {
                    const tax = taxes.find((t) => t.id === value);
                    setSelectedTax(tax || null);
                  } else {
                    setSelectedTax(null);
                  }
                }}
              >
                {taxes.map((tax) => (
                  <Option key={tax.id} value={tax.id}>
                    {tax.name} ({tax.rate}%)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Divider>Articles sélectionnés pour le retour</Divider>
        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin tip="Chargement des produits..." />
          </div>
        ) : selectedOriginalOrder ||
          (isEditing && selectedProducts.length > 0) ? (
          <div className="overflow-x-auto">
            <Table
              dataSource={selectedProducts}
              rowKey={(record) =>
                `${record.product_id}_${
                  record.original_order_item_id ||
                  Math.random().toString(36).substr(2, 9)
                }`
              }
              pagination={false}
              bordered
              size="small"
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Produit",
                  dataIndex: "product_name",
                  key: "product_name",
                },
                {
                  title: "Quantité originale",
                  dataIndex: "original_quantity",
                  key: "original_quantity",
                  width: 150,
                  render: (value) => value?.toFixed(2) || "-",
                  responsive: ["sm"],
                },
                {
                  title: "Déjà retournée",
                  dataIndex: "returned_quantity",
                  key: "returned_quantity",
                  width: 150,
                  render: (value) => value?.toFixed(2) || "0.00",
                  responsive: ["sm"],
                },
                {
                  title: "Quantité à retourner",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 150,
                  render: (value, record, index) => (
                    <InputNumber
                      min={0}
                      max={record.max_quantity}
                      style={{ width: "100%" }}
                      value={value}
                      onChange={(val) =>
                        handleUpdateProduct(index, "quantity", val)
                      }
                      disabled={!record.max_quantity}
                    />
                  ),
                },
                {
                  title: "Prix unitaire",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 150,
                  render: (value) => `${formatNumber(value)} FCFA`,
                },
                {
                  title: "Remise (%)",
                  dataIndex: "discount_rate",
                  key: "discount_rate",
                  width: 150,
                  render: (value, record, index) => (
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: "100%" }}
                      value={value}
                      onChange={(val) =>
                        handleUpdateProduct(index, "discount_rate", val)
                      }
                    />
                  ),
                  responsive: ["sm"],
                },
                {
                  title: "Taxe (%)",
                  dataIndex: "tax_rate",
                  key: "tax_rate",
                  width: 150,
                  render: (value) => value?.toFixed(2) || "0.00",
                  responsive: ["sm"],
                },
                {
                  title: "Sous-total",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  width: 150,
                  render: (value) => `${formatNumber(value)} FCFA`,
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 100,
                  render: (_, record, index) => (
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProduct(index)}
                    />
                  ),
                },
              ]}
              summary={() => <Table.Summary.Row></Table.Summary.Row>}
            />
          </div>
        ) : (
          <Empty
            description={
              selectedOriginalOrder
                ? "Aucun produit trouvé dans cette vente. Veuillez sélectionner une autre vente."
                : "Veuillez d'abord sélectionner un bon de vente pour voir les produits disponibles."
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "30px 0" }}
          />
        )}
        <Row
          gutter={16}
          style={{ marginTop: 16 }}
          className="bg-gray-50 p-4 rounded"
        >
          <Col xs={12} md={6}>
            <Statistic
              title="Total HT"
              value={formatNumber(subTotal)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Total Remises"
              value={formatNumber(discountAmount)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Total Taxes"
              value={formatNumber(taxAmount)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Total TTC"
              value={formatNumber(grandTotal)}
              suffix=" FCFA"
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Form.Item name="terms_condition" label="Termes et conditions">
              <TextArea
                rows={4}
                placeholder="Termes et conditions du retour de vente"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="remarks" label="Remarques">
              <TextArea rows={4} placeholder="Remarques additionnelles" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// Composant de la table des retours de vente
interface RetourVentesTableProps {
  refreshRetourVentes: () => void;
  tabKey?: string;
  retourVentes: RetourAchat[];
  totalItems: number;
}

const RetourVentesTable: React.FC<RetourVentesTableProps> = ({
  refreshRetourVentes,
  tabKey = "tous",
  retourVentes,
  totalItems,
}) => {
  // Use any type for auth to bypass TypeScript's strict checking
  const auth: any = useAuth();

  // Safe access to hasPermission with fallback
  const hasPermission = (permission: string): boolean => {
    return typeof auth?.hasPermission === "function"
      ? auth.hasPermission(permission)
      : false;
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RetourAchat | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRetourVente, setSelectedRetourVente] =
    useState<RetourAchat | null>(null);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    status: string;
    user_id: string;
    warehouse_id: string;
    dateRange: [any, any] | null;
  }>({
    status: "",
    user_id: "",
    warehouse_id: "",
    dateRange: null,
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const { selectedWarehouse } = useSelection();
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const [retourVenteToEdit, setRetourVenteToEdit] =
    useState<RetourAchat | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // État local pour stocker les données de la table
  const [localRetours, setLocalRetours] = useState<RetourAchat[]>(
    retourVentes || []
  );

  // Mettre à jour localRetours lorsque le prop retourVentes change
  useEffect(() => {
    setLocalRetours(retourVentes || []);

    // Initialiser également retourVenteAPI.retourVentes
    if (retourVentes && retourVentes.length > 0) {
      retourVenteAPI.retourVentes = retourVentes;
    }

    // Mettre à jour la pagination avec le nombre total d'items, mais garder la page courante
    setPagination((prev) => ({
      ...prev,
      total: totalItems || 0,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
      showTotal: (total: number, range: number[]) =>
        `${range[0]}-${range[1]} sur ${total} retours`,
    }));
  }, [retourVentes, totalItems]);

  // Gérer les changements de pagination
  const handleTableChange = (pagination: any) => {
    console.log("Table pagination change:", pagination);

    // Mettre à jour l'état local de pagination
    setPagination(pagination);

    // Dispatch the event to update page and pageSize in parent component
    const event = new CustomEvent("updateRetourVentesPage", {
      detail: {
        page: pagination.current,
        pageSize: pagination.pageSize,
      },
    });
    window.dispatchEvent(event);
  };

  // Charger les données nécessaires au composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger d'abord les fournisseurs avec l'API dédiée pour éviter l'erreur
        const fournisseursData = await retourVenteAPI.fetchFournisseurs({
          warehouse: selectedWarehouse,
        });
        console.log(
          "Fournisseurs chargés:",
          fournisseursData ? fournisseursData.length : 0
        );
        setFournisseurs(fournisseursData || []);

        // Charger les autres données nécessaires
        try {
          const [produitsRes, taxesRes, warehousesRes] = await Promise.all([
            axios.get("/api/produits", {
              params: { warehouse_id: selectedWarehouse },
            }),
            axios.get("/api/taxes"),
            axios.get("/api/warehouses"),
          ]);

          setProduits(produitsRes.data.products || []);
          setTaxes(taxesRes.data.taxes || []);
          setWarehouses(warehousesRes.data.warehouses || []);
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données supplémentaires:",
            error
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedWarehouse]);

  const loadAchatDetails = async (record: any) => {
    setLoading(true);
    try {
      console.log(
        `Chargement des détails pour le retour de vente ID ${record.id}...`
      );

      // Récupérer les détails frais du retour de vente par son ID
      const response = await axios.get(`/api/orders/${record.id}`);

      if (!response.data) {
        throw new Error(`Aucune donnée reçue pour le retour ID ${record.id}`);
      }

      console.log(`Retour de vente #${record.id} récupéré:`, response.data);

      // Récupérer les articles du retour en utilisant l'API dédiée
      let itemsResponse;
      try {
        itemsResponse = await axios.get(`/api/orders/${record.id}/items`);
        console.log(
          `Articles pour le retour #${record.id}:`,
          itemsResponse.data
        );
      } catch (itemError) {
        console.error(
          `Erreur lors de la récupération des articles du retour #${record.id}:`,
          itemError
        );
        itemsResponse = { data: [] };
      }

      // Construire l'objet retour complet avec toutes les informations
      const retourVenteComplet = {
        ...response.data,
        items: itemsResponse.data || [],
      };

      console.log(
        `Retour complet #${record.id} à afficher:`,
        retourVenteComplet
      );

      // Définir le retour sélectionné et ouvrir le modal
      setSelectedRetourVente(retourVenteComplet);
      setDetailModalVisible(true);
    } catch (error) {
      console.error(
        `Erreur lors du chargement des détails du retour de vente #${record.id}:`,
        error
      );
      message.error(
        `Impossible de charger les détails pour le retour #${record.id}`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRetourItems = async (record: RetourAchat) => {
    try {
      setLoading(true);
      console.log(`Chargement des articles pour le retour #${record.id}`);
      const items = await retourVenteAPI.fetchOrderItems(String(record.id));

      // Mettre à jour l'instance originale de retourVenteAPI
      const updatedGlobalRetourVentes = retourVenteAPI.retourVentes.map(
        (retour) => {
          if (retour.id === record.id) {
            return { ...retour, items };
          }
          return retour;
        }
      );
      retourVenteAPI.retourVentes = updatedGlobalRetourVentes;

      // Créer une copie locale pour le composant Table
      const localRetourVentes = retourVentes
        ? [...retourVentes]
        : [...retourVenteAPI.retourVentes];
      const updatedLocalRetourVentes = localRetourVentes.map((retour) => {
        if (retour.id === record.id) {
          return { ...retour, items };
        }
        return retour;
      });

      // Déclencher un re-rendu en créant une copie de l'état
      setExpandedRowKeys([...expandedRowKeys, record.id]);

      // Forcer une mise à jour du tableau
      // Cette astuce peut être utile en React pour forcer un re-rendu quand seul un objet profond a changé
      const forceUpdate = Math.random();
      setLoading(false);
      setLoading(forceUpdate > 0.5);

      return items;
    } catch (error) {
      console.error(
        `Erreur lors du chargement des articles pour le retour #${record.id}:`,
        error
      );
      message.error("Erreur lors du chargement des articles");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les retours de vente dès le chargement ou lors d'un changement de filtre
  }, [searchText, filters, selectedWarehouse, tabKey]);

  const applyFilters = (values: any) => {
    console.log("Application des filtres:", values);
    setFilters({ ...filters, ...values });
    setFilterVisible(false);
    // Recharger les données
  };

  const resetFilters = () => {
    console.log("Réinitialisation des filtres");
    setFilters({
      status: "",
      user_id: "",
      warehouse_id: "",
      dateRange: [null, null],
    });
    setFilterVisible(false);
    // Recharger les données
  };

  // Add the following helper function within the RetourVentesTable component scope, before the definition of 'expandable':
  const fetchItemsForRecord = async (record: RetourAchat) => {
    try {
      setLoading(true);
      console.log(`Chargement des détails pour #${record.id}`);
      const items = await retourVenteAPI.fetchOrderItems(String(record.id));
      console.log(`${items.length} items trouvés pour #${record.id}`, items);

      // Créer une copie du tableau pour éviter les mutations directes
      const updatedLocalRetours = [...localRetours];
      const localIndex = updatedLocalRetours.findIndex(
        (r) => r.id === record.id
      );
      if (localIndex !== -1) {
        updatedLocalRetours[localIndex] = {
          ...updatedLocalRetours[localIndex],
          items,
        };
        setLocalRetours(updatedLocalRetours);
      }

      // Également mettre à jour retourVenteAPI.retourVentes
      const updatedRetours = [...retourVenteAPI.retourVentes];
      const apiIndex = updatedRetours.findIndex((r) => r.id === record.id);
      if (apiIndex !== -1) {
        updatedRetours[apiIndex] = {
          ...updatedRetours[apiIndex],
          items,
        };
        retourVenteAPI.retourVentes = updatedRetours;
      }

      // Également mettre à jour le retourVentes provenant des props
      if (retourVentes) {
        const updatedRetourVentes = [...retourVentes];
        const propsIndex = updatedRetourVentes.findIndex(
          (r) => r.id === record.id
        );
        if (propsIndex !== -1) {
          updatedRetourVentes[propsIndex] = {
            ...updatedRetourVentes[propsIndex],
            items,
          };
        }
      }

      // Forcer un re-rendu
      setLoading(false);
      const forceUpdate = Math.random();
      setLoading(forceUpdate > 0.5);

      return items;
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      message.error("Erreur lors du chargement des détails");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const expandable = {
    expandedRowRender: (record: RetourAchat) => {
      const items = record.items || [];
      console.log("Items pour l'expansion de la ligne:", items);
      return (
        <Table
          rowKey={(item) =>
            `${item.product_id}_${
              item.id || Math.random().toString(36).substr(2, 9)
            }`
          }
          dataSource={items}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "Produit",
              dataIndex: "product_name",
              key: "product_name",
            },
            {
              title: "Quantité",
              dataIndex: "quantity",
              key: "quantity",
              width: 100,
            },
            {
              title: "Prix unitaire",
              dataIndex: "unit_price",
              key: "unit_price",
              width: 150,
              render: (value) => `${formatNumber(value)} FCFA`,
            },
            {
              title: "Remise",
              dataIndex: "discount_rate",
              key: "discount_rate",
              width: 100,
              render: (value) => `${value}%`,
            },
            {
              title: "Taxe",
              dataIndex: "tax_rate",
              key: "tax_rate",
              width: 100,
              render: (value) => `${value}%`,
            },
            {
              title: "Sous-total",
              dataIndex: "subtotal",
              key: "subtotal",
              width: 150,
              render: (value) => `${formatNumber(value)} FCFA`,
            },
          ]}
        />
      );
    },
    onExpand: async (expanded: boolean, record: RetourAchat) => {
      if (expanded) {
        try {
          // Toujours charger les articles à chaque expansion pour garantir qu'ils sont à jour
          console.log(
            `Chargement des articles pour l'expansion du retour #${record.id}`
          );
          const items = await retourVenteAPI.fetchOrderItems(String(record.id));
          console.log(
            `${items.length} articles trouvés pour le retour #${record.id}`,
            items
          );

          // Mettre à jour les articles dans la copie locale
          const updatedLocalRetours = [...localRetours];
          const index = updatedLocalRetours.findIndex(
            (r) => r.id === record.id
          );
          if (index !== -1) {
            updatedLocalRetours[index] = {
              ...updatedLocalRetours[index],
              items,
            };
            setLocalRetours(updatedLocalRetours);
            console.log("retourVente mis à jour dans localRetours");
          }

          // Mettre à jour également retourVenteAPI.retourVentes
          const updatedRetours = [...retourVenteAPI.retourVentes];
          const apiIndex = updatedRetours.findIndex((r) => r.id === record.id);
          if (apiIndex !== -1) {
            updatedRetours[apiIndex] = { ...updatedRetours[apiIndex], items };
            retourVenteAPI.retourVentes = updatedRetours;
            console.log("retourVente mis à jour dans retourVenteAPI");
          }

          // Mettre à jour les expandedRowKeys si nécessaire
          if (!expandedRowKeys.includes(record.id)) {
            setExpandedRowKeys([...expandedRowKeys, record.id]);
          }

          // Forcer un re-rendu
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
          }, 100);
        } catch (error) {
          console.error(
            `Erreur lors du chargement des articles pour #${record.id}:`,
            error
          );
          message.error("Erreur lors du chargement des articles");
        }
      } else {
        // Supprimer l'ID de la liste des lignes étendues
        setExpandedRowKeys((prev) => prev.filter((key) => key !== record.id));
      }
    },
    expandedRowKeys,
  };

  const handleEdit = async (record: RetourAchat) => {
    if (!hasPermission("Gestion Commerciale.Ventes.RetourVente.edit")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour modifier un retour de vente."
      );
      return;
    }
    try {
      setLoading(true);
      console.log(
        "Chargement du retour de vente pour modification:",
        record.id
      );
      const response = await retourVenteAPI.fetchRetourVentes({
        id: record.id,
      });
      const retourItems = await retourVenteAPI.fetchOrderItems(
        String(record.id)
      );

      // Extraction du premier élément du tableau retourVentes
      const retourVente =
        response.retourVentes && response.retourVentes.length > 0
          ? response.retourVentes[0]
          : record;

      const retourComplet = {
        ...retourVente,
        items: retourItems,
      };
      console.log("Retour de vente à modifier:", retourComplet);
      setRetourVenteToEdit(retourComplet);
      setEditModalVisible(true);
    } catch (error) {
      console.error(
        "Erreur lors du chargement du retour de vente pour modification:",
        error
      );
      message.error(
        "Impossible de charger le retour de vente pour modification"
      );
    } finally {
      setLoading(false);
    }
  };

  // Définition des colonnes du tableau
  const columns: TableProps<RetourAchat>["columns"] = [
    {
      title: "N° de facture",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (text: string, record: RetourAchat) => (
        <Button type="link" onClick={() => loadAchatDetails(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Date du retour",
      dataIndex: "order_date",
      key: "order_date",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: "Client",
      key: "fournisseur",
      render: (_: any, record: RetourAchat): React.ReactNode => {
        if (
          record.user_name &&
          record.user_name.trim() !== "" &&
          isNaN(Number(record.user_name))
        ) {
          return record.user_name;
        } else if (record.user_id) {
          if (fournisseurs && Array.isArray(fournisseurs)) {
            const client = fournisseurs.find((f) => f.id === record.user_id);
            return client ? client.name : "Client inconnu";
          }
          return `Client #${record.user_id}`;
        } else {
          return "Client inconnu";
        }
      },
    },
    {
      title: "Entrepôt",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      responsive: ["md"],
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (text: number) => `${formatNumber(text)} FCFA`,
    },
    {
      title: "Payé",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (text: number) => `${formatNumber(text)} FCFA`,
      responsive: ["sm"],
    },
    {
      title: "Restant",
      dataIndex: "due_amount",
      key: "due_amount",
      render: (text: number) => `${formatNumber(text)} FCFA`,
      responsive: ["sm"],
    },
    {
      title: "Statut Paiement",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (text: string) => {
        let color = "default";
        if (text === "Payé") color = "success";
        else if (text === "Partiellement payé") color = "warning";
        else if (text === "Non payé") color = "error";
        return <Tag color={color}>{text}</Tag>;
      },
      responsive: ["lg"],
    },
    {
      title: "Statut",
      dataIndex: "order_status",
      key: "order_status",
      render: (text: string) => {
        let color = "default";
        if (text === "complété") color = "success";
        else if (text === "annulé") color = "error";
        else if (text === "en attente") color = "processing";
        return <Tag color={color}>{text}</Tag>;
      },
      responsive: ["lg"],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: RetourAchat) => (
        <Space size="small">
          {/* View button for all users with view permission */}
          <Button
            type="link"
            onClick={() => loadAchatDetails(record)}
            icon={<EyeOutlined />}
          >
            Voir
          </Button>

          {/* Edit button only for users with edit permission */}
          {hasPermission("Gestion Commerciale.Ventes.RetourVente.edit") && (
            <Button
              type="link"
              onClick={() => handleEdit(record)}
              icon={<EditOutlined />}
            >
              Modifier
            </Button>
          )}

          {/* Delete button only for users with delete permission */}
          {!record.is_deleted &&
            hasPermission("Gestion Commerciale.Ventes.RetourVente.delete") && (
              <Popconfirm
                title="Êtes-vous sûr de vouloir supprimer ce retour de vente?"
                onConfirm={() => handleDelete(record.id)}
                okText="Oui"
                cancelText="Non"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Supprimer
                </Button>
              </Popconfirm>
            )}

          <Tooltip title="Télécharger">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => {
                // ... existing download functionality ...
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Fonction pour fermer et nettoyer le modal de détails
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    // Réinitialiser l'ordre sélectionné après une courte période
    // pour éviter une transition visuelle brutale
    setTimeout(() => {
      setSelectedRetourVente(null);
    }, 300);
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission("Gestion Commerciale.Ventes.RetourVente.delete")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour supprimer un retour de vente."
      );
      return;
    }
    try {
      await retourVenteAPI.deleteRetourVente(id);
      message.success("Retour de vente supprimé avec succès");
      refreshRetourVentes();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="retour-ventes-table-wrapper overflow-x-auto">
      <Table
        dataSource={localRetours}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: totalItems,
          onChange: (page, pageSize) => {
            console.log(`Page changed to ${page}, pageSize: ${pageSize}`);
            const newPagination = {
              ...pagination,
              current: page,
              pageSize: pageSize || pagination.pageSize,
            };
            // D'abord mettre à jour l'état local
            setPagination(newPagination);

            // Puis envoyer l'événement au parent
            handleTableChange(newPagination);
          },
          onShowSizeChange: (current, size) => {
            console.log(
              `PageSize changed to ${size}, current page: ${current}`
            );
            const newPagination = {
              ...pagination,
              current: current,
              pageSize: size,
            };
            // D'abord mettre à jour l'état local
            setPagination(newPagination);

            // Puis envoyer l'événement au parent
            handleTableChange(newPagination);
          },
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} sur ${total} retours`,
        }}
        expandable={expandable}
      />

      {/* Modal pour afficher les détails d'un retour de vente */}
      <OrderDetailModal
        order={selectedRetourVente}
        visible={detailModalVisible}
        onClose={closeDetailModal}
        produits={produits}
        taxes={taxes}
        fournisseurs={fournisseurs}
        refreshOrderDetails={() => {
          if (selectedRetourVente) {
            loadAchatDetails(selectedRetourVente); // Recharger complètement les détails
          }
        }}
        refreshRetourVentes={refreshRetourVentes}
      />

      <RetourVenteForm
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setRetourVenteToEdit(null);
        }}
        refreshRetourVentes={refreshRetourVentes}
        retourVenteToEdit={retourVenteToEdit}
        isEditing={true}
      />
    </div>
  );
};

// Composant principal
const GestionRetourVente: React.FC = () => {
  // Use any type for auth to bypass TypeScript's strict checking
  const auth: any = useAuth();

  // Safe access to hasPermission with fallback
  const hasPermission = (permission: string): boolean => {
    return typeof auth?.hasPermission === "function"
      ? auth.hasPermission(permission)
      : false;
  };

  const [state, dispatch] = useReducer(retourVentesReducer, {
    retourVentes: [],
    fournisseurs: [],
    produits: [],
    taxes: [],
    loading: true,
    currentRetourVente: null,
    retourAchatItems: [],
    orderPayments: [],
    warehouses: [],
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10, // Valeur par défaut
    error: null,
    currentWarehouse: null,
    activeTab: "tous",
  });
  const [filters, setFilters] = useState<{
    status: string;
    user_id: string;
    warehouse_id: string;
    dateRange: [any, any] | null;
  }>({
    status: "",
    user_id: "",
    warehouse_id: "",
    dateRange: null,
  });
  const [searchValue, setSearchValue] = useState("");
  const [showRetourVenteForm, setShowRetourVenteForm] = useState(false);
  const [retourVenteToEdit, setRetourVenteToEdit] =
    useState<RetourAchat | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { selectedWarehouse } = useSelection(); // Restore this line

  // Check view permission on component mount
  useEffect(() => {
    if (!hasPermission("Gestion Commerciale.Ventes.RetourVente.view")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour accéder à ce module."
      );
    }
  }, [hasPermission]);

  // Écouter l'événement de changement de page
  useEffect(() => {
    const handlePageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.page) {
          const newPage = customEvent.detail.page;
          console.log("Mise à jour de la page depuis l'événement:", newPage);
          dispatch({ type: "SET_CURRENT_PAGE", payload: newPage });
        }

        if (customEvent.detail.pageSize) {
          const newPageSize = customEvent.detail.pageSize;
          console.log(
            "Mise à jour de la taille de page depuis l'événement:",
            newPageSize
          );
          dispatch({ type: "SET_ITEMS_PER_PAGE", payload: newPageSize });
        }
      }
    };

    window.addEventListener(
      "updateRetourVentesPage",
      handlePageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "updateRetourVentesPage",
        handlePageChange as EventListener
      );
    };
  }, []);

  // Vérifier également s'il y a une mise à jour de la page dans localStorage
  useEffect(() => {
    const storedPage = localStorage.getItem("retourVentes_currentPage");
    if (storedPage) {
      const page = parseInt(storedPage, 10);
      if (!isNaN(page) && page !== state.currentPage) {
        dispatch({ type: "SET_CURRENT_PAGE", payload: page });
        localStorage.removeItem("retourVentes_currentPage"); // Nettoyer après utilisation
      }
    }
  }, [state.currentPage]);

  useEffect(() => {
    refreshRetourVentes();
  }, [
    state.currentPage,
    state.itemsPerPage, // Ajouter itemsPerPage comme dépendance
    state.activeTab,
    selectedWarehouse,
    searchValue,
    filters,
  ]);

  const refreshRetourVentes = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const params: any = {
        order_type: "sales_return",
        page: state.currentPage,
        limit: state.itemsPerPage || 10, // Utiliser itemsPerPage s'il est défini, sinon 10
        search: searchValue,
      };

      // Add warehouse filter if selected
      if (selectedWarehouse) {
        params.warehouse = selectedWarehouse;
        console.log("Filtrage par entrepôt:", selectedWarehouse);
      }

      // Add user filter if selected
      if (filters.user_id) {
        params.user_id = filters.user_id;
        console.log("Filtrage par client:", filters.user_id);
      }

      // Add date range filter if selected
      if (filters.dateRange) {
        params.dateDebut = dayjs(filters.dateRange[0]).format("YYYY-MM-DD");
        params.dateFin = dayjs(filters.dateRange[1]).format("YYYY-MM-DD");
        console.log(
          "Filtrage par plage de dates:",
          params.dateDebut,
          "à",
          params.dateFin
        );
      }

      // Add payment status filter based on active tab
      if (state.activeTab === "unpaid") {
        params.payment_status = "Non payé";
        console.log("Filtrage par statut de paiement: Non payé");
      } else if (state.activeTab === "partially_paid") {
        params.payment_status = "Partiellement payé";
        console.log("Filtrage par statut de paiement: Partiellement payé");
      } else if (state.activeTab === "paid") {
        params.payment_status = "Payé";
        console.log("Filtrage par statut de paiement: Payé");
      }

      console.log("Fetching sales returns with params:", params);
      const api = new RetourVenteAPI();
      const response = await api.fetchRetourVentes(params);

      console.log("Sales returns fetch response:", {
        count: response.retourVentes.length,
        total: response.totalItems,
        page: state.currentPage,
      });

      // Préserver les items existants qui ont été chargés précédemment
      // Cela permet de conserver les détails des produits déjà chargés
      const updatedRetourVentes = response.retourVentes.map(
        (newRetour: RetourAchat) => {
          // Rechercher si ce retour existait déjà avec des items chargés
          const existingRetour = state.retourVentes.find(
            (r) => r.id === newRetour.id
          );
          if (
            existingRetour &&
            existingRetour.items &&
            existingRetour.items.length > 0
          ) {
            // Si oui, conserver les items existants
            return { ...newRetour, items: existingRetour.items };
          }
          return newRetour;
        }
      );

      dispatch({
        type: "FETCH_RETOUR_VENTES_SUCCESS",
        payload: updatedRetourVentes,
        totalItems: response.totalItems,
      });

      // Si le changement de magasin a provoqué le chargement, réinitialiser la page à 1
      if (params.warehouse !== state.currentWarehouse) {
        dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
        dispatch({ type: "SET_CURRENT_WAREHOUSE", payload: params.warehouse });
      }
    } catch (error) {
      console.error("Error refreshing return sales:", error);
      dispatch({ type: "SET_ERROR", payload: "Error loading return sales" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.currentPage,
    state.itemsPerPage, // Ajouter cette dépendance
    state.activeTab,
    state.currentWarehouse,
    state.retourVentes,
    selectedWarehouse,
    searchValue,
    filters,
  ]);

  useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        const params: any = { warehouse: selectedWarehouse };
        const response = await retourVenteAPI.fetchFournisseurs(params);
        dispatch({ type: "FETCH_FOURNISSEURS_SUCCESS", payload: response });
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
        message.error("Erreur lors du chargement des clients");
      }
    };
    if (selectedWarehouse) {
      fetchFournisseurs();
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await retourVenteAPI.fetchTaxes();
        dispatch({ type: "FETCH_TAXES_SUCCESS", payload: response });
      } catch (error) {
        console.error("Erreur lors du chargement des taxes:", error);
        message.error("Erreur lors du chargement des taxes");
      }
    };
    fetchTaxes();
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await retourVenteAPI.fetchWarehouses();
        dispatch({ type: "FETCH_WAREHOUSES_SUCCESS", payload: response });
      } catch (error) {
        console.error("Erreur lors du chargement des entrepôts:", error);
        message.error("Erreur lors du chargement des entrepôts");
      }
    };
    fetchWarehouses();
  }, []);

  const openRetourVenteForm = () => {
    if (!hasPermission("Gestion Commerciale.Ventes.RetourVente.create")) {
      message.error(
        "Vous n'avez pas les droits nécessaires pour créer un retour de vente."
      );
      return;
    }
    setShowRetourVenteForm(true);
    setRetourVenteToEdit(null);
    setIsEditing(false);
  };

  const handleTabChange = (activeKey: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey });
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
  };

  const handleExportToExcel = async () => {
    try {
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });
      const params: any = {
        page: 1,
        limit: 1000,
        order_type: "sales_return",
      };
      if (state.activeTab && state.activeTab !== "tous") {
        if (state.activeTab === "unpaid") {
          params.payment_status = "Non payé";
        } else if (state.activeTab === "partially_paid") {
          params.payment_status = "Partiellement payé";
        } else if (state.activeTab === "paid") {
          params.payment_status = "Payé";
        }
      }
      if (selectedWarehouse) {
        params.warehouse_id =
          typeof selectedWarehouse === "object"
            ? selectedWarehouse.id
            : selectedWarehouse;
      }
      if (filters.user_id) {
        params.user_id = filters.user_id;
      }
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.dateDebut = dayjs(filters.dateRange[0]).format("YYYY-MM-DD");
        params.dateFin = dayjs(filters.dateRange[1]).format("YYYY-MM-DD");
      }
      if (searchValue) {
        params.search = searchValue;
      }
      const api = new RetourVenteAPI();
      const response = await api.fetchRetourVentes(params);
      const retours = response.retourVentes || [];
      const dataToExport = retours.map((retour: RetourAchat) => ({
        ID: retour.id,
        "№ Facture": retour.invoice_number,
        Référence: retour.reference,
        Date: dayjs(retour.order_date).format("DD/MM/YYYY"),
        Client: retour.user_name,
        Magasin: retour.warehouse_name,
        Statut: retour.order_status,
        "Statut de paiement": retour.payment_status,
        "Montant payé": retour.paid_amount,
        "Montant dû": retour.due_amount,
        Total: retour.total,
        "Créé le": retour.created_at
          ? dayjs(retour.created_at).format("DD/MM/YYYY")
          : "-",
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Retours de Vente");
      const columnWidths = [
        { wch: 8 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
      ];
      worksheet["!cols"] = columnWidths;
      const today = dayjs().format("YYYY-MM-DD");
      XLSX.writeFile(workbook, `Retours_Vente_${today}.xlsx`);
      message.success({
        content: "Export Excel réussi!",
        key: "exportLoading",
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      message.error({
        content: "Erreur lors de l'export Excel",
        key: "exportLoading",
      });
    }
  };

  // Only render if user has view permission
  if (!hasPermission("Gestion Commerciale.Ventes.RetourVente.view")) {
    return <div>Accès non autorisé</div>;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Content className="p-3 md:p-5">
        <div className="bg-white p-4 md:p-6 min-h-[280px]">
          <Row
            justify="space-between"
            className="mb-4 flex flex-col sm:flex-row items-start sm:items-center"
          >
            <Col className="mb-4 sm:mb-0 w-full sm:w-auto">
              {/* Only show create button if user has create permission */}
              {hasPermission(
                "Gestion Commerciale.Ventes.RetourVente.create"
              ) && (
                <Button
                  type="primary"
                  onClick={openRetourVenteForm}
                  className="w-full sm:w-auto"
                >
                  Créer un Retour de Vente
                </Button>
              )}
            </Col>
            <Col className="w-full sm:w-auto">
              <div className="flex flex-col md:flex-row md:flex-wrap items-center gap-2 w-full">
                <Input
                  placeholder="Rechercher..."
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={() => refreshRetourVentes()}
                  className="w-full md:flex-1 md:min-w-[180px]"
                />
                <Select
                  placeholder="Client"
                  className="w-full md:flex-1 md:min-w-[180px]"
                  allowClear
                  value={filters.user_id || undefined}
                  onChange={(value) => {
                    setFilters({ ...filters, user_id: value });
                    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {state.fournisseurs.map((client) => (
                    <Select.Option key={client.id} value={client.id}>
                      {client.name}
                    </Select.Option>
                  ))}
                </Select>
                <RangePicker
                  className="w-full md:flex-1 md:min-w-[280px]"
                  onChange={(dates, dateStrings) => {
                    setFilters({
                      ...filters,
                      dateRange: dates || [null, null],
                    });
                    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
                  }}
                />
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportToExcel}
                  className="w-full md:w-auto"
                >
                  Exporter
                </Button>
              </div>
            </Col>
          </Row>

          <Tabs
            activeKey={state.activeTab}
            onChange={handleTabChange}
            items={[
              {
                key: "tous",
                label: "Tous les retours",
              },
              {
                key: "unpaid",
                label: "Non payés",
              },
              {
                key: "partially_paid",
                label: "Partiellement payés",
              },
              {
                key: "paid",
                label: "Payés",
              },
            ]}
          />

          {state.loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <RetourVentesTable
              refreshRetourVentes={refreshRetourVentes}
              tabKey={state.activeTab}
              retourVentes={state.retourVentes}
              totalItems={state.totalItems}
            />
          )}

          <RetourVenteForm
            visible={showRetourVenteForm}
            onClose={() => setShowRetourVenteForm(false)}
            refreshRetourVentes={refreshRetourVentes}
            retourVenteToEdit={retourVenteToEdit}
            isEditing={isEditing}
          />
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default GestionRetourVente;
