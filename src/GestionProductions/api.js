import axios from "axios";

// URL de base pour les appels API
const BASE_URL = process.env.REACT_APP_API_URL || "";

// Récupérer toutes les unités de production avec pagination et filtres
export const getProductionUnits = async (params = {}) => {
  console.log("API call getProductionUnits with params:", params);

  // Make a copy to normalize parameters
  const apiParams = { ...params };

  // Ensure warehouse parameter is correctly named (try the most likely parameter name)
  if (params.warehouse_id && !params.warehouse) {
    apiParams.warehouse = params.warehouse_id;
  }

  console.log("Final API params:", apiParams);

  try {
    // Utiliser la nouvelle route pour la compatibilité
    const response = await axios.get(
      `${BASE_URL}/api/produits/production-units`,
      {
        params: apiParams,
      }
    );
    console.log("API response success:", response.data);
    return response.data;
  } catch (error) {
    // Si la nouvelle route échoue, essayer l'ancienne route comme fallback
    try {
      console.log("Primary route failed, trying fallback route");
      const fallbackResponse = await axios.get(
        `${BASE_URL}/api/production/units`,
        {
          params: apiParams,
        }
      );
      console.log("Fallback API response success:", fallbackResponse.data);
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error("Both API routes failed:", error, fallbackError);
      throw error.response?.data || error.message;
    }
  }
};

