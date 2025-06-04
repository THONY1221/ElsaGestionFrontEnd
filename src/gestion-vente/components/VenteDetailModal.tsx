import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Card,
  Divider,
  message,
  Spin,
  Tabs,
} from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import VentePaymentForm from "./VentePaymentForm";

// Format pour les nombres
const formatNumber = (value: any): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0";
  }
  return Number(value).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

// Composant pour afficher les détails d'un paiement
interface PaymentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  payment: any;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  visible,
  onClose,
  payment,
}) => {
  if (!payment) return null;

  return (
    <Modal
      title={`Détails du paiement #${payment.payment_number}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
      ]}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Numéro de paiement">
          {payment.payment_number}
        </Descriptions.Item>
        <Descriptions.Item label="Date">
          {dayjs(payment.date).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Montant affecté à cette commande">
          {formatNumber(payment.montant_affecte)} CFA
        </Descriptions.Item>
        <Descriptions.Item label="Montant total du paiement">
          {formatNumber(payment.amount)} CFA
        </Descriptions.Item>
        <Descriptions.Item label="Mode de paiement">
          {payment.payment_mode_name}
        </Descriptions.Item>
        {payment.remarks && (
          <Descriptions.Item label="Remarques">
            {payment.remarks}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

interface VenteDetailModalProps {
  order: any;
  visible: boolean;
  onClose: () => void;
  produits: any[];
  taxes: any[];
  clients: any[];
  refreshOrderDetails: (id: number) => Promise<any>;
  refreshSales: () => void;
}

const VenteDetailModal: React.FC<VenteDetailModalProps> = ({
  order,
  visible,
  onClose,
  produits,
  taxes,
  clients,
  refreshOrderDetails,
  refreshSales,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const BASE_URL = "http://localhost:3000";

  // Fonction pour ouvrir les détails d'un paiement
  const openPaymentDetails = (paymentId: number) => {
    console.log("Ouverture des détails du paiement:", paymentId);
    console.log("Paiements disponibles:", payments);

    // Essayer de trouver le paiement avec différents identifiants possibles
    const payment = payments.find(
      (p) =>
        p.payment_id === paymentId ||
        p.order_payment_id === paymentId ||
        p.id === paymentId
    );

    if (payment) {
      console.log("Paiement trouvé:", payment);
      setSelectedPayment(payment);
      setShowPaymentDetail(true);
    } else {
      console.error(
        "Paiement non trouvé. Identifiants disponibles:",
        payments.map((p) => ({
          payment_id: p.payment_id,
          order_payment_id: p.order_payment_id,
          id: p.id,
        }))
      );
      message.error(`Paiement #${paymentId} non trouvé`);
    }
  };

  // Fonction pour fermer le modal de détails du paiement
  const closePaymentDetail = () => {
    setShowPaymentDetail(false);
  };

  // Fonction pour récupérer les paiements liés à la vente
  const fetchOrderPayments = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/orders/${orderId}/payments`
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Paiements récupérés:", data);
      setPayments(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      message.error("Impossible de récupérer les paiements");
    } finally {
      setLoading(false);
    }
  };

  // Charger les paiements quand le modal s'ouvre
  useEffect(() => {
    if (visible && order?.id) {
      fetchOrderPayments(order.id);
    }
  }, [visible, order]);

  // Fonction pour déterminer le statut de paiement
  const getPaymentStatusTag = (status: string) => {
    let color = "";
    switch (status) {
      case "Non payé":
        color = "red";
        break;
      case "Partiellement payé":
      case "Partiel":
        color = "orange";
        break;
      case "Payé":
        color = "green";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  // Trouver le nom du client
  const getClientName = (userId: number) => {
    const client = clients.find((c) => c.id === userId);
    return client
      ? client.name || client.company_name || client.Nom_Raison_Sociale
      : "Client inconnu";
  };

  // Colonnes pour la table des produits
  const productColumns = [
    {
      title: "Produit",
      dataIndex: "product_id",
      key: "product",
      render: (productId: number, record: any) => {
        const product = produits.find(
          (p) => p.id_produit === productId || p.id === productId
        );
        return product
          ? product.nom_produit || product.name
          : record.product_name || "Produit inconnu";
      },
    },
    {
      title: "Quantité",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Prix unitaire HT",
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right" as const,
      render: (price: number) => `${formatNumber(price)} CFA`,
    },
    {
      title: "Montant HT",
      key: "montant_ht",
      align: "right" as const,
      render: (record: any) => {
        const montantHT = (record.unit_price || 0) * (record.quantity || 0);
        return `${formatNumber(montantHT)} CFA`;
      },
    },
    {
      title: "Remise",
      key: "remise",
      align: "right" as const,
      render: (record: any) => {
        const remise = record.discount_rate || record.remise || 0;
        return `${formatNumber(remise)} CFA`;
      },
    },
    {
      title: "Net HT",
      key: "net_ht",
      align: "right" as const,
      render: (record: any) => {
        const montantHT = (record.unit_price || 0) * (record.quantity || 0);
        const remise = record.discount_rate || 0;
        const netHT = montantHT - remise;
        return `${formatNumber(netHT)} CFA`;
      },
    },
    {
      title: "Taxe",
      dataIndex: "tax_id",
      key: "tax",
      align: "center" as const,
      render: (taxId: number, record: any) => {
        if (!taxId) return "Aucune";
        const tax = taxes.find((t) => t.id === taxId);
        return tax ? `${tax.name} (${tax.rate}%)` : "Taxe inconnue";
      },
    },
    {
      title: "Montant Taxe",
      key: "montant_taxe",
      align: "right" as const,
      render: (record: any) => {
        if (!record.tax_id) return "0 CFA";
        const tax = taxes.find((t) => t.id === record.tax_id);
        if (!tax) return "0 CFA";

        const montantHT = (record.unit_price || 0) * (record.quantity || 0);
        const remise = record.discount_rate || 0;
        const netHT = montantHT - remise;
        const montantTaxe = (netHT * (tax.rate || 0)) / 100;

        return `${formatNumber(montantTaxe)} CFA`;
      },
    },
    {
      title: "Total TTC",
      key: "total_ttc",
      align: "right" as const,
      render: (record: any) => {
        const montantHT = (record.unit_price || 0) * (record.quantity || 0);
        const remise = record.discount_rate || 0;
        const netHT = montantHT - remise;

        let montantTaxe = 0;
        if (record.tax_id) {
          const tax = taxes.find((t) => t.id === record.tax_id);
          if (tax) {
            montantTaxe = (netHT * (tax.rate || 0)) / 100;
          }
        }

        const totalTTC = netHT + montantTaxe;
        return <strong>{formatNumber(totalTTC)} CFA</strong>;
      },
    },
  ];

  // Colonnes pour la table des paiements
  const paymentColumns = [
    {
      title: "N° Paiement",
      dataIndex: "payment_number",
      key: "payment_number",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Montant",
      dataIndex: "payment_amount",
      key: "payment_amount",
      render: (montant: number) => `${formatNumber(montant || 0)} CFA`,
    },
    {
      title: "Mode de paiement",
      dataIndex: "payment_mode_name",
      key: "payment_mode",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="link"
          onClick={() =>
            openPaymentDetails(record.order_payment_id || record.payment_id)
          }
        >
          Détails
        </Button>
      ),
    },
  ];

  // Calcul du total des paiements
  const totalPayments = payments.reduce(
    (sum, payment) => sum + (payment.payment_amount || 0),
    0
  );

  // Handler pour ajouter un paiement
  const handleAddPayment = () => {
    setShowPaymentForm(true);
  };

  // Handler pour fermer le formulaire de paiement
  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
  };

  // Handler pour le succès de l'ajout d'un paiement
  const handlePaymentAdded = async () => {
    try {
      // Fermer le formulaire de paiement
      handleClosePaymentForm();

      // Rafraîchir les détails de la commande et les paiements
      if (order?.id) {
        // Afficher un message de chargement pendant la mise à jour
        const loadingMessage = message.loading(
          "Mise à jour des informations de paiement...",
          0
        );

        // Rafraîchir d'abord les paiements
        await fetchOrderPayments(order.id);

        // Puis rafraîchir les détails de la commande
        try {
          // Passer l'objet order complet et non juste l'ID
          await refreshOrderDetails(order);
          // Rafraîchir la liste des ventes
          await refreshSales();

          // Tout s'est bien passé, afficher un message de succès
          loadingMessage();
          message.success("Paiement ajouté avec succès");
        } catch (error) {
          loadingMessage();
          console.error("Erreur lors du rafraîchissement des détails:", error);
          // Le message de succès a déjà été affiché dans VentePaymentModal
        }
      }
    } catch (error) {
      console.error("Erreur lors de la gestion du paiement:", error);
    }
  };

  // Fonction pour calculer les totaux corrects à partir des données disponibles
  const calculateOrderTotals = (order: any) => {
    if (!order) return { baseHT: 0, netHT: 0, totalRemises: 0 };

    // Si nous avons les items, calculer à partir de ceux-ci
    if (order.produitsVendus && order.produitsVendus.length > 0) {
      const baseHT = order.produitsVendus.reduce((sum: number, item: any) => {
        const quantity = item.quantity || item.cartQuantity || 0;
        const unitPrice =
          item.unit_price || item.prix_vente || item.prix_unitaire_HT || 0;
        return sum + quantity * unitPrice;
      }, 0);

      const remisesIndividuelles = order.produitsVendus.reduce(
        (sum: number, item: any) => {
          return sum + (item.discount_rate || item.remise || 0);
        },
        0
      );

      const remiseGlobale = order.discount || 0;
      const totalRemises = remisesIndividuelles + remiseGlobale;
      const netHT = baseHT - totalRemises;

      return { baseHT, netHT, totalRemises };
    }

    // Sinon, utiliser les données de l'ordre directement
    // Vérifier si subtotal contient le base HT ou le net HT
    let baseHT = order.subtotal || 0;
    const totalRemises = order.discount || 0;

    // Si on a une remise mais que subtotal semble être le net HT, recalculer
    if (totalRemises > 0 && baseHT > 0) {
      // Si baseHT + totalRemises donne un nombre cohérent avec total - tax_amount
      const potentialBaseHT = baseHT + totalRemises;
      const taxAmount = order.tax_amount || 0;
      const calculatedTotal = baseHT + taxAmount;

      // Si le total calculé correspond au total réel, alors subtotal est bien le net HT
      if (Math.abs(calculatedTotal - (order.total || 0)) < 1) {
        // subtotal contient le net HT, recalculer base HT
        baseHT = potentialBaseHT;
      }
    }

    const netHT = baseHT - totalRemises;
    return { baseHT, netHT, totalRemises };
  };

  const { baseHT, netHT, totalRemises } = calculateOrderTotals(order);

  return (
    <Modal
      title={`Détails de la vente #${order?.invoice_number}`}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "details",
              label: "Informations générales",
              children: (
                <>
                  <Card title="Informations de la vente">
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="N° Facture">
                        {order?.invoice_number}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {dayjs(order?.order_date).format("DD/MM/YYYY")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Client">
                        {order?.user_id
                          ? getClientName(order.user_id)
                          : "Client inconnu"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Magasin">
                        {order?.warehouse_name || "Non spécifié"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut">
                        <Tag
                          color={
                            order?.order_status === "Annulé"
                              ? "red"
                              : order?.order_status === "En attente"
                              ? "orange"
                              : "green"
                          }
                        >
                          {order?.order_status || "Non spécifié"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut paiement">
                        {getPaymentStatusTag(order?.payment_status)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="Résumé financier" style={{ marginTop: 16 }}>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Montant Base HT" span={1}>
                        {formatNumber(baseHT)} CFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Remises" span={1}>
                        {formatNumber(totalRemises)} CFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant Net HT" span={2}>
                        <div
                          style={{
                            backgroundColor: "#f0f2f5",
                            padding: "8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "16px",
                            color: "#1890ff",
                          }}
                        >
                          {formatNumber(netHT)} CFA
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Taxes" span={1}>
                        {formatNumber(order?.tax_amount || 0)} CFA
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant Total TTC" span={1}>
                        <strong style={{ color: "#52c41a", fontSize: "18px" }}>
                          {formatNumber(order?.total || 0)} CFA
                        </strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant Payé" span={1}>
                        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
                          {formatNumber(order?.paid_amount || 0)} CFA
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant Restant" span={1}>
                        <strong
                          style={{
                            color:
                              (order?.total || 0) - (order?.paid_amount || 0) >
                              0
                                ? "#ff4d4f"
                                : "#52c41a",
                            fontSize: "16px",
                          }}
                        >
                          {formatNumber(
                            (order?.total || 0) - (order?.paid_amount || 0)
                          )}{" "}
                          CFA
                        </strong>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Divider orientation="left">Produits vendus</Divider>
                  <Table
                    dataSource={order?.produitsVendus || []}
                    columns={productColumns}
                    rowKey={(record) => record.product_id.toString()}
                    pagination={false}
                    size="small"
                  />

                  <Divider orientation="left">Notes et termes</Divider>
                  <Card>
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Remarques">
                        {order?.notes || "Aucune remarque"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Termes et conditions">
                        {order?.terms_condition || "Aucun terme spécifié"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </>
              ),
            },
            {
              key: "payments",
              label: "Paiements",
              children: (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <h3>
                      Total des paiements: {formatNumber(totalPayments)} CFA
                    </h3>
                    <Button
                      type="primary"
                      icon={<PlusCircleOutlined />}
                      onClick={handleAddPayment}
                      disabled={
                        order?.payment_status === "Payé" ||
                        order?.order_status === "Annulé"
                      }
                    >
                      Ajouter un paiement
                    </Button>
                  </div>
                  <Table
                    dataSource={payments}
                    columns={paymentColumns}
                    rowKey={(record) =>
                      record.payment_id?.toString() ||
                      record.order_payment_id?.toString() ||
                      record.id?.toString()
                    }
                    pagination={false}
                    size="small"
                  />
                </>
              ),
            },
          ]}
        />
      )}

      {/* Modal de formulaire de paiement */}
      {showPaymentForm && (
        <VentePaymentForm
          visible={showPaymentForm}
          onClose={handleClosePaymentForm}
          order={order}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {/* Modal de détails du paiement */}
      {showPaymentDetail && selectedPayment && (
        <PaymentDetailModal
          visible={showPaymentDetail}
          onClose={closePaymentDetail}
          payment={selectedPayment}
        />
      )}
    </Modal>
  );
};

export default VenteDetailModal;
