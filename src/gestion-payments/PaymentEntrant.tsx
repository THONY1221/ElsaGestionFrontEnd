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
  Alert,
  Tag,
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
import "./PaymentStyles.css"; // Importer les styles CSS
import { useAuth } from "../context/AuthContext"; // Use AuthContext
import type { TableProps } from "antd"; // Import TableProps

// Configuration d'axios
axios.defaults.baseURL = "http://localhost:3000";

const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

dayjs.locale(locale);

// Fonction utilitaire pour vérifier si une commande a besoin d'un paiement
const orderNeedsPayment = (order: any): boolean => {
  if (!order) return false;

  // Log des détails de la commande pour déboguer
  console.log(`Vérification de la commande ID ${order.id}:`);
  console.log(`  - Status: "${order.payment_status || "Non défini"}"`);
  console.log(`  - Montant total: ${order.total}`);
  console.log(`  - Montant payé: ${order.paid_amount}`);
  console.log(`  - Montant dû: ${order.due_amount}`);

  // Vérifier le statut de paiement (plusieurs variantes possibles)
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

interface Customer {
  id: number;
  name: string;
  user_type: string;
  // Autres propriétés optionnelles
  email?: string;
  phone?: string;
  warehouse_id?: number;
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
  customer_name?: string;
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

const PaymentEntrant: React.FC = () => {
  const { selectedWarehouse } = useSelection();
  const [loading, setLoading] = useState<boolean>(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [currentCustomerName, setCurrentCustomerName] = useState<string>("");
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
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [loadingPaymentModes, setLoadingPaymentModes] = useState(false);
  // État local pour gérer l'ID du magasin sélectionné
  const [currentWarehouseId, setCurrentWarehouseId] = useState<number | null>(
    null
  );
  // @ts-ignore - Context from JS file
  const { user, hasPermission } = useAuth(); // Get user object and hasPermission from AuthContext

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
        payment_type: "in",
        page: pagination.current,
        limit: pagination.pageSize,
      };

      // Utiliser currentWarehouseId au lieu de selectedWarehouse
      console.log("[fetchPayments] currentWarehouseId:", currentWarehouseId);

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId;
        console.log(
          `[fetchPayments] Filtering by warehouse_id: ${currentWarehouseId}`
        );
      }

      if (searchText) {
        params.search = searchText;
      }

      if (selectedCustomer) {
        params.customer_id = selectedCustomer;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format("YYYY-MM-DD");
        params.date_to = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await axios.get("/api/payments", { params });

      // Enrichir les données des paiements avec les noms des clients
      const paymentsData = response.data.payments;

      // Si nous avons des paiements et des clients
      if (paymentsData.length > 0 && customers.length > 0) {
        // Créer un dictionnaire des clients pour une recherche rapide
        const clientsMap = customers.reduce(
          (map: Record<number, Customer>, client: Customer) => {
            map[client.id] = client;
            return map;
          },
          {}
        );

        // Enrichir chaque paiement avec le nom du client si disponible
        const enrichedPayments = paymentsData.map((payment: any) => {
          // Si le paiement a un user_id et que ce user_id correspond à un client dans notre map
          if (payment.user_id && clientsMap[payment.user_id]) {
            return {
              ...payment,
              entity_name:
                clientsMap[payment.user_id].name || payment.entity_name,
            };
          }
          return payment;
        });

        setPayments(enrichedPayments);
      } else {
        setPayments(paymentsData);
      }

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
    selectedCustomer,
    dateRange,
    customers,
  ]);

  // Ajouter cette fonction pour récupérer les détails d'un magasin
  const fetchWarehouseInfo = useCallback(async (warehouseId: number | null) => {
    if (!warehouseId) return null;
    try {
      const response = await axios.get(`/api/warehouses/${warehouseId}`);
      console.log(
        `Détails du magasin ${warehouseId} récupérés:`,
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des détails du magasin ${warehouseId}:`,
        error
      );
      return null;
    }
  }, []);

  // Charger les clients
  const fetchCustomers = useCallback(async () => {
    // Ne pas charger les clients si aucun magasin n'est sélectionné
    if (!currentWarehouseId) {
      console.log("Aucun magasin sélectionné, réinitialisation des clients");
      setCustomers([]);
      return;
    }

    try {
      const params: any = {};

      // Utiliser currentWarehouseId
      console.log("Type de currentWarehouseId:", typeof currentWarehouseId);

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId; // Utiliser warehouse_id au lieu de warehouseId
        console.log(
          `[fetchCustomers] Filtering by warehouse_id: ${currentWarehouseId}`
        );

        // Récupérer les détails du magasin pour avoir l'ID de l'entreprise
        const warehouseInfo = await fetchWarehouseInfo(currentWarehouseId);
        if (warehouseInfo && warehouseInfo.company_id) {
          params.company_id = warehouseInfo.company_id; // Utiliser company_id au lieu de companyId
          console.log(
            `[fetchCustomers] Filtering by company_id: ${warehouseInfo.company_id}`
          );
        }
      } else {
        console.log(
          "[fetchCustomers] No warehouse selected, fetching all customers"
        );
      }

      const response = await axios.get("/api/users/customers", { params });
      console.log("Clients récupérés:", response.data);

      // Transformer les données pour correspondre à l'interface Customer
      const formattedCustomers = response.data.map((customer: any) => {
        // Extraire correctement le warehouse_id en considérant différentes sources possibles
        let warehouseId = null;
        if (customer.warehouse_id) {
          warehouseId = Number(customer.warehouse_id);
        } else if (customer.detail_warehouse_id) {
          warehouseId = Number(customer.detail_warehouse_id);
        } else if (customer.user_detail_id && customer.detail_warehouse_id) {
          warehouseId = Number(customer.detail_warehouse_id);
        }

        return {
          id: customer.id,
          name: customer.name,
          user_type: customer.user_type,
          email: customer.email,
          phone: customer.phone,
          warehouse_id: warehouseId,
        };
      });

      // S'il y a un magasin sélectionné, filtrer les clients
      if (currentWarehouseId) {
        // Appliquer un filtrage côté client pour plus de sécurité
        console.log(
          `Filtrage des clients pour le magasin ID: ${currentWarehouseId}`
        );

        // Filtrer les clients qui appartiennent au magasin sélectionné
        // Note: Cette approche est redondante si l'API filtre déjà correctement,
        // mais peut servir de validation supplémentaire
        const filteredCustomers = formattedCustomers.filter(
          (customer: Customer) => customer.warehouse_id === currentWarehouseId
        );

        console.log(
          `${filteredCustomers.length} clients trouvés pour le magasin ${currentWarehouseId} sur ${formattedCustomers.length} total`
        );
        setCustomers(filteredCustomers);
      } else {
        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      message.error("Erreur lors du chargement des clients");
    }
  }, [currentWarehouseId, fetchWarehouseInfo]);

  // Charger les modes de paiement
  const fetchPaymentModes = useCallback(async () => {
    console.log(
      "[fetchPaymentModes] Début du chargement des modes de paiement"
    );
    setLoadingPaymentModes(true);

    // Ne pas charger les modes de paiement si aucun magasin n'est sélectionné
    if (!currentWarehouseId) {
      console.log(
        "Aucun magasin sélectionné, réinitialisation des modes de paiement"
      );
      setPaymentModes([]);
      setLoadingPaymentModes(false);
      return;
    }

    try {
      const params: any = {};

      if (currentWarehouseId) {
        console.log(
          `[fetchPaymentModes] currentWarehouseId: ${currentWarehouseId}`
        );

        // Récupérer les détails du magasin pour avoir l'ID de l'entreprise
        const warehouseInfo = await fetchWarehouseInfo(currentWarehouseId);
        console.log("[fetchPaymentModes] warehouseInfo:", warehouseInfo);

        if (warehouseInfo && warehouseInfo.company_id) {
          params.company_id = warehouseInfo.company_id;
          console.log(
            `[fetchPaymentModes] Filtrage par company_id: ${warehouseInfo.company_id}`
          );
        } else {
          console.warn(
            "[fetchPaymentModes] Pas de company_id trouvé pour ce magasin"
          );
        }
      }

      console.log("[fetchPaymentModes] Appel API avec params:", params);
      const response = await axios.get("/api/payment-modes", { params });

      if (response.data && response.data.paymentModes) {
        console.log(
          "[fetchPaymentModes] Modes de paiement récupérés:",
          response.data.paymentModes
        );
        setPaymentModes(response.data.paymentModes);
      } else if (Array.isArray(response.data)) {
        console.log(
          "[fetchPaymentModes] Modes de paiement récupérés (format alternatif):",
          response.data
        );
        setPaymentModes(response.data);
      } else {
        console.warn(
          "[fetchPaymentModes] Format de réponse inattendu:",
          response.data
        );
        setPaymentModes([]);
      }
    } catch (error) {
      console.error(
        "[fetchPaymentModes] Erreur lors du chargement des modes de paiement:",
        error
      );
      message.error("Erreur lors du chargement des modes de paiement");
      setPaymentModes([]);
    } finally {
      setLoadingPaymentModes(false);
      console.log(
        "[fetchPaymentModes] Fin du chargement des modes de paiement"
      );
    }
  }, [currentWarehouseId, fetchWarehouseInfo]);

  // Charger les commandes non payées pour un client
  const fetchUnpaidOrders = useCallback(
    async (customerId: number) => {
      if (!customerId) {
        console.log("Aucun client sélectionné, retournant un tableau vide");
        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      }

      setLoading(true);
      try {
        // Trouver le nom du client si ce n'est pas déjà fait
        let clientName = currentCustomerName;
        if (!clientName) {
          const client = customers.find((c) => c.id === customerId);
          if (client) {
            clientName = client.name;
            setCurrentCustomerName(client.name);
          }
        }

        console.log(
          `Récupération des commandes pour le client ${clientName} (ID: ${customerId})`
        );

        // Premier essai avec les paramètres explicites pour inclure les commandes non payées et partiellement payées
        let result = await tryFetchOrders(customerId, {
          payment_status: "all", // Demander tous les statuts de paiement
          include_unpaid: true, // Inclure explicitement les commandes non payées
        });

        // Si aucune commande n'est trouvée, essayer avec un autre filtre plus spécifique
        if (result.orders.length === 0) {
          console.log(
            "Aucune commande trouvée avec le filtre payment_status=all, essai avec partial,unpaid"
          );
          result = await tryFetchOrders(customerId, {
            payment_status: "partial,unpaid",
          });
        }

        // Si toujours aucune commande, essayer sans filtres
        if (result.orders.length === 0) {
          console.log(
            "Aucune commande trouvée avec le filtre payment_status=partial,unpaid, essai sans filtres"
          );
          result = await tryFetchOrders(customerId, {});
        }

        // Si toujours aucune commande, essayer avec l'API des commandes (orders) directement
        if (result.orders.length === 0) {
          console.log(
            "Dernier recours: essai avec l'API des commandes (orders) directement"
          );
          try {
            const ordersResponse = await axios.get(`/api/orders`, {
              params: {
                user_id: customerId,
                order_type: "sales",
              },
            });
            console.log("Réponse de l'API des commandes:", ordersResponse.data);

            if (
              ordersResponse.data &&
              ordersResponse.data.orders &&
              ordersResponse.data.orders.length > 0
            ) {
              // S'assurer que les commandes appartiennent bien au client sélectionné
              const customerOrders = ordersResponse.data.orders.filter(
                (order: any) => {
                  const orderCustomerId =
                    order.customer_id || order.user_id || order.entity_id;
                  return Number(orderCustomerId) === Number(customerId);
                }
              );

              console.log(
                `${customerOrders.length} commandes du client ID ${customerId} trouvées`
              );

              const filteredDirectOrders =
                customerOrders.filter(orderNeedsPayment);
              console.log(
                `${filteredDirectOrders.length} commandes à régler trouvées via l'API des commandes`
              );

              if (filteredDirectOrders.length > 0) {
                const ordersWithDetails = filteredDirectOrders.map(
                  (order: any) => ({
                    ...order,
                    selected: false,
                    payment_amount: order.due_amount || 0,
                    customer_name: clientName || "Client inconnu",
                  })
                );

                setUnpaidOrders(ordersWithDetails);
                setLoading(false);
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

        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      } catch (error) {
        console.error(
          "Erreur lors du chargement des commandes non payées:",
          error
        );
        message.error("Erreur lors du chargement des commandes non payées");
        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      } finally {
        setLoading(false);
      }
    },
    [currentWarehouseId, customers, currentCustomerName]
  );

  // Fonction auxiliaire pour essayer de récupérer les commandes avec différents paramètres
  const tryFetchOrders = async (
    customerId: number,
    additionalParams: any = {}
  ) => {
    if (!customerId) {
      console.log("Aucun client spécifié, retournant un tableau vide");
      return { orders: [], count: 0 };
    }

    try {
      const params: any = {
        ...additionalParams,
        include_unpaid: true,
        payment_status: additionalParams.payment_status || "all",
      };

      if (currentWarehouseId) {
        params.warehouse_id = currentWarehouseId;
      }

      console.log(`Appel API avec params:`, params);
      const response = await axios.get(
        `/api/payments/unpaid-orders/customer/${customerId}`,
        { params }
      );

      console.log(
        `Réponse API pour les commandes du client ID=${customerId}:`,
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
        response.data.forEach((order: any) => {
          if (order.payment_status) {
            statusSet.add(order.payment_status);
          }
        });
        console.log(
          "Statuts de paiement présents dans les données:",
          Array.from(statusSet)
        );
      }

      // Les commandes retournées appartiennent déjà au client, pas besoin de filtrer à nouveau
      const customerOrders = response.data;

      // Log des statuts de paiement avant filtrage
      const statusCounts: Record<string, number> = {};
      customerOrders.forEach((order: any) => {
        const status = order.payment_status || "Non défini";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(
        "Répartition des statuts de paiement avant filtrage:",
        statusCounts
      );

      // Filtrer les commandes qui ont besoin d'un paiement
      const filteredOrders = customerOrders.filter((order: any) => {
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
        `${customerOrders.length} commandes du client, ${filteredOrders.length} après filtrage des statuts de paiement`
      );

      // Si des commandes sont trouvées après filtrage
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

        // Trouver le nom du client
        let clientName = currentCustomerName;
        if (!clientName) {
          const client = customers.find((c) => c.id === customerId);
          if (client) {
            clientName = client.name;
          }
        }

        // Mettre à jour l'état avec les commandes trouvées
        const ordersWithDetails = filteredOrders.map((order: any) => ({
          ...order,
          selected: false,
          payment_amount: order.due_amount || 0,
          customer_name: clientName || "Client inconnu",
        }));

        console.log(
          "Mise à jour de unpaidOrders avec les commandes trouvées:",
          ordersWithDetails.length,
          "commandes"
        );
        setUnpaidOrders(ordersWithDetails);

        return { orders: filteredOrders, count: filteredOrders.length };
      } else {
        // Aucune commande trouvée après filtrage
        setUnpaidOrders([]);
        return { orders: [], count: 0 };
      }
    } catch (error) {
      console.error("Erreur dans tryFetchOrders:", error);
      return { orders: [], count: 0 };
    }
  };

  // Charger les détails d'un paiement
  const fetchPaymentDetails = useCallback(
    async (paymentId: number) => {
      setLoading(true);
      try {
        // Récupérer les détails du paiement
        const response = await axios.get(`/api/payments/${paymentId}`);
        const paymentData = response.data;

        console.log("Détails du paiement récupérés:", paymentData);

        // Enrichir les données du paiement avec le nom du client
        if (paymentData.user_id && customers.length > 0) {
          // Rechercher le client dans notre liste de clients
          const client = customers.find((c) => c.id === paymentData.user_id);
          if (client) {
            paymentData.customer_name = client.name;
            paymentData.entity_name = client.name;
            console.log("Client trouvé dans la liste:", client.name);
          } else {
            // Si le client n'est pas dans notre liste, essayer de le récupérer depuis l'API
            try {
              const clientResponse = await axios.get(
                `/api/users/${paymentData.user_id}`
              );
              console.log(
                "Détails du client récupérés depuis l'API:",
                clientResponse.data
              );
              paymentData.customer_name = clientResponse.data.name;
              paymentData.entity_name = clientResponse.data.name;
            } catch (clientError) {
              console.error(
                "Erreur lors de la récupération des détails du client:",
                clientError
              );
            }
          }
        }

        // Si le paiement a des commandes associées et que nous n'avons pas encore trouvé le client
        if (
          !paymentData.customer_name &&
          paymentData.orders &&
          paymentData.orders.length > 0
        ) {
          const firstOrder = paymentData.orders[0];
          console.log("Première commande associée:", firstOrder);

          if (firstOrder.user_id) {
            // Rechercher d'abord dans notre liste de clients
            const client = customers.find((c) => c.id === firstOrder.user_id);
            if (client) {
              paymentData.customer_name = client.name;
              paymentData.entity_name = client.name;
              console.log(
                "Client trouvé dans la liste via la commande:",
                client.name
              );
            } else {
              // Sinon, récupérer depuis l'API
              try {
                const clientResponse = await axios.get(
                  `/api/users/${firstOrder.user_id}`
                );
                console.log(
                  "Détails du client récupérés via la commande:",
                  clientResponse.data
                );
                paymentData.customer_name = clientResponse.data.name;
                paymentData.entity_name = clientResponse.data.name;
              } catch (clientError) {
                console.error(
                  "Erreur lors de la récupération des détails du client:",
                  clientError
                );
              }
            }
          }
        }

        setCurrentPayment(paymentData);
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
    },
    [customers]
  );

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

  // Gérer le changement de client
  const handleCustomerChange = (value: number) => {
    setSelectedCustomer(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Gérer le changement de date
  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    setPagination({ ...pagination, current: 1 });
  };

  // Effet pour recharger les données quand currentWarehouseId change
  useEffect(() => {
    console.log("currentWarehouseId changed:", currentWarehouseId);

    // Recharger les clients, les paiements et les modes de paiement quand le magasin change
    // Ces fonctions ont maintenant leur propre logique de vérification de currentWarehouseId
    fetchCustomers();
    fetchPayments();
    fetchPaymentModes();
  }, [currentWarehouseId, fetchCustomers, fetchPayments, fetchPaymentModes]);

  // Ouvrir le modal pour ajouter un paiement
  const openAddModal = () => {
    if (!currentWarehouseId) {
      Modal.warning({
        title: "Magasin non sélectionné",
        content:
          "Veuillez sélectionner un magasin avant de créer ou modifier un paiement.",
      });
      return;
    }
    setEditMode(false);
    form.resetFields();

    // Recharger les modes de paiement pour le magasin actuel
    fetchPaymentModes();

    // Ajouter des valeurs par défaut pour éviter l'avertissement "form not connected"
    form.setFieldsValue({
      payment_date: dayjs(),
      amount: 0,
      customer_id: undefined,
      payment_mode_id: undefined,
      notes: "",
    });

    setUnpaidOrders([]);
    setCurrentCustomerName("");
    setModalVisible(true);
  };

  // Ouvrir le modal pour éditer un paiement
  const openEditModal = async (record: Payment) => {
    if (!currentWarehouseId) {
      Modal.warning({
        title: "Magasin non sélectionné",
        content:
          "Veuillez sélectionner un magasin avant de créer ou modifier un paiement.",
      });
      return;
    }
    setEditMode(true);
    setLoading(true);
    try {
      console.log(`[openEditModal] Chargement du paiement ID: ${record.id}`);

      // Charger les modes de paiement pour le magasin actuel
      await fetchPaymentModes();

      // Charger les détails du paiement
      const response = await axios.get(`/api/payments/${record.id}`);
      const payment = response.data;
      console.log("[openEditModal] Détails du paiement:", payment);
      setCurrentPayment(payment);

      // Trouver le nom du client
      if (payment.entity_id || payment.user_id) {
        const clientId = payment.entity_id || payment.user_id;
        console.log(`[openEditModal] Recherche du client ID: ${clientId}`);

        const client = customers.find((c) => c.id === clientId);
        if (client) {
          console.log(
            `[openEditModal] Client trouvé dans la liste: ${client.name}`
          );
          setCurrentCustomerName(client.name);
        } else {
          try {
            console.log(
              `[openEditModal] Client non trouvé dans la liste, récupération depuis l'API`
            );
            const clientResponse = await axios.get(`/api/users/${clientId}`);
            if (clientResponse.data && clientResponse.data.name) {
              console.log(
                `[openEditModal] Client récupéré depuis l'API: ${clientResponse.data.name}`
              );
              setCurrentCustomerName(clientResponse.data.name);
            }
          } catch (error) {
            console.error(
              "Erreur lors de la récupération des détails du client:",
              error
            );
          }
        }

        // Charger les commandes non payées pour ce client
        await fetchUnpaidOrders(clientId);
      }

      // Préremplir le formulaire
      form.setFieldsValue({
        customer_id: payment.entity_id || payment.user_id,
        payment_date: dayjs(payment.date),
        payment_mode_id: payment.payment_mode_id,
        amount: payment.amount,
        notes: payment.notes,
      });

      console.log("[openEditModal] Formulaire prérempli:", {
        customer_id: payment.entity_id || payment.user_id,
        payment_date: payment.date,
        payment_mode_id: payment.payment_mode_id,
        amount: payment.amount,
      });

      // Marquer les commandes associées comme sélectionnées
      if (payment.orders && payment.orders.length > 0) {
        console.log(
          `[openEditModal] ${payment.orders.length} commandes associées trouvées`
        );
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

  // Gérer le changement de client dans le formulaire
  const handleFormCustomerChange = async (value: number) => {
    form.setFieldsValue({ customer_id: value });

    // Si la valeur est undefined, réinitialiser
    if (!value) {
      setCurrentCustomerName("");
      setUnpaidOrders([]);
      return;
    }

    message.info({
      content: "Chargement des commandes à régler...",
      key: "unpaidOrdersLoading",
      duration: 0,
    });

    try {
      // Trouver le nom du client
      const client = customers.find((c) => c.id === value);
      if (client) {
        setCurrentCustomerName(client.name);
      }

      const result = await fetchUnpaidOrders(value);
      message.destroy("unpaidOrdersLoading");

      console.log(
        `Résultat de fetchUnpaidOrders: ${result.count} commandes trouvées`
      );

      // Afficher un message basé sur le résultat
      if (result.count > 0) {
        message.success(
          `${result.count} commandes à régler trouvées pour ${currentCustomerName}`
        );
      } else {
        message.info(
          `Aucune commande à régler trouvée pour ${currentCustomerName}`
        );
      }
    } catch (error) {
      console.error("Erreur lors du changement de client:", error);
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

  // NOUVEAU: Calculer le montant total DÛ des commandes sélectionnées
  const calculateTotalDueOfSelectedOrders = () => {
    return unpaidOrders
      .filter((o) => o.selected)
      .reduce((sum, order) => sum + (order.due_amount || 0), 0);
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

    // Calculer le total des montants sélectionnés
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
    try {
      // Vérifier que le magasin est sélectionné
      if (!currentWarehouseId) {
        message.error(
          "Veuillez sélectionner un magasin avant de créer ou modifier un paiement"
        );
        setLoading(false);
        return;
      }

      const warehouseId = Number(currentWarehouseId);
      const warehouseInfo = await fetchWarehouseInfo(warehouseId);

      if (!warehouseInfo) {
        message.error("Impossible de récupérer les informations du magasin");
        setLoading(false);
        return;
      }

      // Préparer les données du paiement
      const paymentData = {
        company_id: warehouseInfo.company_id || 1,
        warehouse_id: warehouseId,
        payment_type: "in",
        date: values.payment_date.format("YYYY-MM-DD"),
        amount: values.amount,
        payment_mode_id: values.payment_mode_id,
        user_id: values.customer_id,
        notes: values.notes,
        orders: selectedOrders,
      };

      console.log("Données du paiement:", paymentData);

      if (editMode && currentPayment) {
        await axios.put(`/api/payments/${currentPayment.id}`, paymentData);
        message.success("Paiement mis à jour avec succès");
      } else {
        await axios.post("/api/payments", paymentData);
        message.success("Paiement créé avec succès");
      }

      setModalVisible(false);
      fetchPayments();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      message.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un paiement
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce paiement ?",
      content: "Cette action est irréversible.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        setLoading(true);
        try {
          await axios.delete(`/api/payments/${id}`);
          message.success("Paiement supprimé avec succès");
          fetchPayments();
        } catch (error) {
          console.error("Erreur lors de la suppression du paiement:", error);
          message.error("Erreur lors de la suppression du paiement");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // New functions for multi-selection and export
  const handlePaymentSelection = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds((prev) => [...prev, id]);
    } else {
      setSelectedPaymentIds((prev) =>
        prev.filter((paymentId) => paymentId !== id)
      );
    }
  };

  const handleSelectAllPayments = (checked: boolean) => {
    if (checked) {
      const allIds = payments.map((payment) => payment.id);
      setSelectedPaymentIds(allIds);
    } else {
      setSelectedPaymentIds([]);
    }
  };

  const handleMultipleDelete = () => {
    if (selectedPaymentIds.length === 0) return;
    Modal.confirm({
      title: `Êtes-vous sûr de vouloir supprimer ${selectedPaymentIds.length} paiement(s) ?`,
      content: "Cette action est irréversible.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        setLoading(true);
        try {
          const deletePromises = selectedPaymentIds.map((id) =>
            axios.delete(`/api/payments/${id}`)
          );
          await Promise.all(deletePromises);
          message.success(
            `${selectedPaymentIds.length} paiement(s) supprimé(s) avec succès`
          );
          fetchPayments();
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

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      message.loading({
        content: "Préparation de l'export Excel...",
        key: "exportLoading",
      });
      const params: any = {
        payment_type: "in",
        page: 1,
        limit: 1000,
      };
      if (currentWarehouseId) {
        params.warehouse_id = Number(currentWarehouseId);
      }
      if (searchText) {
        params.search = searchText;
      }
      if (selectedCustomer) {
        params.customer_id = selectedCustomer;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format("YYYY-MM-DD");
        params.date_to = dateRange[1].format("YYYY-MM-DD");
      }
      const response = await axios.get("/api/payments", { params });
      const dataToExport = response.data.payments;
      const formattedData = dataToExport.map((payment: Payment) => ({
        Date: dayjs(payment.date).format("DD/MM/YYYY"),
        "No Transaction": payment.payment_number,
        Client: payment.entity_name,
        Magasin: payment.warehouse_name,
        "Mode de paiement": payment.payment_mode_name,
        Montant: payment.amount,
        Devise: "XOF",
        Entreprise: payment.company_name,
      }));
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements Entrants");
      const columnWidths = [
        { wch: 12 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 8 },
        { wch: 20 },
        { wch: 20 },
      ];
      worksheet["!cols"] = columnWidths;
      const today = dayjs().format("YYYY-MM-DD");
      XLSX.writeFile(workbook, `Paiements_Entrants_${today}.xlsx`);
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
    },
    {
      title: "No Transaction",
      dataIndex: "payment_number",
      key: "payment_number",
    },
    {
      title: "Client",
      dataIndex: "entity_name",
      key: "entity_name",
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
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) =>
        typeof text === "number"
          ? text.toLocaleString("fr-FR", { style: "currency", currency: "XOF" })
          : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Payment) => (
        <Space size="small">
          {hasPermission(
            "Gestion Commerciale.Ventes.PaiementsEntrants.view"
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
            "Gestion Commerciale.Ventes.PaiementsEntrants.edit"
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
            "Gestion Commerciale.Ventes.PaiementsEntrants.delete"
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

  // Vérifier si l'utilisateur a la permission de voir le module
  if (!hasPermission("Gestion Commerciale.Ventes.PaiementsEntrants.view")) {
    return (
      <Layout className="site-layout">
        <Content style={{ margin: "0 16px" }}>
          <div style={{ padding: 24, minHeight: 360 }}>
            <Title level={2}>Paiements Entrants</Title>
            <p>
              Vous n'avez pas les permissions nécessaires pour voir cette
              section.
            </p>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="site-layout">
      <Content style={{ margin: "0 16px" }}>
        <div className="p-3 md:p-6 min-h-[360px]">
          <Title level={2}>Paiements Entrants</Title>

          {/* Message informatif si aucun magasin n'est sélectionné */}
          {!currentWarehouseId && (
            <Card className="mb-4">
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Typography.Title level={4} type="secondary">
                  Sélection de magasin requise
                </Typography.Title>
                <Typography.Text type="secondary">
                  Veuillez sélectionner un magasin dans le menu en haut à droite
                  pour afficher et gérer les paiements entrants.
                </Typography.Text>
              </div>
            </Card>
          )}

          {/* Filtres - Affichés seulement si un magasin est sélectionné */}
          {currentWarehouseId && (
            <Card className="mb-4">
              <Row
                gutter={16}
                className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-2"
              >
                <Col xs={24} sm={12} md={6} className="w-full sm:flex-1">
                  <Input
                    placeholder="Rechercher par No Transaction"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                  />
                </Col>
                <Col xs={24} sm={12} md={6} className="w-full sm:flex-1">
                  <Select
                    placeholder="Filtrer par client"
                    className="w-full"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    onChange={handleCustomerChange}
                    value={selectedCustomer}
                  >
                    {customers
                      // Ne plus filtrer les clients par magasin, afficher tous les clients
                      .map((customer) => (
                        <Option key={customer.id} value={customer.id}>
                          {customer.name}
                        </Option>
                      ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6} className="w-full sm:flex-1">
                  <RangePicker
                    style={{ width: "100%", marginBottom: 8 }}
                    onChange={handleDateChange}
                    value={dateRange}
                    format="DD/MM/YYYY"
                  />
                </Col>
                <Col
                  xs={24}
                  sm={24}
                  md={6}
                  className="w-full md:w-auto md:ml-auto"
                >
                  <div className="flex flex-col sm:flex-row gap-2 justify-end md:flex-nowrap">
                    <Button
                      icon={<FileExcelOutlined style={{ color: "#217346" }} />}
                      onClick={handleExportToExcel}
                      className="w-full sm:w-auto"
                    >
                      Exporter sur Excel
                    </Button>
                    {hasPermission(
                      "Gestion Commerciale.Ventes.PaiementsEntrants.create"
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
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Bouton de suppression multiple - Affiché seulement si un magasin est sélectionné */}
          {currentWarehouseId &&
            selectedPaymentIds.length > 0 &&
            hasPermission(
              "Gestion Commerciale.Ventes.PaiementsEntrants.delete"
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
                scroll={{ x: "max-content" }}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "30", "40", "50"],
                }}
                onChange={handleTableChange}
                loading={loading}
              />
            </div>
          )}

          {/* Modal pour ajouter/éditer un paiement */}
          <Modal
            title={editMode ? "Modifier le paiement" : "Nouveau paiement"}
            visible={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width="90%"
            style={{ maxWidth: "1600px" }}
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
                    name="customer_id"
                    label="Client"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez sélectionner un client",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Sélectionner un client"
                      showSearch
                      optionFilterProp="children"
                      onChange={handleFormCustomerChange}
                      disabled={editMode}
                    >
                      {customers
                        // Ne plus filtrer les clients par magasin, afficher tous les clients
                        .map((customer) => (
                          <Option key={customer.id} value={customer.id}>
                            {customer.name}
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
                    extra={
                      !currentWarehouseId
                        ? "Veuillez sélectionner un magasin pour voir les modes de paiement associés"
                        : ""
                    }
                  >
                    <Select
                      placeholder={
                        currentWarehouseId
                          ? "Sélectionner un mode de paiement"
                          : "Veuillez d'abord sélectionner un magasin"
                      }
                      loading={loadingPaymentModes}
                      disabled={!currentWarehouseId || loadingPaymentModes}
                      showSearch
                      optionFilterProp="children"
                      notFoundContent={
                        loadingPaymentModes ? (
                          <Spin size="small" />
                        ) : paymentModes.length === 0 ? (
                          "Aucun mode de paiement trouvé"
                        ) : null
                      }
                    >
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
                      onChange={(value) => {
                        const numericValue = Number(value);
                        if (!isNaN(numericValue)) {
                          const totalDueSelected =
                            calculateTotalDueOfSelectedOrders();
                          const selectedOrdersCount = unpaidOrders.filter(
                            (o) => o.selected
                          ).length;

                          if (
                            selectedOrdersCount > 0 &&
                            numericValue > totalDueSelected
                          ) {
                            form.setFieldsValue({ amount: totalDueSelected });
                            message.info(
                              `Le montant du paiement a été ajusté pour ne pas dépasser le total dû des commandes sélectionnées (${totalDueSelected.toLocaleString(
                                "fr-FR"
                              )} XOF).`
                            );
                          } else {
                            form.setFieldsValue({ amount: numericValue });
                          }
                        } else {
                          form.setFieldsValue({ amount: 0 }); // Ou undefined, selon la préférence
                        }
                      }}
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
                    Commandes à payer
                    {currentCustomerName ? ` - ${currentCustomerName}` : ""}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    Sélectionnez les commandes à payer et ajustez le montant si
                    nécessaire. Toutes les commandes affichées appartiennent au
                    client {currentCustomerName}.
                  </Text>
                  <Alert
                    message="Information importante !"
                    description="Veuillez vérifier que toutes les commandes appartiennent bien au client sélectionné."
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
                      scroll={{ x: 1000 }}
                      style={{ minWidth: "100%" }}
                      rowClassName={(record) =>
                        orderNeedsPayment(record) ? "order-needs-payment" : ""
                      }
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
                          title: "Client",
                          dataIndex: "customer_name",
                          key: "customer_name",
                          width: 150,
                          render: (_: any) => (
                            <Tag color="green">
                              {currentCustomerName || "Inconnu"}
                            </Tag>
                          ),
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
                        },
                        {
                          title: "Statut",
                          dataIndex: "payment_status",
                          key: "payment_status",
                          width: 140,
                          render: (status: string) => {
                            let color = "default";
                            if (status && status.toLowerCase().includes("non"))
                              color = "red";
                            else if (
                              status &&
                              status.toLowerCase().includes("partiel")
                            )
                              color = "orange";
                            return (
                              <Tag color={color}>{status || "Non défini"}</Tag>
                            );
                          },
                        },
                        {
                          title: "Montant total",
                          dataIndex: "total",
                          key: "total",
                          render: (text: number) =>
                            text.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                            }),
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
                        },
                        {
                          title: "Montant à payer",
                          dataIndex: "payment_amount",
                          key: "payment_amount",
                          render: (_: any, record: Order) => (
                            <InputNumber
                              disabled={!record.selected}
                              value={record.payment_amount}
                              onChange={(value) =>
                                handleOrderAmountChange(
                                  record.id,
                                  value as number
                                )
                              }
                              min={0}
                              max={record.due_amount}
                              style={{ width: "100%" }}
                              formatter={(value) =>
                                value
                                  ? `${value}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      " "
                                    )
                                  : ""
                              }
                              parser={(value: any) =>
                                value ? Number(value.replace(/\s/g, "")) : 0
                              }
                            />
                          ),
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
              ) : form.getFieldValue("customer_id") ? (
                <Alert
                  type="info"
                  message="Aucune commande à payer"
                  description="Ce client n'a aucune commande non payée ou partiellement payée en attente de règlement."
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
                        <UserOutlined /> <strong>Client:</strong>{" "}
                        {currentPayment.customer_name ||
                          currentPayment.entity_name ||
                          "Client inconnu"}
                      </p>
                      <p>
                        <BankOutlined /> <strong>Mode de paiement:</strong>{" "}
                        {currentPayment.payment_mode_name}
                      </p>
                      <p>
                        <strong>Montant:</strong>{" "}
                        {typeof currentPayment.amount === "number"
                          ? currentPayment.amount.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                            })
                          : "N/A"}
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
                            key: "total",
                            render: (text: number) =>
                              typeof text === "number"
                                ? text.toLocaleString("fr-FR", {
                                    style: "currency",
                                    currency: "XOF",
                                  })
                                : "N/A",
                          },
                          {
                            title: "Montant payé",
                            dataIndex: "amount_applied",
                            key: "amount",
                            render: (text: number) =>
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

export default PaymentEntrant;
