import axios from "axios";

const API_URL = "http://localhost:3000/api/brands";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

const getAll = async (companyId = null) => {
  try {
    const params = companyId ? { company_id: companyId } : {};
    return await axiosInstance.get("/", { params });
  } catch (error) {
    console.error("Erreur lors du getAll():", error);
    throw error;
  }
};

const create = async (data) => {
  try {
    return await axiosInstance.post("/", data);
  } catch (error) {
    console.error("Erreur lors du create():", error);
    throw error;
  }
};

const update = async (id, data) => {
  try {
    return await axiosInstance.put(`/${id}`, data);
  } catch (error) {
    console.error("Erreur lors du update():", error);
    throw error;
  }
};

const deleteBrand = async (id) => {
  try {
    return await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error("Erreur lors du deleteBrand():", error);
    throw error;
  }
};

export default {
  getAll,
  create,
  update,
  delete: deleteBrand,
};
