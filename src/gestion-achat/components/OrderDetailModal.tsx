import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  Modal,
  Button,
  Row,
  Col,
  Table,
  Progress,
  message,
  Card,
  Divider,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { OrderDetailModalProps } from "../types";
import PaymentFormModal from "./PaymentFormModal";
import { formatNumber } from "../utils";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../utils/permissionUtils";

const { Text } = Typography;

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
  // States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localOrder, setLocalOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const checkPermission = usePermission();

  // Debug the incoming props
  useEffect(() => {
    if (visible) {
      console.log("OrderDetailModal opened with order:", order?.id);
    }
  }, [visible, order]);

  // Function to fetch order items (using useCallback for stability)
  const fetchOrderItems = useCallback(async (orderId: number) => {
    if (!orderId) return;
    console.log(`Fetching order items for order ${orderId}...`);
    setLoadingItems(true);
    setError(null);
    try {
      const response = await axios.get(`/api/orders/${orderId}/items`);
      console.log("Order items response:", response.data);
      setOrderItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching order items:", error);
      message.error("Impossible de charger les produits de cet achat");
      setError("Erreur lors du chargement des produits");
      setOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []); // Empty dependency array as it doesn't depend on component state/props

  // Function to fetch payments for an order (using useCallback)
  const fetchOrderPayments = useCallback(async (orderId: number) => {
    if (!orderId) return;
    console.log(
      `[fetchOrderPayments] Fetching payments for order ${orderId}...`
    );
    setLoadingPayments(true);
    setError(null);
    try {
      // Use the specific endpoint if available, otherwise use the general one with filter
      const response = await axios.get(`/api/payments`, {
        params: { order_id: orderId },
      });
      console.log(
        `[fetchOrderPayments] API Response for order ${orderId}:`,
        response.data
      );
      // Assuming the response structure is { payments: [], total: ... }
      setPayments(response.data?.payments || []);
    } catch (error) {
      console.error("[fetchOrderPayments] Error fetching payments:", error);
      setError("Erreur lors du chargement des paiements.");
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, []); // Empty dependency array

  // Initialize the modal with data
  useEffect(() => {
    if (visible && order) {
      console.log("Initializing OrderDetailModal with order data:", order.id);
      setLocalOrder({ ...order }); // Create a copy to avoid direct mutation
      setError(null);
      setPayments([]); // Reset payments
      setOrderItems([]); // Reset items

      // Fetch fresh data when modal opens
      fetchOrderItems(order.id);
      fetchOrderPayments(order.id);
    } else if (!visible) {
      // Reset state when modal closes
      setLocalOrder(null);
      setOrderItems([]);
      setPayments([]);
      setError(null);
    }
  }, [visible, order, fetchOrderItems, fetchOrderPayments]); // Add fetch functions as dependencies

  // Function to reload all data for the current order
  const reloadData = useCallback(async () => {
    if (!localOrder || !localOrder.id) return;
    console.log(`[reloadData] Reloading data for order ${localOrder.id}`);
    setError(null);
    setLoadingItems(true); // Show loading indicators
    setLoadingPayments(true);
    try {
      // Use the passed refreshOrderDetails prop to get the main order object
      const refreshedOrderData = await refreshOrderDetails(
        String(localOrder.id)
      );
      if (refreshedOrderData) {
        console.log(
          "[reloadData] Refreshed order data received:",
          refreshedOrderData.id
        );
        setLocalOrder(refreshedOrderData); // Update local state first
        // Then fetch associated items/payments again
        await Promise.all([
          fetchOrderItems(localOrder.id),
          fetchOrderPayments(localOrder.id),
        ]);
        message.success("Données actualisées.");
      } else {
        throw new Error("refreshOrderDetails did not return updated data.");
      }
    } catch (error) {
      console.error("[reloadData] Error reloading order data:", error);
      message.error("Impossible de rafraîchir les données.");
      setError("Erreur lors de l'actualisation.");
    } finally {
      setLoadingItems(false);
      setLoadingPayments(false);
    }
  }, [localOrder, refreshOrderDetails, fetchOrderItems, fetchOrderPayments]);

  // --- MODIFIED: Callback function after payment is added ---
  const handlePaymentAdded = useCallback(
    async (closeDetailModal = false) => {
      console.log(
        "[handlePaymentAdded] Payment added/processed. Refreshing data..."
      );
      setShowPaymentModal(false); // Ensure payment modal is closed first

      // 1. Reload data for the current detail modal
      await reloadData();

      // 2. Refresh the main purchase list in the background
      await refreshAchats();

      // 3. Optional: Close this detail modal if requested (e.g., by PaymentFormModal)
      // Note: The original PaymentFormModal passed 'true' here, but it might be better
      // to keep the detail modal open so the user sees the updated status.
      // Commenting this out for now.
      // if (closeDetailModal) {
      //   console.log("[handlePaymentAdded] Closing OrderDetailModal as requested.");
      //   onClose();
      // }
    },
    [reloadData, refreshAchats, onClose]
  ); // Dependencies for the callback

  // If modal is not visible or no order data, return null
  if (!visible || !localOrder) return null;

  // Calculate values based on the local order state
  const percentage =
    localOrder.total && localOrder.total > 0
      ? Math.round((localOrder.paid_amount / localOrder.total) * 100)
      : 0;

  // Find supplier name (handle potential case differences or missing suppliers)
  const supplier = fournisseurs?.find(
    (f: any) =>
      f &&
      localOrder &&
      f.id != null &&
      localOrder.user_id != null &&
      Number(f.id) === Number(localOrder.user_id)
  );
  const supplierName = supplier?.name ?? `ID: ${localOrder.user_id ?? "N/A"}`;

  const montantDu = (localOrder.total ?? 0) - (localOrder.paid_amount ?? 0);
  const paymentStatus =
    (localOrder.paid_amount ?? 0) <= 0
      ? "Non payé"
      : (localOrder.paid_amount ?? 0) < (localOrder.total ?? 0)
      ? "Partiellement payé"
      : "Payé";

  // Define table columns for order items
  const detailColumns: any[] = [
    // Add explicit type 'any[]' or define a stricter Column type
    {
      title: "Produit",
      dataIndex: "product_id", // Use product_id from order_items
      key: "produit",
      render: (_: any, record: any) => {
        // Prefer name directly from the item if available (might come from API)
        if (record.product_name) return record.product_name;
        // Fallback to looking up in the produits prop
        const prod = produits?.find(
          (p: any) =>
            p &&
            record.product_id != null &&
            Number(p.id) === Number(record.product_id)
        );
        return prod?.name ?? `Produit ID: ${record.product_id ?? "N/A"}`;
      },
    },
    {
      title: "Qté",
      dataIndex: "quantity",
      key: "quantite",
      align: "right" as const, // FIX: Added 'as const'
    },
    {
      title: "Prix Unit.",
      dataIndex: "unit_price",
      key: "prix_unitaire",
      align: "right" as const, // FIX: Added 'as const'
      render: (value: any) => `${formatNumber(value ?? 0)}`,
    },
    {
      title: "Remise",
      dataIndex: "discount_rate", // Assuming this is the discount amount per unit or total? Check API response
      key: "remise",
      align: "right" as const, // FIX: Added 'as const'
      render: (value: any) => `${formatNumber(value ?? 0)}`, // Display as amount
    },
    {
      title: "Taxe",
      dataIndex: "tax_id", // Use tax_id from order_items
      key: "taxe",
      render: (tax_id: any, record: any) => {
        if (record?.tax_name)
          return `${record.tax_name} (${record.tax_rate ?? 0}%)`; // If name/rate is in item
        if (!tax_id) return "-";
        const tax = taxes?.find((t: any) => t && t.id === tax_id);
        return tax ? `${tax.name} (${tax.rate}%)` : "-";
      },
    },
    {
      title: "Total Ligne",
      dataIndex: "subtotal", // Assuming API provides subtotal per line
      key: "total",
      align: "right" as const, // FIX: Added 'as const'
      render: (value: any) => `${formatNumber(value ?? 0)}`,
    },
  ];

  // Define table columns for payments
  const paymentColumns: any[] = [
    // Add explicit type 'any[]' or define a stricter Column type
    {
      title: "N° Paiement",
      dataIndex: "payment_number",
      key: "payment_number",
      render: (text: string, record: any) => text || record.id || "N/A",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Mode",
      dataIndex: "payment_mode_name", // Should come from the /api/payments?order_id=X response
      key: "payment_mode_name",
      render: (text: string) => text || "-",
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const, // FIX: Added 'as const'
      render: (amount: number) => formatNumber(amount ?? 0),
    },
    {
      title: "Remarques",
      dataIndex: "notes", // Assuming 'notes' field from payments table
      key: "notes",
      ellipsis: true,
      render: (text: string) => text || "-",
    },
  ];

  // Check permissions for adding payment
  const canAddPayment = checkPermission(
    "Gestion Commerciale.Approvisionnement.Achats.Achat.add_payment"
  );

  return (
    <Modal
      visible={visible}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{`Détail Achat - ${
            localOrder.invoice_number || localOrder.id || "..."
          }`}</span>
          <Button
            icon={<ReloadOutlined />}
            onClick={reloadData}
            size="small"
            loading={loadingItems || loadingPayments}
          >
            Actualiser
          </Button>
        </div>
      }
      onCancel={onClose}
      footer={[
        // Show button only if not fully paid, not deleted, and user has permission
        montantDu > 0 && !localOrder.is_deleted && canAddPayment && (
          <Button
            key="payment"
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              console.log(
                "Opening PaymentFormModal with order state:",
                localOrder
              ); // Log state before opening
              setShowPaymentModal(true);
            }}
            disabled={loadingItems || loadingPayments} // Disable if loading
          >
            Ajouter un paiement
          </Button>
        ),
        <Button
          key="download"
          icon={<DownloadOutlined />}
          onClick={() =>
            message.info("Fonctionnalité de téléchargement non implémentée")
          }
        >
          Télécharger PDF
        </Button>,
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
      ]}
      width="85%" // Slightly wider
      style={{ top: 20 }} // Position slightly lower from top
      destroyOnClose // Unmount modal content when closed to reset states
    >
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loadingItems || loadingPayments}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Fournisseur:</Text> {supplierName}{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Date Achat:</Text>{" "}
              {dayjs(localOrder.order_date).format("DD/MM/YYYY")}{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Statut Achat:</Text> {localOrder.order_status}{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Statut Paiement:</Text> {paymentStatus}{" "}
            </Col>
          </Row>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Total:</Text> {formatNumber(localOrder.total)} XOF{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Remise:</Text>{" "}
              {formatNumber(localOrder.discount ?? 0)} XOF{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Taxe:</Text>{" "}
              {formatNumber(localOrder.tax_amount ?? 0)} XOF{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Expédition:</Text>{" "}
              {formatNumber(localOrder.shipping ?? 0)} XOF{" "}
            </Col>
          </Row>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Montant Payé:</Text>{" "}
              <Text type="success">
                {formatNumber(localOrder.paid_amount)} XOF
              </Text>{" "}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {" "}
              <Text strong>Montant Dû:</Text>{" "}
              <Text type={montantDu > 0 ? "danger" : "secondary"}>
                {formatNumber(montantDu)} XOF
              </Text>{" "}
            </Col>
            <Col span={12}>
              <Progress
                percent={percentage}
                status={
                  percentage === 100
                    ? "success"
                    : montantDu > 0
                    ? "active"
                    : "normal"
                }
                strokeColor={montantDu <= 0 ? "#52c41a" : undefined} // Green if paid
              />
            </Col>
          </Row>
        </Card>

        <Divider orientation="left">Produits achetés</Divider>
        {loadingItems ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
          </div>
        ) : orderItems.length > 0 ? (
          <Table
            dataSource={orderItems}
            columns={detailColumns}
            rowKey={(record: any) =>
              record.id || `${record.product_id}-${Math.random()}`
            } // Use unique key
            pagination={false}
            size="small"
            bordered
            summary={(pageData) => {
              let totalSubtotal = pageData.reduce(
                (sum, record) => sum + (record.subtotal ?? 0),
                0
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <Text strong>Total HT</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{formatNumber(totalSubtotal)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        ) : (
          <Alert
            message="Aucun produit trouvé pour cet achat."
            type="info"
            showIcon
          />
        )}

        {/* Show payments section only if user has permission */}
        {checkPermission(
          "Gestion Commerciale.Approvisionnement.Achats.Achat.view_payments"
        ) && (
          <>
            <Divider orientation="left" style={{ marginTop: 24 }}>
              <DollarOutlined /> Paiements associés
            </Divider>
            {loadingPayments ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin />
              </div>
            ) : payments.length > 0 ? (
              <Table
                dataSource={payments}
                columns={paymentColumns}
                rowKey={(record: any) => record.id || Math.random().toString()} // Use unique key
                pagination={false}
                size="small"
                bordered
                summary={(pageData) => {
                  let totalAmount = pageData.reduce(
                    (sum, record) => sum + (record.amount ?? 0),
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total Payé</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{formatNumber(totalAmount)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            ) : (
              <Alert
                message="Aucun paiement enregistré pour cet achat."
                type="info"
                showIcon
              />
            )}
          </>
        )}
      </Spin>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentFormModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={localOrder} // Pass the local state
          onPaymentAdded={handlePaymentAdded} // Use the memoized callback
        />
      )}
    </Modal>
  );
};

export default OrderDetailModal;