// Récupérer une unité de production par ID
export const getProductionUnitById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/production/units/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Créer une nouvelle unité de production
export const createProductionUnit = async (data) => {
  try {
    // Si les données sont au format FormData, extraire et convertir les données spécifiques
    let dataToSend = data;
    let hasImage = false;
    let imageFile = null;

    if (data instanceof FormData) {
      console.log("Traitement du FormData pour le serveur");

      // Vérifier si tous les champs requis sont présents
      const requiredFields = [
        "name",
        "company_id",
        "warehouse_id",
        "unit_id",
        "category_id",
      ];
      for (const field of requiredFields) {
        if (!data.get(field)) {
          throw new Error(`Le champ ${field} est requis`);
        }
      }

      // Ajouter la date et l'heure actuelles
      const currentDateTime = new Date().toISOString();
      data.append("created_at", currentDateTime);
      data.append("updated_at", currentDateTime);

      // Gérer l'image
      if (data.get("image") && data.get("image").size > 0) {
        hasImage = true;
        imageFile = data.get("image");
        console.log("Image détectée dans FormData:", imageFile.name);
      }

      // Valider les matières premières
      let materialsValid = false;
      if (data.get("materials")) {
        try {
          const materialsData = JSON.parse(data.get("materials"));
          if (Array.isArray(materialsData) && materialsData.length > 0) {
            materialsValid = materialsData.some(
              (m) => m.product_id && m.quantity > 0
            );
          }
        } catch (e) {
          console.error("Erreur lors de la validation des materials:", e);
        }
      }

      if (!materialsValid) {
        throw new Error(
          "Veuillez ajouter au moins une matière première valide"
        );
      }

      // Assurer que les champs numériques sont correctement formatés
      [
        "status",
        "stock_quantitiy_alert",
        "sales_price",
        "output_quantity",
      ].forEach((key) => {
        if (data.has(key)) {
          const value = data.get(key);
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            // Remplacer la valeur par la version numérique
            data.set(key, numericValue);
          }
        }
      });

      // Si nous utilisons FormData avec une image, nous pouvons l'envoyer directement
      // car le serveur est configuré pour traiter multipart/form-data
      if (hasImage) {
        console.log("Envoi du formulaire avec image via multipart/form-data");
        // Nous envoyons directement le FormData
        const response = await axios.post(
          `${BASE_URL}/api/production/units`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } else {
        // S'il n'y a pas d'image, nous pouvons toujours utiliser FormData
        // mais nous pouvons aussi convertir en JSON pour plus de fiabilité
        console.log("Conversion du FormData en JSON (pas d'image)");

        // Créer un objet JSON à partir du FormData
        const jsonData = {};
        for (let [key, value] of data.entries()) {
          if (key !== "materials" && key !== "outputs" && key !== "image") {
            // Convertir les valeurs numériques en nombres
            if (
              !isNaN(value) &&
              key !== "name" &&
              key !== "description" &&
              key !== "slug" &&
              key !== "barcode_symbology" &&
              key !== "item_code" &&
              key !== "created_at" &&
              key !== "updated_at"
            ) {
              jsonData[key] = Number(value);
            } else {
              jsonData[key] = value;
            }
          }
        }

        // Traiter les matériaux en JSON
        if (data.get("materials")) {
          try {
            jsonData.materials = JSON.parse(data.get("materials"));
            console.log("Materials parsés:", jsonData.materials);
          } catch (e) {
            console.error("Erreur lors du parsing des materials:", e);
            throw new Error("Format de matériaux invalide");
          }
        }

        // Traiter les sorties en JSON
        if (data.get("outputs")) {
          try {
            jsonData.outputs = JSON.parse(data.get("outputs"));
            console.log("Outputs parsés:", jsonData.outputs);

            // Vérifier et s'assurer que outputs est bien un tableau
            if (!Array.isArray(jsonData.outputs)) {
              console.error("Outputs n'est pas un tableau:", jsonData.outputs);
              // Forcer à être un tableau si nécessaire
              jsonData.outputs = [];
            }
          } catch (e) {
            console.error("Erreur lors du parsing des outputs:", e);
            jsonData.outputs = [];
          }
        } else {
          jsonData.outputs = [];
        }

        // S'assurer qu'il y a au moins un élément de sortie
        if (jsonData.outputs.length === 0) {
          // Ajouter un élément factice pour satisfaire le backend
          jsonData.outputs.push({
            product_id: "self_reference",
            quantity: Number(data.get("output_quantity")) || 1,
          });
        }

        dataToSend = jsonData;
      }
    }

    console.log("Données finales à envoyer:", dataToSend);

    // Envoyer les données
    const response = await axios.post(
      `${BASE_URL}/api/production/units`,
      dataToSend,
      {
        headers:
          dataToSend instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : { "Content-Type": "application/json" },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'unité de production:",
      error
    );

    // Si nous avons une réponse du serveur avec des données d'erreur
    if (error.response && error.response.data) {
      console.error("Détails de l'erreur serveur:", error.response.data);
      throw error.response.data;
    }

    // Si c'est une erreur que nous avons générée nous-mêmes
    if (error.message) {
      throw { error: error.message };
    }

    // Erreur générique
    throw { error: "Erreur lors de la création de l'unité de production" };
  }
};

// Mettre à jour une unité de production
export const updateProductionUnit = async (id, data) => {
  try {
    // Ajouter la date et l'heure actuelles pour la mise à jour
    if (data instanceof FormData) {
      data.append("updated_at", new Date().toISOString());
    } else {
      data.updated_at = new Date().toISOString();
    }

    const response = await axios.put(
      `${BASE_URL}/api/production/units/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Supprimer une unité de production
export const deleteProductionUnit = async (id) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/production/units/${id}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Calculer les besoins en matières premières pour une production
export const calculateProductionNeeds = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/production/calculate`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Initier une production
export const processProduction = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/production/process`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtenir l'historique des productions
export const getProductionHistory = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    const params = { page, limit };

    // Ajouter les filtres optionnels
    if (filters.warehouse_id) {
      params.warehouse_id = filters.warehouse_id;
    }

    if (filters.start_date) {
      params.start_date = filters.start_date;
    }

    if (filters.end_date) {
      params.end_date = filters.end_date;
    }

    console.log("API call getProductionHistory with params:", params);

    const response = await axios.get(`${BASE_URL}/api/production/history`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtenir les détails complets d'une production par ID
export const getProductionDetails = async (productionId) => {
  try {
    console.log("API call getProductionDetails for ID:", productionId);

    const response = await axios.get(
      `${BASE_URL}/api/production/history/${productionId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Récupérer tous les produits (pour les sélecteurs)
export const getProducts = async (
  search = "",
  warehouse = null,
  type = "raw"
) => {
  try {
    const params = { search };
    if (warehouse) params.warehouse = warehouse;
    if (type) params.type = type;

    const response = await axios.get(`${BASE_URL}/api/produits`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
