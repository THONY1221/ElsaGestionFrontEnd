// Définition de l'URL de base pour les appels API
const BASE_URL = process.env.REACT_APP_API_URL || "";

// Fonctions API pour le module GestionAchat
export const api = {
  async fetchAchats(params: any) {
    // Construire l'URL avec les paramètres de requête
    const queryParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    }

    const response = await fetch(
      `${BASE_URL}/api/orders?${queryParams.toString()}`
    );
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    return { data: data.orders, total: data.total };
  },
  async fetchFournisseurs() {
    const response = await fetch(`${BASE_URL}/api/suppliers`);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async fetchProduits(params: any = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `${BASE_URL}/api/products?${queryParams.toString()}`
    );
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async fetchTaxes() {
    const response = await fetch(`${BASE_URL}/api/taxes`);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
  async createAchat(data: any) {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }
    return await response.json();
  },
  async updateAchat(id: number, data: any) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur de réponse:", errorData);
        throw new Error("Internal Server Error");
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
      method: "POST",
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  },
};
