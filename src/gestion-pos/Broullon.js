import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  Edit,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GestionVentes = () => {
  // États
  const [ventes, setVentes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tout");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);

  // État du formulaire
  const [formData, setFormData] = useState({
    Date_Facture: new Date().toISOString().split("T")[0],
    Client_ID: "",
    Statut_Vente: "Commandé",
    produitsVendus: [],
    Taxe: null,
    Remise: 0,
    Expedition: 0,
    Remarques: "",
    Termes_Conditions: "",
  });

  // Chargement initial des données
  useEffect(() => {
    fetchData();
  }, []);

  // Effet pour la recherche de clients
  useEffect(() => {
    if (clientSearchTerm) {
      const filtered = clients.filter((client) =>
        client.Nom_Raison_Sociale.toLowerCase().includes(
          clientSearchTerm.toLowerCase()
        )
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearchTerm, clients]);

  const fetchData = async () => {
    try {
      const [ventesRes, clientsRes, produitsRes, taxesRes] = await Promise.all([
        axios.get("http://localhost:3000/api/ventes"),
        axios.get("http://localhost:3000/api/clients"),
        axios.get("http://localhost:3000/api/produits"),
        axios.get("http://localhost:3000/api/taxes"),
      ]);
      setVentes(ventesRes.data);
      setClients(clientsRes.data);
      setProduits(produitsRes.data);
      setTaxes(taxesRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    }
  };

  // Fonction pour charger les détails d'une vente
  const loadVenteDetails = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/ventes/${id}`
      );
      const updatedVentes = ventes.map((vente) =>
        vente.id === id
          ? { ...vente, produitsVendus: response.data.produitsVendus }
          : vente
      );
      setVentes(updatedVentes);
      return response.data;
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      toast.error("Erreur lors du chargement des détails");
      return null;
    }
  };

  // Gestion des actions sur les ventes
  const handleVenteAction = async (action, vente) => {
    switch (action) {
      case "edit":
        setFormData({
          ...vente,
          Client_ID: vente.Client_ID,
          Date_Facture: new Date(vente.Date_Facture)
            .toISOString()
            .split("T")[0],
        });
        setShowForm(true);
        break;
      case "delete":
        if (
          window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")
        ) {
          try {
            await axios.delete(`http://localhost:3000/api/ventes/${vente.id}`);
            toast.success("Vente supprimée avec succès");
            fetchData();
          } catch (error) {
            toast.error("Erreur lors de la suppression");
          }
        }
        break;
      case "download":
        toast.info("Fonctionnalité de téléchargement à venir");
        break;
      default:
        break;
    }
  };

  // Gestion de la recherche de clients
  const handleClientSearch = (searchTerm) => {
    setClientSearchTerm(searchTerm);
    setShowClientDropdown(true);
  };

  // Sélection d'un client
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.Nom_Raison_Sociale);
    setFormData({ ...formData, Client_ID: client.ID_Client });
    setShowClientDropdown(false);
  };

  // Gestion de l'expansion des lignes
  const handleRowExpand = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      const details = await loadVenteDetails(id);
      if (details) {
        setExpandedRow(id);
      }
    }
  };

  // Rendu du tableau des ventes
  const renderVentesTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 p-4"></th>
            <th className="text-left p-4">Numéro de facture</th>
            <th className="text-left p-4">Date de vente</th>
            <th className="text-left p-4">Client</th>
            <th className="text-left p-4">Statut des ventes</th>
            <th className="text-right p-4">Montant payé</th>
            <th className="text-right p-4">Montant total</th>
            <th className="text-center p-4">Statut de paiement</th>
            <th className="w-10 p-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {ventes.map((vente) => (
            <React.Fragment key={vente.id}>
              <tr className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <button
                    onClick={() => handleRowExpand(vente.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {expandedRow === vente.id ? "-" : "+"}
                  </button>
                </td>
                <td className="p-4">{vente.Numero_Facture}</td>
                <td className="p-4">
                  {new Date(vente.Date_Facture).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {
                    clients.find((c) => c.ID_Client === vente.Client_ID)
                      ?.Nom_Raison_Sociale
                  }
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      vente.Statut_Vente === "Livré"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {vente.Statut_Vente}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {vente.Montant_Paye.toLocaleString()} CFA
                </td>
                <td className="p-4 text-right">
                  {vente.Montant_TTC.toLocaleString()} CFA
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      vente.Statut_Paiement === "Payé"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {vente.Statut_Paiement}
                  </span>
                </td>
                <td className="p-4">
                  <div className="relative group">
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <MoreVertical size={20} className="text-gray-400" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden group-hover:block z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleVenteAction("edit", vente)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit size={16} className="mr-2" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleVenteAction("delete", vente)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Supprimer
                        </button>
                        <button
                          onClick={() => handleVenteAction("download", vente)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Download size={16} className="mr-2" />
                          Télécharger
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              {expandedRow === vente.id && vente.produitsVendus && (
                <tr>
                  <td colSpan="9" className="p-4 bg-gray-50">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">
                        Détails de la vente
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {vente.produitsVendus.map((produit, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg shadow"
                          >
                            <h5 className="font-medium text-gray-900">
                              {produit.nom_produit}
                            </h5>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                Quantité: {produit.quantite}
                              </p>
                              <p className="text-sm text-gray-600">
                                Prix unitaire:{" "}
                                {produit.prix_unitaire_HT.toLocaleString()} CFA
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                Total:{" "}
                                {(
                                  produit.prix_unitaire_HT * produit.quantite
                                ).toLocaleString()}{" "}
                                CFA
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Rendu du composant principal
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span>Tableau de bord</span>
          <span className="mx-2">/</span>
          <span>Ventes</span>
          <span className="mx-2">/</span>
          <span>Ventes</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Ajouter de nouvelles ventes
        </button>

        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par Numéro..."
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Sélectionner Client..."
              className="pl-4 pr-10 py-2 border rounded-lg w-64"
              value={clientSearchTerm}
              onChange={(e) => handleClientSearch(e.target.value)}
              onFocus={() => setShowClientDropdown(true)}
            />
            {showClientDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.ID_Client}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleClientSelect(client)}
                  >
                    {client.Nom_Raison_Sociale}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="date"
              className="pl-4 pr-10 py-2 border rounded-lg w-64"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <Calendar
              className="absolute right-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b">
          <nav className="flex gap-6" aria-label="Tabs">
            {["tout", "non-paye", "paye"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "tout"
                  ? "Tout Ventes"
                  : tab === "non-paye"
                  ? "Non payé"
                  : "Payé"}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {renderVentesTable()}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Vente</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client *
                  </label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                    value={formData.Client_ID}
                    onChange={(e) =>
                      setFormData({ ...formData, Client_ID: e.target.value })
                    }
                    required
                  >
                    <option value="">Sélectionner Client...</option>
                    {clients.map((client) => (
                      <option key={client.ID_Client} value={client.ID_Client}>
                        {client.Nom_Raison_Sociale}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de vente *
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                    value={formData.Date_Facture}
                    onChange={(e) =>
                      setFormData({ ...formData, Date_Facture: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Produits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                  placeholder="Rechercher le nom du produit / le code de l'article / Scanner le code à barres"
                />
              </div>

              {/* Tableau des produits */}
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Nom</th>
                    <th className="text-right p-2">Quantité</th>
                    <th className="text-right p-2">Prix Unitaire</th>
                    <th className="text-right p-2">Remise</th>
                    <th className="text-right p-2">Taxe</th>
                    <th className="text-center p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.produitsVendus.map((produit, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{produit.nom_produit}</td>
                      <td className="p-2 text-right">{produit.quantite}</td>
                      <td className="p-2 text-right">
                        {produit.prix_unitaire_HT}
                      </td>
                      <td className="p-2 text-right">0</td>
                      <td className="p-2 text-right">0</td>
                      <td className="p-2 text-center">
                        <button type="button" className="text-red-600">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Termes et conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Termes & Conditions d'utilisation
                </label>
                <textarea
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                  rows={3}
                  value={formData.Termes_Conditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Termes_Conditions: e.target.value,
                    })
                  }
                />
              </div>

              {/* Remarques */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Remarques
                </label>
                <textarea
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                  rows={3}
                  value={formData.Remarques}
                  onChange={(e) =>
                    setFormData({ ...formData, Remarques: e.target.value })
                  }
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionVentes;
