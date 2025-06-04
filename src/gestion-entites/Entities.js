import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Entities.css";

const Entities = () => {
  const [isClientView, setIsClientView] = useState(true);
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({
    Nom_Raison_Sociale: "",
    Numero_Telephone: "",
    Email: "",
    IFU: "",
    RCCM: "",
    Adresse_Geographique: "",
    Boite_Postale: "",
    Periode_Credit: 0,
    Limite_Credit: 0,
    Montant: 0,
    logo: null,
  });
  const [editingEntity, setEditingEntity] = useState(null);
  const [isFormDirty, setIsFormDirty] = useState(false); // Nouvel état pour suivre si le formulaire est en cours de remplissage
  const logoInputRef = React.useRef(null);

  const fetchEntities = useCallback(async () => {
    try {
      const endpoint = isClientView
        ? "http://localhost:3000/api/clients"
        : "http://localhost:3000/api/fournisseurs";
      const response = await axios.get(endpoint);
      setEntities(response.data);
      toast.success("Listes des entités chargée avec sucess !");
    } catch (error) {
      console.error("Erreur lors de la récupération des entités :", error);
      toast.error("Erreur lors de la récupération des données.");
    }
  }, [isClientView]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setIsFormDirty(true); // Marquer le formulaire comme "dirty" dès qu'un champ est modifié
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, logo: e.target.files[0] });
    setIsFormDirty(true); // Marquer le formulaire comme "dirty" dès qu'un fichier est sélectionné
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key] || "");
    });

    const endpoint = isClientView
      ? "http://localhost:3000/api/clients"
      : "http://localhost:3000/api/fournisseurs";

    try {
      if (editingEntity) {
        const entityId = isClientView
          ? editingEntity.ID_Client
          : editingEntity.ID_Frs;

        console.log("Données envoyées pour mise à jour :", formDataToSend);

        await axios.put(`${endpoint}/${entityId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Entité modifiée avec succès !", {
          autoClose: 2000,
        });
      } else {
        await axios.post(endpoint, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      resetForm();
      fetchEntities();
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification de l'entité :", error);
      toast.error("Erreur lors de l'enregistrement de l'entité.");
    }
  };

  const resetForm = () => {
    setFormData({
      Nom_Raison_Sociale: "",
      Numero_Telephone: "",
      Email: "",
      IFU: "",
      RCCM: "",
      Adresse_Geographique: "",
      Boite_Postale: "",
      Periode_Credit: 0,
      Limite_Credit: 0,
      Montant: 0,
      logo: null,
    });

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }

    setEditingEntity(null);
    setIsFormDirty(false); // Réinitialiser l'état "dirty" après la réinitialisation du formulaire
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setFormData({
      Nom_Raison_Sociale: entity.Nom_Raison_Sociale,
      Numero_Telephone: entity.Numero_Telephone,
      Email: entity.Email,
      IFU: entity.IFU || "",
      RCCM: entity.RCCM || "",
      Adresse_Geographique: entity.Adresse_Geographique || "",
      Boite_Postale: entity.Boite_Postale || "",
      Periode_Credit: entity.Periode_Credit || 0,
      Limite_Credit: entity.Limite_Credit || 0,
      Montant: isClientView
        ? entity.Montant_Creances_Initiale || 0
        : entity.Montant_Dette_Initiale || 0,
      logo: null,
    });
    setIsFormDirty(true); // Marquer le formulaire comme "dirty" lors de l'édition
  };

  const handleDelete = async (id) => {
    const endpoint = isClientView
      ? "http://localhost:3000/api/clients"
      : "http://localhost:3000/api/fournisseurs";

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entité ?")) {
      try {
        await axios.delete(`${endpoint}/${id}`);
        toast.success("Entité supprimée avec succès !");
        fetchEntities();
      } catch (error) {
        console.error("Erreur lors de la suppression de l'entité :", error);
        toast.error("Erreur lors de la suppression de l'entité.");
      }
    }
  };

  return (
    <div className="entities-container">
      <ToastContainer />
      <h1 className="title">
        {isClientView ? "Gestion des Clients" : "Gestion des Fournisseurs"}
      </h1>
      <div className="form-container">
        <form onSubmit={handleFormSubmit} className="entity-form">
          <div className="form-group">
            <label htmlFor="Nom_Raison_Sociale">Nom de l'entité *</label>
            <input
              type="text"
              id="Nom_Raison_Sociale"
              name="Nom_Raison_Sociale"
              value={formData.Nom_Raison_Sociale}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="Numero_Telephone">Téléphone *</label>
            <input
              type="text"
              id="Numero_Telephone"
              name="Numero_Telephone"
              value={formData.Numero_Telephone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="Email">Email *</label>
            <input
              type="email"
              id="Email"
              name="Email"
              value={formData.Email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="IFU">N° IFU</label>
            <input
              type="text"
              id="IFU"
              name="IFU"
              value={formData.IFU}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="RCCM">N° RCCM</label>
            <input
              type="text"
              id="RCCM"
              name="RCCM"
              value={formData.RCCM}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Adresse_Geographique">Adresse géographique</label>
            <input
              type="text"
              id="Adresse_Geographique"
              name="Adresse_Geographique"
              value={formData.Adresse_Geographique}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Boite_Postale">Boite Postale</label>
            <input
              type="text"
              id="Boite_Postale"
              name="Boite_Postale"
              value={formData.Boite_Postale}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Periode_Credit">Période de crédit (en jours)</label>
            <input
              type="number"
              id="Periode_Credit"
              name="Periode_Credit"
              value={formData.Periode_Credit}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Limite_Credit">Montant limite du crédit</label>
            <input
              type="number"
              id="Limite_Credit"
              name="Limite_Credit"
              value={formData.Limite_Credit}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Montant">Montant dû ou à recevoir</label>
            <input
              type="number"
              id="Montant"
              name="Montant"
              value={formData.Montant}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="logo">Logo</label>
            <input
              type="file"
              id="logo"
              name="logo"
              ref={logoInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-submit">
              {editingEntity
                ? "Modifier"
                : isClientView
                ? "Créer Client"
                : "Créer Fournisseur"}
            </button>
            {isFormDirty && (
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="toggle-buttons">
        <button
          className={`toggle-btn ${isClientView ? "active" : ""}`}
          onClick={() => setIsClientView(true)}
        >
          Clients
        </button>
        <button
          className={`toggle-btn ${!isClientView ? "active" : ""}`}
          onClick={() => setIsClientView(false)}
        >
          Fournisseurs
        </button>
      </div>
      <div className="entity-list">
        <h2>Liste des {isClientView ? "Clients" : "Fournisseurs"}</h2>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>IFU</th>
              <th>RCCM</th>
              <th>Adresse</th>
              <th>Logo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={entity.ID_Client || entity.ID_Frs}>
                <td>{entity.Nom_Raison_Sociale}</td>
                <td>{entity.Numero_Telephone}</td>
                <td>{entity.Email}</td>
                <td>{entity.IFU}</td>
                <td>{entity.RCCM}</td>
                <td>{entity.Adresse_Geographique}</td>
                <td>
                  {entity.logo ? (
                    <img
                      src={`http://localhost:3000${entity.logo}`}
                      alt={entity.Nom_Raison_Sociale}
                      className="entity-logo"
                    />
                  ) : (
                    <span className="no-logo">Aucun logo</span>
                  )}
                </td>

                <td>
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(entity)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() =>
                      handleDelete(entity.ID_Client || entity.ID_Frs)
                    }
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Entities;
