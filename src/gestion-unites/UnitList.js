import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-toastify";
import UnitModal from "./UnitModal";
import { useTheme } from "../hooks/useTheme";

const UnitList = () => {
  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { isDarkMode } = useTheme();

  const fetchUnits = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/units?page=${page}&search=${searchTerm}`
      );
      setUnits(response.data.units);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur lors du chargement des unités:", error);
      toast.error("Erreur lors du chargement des unités");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits(currentPage);
  }, [currentPage, searchTerm]);

  const handleCreateUnit = async (formData) => {
    try {
      setIsLoading(true);
      await axios.post("/units", formData);
      toast.success("Unité créée avec succès");
      fetchUnits(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la création de l'unité"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUnit = async (formData) => {
    if (!selectedUnit?.id) {
      toast.error("ID de l'unité manquant");
      return;
    }

    try {
      setIsLoading(true);
      await axios.put(`/units/${selectedUnit.id}`, formData);
      toast.success("Unité mise à jour avec succès");
      fetchUnits(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la mise à jour de l'unité"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (!unit?.id) {
      toast.error("ID de l'unité manquant");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette unité ?")) {
      try {
        setIsLoading(true);
        await axios.delete(`/units/${unit.id}`);
        toast.success("Unité supprimée avec succès");

        if (units.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchUnits(currentPage);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(
          error.response?.data?.error ||
            "Erreur lors de la suppression de l'unité"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Unités</h1>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Gérez les unités de mesure de vos produits
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une unité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button
              onClick={() => {
                setSelectedUnit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvelle Unité
            </button>
          </div>
        </div>

        {/* Table */}
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
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Nom court
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Unité de base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Opérateur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Chargement...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Aucune unité trouvée
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr
                      key={unit.id}
                      className={`${
                        isDarkMode
                          ? "bg-gray-800 hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {unit.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.short_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.base_unit || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.operator} {unit.operator_value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={!unit.is_deletable}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit)}
                          className="text-red-600 hover:text-red-900"
                          disabled={!unit.is_deletable}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && units.length > 0 && (
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
                      {Math.min(currentPage * 10, units.length)}
                    </span>{" "}
                    sur <span className="font-medium">{units.length}</span>{" "}
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
          )}
        </div>
      </div>

      {/* Modal */}
      <UnitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onSubmit={selectedUnit ? handleUpdateUnit : handleCreateUnit}
      />
    </div>
  );
};

export default UnitList;
