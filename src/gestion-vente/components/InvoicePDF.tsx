import React from "react";
import { message } from "antd";
import { generateInvoicePDF } from "./InvoicePDFGenerator";

interface InvoicePDFProps {
  order: any;
  clients: any[];
  produits: any[];
  taxes: any[];
  companyName?: string;
  warehouseName?: string;
  warehouse?: any;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({
  order,
  clients,
  produits,
  taxes,
  companyName = "ELSA Technologies",
  warehouseName = "ELSA Technologies",
  warehouse = null,
}) => {
  if (!order) return null;

  // Récupérer le client spécifique à cette commande
  const client = order.client || clients.find((c) => c.id === order.user_id);

  const downloadInvoice = async () => {
    try {
      message.loading({
        content: "Génération de la facture en cours...",
        key: "invoice-loading",
      });

      // Vérifier que les produitsVendus sont correctement enrichis
      const enrichedOrder = {
        ...order,
        payments: order.payments || [], // S'assurer que payments existe
      };

      // Log des données pour le débogage
      console.log("Données pour la génération de facture:", {
        order: enrichedOrder,
        produits,
        warehouse,
        client,
      });

      await generateInvoicePDF({
        order: enrichedOrder,
        clients,
        produits,
        taxes,
        companyName,
        warehouseName,
        warehouse: order.warehouse || warehouse,
        client,
      });

      message.success({
        content: "Facture générée avec succès",
        key: "invoice-loading",
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      message.error({
        content: "Erreur lors de la génération du PDF",
        key: "invoice-loading",
      });
    }
  };

  return (
    <>
      <button
        onClick={downloadInvoice}
        style={{ display: "none" }}
        id="download-invoice-btn"
      >
        Télécharger la facture
      </button>
    </>
  );
};

export default InvoicePDF;
