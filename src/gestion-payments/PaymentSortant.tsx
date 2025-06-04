import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Table,
  Button,
  Input,
  DatePicker,
  Select,
  Modal,
  Form,
  InputNumber,
  Checkbox,
  Space,
  message,
  Row,
  Col,
  Card,
  Typography,
  Tooltip,
  Spin,
  Tag,
  Alert,
  TableProps,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useSelection } from "../SelectionContext";
import axios from "axios";
import dayjs from "dayjs";
import locale from "dayjs/locale/fr";
import "dayjs/locale/fr";
import * as XLSX from "xlsx";
// @ts-ignore - Context from JS file
import { useAuth } from "../context/AuthContext";

// Configuration d'axios
axios.defaults.baseURL = "http://localhost:3000";

const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

dayjs.locale(locale);

interface Supplier {
  ID_Frs: number;
  Nom_Raison_Sociale: string;
  USER_ID?: number;
}

interface PaymentMode {
  id: number;
  name: string;
}

interface Order {
  id: number;
  invoice_number: string;
  order_date: string;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  selected?: boolean;
  payment_amount?: number;
  supplier_name?: string;
}

interface Payment {
  id: number;
  payment_number: string;
  date: string;
  amount: number;
  payment_mode_name: string;
  entity_name: string;
  warehouse_name: string;
  company_name: string;
}

// Fonction utilitaire pour vérifier si une commande a besoin d'un paiement
const orderNeedsPayment = (order: any): boolean => {
  if (!order) return false;

  // Afficher les détails de la commande pour déboguer
  console.log(`Vérification de la commande ID ${order.id}:`);
  console.log(`  - Status: "${order.payment_status || "Non défini"}"`);
  console.log(`  - Montant total: ${order.total}`);
  console.log(`  - Montant payé: ${order.paid_amount}`);
  console.log(`  - Montant dû: ${order.due_amount}`);

  // Vérifier le statut de paiement (plus de variantes possibles)
  const status = (order.payment_status || "").toLowerCase();

  // Vérifier explicitement si le statut contient "non payé" ou équivalent
  const isUnpaid =
    status.includes("non") ||
    status === "non payé" ||
    status === "non paye" ||
    status.includes("unpaid") ||
    status === "pending" ||
    status === "en attente" ||
    status.includes("à payer") ||
    status === ""; // Considérer un statut vide comme non payé

  const isPartial =
    status.includes("partiel") ||
    status.includes("partial") ||
    status.includes("part payed") ||
    status.includes("part paid") ||
    status.includes("partiellement");

  // Vérifier les montants
  const hasDueAmount =
    typeof order.due_amount === "number" && order.due_amount > 0;
  const hasRemainingAmount =
    typeof order.paid_amount === "number" &&
    typeof order.total === "number" &&
    order.paid_amount < order.total;

  // Logique pour déterminer si la commande nécessite un paiement
  const needsPayment =
    isUnpaid || isPartial || hasDueAmount || hasRemainingAmount;

  console.log(
    `  - Résultat: ${
      needsPayment ? "Nécessite un paiement" : "Ne nécessite pas de paiement"
    }`
  );
  console.log(
    `  - Raison: ${isUnpaid ? "Non payé" : ""}${
      isPartial ? "Partiellement payé" : ""
    }${hasDueAmount ? "Montant dû > 0" : ""}${
      hasRemainingAmount ? "Montant payé < total" : ""
    }`
  );

  return needsPayment;
};

// Styles CSS pour le tableau des commandes
const tableStyles = {
  orderNeedsPayment: {
    backgroundColor: "#fffbe6", // Jaune très pâle pour les commandes à régler
  },
  responsiveModal: {
    width: "95%",
    maxWidth: "1200px", // Largeur maximale pour éviter que ça devienne trop large
    top: 20, // Positionne le modal un peu plus haut pour avoir plus d'espace
  },
};

