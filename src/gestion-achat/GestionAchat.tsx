import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
} from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Spin,
  Tabs,
  TabsProps,
  Layout,
  Progress,
  Divider,
  Typography,
  List,
  Popconfirm,
  Switch,
  Table,
  Card,
  Tooltip,
  Empty,
  Alert,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelection } from "../SelectionContext";
import BarcodeScanner from "./BarcodeScanner";
import ProductSearch from "./ProductSearch";
import useTaxes from "./useTaxes";
import axios from "axios";
import { AchatsContext } from "./store/context";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext"; // Use AuthContext

import {
  AchatFormData,
  Product,
  AchatsAction,
  AchatsState,
  PaymentFormModalProps,
  OrderDetailModalProps,
  AchatFormProps,
  AchatsTableProps,
} from "./types";
import PaymentFormModal from "./components/PaymentFormModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Fonction utilitaire pour formater les nombres
const formatNumber = (value: any): string => {
  // Gestion des cas null ou undefined
  if (value === null || value === undefined) return "0";

  // Conversion en nombre si nécessaire
  const numericValue =
    typeof value === "string" ? parseFloat(value) : Number(value);

  // Vérification que la valeur est bien un nombre
  if (isNaN(numericValue)) return "0";

  // Formatage avec locale fr-FR, sans décimales
  return numericValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const BASE_URL = "http://localhost:3000";

// Fonction pour récupérer les informations du magasin par son ID
const fetchWarehouseInfo = async (warehouseId: number | null): Promise<any> => {
  if (!warehouseId) return null;

  try {
    // Essayer d'abord avec l'API warehouse qui récupère un magasin spécifique
    console.log(
      `Tentative de récupération du magasin ${warehouseId} via l'API...`
    );
    const response = await fetch(`${BASE_URL}/api/warehouse/${warehouseId}`);

    if (!response.ok) {
      console.error(
        `Erreur lors de la récupération du magasin ${warehouseId}: ${response.statusText}`
      );

      // Créer un objet magasin minimal avec l'ID comme fallback
      console.warn(
        `Impossible de récupérer les informations complètes du magasin ${warehouseId}, utilisation d'un objet minimal`
      );
      return {
        id: warehouseId,
        name: `Magasin ${warehouseId}`,
      };
    }

    const warehouse = await response.json();
    console.log(`Magasin ${warehouseId} récupéré:`, warehouse);
    return warehouse;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du magasin ${warehouseId}:`,
      error
    );

    // En cas d'erreur, retourner également un objet minimal
    return {
      id: warehouseId,
      name: `Magasin ${warehouseId}`,
    };
  }
};

/* --- API --- */
const api = {
  async fetchAchats(params: any) {
    const queryParams: any = { order_type: "purchase" };
    if (params.invoice_number)
      queryParams.invoice_number = params.invoice_number;
    if (params.fournisseur) {
      queryParams.fournisseur = params.fournisseur;
      console.log(
        `Filtrage par fournisseur ID=${params.fournisseur} dans l'API`
      );
    }
    if (params.dateDebut) queryParams.dateDebut = params.dateDebut;
    if (params.dateFin) queryParams.dateFin = params.dateFin;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.warehouse) queryParams.warehouse = params.warehouse;
    if (params.include_deleted)
      queryParams.include_deleted = params.include_deleted;
    if (params.payment_status) {
      queryParams.payment_status = params.payment_status;
      console.log(`Filtrage par statut de paiement: ${params.payment_status}`);
    }
    // Ajouter le paramètre company_id s'il est fourni
    if (params.company_id) {
      queryParams.company_id = params.company_id;
      console.log(`Filtrage par entreprise ID=${params.company_id} dans l'API`);
    }

    const qs = new URLSearchParams(queryParams).toString();
    console.log(`Requête API: ${BASE_URL}/api/orders?${qs}`);

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
      console.log("Achats récupérés :", data);

      if (!data || (!data.orders && !Array.isArray(data))) {
        console.error("Format de réponse invalide:", data);
        throw new Error("Format de réponse invalide");
      }

      const achatsArray = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data)
        ? data
        : [];
      const total = data.total || achatsArray.length;

      return { data: achatsArray, total };
    } catch (error) {
      console.error("Erreur lors de la récupération des achats:", error);
      throw error;
    }
  },
  async fetchFournisseurs(warehouseId?: number) {
    // Construire l'URL avec les paramètres nécessaires
    let url = `${BASE_URL}/api/users/suppliers`;

    // Ajouter le paramètre warehouseId si fourni
    if (warehouseId) {
      url += `?warehouseId=${warehouseId}`;
      console.log(
        `Récupération des fournisseurs pour le magasin ${warehouseId}`
      );
    } else {
      console.log(
        `Récupération de tous les fournisseurs (aucun magasin spécifié)`
      );
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      console.log("Fournisseurs récupérés :", data);

      // Vérifier la structure des données reçues
      let fournisseursData = Array.isArray(data) ? data : [];
      if (data && data.users && Array.isArray(data.users)) {
        fournisseursData = data.users;
      }

      // Ajouter des logs pour débogage
      console.log(
        "Structure des données de fournisseurs:",
        fournisseursData.length > 0 ? fournisseursData[0] : "Aucun fournisseur"
      );
      if (fournisseursData.length > 0) {
        console.log("Exemple d'ID fournisseur:", fournisseursData[0].id);
        console.log(
          "Exemple de nom fournisseur:",
          fournisseursData[0].name ||
            fournisseursData[0].company_name ||
            fournisseursData[0].Nom_Raison_Sociale
        );
        console.log(
          "Exemple de magasin fournisseur:",
          fournisseursData[0].warehouse_id ||
            fournisseursData[0].detail_warehouse_id ||
            "Non spécifié"
        );
      }

      return fournisseursData;
    } catch (error) {
      console.error("Erreur lors de la récupération des fournisseurs:", error);
      return []; // Retourner un tableau vide plutôt que de propager l'erreur
    }
  },
  async fetchProduits(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/produits?${queryString}`);
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    console.log("Produits récupérés :", data);
    return { data: data.products || [], total: data.total || 0 };
  },
  async fetchTaxes(companyId?: number) {
    // Construire l'URL avec les paramètres
    let url = `${BASE_URL}/api/taxes`;

    if (companyId) {
      url += `?companyId=${companyId}`;
      console.log(`Récupération des taxes pour l'entreprise ${companyId}`);
    } else {
      console.log(
        "Récupération de toutes les taxes (aucune entreprise spécifiée)"
      );
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    console.log("Taxes récupérées :", data);
    return data.taxes || [];
  },
  async createAchat(data: any) {
    data.order_type = "purchase";
    console.log("Création de l'achat avec les données :", data);
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async updateAchat(id: number, data: any) {
    data.order_type = "purchase";
    console.log(
      "Mise à jour de l'achat (ID =",
      id,
      ") avec les données :",
      data
    );

    // Vérifier que les données sont complètes
    if (!data.warehouse_id) {
      console.error("warehouse_id manquant", data);
      throw new Error("Veuillez sélectionner un magasin");
    }

    if (!data.user_id) {
      console.error("user_id (fournisseur) manquant", data);
      throw new Error("Veuillez sélectionner un fournisseur");
    }

    if (!data.company_id) {
      console.error("company_id manquant", data);
      throw new Error("Veuillez sélectionner une entreprise");
    }

    if (!data.items || data.items.length === 0) {
      console.error("items (produits) manquants", data);
      throw new Error("Veuillez ajouter au moins un produit");
    }

    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de réponse:", errorText);
        throw new Error(response.statusText || "Erreur lors de la mise à jour");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'achat:", error);
      throw error;
    }
  },
  async deleteAchat(id: number) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async cancelAchat(id: number) {
    const payload = { order_status: "Annulé", cancelled: 1, is_deletable: 0 };
    const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async fetchAchatDetail(id: string) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}`);
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    console.log("Détails de l'achat récupérés pour l'ID", id, ":", data);
    return data;
  },
  async fetchOrderItems(orderId: string) {
    console.log("Tentative de récupération des éléments de l'achat", orderId);
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${orderId}/items`);
      if (!response.ok) {
        console.error(
          "Erreur lors de la récupération des éléments:",
          response.statusText
        );
        return [];
      }
      const data = await response.json();
      console.log("Éléments de l'achat récupérés:", data);
      return Array.isArray(data) ? data : data.items || [];
    } catch (error) {
      console.error("Exception lors de la récupération des éléments:", error);
      return [];
    }
  },
  async restoreAchat(id: number) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/restore`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async fetchWarehouses() {
    try {
      const response = await fetch(`${BASE_URL}/api/warehouses`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      console.log("Magasins récupérés :", data);
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des magasins:", error);
      throw error;
    }
  },
  async fetchWarehouse(id: number) {
    try {
      const response = await fetch(`${BASE_URL}/api/warehouses/${id}`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      console.log(`Magasin ${id} récupéré :`, data);
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du magasin ${id}:`, error);
      throw error;
    }
  },
};

/* --- Reducer et état initial --- */
const initialState: AchatsState = {
  achats: [],
  fournisseurs: [],
  produits: [],
  taxes: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  searchTerm: "",
  dateRange: { start: "", end: "" },
  selectedFournisseur: null,
  showForm: false,
  showScanner: false,
  formData: {
    Date_Facture: dayjs().format("YYYY-MM-DD"),
    Statut_Achat: "Commandé",
    Fournisseur_ID: undefined,
    warehouse_id: null,
    produitsAches: [],
    remise_globale: 0,
    termes_conditions: "",
    remarques: "",
  },
  showDeleted: false,
  activeTab: "all",
};

const achatsReducer = (
  state: AchatsState,
  action: AchatsAction
): AchatsState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACHATS":
      return {
        ...state,
        achats: action.payload.achats,
        totalPages: Math.ceil(action.payload.total / state.itemsPerPage),
        loading: false,
        error: null,
      };
    case "DELETE_ACHAT":
      return {
        ...state,
        achats: state.achats.filter((achat) => achat.id !== action.payload),
      };
    case "SET_FOURNISSEURS":
      return { ...state, fournisseurs: action.payload, loading: false };
    case "SET_PRODUITS":
      return { ...state, produits: action.payload, loading: false };
    case "SET_TAXES":
      return { ...state, taxes: action.payload, loading: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, currentPage: 1 };
    case "SET_SELECTED_FOURNISSEUR":
      return { ...state, selectedFournisseur: action.payload, currentPage: 1 };
    case "TOGGLE_FORM":
      return { ...state, showForm: action.payload };
    case "TOGGLE_SCANNER":
      return { ...state, showScanner: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "UPDATE_FORM_DATA":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case "TOGGLE_SHOW_DELETED":
      return { ...state, showDeleted: action.payload, currentPage: 1 };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};

