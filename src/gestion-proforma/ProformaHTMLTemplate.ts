/**
 * Template HTML pour la génération de factures proforma
 * Ce template est utilisé pour créer une facture proforma HTML qui sera ensuite convertie en PDF
 */

export const generateProformaHTML = (data: any): string => {
  const {
    order,
    clientObj,
    warehouse,
    paymentStatus,
    montantVerse,
    montantDu,
    totals,
    formattedDate,
    formatNumber,
  } = data;

  // Logo par défaut en base64 (une simple image bleue avec "ELSA")
  const defaultLogoBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAyCAYAAAAZUZThAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA2LTAxVDEwOjMwOjIwKzAwOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wNi0wMVQxMTowNTo0NiswMDowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wNi0wMVQxMTowNTo0NiswMDowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NDhhZmM3Ni0wYTEx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";

  // Couleur d'accentuation principale
  const primaryColor = "#2c5282"; // Bleu professionnel
  const secondaryColor = "#e2e8f0"; // Gris clair pour les arrière-plans
  const successColor = "#38a169"; // Vert pour "payé"
  const warningColor = "#d69e2e"; // Orange pour "partiellement payé"
  const dangerColor = "#e53e3e"; // Rouge pour "non payé"

  // Vérification et préparation du logo
  let logoHtml = "";
  if (warehouse?.logo) {
    // Vérifier si le logo est un URL ou une chaîne base64
    const isBase64 = warehouse.logo.includes("data:image");

    // Correction de l'URL du logo pour s'assurer qu'il pointe vers le bon chemin
    let logoUrl = "";
    let logoPath = warehouse.logo;

    // Nettoyage du chemin (supprimer les barres obliques en début si présentes)
    if (logoPath.startsWith("/")) {
      logoPath = logoPath.substring(1);
    }

    if (isBase64) {
      logoUrl = warehouse.logo;
    } else {
      // URL du backend (port 3000 au lieu de 3001)
      const backendUrl = "http://localhost:3000";
      logoUrl = `${backendUrl}/${logoPath}`;
    }

    // Ajouter des attributs pour une meilleure gestion des erreurs et debug
    logoHtml = `
      <div class="invoice-logo-container">
        <img 
          src="${logoUrl}" 
          alt="${warehouse?.name || ""}" 
          style="max-height: 120px; width: auto;"
          crossorigin="anonymous"
          onerror="
            console.error('Erreur avec la première URL:', this.src);
            this.onerror=null;
            
            // Essayer avec le chemin absolu depuis la racine
            const urlAbsolue = 'http://localhost:3000/${logoPath}';
            console.log('Essai avec URL absolue:', urlAbsolue);
            this.src = urlAbsolue;
            
            this.onerror=function() {
              console.error('Erreur avec la deuxième URL:', this.src);
              
              // Essayer avec un chemin sans 'uploads/'
              const urlSansUploads = 'http://localhost:3000/${logoPath.replace(
                "uploads/",
                ""
              )}';
              console.log('Essai sans uploads:', urlSansUploads);
              this.src = urlSansUploads;
              
              this.onerror=function() {
                console.error('Erreur avec la troisième URL:', this.src);
                
                // Essayer avec juste le nom du fichier dans /warehouses
                const filename = '${logoPath.split("/").pop()}';
                if (filename) {
                  const urlJusteFilename = 'http://localhost:3000/warehouses/' + filename;
                  console.log('Essai avec juste le nom de fichier:', urlJusteFilename);
                  this.src = urlJusteFilename;
                  
                  this.onerror=function() {
                    console.error('Échec de toutes les tentatives, utilisation du logo par défaut');
                    // Utiliser le logo par défaut en base64
                    this.onerror = null;
                    this.src = '${defaultLogoBase64}';
                    this.alt = 'ELSA Technologies Logo';
                  }
                }
              }
            }
          "
        >
      </div>
    `;
  } else {
    // Ajouter un logo par défaut si aucun logo n'est spécifié
    logoHtml = `
      <div class="invoice-logo-container">
        <img src="${defaultLogoBase64}" alt="ELSA Technologies Logo" style="max-height: 120px; width: auto;">
      </div>
    `;
  }

  // Produits vendus
  const produitsVendusHTML = (order.produitsVendus || [])
    .map(
      (item: any, index: number) => `
      <tr class="${index % 2 === 0 ? "item-even" : "item-odd"}">
        <td style="border-left: 1px solid #e2e8f0; text-align: center;">${
          index + 1
        }</td>
        <td>${item.product_name || "Produit inconnu"}</td>
        <td style="text-align: center;">${
          item.quantity || item.quantite || 1
        } ${item.unit_short_name || ""}</td>
        <td style="text-align: right;">${formatNumber(
          item.unit_price || item.prix_unitaire_HT || 0
        )} CFA</td>
        <td style="text-align: right; font-weight: 500;">${formatNumber(
          item.subtotal || item.quantity * item.unit_price || 0
        )} CFA</td>
      </tr>
    `
    )
    .join("");

  // Template HTML complet
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proforma ${order.invoice_number || ""}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1a202c;
          margin: 0;
          padding: 0;
          background-color: #f7fafc;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          background-color: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
          font-size: 12px;
          line-height: 18px;
          color: #4a5568;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 1px solid ${secondaryColor};
          min-height: 130px;
        }
        .company-info {
          width: 50%;
          display: flex;
          align-items: center;
          min-height: 120px;
        }
        /* Style spécifique pour le logo dans la facture, différent du logo app */
        .invoice-logo-container {
          margin-bottom: 0;
          text-align: left;
          width: 100%;
          max-width: 350px;
          display: flex;
          align-items: center;
          height: 120px;
        }
        .invoice-logo-container img {
          max-width: 100%;
          max-height: 120px;
          height: auto;
          display: block;
          object-fit: contain;
        }
        .invoice-info {
          width: 45%;
          text-align: right;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 15px;
          color: ${primaryColor};
        }
        .subtitle {
          font-size: 18px;
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid ${primaryColor};
          display: inline-block;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .info-table th {
          background-color: ${primaryColor};
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }
        .info-table td {
          padding: 10px;
          vertical-align: top;
          border-bottom: 1px solid ${secondaryColor};
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .products-table th {
          background-color: ${primaryColor};
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }
        .products-table td {
          padding: 10px;
          border-bottom: 1px solid ${secondaryColor};
        }
        .item-even {
          background-color: #f8fafc;
        }
        .totals {
          width: 48%;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .totals-table td {
          padding: 10px;
          border-bottom: 1px solid ${secondaryColor};
        }
        .totals-table tr:last-child {
          font-weight: 600;
          background-color: ${primaryColor};
          color: white;
        }
        .signature {
          margin-top: 30px;
          text-align: right;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid ${secondaryColor};
          display: flex;
          justify-content: space-between;
        }
        .terms, .bank-details {
          width: 48%;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 6px;
        }
        .section-title {
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 8px;
        }
        .detail-info {
          margin-bottom: 5px;
        }
        .detail-label {
          font-weight: 500;
          display: inline-block;
          width: 120px;
        }
        .detail-value {
          font-weight: 400;
        }
        .thank-you {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          font-weight: 500;
          color: ${primaryColor};
        }
        .proforma-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 6px 12px;
          background-color: ${warningColor};
          color: white;
          font-weight: bold;
          border-radius: 4px;
          transform: rotate(15deg);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div class="company-info">
            ${logoHtml}
          </div>
          <div class="invoice-info">
            <div class="title">Facture Proforma</div>
            <div style="margin-top: 10px;">
              <div class="detail-info">
                <span class="detail-label">N°:</span>
                <span class="detail-value">${order.invoice_number || ""}</span>
              </div>
              <div class="detail-info">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate || ""}</span>
              </div>
              <div class="detail-info">
                <span class="detail-label">Statut:</span>
                <span class="detail-value">${
                  order.order_status || "En traitement"
                }</span>
              </div>
              <div class="detail-info">
                <span class="detail-label">Vendu par:</span>
                <span class="detail-value">${warehouse?.name || ""}</span>
              </div>
            
            </div>
          </div>
        </div>
        <table class="info-table">
          <tr>
            <th style="width: 50%;">Vendeur</th>
            <th style="width: 50%;">Doit :</th>
          </tr>
          <tr>
            <td>
              <div style="font-weight: 600; font-size: 14px;">${
                warehouse?.name || "ELSA Technologies"
              }</div>
              <div style="margin-top: 5px;">${
                warehouse?.address || "Adresse non disponible"
              }</div>
              <div>${warehouse?.email || "Email non disponible"}</div>
              <div>${warehouse?.phone || "Téléphone non disponible"}</div>
            </td>
            <td>
              <div style="font-weight: 600; font-size: 14px;">${
                clientObj ? clientObj.name : "Client inconnu"
              }</div>
              <div style="margin-top: 5px;">${
                clientObj?.phone || "+226XXXXXXXX"
              }</div>
              <div>${clientObj?.email || "client@example.com"}</div>
            </td>
          </tr>
        </table>

        <table class="products-table">
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 40%;">Produit</th>
            <th style="width: 15%; text-align: center;">Quantité</th>
            <th style="width: 20%; text-align: right;">Prix Unitaire</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
          ${produitsVendusHTML}
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <div class="totals">
            <table class="totals-table">
              <tr>
                <td style="width: 50%;">Total:</td>
                <td style="width: 50%; text-align: right;">${formatNumber(
                  totals.subtotal
                )} CFA</td>
              </tr>
              <tr>
                <td>Remise:</td>
                <td style="text-align: right;">${formatNumber(
                  totals.totalDiscount
                )} CFA</td>
              </tr>
              <tr>
                <td>Taxe:</td>
                <td style="text-align: right;">${formatNumber(
                  totals.totalTax
                )} CFA</td>
              </tr>
              <tr>
                <td>Net à payer:</td>
                <td style="text-align: right;">${formatNumber(
                  totals.total
                )} CFA</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <div style="width: 60%;">
            <div class="section-title">Remarques:</div>
            <div style="padding: 10px; background-color: #f8fafc; border-radius: 4px; min-height: 50px;">
              ${
                order.notes ||
                "<span style='color: #a0aec0;'>Aucune remarque</span>"
              }
            </div>
          </div>
          <div style="width: 35%;">
            <div class="signature">
              <div class="section-title">Signature</div>
              <div style="margin-top: 15px; border-top: 1px solid ${primaryColor}; width: 150px; margin-left: auto;"></div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="terms">
            <div class="section-title">Termes & Conditions</div>
            <div style="margin-top: 5px;">
              ${
                warehouse?.terms_condition ||
                "Ce document est une facture proforma. Il ne s'agit pas d'une facture officielle et ne peut pas être utilisé à des fins comptables."
              }
            </div>
          </div>
          <div class="bank-details">
            <div class="section-title">Détails de banque</div>
            <div style="margin-top: 5px;">
              ${
                warehouse?.bank_details ||
                "<span style='color: #a0aec0;'>Aucun détail bancaire spécifié</span>"
              }
            </div>
          </div>
        </div>
        
        <div class="thank-you">
          Merci pour votre confiance!
        </div>
      </div>
    </body>
    </html>
  `;
};
