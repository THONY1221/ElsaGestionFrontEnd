import React, { useState, useEffect } from "react";
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../hooks/useTheme";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserModal from "./UserModal";

// Configuration d'axios
const API_URL = "http://localhost:3000/api";
axios.defaults.baseURL = API_URL;

const GestionUser = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    userType: "",
    companyId: "",
  });

  // Charger les utilisateurs
  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page,
        ...filters,
      }).toString();

      const response = await axios.get(`/users?${queryParams}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données de référence
  const fetchReferenceData = async () => {
    try {
      const [companiesRes, rolesRes] = await Promise.all([
        axios.get("/entreprises"),
        axios.get("/roles"),
      ]);
      setCompanies(companiesRes.data.companies);
      setRoles(rolesRes.data.roles);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données de référence:",
        error
      );
      toast.error("Erreur lors du chargement des données de référence");
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
    fetchReferenceData();
  }, [currentPage, filters]);

  // Créer un utilisateur
  const handleCreateUser = async (formData) => {
    try {
      setIsLoading(true);
      const form = new FormData();

      // Ajouter les champs du formulaire
      Object.keys(formData).forEach((key) => {
        if (key !== "profile_image") {
          form.append(key, formData[key]);
        }
      });

      // Ajouter l'image de profil si elle existe
      if (formData.profile_image instanceof File) {
        form.append("profile_image", formData.profile_image);
      }

      await axios.post("/users", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Utilisateur créé avec succès");
      fetchUsers(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la création de l'utilisateur"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un utilisateur
  const handleUpdateUser = async (formData) => {
    try {
      setIsLoading(true);
      const form = new FormData();

      // Ajouter les champs du formulaire
      Object.keys(formData).forEach((key) => {
        if (key !== "profile_image") {
          form.append(key, formData[key]);
        }
      });

      // Ajouter l'image de profil si elle a été modifiée
      if (formData.profile_image instanceof File) {
        form.append("profile_image", formData.profile_image);
      }

      await axios.put(`/users/${selectedUser.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Utilisateur mis à jour avec succès");
      fetchUsers(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la mise à jour de l'utilisateur"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (user) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        setIsLoading(true);
        await axios.delete(`/users/${user.id}`);

        toast.success("Utilisateur supprimé avec succès");

        if (users.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchUsers(currentPage);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(
          error.response?.data?.error ||
            "Erreur lors de la suppression de l'utilisateur"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Mettre à jour le statut d'un utilisateur
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === "enabled" ? "disabled" : "enabled";

      await axios.patch(`/users/${user.id}/status`, {
        status: newStatus,
      });

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );

      toast.success("Statut mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Gérer les filtres
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/api/entreprises");
      setCompanies(response.data.companies);
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error);
      toast.error("Erreur lors du chargement des entreprises");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <UserIcon className="h-8 w-8 mr-3 text-blue-600" />
            Gestion des utilisateurs
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode
                  ? "bg-gray-800 text-yellow-400"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Créer un utilisateur
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div
          className={`mb-6 p-4 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Rechercher
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Nom, email, téléphone..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                />
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">Tous</option>
                <option value="enabled">Actif</option>
                <option value="disabled">Inactif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type d'utilisateur
              </label>
              <select
                value={filters.userType}
                onChange={(e) => handleFilterChange("userType", e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">Tous</option>
                <option value="admin">Administrateur</option>
                <option value="staff">Personnel</option>
                <option value="customer">Client</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Entreprise
              </label>
              <select
                value={filters.companyId}
                onChange={(e) =>
                  handleFilterChange("companyId", e.target.value)
                }
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">Toutes</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table des utilisateurs */}
        <div
          className={`bg-white rounded-xl shadow-lg overflow-hidden ${
            isDarkMode ? "bg-gray-800" : ""
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      Chargement...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={isDarkMode ? "bg-gray-800" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.profile_image ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={`${API_URL}${user.profile_image}`}
                                alt={user.name}
                              />
                            ) : (
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                }`}
                              >
                                <UserIcon className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">
                              {user.user_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={user.status === "enabled"}
                              onChange={() => handleToggleStatus(user)}
                              className="sr-only"
                            />
                            <div
                              className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                                user.status === "enabled"
                                  ? "bg-green-600"
                                  : "bg-gray-400"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                                  user.status === "enabled"
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                }`}
                              />
                            </div>
                          </div>
                          <span
                            className={`ml-2 text-sm ${
                              isDarkMode ? "text-gray-200" : "text-gray-600"
                            }`}
                          >
                            {user.status === "enabled" ? "Actif" : "Inactif"}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}{" "}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Affichage de{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * 10 + 1}
                  </span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, users.length)}
                  </span>{" "}
                  sur <span className="font-medium">{users.length}</span>{" "}
                  résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Précédent</span>
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Suivant</span>
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        companies={companies}
        roles={roles}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
      />
    </div>
  );
};

export default GestionUser;