/* --- Modal de détail de commande --- */
const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  visible,
  onClose,
  produits,
  taxes,
  fournisseurs,
  refreshOrderDetails,
  refreshAchats,
}) => {
  // Appeler le hook avant toute condition
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localOrder, setLocalOrder] = useState<any>(null);

  // Mettre à jour l'état local lorsque l'ordre change
  useEffect(() => {
    if (order) {
      console.log("Détails de la commande avec paiements:", order);
      console.log("Paiements associés:", order.payments);
      setLocalOrder(order);
    }
  }, [order]);

  // Fonction pour ouvrir les détails d'un paiement
  const openPaymentDetails = (paymentId: number) => {
    // Ouvrir les détails du paiement dans un nouvel onglet
    window.open(`/paiements-sortants?payment_id=${paymentId}`, "_blank");
  };

  // Fonction pour récupérer les paiements associés à une commande - conservée pour référence mais non utilisée
  const fetchOrderPayments = async (orderId: number) => {
    try {
      console.log(`Récupération des paiements pour la commande ${orderId}`);
      const response = await fetch(
        `${BASE_URL}/api/orders/${orderId}/payments`
      );
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const payments = await response.json();
      console.log(
        `${payments.length} paiements trouvés pour la commande ${orderId}:`,
        payments
      );

      // Vérification du format des données
      if (payments.length > 0) {
        console.log("Structure du premier paiement:", Object.keys(payments[0]));
        console.log("Premier paiement (détail):", payments[0]);
      }

      return payments;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des paiements pour la commande ${orderId}:`,
        error
      );
      return [];
    }
  };

  // Suppression de l'effet qui déclenche un second chargement des paiements
  // Cela évite le problème de duplication des paiements
  // Les paiements sont déjà inclus dans l'objet 'order' par api.fetchAchatDetail

  if (!localOrder) return null;

  // Calculer les valeurs basées sur l'état local
  const percentage =
    localOrder.total && localOrder.total > 0
      ? Math.round((localOrder.paid_amount / localOrder.total) * 100)
      : 0;

  // Rechercher le fournisseur par user_id au lieu de id
  const supplierByUserId = fournisseurs.find(
    (f: any) => Number(f.user_id) === Number(localOrder.user_id)
  );

  // Si le fournisseur n'est pas trouvé, essayer de trouver un fournisseur avec un id correspondant (pour la compatibilité)
  const supplierById = !supplierByUserId
    ? fournisseurs.find((f: any) => Number(f.id) === Number(localOrder.user_id))
    : null;

  // Utiliser le fournisseur trouvé ou le fallback
  const supplierToDisplay = supplierByUserId || supplierById;

  const montantDu = localOrder.total - localOrder.paid_amount;
  const paymentStatus =
    localOrder.paid_amount === 0
      ? "Non payé"
      : localOrder.paid_amount < localOrder.total
      ? "Partiellement payé"
      : "Payé";

  const detailColumns = [
    {
      title: "Produit",
      dataIndex: "product_id",
      key: "produit",
      render: (product_id: any, record: any): string => {
        // Directly use the nom_produit from the already processed record
        return record.nom_produit || "Produit inconnu";
        /* Old code that re-searched global state:
        const prod = state.produits.find(
          (p: any) => Number(p.id) === Number(product_id)
        );
        return prod ? prod.name : "Produit inconnu";
        */
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
        const tax = taxes.find((t: any) => t.id === tax_id);
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
    <>
      <Modal
        visible={visible}
        title={`Détail de l'achat - ${localOrder.invoice_number}`}
        onCancel={onClose}
        footer={[
          localOrder.paid_amount < localOrder.total &&
            !localOrder.is_deleted && (
              <Button
                key="payment"
                type="primary"
                onClick={() => setShowPaymentModal(true)}
              >
                Ajouter un paiement
              </Button>
            ),
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => message.info("Téléchargement en cours...")}
          >
            Télécharger
          </Button>,
          <Button key="close" onClick={onClose}>
            Fermer
          </Button>,
        ]}
        width={window.innerWidth > 768 ? "80%" : "100%"}
        style={{ maxWidth: "1200px" }}
      >
        <div className="overflow-x-auto">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={24} md={8}>
              <strong>Fournisseur :</strong>{" "}
              {supplierToDisplay
                ? supplierToDisplay.name ||
                  supplierToDisplay.company_name ||
                  supplierToDisplay.Nom_Raison_Sociale ||
                  "Nom inconnu"
                : "Inconnu"}
            </Col>
            <Col xs={24} sm={12} md={8}>
              <strong>Montant total :</strong> {formatNumber(localOrder.total)}{" "}
              CFA
            </Col>
            <Col xs={24} sm={12} md={8}>
              <strong>Montant payé :</strong>{" "}
              {formatNumber(localOrder.paid_amount)} CFA
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <strong>Montant dû :</strong> {formatNumber(montantDu)} CFA
            </Col>
            <Col xs={24} sm={12} md={8}>
              <strong>Remise :</strong> {formatNumber(localOrder.discount || 0)}{" "}
              CFA
            </Col>
            <Col xs={24} sm={24} md={8}>
              <strong>Statut de paiement :</strong> {paymentStatus}
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <strong>Statut d'achat :</strong> {localOrder.order_status}
            </Col>
          </Row>

          {/* Section des paiements associés */}
          <Divider style={{ margin: "12px 0" }} />
          <Typography.Title level={5}>Paiements associés</Typography.Title>
          {Array.isArray(localOrder.payments) &&
          localOrder.payments.length > 0 ? (
            <List
              size="small"
              dataSource={localOrder.payments}
              renderItem={(payment: any) => (
                <List.Item
                  key={
                    payment.order_payment_id || payment.id || payment.payment_id
                  }
                  style={{ padding: "8px 0" }}
                  className="flex flex-wrap"
                >
                  <div className="w-full sm:w-auto mb-1 sm:mb-0 mr-2">
                    <Button
                      type="link"
                      onClick={() => openPaymentDetails(payment.payment_id)}
                      style={{ padding: "0", height: "auto" }}
                    >
                      {payment.payment_number ||
                        `Paiement #${payment.payment_id}`}
                    </Button>
                  </div>
                  <div className="w-full sm:w-auto mb-1 sm:mb-0 mr-2">
                    (
                    {payment.date
                      ? dayjs(payment.date).format("DD/MM/YYYY")
                      : "Date non spécifiée"}
                    )
                  </div>
                  <div className="w-full sm:w-auto mb-1 sm:mb-0 mr-2">
                    <Tooltip title="Montant total du paiement">
                      {payment.montant_total
                        ? formatNumber(payment.montant_total)
                        : payment.amount
                        ? formatNumber(payment.amount)
                        : "?"}{" "}
                      FCFA
                    </Tooltip>
                  </div>
                  <div
                    className="w-full sm:w-auto mb-1 sm:mb-0 mr-2"
                    style={{ color: "#52c41a" }}
                  >
                    <Tooltip title="Montant affecté à cette commande">
                      (dont{" "}
                      {payment.montant_affecte !== undefined
                        ? formatNumber(payment.montant_affecte)
                        : payment.amount !== undefined
                        ? formatNumber(payment.amount)
                        : payment.op_amount !== undefined
                        ? formatNumber(payment.op_amount)
                        : "?"}{" "}
                      FCFA)
                    </Tooltip>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Tag color="blue">
                      {payment.payment_mode_name ||
                        "Mode de paiement non spécifié"}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Typography.Text type="secondary">
              Aucun paiement associé à cette commande.
            </Typography.Text>
          )}

          <Progress
            percent={percentage}
            status={percentage === 100 ? "success" : "active"}
          />
          <div className="overflow-x-auto">
            <Table
              dataSource={localOrder.produitsAches || []}
              columns={detailColumns}
              rowKey={(record: any, index) =>
                record.id ? record.id.toString() : (index ?? 0).toString()
              }
              pagination={false}
              style={{ marginTop: 16 }}
              scroll={{ x: "max-content" }}
              size="small"
            />
          </div>
        </div>
      </Modal>
      {showPaymentModal && (
        <PaymentFormModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={localOrder}
          onPaymentAdded={async (closeDetailModal) => {
            // Rafraîchir les détails de l'achat seulement si closeDetailModal n'est pas explicitement false
            if (closeDetailModal !== false) {
              const updatedOrder = await refreshOrderDetails(
                String(localOrder.id)
              );
              // Mettre à jour l'état local avec les nouvelles données
              if (updatedOrder) {
                setLocalOrder(updatedOrder);
              }
              // Rafraîchir la liste des achats
              await refreshAchats();
            } else {
              console.log(
                "Mise à jour de la commande ignorée pour éviter les doubles enregistrements"
              );
            }

            // Si closeDetailModal est true, fermer également le modal de détail
            if (closeDetailModal === true) {
              console.log(
                "Fermeture du modal de détail après ajout de paiement"
              );
              onClose();
            }
          }}
        />
      )}
    </>
  );
};

/* --- Formulaire modal de création/modification --- */
const AchatForm: React.FC<AchatFormProps> = ({
  visible,
  onClose,
  refreshAchats,
}) => {
  const context = useContext(AchatsContext);
  if (!context) throw new Error("AchatForm must be used within AchatsContext");
  const { state, dispatch, api } = context;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { selectedWarehouse: selectedWarehouseId, selectedCompany } =
    useSelection();
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [searchKey, setSearchKey] = useState<number>(0);

  // Logging pour debugging
  useEffect(() => {
    console.log("[AchatForm] selectedWarehouseId:", selectedWarehouseId);
    console.log("[AchatForm] selectedWarehouse:", selectedWarehouse);
    console.log("[AchatForm] selectedCompany:", selectedCompany);
  }, [selectedWarehouseId, selectedWarehouse, selectedCompany]);

  // Effet pour récupérer les informations complètes du magasin sélectionné
  useEffect(() => {
    const getWarehouseInfo = async () => {
      if (selectedWarehouseId) {
        // Afficher un message de chargement
        message.loading({
          content: "Chargement des informations du magasin...",
          key: "warehouseLoading",
          duration: 0,
        });

        const warehouseInfo = await fetchWarehouseInfo(selectedWarehouseId);

        // Fermer le message de chargement
        message.destroy("warehouseLoading");

        if (warehouseInfo) {
          setSelectedWarehouse(warehouseInfo);
          console.log("Informations du magasin récupérées:", warehouseInfo);
        } else {
          // Si le magasin n'est pas trouvé, créer un objet magasin minimal avec l'ID
          const minimalWarehouse = {
            id: selectedWarehouseId,
            name: `Magasin ${selectedWarehouseId}`,
          };
          setSelectedWarehouse(minimalWarehouse);
          console.warn(
            `Impossible de récupérer les informations complètes du magasin ${selectedWarehouseId}, utilisation d'un objet minimal`
          );
        }
      } else {
        setSelectedWarehouse(null);
      }
    };

    getWarehouseInfo();
  }, [selectedWarehouseId]);

  useEffect(() => {
    console.log("[AchatForm] selectedWarehouseId:", selectedWarehouseId);
    console.log("[AchatForm] selectedWarehouse:", selectedWarehouse);
    console.log("[AchatForm] fournisseurs:", state.fournisseurs);

    // Vérifier si des fournisseurs sont disponibles pour le magasin sélectionné
    if (selectedWarehouse && state.fournisseurs.length > 0) {
      const filteredSuppliers = state.fournisseurs.filter(
        (f) => f.warehouse_id === selectedWarehouse.id
      );

      // Si aucun fournisseur n'est disponible pour ce magasin, afficher un message
      if (filteredSuppliers.length === 0) {
        message.info(
          `Aucun fournisseur disponible pour le magasin "${selectedWarehouse.name}". Tous les fournisseurs sont affichés.`
        );
      }
    }
  }, [selectedWarehouse, state.fournisseurs]);

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    // Réinitialiser le formulaire
    form.resetFields();

    // Réinitialiser l'état du formulaire avec les valeurs par défaut
    dispatch({
      type: "SET_FORM_DATA",
      payload: {
        ...initialState.formData,
        Date_Facture: dayjs().format("YYYY-MM-DD"),
        Statut_Achat: "Commandé",
        produitsAches: [],
        remise_globale: 0,
      },
    });

    console.log("Formulaire réinitialisé");
  };

  // Fonction pour gérer la fermeture du formulaire
  const handleClose = () => {
    // Réinitialiser le formulaire
    resetForm();

    // Fermer le formulaire
    onClose();
  };

  useEffect(() => {
    console.log("Initialisation du formulaire avec:", state.formData);

    let fournisseurValue = undefined;
    if (state.formData.Fournisseur_ID) {
      if (state.formData.supplier_name) {
        fournisseurValue = {
          value: Number(state.formData.Fournisseur_ID),
          label: state.formData.supplier_name,
        };
        console.log(
          "Utilisation de supplier_name depuis le backend:",
          state.formData.supplier_name
        );
      } else if (state.fournisseurs && state.fournisseurs.length > 0) {
        const supplier = state.fournisseurs.find(
          (f) => Number(f.id) === Number(state.formData.Fournisseur_ID)
        );
        if (supplier) {
          fournisseurValue = {
            value: Number(state.formData.Fournisseur_ID),
            label:
              supplier.name ||
              supplier.company_name ||
              supplier.Nom_Raison_Sociale ||
              String(state.formData.Fournisseur_ID),
          };
          console.log(
            "Nom trouvé dans state.fournisseurs:",
            fournisseurValue.label
          );
        } else {
          fournisseurValue = {
            value: Number(state.formData.Fournisseur_ID),
            label: String(state.formData.Fournisseur_ID),
          };
          console.log(
            "Aucun fournisseur trouvé dans la liste, utilisation de l'ID:",
            state.formData.Fournisseur_ID
          );
        }
      } else {
        fournisseurValue = {
          value: Number(state.formData.Fournisseur_ID),
          label: String(state.formData.Fournisseur_ID),
        };
        console.log(
          "Aucune donnée fournisseur disponible, utilisation de l'ID:",
          state.formData.Fournisseur_ID
        );
      }
    }

    form.setFieldsValue({
      ...state.formData,
      Date_Facture: state.formData.Date_Facture
        ? dayjs(state.formData.Date_Facture)
        : dayjs(),
      Fournisseur_ID: fournisseurValue,
      Statut_Achat: state.formData.Statut_Achat || "Commandé",
    });
  }, [state.formData, form, state.fournisseurs]);

  // Updated second useEffect to update Fournisseur_ID when state.fournisseurs or supplier info changes
  useEffect(() => {
    if (state.formData.Fournisseur_ID) {
      let fournisseurValue;
      if (state.formData.supplier_name) {
        fournisseurValue = {
          value: Number(state.formData.Fournisseur_ID),
          label: state.formData.supplier_name,
        };
        console.log(
          "Mise à jour avec supplier_name:",
          state.formData.supplier_name
        );
      } else if (state.fournisseurs && state.fournisseurs.length > 0) {
        // Rechercher le fournisseur par user_id au lieu de id
        const supplier = state.fournisseurs.find(
          (f) => Number(f.user_id) === Number(state.formData.Fournisseur_ID)
        );
        if (supplier) {
          fournisseurValue = {
            value: Number(state.formData.Fournisseur_ID),
            label:
              supplier.name ||
              supplier.company_name ||
              supplier.Nom_Raison_Sociale ||
              String(state.formData.Fournisseur_ID),
          };
          console.log(
            "Mise à jour à partir de state.fournisseurs:",
            fournisseurValue.label
          );
        } else {
          fournisseurValue = {
            value: Number(state.formData.Fournisseur_ID),
            label: String(state.formData.Fournisseur_ID),
          };
          console.log(
            "Fournisseur non trouvé dans la liste, utilisation de l'ID:",
            state.formData.Fournisseur_ID
          );
        }
      } else {
        fournisseurValue = {
          value: Number(state.formData.Fournisseur_ID),
          label: String(state.formData.Fournisseur_ID),
        };
        console.log(
          "Aucune donnée fournisseur disponible, utilisation de l'ID:",
          state.formData.Fournisseur_ID
        );
      }
      form.setFieldsValue({ Fournisseur_ID: fournisseurValue });
    }
  }, [
    state.fournisseurs,
    state.formData.Fournisseur_ID,
    state.formData.supplier_name,
  ]);

  const calculerTotaux = useCallback(() => {
    const produitsAches = state.formData.produitsAches;
    // Garantir que tous les nombres sont bien des nombres
    const totalHT = produitsAches.reduce(
      (sum, p) =>
        sum + (Number(p.prix_unitaire_HT) || 0) * (Number(p.quantite) || 0),
      0
    );
    const totalRemises =
      produitsAches.reduce((sum, p) => sum + (Number(p.remise) || 0), 0) +
      (Number(state.formData.remise_globale) || 0);
    const totalTaxes = produitsAches.reduce((sum, p) => {
      if (!p.taxe) return sum;
      const tax = state.taxes.find((t: any) => t.id === p.taxe);
      if (!tax) return sum;
      const montantHT =
        (Number(p.prix_unitaire_HT) || 0) * (Number(p.quantite) || 0) -
        (Number(p.remise) || 0);
      return sum + (montantHT * Number(tax.rate || 0)) / 100;
    }, 0);
    const totalTTC = totalHT - totalRemises + totalTaxes;
    return { totalHT, totalRemises, totalTaxes, totalTTC };
  }, [
    state.formData.produitsAches,
    state.formData.remise_globale,
    state.taxes,
  ]);

  const { totalHT, totalRemises, totalTaxes, totalTTC } = calculerTotaux();

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      console.log("Valeurs du formulaire:", values);

      // Extraire l'ID du magasin sélectionné
      let warehouseId = null;
      if (selectedWarehouse) {
        warehouseId = selectedWarehouse.id;
        console.log("Magasin sélectionné pour l'achat:", {
          id: selectedWarehouse.id,
          name: selectedWarehouse.name,
        });
      }

      if (!warehouseId) {
        message.error("Veuillez sélectionner un magasin");
        setSubmitting(false);
        return;
      }

      // Vérifier que selectedCompany est défini
      if (!selectedCompany) {
        console.error("Erreur: Aucune entreprise sélectionnée");
        message.error(
          "Impossible de créer un achat: entreprise non sélectionnée"
        );
        setSubmitting(false);
        return;
      }

      // Extraire l'ID du fournisseur et l'objet fournisseur complet
      let fournisseurId: number | string | null = null;

      // Traiter les différents cas possibles pour Fournisseur_ID
      if (values.Fournisseur_ID) {
        // Cas 1: Fournisseur_ID est un objet avec une propriété value (comme dans le Select avec labelInValue)
        if (
          typeof values.Fournisseur_ID === "object" &&
          values.Fournisseur_ID !== null &&
          "value" in values.Fournisseur_ID
        ) {
          fournisseurId = values.Fournisseur_ID.value;
        }
        // Cas 2: Fournisseur_ID est une valeur directe (nombre ou chaîne)
        else if (
          typeof values.Fournisseur_ID === "number" ||
          typeof values.Fournisseur_ID === "string"
        ) {
          fournisseurId = values.Fournisseur_ID;
        }
      }

      // Si nous n'avons pas trouvé d'ID, essayer de le récupérer depuis state.formData
      if (!fournisseurId && state.formData.Fournisseur_ID) {
        // Traiter les différents cas possibles pour state.formData.Fournisseur_ID
        if (
          typeof state.formData.Fournisseur_ID === "object" &&
          state.formData.Fournisseur_ID !== null &&
          "value" in state.formData.Fournisseur_ID
        ) {
          // Si c'est un objet avec une propriété value
          fournisseurId = state.formData.Fournisseur_ID.value;
        } else if (
          typeof state.formData.Fournisseur_ID === "number" ||
          typeof state.formData.Fournisseur_ID === "string"
        ) {
          // Si c'est une valeur directe
          fournisseurId = state.formData.Fournisseur_ID;
        }

        console.log(
          "Tentative de récupération de l'ID du fournisseur depuis state.formData:",
          fournisseurId
        );
      }

      if (!fournisseurId) {
        message.error("Veuillez sélectionner un fournisseur valide");
        setSubmitting(false);
        return;
      }

      // Log pour le débogage
      console.log("Fournisseur sélectionné (user_id):", fournisseurId);

      // Préparer les données pour l'API
      const formData = {
        ...values,
        // Ajouter explicitement le warehouse_id
        warehouse_id: warehouseId,
        // Utiliser directement l'ID du fournisseur comme user_id
        user_id: fournisseurId,
        // Supprimer Fournisseur_ID pour éviter la confusion
        Fournisseur_ID: undefined,
        // S'assurer que le statut d'achat est correctement défini
        order_status: values.Statut_Achat || "Commandé",
        // Convertir la date en format ISO
        order_date: values.Date_Facture
          ? values.Date_Facture.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        // Supprimer le champ Date_Facture pour éviter la confusion
        Date_Facture: undefined,
        // Ajouter les champs requis par l'API
        order_type: "purchase",
        invoice_type: null,
        tax_id: null,
        tax_rate: null,
        tax_amount: 0,
        shipping: 0,
        discount: values.remise_globale || 0,
        // Supprimer le champ remise_globale pour éviter la confusion
        remise_globale: undefined,
        subtotal: totalHT,
        total: totalTTC,
        // S'assurer que paid_amount est toujours défini à 0 s'il est absent ou null
        paid_amount: values.paid_amount || 0,
        due_amount: totalTTC - (values.paid_amount || 0),
        payment_status:
          values.paid_amount && values.paid_amount >= totalTTC
            ? "Payé"
            : values.paid_amount && values.paid_amount > 0
            ? "Partiellement payé"
            : "Non payé",
        total_items: state.formData.produitsAches.length,
        total_quantity: state.formData.produitsAches.reduce(
          (sum, item) => sum + Number(item.quantite),
          0
        ),
        // Convertir les produits au format API
        items: state.formData.produitsAches.map((item) => ({
          product_id: item.produit_id,
          unit_id: null,
          quantity: Number(item.quantite),
          unit_price: Number(item.prix_unitaire_HT),
          single_unit_price: Number(item.prix_unitaire_HT),
          tax_id: item.taxe || null,
          tax_rate: item.taxe
            ? state.taxes.find((t) => t.id === item.taxe)?.rate || 0
            : 0,
          tax_type: "percent",
          discount_rate: Number(item.remise) || 0,
          total_tax: Number(item.montant_taxe) || 0,
          total_discount:
            (Number(item.prix_unitaire_HT) *
              Number(item.quantite) *
              Number(item.remise)) /
              100 || 0,
          subtotal:
            Number(item.prix_unitaire_HT) * Number(item.quantite) -
            (Number(item.prix_unitaire_HT) *
              Number(item.quantite) *
              Number(item.remise)) /
              100,
        })),
        // Convertir les notes et termes en chaînes vides si null/undefined
        notes: values.remarques || "",
        terms_condition: values.termes_conditions || "",
        // Supprimer les champs remarques et termes_conditions pour éviter la confusion
        remarques: undefined,
        termes_conditions: undefined,
        // Ajouter company_id récupéré du contexte
        company_id: selectedCompany,
      };

      console.log("Données formatées pour l'API:", formData);
      console.log("Valeur de warehouse_id:", formData.warehouse_id);
      console.log("Valeur de company_id:", formData.company_id);
      console.log("Valeur de user_id:", formData.user_id);

      // Envoyer les données à l'API
      if (state.formData.id) {
        // Mise à jour d'un achat existant
        await api.updateAchat(state.formData.id, formData);
        message.success("Achat mis à jour avec succès");
      } else {
        // Création d'un nouvel achat
        await api.createAchat(formData);
        message.success("Achat créé avec succès");
      }

      // Rafraîchir la liste des achats et fermer le formulaire
      await refreshAchats();
      handleClose(); // Utiliser handleClose au lieu de onClose
    } catch (error) {
      console.error("Erreur lors de la soumission de l'achat :", error);
      message.error(
        "Une erreur est survenue lors de l'enregistrement de l'achat"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    // Vérifier si le produit est déjà dans le panier
    const existingProductIndex = state.formData.produitsAches.findIndex(
      (p) => p.produit_id === product.id
    );

    // Récupérer la valeur actuelle du fournisseur
    const currentFournisseur = form.getFieldValue("Fournisseur_ID");

    // Déterminer la valeur à stocker dans le state
    let fournisseurValue = currentFournisseur;
    if (
      currentFournisseur &&
      typeof currentFournisseur === "object" &&
      "value" in currentFournisseur
    ) {
      fournisseurValue = currentFournisseur.value;
    }

    if (existingProductIndex !== -1) {
      // Si le produit existe déjà, augmenter la quantité
      const updatedProducts = [...state.formData.produitsAches];
      updatedProducts[existingProductIndex].quantite += 1;

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: {
          produitsAches: updatedProducts,
          Fournisseur_ID: fournisseurValue,
        },
      });
    } else {
      // Sinon, ajouter le produit au panier
      const newProduct = {
        produit_id: product.id,
        nom_produit: product.name,
        quantite: 1,
        prix_unitaire_HT: product.purchase_price || 0,
        remise: 0,
        taxe: null,
        montant_taxe: 0,
      };

      dispatch({
        type: "UPDATE_FORM_DATA",
        payload: {
          produitsAches: [...state.formData.produitsAches, newProduct],
          Fournisseur_ID: fournisseurValue,
        },
      });
    }

    // Réinitialiser la recherche
    setSearchKey((prev) => prev + 1);
  };

  return (
    <>
      <BarcodeScanner
        visible={state.showScanner}
        onClose={() => dispatch({ type: "TOGGLE_SCANNER", payload: false })}
        onScan={(barcode: string) => {
          console.log("Code-barres scanné :", barcode);
        }}
      />
      <Modal
        visible={visible}
        title={state.formData.id ? "Modifier l'achat" : "Nouvel achat"}
        onCancel={handleClose}
        width={window.innerWidth > 768 ? "90%" : "100%"}
        style={{ maxWidth: "1400px" }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          validateTrigger={["onSubmit"]}
          className="overflow-x-hidden"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="Fournisseur_ID"
                label="Fournisseur"
                rules={[
                  { required: true, message: "Sélectionnez un fournisseur" },
                ]}
              >
                <Select
                  placeholder="Sélectionner un fournisseur"
                  showSearch
                  optionFilterProp="children"
                  labelInValue
                  filterOption={(input, option: any) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(selected: any, option: any) => {
                    // selected is an object: { value, label }
                    if (!selected) {
                      console.log("Aucun fournisseur sélectionné");
                      return;
                    }

                    console.log("Fournisseur sélectionné:", selected);
                    console.log("Option complète:", option);

                    const userId = Number(selected.value);

                    if (isNaN(userId) || userId <= 0) {
                      console.error(
                        "ID de fournisseur invalide:",
                        selected.value
                      );
                      message.error("ID de fournisseur invalide");
                      return;
                    }

                    // Trouver le fournisseur complet dans la liste
                    const selectedSupplier = state.fournisseurs.find(
                      (f) => f.user_id === userId
                    );

                    console.log(
                      "Fournisseur complet trouvé:",
                      selectedSupplier
                    );

                    // Utiliser le nom du fournisseur trouvé comme étiquette si disponible
                    const supplierName = selectedSupplier
                      ? selectedSupplier.name ||
                        selectedSupplier.company_name ||
                        selectedSupplier.Nom_Raison_Sociale ||
                        selected.label
                      : selected.label;

                    form.setFieldsValue({
                      Fournisseur_ID: {
                        value: userId,
                        label: supplierName,
                      },
                    });

                    // Mettre à jour state.formData avec l'ID du fournisseur et son nom
                    dispatch({
                      type: "UPDATE_FORM_DATA",
                      payload: {
                        Fournisseur_ID: userId,
                        supplier_name: supplierName, // Stocker le nom du fournisseur pour référence
                      },
                    });

                    console.log(
                      "Fournisseur_ID (user_id) mis à jour dans state.formData:",
                      userId,
                      "Nom:",
                      supplierName
                    );
                  }}
                >
                  {state.fournisseurs
                    .filter((fournisseur: any) => {
                      // Si aucun magasin n'est sélectionné ou si le magasin est en cours de chargement, afficher tous les fournisseurs
                      if (!selectedWarehouse || !selectedWarehouse.id)
                        return true;

                      // Vérifier si le fournisseur appartient au magasin sélectionné
                      return fournisseur.warehouse_id === selectedWarehouse.id;
                    })
                    .map((fournisseur: any) => (
                      <Option
                        key={fournisseur.id}
                        value={fournisseur.user_id}
                        title={
                          fournisseur.name ||
                          fournisseur.company_name ||
                          fournisseur.Nom_Raison_Sociale
                        }
                      >
                        {fournisseur.name ||
                          fournisseur.company_name ||
                          fournisseur.Nom_Raison_Sociale ||
                          "Nom inconnu"}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="Date_Facture"
                label="Date"
                rules={[{ required: true, message: "Sélectionnez une date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="Statut_Achat"
                label="Statut d'achat"
                rules={[{ required: true, message: "Sélectionnez un statut" }]}
              >
                <Select>
                  <Option value="Commandé">Commandé</Option>
                  <Option value="Reçu">Reçu</Option>
                  <Option value="Annulé">Annulé</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Form.Item label="Rechercher un produit">
                <ProductSearch
                  key={searchKey}
                  onSelect={(product) => {
                    handleAddProduct(product);
                  }}
                  api={api}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label=" ">
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() =>
                    dispatch({ type: "TOGGLE_SCANNER", payload: true })
                  }
                >
                  Scanner un code-barres
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <div className="overflow-x-auto">
            <Table
              dataSource={state.formData.produitsAches}
              rowKey={(record: any, index) =>
                record.produit_id
                  ? record.produit_id.toString()
                  : (index ?? 0).toString()
              }
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
            >
              <Table.Column title="Produit" dataIndex="nom_produit" />
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
                    parser={(val: any) => {
                      // Assurer que la valeur est toujours un nombre
                      const parsedValue = val ? val.replace(/\D/g, "") : "0";
                      return parsedValue === "" ? "0" : parsedValue;
                    }}
                    onChange={(newValue: any) => {
                      const updatedProducts = [...state.formData.produitsAches];
                      // S'assurer que la valeur est toujours un nombre (0 par défaut si undefined ou null)
                      updatedProducts[index].prix_unitaire_HT = Number(
                        newValue || 0
                      );
                      const fournisseur = form.getFieldValue("Fournisseur_ID");
                      let fournisseurValue = fournisseur;
                      if (
                        fournisseur &&
                        typeof fournisseur === "object" &&
                        "value" in fournisseur
                      ) {
                        fournisseurValue = fournisseur.value;
                      }
                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          produitsAches: updatedProducts,
                          Fournisseur_ID: fournisseurValue,
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
                      const updatedProducts = [...state.formData.produitsAches];
                      // S'assurer que la valeur est toujours un nombre (1 par défaut si undefined ou null)
                      updatedProducts[index].quantite = Number(newValue || 1);

                      // Récupérer la valeur actuelle du fournisseur
                      const currentFournisseur =
                        form.getFieldValue("Fournisseur_ID");
                      let fournisseurValue = currentFournisseur;
                      if (
                        currentFournisseur &&
                        typeof currentFournisseur === "object" &&
                        "value" in currentFournisseur
                      ) {
                        fournisseurValue = currentFournisseur.value;
                      }

                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          produitsAches: updatedProducts,
                          // Préserver l'ID du fournisseur
                          Fournisseur_ID: fournisseurValue,
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
                    value={value}
                    addonAfter="CFA"
                    formatter={(val: any) =>
                      val !== undefined && val !== null
                        ? formatNumber(Number(val))
                        : ""
                    }
                    parser={(val: any) => {
                      // Assurer que la valeur est toujours un nombre
                      const parsedValue = val ? val.replace(/\D/g, "") : "0";
                      return parsedValue === "" ? "0" : parsedValue;
                    }}
                    onChange={(newValue: any) => {
                      const updatedProducts = [...state.formData.produitsAches];
                      // S'assurer que la valeur est toujours un nombre (0 par défaut si undefined ou null)
                      updatedProducts[index].remise = Number(newValue || 0);

                      // Récupérer la valeur actuelle du fournisseur
                      const currentFournisseur =
                        form.getFieldValue("Fournisseur_ID");
                      let fournisseurValue = currentFournisseur;
                      if (
                        currentFournisseur &&
                        typeof currentFournisseur === "object" &&
                        "value" in currentFournisseur
                      ) {
                        fournisseurValue = currentFournisseur.value;
                      }

                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          produitsAches: updatedProducts,
                          // Préserver l'ID du fournisseur
                          Fournisseur_ID: fournisseurValue,
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
                    placeholder={
                      !selectedCompany
                        ? "Sél. entreprise"
                        : state.taxes.length === 0
                        ? "Aucune taxe"
                        : "Taxe..."
                    }
                    disabled={!selectedCompany || state.taxes.length === 0}
                    onChange={(newValue: any) => {
                      const updatedProducts = [...state.formData.produitsAches];
                      updatedProducts[index].taxe = newValue;

                      // Récupérer la valeur actuelle du fournisseur
                      const currentFournisseur =
                        form.getFieldValue("Fournisseur_ID");
                      let fournisseurValue = currentFournisseur;
                      if (
                        currentFournisseur &&
                        typeof currentFournisseur === "object" &&
                        "value" in currentFournisseur
                      ) {
                        fournisseurValue = currentFournisseur.value;
                      }

                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          produitsAches: updatedProducts,
                          // Préserver l'ID du fournisseur
                          Fournisseur_ID: fournisseurValue,
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
                title="Montant taxe"
                render={(_: any, record: any) => {
                  const base = record.prix_unitaire_HT * record.quantite;
                  const tax = record.taxe
                    ? state.taxes.find((t: any) => t.id === record.taxe)
                    : null;
                  const montantTaxe = tax ? (base * tax.rate) / 100 : 0;
                  return formatNumber(montantTaxe) + " CFA";
                }}
              />
              <Table.Column
                title="Total TTC"
                render={(_: any, record: any) => {
                  const base = record.prix_unitaire_HT * record.quantite;
                  const rem = record.remise || 0;
                  const tax = record.taxe
                    ? state.taxes.find((t: any) => t.id === record.taxe)
                    : null;
                  const montantTaxe = tax ? (base * tax.rate) / 100 : 0;
                  const total = base - rem + montantTaxe;
                  return formatNumber(total) + " CFA";
                }}
              />
              <Table.Column
                title="Action"
                render={(_: any, record: any, index: number) => (
                  <Button
                    type="link"
                    danger
                    onClick={() => {
                      const updatedProducts =
                        state.formData.produitsAches.filter(
                          (_: any, i: number) => i !== index
                        );

                      // Récupérer la valeur actuelle du fournisseur
                      const currentFournisseur =
                        form.getFieldValue("Fournisseur_ID");
                      let fournisseurValue = currentFournisseur;
                      if (
                        currentFournisseur &&
                        typeof currentFournisseur === "object" &&
                        "value" in currentFournisseur
                      ) {
                        fournisseurValue = currentFournisseur.value;
                      }

                      dispatch({
                        type: "UPDATE_FORM_DATA",
                        payload: {
                          produitsAches: updatedProducts,
                          // Préserver l'ID du fournisseur
                          Fournisseur_ID: fournisseurValue,
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
            gutter={[16, 16]}
            style={{ marginTop: 16 }}
            className="bg-gray-50 p-4 rounded"
          >
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total HT"
                value={formatNumber(totalHT)}
                suffix=" CFA"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Remises"
                value={formatNumber(totalRemises)}
                suffix=" CFA"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Taxes"
                value={formatNumber(totalTaxes)}
                suffix=" CFA"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total TTC"
                value={formatNumber(totalTTC)}
                suffix=" CFA"
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Form.Item name="termes_conditions" label="Termes et conditions">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="remarques" label="Remarques">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={handleClose}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                {state.formData.id ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

/* --- Tableau principal des achats --- */
const AchatsTable: React.FC<AchatsTableProps> = ({ refreshAchats }) => {
  const context = useContext(AchatsContext);
  if (!context) {
    throw new Error("AchatsTable must be used within a AchatsContext.Provider");
  }
  const { state, dispatch, api } = context;
  const { selectedWarehouse, selectedCompany } = useSelection();
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // @ts-ignore - Context from JS file
  const { user, hasPermission } = useAuth(); // Get user object from AuthContext

  // Logging pour debugging
  useEffect(() => {
    console.log("[AchatsTable] selectedWarehouse:", selectedWarehouse);
    console.log("[AchatsTable] selectedCompany:", selectedCompany);
  }, [selectedWarehouse, selectedCompany]);

  // Nouvelle fonction pour charger les détails pour le formulaire de modification
  const loadAchatForEdit = async (record: any) => {
    try {
      setLoading(true);
      console.log(
        "Chargement des détails pour modification de l'achat ID:",
        record.id
      );

      // Récupérer les détails de l'achat
      const achatData = await api.fetchAchatDetail(String(record.id));
      console.log("Données brutes récupérées pour modification:", achatData);

      // Vérifier si les produitsAches sont déjà inclus dans la réponse
      let produitsAches = [];

      if (achatData.produitsAches && achatData.produitsAches.length > 0) {
        console.log(
          "Produits achetés trouvés dans la réponse de l'API:",
          achatData.produitsAches
        );

        // Mapper les éléments de l'achat au format attendu par le formulaire
        produitsAches = achatData.produitsAches.map((item: any) => ({
          produit_id: item.product_id,
          nom_produit:
            item.product_name ||
            state.produits.find((p) => p.id === Number(item.product_id))
              ?.name ||
            "Produit " + item.product_id,
          quantite: Number(item.quantity) || 0,
          prix_unitaire_HT: Number(item.unit_price) || 0,
          remise: Number(item.discount_rate) || 0,
          taxe: item.tax_id,
          montant_taxe: Number(item.total_tax) || 0,
        }));
      } else {
        // Si les produitsAches ne sont pas inclus, récupérer les éléments de l'achat séparément
        const orderItems = await api.fetchOrderItems(record.id);
        console.log(
          "Éléments de l'achat récupérés pour modification:",
          orderItems
        );

        if (orderItems && orderItems.length > 0) {
          // Mapper les éléments de l'achat au format attendu par le formulaire
          produitsAches = orderItems.map((item: any) => ({
            produit_id: item.product_id,
            nom_produit:
              item.product_name ||
              state.produits.find((p) => p.id === Number(item.product_id))
                ?.name ||
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
      const formattedData: AchatFormData = {
        id: achatData.id,
        Date_Facture: achatData.order_date || dayjs().format("YYYY-MM-DD"),
        Statut_Achat: achatData.order_status || "Commandé",
        Fournisseur_ID: achatData.user_id,
        warehouse_id: achatData.warehouse_id,
        remise_globale: achatData.discount || 0,
        termes_conditions: achatData.terms_condition || "",
        remarques: achatData.notes || "",
        paid_amount: achatData.paid_amount || 0,
        supplier_name: achatData.supplier_name,
        produitsAches: produitsAches,
      };

      console.log("Données formatées pour le formulaire:", formattedData);

      // Trouver le fournisseur correspondant pour obtenir son nom
      const selectedSupplier = state.fournisseurs.find(
        (f) => f.user_id === achatData.user_id
      );

      if (selectedSupplier) {
        const supplierName =
          selectedSupplier.name ||
          selectedSupplier.company_name ||
          selectedSupplier.Nom_Raison_Sociale ||
          achatData.supplier_name ||
          "Fournisseur " + achatData.user_id;

        // Mettre à jour le nom du fournisseur dans les données formatées
        formattedData.supplier_name = supplierName;

        console.log("Fournisseur trouvé pour l'achat:", {
          id: achatData.user_id,
          name: supplierName,
          supplier: selectedSupplier,
        });
      } else {
        console.warn("Fournisseur non trouvé pour l'ID:", achatData.user_id);
      }

      if (formattedData.produitsAches.length === 0) {
        message.warning(
          "Aucun produit trouvé dans cet achat. Veuillez vérifier dans la base de données si la table order_items contient des entrées pour cet achat (ID: " +
            record.id +
            ")."
        );
      }

      // Mettre à jour l'état avec les données du formulaire et ouvrir le formulaire
      dispatch({ type: "SET_FORM_DATA", payload: formattedData });
      dispatch({ type: "TOGGLE_FORM", payload: true });
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails de l'achat pour modification:",
        error
      );
      message.error("Erreur lors du chargement des détails de l'achat");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les détails spécifiquement pour le modal de détail
  const loadAchatDetailsForModal = async (record: any) => {
    try {
      setLoading(true);
      console.log(
        "Chargement des détails pour le modal - achat ID:",
        record.id
      );

      // Récupérer les détails COMPLETS de l'achat (incluant items et payments)
      const achatDetail = await api.fetchAchatDetail(record.id);
      console.log(
        "Détails de l'achat récupérés (api.fetchAchatDetail):",
        achatDetail
      );

      // Créer une copie de l'enregistrement pour le mettre à jour
      const updatedRecord = { ...record }; // Start with base record info

      // --- Gestion des Paiements ---
      if (achatDetail.payments && Array.isArray(achatDetail.payments)) {
        console.log(
          "Paiements trouvés directement dans achatDetail:",
          achatDetail.payments.length
        );
        updatedRecord.payments = achatDetail.payments;
      } else {
        console.warn(
          `Aucun paiement trouvé dans achatDetail pour la commande ${record.id}. L'API /api/orders/:id devrait idéalement retourner les paiements.`
        );
        // Tentative de chargement séparé (fallback, peut être retiré si l'API /api/orders/:id est fiable)
        try {
          const response = await fetch(
            `${BASE_URL}/api/orders/${record.id}/payments` // Ensure this endpoint exists and works
          );
          if (!response.ok) {
            throw new Error(
              `Erreur ${response.status}: ${response.statusText}`
            );
          }
          const payments = await response.json();
          console.log(
            `Paiements chargés séparément: ${payments.length} trouvés`
          );
          updatedRecord.payments = payments || []; // Ensure it's an array
        } catch (error) {
          console.error(
            "Erreur lors du chargement séparé des paiements:",
            error
          );
          updatedRecord.payments = []; // Set empty array on error
          message.error("Erreur lors du chargement des paiements associés.");
        }
      }

      // --- Gestion des Produits/Items ---
      let orderItemsData = [];
      // Prioriser achatDetail.items
      if (
        achatDetail.items &&
        Array.isArray(achatDetail.items) &&
        achatDetail.items.length > 0
      ) {
        console.log(
          "Items trouvés directement dans achatDetail:",
          achatDetail.items.length
        );
        // Mapper pour assurer la présence de product_name si possible
        orderItemsData = achatDetail.items.map((item: any) => ({
          ...item, // Keep original item data
          product_name:
            item.product_name || // Use name from backend if available
            state.produits.find((p) => p.id === Number(item.product_id))
              ?.name || // Fallback to global list
            `Produit ${item.product_id}`, // Final fallback
        }));
      }
      // Fallback: Vérifier achatDetail.produitsAches (ancienne structure?)
      else if (
        achatDetail.produitsAches &&
        Array.isArray(achatDetail.produitsAches) &&
        achatDetail.produitsAches.length > 0
      ) {
        console.warn(
          "Utilisation de 'produitsAches' trouvé dans achatDetail (préférer 'items'):",
          achatDetail.produitsAches.length
        );
        orderItemsData = achatDetail.produitsAches.map((item: any) => ({
          ...item,
          // Ensure standard fields expected by the modal table
          product_id: item.product_id || item.produit_id,
          quantity: item.quantity || item.quantite,
          unit_price: item.unit_price || item.prix_unitaire_HT,
          discount_rate: item.discount_rate || item.remise || 0,
          tax_id: item.tax_id || item.taxe,
          subtotal: item.subtotal, // Assuming subtotal is present
          product_name:
            item.product_name ||
            item.nom_produit ||
            state.produits.find(
              (p) => p.id === Number(item.product_id || item.produit_id)
            )?.name ||
            `Produit ${item.product_id || item.produit_id}`,
        }));
      }
      // Fallback: Appeler api.fetchOrderItems si ni items ni produitsAches ne sont présents
      else {
        console.warn(
          `Aucun item/produit trouvé dans achatDetail pour la commande ${record.id}. Tentative de récupération via api.fetchOrderItems.`
        );
        try {
          const fetchedItems = await api.fetchOrderItems(record.id);
          console.log(
            "Éléments de l'achat récupérés via api.fetchOrderItems:",
            fetchedItems
          );

          if (
            fetchedItems &&
            Array.isArray(fetchedItems) &&
            fetchedItems.length > 0
          ) {
            // Mapper les éléments au format attendu, ajoutant product_name
            orderItemsData = fetchedItems.map((item: any) => ({
              ...item, // Keep original item data
              product_name:
                item.product_name || // Use name from backend if available
                state.produits.find((p) => p.id === Number(item.product_id))
                  ?.name || // Fallback to global list
                `Produit ${item.product_id}`, // Final fallback
            }));
          } else {
            console.warn(
              "Aucun produit trouvé pour l'achat ID (modal) via api.fetchOrderItems:",
              record.id
            );
            message.warning(
              `Aucun produit trouvé pour l'achat #${record.invoice_number}`
            );
          }
        } catch (fetchError) {
          console.error(
            "Erreur lors de la récupération des items via api.fetchOrderItems:",
            fetchError
          );
          message.error(
            `Erreur lors du chargement des produits pour l'achat #${record.invoice_number}`
          );
        }
      }

      console.log("Items formatés pour le modal:", orderItemsData);

      // Mettre à jour l'enregistrement avec les items et paiements
      updatedRecord.items = orderItemsData; // Utiliser la clé 'items'
      // updatedRecord.produitsAches = orderItemsData; // Peut être retiré si 'produitsAches' n'est plus utilisé

      // Mettre à jour l'état du détail de la commande pour le modal
      setDetailOrder(updatedRecord);

      return updatedRecord;
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails de l'achat pour le modal:",
        error
      );
      message.error("Erreur lors du chargement des détails de l'achat");
      setDetailOrder(null); // Clear order on error
      return null;
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Numéro de saisi",
      dataIndex: "invoice_number",
      key: "invoice_number",
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
      defaultSortOrder: "descend" as const, // Tri par défaut décroissant avec le type correct
    },
    {
      title: "Fournisseur",
      key: "fournisseur",
      render: (_: any, record: any): React.ReactNode => {
        // Ajouter des logs pour déboguer
        // if (record.user_id) {
        //   console.log(
        //     `Recherche du fournisseur avec ID=${record.user_id} pour la ligne ${record.invoice_number}`
        //   );
        // }

        // Vérifier si la liste des fournisseurs est disponible
        if (!state.fournisseurs || state.fournisseurs.length === 0) {
          // console.log("Liste des fournisseurs vide ou non disponible");
          return "Chargement...";
        }

        // Vérifier si l'ID du fournisseur est disponible
        if (!record.user_id) {
          // console.log(
          //   `ID du fournisseur non disponible pour la ligne ${record.invoice_number}`
          // );
          return "Non spécifié";
        }

        // Tenter de trouver le fournisseur avec l'ID exact
        const supplier = state.fournisseurs.find(
          (f: any) => Number(f.id) === Number(record.user_id)
        );

        if (supplier) {
          // Utiliser le nom disponible dans la structure
          const supplierName =
            supplier.name ||
            supplier.company_name ||
            supplier.Nom_Raison_Sociale;
          return supplierName || "Nom inconnu";
        } else {
          // Si pas trouvé, essayer de chercher par d'autres attributs possibles
          const alternativeSupplier = state.fournisseurs.find(
            (f: any) =>
              (f.ID_Frs && Number(f.ID_Frs) === Number(record.user_id)) ||
              (f.user_id && Number(f.user_id) === Number(record.user_id))
          );

          if (alternativeSupplier) {
            const supplierName =
              alternativeSupplier.name ||
              alternativeSupplier.company_name ||
              alternativeSupplier.Nom_Raison_Sociale;
            return supplierName || "Nom inconnu";
          }

          // Si le fournisseur n'est pas trouvé, essayer d'utiliser les informations disponibles dans l'achat
          if (record.supplier_name || record.user_name || record.entity_name) {
            return (
              record.supplier_name || record.user_name || record.entity_name
            );
          }

          // Log détaillé pour aider au débogage
          console.log(
            `Fournisseur avec ID=${record.user_id} non trouvé pour la ligne ${record.invoice_number}`
          );
          console.log(
            "IDs disponibles:",
            state.fournisseurs.map((f: any) => f.id)
          );

          return "Inconnu";
        }
      },
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
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
    },
    {
      title: "Montant payé",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (amount: number) => `${formatNumber(amount || 0)} CFA`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `${formatNumber(total)} CFA`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="small">
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.Achat.view"
          ) && (
            <Button
              icon={<EyeOutlined />}
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const fullDetail = await loadAchatDetailsForModal(record);
                  if (fullDetail) {
                    setDetailOrder(fullDetail);
                    setShowDetailModal(true);
                  }
                } catch (err) {
                  console.error("Erreur lors du chargement du détail:", err);
                  message.error(
                    "Impossible de charger le détail de cet achat."
                  );
                } finally {
                  setLoading(false);
                }
              }}
            />
          )}
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.Achat.edit"
          ) && (
            <Button
              icon={<EditOutlined />}
              onClick={async () => {
                // Vérifier si l'achat a déjà des paiements
                if (record.paid_amount > 0) {
                  Modal.warning({
                    title: "Modification impossible",
                    content:
                      "Cet achat a déjà des paiements enregistrés. Il n'est pas possible de le modifier.",
                  });
                  return;
                }

                // Utiliser la nouvelle fonction pour charger les détails pour modification
                loadAchatForEdit(record);
              }}
              disabled={record.is_deleted === 1 || record.paid_amount > 0}
            />
          )}
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.Achat.delete"
          ) && (
            <>
              {record.is_deleted === 1 ? (
                <Button
                  type="primary"
                  onClick={() =>
                    Modal.confirm({
                      title: "Confirmation",
                      content: "Voulez-vous restaurer cet achat ?",
                      onOk: async () => {
                        try {
                          await api.restoreAchat(record.id);
                          await refreshAchats();
                          message.success("Achat restauré avec succès");
                        } catch (error) {
                          message.error("Erreur lors de la restauration");
                        }
                      },
                    })
                  }
                >
                  Restaurer
                </Button>
              ) : record.paid_amount > 0 ? (
                <Button
                  danger
                  onClick={() =>
                    Modal.confirm({
                      title: "Confirmation",
                      content:
                        "Cet achat contient des paiements. Voulez-vous l'annuler ?",
                      onOk: async () => {
                        try {
                          await api.cancelAchat(record.id);
                          await refreshAchats();
                          message.success("Achat annulé avec succès");
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
                <Button
                  danger
                  disabled={record.is_deletable === 0}
                  onClick={() => {
                    if (record.is_deletable === 0) {
                      message.error(
                        "Cette commande ne peut pas être supprimée"
                      );
                      return;
                    }
                    Modal.confirm({
                      title: "Confirmation",
                      content: "Voulez-vous vraiment supprimer cet achat ?",
                      onOk: async () => {
                        try {
                          await api.deleteAchat(record.id);
                          dispatch({
                            type: "DELETE_ACHAT",
                            payload: record.id,
                          });
                          message.success("Achat supprimé avec succès");
                        } catch (error) {
                          message.error("Erreur lors de la suppression");
                        }
                      },
                    });
                  }}
                >
                  Supprimer
                </Button>
              )}
            </>
          )}
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.info("Téléchargement en cours...")}
          />
        </Space>
      ),
    },
  ];

  const expandable = {
    expandedRowRender: (record: any) => {
      // Render the new component, passing the order ID
      return <ExpandedRowContent orderId={record.id} />;
    },
    onExpand: (expanded: boolean, record: any) => {
      // Only manage the expanded row keys state here
      if (expanded) {
        setExpandedRowKeys((prev) => [...prev, record.id]);
        // REMOVED: loadAchatDetails(record);
      } else {
        setExpandedRowKeys((prev) => prev.filter((key) => key !== record.id));
      }
    },
    expandedRowKeys,
  };

  const handleTabChange = (activeKey: string) => {
    console.log("Tab changed to:", activeKey);
    dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey });
  };

  // Ajout d'un useEffect pour déboguer le mappage entre les achats et les fournisseurs
  useEffect(() => {
    if (state.achats.length > 0 && state.fournisseurs.length > 0) {
      console.log("Débogage mappage achats-fournisseurs:");
      console.log("Nombre d'achats:", state.achats.length);
      console.log("Nombre de fournisseurs:", state.fournisseurs.length);

      // Analyser les IDs des fournisseurs présents dans les achats
      const supplierIdsInOrders = new Set(
        state.achats.map((achat) => achat.user_id).filter(Boolean)
      );
      console.log(
        "IDs de fournisseurs présents dans les achats:",
        Array.from(supplierIdsInOrders)
      );

      // Analyser les IDs disponibles dans la liste des fournisseurs
      const availableSupplierIds = new Set(
        state.fournisseurs.map((f: any) => f.id)
      );
      console.log(
        "IDs disponibles dans la liste des fournisseurs:",
        Array.from(availableSupplierIds)
      );

      // Trouver les IDs qui sont dans les achats mais pas dans la liste des fournisseurs
      const missingSupplierIds = Array.from(supplierIdsInOrders).filter(
        (id) => !availableSupplierIds.has(id)
      );
      if (missingSupplierIds.length > 0) {
        console.log("IDs de fournisseurs manquants:", missingSupplierIds);
      } else {
        console.log(
          "Tous les IDs de fournisseurs sont disponibles dans la liste des fournisseurs"
        );
      }
    }
  }, [state.achats, state.fournisseurs]);

  const fetchAchats = useCallback(() => {
    // ... existing code ...
  }, []);

  if (state.loading) return <Spin size="large" />;
  if (state.error) return <div>{state.error}</div>;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type={state.showDeleted ? "primary" : "default"}
          onClick={() => {
            dispatch({
              type: "TOGGLE_SHOW_DELETED",
              payload: !state.showDeleted,
            });
          }}
        >
          {state.showDeleted
            ? "Masquer les commandes supprimées"
            : "Afficher les commandes supprimées"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table
          dataSource={state.achats}
          columns={columns}
          rowKey="id"
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
              `${range[0]}-${range[1]} sur ${total} achats`,
            pageSizeOptions: ["10", "20", "50", "100"],
            position: ["bottomRight"],
            responsive: true,
          }}
          sortDirections={["descend", "ascend"]}
          scroll={{ x: "max-content" }}
        />
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailOrder(null);
          }}
          produits={state.produits}
          taxes={state.taxes}
          fournisseurs={state.fournisseurs}
          refreshOrderDetails={(orderId) =>
            loadAchatDetailsForModal({ id: orderId })
          }
          refreshAchats={refreshAchats}
        />
      )}
    </>
  );
};

// Internal component to fetch and display expanded row details
const ExpandedRowContent: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const { state: globalState, api } = useContext(AchatsContext)!; // Assuming context is always available here

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        console.log(
          `[ExpandedRowContent] Fetching details for order ${orderId}`
        );
        // Use fetchAchatDetail as it includes items and potentially product names
        const achatDetail = await api.fetchAchatDetail(orderId);
        console.log(
          `[ExpandedRowContent] Details received for ${orderId}:`,
          achatDetail
        );

        let fetchedItems = [];
        if (
          achatDetail &&
          achatDetail.items &&
          Array.isArray(achatDetail.items)
        ) {
          fetchedItems = achatDetail.items.map((item: any) => ({
            ...item, // Spread original item data
            id: item.id || `${orderId}-${item.product_id}`, // Ensure a unique key
            product_id: item.product_id,
            nom_produit:
              item.product_name || // Use name from backend if available
              globalState.produits.find((p) => p.id === Number(item.product_id))
                ?.name || // Fallback to global product list
              "Produit inconnu", // Final fallback
            quantite: item.quantity,
            unit_price: item.unit_price,
            discount_rate: item.discount_rate || 0,
            tax_id: item.tax_id,
            subtotal: item.subtotal,
          }));
          console.log(
            `[ExpandedRowContent] Mapped items for ${orderId}:`,
            fetchedItems
          );
        } else {
          console.warn(
            `[ExpandedRowContent] No items found in achatDetail for order ${orderId}`
          );
        }
        setItems(fetchedItems);
      } catch (error) {
        console.error(
          `[ExpandedRowContent] Error fetching details for order ${orderId}:`,
          error
        );
        message.error(`Erreur chargement détails achat ${orderId}`);
        setItems([]); // Ensure items is an empty array on error
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [orderId, api, globalState.produits]);

  const detailColumns = [
    {
      title: "Produit",
      dataIndex: "nom_produit", // Use the pre-calculated nom_produit
      key: "produit",
      render: (text: string): string => text || "Produit inconnu",
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
        const tax = globalState.taxes.find((t: any) => t.id === tax_id);
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

  if (loadingDetails) {
    return (
      <div style={{ padding: "10px", textAlign: "center" }}>
        <Spin /> Chargement des détails...
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "10px", textAlign: "center", color: "grey" }}>
        Aucun produit trouvé pour cet achat.
      </div>
    );
  }

  return (
    <Table
      dataSource={items}
      columns={detailColumns}
      pagination={false}
      bordered
      size="small"
      rowKey={(item: any) => item.id} // Use the generated unique key
    />
  );
};

/* --- Composant principal GestionAchat --- */
const GestionAchat: React.FC = () => {
  // Utiliser le reducer importé depuis le module store/reducer
  const [state, dispatch] = useReducer(achatsReducer, initialState);
  const { selectedWarehouse, selectedCompany } = useSelection();
  const { taxes } = useTaxes(api, { companyId: selectedCompany });
  // Remplacer currentWarehouse par currentWarehouseId
  // const [currentWarehouse, setCurrentWarehouse] = useState<any>(null);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<number | null>(
    null
  );
  // @ts-ignore - Context from JS file
  const { user, hasPermission, refreshUserPermissions } = useAuth(); // Get user object from AuthContext

  useEffect(() => {
    console.log("Taxes chargées depuis useTaxes :", taxes);
    console.log("Entreprise sélectionnée pour les taxes :", selectedCompany);
    dispatch({ type: "SET_TAXES", payload: taxes });
  }, [taxes, selectedCompany]);

  // Gérer le changement de magasin sélectionné
  useEffect(() => {
    console.log(
      "Nouvelle valeur de selectedWarehouse détectée:",
      selectedWarehouse
    );
    // Extraire l'ID
    const selectedId = selectedWarehouse?.id || selectedWarehouse;
    const currentId = currentWarehouseId;

    // Comparer les IDs pour éviter les boucles infinies
    if (String(selectedId) !== String(currentId)) {
      console.log("Mise à jour de l'ID du magasin courant:", selectedId);
      setCurrentWarehouseId(selectedId ? Number(selectedId) : null);
      // Réinitialiser la page à 1 pour montrer les nouveaux résultats depuis le début
      dispatch({ type: "SET_PAGE", payload: 1 });
    }
  }, [selectedWarehouse, currentWarehouseId]); // Depend on selectedWarehouse and the ID state

  // Appel initial de refreshAchats au montage du composant - seulement si un magasin est sélectionné
  useEffect(() => {
    console.log("Montage initial du composant GestionAchat");
    // refreshAchats sera appelé automatiquement par l'effet de dépendance ci-dessous
    // quand currentWarehouseId sera disponible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAchats = useCallback(async () => {
    // Ne pas faire d'appel API si aucun magasin n'est sélectionné
    if (!currentWarehouseId) {
      console.log("Aucun magasin sélectionné, aucun appel API pour les achats");
      dispatch({ type: "SET_LOADING", payload: false });
      dispatch({
        type: "SET_ACHATS",
        payload: { achats: [], total: 0 },
      });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Préparer les paramètres de requête
      const params: any = {
        page: state.currentPage,
        limit: state.itemsPerPage,
        invoice_number: state.searchTerm,
        include_deleted: state.showDeleted ? "true" : "false",
        order_type: "purchase",
      };

      // Vérifier et ajouter company_id aux paramètres
      if (selectedCompany) {
        params.company_id = selectedCompany;
        console.log(`Filtrage par entreprise ID=${selectedCompany} dans l'API`);
      } else {
        console.warn(
          "Attention: Aucune entreprise sélectionnée pour le filtrage des achats"
        );
      }

      // Traitement explicite du paramètre warehouse
      if (currentWarehouseId) {
        // Si currentWarehouse est un objet avec un id
        if (
          typeof currentWarehouseId === "number" ||
          typeof currentWarehouseId === "string"
        ) {
          params.warehouse = currentWarehouseId;
          console.log(
            `Filtrage par magasin ID=${currentWarehouseId} (valeur directe) dans l'API`
          );
        }
      }

      console.log("Rafraîchissement des achats avec les paramètres:", params);

      // Ajouter le filtre de fournisseur s'il est sélectionné
      if (state.selectedFournisseur) {
        // 1. Récupérer le fournisseur sélectionné
        const selectedSupplier = state.selectedFournisseur;

        // 2. Déterminer l'ID à utiliser (préférer USER_ID s'il existe)
        let userIdToUse =
          selectedSupplier.USER_ID ||
          selectedSupplier.user_id ||
          selectedSupplier.id;

        // 3. Afficher des logs pour le débogage
        console.log(`Fournisseur sélectionné dans le filtre:`, {
          id: selectedSupplier.id,
          userId: selectedSupplier.USER_ID || selectedSupplier.user_id,
          name:
            selectedSupplier.name ||
            selectedSupplier.company_name ||
            selectedSupplier.Nom_Raison_Sociale,
        });

        console.log(
          `Filtrage par fournisseur - ID utilisé: ${userIdToUse} (${
            selectedSupplier.name ||
            selectedSupplier.company_name ||
            selectedSupplier.Nom_Raison_Sociale
          })`
        );

        // 4. Utiliser l'ID approprié pour le filtrage
        params.fournisseur = userIdToUse;
      }

      // Ajouter les filtres de date s'ils sont spécifiés
      if (state.dateRange.start) {
        params.dateDebut = state.dateRange.start;
      }
      if (state.dateRange.end) {
        params.dateFin = state.dateRange.end;
      }

      // Ajouter le filtre de statut de paiement en fonction de l'onglet actif
      if (state.activeTab === "unpaid") {
        params.payment_status = "Non payé";
        console.log("Filtrage par statut: Non payé");
      } else if (state.activeTab === "partially_paid") {
        params.payment_status = "Partiellement payé";
        console.log("Filtrage par statut: Partiellement payé");
      } else if (state.activeTab === "paid") {
        params.payment_status = "Payé";
        console.log("Filtrage par statut: Payé");
      } else {
        console.log("Aucun filtrage par statut (tous les achats)");
      }

      const response = await api.fetchAchats(params);

      console.log("Réponse de l'API:", response);

      // Si le filtrage côté serveur ne fonctionne pas, filtrer côté client
      let filteredData = response.data;

      if (state.activeTab !== "all" && Array.isArray(filteredData)) {
        console.log("Filtrage côté client pour", state.activeTab);

        if (state.activeTab === "unpaid") {
          filteredData = filteredData.filter(
            (achat) =>
              achat.payment_status === "Non payé" ||
              achat.due_amount === achat.total ||
              achat.paid_amount === 0
          );
          console.log("Achats non payés après filtrage:", filteredData.length);
        } else if (state.activeTab === "partially_paid") {
          filteredData = filteredData.filter(
            (achat) =>
              achat.payment_status === "Partiellement payé" ||
              (achat.paid_amount > 0 && achat.paid_amount < achat.total)
          );
          console.log(
            "Achats partiellement payés après filtrage:",
            filteredData.length
          );
        } else if (state.activeTab === "paid") {
          filteredData = filteredData.filter(
            (achat) =>
              achat.payment_status === "Payé" ||
              achat.paid_amount >= achat.total ||
              achat.due_amount === 0
          );
          console.log("Achats payés après filtrage:", filteredData.length);
        }
      }

      // Trier les achats du plus récent au plus ancien
      if (Array.isArray(filteredData)) {
        filteredData.sort((a, b) => {
          // Trier d'abord par date de création (si disponible)
          if (a.created_at && b.created_at) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
          // Sinon, trier par date de commande
          return (
            new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
          );
        });
        console.log("Achats triés du plus récent au plus ancien");
      }

      dispatch({
        type: "SET_ACHATS",
        payload: { achats: filteredData, total: response.total },
      });
    } catch (error) {
      console.error("Erreur lors du chargement des achats:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur lors du chargement des achats: ${error.message}`
          : "Erreur lors du chargement des achats";

      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });

      message.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.currentPage,
    state.itemsPerPage,
    state.searchTerm,
    state.selectedFournisseur,
    // Décomposer dateRange pour la stabilité
    // state.dateRange,
    state.dateRange.start,
    state.dateRange.end,
    currentWarehouseId, // Utiliser l'ID
    state.showDeleted,
    state.activeTab,
    selectedCompany, // Ajouter selectedCompany aux dépendances
    api,
    dispatch,
  ]);

  useEffect(() => {
    console.log(
      "Déclenchement du refreshAchats avec activeTab:",
      state.activeTab
    );
    refreshAchats();
  }, [
    state.searchTerm,
    state.selectedFournisseur,
    // Décomposer dateRange pour la stabilité
    // state.dateRange,
    state.dateRange.start,
    state.dateRange.end,
    state.currentPage,
    state.itemsPerPage,
    state.showDeleted,
    state.activeTab,
    currentWarehouseId, // Utiliser l'ID
    selectedCompany, // Ajouter selectedCompany aux dépendances
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      // Si aucun magasin n'est sélectionné, réinitialiser les données
      if (!currentWarehouseId) {
        console.log("Aucun magasin sélectionné, réinitialisation des données");
        dispatch({ type: "SET_FOURNISSEURS", payload: [] });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        // Passer le magasin sélectionné à fetchFournisseurs
        console.log(
          "loadInitialData - currentWarehouseId:",
          currentWarehouseId
        );

        const [fournisseursResponse, produitsResponse] = await Promise.all([
          api.fetchFournisseurs(currentWarehouseId || undefined),
          api.fetchProduits(),
        ]);
        dispatch({ type: "SET_FOURNISSEURS", payload: fournisseursResponse });
        dispatch({ type: "SET_PRODUITS", payload: produitsResponse.data });
      } catch (error) {
        console.error("Erreur chargement initial:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Erreur lors du chargement des données",
        });
        message.error("Erreur lors du chargement des données");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    loadInitialData();
  }, [currentWarehouseId]); // Utiliser currentWarehouseId au lieu de currentWarehouse

  const openAchatForm = () => {
    if (!currentWarehouseId) {
      Modal.warning({
        title: "Magasin non sélectionné",
        content:
          "Veuillez sélectionner un magasin avant de créer ou modifier un achat.",
      });
      return;
    }
    // Synchroniser warehouse_id dans le state.formData
    dispatch({
      type: "UPDATE_FORM_DATA",
      payload: { warehouse_id: currentWarehouseId },
    });
    dispatch({ type: "TOGGLE_FORM", payload: true });
  };

  // Fonction pour exporter les données vers Excel
  const handleExportToExcel = async () => {
    try {
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });

      // Préparer les paramètres de requête en tenant compte des filtres actuels
      const params: any = {
        page: 1,
        limit: 1000, // Augmenter la limite pour exporter plus de données
        order_type: "purchase",
        invoice_number: state.searchTerm,
        include_deleted: state.showDeleted ? "true" : "false",
      };

      // Ajouter les filtres actuels
      if (state.selectedFournisseur) {
        // Déterminer l'ID à utiliser (préférer USER_ID s'il existe)
        const selectedSupplier = state.selectedFournisseur;
        let userIdToUse =
          selectedSupplier.USER_ID ||
          selectedSupplier.user_id ||
          selectedSupplier.id;
        params.fournisseur = userIdToUse;
      }

      if (state.dateRange.start) {
        params.dateDebut = state.dateRange.start;
      }
      if (state.dateRange.end) {
        params.dateFin = state.dateRange.end;
      }

      if (selectedCompany) {
        params.company_id = selectedCompany;
      }

      if (currentWarehouseId) {
        if (
          typeof currentWarehouseId === "number" ||
          typeof currentWarehouseId === "string"
        ) {
          params.warehouse = currentWarehouseId;
        }
      }

      // Ajouter le filtre de statut de paiement en fonction de l'onglet actif
      if (state.activeTab === "unpaid") {
        params.payment_status = "Non payé";
      } else if (state.activeTab === "partially_paid") {
        params.payment_status = "Partiellement payé";
      } else if (state.activeTab === "paid") {
        params.payment_status = "Payé";
      }

      // Récupérer les données
      const response = await api.fetchAchats(params);
      console.log("Données récupérées pour l'export Excel:", response);

      // Formater les données pour l'export
      const dataToExport = response.data.map((achat: any) => {
        // Rechercher le nom du fournisseur dans la liste
        const fournisseur = state.fournisseurs.find(
          (f: any) =>
            Number(f.id) === Number(achat.user_id) ||
            Number(f.user_id) === Number(achat.user_id)
        );

        const fournisseurName = fournisseur
          ? fournisseur.name ||
            fournisseur.company_name ||
            fournisseur.Nom_Raison_Sociale
          : achat.supplier_name || achat.user_name || "Inconnu";

        return {
          ID: achat.id,
          "№ Facture": achat.invoice_number,
          Référence: achat.reference || "-",
          Date: dayjs(achat.order_date).format("DD/MM/YYYY"),
          Fournisseur: fournisseurName,
          Magasin: achat.warehouse_name,
          "Statut d'achat": achat.order_status,
          "Statut de paiement": achat.payment_status,
          "Montant payé": achat.paid_amount,
          "Montant dû": achat.due_amount,
          Total: achat.total,
          "Créé le": achat.created_at
            ? dayjs(achat.created_at).format("DD/MM/YYYY")
            : "-",
        };
      });

      // Créer le fichier Excel
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Achats");

      // Définir les largeurs des colonnes
      const columnWidths = [
        { wch: 8 }, // ID
        { wch: 15 }, // № Facture
        { wch: 15 }, // Référence
        { wch: 12 }, // Date
        { wch: 30 }, // Fournisseur
        { wch: 20 }, // Magasin
        { wch: 15 }, // Statut d'achat
        { wch: 20 }, // Statut de paiement
        { wch: 15 }, // Montant payé
        { wch: 15 }, // Montant dû
        { wch: 15 }, // Total
        { wch: 12 }, // Créé le
      ];
      worksheet["!cols"] = columnWidths;

      // Télécharger le fichier
      const today = dayjs().format("YYYY-MM-DD");
      XLSX.writeFile(workbook, `Achats_${today}.xlsx`);

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

  // Après la création d'un achat, rafraîchir les permissions
  const handleCreateAchat = async (values: any) => {
    try {
      await api.createAchat(values);
      message.success("Achat créé avec succès");
      refreshUserPermissions(); // Rafraîchir les permissions après création
      await refreshAchats();
    } catch (error) {
      message.error("Erreur lors de la création de l'achat");
    }
  };

  // Après la mise à jour d'un achat, rafraîchir les permissions
  const handleUpdateAchat = async (id: number, values: any) => {
    try {
      await api.updateAchat(id, values);
      message.success("Achat mis à jour avec succès");
      refreshUserPermissions(); // Rafraîchir les permissions après mise à jour
      await refreshAchats();
    } catch (error) {
      message.error("Erreur lors de la mise à jour de l'achat");
    }
  };

  // Après la suppression d'un achat, rafraîchir les permissions
  const handleDeleteAchat = async (id: number) => {
    try {
      await api.deleteAchat(id);
      message.success("Achat supprimé avec succès");
      refreshUserPermissions(); // Rafraîchir les permissions après suppression
      await refreshAchats();
    } catch (error) {
      message.error("Erreur lors de la suppression de l'achat");
    }
  };

  return (
    <AchatsContext.Provider value={{ state, dispatch, api }}>
      <Layout>
        <Layout.Content style={{ padding: "24px" }}>
          {/* Rendu conditionnel si aucun magasin n'est sélectionné */}
          {!currentWarehouseId ? (
            <Card className="p-sm md:p-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md">
                <Typography.Title
                  level={3}
                  className="!mb-0 text-xl md:text-2xl"
                >
                  Gestion des achats
                </Typography.Title>
              </div>

              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Empty
                  image={
                    <ExclamationCircleOutlined
                      style={{ fontSize: 64, color: "#faad14" }}
                    />
                  }
                  description={
                    <div>
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          marginBottom: 8,
                        }}
                      >
                        Aucun magasin sélectionné
                      </h3>
                      <p style={{ color: "#666", marginBottom: 16 }}>
                        Veuillez sélectionner un magasin dans la barre de
                        navigation pour créer et gérer les achats.
                      </p>
                      <Alert
                        message="Information importante"
                        description="Les achats sont organisés par magasin. Chaque magasin dispose de ses propres fournisseurs, produits et historique d'achats. La sélection d'un magasin est nécessaire pour accéder aux fonctionnalités d'achat."
                        type="info"
                        showIcon
                        style={{
                          textAlign: "left",
                          maxWidth: 500,
                          margin: "0 auto",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </Card>
          ) : (
            <>
              {/* Bouton Nouvel achat */}
              <Row justify="start" style={{ marginBottom: 16 }}>
                <Col>
                  {hasPermission(
                    "Gestion Commerciale.Approvisionnement.Achats.Achat.create"
                  ) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAchatForm}
                      disabled={!currentWarehouseId}
                      title={
                        !currentWarehouseId
                          ? "Veuillez sélectionner un magasin"
                          : ""
                      }
                    >
                      Nouvel achat
                    </Button>
                  )}
                </Col>
              </Row>

              {/* Filtres de recherche */}
              <Row
                gutter={[16, 16]}
                justify="end"
                style={{ marginBottom: 16 }}
                className="flex-wrap"
              >
                <Col
                  xs={24}
                  sm={24}
                  md={24}
                  lg={24}
                  xl={24}
                  className="flex flex-wrap gap-2"
                >
                  <Input
                    placeholder="Rechercher par numéro..."
                    prefix={<SearchOutlined />}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_SEARCH",
                        payload: e.target.value.trim(),
                      })
                    }
                    style={{ width: 200, marginBottom: 8 }}
                  />
                  <Select
                    placeholder="Fournisseur"
                    style={{ width: 200, marginBottom: 8 }}
                    allowClear
                    onChange={(value: any) => {
                      if (value) {
                        const selectedFournisseur = state.fournisseurs.find(
                          (f: any) => f.id === value
                        );
                        if (selectedFournisseur) {
                          console.log(
                            "Fournisseur sélectionné pour le filtre:",
                            selectedFournisseur
                          );
                          console.log(
                            "ID du fournisseur:",
                            selectedFournisseur.id
                          );
                          console.log(
                            "USER_ID du fournisseur:",
                            selectedFournisseur.USER_ID
                          );
                          console.log(
                            "Nom du fournisseur:",
                            selectedFournisseur.name ||
                              selectedFournisseur.company_name ||
                              selectedFournisseur.Nom_Raison_Sociale
                          );

                          dispatch({
                            type: "SET_SELECTED_FOURNISSEUR",
                            payload: selectedFournisseur,
                          });
                        } else {
                          console.error(
                            `Erreur: Fournisseur avec ID=${value} non trouvé dans la liste`
                          );
                        }
                      } else {
                        dispatch({
                          type: "SET_SELECTED_FOURNISSEUR",
                          payload: null,
                        });
                      }
                    }}
                  >
                    {state.fournisseurs.map((fournisseur: any) => (
                      <Option key={fournisseur.id} value={fournisseur.id}>
                        {fournisseur.name ||
                          fournisseur.company_name ||
                          fournisseur.Nom_Raison_Sociale ||
                          "Nom inconnu"}
                      </Option>
                    ))}
                  </Select>

                  <DatePicker.RangePicker
                    format="YYYY-MM-DD"
                    onChange={(dates: any, dateStrings: string[]) =>
                      dispatch({
                        type: "SET_DATE_RANGE",
                        payload: {
                          start: dateStrings[0] || "",
                          end: dateStrings[1] || "",
                        },
                      })
                    }
                    style={{ marginBottom: 8 }}
                  />
                </Col>
              </Row>

              {/* Onglets avec bouton d'export à droite */}
              <Row
                align="middle"
                style={{ marginBottom: 16 }}
                className="flex-wrap"
              >
                <Col xs={24} md={18} className="overflow-x-auto">
                  <Tabs
                    activeKey={state.activeTab}
                    onChange={(activeKey) =>
                      dispatch({ type: "SET_ACTIVE_TAB", payload: activeKey })
                    }
                    className="whitespace-nowrap"
                  >
                    <Tabs.TabPane tab="Tous les achats" key="all" />
                    <Tabs.TabPane tab="Non payé" key="unpaid" />
                    <Tabs.TabPane
                      tab="Partiellement payé"
                      key="partially_paid"
                    />
                    <Tabs.TabPane tab="Payé" key="paid" />
                  </Tabs>
                </Col>
                <Col xs={24} md={6} className="flex justify-end mt-2 md:mt-0">
                  {hasPermission(
                    "Gestion Commerciale.Approvisionnement.Achats.Achat.view"
                  ) && (
                    <Button
                      icon={<FileExcelOutlined style={{ color: "#217346" }} />}
                      onClick={handleExportToExcel}
                    >
                      Exporter sur Excel
                    </Button>
                  )}
                </Col>
              </Row>

              {/* Tableau des achats */}
              <AchatsTable refreshAchats={refreshAchats} />
            </>
          )}

          {state.showForm && (
            <AchatForm
              visible={state.showForm}
              onClose={() => dispatch({ type: "TOGGLE_FORM", payload: false })}
              refreshAchats={refreshAchats}
            />
          )}
        </Layout.Content>
      </Layout>
    </AchatsContext.Provider>
  );
};

export default GestionAchat;