// Définir le composant avec un type explicite
const PaymentSortant = (): React.ReactNode => {
  const { selectedWarehouse, selectedCompany } = useSelection();
  const [loading, setLoading] = useState<boolean>(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [currentSupplierName, setCurrentSupplierName] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  // Nouvel état pour les paiements sélectionnés
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  // État local pour gérer l'ID du magasin sélectionné
  const [currentWarehouseId, setCurrentWarehouseId] = useState<number | null>(
    null
  );
  // @ts-ignore - Context from JS file
  const { user, hasPermission } = useAuth();

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
      // Réinitialiser la pagination à 1 pour montrer les nouveaux résultats depuis le début
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [selectedWarehouse, currentWarehouseId]);

  // Charger les paiements
  const fetchPayments = useCallback(async () => {
    // Ne pas faire d'appel API si aucun magasin n'est sélectionné
    if (!currentWarehouseId) {
      console.log(
        "Aucun magasin sélectionné, aucun appel API pour les paiements"
      );
      setLoading(false);
      setPayments([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        payment_type: "out",
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId;
      }

      if (searchText) {
        params.search = searchText;
      }

      if (selectedSupplier) {
        params.supplier_id = selectedSupplier;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format("YYYY-MM-DD");
        params.date_to = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await axios.get("/api/payments", { params });
      setPayments(response.data.payments);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error);
      message.error("Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    currentWarehouseId,
    searchText,
    selectedSupplier,
    dateRange,
  ]);

  // Charger les fournisseurs
  const fetchSuppliers = useCallback(async () => {
    // Ne pas charger les fournisseurs si aucun magasin n'est sélectionné
    if (!currentWarehouseId) {
      console.log(
        "Aucun magasin sélectionné, réinitialisation des fournisseurs"
      );
      setSuppliers([]);
      return;
    }

    try {
      const apiUrl = "/api/users/suppliers";
      console.log("Appel API fournisseurs:", apiUrl);
      const response = await axios.get(apiUrl);
      console.log("Données fournisseurs reçues:", response.data);

      // La structure des fournisseurs dans la base de données est différente de celle attendue
      if (Array.isArray(response.data)) {
        const mappedSuppliers = response.data.map((supplier: any) => ({
          ID_Frs: supplier.id, // Mapper l'attribut id à ID_Frs
          Nom_Raison_Sociale:
            supplier.name || supplier.company_name || "Sans nom", // Mapper name à Nom_Raison_Sociale
          USER_ID: supplier.user_id || supplier.id, // Stocker également user_id qui est utilisé dans les commandes
        }));
        console.log("Fournisseurs mappés:", mappedSuppliers);
        setSuppliers(mappedSuppliers);
      } else if (
        response.data &&
        response.data.suppliers &&
        Array.isArray(response.data.suppliers)
      ) {
        // Au cas où les données seraient encapsulées dans un objet avec une propriété "suppliers"
        const mappedSuppliers = response.data.suppliers.map(
          (supplier: any) => ({
            ID_Frs: supplier.id,
            Nom_Raison_Sociale:
              supplier.name || supplier.company_name || "Sans nom",
            USER_ID: supplier.user_id || supplier.id,
          })
        );
        console.log(
          "Fournisseurs mappés (depuis response.data.suppliers):",
          mappedSuppliers
        );
        setSuppliers(mappedSuppliers);
      } else {
        console.error(
          "Format de données inattendu pour les fournisseurs:",
          response.data
        );
        message.error("Erreur: format de données des fournisseurs incorrect");

        // Tentative alternative avec une API différente en cas d'échec
        try {
          console.log("Tentative avec API alternative: /api/suppliers");
          const altResponse = await axios.get("/api/suppliers");
          console.log("Données API alternative:", altResponse.data);

          if (Array.isArray(altResponse.data)) {
            const mappedSuppliers = altResponse.data.map((supplier: any) => ({
              ID_Frs: supplier.id || supplier.ID_Frs,
              Nom_Raison_Sociale:
                supplier.name || supplier.Nom_Raison_Sociale || "Sans nom",
            }));
            console.log(
              "Fournisseurs mappés (depuis API alternative):",
              mappedSuppliers
            );
            setSuppliers(mappedSuppliers);
          }
        } catch (altError) {
          console.error("Échec de l'API alternative:", altError);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error);
      message.error("Erreur lors du chargement des fournisseurs");
    }
  }, []);

  // Charger les modes de paiement
  const fetchPaymentModes = useCallback(async () => {
    // Ne pas charger les modes de paiement si aucun magasin n'est sélectionné
    if (!currentWarehouseId || !selectedCompany) {
      console.log(
        "Aucun magasin ou entreprise sélectionné, réinitialisation des modes de paiement"
      );
      setPaymentModes([]);
      return;
    }

    try {
      const params: any = {};
      if (selectedCompany) {
        params.company_id = selectedCompany;
      }
      const response = await axios.get("/api/payment-modes", { params });
      setPaymentModes(response.data.paymentModes);
    } catch (error) {
      console.error("Erreur lors du chargement des modes de paiement:", error);
      message.error("Erreur lors du chargement des modes de paiement");
    }
  }, [currentWarehouseId, selectedCompany]);

  // Charger les commandes non payées pour un fournisseur
  const fetchUnpaidOrders = useCallback(
    async (supplierUserId: number | null | undefined) => {
      // Si supplierUserId est null ou undefined, retourner un tableau vide
      if (supplierUserId === null || supplierUserId === undefined) {
        console.log(
          "Aucun fournisseur sélectionné, retournant un tableau vide"
        );
        setUnpaidOrders([]);
        setLoading(false);
        return { orders: [], count: 0 };
      }

      try {
        // Récupérer le nom du fournisseur à partir de son USER_ID
        const selectedSupplier = suppliers.find(
          (s) => s.USER_ID === supplierUserId
        );
        const selectedSupplierName =
          selectedSupplier?.Nom_Raison_Sociale || "Inconnu";

        // Utiliser directement supplierUserId comme USER_ID
        const selectedUserID = supplierUserId;

        console.log(
          `Fournisseur sélectionné: ${selectedSupplierName} (USER_ID: ${selectedUserID})`
        );

        // Démarrer le chargement
        setLoading(true);
        // Vider la liste des commandes impayées avant de commencer la recherche
        setUnpaidOrders([]);

        // Premier essai avec les paramètres explicites pour inclure les commandes non payées et partiellement payées
        let result = await tryFetchOrders(selectedUserID, {
          payment_status: "all", // Demander tous les statuts de paiement
          include_unpaid: true, // Inclure explicitement les commandes non payées
        });

        // Si aucune commande n'est trouvée, essayer avec un autre filtre plus spécifique
        if (result.orders.length === 0) {
          console.log(
            "Aucune commande trouvée avec le filtre payment_status=all, essai avec partial,unpaid"
          );
          result = await tryFetchOrders(selectedUserID, {
            payment_status: "partial,unpaid",
          });
        }

        // Si toujours aucune commande, essayer sans filtres
        if (result.orders.length === 0) {
          console.log(
            "Aucune commande trouvée avec le filtre payment_status=partial,unpaid, essai sans filtres"
          );
          result = await tryFetchOrders(selectedUserID, {});
        }

        // Si toujours aucune commande, essayer avec une autre API en dernier recours
        if (result.orders.length === 0) {
          console.log(
            "Dernier recours: essai avec l'API des commandes (orders) directement"
          );
          try {
            // Utiliser le USER_ID au lieu de supplierId pour l'API des commandes
            const userIdToUse = selectedUserID || supplierUserId;
            console.log(
              `Utilisation de user_id=${userIdToUse} pour l'API des commandes`
            );

            const ordersResponse = await axios.get(`/api/orders`, {
              params: {
                user_id: userIdToUse,
                order_type: "purchase",
              },
            });
            console.log("Réponse de l'API des commandes:", ordersResponse.data);

            if (
              ordersResponse.data &&
              ordersResponse.data.orders &&
              ordersResponse.data.orders.length > 0
            ) {
              // S'assurer que les commandes appartiennent bien au fournisseur sélectionné
              const supplierOrders = ordersResponse.data.orders.filter(
                (order: any) => {
                  // Vérifier si la commande appartient au fournisseur
                  const orderSupplierId =
                    order.supplier_id || order.user_id || order.entity_id;
                  console.log(
                    `Commande ID ${order.id}, Fournisseur: ${orderSupplierId} (attendu USER_ID: ${selectedUserID})`
                  );

                  // Comparer avec le USER_ID du fournisseur
                  return Number(orderSupplierId) === Number(selectedUserID);
                }
              );

              console.log(
                `${supplierOrders.length} commandes du fournisseur USER_ID ${selectedUserID} trouvées`
              );

              const filteredDirectOrders =
                supplierOrders.filter(orderNeedsPayment);
              console.log(
                `${filteredDirectOrders.length} commandes à régler trouvées via l'API des commandes`
              );

              if (filteredDirectOrders.length > 0) {
                const ordersWithDetails = filteredDirectOrders.map(
                  (order: any) => ({
                    ...order,
                    selected: false,
                    payment_amount: 0,
                    // Ajouter le nom du fournisseur à chaque commande
                    supplier_name: selectedSupplierName,
                  })
                );
                console.log(
                  "Mise à jour de unpaidOrders avec les commandes trouvées:",
                  ordersWithDetails
                );
                setUnpaidOrders(ordersWithDetails);
                return {
                  orders: filteredDirectOrders,
                  count: filteredDirectOrders.length,
                };
              }
            }
          } catch (apiError) {
            console.error(
              "Erreur lors de l'appel à l'API des commandes:",
              apiError
            );
          }
        } else {
          return { orders: result.orders, count: result.count };
        }

        return { orders: [], count: 0 };
      } catch (error) {
        console.error(
          "Erreur lors du chargement des commandes non payées:",
          error
        );
        message.error("Erreur lors du chargement des commandes non payées");

        // En cas d'erreur, vider la liste
        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      } finally {
        setLoading(false);
      }
    },
    [currentWarehouseId, suppliers]
  );

  // Fonction auxiliaire pour essayer de récupérer les commandes avec différents paramètres
  const tryFetchOrders = async (
    supplierUserId: number | null | undefined,
    additionalParams: any = {}
  ) => {
    // Si supplierUserId est null ou undefined, retourner un tableau vide
    if (supplierUserId === null || supplierUserId === undefined) {
      console.log(
        "Aucun fournisseur spécifié (USER_ID null ou undefined), retournant un tableau vide"
      );
      return { orders: [], count: 0 };
    }

    try {
      const params: any = {
        ...additionalParams,
        // Ajouter explicitement un paramètre pour inclure les commandes non payées
        include_unpaid: true,
        payment_status: additionalParams.payment_status || "all", // Demander tous les statuts de paiement par défaut
      };

      // Rechercher le fournisseur par USER_ID au lieu de ID_Frs
      const selectedSupplier = suppliers.find(
        (s) => s.USER_ID === supplierUserId
      );
      const selectedSupplierName =
        selectedSupplier?.Nom_Raison_Sociale || "Inconnu";

      // Utiliser directement supplierUserId comme selectedUserID
      const selectedUserID = supplierUserId;

      if (!selectedUserID) {
        console.error(
          `Erreur: USER_ID invalide pour le fournisseur: ${supplierUserId}`
        );
      }

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId;
      }

      console.log(
        `Récupération des commandes pour le fournisseur ${selectedSupplierName} avec USER_ID=${selectedUserID}, paramètres:`,
        params
      );

      // Pour l'API, nous devons TOUJOURS utiliser le USER_ID, car c'est ce qui est stocké dans la table orders
      const supplierIdToUse = selectedUserID;

      if (!supplierIdToUse) {
        console.error(
          "Impossible de récupérer les commandes: USER_ID manquant pour le fournisseur"
        );
        return { orders: [], count: 0 };
      }

      console.log(
        `Appel API avec USER_ID=${supplierIdToUse} et params:`,
        params
      );
      const response = await axios.get(
        `/api/payments/unpaid-orders/supplier/${supplierIdToUse}`,
        { params }
      );

      console.log(
        `Réponse API pour les commandes du fournisseur USER_ID=${supplierIdToUse}:`,
        response.data
      );

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        console.log("Aucune commande retournée par l'API");
        return { orders: [], count: 0 };
      }

      // Log des propriétés d'une commande pour comprendre la structure
      if (response.data.length > 0) {
        console.log("Structure d'une commande:", Object.keys(response.data[0]));
        console.log("Exemple de commande:", response.data[0]);

        // Vérifier les valeurs possibles de payment_status
        const statusSet = new Set();
        const paymentStatusDetails: {
          id: number;
          invoice: string;
          status: string;
          total: number;
          paid: number;
          due: number;
        }[] = [];

        response.data.forEach((order: any) => {
          if (order.payment_status) {
            statusSet.add(order.payment_status);
            paymentStatusDetails.push({
              id: order.id,
              invoice: order.invoice_number || "N/A",
              status: order.payment_status,
              total: order.total,
              paid: order.paid_amount,
              due: order.due_amount,
            });
          }
        });

        console.log(
          "Statuts de paiement présents dans les données:",
          Array.from(statusSet)
        );

        console.log("Détails des statuts de paiement:", paymentStatusDetails);
      }

      // Les commandes retournées appartiennent déjà au fournisseur, donc pas besoin de filtrer à nouveau
      const supplierOrders = response.data;

      // Log des statuts de paiement avant filtrage
      const statusCounts: Record<string, number> = {};
      supplierOrders.forEach((order: any) => {
        const status = order.payment_status || "Non défini";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(
        "Répartition des statuts de paiement avant filtrage:",
        statusCounts
      );

      // Filtrer les commandes qui ont besoin d'un paiement
      // Assurons-nous que les commandes non payées sont incluses
      const filteredOrders = supplierOrders.filter((order: any) => {
        // Vérifier explicitement si la commande est non payée ou partiellement payée
        const status = (order.payment_status || "").toLowerCase();
        const isUnpaid =
          status.includes("non") || status === "non payé" || status === "";
        const isPartial =
          status.includes("partiel") || status.includes("partiellement");
        const hasDueAmount =
          typeof order.due_amount === "number" && order.due_amount > 0;

        const needsPayment = isUnpaid || isPartial || hasDueAmount;

        // Log détaillé pour chaque commande
        console.log(
          `Commande ID ${order.id}, Status: ${order.payment_status}, Due: ${order.due_amount}, Needs Payment: ${needsPayment}`
        );

        if (!needsPayment) {
          console.log(
            `Commande ID ${order.id} exclue: ne nécessite pas de paiement`
          );
        }

        return needsPayment;
      });

      console.log(
        `${supplierOrders.length} commandes du fournisseur, ${filteredOrders.length} après filtrage des statuts de paiement`
      );

      // Log plus détaillé pour comprendre quelles commandes ont été conservées
      if (filteredOrders.length > 0) {
        console.log(
          "Commandes à régler conservées:",
          filteredOrders.map((order) => ({
            id: order.id,
            invoice: order.invoice_number,
            status: order.payment_status,
            due: order.due_amount,
          }))
        );

        // Mettre à jour l'état avec les commandes trouvées
        const ordersWithDetails = filteredOrders.map((order: any) => ({
          ...order,
          selected: false,
          payment_amount: 0,
          // Ajouter le nom du fournisseur à chaque commande
          supplier_name: selectedSupplierName,
        }));

        console.log(
          "Mise à jour de unpaidOrders avec les commandes trouvées:",
          ordersWithDetails.length,
          "commandes"
        );

        // Mettre à jour l'état de manière synchrone pour éviter les problèmes de timing
        setUnpaidOrders(ordersWithDetails);

        return { orders: filteredOrders, count: filteredOrders.length };
      } else {
        // Aucune commande trouvée après filtrage
        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      }
    } catch (error) {
      console.error("Erreur dans tryFetchOrders:", error);
      setUnpaidOrders([]);
      return { orders: [], count: 0 };
    }
  };

  // Charger les détails d'un paiement
  const fetchPaymentDetails = useCallback(async (paymentId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/payments/${paymentId}`);
      setCurrentPayment(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails du paiement:",
        error
      );
      message.error("Erreur lors du chargement des détails du paiement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet initial pour charger les données
  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
    fetchPaymentModes();
  }, [fetchPayments, fetchSuppliers, fetchPaymentModes]);

  // Vérifier si l'URL contient un payment_id et, si c'est le cas, ouvrir les détails du paiement
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentId = queryParams.get("payment_id");

    if (paymentId) {
      console.log(
        "Ouverture automatique des détails du paiement ID:",
        paymentId
      );
      fetchPaymentDetails(Number(paymentId));
    }
  }, [fetchPaymentDetails]);

  // Gérer le changement de pagination
  const handleTableChange = (pagination: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // Gérer la recherche
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Gérer le changement de fournisseur
  const handleSupplierChange = (value: number | undefined) => {
    console.log(`Changement de fournisseur USER_ID: ${value}`);

    // Si la valeur est undefined, c'est que l'utilisateur a effacé le filtre
    if (value === undefined) {
      setSelectedSupplier(null); // Utiliser null au lieu de undefined
      setPagination({ ...pagination, current: 1 });
      return;
    }

    // Trouver le nom du fournisseur pour l'affichage des logs
    const selectedSupplier = suppliers.find((s) => s.USER_ID === value);

    console.log(
      `Fournisseur sélectionné: ${
        selectedSupplier?.Nom_Raison_Sociale || "Inconnu"
      }, USER_ID: ${value}`
    );

    // Utiliser directement la valeur (USER_ID) pour le filtrage
    setSelectedSupplier(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Gérer le changement de date
  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    setPagination({ ...pagination, current: 1 });
  };

  // Ouvrir le modal pour ajouter un paiement
  const openAddModal = () => {
    setEditMode(false);
    form.resetFields();
    setUnpaidOrders([]);
    setModalVisible(true);
  };

  // Ouvrir le modal pour éditer un paiement
  const openEditModal = async (record: Payment) => {
    setEditMode(true);
    setLoading(true);
    try {
      const response = await axios.get(`/api/payments/${record.id}`);
      const payment = response.data;
      setCurrentPayment(payment);

      // Charger les commandes non payées pour ce fournisseur
      if (payment.entity_id) {
        await fetchUnpaidOrders(payment.entity_id);
      }

      // Préremplir le formulaire
      form.setFieldsValue({
        supplier_id: payment.entity_id,
        payment_date: dayjs(payment.date),
        payment_mode_id: payment.payment_mode_id,
        amount: payment.amount,
        notes: payment.notes,
      });

      // Marquer les commandes associées comme sélectionnées
      if (payment.orders && payment.orders.length > 0) {
        const updatedOrders = [...unpaidOrders];
        payment.orders.forEach((op: any) => {
          const index = updatedOrders.findIndex((o) => o.id === op.order_id);
          if (index !== -1) {
            updatedOrders[index].selected = true;
            updatedOrders[index].payment_amount = op.amount;
          }
        });
        setUnpaidOrders(updatedOrders);
      }

      setModalVisible(true);
    } catch (error) {
      console.error("Erreur lors du chargement du paiement:", error);
      message.error("Erreur lors du chargement du paiement");
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de fournisseur dans le formulaire
  const handleFormSupplierChange = async (value: number | undefined) => {
    // Si la valeur est undefined, c'est que l'utilisateur a effacé le filtre
    if (value === undefined) {
      setCurrentSupplierName("");
      setUnpaidOrders([]);
      form.setFieldsValue({ orders: [] });
      message.success("Sélection du fournisseur réinitialisée");
      return;
    }

    message.info({
      content: "Chargement des commandes à régler...",
      key: "unpaidOrdersLoading",
      duration: 0,
    });
    try {
      // Trouver le fournisseur par son USER_ID (qui est maintenant la valeur du Select)
      const selectedSupplierObj = suppliers.find((s) => s.USER_ID === value);
      const supplierName = selectedSupplierObj?.Nom_Raison_Sociale || "Inconnu";

      // Le USER_ID est déjà la valeur du Select, donc nous n'avons pas besoin de le chercher
      const userIdToUse = value;

      setCurrentSupplierName(supplierName);

      const result = await fetchUnpaidOrders(value);
      message.destroy("unpaidOrdersLoading");

      console.log(
        `Résultat de fetchUnpaidOrders: ${result.count} commandes trouvées`
      );

      // Baser le message uniquement sur le résultat de fetchUnpaidOrders
      if (result.count > 0) {
        message.success(
          `${result.count} commandes à régler trouvées pour ${supplierName}`
        );
      } else {
        message.info(`Aucune commande à régler trouvée pour ${supplierName}`);
      }
    } catch (error) {
      console.error("Erreur lors du changement de fournisseur:", error);
      message.destroy("unpaidOrdersLoading");
      message.error(
        "Erreur lors du chargement des commandes. Veuillez réessayer."
      );
    }
  };

  // Gérer la sélection d'une commande
  const handleOrderSelection = (orderId: number, checked: boolean) => {
    const updatedOrders = [...unpaidOrders];
    const index = updatedOrders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      updatedOrders[index].selected = checked;
      if (checked && !updatedOrders[index].payment_amount) {
        updatedOrders[index].payment_amount = updatedOrders[index].due_amount;
      }
      setUnpaidOrders(updatedOrders);
    }
  };

  // Gérer le changement de montant pour une commande
  const handleOrderAmountChange = (orderId: number, amount: number) => {
    const updatedOrders = [...unpaidOrders];
    const index = updatedOrders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      updatedOrders[index].payment_amount = amount;
      setUnpaidOrders(updatedOrders);
    }
  };

  // Calculer le montant total des commandes sélectionnées
  const calculateTotalSelectedAmount = () => {
    return unpaidOrders
      .filter((o) => o.selected)
      .reduce((sum, order) => sum + (order.payment_amount || 0), 0);
  };

  // Soumettre le formulaire
  const handleSubmit = async (values: any) => {
    console.log("Soumission du formulaire avec les valeurs:", values);

    // Récupérer les commandes sélectionnées
    const selectedOrders = unpaidOrders
      .filter((o) => o.selected)
      .map((o) => ({
        order_id: o.id,
        amount: o.payment_amount || 0,
      }));

    console.log("Commandes sélectionnées:", selectedOrders);

    // Vérifier si des commandes sont sélectionnées
    if (selectedOrders.length === 0 && !editMode) {
      Modal.confirm({
        title: "Aucune commande sélectionnée",
        content:
          "Vous n'avez sélectionné aucune commande à régler. Voulez-vous quand même enregistrer ce paiement sans l'affecter à des commandes?",
        okText: "Oui, continuer",
        cancelText: "Non, revenir",
        onOk: () => processPayment(values, selectedOrders),
      });
      return;
    }

    // Calcul du total des montants sélectionnés
    const totalSelectedAmount = calculateTotalSelectedAmount();

    // Vérifier la cohérence entre le montant saisi et le total des commandes
    if (Math.abs(totalSelectedAmount - values.amount) > 1 && !editMode) {
      // Tolérance de 1 pour les erreurs d'arrondi
      Modal.confirm({
        title: "Montants différents",
        content: `Le montant total que vous avez saisi (${values.amount.toLocaleString(
          "fr-FR"
        )} XOF) est différent du total des montants affectés aux commandes (${totalSelectedAmount.toLocaleString(
          "fr-FR"
        )} XOF). Voulez-vous continuer quand même?`,
        okText: "Oui, continuer",
        cancelText: "Non, revenir",
        onOk: () => processPayment(values, selectedOrders),
      });
    } else {
      // Si tout est cohérent, procéder directement
      processPayment(values, selectedOrders);
    }
  };

  // Fonction pour traiter le paiement après validation
  const processPayment = async (values: any, selectedOrders: any[]) => {
    setLoading(true);
    // --- Récupérer les ID depuis le contexte ---
    const currentCompanyId = selectedCompany;
    const warehouseIdToUse = currentWarehouseId;

    console.log("[processPayment] Starting payment processing...");
    console.log("[processPayment] Form values received:", values);
    console.log("[processPayment] Selected orders received:", selectedOrders);
    console.log("[processPayment] Context values:", {
      currentCompanyId,
      currentWarehouseId: warehouseIdToUse,
    });

    // --- Validation Stricte des IDs ---
    if (!currentCompanyId || typeof currentCompanyId !== "number") {
      message.error(
        "Erreur critique : ID d'entreprise invalide ou manquant. Veuillez rafraîchir la page ou re-sélectionner."
      );
      setLoading(false);
      console.error(
        "[processPayment] Invalid or missing company ID from context:",
        currentCompanyId
      );
      return;
    }
    if (!warehouseIdToUse || typeof warehouseIdToUse !== "number") {
      message.error(
        "Erreur critique : ID de magasin invalide ou manquant. Veuillez rafraîchir la page ou re-sélectionner."
      );
      setLoading(false);
      console.error(
        "[processPayment] Invalid or missing warehouse ID from context:",
        warehouseIdToUse
      );
      return;
    }
    // --- Fin Validation Stricte ---

    try {
      // Le USER_ID du fournisseur est directement dans values.supplier_id
      const userIdToUse = values.supplier_id;
      const supplierName =
        suppliers.find((s) => s.USER_ID === userIdToUse)?.Nom_Raison_Sociale ||
        "Inconnu";

      if (!userIdToUse || isNaN(Number(userIdToUse))) {
        console.error("USER_ID invalide:", userIdToUse);
        message.error(
          `Erreur: Identifiant utilisateur manquant ou invalide pour le fournisseur "${supplierName}". Contactez l'administrateur.`
        );
        setLoading(false);
        return;
      }

      console.log(
        `[processPayment] Processing payment for Supplier USER_ID: ${userIdToUse} (${supplierName})`,
        `Company ID: ${currentCompanyId}`,
        `Warehouse ID: ${warehouseIdToUse}`
      );

      // --- Préparer les données du paiement SANS FALLBACKS DANGEREUX ---
      const paymentData = {
        company_id: currentCompanyId, // Utiliser l'ID de l'entreprise du contexte
        warehouse_id: warehouseIdToUse, // Utiliser l'ID du magasin du contexte
        payment_type: "out",
        date: values.payment_date.format("YYYY-MM-DD"),
        amount: values.amount,
        payment_mode_id: values.payment_mode_id,
        user_id: userIdToUse, // Utiliser uniquement USER_ID
        notes: values.notes,
        orders: selectedOrders,
        staff_user_id: user?.id, // Ajouter l'ID de l'utilisateur connecté
      };

      console.log(
        "[processPayment] Payment data being sent to API:",
        paymentData
      );

      // --- Appel API ---
      if (editMode && currentPayment) {
        console.log(
          `[processPayment] Updating payment ID: ${currentPayment.id}`
        );
        await axios.put(`/api/payments/${currentPayment.id}`, paymentData);
        message.success("Paiement mis à jour avec succès");
      } else {
        console.log("[processPayment] Creating new payment.");
        await axios.post("/api/payments", paymentData);
        message.success("Paiement créé avec succès");
      }

      setModalVisible(false);
      fetchPayments(); // Recharger la liste
    } catch (error: any) {
      console.error("[processPayment] Error saving payment:", error);
      // Afficher une erreur plus détaillée si possible
      const errorMsg =
        error.response?.data?.error || error.message || "Erreur inconnue";
      message.error(`Erreur lors de l'enregistrement: ${errorMsg}`);
    } finally {
      setLoading(false);
      console.log("[processPayment] Finished payment processing.");
    }
  };

  // Supprimer un paiement
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce paiement ?",
      content:
        "Cette action est irréversible. Les montants payés et les statuts des commandes associées à ce paiement seront également mis à jour.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        setLoading(true);
        try {
          await axios.delete(`/api/payments/${id}`);
          message.success("Paiement supprimé avec succès");
          fetchPayments();
          // Réinitialiser les paiements sélectionnés après suppression
          setSelectedPaymentIds([]);
        } catch (error) {
          console.error("Erreur lors de la suppression du paiement:", error);
          message.error("Erreur lors de la suppression du paiement");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Nouvelle fonction pour gérer la suppression multiple
  const handleMultipleDelete = () => {
    if (selectedPaymentIds.length === 0) return;

    Modal.confirm({
      title: `Êtes-vous sûr de vouloir supprimer ${selectedPaymentIds.length} paiement(s) ?`,
      content:
        "Cette action est irréversible. Les montants payés et les statuts des commandes associées à ces paiements seront également mis à jour.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        setLoading(true);
        try {
          // Supprimer chaque paiement sélectionné
          const deletePromises = selectedPaymentIds.map((id) =>
            axios.delete(`/api/payments/${id}`)
          );

          await Promise.all(deletePromises);

          message.success(
            `${selectedPaymentIds.length} paiement(s) supprimé(s) avec succès`
          );
          fetchPayments();
          // Réinitialiser les paiements sélectionnés après suppression
          setSelectedPaymentIds([]);
        } catch (error) {
          console.error("Erreur lors de la suppression des paiements:", error);
          message.error("Erreur lors de la suppression des paiements");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Nouvelle fonction pour gérer la sélection d'un paiement
  const handlePaymentSelection = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds((prev) => [...prev, id]);
    } else {
      setSelectedPaymentIds((prev) =>
        prev.filter((paymentId) => paymentId !== id)
      );
    }
  };

  // Nouvelle fonction pour gérer la sélection de tous les paiements
  const handleSelectAllPayments = (checked: boolean) => {
    if (checked) {
      const allIds = payments.map((payment) => payment.id);
      setSelectedPaymentIds(allIds);
    } else {
      setSelectedPaymentIds([]);
    }
  };

  // Nouvelle fonction pour exporter les paiements vers Excel
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });

      // Récupérer les données avec les mêmes filtres que ceux appliqués à la vue actuelle
      const params: any = {
        payment_type: "out",
        // Exporter toutes les données (pas de pagination pour l'export)
        page: 1,
        limit: 1000, // Limite élevée pour récupérer toutes les données
      };

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId;
      }

      if (searchText) {
        params.search = searchText;
      }

      if (selectedSupplier) {
        params.supplier_id = selectedSupplier;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format("YYYY-MM-DD");
        params.date_to = dateRange[1].format("YYYY-MM-DD");
      }

      // Récupérer les données filtrées
      const response = await axios.get("/api/payments", { params });
      const dataToExport = response.data.payments;

      // Formater les données pour l'export
      const formattedData = dataToExport.map((payment: Payment) => ({
        Date: dayjs(payment.date).format("DD/MM/YYYY"),
        "No Transaction": payment.payment_number,
        Fournisseur: payment.entity_name,
        Magasin: payment.warehouse_name,
        "Mode de paiement": payment.payment_mode_name,
        Montant: payment.amount, // Montant numérique pour permettre les calculs
        Devise: "XOF", // Devise séparée pour faciliter les calculs
        Entreprise: payment.company_name,
      }));

      // Créer un classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements Sortants");

      // Ajuster la largeur des colonnes
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // No Transaction
        { wch: 30 }, // Fournisseur
        { wch: 20 }, // Magasin
        { wch: 20 }, // Mode de paiement
        { wch: 15 }, // Montant
        { wch: 8 }, // Devise
        { wch: 20 }, // Entreprise
      ];
      worksheet["!cols"] = columnWidths;

      // Générer le fichier Excel
      const today = dayjs().format("YYYY-MM-DD");
      XLSX.writeFile(workbook, `Paiements_Sortants_${today}.xlsx`);

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
    } finally {
      setLoading(false);
    }
  };

  // Colonnes du tableau
  const columns: TableProps<Payment>["columns"] = [
    {
      title: (
        <Checkbox
          onChange={(e) => handleSelectAllPayments(e.target.checked)}
          checked={
            payments.length > 0 && selectedPaymentIds.length === payments.length
          }
          indeterminate={
            selectedPaymentIds.length > 0 &&
            selectedPaymentIds.length < payments.length
          }
        />
      ),
      dataIndex: "selection",
      key: "selection",
      width: 50,
      render: (_: any, record: Payment) => (
        <Checkbox
          checked={selectedPaymentIds.includes(record.id)}
          onChange={(e) => handlePaymentSelection(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      responsive: ["sm"],
    },
    {
      title: "No Transaction",
      dataIndex: "payment_number",
      key: "payment_number",
    },
    {
      title: "Fournisseur",
      dataIndex: "entity_name",
      key: "entity_name",
      responsive: ["md"],
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      render: (text: string) => (
        <span style={{ color: "#1890ff", fontWeight: 500 }}>
          {text || "Non défini"}
        </span>
      ),
      responsive: ["lg"],
    },
    {
      title: "Mode de paiement",
      dataIndex: "payment_mode_name",
      key: "payment_mode_name",
      responsive: ["lg"],
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) =>
        text.toLocaleString("fr-FR", { style: "currency", currency: "XOF" }),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Payment) => (
        <Space size="small">
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.view"
          ) && (
            <Tooltip title="Voir">
              <Button
                icon={<EyeOutlined />}
                onClick={() => fetchPaymentDetails(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.edit"
          ) && (
            <Tooltip title="Modifier">
              <Button
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
                size="small"
              />
            </Tooltip>
          )}
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.delete"
          ) && (
            <Tooltip title="Supprimer">
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                danger
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout className="site-layout">
      <Content style={{ margin: "0 16px" }}>
        <div style={{ padding: 24, minHeight: 360 }}>
          <Title level={2}>Paiements Sortants</Title>

          {/* Message informatif si aucun magasin n'est sélectionné */}
          {!currentWarehouseId && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Typography.Title level={4} type="secondary">
                  Sélection de magasin requise
                </Typography.Title>
                <Typography.Text type="secondary">
                  Veuillez sélectionner un magasin dans le menu en haut à droite
                  pour afficher et gérer les paiements sortants.
                </Typography.Text>
              </div>
            </Card>
          )}

          {/* Filtres - Affichés seulement si un magasin est sélectionné */}
          {currentWarehouseId && (
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Rechercher par No Transaction"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="Filtrer par fournisseur"
                    style={{ width: "100%", marginBottom: 8 }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    onChange={handleSupplierChange}
                    value={selectedSupplier}
                  >
                    {suppliers.map((supplier) => (
                      <Option key={supplier.ID_Frs} value={supplier.USER_ID}>
                        {supplier.Nom_Raison_Sociale}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <RangePicker
                    style={{ width: "100%", marginBottom: 8 }}
                    onChange={handleDateChange}
                    value={dateRange}
                    format="DD/MM/YYYY"
                  />
                </Col>
                <Col
                  xs={24}
                  sm={12}
                  md={6}
                  className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-sm mt-sm sm:mt-0"
                >
                  <Button
                    icon={<FileExcelOutlined style={{ color: "#217346" }} />}
                    onClick={handleExportToExcel}
                    className="w-full sm:w-auto"
                  >
                    Exporter sur Excel
                  </Button>
                  {hasPermission(
                    "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.create"
                  ) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAddModal}
                      className="w-full sm:w-auto"
                      disabled={!currentWarehouseId}
                      title={
                        !currentWarehouseId
                          ? "Veuillez sélectionner un magasin"
                          : ""
                      }
                    >
                      Nouveau Paiement
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Bouton de suppression multiple - Affiché seulement si un magasin est sélectionné */}
          {currentWarehouseId &&
            selectedPaymentIds.length > 0 &&
            hasPermission(
              "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.delete"
            ) && (
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleMultipleDelete}
                >
                  Supprimer ({selectedPaymentIds.length})
                </Button>
              </div>
            )}

          {/* Tableau des paiements - Affiché seulement si un magasin est sélectionné */}
          {currentWarehouseId && (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={payments}
                rowKey="id"
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "30", "40", "50"],
                }}
                onChange={handleTableChange}
                loading={loading}
                scroll={{ x: "max-content" }}
              />
            </div>
          )}

          {/* Modal pour ajouter/éditer un paiement */}
          <Modal
            title={editMode ? "Modifier le paiement" : "Nouveau paiement"}
            visible={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={1000}
            style={tableStyles.responsiveModal}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                payment_date: dayjs(),
                amount: 0,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
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
                      showSearch
                      optionFilterProp="children"
                      onChange={handleFormSupplierChange}
                      disabled={editMode}
                    >
                      {suppliers.map((supplier) => (
                        <Option key={supplier.ID_Frs} value={supplier.USER_ID}>
                          {supplier.Nom_Raison_Sociale}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="payment_date"
                    label="Date de paiement"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez sélectionner une date",
                      },
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
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
                    <Select placeholder="Sélectionner un mode de paiement">
                      {paymentModes.map((mode) => (
                        <Option key={mode.id} value={mode.id}>
                          {mode.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="Montant"
                    rules={[
                      { required: true, message: "Veuillez saisir un montant" },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        value
                          ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                          : ""
                      }
                      parser={(value: any) =>
                        value ? Number(value.replace(/\s/g, "")) : 0
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="notes" label="Remarques">
                <Input.TextArea rows={3} />
              </Form.Item>

              {/* Liste des commandes non payées */}
              {unpaidOrders.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>
                    Commandes à régler
                    {currentSupplierName ? ` - ${currentSupplierName}` : ""}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    Sélectionnez les commandes à régler et ajustez le montant si
                    nécessaire. Toutes les commandes affichées appartiennent au
                    fournisseur {currentSupplierName}.
                  </Text>
                  <Alert
                    message="Information importante"
                    description="Pour confirmer l'appartenance des commandes, le nom du fournisseur est maintenant affiché dans le tableau. Veuillez vérifier que toutes les commandes appartiennent bien au fournisseur sélectionné."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    closable
                  />
                  <div
                    className="table-container"
                    style={{
                      maxHeight: "50vh",
                      overflow: "auto",
                      border: "1px solid #f0f0f0",
                      borderRadius: "4px",
                      marginBottom: "16px",
                    }}
                  >
                    <Table
                      dataSource={unpaidOrders}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ x: "max-content" }}
                      rowClassName={(record) =>
                        orderNeedsPayment(record) ? "order-needs-payment" : ""
                      }
                      style={{ minWidth: "100%" }}
                      columns={[
                        {
                          title: "Sélection",
                          dataIndex: "selected",
                          key: "selected",
                          width: 80,
                          fixed: "left",
                          render: (_: any, record: Order) => (
                            <Checkbox
                              checked={record.selected}
                              onChange={(e) =>
                                handleOrderSelection(
                                  record.id,
                                  e.target.checked
                                )
                              }
                            />
                          ),
                        },
                        {
                          title: "Fournisseur",
                          dataIndex: "supplier_name",
                          key: "supplier_name",
                          width: 150,
                          render: (text: string) => (
                            <Tag color="blue">{text || "Inconnu"}</Tag>
                          ),
                          responsive: ["md"],
                        },
                        {
                          title: "No Facture",
                          dataIndex: "invoice_number",
                          key: "invoice_number",
                        },
                        {
                          title: "Date",
                          dataIndex: "order_date",
                          key: "order_date",
                          render: (text: string) =>
                            dayjs(text).format("DD/MM/YYYY"),
                          responsive: ["sm"],
                        },
                        {
                          title: "Statut",
                          dataIndex: "payment_status",
                          key: "payment_status",
                          width: 140,
                          render: (status: string) => (
                            <Tag
                              color={status === "Non payé" ? "red" : "orange"}
                            >
                              {status}
                            </Tag>
                          ),
                          responsive: ["sm"],
                        },
                        {
                          title: "Montant total",
                          dataIndex: "total",
                          key: "total",
                          render: (text: number | undefined) =>
                            typeof text === "number"
                              ? text.toLocaleString("fr-FR", {
                                  style: "currency",
                                  currency: "XOF",
                                })
                              : "N/A",
                          responsive: ["md"],
                        },
                        {
                          title: "Montant dû",
                          dataIndex: "due_amount",
                          key: "due_amount",
                          render: (text: number) =>
                            text.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                            }),
                          responsive: ["md"],
                        },
                        {
                          title: "Montant à payer",
                          dataIndex: "payment_amount",
                          key: "payment_amount",
                          render: (text: number | undefined) =>
                            typeof text === "number"
                              ? text.toLocaleString("fr-FR", {
                                  style: "currency",
                                  currency: "XOF",
                                })
                              : "N/A",
                        },
                      ]}
                    />
                  </div>
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Text strong>Total sélectionné: </Text>
                    <Text>
                      {calculateTotalSelectedAmount().toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                      })}
                    </Text>
                  </div>
                </div>
              ) : form.getFieldValue("supplier_id") ? (
                <Alert
                  type="info"
                  message="Aucune commande à régler"
                  description="Ce fournisseur n'a aucune commande non payée ou partiellement payée en attente de règlement."
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              <Form.Item style={{ marginTop: 16, textAlign: "right" }}>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>
                    Annuler
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {editMode ? "Mettre à jour" : "Créer"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal de détail du paiement */}
          <Modal
            title="Détail du paiement"
            visible={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailModalVisible(false)}>
                Fermer
              </Button>,
            ]}
            width="95%"
            style={{ maxWidth: 700, top: 20 }}
          >
            {currentPayment ? (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" title="Informations générales">
                      <p>
                        <FileTextOutlined /> <strong>No Transaction:</strong>{" "}
                        {currentPayment.payment_number}
                      </p>
                      <p>
                        <CalendarOutlined /> <strong>Date:</strong>{" "}
                        {dayjs(currentPayment.date).format("DD/MM/YYYY")}
                      </p>
                      <p>
                        <UserOutlined /> <strong>Fournisseur:</strong>{" "}
                        {currentPayment.entity_name}
                      </p>
                      <p>
                        <BankOutlined /> <strong>Mode de paiement:</strong>{" "}
                        {currentPayment.payment_mode_name}
                      </p>
                      <p>
                        <strong>Montant:</strong>{" "}
                        {currentPayment.amount.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "XOF",
                        })}
                      </p>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="Informations complémentaires">
                      <p>
                        <strong>Magasin:</strong>{" "}
                        {currentPayment.warehouse_name}
                      </p>
                      <p>
                        <strong>Entreprise:</strong>{" "}
                        {currentPayment.company_name}
                      </p>
                      <p>
                        <strong>Remarques:</strong>{" "}
                        {currentPayment.notes || "Aucune"}
                      </p>
                    </Card>
                  </Col>
                </Row>

                {currentPayment.orders && currentPayment.orders.length > 0 && (
                  <Card
                    size="small"
                    title="Commandes associées"
                    style={{ marginTop: 16 }}
                  >
                    <div className="overflow-x-auto">
                      <Table
                        dataSource={currentPayment.orders}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: "max-content" }}
                        columns={[
                          {
                            title: "No Facture",
                            dataIndex: "invoice_number",
                            key: "invoice_number",
                          },
                          {
                            title: "Montant total",
                            dataIndex: "order_total",
                            key: "order_total",
                            render: (text: number | undefined) =>
                              typeof text === "number"
                                ? text.toLocaleString("fr-FR", {
                                    style: "currency",
                                    currency: "XOF",
                                  })
                                : "N/A",
                            responsive: ["md"],
                          },
                          {
                            title: "Montant payé",
                            dataIndex: "amount_applied",
                            key: "amount_applied",
                            render: (text: number | undefined) =>
                              typeof text === "number"
                                ? text.toLocaleString("fr-FR", {
                                    style: "currency",
                                    currency: "XOF",
                                  })
                                : "N/A",
                          },
                          {
                            title: "Statut",
                            dataIndex: "payment_status",
                            key: "payment_status",
                            responsive: ["sm"],
                          },
                        ]}
                      />
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Spin />
            )}
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

// Insérer en fin de fichier, juste avant le dernier export default
const style = document.createElement("style");
style.innerHTML = `
  .order-needs-payment {
    background-color: #fffbe6;
  }
  .order-needs-payment:hover {
    background-color: #fff7cc !important;
  }
  .table-container {
    position: relative;
  }
  .table-container .ant-table-wrapper {
    overflow-x: auto;
  }
  @media (max-width: 768px) {
    .ant-modal {
      max-width: 95vw !important;
      margin: 0 auto;
    }
    .ant-form-item {
      margin-bottom: 12px;
    }
  }
`;
document.head.appendChild(style);

export default PaymentSortant;
