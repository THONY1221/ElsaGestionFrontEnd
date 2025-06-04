import { useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Création d'une instance axios avec la configuration de base
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter un intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    if (error.code === "ERR_NETWORK") {
      toast.error("Erreur de connexion au serveur");
    } else if (error.response?.status === 404) {
      toast.error("Ressource non trouvée");
    } else {
      toast.error("Une erreur est survenue");
    }
    return Promise.reject(error);
  }
);

export const useVentesAPI = () => {
  const fetchVentes = useCallback(async (params: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.dateDebut) queryParams.append("dateDebut", params.dateDebut);
      if (params.dateFin) queryParams.append("dateFin", params.dateFin);
      if (params.clientId) queryParams.append("clientId", params.clientId);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const response = await api.get(`/ventes?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const createVente = useCallback(async (data: any) => {
    try {
      const response = await api.post("/ventes", data);
      toast.success("Vente créée avec succès");
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateVente = useCallback(async (id: number, data: any) => {
    try {
      const response = await api.put(`/ventes/${id}`, data);
      toast.success("Vente mise à jour avec succès");
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteVente = useCallback(async (id: number) => {
    try {
      const response = await api.delete(`/ventes/${id}`);
      toast.success("Vente supprimée avec succès");
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    fetchVentes,
    createVente,
    updateVente,
    deleteVente,
  };
};
