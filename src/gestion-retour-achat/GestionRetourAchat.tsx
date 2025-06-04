import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from "react";
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
  TableProps,
} from "antd";
import {
  PlusOutlined,
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
import "./GestionRetourAchat.css";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

// Ajouter l'import de useSelection depuis SelectionContext
import { useSelection } from "../SelectionContext";

// Importer le hook personnalisé
import { usePermission } from "../utils/permissionUtils";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// Interfaces
interface Fournisseur {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  company_id: number;
  user_id?: number; // Ajouter cette propriété facultative
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
  max_quantity?: number; // Ajouter cette propriété pour stocker la quantité originale
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  original_order_id?: number;
  original_order_item_id?: number;
  selectOpen?: boolean; // Ajouter cette propriété
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

// État et actions pour le reducer
interface RetourAchatsState {
  retourAchats: RetourAchat[];
  fournisseurs: Fournisseur[];
  produits: Product[];
  taxes: Tax[];
  loading: boolean;
  currentRetourAchat: RetourAchat | null;
  retourAchatItems: RetourAchatItem[];
  orderPayments: Payment[];
  warehouses: Warehouse[];
  totalItems: number;
  currentPage: number;
  error: string | null;
  currentWarehouse: any;
  activeTab?: string; // Ajouter l'état activeTab
}

type RetourAchatsAction =
  | {
      type: "FETCH_RETOUR_ACHATS_SUCCESS";
      payload: RetourAchat[];
      totalItems: number;
    }
  | { type: "FETCH_FOURNISSEURS_SUCCESS"; payload: Fournisseur[] }
  | { type: "FETCH_PRODUITS_SUCCESS"; payload: Product[] }
  | { type: "FETCH_TAXES_SUCCESS"; payload: Tax[] }
  | { type: "FETCH_WAREHOUSES_SUCCESS"; payload: Warehouse[] }
  | { type: "SET_CURRENT_RETOUR_ACHAT"; payload: RetourAchat }
  | { type: "SET_RETOUR_ACHAT_ITEMS"; payload: RetourAchatItem[] }
  | { type: "SET_ORDER_PAYMENTS"; payload: Payment[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_CURRENT_WAREHOUSE"; payload: any }
  | { type: "SET_ACTIVE_TAB"; payload: string }; // Ajouter l'action SET_ACTIVE_TAB

// Formatter les nombres pour l'affichage
const formatNumber = (value: any): string => {
  if (value === undefined || value === null) return "0";
  // Arrondir à l'entier et ajouter un espace comme séparateur de milliers
  return Math.round(parseFloat(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Classe API pour les retours d'achat
class RetourAchatAPI {
  retourAchats: RetourAchat[] = [];

  /**
   * Récupère tous les retours d'achat
   */
  async fetchRetourAchats(params: any = {}) {
    try {
      // Adapter les paramètres pour les rendre compatibles avec l'API backend
      const requestParams = { ...params };

      // Transformation des filtres pour la recherche par numéro et la plage de dates
      if (requestParams.search) {
        requestParams.invoice_number = requestParams.search;
        delete requestParams.search;
      }
      if (requestParams.dateDebut) {
        requestParams.date_from = requestParams.dateDebut;
        delete requestParams.dateDebut;
      }
      if (requestParams.dateFin) {
        requestParams.date_to = requestParams.dateFin;
        delete requestParams.dateFin;
      }

      // Pour la compatibilité avec les routes/orders.js, on peut loguer les autres filtres
      if (params.warehouse) {
        console.log("Utilisation du paramètre warehouse:", params.warehouse);
      }

      if (params.order_status) {
        console.log("Filtrage par statut:", params.order_status);
      }

      if (params.payment_status) {
        console.log("Filtrage par statut de paiement:", params.payment_status);
      }

      console.log("fetchRetourAchats - Paramètres finaux:", requestParams);

      const response = await axios.get("/api/orders", {
        params: {
          ...requestParams,
          order_type: "purchase_return",
        },
      });

      // Mise à jour de la propriété retourAchats dans l'instance de l'API
      this.retourAchats = response.data.orders || [];

      console.log("Réponse de l'API:", {
        totalItems:
          response.data.total || response.data.pagination?.totalItems || 0,
        itemsCount: (response.data.orders || []).length,
      });

      return {
        retourAchats: response.data.orders || [],
        totalItems:
          response.data.total || response.data.pagination?.totalItems || 0,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des retours d'achat:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère la liste des fournisseurs
   */
  async fetchFournisseurs(params: any = {}) {
    try {
      console.log("fetchFournisseurs - Paramètres reçus:", params);

      // S'assurer que tous les paramètres sont définis
      const requestParams = {
        user_type: "suppliers",
        status: "active",
        ...params,
      };

      if (requestParams.warehouse) {
        requestParams.warehouseId = requestParams.warehouse;
        delete requestParams.warehouse;
      }

      console.log("fetchFournisseurs - Paramètres finaux:", requestParams);

      // Première tentative: utiliser l'API spécifique aux fournisseurs
      try {
        console.log(
          "Tentative d'utilisation de l'API spécifique aux fournisseurs"
        );
        const response = await axios.get("/api/users/suppliers", {
          params: requestParams,
        });
        console.log("Réponse de l'API fournisseurs:", response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (specificApiError) {
        console.warn(
          "L'API spécifique aux fournisseurs a échoué, tentative avec l'API générique",
          specificApiError
        );
      }

      // Deuxième tentative: utiliser l'API générique des utilisateurs
      console.log(
        "fetchFournisseurs - Paramètres envoyés à l'API générique:",
        requestParams
      );

      const response = await axios.get("/api/users", {
        params: requestParams,
      });

      console.log("fetchFournisseurs - Réponse API status:", response.status);

      // Vérifier la structure des données retournées et les normaliser
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

      console.log(`Fournisseurs récupérés: ${fournisseursData.length}`);
      if (fournisseursData.length > 0) {
        console.log("Premier fournisseur:", fournisseursData[0]);
      }

      return fournisseursData;
    } catch (error) {
      console.error("Erreur lors de la récupération des fournisseurs:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error(
          `Status: ${error.response.status}, Message: ${error.response.statusText}`
        );
      }

      return [];
    }
  }

  /**
   * Récupère la liste des produits
   */
  async fetchProduits(params: any = {}) {
    try {
      // Si warehouseId est fourni, utiliser warehouse_id pour la compatibilité avec l'API
      const requestParams = { ...params };
      if (params.warehouseId) {
        console.log("Conversion de warehouseId en warehouse_id pour l'API");
        requestParams.warehouse_id = params.warehouseId;
        delete requestParams.warehouseId;
      }

      console.log("fetchProduits - Paramètres finaux:", requestParams);

      const response = await axios.get("/api/produits", {
        params: requestParams,
      });
      return response.data.products;
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      throw error;
    }
  }

  /**
   * Récupère la liste des taxes
   */
  async fetchTaxes() {
    try {
      const response = await axios.get("/api/taxes");
      return response.data.taxes;
    } catch (error) {
      console.error("Erreur lors de la récupération des taxes:", error);
      throw error;
    }
  }

  /**
   * Crée un nouveau retour d'achat
   */
  async createRetourAchat(data: any) {
    try {
      const response = await axios.post("/api/orders", {
        ...data,
        order_type: "purchase_return",
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du retour d'achat:", error);
      throw error;
    }
  }

  /**
   * Met à jour un retour d'achat existant
   */
  async updateRetourAchat(id: number, data: any) {
    try {
      console.log(
        `Mise à jour du retour d'achat ID=${id} avec les données:`,
        data
      );
      const response = await axios.put(`/api/orders/${id}`, {
        ...data,
        order_type: "purchase_return",
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du retour d'achat:", error);
      throw error;
    }
  }

  /**
   * Supprime un retour d'achat
   */
  async deleteRetourAchat(id: number) {
    try {
      const response = await axios.delete(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression du retour d'achat:", error);
      throw error;
    }
  }

  /**
   * Annule un retour d'achat
   */
  async cancelRetourAchat(id: number) {
    try {
      const payload = { order_status: "Annulé", cancelled: 1, is_deletable: 0 };
      const response = await axios.put(`/api/orders/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'annulation du retour d'achat:", error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un retour d'achat
   */
  async fetchRetourAchatDetail(id: string) {
    try {
      const response = await axios.get(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails du retour d'achat:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les articles d'un retour d'achat
   */
  async fetchOrderItems(orderId: string) {
    try {
      const response = await axios.get(`/api/orders/${orderId}/items`);
      if (!response.data) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des articles de retour d'achat:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les commandes d'achat (pour sélectionner une commande d'origine pour le retour)
   */
  async fetchAchatsForReturn(fournisseurId: number, warehouseId: number) {
    try {
      const response = await axios.get("/api/orders", {
        params: {
          user_id: fournisseurId,
          warehouse_id: warehouseId,
          order_type: "purchase",
        },
      });
      return response.data.orders;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des achats pour retour:",
        error
      );
      throw error;
    }
  }

  /**
   * Restaure un retour d'achat supprimé
   */
  async restoreRetourAchat(id: number) {
    try {
      const response = await axios.post(`/api/orders/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la restauration du retour d'achat:", error);
      throw error;
    }
  }

  /**
   * Récupère la liste des entrepôts
   */
  async fetchWarehouses() {
    try {
      const response = await axios.get("/api/warehouses", {
        params: { is_active: true },
      });
      return response.data.warehouses;
    } catch (error) {
      console.error("Erreur lors de la récupération des entrepôts:", error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un entrepôt
   */
  async fetchWarehouse(id: number) {
    if (!id) {
      console.error("ID d'entrepôt invalide (null ou undefined)");
      return null;
    }

    try {
      console.log(`Tentative de récupération de l'entrepôt avec ID: ${id}`);

      // Vérifier si l'ID est valide
      if (isNaN(id)) {
        console.error("ID d'entrepôt n'est pas un nombre valide:", id);
        return null;
      }

      try {
        // Première tentative: récupération directe par ID
        const response = await axios.get(`/api/warehouses/${id}`);
        console.log(`Entrepôt ${id} récupéré avec succès:`, response.data);
        return response.data;
      } catch (directError) {
        console.warn(
          `Erreur lors de la récupération directe de l'entrepôt ${id}:`,
          directError
        );

        // Si la récupération directe échoue, tenter une récupération par la liste complète
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

        // En dernier recours, retourner un objet minimal avec l'ID
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

      // Retourner un objet minimal en cas d'erreur plutôt que de propager l'erreur
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

// Instance de l'API
const retourAchatAPI = new RetourAchatAPI();

/**
 * Reducer pour gérer l'état de l'application
 */
const retourAchatsReducer = (
  state: RetourAchatsState,
  action: RetourAchatsAction
): RetourAchatsState => {
  switch (action.type) {
    case "FETCH_RETOUR_ACHATS_SUCCESS":
      return {
        ...state,
        retourAchats: action.payload,
        totalItems: action.totalItems,
        loading: false,
      };
    case "FETCH_FOURNISSEURS_SUCCESS":
      return {
        ...state,
        fournisseurs: action.payload,
        loading: false,
      };
    case "FETCH_PRODUITS_SUCCESS":
      return {
        ...state,
        produits: action.payload,
        loading: false,
      };
    case "FETCH_TAXES_SUCCESS":
      return {
        ...state,
        taxes: action.payload,
        loading: false,
      };
    case "FETCH_WAREHOUSES_SUCCESS":
      return {
        ...state,
        warehouses: action.payload,
        loading: false,
      };
    case "SET_CURRENT_RETOUR_ACHAT":
      return {
        ...state,
        currentRetourAchat: action.payload,
      };
    case "SET_RETOUR_ACHAT_ITEMS":
      return {
        ...state,
        retourAchatItems: action.payload,
      };
    case "SET_ORDER_PAYMENTS":
      return {
        ...state,
        orderPayments: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "SET_CURRENT_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };
    case "SET_CURRENT_WAREHOUSE":
      return {
        ...state,
        currentWarehouse: action.payload,
      };
    case "SET_ACTIVE_TAB": // Ajouter le cas pour SET_ACTIVE_TAB
      return {
        ...state,
        activeTab: action.payload,
      };
    default:
      return state;
  }
};

// Composant du formulaire de paiement pour les retours d'achat
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
  const { selectedWarehouse } = useSelection(); // Ajouter la référence au contexte

  // Calculer le statut de paiement en fonction du montant payé
  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): string => {
    if (paidAmount <= 0) {
      return "Non payé";
    } else if (paidAmount < totalAmount) {
      return "Partiellement payé";
    } else {
      return "Payé";
    }
  };

  // Récupérer les modes de paiement disponibles
  const fetchPaymentModes = async () => {
    try {
      console.log("Récupération des modes de paiement...");

      // Première tentative avec l'API principale
      try {
        const response = await axios.get("/api/payment-modes");
        console.log("Réponse API modes de paiement:", response.data);

        // Vérifier la structure de la réponse et s'adapter en conséquence
        if (response.data && response.data.paymentModes) {
          console.log("Format paymentModes détecté");
          setPaymentModes(response.data.paymentModes);
          return; // Sortir si on a des résultats
        } else if (response.data && response.data.payment_modes) {
          console.log("Format payment_modes détecté");
          setPaymentModes(response.data.payment_modes);
          return; // Sortir si on a des résultats
        } else if (Array.isArray(response.data)) {
          console.log("Format tableau détecté");
          setPaymentModes(response.data);
          return; // Sortir si on a des résultats
        }
      } catch (primaryError) {
        console.warn("Première tentative échouée:", primaryError);
      }

      // Deuxième tentative avec une API alternative
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

      // Dernière tentative - créer des modes de paiement par défaut si nécessaire
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

      // Ajouter des modes de paiement par défaut pour éviter de bloquer l'utilisateur
      const fallbackModes = [
        { id: 1, name: "Espèces" },
        { id: 2, name: "Virement" },
      ];
      setPaymentModes(fallbackModes);
    }
  };

  // Initialiser le formulaire lorsqu'un ordre est sélectionné
  useEffect(() => {
    if (visible && order) {
      console.log("Modal de paiement visible avec l'ordre:", order);
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
          <span>Ajouter un paiement pour le retour d'achat</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ maxWidth: 700, top: 20 }}
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
                  title="Fournisseur"
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
                // Calculer le nouveau montant payé et le statut de paiement
                const newPaidAmount =
                  Number(order.paid_amount) + Number(values.amount);
                const newDueAmount = Number(order.total) - newPaidAmount;
                const newPaymentStatus = calculatePaymentStatus(
                  newPaidAmount,
                  order.total
                );

                // Préparer les données du paiement
                const paymentData = {
                  payment: {
                    company_id:
                      order.company_id || selectedWarehouse?.company_id || 1,
                    warehouse_id:
                      order.warehouse_id || selectedWarehouse?.id || 1,
                    payment_type: "in", // Pour les retours d'achat, l'argent rentre (entrée de fonds)
                    date: values.date.format("YYYY-MM-DD"),
                    amount: values.amount,
                    payment_mode_id: values.payment_mode_id,
                    user_id: order.user_id,
                    notes: values.notes || "Paiement pour retour d'achat",
                    orders: [{ order_id: order.id, amount: values.amount }],
                  },
                  order: {
                    id: order.id,
                    paid_amount: newPaidAmount,
                    due_amount: newDueAmount,
                    payment_status: newPaymentStatus,
                  },
                };

                console.log("Envoi des données de paiement:", paymentData);

                try {
                  // Tenter d'abord avec l'endpoint process-order-payment
                  const response = await axios.post(
                    "/api/payments/process-order-payment",
                    paymentData
                  );
                  console.log("Réponse de l'API:", response.data);
                  message.success("Paiement ajouté avec succès");
                  onPaymentAdded();
                  onClose();
                } catch (primaryError) {
                  console.error(
                    "Erreur avec l'endpoint principal:",
                    primaryError
                  );

                  // Si l'endpoint principal échoue, essayer l'endpoint de paiement standard
                  try {
                    console.log("Tentative avec l'endpoint alternatif...");
                    const alternativeResponse = await axios.post(
                      "/api/payments",
                      paymentData.payment
                    );
                    console.log(
                      "Réponse de l'API alternative:",
                      alternativeResponse.data
                    );

                    // Mettre à jour la commande séparément
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

            <Form.Item>
              <div style={{ textAlign: "right" }}>
                <Button onClick={onClose} style={{ marginRight: 8 }}>
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={amount <= 0 || amount > order.due_amount}
                >
                  Enregistrer le paiement
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};

// Composant pour afficher les détails d'un retour d'achat
interface OrderDetailModalProps {
  order: RetourAchat | null;
  visible: boolean;
  onClose: () => void;
  produits: Product[];
  taxes: Tax[];
  fournisseurs: Fournisseur[];
  refreshOrderDetails: () => void;
  refreshRetourAchats: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  visible,
  onClose,
  produits,
  taxes,
  fournisseurs,
  refreshOrderDetails,
  refreshRetourAchats,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentDetailVisible, setPaymentDetailVisible] = useState(false);
  const { selectedWarehouse } = useSelection(); // Utiliser le contexte pour accéder à l'entrepôt sélectionné
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Screen size detection for responsive modal width
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Using 768px as a breakpoint (Tailwind md)
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Afficher les détails d'un paiement
  const openPaymentDetails = (paymentId: number) => {
    const payment = payments.find((p) => p.id === paymentId);
    setSelectedPayment(payment);
    setPaymentDetailVisible(true);
  };

  // Récupérer les paiements associés à un retour d'achat
  const fetchOrderPayments = async (orderId: number) => {
    setLoadingPayments(true);
    try {
      console.log(
        `Récupération des paiements pour le retour d'achat ID ${orderId}...`
      );

      try {
        // Utiliser directement l'identifiant de la commande comme paramètre de filtrage côté serveur
        const response = await axios.get("/api/payments", {
          params: {
            payment_type: "in", // Pour les retours d'achat, le type est "in" (entrée de fonds)
            order_id: orderId, // Ajouter l'ID de la commande comme paramètre
            warehouse_id: order?.warehouse_id, // Ajouter l'ID de l'entrepôt si disponible
          },
        });

        console.log("Réponse API des paiements:", response.data);

        let paymentsData = [];

        if (response.data && response.data.payments) {
          paymentsData = response.data.payments;
        } else if (Array.isArray(response.data)) {
          paymentsData = response.data;
        }

        console.log(
          `${paymentsData.length} paiements trouvés pour le retour d'achat #${orderId}`
        );

        // Si aucun paiement n'est trouvé mais l'order indique qu'il devrait y avoir des paiements
        if (paymentsData.length === 0 && order && order.paid_amount > 0) {
          console.log(
            "Aucun paiement trouvé mais le retour d'achat indique un montant payé. Création d'un paiement virtuel."
          );
          const virtualPayment = {
            id: 999999, // ID temporaire
            payment_number: `VIRTUAL-${orderId}`,
            date: order.order_date,
            amount: order.paid_amount,
            payment_mode_name: "Non spécifié",
            remarks:
              "Information de paiement reconstruite à partir des données de la commande",
          };
          paymentsData.push(virtualPayment);
        }

        setPayments(paymentsData);
      } catch (error) {
        console.error("Erreur avec l'API des paiements:", error);
        setPayments([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      message.error("Impossible de charger les paiements");
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Charger les paiements lorsqu'un ordre est sélectionné
  useEffect(() => {
    if (order && visible) {
      fetchOrderPayments(order.id);
    }
  }, [order, visible]);

  // Réinitialiser l'onglet actif lorsque la modal est fermée
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
          <span>Détails du retour d'achat - {order.invoice_number}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={isSmallScreen ? "95%" : 1000}
      style={{ top: 20 }}
      footer={null}
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
                  // Vérifier que les informations nécessaires sont disponibles
                  console.log(
                    "Ouverture du modal de paiement pour l'ordre:",
                    order
                  );
                  if (!order.warehouse_id || !order.company_id) {
                    console.warn("Informations manquantes pour le paiement:", {
                      warehouse_id: order.warehouse_id,
                      company_id: order.company_id,
                    });
                    // Si des informations essentielles sont manquantes, essayer de les compléter
                    if (!order.company_id && selectedWarehouse?.company_id) {
                      order.company_id = selectedWarehouse.company_id;
                      console.log(
                        "company_id complété depuis le contexte:",
                        order.company_id
                      );
                    }
                  }
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
              <Card title="Informations du retour d'achat" bordered={false}>
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
                    Fournisseur:
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
                      Achat d'origine:
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
              rowKey="id"
              pagination={false}
              bordered
              size="small"
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Produit",
                  dataIndex: "product_name",
                  key: "product_name",
                  responsive: ["sm"],
                },
                {
                  title: "Quantité",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 100,
                  render: (text) => text,
                },
                {
                  title: "Prix unitaire",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 150,
                  render: (text) => `${formatNumber(text)} FCFA`,
                  responsive: ["md"],
                },
                {
                  title: "Remise",
                  dataIndex: "discount_rate",
                  key: "discount_rate",
                  width: 100,
                  render: (text) => `${text}%`,
                  responsive: ["md"],
                },
                {
                  title: "Taxe",
                  dataIndex: "tax_rate",
                  key: "tax_rate",
                  width: 150,
                  render: (text) => `${text}%`,
                  responsive: ["md"],
                },
                {
                  title: "Sous-total",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  width: 150,
                  render: (text) => `${formatNumber(text)} FCFA`,
                },
              ]}
              summary={(pageData) => {
                let totalAmount = 0;
                pageData.forEach(({ subtotal }) => {
                  totalAmount += subtotal;
                });

                return (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <strong>Sous-total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatNumber(totalAmount)} FCFA</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    {order.shipping_cost && order.shipping_cost > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <strong>Frais de livraison:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong>
                            {formatNumber(order.shipping_cost)} FCFA
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {order.discount_amount && order.discount_amount > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <strong>Remise:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong>
                            -{formatNumber(order.discount_amount)} FCFA
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {order.tax_amount && order.tax_amount > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <strong>Taxe:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong>{formatNumber(order.tax_amount)} FCFA</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <strong>Total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatNumber(order.total)} FCFA</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                );
              }}
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
              bordered
              size="small"
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
                  responsive: ["sm"],
                },
                {
                  title: "Mode de paiement",
                  dataIndex: "payment_mode_name",
                  key: "payment_mode_name",
                  responsive: ["md"],
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
                  responsive: ["lg"],
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
              <p>Aucun paiement enregistré pour ce retour d'achat.</p>
              {order.due_amount > 0 && order.order_status !== "annulé" && (
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => {
                    // Vérifier que les informations nécessaires sont disponibles
                    console.log(
                      "Ouverture du modal de paiement pour l'ordre:",
                      order
                    );
                    if (!order.warehouse_id || !order.company_id) {
                      console.warn(
                        "Informations manquantes pour le paiement:",
                        {
                          warehouse_id: order.warehouse_id,
                          company_id: order.company_id,
                        }
                      );
                      // Si des informations essentielles sont manquantes, essayer de les compléter
                      if (!order.company_id && selectedWarehouse?.company_id) {
                        order.company_id = selectedWarehouse.company_id;
                        console.log(
                          "company_id complété depuis le contexte:",
                          order.company_id
                        );
                      }
                    }
                    setPaymentModalVisible(true);
                  }}
                >
                  Ajouter un paiement
                </Button>
              )}
            </div>
          )}
        </TabPane>
      </Tabs>

      {/* Modal pour ajouter un paiement */}
      <PaymentFormModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        order={order}
        onPaymentAdded={() => {
          refreshOrderDetails();
          fetchOrderPayments(order.id);
        }}
      />

      {/* Modal pour afficher les détails d'un paiement */}
      <Modal
        title="Détails du paiement"
        open={paymentDetailVisible}
        onCancel={() => setPaymentDetailVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: 600, top: 20 }}
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

// Composant du formulaire de retour d'achat
interface RetourAchatFormProps {
  visible: boolean;
  onClose: () => void;
  refreshRetourAchats: () => void;
  retourAchatToEdit?: RetourAchat | null; // Ajouter cette propriété pour la modification
  isEditing?: boolean; // Ajouter un flag pour indiquer si on est en mode édition
}

const RetourAchatForm: React.FC<RetourAchatFormProps> = ({
  visible,
  onClose,
  refreshRetourAchats,
  retourAchatToEdit,
  isEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Fournisseur[]>([]);
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
  const { selectedWarehouse } = useSelection(); // Récupérer le magasin sélectionné depuis le contexte
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);

  // Effet pour initialiser le formulaire avec les données du retour existant si en mode édition
  useEffect(() => {
    if (visible && isEditing && retourAchatToEdit) {
      initFormWithExistingData();
    }
  }, [visible, isEditing, retourAchatToEdit]);

  // Fonction pour initialiser le formulaire avec les données existantes
  const initFormWithExistingData = async () => {
    if (!retourAchatToEdit) return;

    try {
      setLoading(true);

      // Mettre à jour l'état local avec les données du retour d'achat
      setSelectedSupplier(retourAchatToEdit.user_id);

      // Vérifier si on a un original_order_id et le définir
      const originalOrderId = retourAchatToEdit.original_order_id || null;
      setSelectedOriginalOrder(originalOrderId);

      // Rechercher la taxe correspondante si retourAchatToEdit a un tax_id
      if (retourAchatToEdit.tax_id && taxes.length > 0) {
        const tax = taxes.find((t) => t.id === retourAchatToEdit.tax_id);
        if (tax) {
          setSelectedTax(tax);
        }
      }

      // Récupérer les articles du retour si ce n'est pas déjà fait
      let itemsToUse = retourAchatToEdit.items || [];
      if (itemsToUse.length === 0) {
        const items = await retourAchatAPI.fetchOrderItems(
          String(retourAchatToEdit.id)
        );
        itemsToUse = items;
      }

      // Récupérer les articles de la commande d'origine pour avoir les quantités maximales disponibles
      let originalItems: any[] = [];
      if (originalOrderId) {
        try {
          const response = await axios.get(
            `/api/orders/${originalOrderId}/items`
          );
          if (response.data && Array.isArray(response.data)) {
            originalItems = response.data;
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des articles de la commande d'origine:",
            error
          );
        }
      }

      // Préparer les articles pour l'état local
      const formattedItems = itemsToUse.map((item: any) => {
        // Trouver l'article correspondant dans la commande d'origine
        const originalItem = originalItems.find(
          (origItem) =>
            origItem.id === item.original_order_item_id ||
            origItem.product_id === item.product_id
        );

        // Déterminer la quantité maximale (si on a l'article d'origine, utiliser sa quantité, sinon utiliser la quantité actuelle)
        const maxQuantity = originalItem
          ? Number(originalItem.quantity)
          : Number(item.quantity);

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          max_quantity: maxQuantity, // Utiliser la quantité de la commande d'origine comme max
          unit_price: Number(item.unit_price),
          discount_rate: Number(item.discount_rate || 0),
          tax_rate: Number(item.tax_rate || 0),
          tax_amount: Number(item.tax_amount || 0),
          subtotal: Number(item.subtotal),
          original_order_id: retourAchatToEdit.original_order_id,
          original_order_item_id: item.original_order_item_id,
        };
      });

      setSelectedProducts(formattedItems);

      // Définir les valeurs du formulaire
      form.setFieldsValue({
        supplier_id: retourAchatToEdit.user_id,
        order_date: dayjs(retourAchatToEdit.order_date),
        order_status: retourAchatToEdit.order_status,
        original_order_id: retourAchatToEdit.original_order_id,
        tax_id: retourAchatToEdit.tax_id,
        terms_condition:
          retourAchatToEdit.terms_condition || retourAchatToEdit.notes || "",
        remarks: retourAchatToEdit.notes || "",
      });

      // Charger les commandes d'origine du fournisseur sélectionné
      if (retourAchatToEdit.user_id && selectedWarehouse) {
        try {
          const orders = await retourAchatAPI.fetchAchatsForReturn(
            retourAchatToEdit.user_id,
            Number(selectedWarehouse)
          );
          setOriginalOrders(orders || []);

          // Vérifier si la commande d'origine n'est pas dans la liste, tenter de la récupérer directement
          if (
            originalOrderId &&
            !orders.some((order: any) => order.id === originalOrderId)
          ) {
            try {
              const originalOrderDetails = await axios.get(
                `/api/orders/${originalOrderId}`
              );
              if (originalOrderDetails.data) {
                // Ajouter la commande d'origine à la liste
                setOriginalOrders([...orders, originalOrderDetails.data]);
              }
            } catch (orderError) {
              console.error(
                "Erreur lors de la récupération de la commande d'origine:",
                orderError
              );
            }
          }

          // Si la commande d'origine est définie, utiliser les articles déjà récupérés
          if (originalOrderId && originalItems.length > 0) {
            setOriginalOrderItems(originalItems);
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des commandes d'origine:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation du formulaire avec les données existantes:",
        error
      );
      message.error("Erreur lors du chargement des données du retour d'achat");
    } finally {
      setLoading(false);
    }
  };

  // Log pour le débogage
  useEffect(() => {
    console.log(
      "RetourAchatForm - selectedWarehouse from context:",
      selectedWarehouse
    );
  }, [selectedWarehouse]);

  // Vérifier la valeur de selectedWarehouse quand le composant est monté
  useEffect(() => {
    console.log("RetourAchatForm - selectedWarehouse:", selectedWarehouse);
    console.log(
      "RetourAchatForm - selectedWarehouse type:",
      typeof selectedWarehouse
    );

    if (selectedWarehouse) {
      console.log("Un entrepôt est sélectionné:", selectedWarehouse);
    } else {
      console.warn("AUCUN ENTREPÔT SÉLECTIONNÉ!");
    }
  }, [selectedWarehouse]);

  // Charger les termes et conditions de l'entrepôt sélectionné
  const loadWarehouseTerms = async (warehouseId: number) => {
    if (!warehouseId) {
      console.error("ID d'entrepôt non fourni à loadWarehouseTerms");
      return;
    }

    try {
      console.log(
        `Chargement des termes et conditions pour l'entrepôt ${warehouseId}`
      );

      // Utiliser la méthode fetchWarehouse améliorée
      const warehouse = await retourAchatAPI.fetchWarehouse(warehouseId);

      if (warehouse) {
        console.log(`Données d'entrepôt récupérées:`, warehouse);

        if (warehouse.terms_condition) {
          console.log(
            `Termes et conditions trouvés pour l'entrepôt ${warehouseId}`
          );
          form.setFieldsValue({ terms_condition: warehouse.terms_condition });
        } else {
          console.log(
            `Pas de termes et conditions définis pour l'entrepôt ${warehouseId}`
          );
          form.setFieldsValue({ terms_condition: "" });
        }
      } else {
        console.warn(
          `Aucune donnée d'entrepôt récupérée pour l'ID ${warehouseId}`
        );
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

  // Réinitialiser le formulaire - définir AVANT useEffect qui l'utilise
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
  };

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Convertir selectedWarehouse en nombre pour s'assurer de la compatibilité
        const warehouseId = selectedWarehouse
          ? Number(selectedWarehouse)
          : null;
        console.log("Loading suppliers for warehouseId:", warehouseId);

        if (!warehouseId) {
          message.warning("Veuillez sélectionner un magasin d'abord");
          setLoading(false);
          return;
        }

        // Utiliser l'API pour charger les fournisseurs associés au magasin sélectionné
        const suppliersRes = await retourAchatAPI.fetchFournisseurs({
          warehouse: warehouseId,
        });
        console.log("Suppliers loaded:", suppliersRes);

        if (Array.isArray(suppliersRes)) {
          setSuppliers(suppliersRes);
        } else {
          console.error(
            "Unexpected response format from fetchFournisseurs:",
            suppliersRes
          );
          setSuppliers([]);
        }

        // Charger les taxes
        try {
          const taxesRes = await retourAchatAPI.fetchTaxes();
          setTaxes(taxesRes || []);
        } catch (taxesError) {
          console.error("Erreur lors du chargement des taxes:", taxesError);
          setTaxes([]);
        }

        // Utiliser le magasin du contexte pour charger les termes et conditions
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

  // Fermer le formulaire
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Charger les commandes d'achat originales quand le fournisseur change
  useEffect(() => {
    const loadOriginalOrders = async () => {
      if (!selectedSupplier) {
        setOriginalOrders([]); // Réinitialiser les commandes si aucun fournisseur n'est sélectionné
        return;
      }

      try {
        setLoading(true);
        // Convertir les IDs en nombres
        const supplierId = Number(selectedSupplier);
        const warehouseId = selectedWarehouse
          ? Number(selectedWarehouse)
          : null;

        console.log(
          "Loading original orders with supplierId:",
          supplierId,
          "warehouseId:",
          warehouseId
        );

        if (!warehouseId) {
          message.warning("Veuillez sélectionner un magasin d'abord");
          setLoading(false);
          return;
        }

        console.log("Appelant fetchAchatsForReturn avec les paramètres:", {
          user_id: supplierId,
          warehouse_id: warehouseId,
          order_type: "purchase",
          order_status: "completed",
        });

        const orders = await retourAchatAPI.fetchAchatsForReturn(
          supplierId,
          warehouseId
        );
        console.log(
          `Original orders loaded: ${
            orders?.length || 0
          } commandes trouvées pour le fournisseur ${supplierId}:`,
          orders
        );
        setOriginalOrders(orders || []);
      } catch (fetchError) {
        console.error("Error loading original orders:", fetchError);
        message.error("Erreur lors du chargement des achats originaux");
        setOriginalOrders([]); // Réinitialiser en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    loadOriginalOrders();
  }, [selectedSupplier, selectedWarehouse]);

  // Enregistrer le retour d'achat
  const onFinish = async (values: any) => {
    if (selectedProducts.length === 0) {
      message.error("Veuillez ajouter au moins un produit au retour d'achat");
      return;
    }

    setLoading(true);

    try {
      // Récupérer l'ID de l'entreprise à partir du premier fournisseur/magasin
      const companyId =
        suppliers.find((s) => s.id === selectedSupplier)?.company_id || 1;

      // Calculer le nombre total d'articles et de quantités
      const totalItems = selectedProducts.length;
      const totalQuantity = selectedProducts.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Préparer les données pour l'API
      const orderData = {
        company_id: companyId,
        order_type: "purchase_return",
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
        paid_amount: isEditing ? retourAchatToEdit?.paid_amount || 0 : 0,
        due_amount: isEditing
          ? grandTotal - (retourAchatToEdit?.paid_amount || 0)
          : grandTotal,
        payment_status: isEditing
          ? calculatePaymentStatus(
              retourAchatToEdit?.paid_amount || 0,
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
          id: isEditing && item.id ? item.id : undefined, // Inclure l'ID de l'item si disponible en mode édition
        })),
      };

      console.log("Données du retour d'achat à envoyer:", orderData);

      // Si on est en mode édition, récupérer d'abord les détails du retour existant
      // pour calculer les ajustements de stock
      if (isEditing && retourAchatToEdit) {
        // Récupérer les articles actuels du retour d'achat si ce n'est pas déjà fait
        let currentItems = retourAchatToEdit.items || [];
        if (currentItems.length === 0) {
          try {
            currentItems = await retourAchatAPI.fetchOrderItems(
              String(retourAchatToEdit.id)
            );
          } catch (error) {
            console.error(
              "Erreur lors de la récupération des articles actuels:",
              error
            );
          }
        }

        // Ajouter une note dans le champ notes pour indiquer qu'il s'agit d'une modification
        orderData.notes = `${orderData.notes || ""} - `;

        // Préparer un tableau d'ajustements de stock pour le logging (mais ne pas l'ajouter à orderData)
        const stockAdjustments = selectedProducts.map((item) => {
          // Trouver l'article correspondant dans les articles actuels
          const currentItem = currentItems.find(
            (ci: any) => ci.id === item.id || ci.product_id === item.product_id
          );

          // Calculer la différence de quantité (nouvelle quantité - ancienne quantité)
          const quantityDiff = currentItem
            ? item.quantity - Number(currentItem.quantity)
            : item.quantity;

          return {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_diff: quantityDiff,
            previous_quantity: currentItem ? Number(currentItem.quantity) : 0,
            new_quantity: item.quantity,
          };
        });

        // Logger les ajustements de stock pour référence
        console.log(
          "Ajustements de stock pour la modification:",
          stockAdjustments
        );

        // Appeler l'API pour mettre à jour le retour d'achat
        await retourAchatAPI.updateRetourAchat(retourAchatToEdit.id, orderData);
        message.success("Retour d'achat mis à jour avec succès");
      } else {
        // Création d'un nouveau retour d'achat
        await retourAchatAPI.createRetourAchat(orderData);
        message.success("Retour d'achat enregistré avec succès");
      }

      resetForm();
      refreshRetourAchats();
      onClose();
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du retour d'achat:",
        error
      );
      message.error("Erreur lors de l'enregistrement du retour d'achat");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer le statut de paiement
  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): string => {
    if (paidAmount <= 0) {
      return "Non payé";
    } else if (paidAmount < totalAmount) {
      return "Partiellement payé";
    } else {
      return "Payé";
    }
  };

  // Mettre à jour un produit de la liste
  const handleUpdateProduct = (index: number, key: string, value: any) => {
    const updatedProducts = [...selectedProducts];
    const product = { ...updatedProducts[index] };

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

  // Supprimer un produit de la liste
  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    const removedProduct = updatedProducts[index];

    // Si le produit provient d'une commande d'origine, mettre à jour la quantité retournable
    if (removedProduct.original_order_item_id) {
      const updatedOriginalItems = originalOrderItems.map((item) => {
        if (item.id === removedProduct.original_order_item_id) {
          return {
            ...item,
            return_quantity: 0,
          };
        }
        return item;
      });
      setOriginalOrderItems(updatedOriginalItems);
    }

    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  useEffect(() => {
    const loadOriginalOrderItems = async () => {
      if (!selectedOriginalOrder) {
        setSelectedProducts([]);
        return;
      }

      try {
        // Utiliser l'endpoint correct du fichier routes/orders.js
        const response = await axios.get(
          `/api/orders/${selectedOriginalOrder}/items`
        );

        if (!response.data || !Array.isArray(response.data)) {
          message.error("Impossible de charger les articles de la commande");
          return;
        }

        // Transformer directement les items de la commande d'origine en articles sélectionnés pour le retour
        const returnItems: RetourAchatItem[] = response.data.map(
          (item: any) => {
            // Calculer les valeurs financières pour chaque article
            const unitPrice = item.unit_price;
            const quantity = item.quantity;
            const discountRate = item.discount_rate || 0;
            const discountAmount = (unitPrice * quantity * discountRate) / 100;
            const taxableAmount = unitPrice * quantity - discountAmount;
            const taxRate = item.tax_rate || 0;
            const taxAmount = (taxableAmount * taxRate) / 100;
            const subtotal = taxableAmount + taxAmount;

            return {
              product_id: item.product_id,
              product_name: item.product_name || item.nom_produit, // Prend en compte les deux possibilités
              quantity: item.quantity,
              max_quantity: item.quantity, // Stocker la quantité originale comme maximum
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

        setSelectedProducts(returnItems);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des articles de la commande:",
          error
        );
        message.error("Erreur lors du chargement des articles de la commande");
      }
    };

    loadOriginalOrderItems();
  }, [selectedOriginalOrder]);

  // Dans le calcul des totaux, supprimer la partie liée aux frais de livraison
  useEffect(() => {
    // Calculer le sous-total (prix total avant taxes)
    const newSubTotal = selectedProducts.reduce((total, item) => {
      const itemPrice = item.unit_price * item.quantity;
      const itemDiscount = (itemPrice * item.discount_rate) / 100;
      return total + (itemPrice - itemDiscount);
    }, 0);
    setSubTotal(newSubTotal);

    // Calculer le total des remises
    const newDiscountAmount = selectedProducts.reduce((total, item) => {
      const itemPrice = item.unit_price * item.quantity;
      const itemDiscount = (itemPrice * item.discount_rate) / 100;
      return total + itemDiscount;
    }, 0);
    setDiscountAmount(newDiscountAmount);

    // Calculer la taxe globale si une taxe est sélectionnée
    let newTaxAmount = 0;
    if (selectedTax) {
      newTaxAmount = (newSubTotal * selectedTax.rate) / 100;

      // Mettre à jour les taxes pour chaque produit
      const updatedProducts = selectedProducts.map((item) => {
        const itemPrice = item.unit_price * item.quantity;
        const itemDiscount = (itemPrice * item.discount_rate) / 100;
        const taxableAmount = itemPrice - itemDiscount;
        const itemTaxAmount = (taxableAmount * selectedTax.rate) / 100;

        return {
          ...item,
          tax_rate: selectedTax.rate,
          tax_amount: itemTaxAmount,
          subtotal: taxableAmount + itemTaxAmount,
        };
      });

      if (
        JSON.stringify(updatedProducts) !== JSON.stringify(selectedProducts)
      ) {
        setSelectedProducts(updatedProducts);
      }
    } else {
      // Sinon, utiliser les taxes individuelles des produits
      newTaxAmount = selectedProducts.reduce(
        (total, item) => total + item.tax_amount,
        0
      );
    }
    setTaxAmount(newTaxAmount);

    // Calculer le total
    const newGrandTotal = newSubTotal + newTaxAmount;
    setGrandTotal(newGrandTotal);
  }, [selectedProducts, selectedTax]);

  // Ajout de useEffect pour charger les commandes d'origine en mode création
  useEffect(() => {
    if (!isEditing) {
      const loadOriginalOrdersForSupplier = async () => {
        if (!selectedSupplier || !selectedWarehouse) {
          setOriginalOrders([]);
          return;
        }
        try {
          setLoading(true);
          const orders = await retourAchatAPI.fetchAchatsForReturn(
            selectedSupplier,
            Number(selectedWarehouse)
          );
          setOriginalOrders(orders || []);
        } catch (error) {
          console.error(
            "Erreur lors du chargement des commandes d'origine:",
            error
          );
          message.error("Erreur lors du chargement des commandes d'origine");
        } finally {
          setLoading(false);
        }
      };
      loadOriginalOrdersForSupplier();
    }
  }, [selectedSupplier, selectedWarehouse, isEditing]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <PlusOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <span className="text-sm sm:text-base">
            {isEditing
              ? "Modifier le retour d'achat"
              : "Nouveau retour d'achat"}
          </span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width="90%"
      destroyOnClose
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
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="supplier_id"
              label="Fournisseur"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner un fournisseur",
                },
              ]}
            >
              <Select
                placeholder="Sélectionner un fournisseur"
                onChange={(value) => {
                  setSelectedSupplier(value as number);
                  setSelectedOriginalOrder(null);
                }}
              >
                {suppliers.map((supplier) => (
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
              label="Statut retour d'achat"
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

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label="Commande d'origine"
              name="original_order_id"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner une commande d'origine",
                },
              ]}
            >
              <Select
                placeholder={
                  selectedSupplier
                    ? "Sélectionner une commande d'achat"
                    : "Veuillez d'abord sélectionner un fournisseur"
                }
                onChange={(value) => setSelectedOriginalOrder(value)}
                disabled={!selectedSupplier}
              >
                {originalOrders.map((order) => (
                  <Option key={order.id} value={order.id}>
                    {order.invoice_number} -{" "}
                    {dayjs(order.order_date).format("DD/MM/YYYY")} -{" "}
                    {formatNumber(order.total)} FCFA
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
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

        {selectedOriginalOrder || (isEditing && selectedProducts.length > 0) ? (
          <div className="overflow-x-auto mb-md">
            <Table
              dataSource={selectedProducts}
              rowKey={(record) =>
                `${record.product_id}_${
                  record.original_order_item_id ||
                  Math.random().toString(36).substr(2, 9)
                }`
              }
              pagination={false}
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
                  width: 120,
                  render: (text, record, index) => (
                    <InputNumber
                      min={1}
                      max={record.max_quantity} // Limiter au maximum de la quantité originale
                      value={text}
                      onChange={(value) => {
                        // Ne pas permettre la saisie manuelle au-delà de la quantité max
                        if (value && value > (record.max_quantity || 0)) {
                          message.warning(
                            `La quantité ne peut pas dépasser la quantité originale (${record.max_quantity}).`
                          );
                          handleUpdateProduct(
                            index,
                            "quantity",
                            record.max_quantity
                          );
                        } else {
                          handleUpdateProduct(index, "quantity", value);
                        }
                      }}
                    />
                  ),
                },
                {
                  title: "Prix unitaire",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 150,
                  render: (text, record, index) => (
                    <InputNumber
                      min={0}
                      step={0.01}
                      value={text}
                      onChange={(value) =>
                        handleUpdateProduct(index, "unit_price", value)
                      }
                      formatter={(value) => `${value} FCFA`}
                      parser={(value) => {
                        const parsed = value!.replace(" FCFA", "");
                        return parseFloat(parsed);
                      }}
                    />
                  ),
                },
                {
                  title: "Remise (%)",
                  dataIndex: "discount_rate",
                  key: "discount_rate",
                  width: 120,
                  render: (text, record, index) => (
                    <InputNumber
                      min={0}
                      max={100}
                      value={text}
                      onChange={(value) =>
                        handleUpdateProduct(index, "discount_rate", value)
                      }
                    />
                  ),
                },
                {
                  title: "Taxe (%)",
                  dataIndex: "tax_rate",
                  key: "tax_rate",
                  width: 180,
                  render: (text, record, index) => {
                    // Si une taxe globale est sélectionnée, afficher juste le texte
                    if (selectedTax !== null) {
                      return `${record.tax_rate}%`;
                    }

                    // Sinon, afficher le select pour choisir une taxe
                    return (
                      <div
                        className="tax-selector"
                        style={{ position: "relative", zIndex: 1 }}
                      >
                        <Select
                          style={{ width: "100%" }}
                          value={record.tax_rate}
                          onChange={(value) => {
                            // Trouver la taxe correspondante (conversion explicite en string puis en float)
                            const selectedTaxRate = parseFloat(String(value));

                            // Mettre à jour directement les produits sélectionnés
                            const newProducts = selectedProducts.map(
                              (item, idx) => {
                                if (idx === index) {
                                  // Recalculer pour cet article
                                  const quantity = item.quantity;
                                  const unitPrice = item.unit_price;
                                  const discountRate = item.discount_rate;
                                  const discountAmount =
                                    (unitPrice * quantity * discountRate) / 100;
                                  const taxableAmount =
                                    unitPrice * quantity - discountAmount;
                                  const taxAmount =
                                    (taxableAmount * selectedTaxRate) / 100;

                                  return {
                                    ...item,
                                    tax_rate: selectedTaxRate,
                                    tax_amount: taxAmount,
                                    subtotal: taxableAmount + taxAmount,
                                  };
                                }
                                return item;
                              }
                            );

                            setSelectedProducts(newProducts);
                          }}
                          getPopupContainer={(triggerNode) =>
                            triggerNode.parentNode as HTMLElement
                          }
                          dropdownStyle={{ zIndex: 9999 }}
                        >
                          {taxes.map((tax) => (
                            <Option key={tax.id} value={tax.rate}>
                              {tax.name} ({tax.rate}%)
                            </Option>
                          ))}
                        </Select>
                      </div>
                    );
                  },
                },
                {
                  title: "Sous-total",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  width: 150,
                  render: (text) => `${formatNumber(text)} FCFA`,
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
              summary={() => (
                // Ligne de résumé vide, car le sous-total n'est plus pertinent
                <Table.Summary.Row></Table.Summary.Row>
              )}
            />
          </div>
        ) : (
          <div className="empty-order-selection">
            <Alert
              message="Aucune commande d'origine sélectionnée"
              description="Veuillez sélectionner une commande d'achat d'origine pour afficher les articles à retourner."
              type="info"
              showIcon
            />
          </div>
        )}

        {/* Section des totaux */}
        <Row
          gutter={[16, 16]}
          style={{ marginTop: 16 }}
          className="bg-gray-100 p-sm md:p-md rounded mb-md"
        >
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total HT"
              value={formatNumber(subTotal)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Remises"
              value={formatNumber(discountAmount)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Taxes"
              value={formatNumber(taxAmount)}
              suffix=" FCFA"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total TTC"
              value={formatNumber(grandTotal)}
              suffix=" FCFA"
            />
          </Col>
        </Row>

        {/* Section termes et conditions et remarques */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Form.Item name="terms_condition" label="Termes et conditions">
              <TextArea
                rows={4}
                placeholder="Termes et conditions du retour d'achat"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="remarks" label="Remarques">
              <TextArea rows={4} placeholder="Remarques additionnelles" />
            </Form.Item>
          </Col>
        </Row>

        <div className="form-actions flex flex-col sm:flex-row justify-end gap-sm mt-md">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={selectedProducts.length === 0}
            className="w-full sm:w-auto"
          >
            {isEditing
              ? "Mettre à jour le retour d'achat"
              : "Enregistrer le retour d'achat"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// Composant pour la table des retours d'achat
interface RetourAchatsTableProps {
  refreshRetourAchats: () => void;
  tabKey?: string; // Ajouter la propriété tabKey
}

const RetourAchatsTable: React.FC<RetourAchatsTableProps> = ({
  refreshRetourAchats,
  tabKey = "tous", // Valeur par défaut
}) => {
  const [searchText, setSearchText] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRetourAchat, setSelectedRetourAchat] =
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
  const [filters, setFilters] = useState({
    status: "",
    user_id: "",
    warehouse_id: "",
    dateRange: [null, null] as [any, any],
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const { selectedWarehouse } = useSelection(); // Récupérer l'entrepôt sélectionné du contexte
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const [retourAchatToEdit, setRetourAchatToEdit] =
    useState<RetourAchat | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  // Utiliser une approche plus simple avec un type plus précis
  // @ts-ignore - Context from JS file
  const auth = null;

  // Remplacer notre implémentation temporaire par le hook personnalisé
  const checkPermission = usePermission();

  // Charger les données de base
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fournisseursRes, produitsRes, taxesRes, warehousesRes] =
          await Promise.all([
            axios.get("/api/users", {
              params: {
                user_type: "suppliers",
                warehouse_id: selectedWarehouse, // Filtrer par entrepôt sélectionné
              },
            }),
            axios.get("/api/produits", {
              params: {
                warehouse_id: selectedWarehouse, // Filtrer par entrepôt sélectionné
              },
            }),
            axios.get("/api/taxes"),
            axios.get("/api/warehouses"),
          ]);

        setFournisseurs(fournisseursRes.data.users);
        setProduits(produitsRes.data.products);
        setTaxes(taxesRes.data.taxes);
        setWarehouses(warehousesRes.data.warehouses);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        message.error("Erreur lors du chargement des données");
      }
    };

    loadData();
  }, [selectedWarehouse]); // Recharger les données quand l'entrepôt change

  // Charger les détails d'un retour d'achat
  const loadAchatDetails = async (record: any) => {
    setLoading(true);
    try {
      console.log(
        `Chargement des détails du retour d'achat ID ${record.id}...`
      );

      // Récupération des détails du retour d'achat
      const retourAchatDetails = await retourAchatAPI.fetchRetourAchatDetail(
        record.id
      );
      console.log("Détails retour d'achat reçus:", retourAchatDetails);

      // Récupération des articles du retour
      const retourAchatItems = await retourAchatAPI.fetchOrderItems(record.id);

      // Vérifier si les informations du fournisseur et de l'entrepôt sont présentes
      let detailsWithSupplierInfo = { ...retourAchatDetails };

      // Si le nom du fournisseur est manquant et que l'ID du fournisseur est disponible
      if (
        !detailsWithSupplierInfo.user_name &&
        detailsWithSupplierInfo.user_id
      ) {
        try {
          // Chercher le fournisseur dans la liste déjà chargée
          const supplier = fournisseurs.find(
            (f) => f.id === detailsWithSupplierInfo.user_id
          );
          if (supplier) {
            detailsWithSupplierInfo.user_name = supplier.name;
            console.log(
              `Nom du fournisseur trouvé dans la liste: ${supplier.name}`
            );
          } else {
            // Si pas trouvé, essayer de le récupérer depuis l'API
            console.log(
              `Fournisseur ID ${detailsWithSupplierInfo.user_id} non trouvé dans la liste, récupération depuis l'API...`
            );
            try {
              const supplierResponse = await axios.get(
                `/api/users/${detailsWithSupplierInfo.user_id}`
              );
              if (supplierResponse.data && supplierResponse.data.name) {
                detailsWithSupplierInfo.user_name = supplierResponse.data.name;
                console.log(
                  `Nom du fournisseur récupéré depuis l'API: ${supplierResponse.data.name}`
                );
              }
            } catch (supplierError) {
              console.error(
                "Erreur lors de la récupération du fournisseur:",
                supplierError
              );
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du nom du fournisseur:",
            error
          );
        }
      }

      // Si le nom de l'entrepôt est manquant et que l'ID de l'entrepôt est disponible
      if (
        !detailsWithSupplierInfo.warehouse_name &&
        detailsWithSupplierInfo.warehouse_id
      ) {
        try {
          // Chercher l'entrepôt dans la liste des entrepôts chargés
          const warehouse = warehouses.find(
            (w) => w.id === detailsWithSupplierInfo.warehouse_id
          );
          if (warehouse) {
            detailsWithSupplierInfo.warehouse_name = warehouse.name;
            console.log(
              `Nom de l'entrepôt trouvé dans la liste: ${warehouse.name}`
            );
          } else {
            // Si pas trouvé, essayer de le récupérer depuis l'API
            console.log(
              `Entrepôt ID ${detailsWithSupplierInfo.warehouse_id} non trouvé dans la liste, récupération depuis l'API...`
            );
            try {
              const warehouseResponse = await axios.get(
                `/api/warehouses/${detailsWithSupplierInfo.warehouse_id}`
              );
              if (warehouseResponse.data && warehouseResponse.data.name) {
                detailsWithSupplierInfo.warehouse_name =
                  warehouseResponse.data.name;
                console.log(
                  `Nom de l'entrepôt récupéré depuis l'API: ${warehouseResponse.data.name}`
                );
              }
            } catch (warehouseError) {
              console.error(
                "Erreur lors de la récupération de l'entrepôt:",
                warehouseError
              );
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du nom de l'entrepôt:",
            error
          );
        }
      }

      // Mise à jour des détails du retour d'achat avec les informations complètes
      setSelectedRetourAchat({
        ...detailsWithSupplierInfo,
        items: retourAchatItems,
      });

      setDetailModalVisible(true);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails du retour d'achat:",
        error
      );
      message.error("Erreur lors du chargement des détails du retour d'achat");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les articles lorsqu'une ligne est étendue
  const fetchRetourItems = async (record: RetourAchat) => {
    try {
      setLoading(true);
      console.log(`Chargement des articles pour le retour #${record.id}`);

      // Récupérer les articles du retour d'achat
      const items = await retourAchatAPI.fetchOrderItems(String(record.id));
      console.log(
        `${items.length} articles trouvés pour le retour #${record.id}`,
        items
      );

      // Mettre à jour les retours d'achat pour inclure les articles
      const updatedRetourAchats = retourAchatAPI.retourAchats.map((retour) => {
        if (retour.id === record.id) {
          return { ...retour, items };
        }
        return retour;
      });

      // Mettre à jour la liste des retours d'achat dans l'API
      retourAchatAPI.retourAchats = updatedRetourAchats;

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

  // Supprimer un retour d'achat
  const handleDelete = async (id: number) => {
    try {
      await retourAchatAPI.deleteRetourAchat(id);
      message.success("Retour d'achat supprimé avec succès");
      refreshRetourAchats();
    } catch (error) {
      console.error("Erreur lors de la suppression du retour d'achat:", error);
      message.error("Erreur lors de la suppression du retour d'achat");
    }
  };

  // Annuler un retour d'achat
  const handleCancel = async (id: number) => {
    try {
      await retourAchatAPI.cancelRetourAchat(id);
      message.success("Retour d'achat annulé avec succès");
      refreshRetourAchats();
    } catch (error) {
      console.error("Erreur lors de l'annulation du retour d'achat:", error);
      message.error("Erreur lors de l'annulation du retour d'achat");
    }
  };

  // Restaurer un retour d'achat supprimé
  const handleRestore = async (id: number) => {
    try {
      await retourAchatAPI.restoreRetourAchat(id);
      message.success("Retour d'achat restauré avec succès");
      refreshRetourAchats();
    } catch (error) {
      console.error("Erreur lors de la restauration du retour d'achat:", error);
      message.error("Erreur lors de la restauration du retour d'achat");
    }
  };

  // Charger les retours d'achat avec pagination et filtres
  const loadRetourAchats = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pagination.pageSize,
        order_type: "purchase_return",
        search: searchText,
        warehouse: selectedWarehouse, // Changé de warehouse_id à warehouse pour correspondre au backend
      };

      // Ajouter les filtres
      if (filters.status) params.order_status = filters.status;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.warehouse_id) params.warehouse = filters.warehouse_id; // Changé de warehouse_id à warehouse
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.dateDebut = filters.dateRange[0].format("YYYY-MM-DD"); // Changé de date_from à dateDebut
        params.dateFin = filters.dateRange[1].format("YYYY-MM-DD"); // Changé de date_to à dateFin
      }

      // Ajouter le filtre par statut de paiement en fonction de l'onglet actif
      if (tabKey === "unpaid") {
        params.payment_status = "Non payé";
      } else if (tabKey === "partially_paid") {
        params.payment_status = "Partiellement payé";
      } else if (tabKey === "paid") {
        params.payment_status = "Payé";
      }

      console.log("Params envoyés à l'API:", params);
      const response = await retourAchatAPI.fetchRetourAchats(params);

      // Si le filtrage côté serveur ne fonctionne pas, filtrer côté client
      let filteredData = response.retourAchats || [];

      if (tabKey !== "tous" && Array.isArray(filteredData)) {
        if (tabKey === "unpaid") {
          filteredData = filteredData.filter(
            (retour) =>
              retour.payment_status === "Non payé" ||
              retour.due_amount === retour.total ||
              retour.paid_amount === 0
          );
        } else if (tabKey === "partially_paid") {
          filteredData = filteredData.filter(
            (retour) =>
              retour.payment_status === "Partiellement payé" ||
              (retour.paid_amount > 0 && retour.paid_amount < retour.total)
          );
        } else if (tabKey === "paid") {
          filteredData = filteredData.filter(
            (retour) =>
              retour.payment_status === "Payé" ||
              retour.paid_amount >= retour.total ||
              retour.due_amount === 0
          );
        }
      }

      // Mettre à jour les retours d'achat dans l'API
      retourAchatAPI.retourAchats = filteredData;

      setPagination({
        ...pagination,
        current: page,
        total: response.totalItems,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des retours d'achat:", error);
      message.error("Erreur lors du chargement des retours d'achat");
    } finally {
      setLoading(false);
    }
  };

  // Charger les retours d'achat au chargement du composant et quand l'onglet change
  useEffect(() => {
    loadRetourAchats(pagination.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filters, selectedWarehouse, tabKey]); // Ajouter tabKey aux dépendances

  // Gérer le changement de page
  const handleTableChange = (pagination: any) => {
    loadRetourAchats(pagination.current);
  };

  // Appliquer les filtres
  const applyFilters = (values: any) => {
    console.log("Application des filtres:", values);

    // Si nous avons une plage de dates, s'assurer qu'elle est au bon format
    if (
      values.dateRange &&
      Array.isArray(values.dateRange) &&
      values.dateRange.length === 2
    ) {
      // Vérifier si les dates sont des objets dayjs valides
      if (values.dateRange[0] && values.dateRange[1]) {
        console.log("Plage de dates valide, conversion au format YYYY-MM-DD");
      } else {
        console.log("Plage de dates incomplète ou invalide, réinitialisation");
        values.dateRange = [null, null];
      }
    }

    setFilters({
      ...filters,
      ...values,
    });
    setFilterVisible(false);

    // Recharger les données avec les nouveaux filtres
    loadRetourAchats(1); // Retourner à la première page avec les nouveaux filtres
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    console.log("Réinitialisation des filtres");
    setFilters({
      status: "",
      user_id: "",
      warehouse_id: "",
      dateRange: [null, null],
    });
    setFilterVisible(false);

    // Recharger les données sans filtres
    loadRetourAchats(1);
  };

  // Configuration de l'expansion des lignes du tableau
  const expandable = {
    expandedRowRender: (record: RetourAchat) => {
      const items = record.items || [];

      return (
        <Table
          rowKey={(item) => `${item.product_id}_${item.id || Math.random()}`}
          dataSource={items}
          pagination={false}
          size="small"
          columns={[
            {
              title: "Produit",
              dataIndex: "product_name",
              key: "product_name",
              render: (text, item) => {
                if (text) return text;
                const prod = produits.find((p) => p.id === item.product_id);
                return prod ? prod.name : `Produit #${item.product_id}`;
              },
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
        // Si la ligne est étendue et que les articles ne sont pas encore chargés
        if (!record.items || record.items.length === 0) {
          // Charger les articles
          const items = await fetchRetourItems(record);

          // Mettre à jour la liste des retours d'achat pour inclure les articles
          const updatedRows = [...retourAchatAPI.retourAchats];
          const index = updatedRows.findIndex((r) => r.id === record.id);
          if (index !== -1) {
            updatedRows[index] = { ...updatedRows[index], items };
            // Ici, nous ne mettons pas à jour retourAchats directement car fetchRetourItems le fait déjà
          }
        }

        // Ajouter l'ID à la liste des lignes étendues
        setExpandedRowKeys((prev) => [...prev, record.id]);
      } else {
        // Supprimer l'ID de la liste des lignes étendues
        setExpandedRowKeys((prev) => prev.filter((key) => key !== record.id));
      }
    },
    expandedRowKeys,
  };

  // Fonction pour charger un retour d'achat pour modification
  const handleEdit = async (record: RetourAchat) => {
    // Vérifier si le retour a des paiements
    if (record.paid_amount > 0) {
      message.warning(
        "Ce retour d'achat a déjà des paiements enregistrés. Il n'est pas possible de le modifier."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("Chargement du retour d'achat pour modification:", record.id);

      // Récupérer les détails complets du retour d'achat
      const retourDetails = await retourAchatAPI.fetchRetourAchatDetail(
        String(record.id)
      );

      // Récupérer les articles du retour
      const retourItems = await retourAchatAPI.fetchOrderItems(
        String(record.id)
      );

      const retourComplet = {
        ...retourDetails,
        items: retourItems,
      };

      console.log("Retour d'achat à modifier:", retourComplet);

      // Mettre à jour l'état et ouvrir le modal d'édition
      setRetourAchatToEdit(retourComplet);
      setEditModalVisible(true);
    } catch (error) {
      console.error(
        "Erreur lors du chargement du retour d'achat pour modification:",
        error
      );
      message.error(
        "Impossible de charger le retour d'achat pour modification"
      );
    } finally {
      setLoading(false);
    }
  };

  // Colonnes de la table
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
      responsive: ["sm"],
    },
    {
      title: "Fournisseur",
      key: "fournisseur",
      responsive: ["md"],
      render: (_: any, record: RetourAchat): React.ReactNode => {
        // Essayer d'abord d'utiliser le nom du fournisseur s'il est directement disponible
        if (record.user_name) {
          return record.user_name;
        }

        // Si l'ID du fournisseur est disponible, essayer de trouver dans la liste
        if (record.user_id && fournisseurs.length > 0) {
          // Essayer plusieurs correspondances possibles
          const supplier =
            fournisseurs.find((f) => Number(f.id) === Number(record.user_id)) ||
            fournisseurs.find(
              (f) =>
                f.user_id !== undefined &&
                Number(f.user_id) === Number(record.user_id)
            );

          if (supplier) {
            return supplier.name || "Nom inconnu";
          }
        }

        return "Fournisseur inconnu";
      },
    },
    {
      title: "Entrepôt",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      responsive: ["lg"],
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
      responsive: ["md"],
    },
    {
      title: "Restant",
      dataIndex: "due_amount",
      key: "due_amount",
      render: (text: number) => `${formatNumber(text)} FCFA`,
      responsive: ["md"],
    },
    {
      title: "Statut Paiement",
      dataIndex: "payment_status",
      key: "payment_status",
      responsive: ["sm"],
      render: (text: string) => {
        let color = "default";
        if (text === "Payé") color = "success";
        else if (text === "Partiellement payé") color = "warning";
        else if (text === "Non payé") color = "error";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Statut",
      dataIndex: "order_status",
      key: "order_status",
      responsive: ["sm"],
      render: (text: string) => {
        let color = "default";
        if (text === "complété") color = "success";
        else if (text === "annulé") color = "error";
        else if (text === "en attente") color = "processing";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: RetourAchat) => (
        <Space>
          {/* Visualisation */}
          {checkPermission(
            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view"
          ) && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => loadAchatDetails(record)}
            />
          )}

          {/* Édition */}
          {checkPermission(
            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.edit"
          ) &&
            record.order_status !== "Annulé" &&
            record.is_deleted !== 1 && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                disabled={!record.is_deletable}
              />
            )}

          {/* Suppression/Restauration */}
          {checkPermission(
            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.delete"
          ) && (
            <>
              {record.is_deleted === 1 ? (
                <Button type="primary" onClick={() => handleRestore(record.id)}>
                  Restaurer
                </Button>
              ) : record.order_status === "Annulé" ? (
                <Tag color="red">Annulé</Tag>
              ) : (
                <>
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(record.id)}
                    disabled={!record.is_deletable}
                  />
                  <Button danger onClick={() => handleCancel(record.id)}>
                    Annuler
                  </Button>
                </>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="retour-achats-table overflow-x-auto">
      <Table
        dataSource={retourAchatAPI.retourAchats}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        expandable={expandable}
        scroll={{ x: "max-content" }}
      />

      {/* Modal pour afficher les détails d'un retour d'achat */}
      <OrderDetailModal
        order={selectedRetourAchat}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        produits={produits}
        taxes={taxes}
        fournisseurs={fournisseurs}
        refreshOrderDetails={() => {
          if (selectedRetourAchat) {
            fetchRetourItems(selectedRetourAchat);
          }
        }}
        refreshRetourAchats={refreshRetourAchats}
      />

      {/* Modal pour éditer un retour d'achat */}
      <RetourAchatForm
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setRetourAchatToEdit(null);
        }}
        refreshRetourAchats={refreshRetourAchats}
        retourAchatToEdit={retourAchatToEdit}
        isEditing={true}
      />
    </div>
  );
};

// Composant principal qui intègre tous les autres composants
const GestionRetourAchat: React.FC = () => {
  const [retourAchatFormVisible, setRetourAchatFormVisible] = useState(false);
  const [state, dispatch] = useReducer(retourAchatsReducer, {
    retourAchats: [],
    fournisseurs: [],
    produits: [],
    taxes: [],
    loading: true,
    currentRetourAchat: null,
    retourAchatItems: [],
    orderPayments: [],
    warehouses: [],
    totalItems: 0,
    currentPage: 1,
    error: null,
    currentWarehouse: null,
    activeTab: "tous", // Initialiser activeTab
  });
  const { selectedWarehouse } = useSelection(); // Récupérer l'entrepôt sélectionné du contexte
  // État local pour les filtres
  const [filters, setFilters] = useState({
    status: "",
    user_id: "",
    warehouse_id: "",
    dateRange: [null, null] as [any, any],
  });
  const [searchValue, setSearchValue] = useState("");
  // Utiliser la même approche simplifiée
  // @ts-ignore - Ignorer temporairement les vérifications de permission
  const auth = null;

  // Remplacer notre implémentation temporaire par le hook personnalisé
  const checkPermission = usePermission();

  // Debug de l'état de selectedWarehouse au niveau du composant principal
  useEffect(() => {
    console.log("GestionRetourAchat - selectedWarehouse:", selectedWarehouse);
    console.log(
      "GestionRetourAchat - selectedWarehouse type:",
      typeof selectedWarehouse
    );
  }, [selectedWarehouse]);

  // Fonction pour rafraîchir la liste des retours d'achat
  const refreshRetourAchats = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const params: any = {
        order_type: "purchase_return",
        page: state.currentPage,
        limit: 10,
        search: searchValue, // Use searchValue from parent component
      };

      // Add selected warehouse filter
      if (selectedWarehouse) {
        if (typeof selectedWarehouse === "object" && selectedWarehouse.id) {
          params.warehouse = selectedWarehouse.id;
        } else {
          params.warehouse = selectedWarehouse;
        }
      }

      // Add fournisseur filter
      if (filters.user_id) {
        params.user_id = filters.user_id;
      }

      // Add date range filter
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.dateDebut = filters.dateRange[0].format("YYYY-MM-DD");
        params.dateFin = filters.dateRange[1].format("YYYY-MM-DD");
      }

      // Add payment status filter based on active tab
      if (state.activeTab === "unpaid") {
        params.payment_status = "Non payé";
      } else if (state.activeTab === "partially_paid") {
        params.payment_status = "Partiellement payé";
      } else if (state.activeTab === "paid") {
        params.payment_status = "Payé";
      }

      console.log("Loading return purchases with params:", params);
      const api = new RetourAchatAPI();
      const response = await api.fetchRetourAchats(params);

      dispatch({
        type: "FETCH_RETOUR_ACHATS_SUCCESS",
        payload: response.retourAchats,
        totalItems: response.totalItems,
      });
    } catch (error) {
      console.error("Error refreshing return purchases:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Error loading return purchases",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.currentPage,
    state.activeTab,
    selectedWarehouse,
    searchValue,
    filters,
  ]);

  // Refresh the data when component mounts or when dependencies change
  useEffect(() => {
    refreshRetourAchats();
  }, [refreshRetourAchats]);

  // Afficher un message si aucun entrepôt n'est sélectionné
  useEffect(() => {
    if (!selectedWarehouse) {
      message.info(
        "Veuillez sélectionner un entrepôt pour afficher les retours d'achat"
      );
    } else {
      // Récupérer la liste des fournisseurs au chargement du composant
      const fetchFournisseurs = async () => {
        try {
          const params: any = { warehouse: selectedWarehouse };
          const response = await retourAchatAPI.fetchFournisseurs(params);
          dispatch({
            type: "FETCH_FOURNISSEURS_SUCCESS",
            payload: response,
          });
        } catch (error) {
          console.error("Erreur lors du chargement des fournisseurs:", error);
          message.error("Erreur lors du chargement des fournisseurs");
        }
      };

      fetchFournisseurs();
    }
  }, [selectedWarehouse]);

  // Récupérer les taxes au chargement du composant
  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await retourAchatAPI.fetchTaxes();
        dispatch({
          type: "FETCH_TAXES_SUCCESS",
          payload: response,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des taxes:", error);
        message.error("Erreur lors du chargement des taxes");
      }
    };

    fetchTaxes();
  }, []);

  // Récupérer les entrepôts au chargement du composant
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await retourAchatAPI.fetchWarehouses();
        dispatch({
          type: "FETCH_WAREHOUSES_SUCCESS",
          payload: response,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des entrepôts:", error);
        message.error("Erreur lors du chargement des entrepôts");
      }
    };

    fetchWarehouses();
  }, []);

  // Ouvrir le formulaire de création de retour d'achat
  const openRetourAchatForm = () => {
    setRetourAchatFormVisible(true);
  };

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (activeKey: string) => {
    console.log("Tab changed to:", activeKey);
    // Mettre à jour le tabKey dans le state
    dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey });

    // Réinitialiser la page courante à 1 via le state global
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });

    // Le rechargement des données se fera automatiquement via l'effet dans RetourAchatsTable
    // qui dépend de tabKey
  };

  const handleExportToExcel = async () => {
    try {
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });

      // Préparer les paramètres avec tous les filtres appliqués
      const params: any = {
        page: 1,
        limit: 1000, // Augmenter la limite pour exporter plus de données
        order_type: "purchase_return",
      };

      // Ajouter le filtre par statut (onglet actif)
      if (state.activeTab && state.activeTab !== "tous") {
        if (state.activeTab === "unpaid") {
          params.payment_status = "Non payé";
        } else if (state.activeTab === "partially_paid") {
          params.payment_status = "Partiellement payé";
        } else if (state.activeTab === "paid") {
          params.payment_status = "Payé";
        }
      }

      // Ajouter le filtre par magasin
      if (selectedWarehouse) {
        if (typeof selectedWarehouse === "object" && selectedWarehouse.id) {
          params.warehouse_id = selectedWarehouse.id;
        } else {
          params.warehouse_id = selectedWarehouse;
        }
      }

      // Ajouter le filtre par fournisseur
      if (filters.user_id) {
        params.user_id = filters.user_id;
      }

      // Ajouter le filtre par date
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.dateDebut = filters.dateRange[0].format("YYYY-MM-DD");
        params.dateFin = filters.dateRange[1].format("YYYY-MM-DD");
      }

      // Ajouter le filtre par recherche
      if (searchValue) {
        params.search = searchValue;
      }

      // Récupérer les données en tenant compte des filtres actuels
      const api = new RetourAchatAPI();
      const response = await api.fetchRetourAchats(params);
      const retours = response.retourAchats || [];

      // Préparer les données pour l'export Excel
      const dataToExport = retours.map((retour: RetourAchat) => ({
        ID: retour.id,
        "№ Facture": retour.invoice_number,
        Référence: retour.reference,
        Date: dayjs(retour.order_date).format("DD/MM/YYYY"),
        Fournisseur: retour.user_name,
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

      // Créer le fichier Excel
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Retours d'achat");

      // Définir les largeurs des colonnes
      const columnWidths = [
        { wch: 8 }, // ID
        { wch: 15 }, // № Facture
        { wch: 15 }, // Référence
        { wch: 12 }, // Date
        { wch: 30 }, // Fournisseur
        { wch: 20 }, // Magasin
        { wch: 15 }, // Statut
        { wch: 20 }, // Statut de paiement
        { wch: 15 }, // Montant payé
        { wch: 15 }, // Montant dû
        { wch: 15 }, // Total
        { wch: 12 }, // Créé le
      ];
      worksheet["!cols"] = columnWidths;

      // Télécharger le fichier
      const today = dayjs().format("YYYY-MM-DD");
      XLSX.writeFile(workbook, `Retours_Achat_${today}.xlsx`);

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

  return (
    <div className="gestion-retour-achat p-sm md:p-md">
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-md">
        <div className="title-section mb-sm sm:mb-0">
          <Title level={2} className="!mb-xs">
            <UndoOutlined /> Gestion des Retours d'Achat
          </Title>
          <Text type="secondary">
            Gérez les retours de produits à vos fournisseurs
          </Text>
        </div>
        <div className="action-buttons flex flex-col sm:flex-row gap-sm w-full sm:w-auto">
          {checkPermission(
            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.create"
          ) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openRetourAchatForm}
              className="w-full sm:w-auto"
            >
              Nouveau retour d'achat
            </Button>
          )}

          {checkPermission(
            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view"
          ) && (
            <Button
              icon={<FileExcelOutlined style={{ color: "#217346" }} />}
              onClick={handleExportToExcel}
              className="w-full sm:w-auto"
            >
              Exporter sur Excel
            </Button>
          )}
        </div>
      </div>

      <Card>
        {/* Onglets avec filtres à droite */}
        <Row gutter={[16, 16]} align="middle" className="mb-md flex-wrap">
          <Col xs={24} md={16} className="overflow-x-auto">
            <Tabs
              defaultActiveKey="tous"
              activeKey={state.activeTab}
              onChange={handleTabChange}
            >
              <TabPane tab="Tous les retours" key="tous" />
              <TabPane tab="Non payé" key="unpaid" />
              <TabPane tab="Partiellement payé" key="partially_paid" />
              <TabPane tab="Payé" key="paid" />
            </Tabs>
          </Col>
          <Col
            xs={24}
            md={8}
            className="flex flex-col md:flex-row md:items-center md:justify-end md:gap-sm"
          >
            {/* Removed Space component and applied flex directly to Col */}
            <Input
              placeholder="Rechercher par numéro..."
              prefix={<SearchOutlined />}
              onChange={(e) => {
                const value = e.target.value.trim();
                setSearchValue(value);
              }}
              className="w-full md:w-auto mb-sm md:mb-0" // Responsive width and margin
            />
            <Select
              placeholder="Fournisseur"
              className="w-full md:w-auto mb-sm md:mb-0" // Responsive width and margin
              allowClear
              onChange={(value: any) => {
                const newFilters = { ...filters, user_id: value };
                setFilters(newFilters);
              }}
            >
              {state.fournisseurs.map((fournisseur) => (
                <Option key={fournisseur.id} value={fournisseur.id}>
                  {fournisseur.name}
                </Option>
              ))}
            </Select>
            <DatePicker.RangePicker
              format="YYYY-MM-DD"
              onChange={(dates: any, dateStrings: string[]) => {
                const newFilters = { ...filters, dateRange: dates };
                setFilters(newFilters);
              }}
              className="w-full md:w-auto" // Responsive width
            />
          </Col>
        </Row>
        <RetourAchatsTable
          refreshRetourAchats={refreshRetourAchats}
          tabKey={state.activeTab}
        />
      </Card>

      {/* Formulaire de création de retour d'achat */}
      <RetourAchatForm
        visible={retourAchatFormVisible}
        onClose={() => setRetourAchatFormVisible(false)}
        refreshRetourAchats={refreshRetourAchats}
        retourAchatToEdit={null}
        isEditing={false}
      />
    </div>
  );
};

export default GestionRetourAchat;
