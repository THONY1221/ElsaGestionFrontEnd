import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../hooks/useTheme";
import axios from "axios";

const UnitModal = ({ isOpen, onClose, unit = null, onSubmit }) => {
  const { isDarkMode } = useTheme();
  const initialFormState = {
    company_id: "",
    name: "",
    short_name: "",
    base_unit: "",
    parent_id: "",
    operator: "*",
    operator_value: "1",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [companies, setCompanies] = useState([]);
  const [parentUnits, setParentUnits] = useState([]);

  // Charger la liste des entreprises et des unités parentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, unitsRes] = await Promise.all([
          axios.get("/entreprises"),
          axios.get("/units"),
        ]);
        setCompanies(companiesRes.data.companies || []);
        setParentUnits(unitsRes.data.units || []);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (unit) {
        setFormData({
          ...initialFormState,
          ...unit,
        });
      } else {
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [isOpen, unit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_id) newErrors.company_id = "L'entreprise est requise";
    if (!formData.name) newErrors.name = "Le nom est requis";
    if (!formData.short_name) newErrors.short_name = "Le nom court est requis";
    if (!formData.operator) newErrors.operator = "L'opérateur est requis";
    if (!formData.operator_value) {
      newErrors.operator_value = "La valeur de l'opérateur est requise";
    } else if (isNaN(formData.operator_value)) {
      newErrors.operator_value = "La valeur doit être un nombre";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] overflow-y-auto py-4">
      <div
        className={`relative w-full max-w-2xl mx-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-2xl`}
      >
        {/* En-tête du modal */}
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {unit ? "Modifier l'unité" : "Créer une unité"}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Corps du modal */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Entreprise */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Entreprise *
              </label>
              <select
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({ ...formData, company_id: e.target.value })
                }
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.company_id
                    ? "border-red-500"
                    : isDarkMode
                    ? "border-gray-600"
                    : "border-gray-300"
                } ${
                  isDarkMode
                    ? "bg-gray-700 text-white"
                    : "bg-white text-gray-900"
                }`}
              >
                <option value="">Sélectionner une entreprise</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && (
                <p className="text-red-500 text-sm mt-1">{errors.company_id}</p>
              )}
            </div>

            {/* Nom et Nom court */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.name
                      ? "border-red-500"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Ex: Kilogramme"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Nom court *
                </label>
                <input
                  type="text"
                  value={formData.short_name}
                  onChange={(e) =>
                    setFormData({ ...formData, short_name: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.short_name
                      ? "border-red-500"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Ex: kg"
                />
                {errors.short_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.short_name}
                  </p>
                )}
              </div>
            </div>

            {/* Unité parente et Unité de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Unité parente
                </label>
                <select
                  value={formData.parent_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <option value="">Aucune</option>
                  {parentUnits
                    .filter((u) => u.id !== unit?.id)
                    .map((parentUnit) => (
                      <option key={parentUnit.id} value={parentUnit.id}>
                        {parentUnit.name} ({parentUnit.short_name})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Unité de base
                </label>
                <input
                  type="text"
                  value={formData.base_unit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, base_unit: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  placeholder="Ex: g"
                />
              </div>
            </div>

            {/* Opérateur et Valeur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Opérateur *
                </label>
                <select
                  value={formData.operator}
                  onChange={(e) =>
                    setFormData({ ...formData, operator: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.operator
                      ? "border-red-500"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                >
                  <option value="*">Multiplication (*)</option>
                  <option value="/">Division (/)</option>
                  <option value="+">Addition (+)</option>
                  <option value="-">Soustraction (-)</option>
                </select>
                {errors.operator && (
                  <p className="text-red-500 text-sm mt-1">{errors.operator}</p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Valeur de l'opérateur *
                </label>
                <input
                  type="text"
                  value={formData.operator_value}
                  onChange={(e) =>
                    setFormData({ ...formData, operator_value: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.operator_value
                      ? "border-red-500"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Ex: 1000"
                />
                {errors.operator_value && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.operator_value}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div
              className={`flex justify-end space-x-4 pt-6 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2.5 rounded-lg border font-medium transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-white hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                {unit ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
