import jsPDF from "jspdf";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import { generateInvoiceHTML } from "./InvoiceHTMLTemplate";
// @ts-ignore - Nécessaire car la bibliothèque n'a pas de types TypeScript corrects
import html2pdf from "jspdf-html2canvas";

// Format pour les nombres avec séparateur correct de milliers
const formatNumber = (value: any): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0";
  }
  // Utiliser le séparateur d'espace pour les milliers (format français standard)
  const formattedNumber = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping: true,
  }).format(Number(value));

  // Log pour vérifier le format du nombre
  console.log(`Formatage du nombre ${value} en ${formattedNumber}`);

  return formattedNumber;
};

interface GeneratePDFOptions {
  order: any;
  clients: any[];
  produits: any[];
  taxes: any[];
  companyName?: string;
  warehouseName?: string;
  warehouse?: any; // Ajout des informations complètes du magasin
  client?: any; // Ajout des informations complètes du client
}

export const generateInvoicePDF = async ({
  order,
  clients,
  produits,
  taxes,
  companyName = "ELSA Technologies",
  warehouseName = "ELSA Technologies",
  warehouse = null,
  client = null,
}: GeneratePDFOptions): Promise<void> => {
  // Ajouter un log pour voir les produits reçus et leurs détails
  console.log("Produits reçus pour la génération de la facture:", produits);
  console.log("Données du warehouse:", warehouse);
  console.log("Produits à afficher dans la facture:", order.produitsVendus);

  // Log pour vérifier le logo
  if (warehouse?.logo) {
    console.log("Logo trouvé:", warehouse.logo);
  } else {
    console.log("Aucun logo trouvé dans les données du warehouse");
  }

  // Fonctions utilitaires
  const getClient = (userId: number) => {
    // Utiliser le client fourni en priorité, sinon chercher dans la liste des clients
    if (client) return client;
    return clients.find((c) => c.id === userId) || null;
  };

  const getProductName = (productId: number) => {
    const product = produits.find(
      (p) => p.id_produit === productId || p.id === productId
    );
    return product ? product.nom_produit || product.name : "Produit inconnu";
  };

  // Fonction pour récupérer les détails d'unité
  const getUnitShortName = (unitId: number) => {
    const product = produits.find(
      (p) => p.id_produit === unitId || p.id === unitId
    );
    return product?.unit_short_name || "";
  };

  // Calcul des totaux
  const calculateTotals = () => {
    const items = order.produitsVendus || [];
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (item.subtotal || 0),
      0
    );
    const totalTax = items.reduce((sum: number, item: any) => {
      if (!item.tax_id) return sum;
      const tax = taxes.find((t: any) => t.id === item.tax_id);
      if (!tax) return sum;
      return sum + (item.total_tax || 0);
    }, 0);
    const totalDiscount =
      (order.discount || 0) +
      items.reduce(
        (sum: number, item: any) => sum + (item.discount_rate || 0),
        0
      );
    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      totalTax,
      totalDiscount,
      total,
    };
  };

  // Calculer les totaux
  const totals = calculateTotals();
  const clientObj = getClient(order.user_id);
  const clientName = clientObj ? clientObj.name : "Client inconnu";
  const paymentStatus = order.payment_status || "Non payé";
  const montantVerse = order.paid_amount || 0;
  const montantDu = totals.total - montantVerse;
  const formattedDate = dayjs(order.order_date).format("DD-MM-YYYY");

  try {
    // Préparer les données pour le template HTML
    const templateData = {
      order,
      clientObj,
      warehouse,
      paymentStatus,
      montantVerse,
      montantDu,
      totals,
      formattedDate,
      formatNumber,
    };

    // Générer le HTML de la facture
    const invoiceHTML = generateInvoiceHTML(templateData);

    // Créer un élément div pour contenir le HTML
    const container = document.createElement("div");
    container.innerHTML = invoiceHTML;
    document.body.appendChild(container);

    console.log("HTML de la facture généré et ajouté au DOM temporairement");

    // Précharger les images pour s'assurer qu'elles sont disponibles avant la génération du PDF
    const preloadImages = () => {
      return new Promise<void>((resolve) => {
        const images = container.querySelectorAll("img");
        let loadedCount = 0;

        if (images.length === 0) {
          console.log("Aucune image à précharger");
          resolve();
          return;
        }

        images.forEach((img) => {
          const imgElement = img as HTMLImageElement;
          if (imgElement.complete) {
            loadedCount++;
            console.log(`Image ${loadedCount}/${images.length} déjà chargée`);
            if (loadedCount === images.length) {
              console.log("Toutes les images sont chargées");
              resolve();
            }
          } else {
            imgElement.onload = () => {
              loadedCount++;
              console.log(`Image ${loadedCount}/${images.length} chargée`);
              if (loadedCount === images.length) {
                console.log("Toutes les images sont chargées");
                resolve();
              }
            };
            imgElement.onerror = () => {
              console.error(
                "Erreur lors du chargement de l'image:",
                imgElement.src
              );
              loadedCount++;
              if (loadedCount === images.length) {
                console.log("Toutes les images sont chargées (avec erreurs)");
                resolve();
              }
            };
          }
        });
      });
    };

    // Attendre que les images soient chargées, puis générer le PDF
    await preloadImages();

    console.log("Début de la génération du PDF avec html2canvas et jsPDF");

    // Méthode alternative avec html2canvas (haute qualité) + jsPDF
    // pour une meilleure qualité et du texte vectoriel
    const element = container.querySelector(".invoice-box") as HTMLElement;
    const canvas = await html2canvas(element, {
      scale: 2, // Double la résolution pour une meilleure qualité
      useCORS: true,
      logging: true,
      allowTaint: true,
      imageTimeout: 5000, // Augmenter le délai d'attente pour les images
    });

    // Créer un nouveau document PDF avec une meilleure qualité
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Dimensions A4 en mm
    const pageWidth = 210;
    const imgWidth = pageWidth - 20; // Marge de 10mm de chaque côté
    const position = 10; // Position en haut du document (10mm de marge)

    // Calculer la hauteur proportionnelle pour maintenir le ratio
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Ajouter l'image avec une meilleure qualité
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 1.0), // Qualité JPEG maximale
      "JPEG",
      10, // Marge gauche de 10mm
      position,
      imgWidth,
      imgHeight
    );

    // Télécharger le PDF
    pdf.save(`Facture-${order.invoice_number}.pdf`);

    console.log("PDF généré avec succès");

    // Nettoyer le DOM après un court délai
    setTimeout(() => {
      try {
        document.body.removeChild(container);
        console.log("Conteneur HTML supprimé du DOM");
      } catch (error) {
        console.error("Erreur lors du nettoyage du DOM:", error);
      }
    }, 1000);

    return Promise.resolve();
  } catch (error) {
    console.error("Erreur globale lors de la génération de la facture:", error);
    return Promise.reject(error);
  }
};
