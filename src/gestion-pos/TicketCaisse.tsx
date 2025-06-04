import React, { useEffect, useState } from "react";
import "./TicketCaisse.css";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import axios from "axios";

interface TicketCaisseProps {
  visible: boolean;
  order: any;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR")
  );
};

const formatAmountCurrency = (amount: number) => {
  return (
    amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " CFA"
  );
};

const TicketCaisse: React.FC<TicketCaisseProps> = ({
  visible,
  order,
  onClose,
}) => {
  const [warehouseInfo, setWarehouseInfo] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/logo-placeholder.png");

  // Déterminer si l'écran est très petit (mobile étroit) pour la largeur de la modale
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(
    window.innerWidth < 400
  );

  useEffect(() => {
    const handleResize = () => {
      setIsVerySmallScreen(window.innerWidth < 400);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Récupérer les informations complètes de l'entrepôt si un ID est spécifié
  useEffect(() => {
    if (visible && order && order.order && order.order.warehouse_id) {
      const fetchWarehouseInfo = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/warehouses/${order.order.warehouse_id}`
          );
          if (response.status === 200 && response.data) {
            console.log(
              "Informations de l'entrepôt récupérées:",
              response.data
            );
            setWarehouseInfo(response.data);

            // Déterminer l'URL correcte du logo
            let logo = response.data.logo;
            if (logo) {
              // Vérifier si le chemin commence par http ou https
              if (!logo.startsWith("http") && !logo.startsWith("/")) {
                logo = `/${logo}`;
              }
              // Vérifier si le logo est stocké dans le dossier uploads/warehouses
              if (logo.includes("uploads/warehouses")) {
                logo = `http://localhost:3000${logo}`;
              } else if (logo.startsWith("/uploads/warehouses")) {
                logo = `http://localhost:3000${logo}`;
              }
              setLogoUrl(logo);
              console.log("URL du logo configurée:", logo);
            } else if (order.warehouse?.logo_url) {
              let warehouseLogo = order.warehouse.logo_url;
              if (
                !warehouseLogo.startsWith("http") &&
                !warehouseLogo.startsWith("/")
              ) {
                warehouseLogo = `/${warehouseLogo}`;
              }
              if (warehouseLogo.includes("uploads/warehouses")) {
                warehouseLogo = `http://localhost:3000${warehouseLogo}`;
              } else if (warehouseLogo.startsWith("/uploads/warehouses")) {
                warehouseLogo = `http://localhost:3000${warehouseLogo}`;
              }
              setLogoUrl(warehouseLogo);
              console.log("URL du logo de l'ordre configurée:", warehouseLogo);
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des infos de l'entrepôt:",
            error
          );
          // Utiliser le logo de l'ordre si disponible
          if (order.warehouse?.logo_url) {
            let warehouseLogo = order.warehouse.logo_url;
            if (
              !warehouseLogo.startsWith("http") &&
              !warehouseLogo.startsWith("/")
            ) {
              warehouseLogo = `/${warehouseLogo}`;
            }
            if (warehouseLogo.includes("uploads/warehouses")) {
              warehouseLogo = `http://localhost:3000${warehouseLogo}`;
            } else if (warehouseLogo.startsWith("/uploads/warehouses")) {
              warehouseLogo = `http://localhost:3000${warehouseLogo}`;
            }
            setLogoUrl(warehouseLogo);
            console.log("URL du logo de secours configurée:", warehouseLogo);
          }
        }
      };

      fetchWarehouseInfo();
    }
  }, [visible, order]);

  if (!visible || !order) {
    return null;
  }

  // Log des informations client et entrepôt pour débogage
  console.log("Informations client:", order.customer);
  console.log("Informations entrepôt:", order.warehouse);
  console.log("Informations de paiement:", {
    paid: order.order?.paid_amount,
    due: order.order?.due_amount,
    status: order.order?.payment_status,
  });

  // Utiliser les informations de l'entrepôt récupérées ou les valeurs par défaut
  const warehouseName =
    warehouseInfo?.name || order.warehouse?.name || "Votre Entreprise";
  const warehouseAddress =
    warehouseInfo?.address ||
    order.warehouse?.address ||
    "Adresse de l'entreprise";
  const warehousePhone =
    warehouseInfo?.phone || order.warehouse?.phone || "Téléphone";
  const warehouseEmail =
    warehouseInfo?.email || order.warehouse?.email || "Email";

  // Informations client
  const customerName = order.customer?.name || "Client";

  // Montants de paiement
  const paidAmount = order.order?.paid_amount || 0;
  const dueAmount = order.order?.due_amount || 0;
  const paymentStatus = order.order?.payment_status || "unpaid";

  // Obtenir l'étiquette et la couleur du statut de paiement
  const getPaymentStatusInfo = () => {
    switch (paymentStatus) {
      case "Payé":
        return { label: "Payé", color: "#52c41a" };
      case "Partiellement payé":
        return { label: "Partiellement payé", color: "#faad14" };
      case "Non payé":
      default:
        return { label: "Non payé", color: "#ff4d4f" };
    }
  };

  const paymentStatusInfo = getPaymentStatusInfo();

  const totalItems =
    order.items?.reduce((sum: number, item: any) => sum + 1, 0) || 0;
  const totalQuantity =
    order.items?.reduce(
      (sum: number, item: any) => sum + (parseFloat(item.quantity) || 0),
      0
    ) || 0;

  const printTicket = () => {
    // Créer le contenu du ticket
    const ticketHTML = `
    <html>
    <head>
      <title>Ticket de Caisse</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; width: 80mm; margin: 0; padding: 5mm; }
        .ticket-caisse-header { text-align: center; border-bottom: 1px dotted #ddd; padding-bottom: 5mm; }
        .ticket-caisse-logo { width: 150px; max-width: 100%; height: auto; margin: 0 auto; display: block; }
        .ticket-caisse-company { text-align: center; margin-top: 3mm; border-bottom: 2px dotted #ddd; padding-bottom: 3mm; }
        .ticket-caisse-company h2 { margin: 2mm 0; font-size: 16px; }
        .ticket-caisse-company p { margin: 1mm 0; }
        .ticket-caisse-info { margin: 3mm 0; }
        .ticket-caisse-client { width: 100%; margin-bottom: 3mm; }
        .ticket-caisse-title { text-align: center; margin: 3mm 0; font-weight: bold; }
        .ticket-caisse-produits { margin: 3mm 0; border-top: 1px dotted #ddd; border-bottom: 1px dotted #ddd; }
        .ticket-caisse-produits table { width: 100%; border-collapse: collapse; }
        .ticket-caisse-produits thead td { font-weight: bold; padding: 2mm; background-color: #f5f5f5; }
        .ticket-caisse-produit { border-bottom: 1px dotted #ddd; }
        .ticket-caisse-produit td { padding: 2mm; }
        .ticket-caisse-total { margin-top: 3mm; border-top: 2px dotted #ddd; border-bottom: 2px dotted #ddd; padding: 2mm 0; }
        .ticket-caisse-paiement { margin-top: 3mm; text-align: center; }
        .ticket-caisse-paiement-row { border-top: 2px dotted #ddd; border-bottom: 2px dotted #ddd; }
        .ticket-caisse-paiement table { width: 100%; border-collapse: collapse; }
        .ticket-caisse-paiement td { padding: 2mm; }
        .ticket-caisse-merci { margin-top: 3mm; text-align: center; font-weight: bold; }
        .ticket-caisse-barcode { margin-top: 5mm; text-align: center; }
      </style>
    </head>
    <body>
      <div class="ticket-caisse-header">
        <img class="ticket-caisse-logo" src="${logoUrl}" alt="Logo" />
      </div>
      
      <div class="ticket-caisse-company">
        <h2>${warehouseName}</h2>
        <p>${warehouseAddress}</p>
        <p>Tél: ${warehousePhone}</p>
        <p>Email: ${warehouseEmail}</p>
      </div>
      
      <div class="ticket-caisse-title">TICKET DE CAISSE</div>
      
      <div class="ticket-caisse-info">
        <table class="ticket-caisse-client">
          <tbody>
            <tr>
              <td style="width: 50%">N° Facture: ${
                order.order?.invoice_number
              }</td>
              <td style="width: 50%">Date: ${formatDate(
                order.order?.order_date || new Date().toISOString()
              )}</td>
            </tr>
            <tr>
              <td>Client: ${customerName}</td>
              <td>Vendeur: ${order.staff_member?.name || "Vendeur"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="ticket-caisse-produits">
        <table>
          <thead>
            <tr>
              <td style="width: 5%">#</td>
              <td style="width: 40%">Article</td>
              <td style="width: 15%">Qté</td>
              <td style="width: 20%">Prix</td>
              <td style="width: 20%; text-align: right">Total</td>
            </tr>
          </thead>
          <tbody>
            ${order.items
              ?.map(
                (item: any, index: number) => `
              <tr class="ticket-caisse-produit">
                <td>${index + 1}</td>
                <td>${item.product?.name || item.nom_produit}</td>
                <td>${item.quantity || item.cartQuantity}</td>
                <td>${formatAmountCurrency(
                  item.unit_price || item.prix_vente
                )}</td>
                <td style="text-align: right">${formatAmountCurrency(
                  (item.unit_price || item.prix_vente) *
                    (item.quantity || item.cartQuantity)
                )}</td>
              </tr>
            `
              )
              .join("")}
            <tr class="ticket-caisse-produit">
              <td colspan="3" style="text-align: right">Taxe:</td>
              <td colspan="2" style="text-align: right">${formatAmountCurrency(
                order.order?.tax_amount || 0
              )}</td>
            </tr>
            <tr class="ticket-caisse-produit">
              <td colspan="3" style="text-align: right">Remise:</td>
              <td colspan="2" style="text-align: right">${formatAmountCurrency(
                order.order?.discount || 0
              )}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="ticket-caisse-total">
        <table style="width: 100%">
          <tbody>
            <tr>
              <td style="width: 30%"><b>Articles: ${totalItems}</b></td>
              <td style="width: 30%"><b>Quantité: ${totalQuantity}</b></td>
              <td style="width: 40%; text-align: right"><b>Total: ${formatAmountCurrency(
                order.order?.total || 0
              )}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="ticket-caisse-paiement">
        <table>
          <thead>
            <tr>
              <td style="width: 50%; background: #f5f5f5">Montant Payé</td>
              <td style="width: 50%; background: #f5f5f5">Montant Dû</td>
            </tr>
          </thead>
          <tbody>
            <tr class="ticket-caisse-paiement-row">
              <td>${formatAmountCurrency(paidAmount)}</td>
              <td>${formatAmountCurrency(dueAmount)}</td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: center">
                <p><b>Mode de paiement:</b> ${
                  order.order?.payment_mode || "-"
                }</p>
                <p><b>Statut:</b> <span style="color: ${
                  paymentStatusInfo.color
                }; font-weight: bold;">${paymentStatusInfo.label}</span></p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="ticket-caisse-barcode">
        ${order.order?.invoice_number}
      </div>
      
      <div class="ticket-caisse-merci">
        <p>MERCI POUR VOTRE ACHAT!</p>
      </div>
    </body>
    </html>
    `;

    // Ouvrir une nouvelle fenêtre du navigateur et y écrire le contenu du ticket
    const newWindow = window.open(
      "",
      "_blank",
      "width=300,height=600,toolbar=no,scrollbars=yes"
    );
    if (newWindow) {
      newWindow.document.write(ticketHTML);
      newWindow.document.close();
      // Imprimer automatiquement
      setTimeout(() => {
        newWindow.print();
      }, 500);
    } else {
      console.error("Impossible d'ouvrir une nouvelle fenêtre");
    }
  };

  return (
    <Modal
      title="Ticket de Caisse"
      open={visible}
      onCancel={onClose}
      width={isVerySmallScreen ? "95%" : 320}
      style={{ top: 20 }}
      centered
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={printTicket}
        >
          Imprimer
        </Button>,
      ]}
    >
      <div
        className="ticket-caisse-preview"
        style={{
          overflowX: "auto",
          maxHeight: "70vh",
          overflowY: "auto",
          padding: "10px",
          background: "#f9f9f9",
          // Style pour simuler la largeur d'un ticket de caisse (80mm ≈ 300px)
          width: "100%",
          maxWidth: "280px",
          margin: "0 auto",
          fontSize: "12px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="ticket-caisse-header">
          <img className="ticket-caisse-logo" src={logoUrl} alt="Logo" />
        </div>

        <div className="ticket-caisse-company">
          <h2>{warehouseName}</h2>
          <p>{warehouseAddress}</p>
          <p>Tél: {warehousePhone}</p>
          <p>Email: {warehouseEmail}</p>
        </div>

        <div className="ticket-caisse-title">TICKET DE CAISSE</div>

        <div className="ticket-caisse-info">
          <table className="ticket-caisse-client">
            <tbody>
              <tr>
                <td>N° Facture: {order.order?.invoice_number}</td>
                <td>
                  Date:{" "}
                  {formatDate(
                    order.order?.order_date || new Date().toISOString()
                  )}
                </td>
              </tr>
              <tr>
                <td>Client: {customerName}</td>
                <td>Vendeur: {order.staff_member?.name || "Vendeur"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-caisse-produits">
          <table>
            <thead>
              <tr>
                <td>#</td>
                <td>Article</td>
                <td>Qté</td>
                <td>Prix</td>
                <td>Total</td>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, index: number) => (
                <tr key={index} className="ticket-caisse-produit">
                  <td>{index + 1}</td>
                  <td>{item.product?.name || item.nom_produit}</td>
                  <td>{item.quantity || item.cartQuantity}</td>
                  <td>
                    {formatAmountCurrency(item.unit_price || item.prix_vente)}
                  </td>
                  <td>
                    {formatAmountCurrency(
                      (item.unit_price || item.prix_vente) *
                        (item.quantity || item.cartQuantity)
                    )}
                  </td>
                </tr>
              ))}
              <tr className="ticket-caisse-produit">
                <td colSpan={3}>Taxe:</td>
                <td colSpan={2}>
                  {formatAmountCurrency(order.order?.tax_amount || 0)}
                </td>
              </tr>
              <tr className="ticket-caisse-produit">
                <td colSpan={3}>Remise:</td>
                <td colSpan={2}>
                  {formatAmountCurrency(order.order?.discount || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-caisse-total">
          <table>
            <tbody>
              <tr>
                <td>
                  <b>Articles: {totalItems}</b>
                </td>
                <td>
                  <b>Quantité: {totalQuantity}</b>
                </td>
                <td>
                  <b>Total: {formatAmountCurrency(order.order?.total || 0)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-caisse-paiement">
          <table>
            <thead>
              <tr>
                <td>Montant Payé</td>
                <td>Montant Dû</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatAmountCurrency(paidAmount)}</td>
                <td>{formatAmountCurrency(dueAmount)}</td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <p>
                    <b>Mode de paiement:</b> {order.order?.payment_mode || "-"}
                  </p>
                  <p>
                    <b>Statut:</b>{" "}
                    <span
                      style={{
                        color: paymentStatusInfo.color,
                        fontWeight: "bold",
                      }}
                    >
                      {paymentStatusInfo.label}
                    </span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-caisse-merci">
          <p>MERCI POUR VOTRE ACHAT!</p>
        </div>
      </div>
    </Modal>
  );
};

export default TicketCaisse;
