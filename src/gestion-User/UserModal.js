import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { UserIcon } from "@heroicons/react/24/outline";

const UserModal = ({
  isOpen,
  onClose,
  user = null,
  companies = [],
  roles = [],
  onSubmit,
}) => {
  const { isDarkMode } = useTheme();
  const initialFormState = {
    name: "",
    email: "",
    password: "",
    phone: "",
    company_id: "",
    role_id: "",
    user_type: "staff",
    status: "enabled",
    address: "",
    shipping_address: "",
    timezone: "UTC",
    profile_image: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          ...initialFormState,
          ...user,
          password: "", // Ne pas afficher le mot de passe existant
        });
        setPreviewImage(user.profile_image);
      } else {
        setFormData(initialFormState);
        setPreviewImage(null);
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Le nom est requis";
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!user && !formData.password) {
      newErrors.password =
        "Le mot de passe est requis pour un nouvel utilisateur";
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }
    if (!formData.company_id) newErrors.company_id = "L'entreprise est requise";
    if (!formData.role_id) newErrors.role_id = "Le rôle est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profile_image: "L'image ne doit pas dépasser 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({
        ...prev,
        profile_image: file,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl mx-auto my-8 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-xl`}
      >
        <div className="p-6">
          <h2
            className={`text-2xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {user ? "Modifier l'utilisateur" : "Créer un utilisateur"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo de profil */}
            <div
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Photo de profil
              </h3>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-24 w-24 rounded-full flex items-center justify-center ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-200"
                      }`}
                    >
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="profile_image"
                  />
                  <label
                    htmlFor="profile_image"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Changer la photo
                  </label>
                  {errors.profile_image && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.profile_image}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations de base */}
            <div
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Informations de base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
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
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600"
                        : "border-gray-300"
                    } ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-white text-gray-900"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {user ? "Nouveau mot de passe" : "Mot de passe *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.password
                          ? "border-red-500"
                          : isDarkMode
                          ? "border-gray-600"
                          : "border-gray-300"
                      } ${
                        isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-white text-gray-900"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Rôle et permissions */}
            <div
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Rôle et permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className={`w-full px-4 py-2 rounded-lg border ${
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
                    <p className="mt-1 text-sm text-red-500">
                      {errors.company_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Rôle *
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData({ ...formData, role_id: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.role_id
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
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {errors.role_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.role_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Type d'utilisateur
                  </label>
                  <select
                    value={formData.user_type}
                    onChange={(e) =>
                      setFormData({ ...formData, user_type: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="staff">Personnel</option>
                    <option value="admin">Administrateur</option>
                    <option value="customer">Client</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Adresses */}
            <div
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Adresses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Adresse principale
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Adresse de livraison
                  </label>
                  <textarea
                    value={formData.shipping_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping_address: e.target.value,
                      })
                    }
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Statut */}
            <div
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.status === "enabled"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.checked ? "enabled" : "disabled",
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        formData.status === "enabled"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                          formData.status === "enabled"
                            ? "translate-x-5"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                  <span
                    className={`ml-3 text-sm ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formData.status === "enabled"
                      ? "Utilisateur actif"
                      : "Utilisateur inactif"}
                  </span>
                </label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-600 text-white hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-100"
                } transition-colors`}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {user ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
