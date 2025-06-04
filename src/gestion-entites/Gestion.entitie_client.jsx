// src/gestion-entites/Gestion.entitie_client.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Row,
  Col,
  InputNumber,
  Space,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelection } from "../SelectionContext";
import "./styles.css";
import { useAuth } from "../context/AuthContext";

const { Option } = Select;

// --- Helper function to construct absolute image URL ---
const BACKEND_URL = "http://localhost:3000"; // Adjust if your backend URL is different

const getImageUrl = (imagePath) => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http")) return imagePath; // Already absolute
  // Assumes backend paths are like '/uploads/profiles/filename.png' or just 'filename.png'
  const path = imagePath.startsWith("/")
    ? imagePath
    : `/uploads/profiles/${imagePath}`;
  return `${BACKEND_URL}${path}`;
};
// --- End Helper ---

const GestionEntitieClient = () => {
  const [clients, setClients] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);

  // États pour la prévisualisation de l'image
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  // Accès au contexte de sélection
  const { selectedCompany, selectedWarehouse, setSelectedWarehouse } =
    useSelection();
  const { user, hasPermission } = useAuth();

  // État pour les filtres (ajout d'un filtre warehouse explicite)
  const [filters, setFilters] = useState({
    search: "",
    warehouse: selectedWarehouse || "", // Initialisation avec la valeur du contexte
  });

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Modified handlePreview to accept URL directly or file object
  const handlePreview = async (fileOrUrl) => {
    let imageUrl = "";
    let title = "";

    if (typeof fileOrUrl === "string") {
      // If it's a URL string (likely from table render)
      imageUrl = fileOrUrl;
      title = fileOrUrl.substring(fileOrUrl.lastIndexOf("/") + 1);
    } else if (fileOrUrl && fileOrUrl.originFileObj) {
      // If it's a file object from Upload component
      if (!fileOrUrl.url && !fileOrUrl.preview) {
        fileOrUrl.preview = await getBase64(fileOrUrl.originFileObj);
      }
      imageUrl = fileOrUrl.url || fileOrUrl.preview;
      title =
        fileOrUrl.name ||
        fileOrUrl.url.substring(fileOrUrl.url.lastIndexOf("/") + 1);
    } else if (fileOrUrl && fileOrUrl.url) {
      // Handle case where it might be a file object already processed (e.g., in form state)
      imageUrl = fileOrUrl.url;
      title =
        fileOrUrl.name ||
        fileOrUrl.url.substring(fileOrUrl.url.lastIndexOf("/") + 1);
    }

    if (imageUrl) {
      setPreviewImage(imageUrl);
      setPreviewVisible(true);
      setPreviewTitle(title);
    } else {
      message.error("Impossible d'afficher l'aperçu de l'image.");
    }
  };

  const handleCancelPreview = () => setPreviewVisible(false);

  // Charger la liste des entrepôts
  const fetchWarehouses = async () => {
    if (!selectedCompany) {
      console.log(
        "[fetchWarehouses] Aucune entreprise sélectionnée, vidage des entrepôts."
      );
      setWarehouses([]);
      return; // Ne pas faire d'appel API si aucune entreprise n'est sélectionnée
    }

    try {
      console.log(
        "[fetchWarehouses] Chargement des entrepôts pour l'entreprise:",
        selectedCompany
      );
      // Utiliser l'ID de l'entreprise sélectionnée pour filtrer les magasins
      const res = await axios.get("/api/warehouses", {
        params: { company_id: selectedCompany }, // Assurez-vous que le backend attend 'company_id'
      });
      console.log("[fetchWarehouses] Entrepôts reçus:", res.data.warehouses);
      setWarehouses(res.data.warehouses || []);
    } catch (err) {
      console.error("[fetchWarehouses] Erreur:", err);
      message.error(
        "Impossible de récupérer les magasins pour cette entreprise"
      );
      setWarehouses([]); // Vider en cas d'erreur
    }
  };

  // Mettre à jour les filtres lorsque selectedWarehouse change dans le contexte
  useEffect(() => {
    console.log(
      "[selectedWarehouse useEffect] Changement de selectedWarehouse =",
      selectedWarehouse
    );
    console.log(
      "[selectedWarehouse useEffect] Filters avant mise à jour:",
      filters
    );
    // Mettre à jour le filtre local
    setFilters((prev) => {
      const newFilters = { ...prev, warehouse: selectedWarehouse || "" };
      console.log("[selectedWarehouse useEffect] Nouveau filters:", newFilters);
      return newFilters;
    });
  }, [selectedWarehouse]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    console.log("[fetchClients] Démarrage avec filters:", filters);
    console.log("[fetchClients] selectedCompany:", selectedCompany);
    console.log("[fetchClients] selectedWarehouse:", selectedWarehouse);

    try {
      let params = {};

      if (selectedCompany) {
        params.companyId = selectedCompany;
        console.log("[fetchClients] Ajout de companyId:", selectedCompany);
      }

      // Ajouter le filtre de magasin aux paramètres de la requête si présent
      if (filters.warehouse) {
        params.warehouseId = Number(filters.warehouse);
        console.log(
          "[fetchClients] Ajout de warehouseId:",
          Number(filters.warehouse)
        );
      }

      console.log("[fetchClients] Paramètres d'API:", JSON.stringify(params));

      // Utiliser la route spécifique pour les clients
      console.log("[fetchClients] Envoi de la requête à /api/users/customers");
      const res = await axios.get("/api/users/customers", { params });

      console.log("[fetchClients] Réponse reçue:", res.data);
      console.log("[fetchClients] Status HTTP:", res.status);
      console.log("[fetchClients] Headers:", res.headers);

      // Utiliser directement les données retournées par le backend (sans filtrage côté client)
      const allClients = res.data || [];
      console.log(
        `[fetchClients] Récupéré ${allClients.length} clients au total`
      );
      console.log(
        "[fetchClients] IDs des clients:",
        allClients.map((c) => c.id)
      );

      if (allClients.length > 0) {
        console.log("[fetchClients] Premier client détails:", {
          id: allClients[0].id,
          name: allClients[0].name,
          company_id: allClients[0].company_id,
          warehouse_id: allClients[0].warehouse_id,
          user_details: allClients[0].user_details
            ? {
                warehouse_id: allClients[0].user_details.warehouse_id,
              }
            : "N/A",
        });
      }

      // On fait confiance au filtrage côté serveur uniquement
      setClients(allClients);
    } catch (err) {
      console.error("[fetchClients] Erreur:", err);
      message.error("Impossible de récupérer les clients");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, filters]); // Dépendances mises à jour - filters au lieu de selectedWarehouse

  // Charger les entrepôts au chargement initial
  useEffect(() => {
    console.log("[initial useEffect] Chargement initial des entrepôts");
    fetchWarehouses();
  }, []);

  // Charger les clients seulement quand les filtres changent
  useEffect(() => {
    console.log("[filters useEffect] Les filtres ont changé:", filters);
    console.log("[filters useEffect] Déclenchement de fetchClients");
    fetchClients();
  }, [filters, fetchClients]); // Dépendance explicite à filters

  // Recharger les entrepôts lorsque l'entreprise change
  useEffect(() => {
    console.log(
      "[company useEffect] Changement de selectedCompany =",
      selectedCompany
    );
    // L'appel fetchWarehouses ici utilisera maintenant le selectedCompany mis à jour
    fetchWarehouses();
  }, [selectedCompany]); // Dépendance à selectedCompany

  // Log quand clients change
  useEffect(() => {
    console.log(
      "[clients useEffect] La liste des clients a changé. Nombre:",
      clients.length
    );
    if (clients.length > 0) {
      console.log(
        "[clients useEffect] IDs des clients:",
        clients.map((c) => c.id)
      );
    }
  }, [clients]);

  const handleAdd = () => {
    setEditingClient(null);
    form.resetFields();

    // Valeurs par défaut pour le formulaire
    const defaultValues = {
      warehouse_id: selectedWarehouse || undefined,
      company_id: selectedCompany || undefined,
      user_details: {
        opening_balance_type: "receive",
        opening_balance: 0,
        rccm: "",
        ifu: "",
        credit_period: 0,
        credit_limit: 0,
        purchase_order_count: 0,
        purchase_return_count: 0,
        sales_order_count: 0,
        sales_return_count: 0,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0,
      },
      address: "",
      shipping_address: "",
      profile_image: [],
      status: "enabled",
    };

    form.setFieldsValue(defaultValues);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingClient(record);
    const userDetails = {
      opening_balance: record.opening_balance || 0,
      opening_balance_type: record.opening_balance_type || "receive",
      rccm: record.rccm || "",
      ifu: record.ifu || "",
      credit_period: record.credit_period || 0,
      credit_limit: record.credit_limit || 0,
      purchase_order_count: record.purchase_order_count || 0,
      purchase_return_count: record.purchase_return_count || 0,
      sales_order_count: record.sales_order_count || 0,
      sales_return_count: record.sales_return_count || 0,
      total_amount: record.total_amount || 0,
      paid_amount: record.paid_amount || 0,
      due_amount: record.due_amount || 0,
    };

    // Use helper function to get absolute URL for preview
    const absoluteImageUrl = getImageUrl(record.profile_image);
    let fileList = [];
    if (absoluteImageUrl) {
      fileList = [
        {
          uid: "-1",
          name: record.profile_image.split("/").pop() || "image.png",
          status: "done",
          url: absoluteImageUrl, // Use absolute URL
          thumbUrl: absoluteImageUrl, // Use absolute URL for thumbnail
        },
      ];
    }

    form.setFieldsValue({
      ...record,
      user_details: userDetails,
      profile_image: fileList, // Set the processed fileList
      warehouse_id: record.warehouse_id,
      company_id: record.company_id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`/api/users/${record.id}`);
      message.success("Client supprimé avec succès");
      fetchClients();
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        "Erreur lors de la suppression du client";
      message.error(errMsg);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      // Vérifier si un magasin est sélectionné dans le formulaire
      if (!values.warehouse_id) {
        Modal.warning({
          title: "Magasin requis",
          content: "Veuillez sélectionner un magasin avant d'enregistrer.",
        });
        setConfirmLoading(false);
        return;
      }

      // Préparer les données du formulaire
      const formData = new FormData();

      // Ajouter les champs principaux
      Object.keys(values).forEach((key) => {
        if (key === "profile_image" && values[key]) {
          // Si c'est un tableau de fichiers (upload)
          if (Array.isArray(values[key])) {
            if (values[key].length > 0 && values[key][0].originFileObj) {
              // Nouveau fichier sélectionné
              formData.append("profile_image", values[key][0].originFileObj);
            } else if (
              values[key].length === 0 &&
              editingClient?.profile_image
            ) {
              // Si le tableau est vide et qu'il y avait une image avant, envoyer un indicateur de suppression
              formData.append("remove_profile_image", "true");
            }
          }
        } else if (key === "user_details") {
          // Traiter les détails utilisateur séparément
          Object.keys(values.user_details).forEach((detailKey) => {
            if (
              values.user_details[detailKey] !== undefined &&
              values.user_details[detailKey] !== null
            ) {
              formData.append(detailKey, values.user_details[detailKey]);
            }
          });
        } else if (values[key] !== undefined && values[key] !== null) {
          // Ne jamais envoyer le champ password s'il existe dans les valeurs
          if (key !== "password" && key !== "password_confirmation") {
            formData.append(key, values[key]);
          }
        }
      });

      // Ajouter le type d'utilisateur
      formData.append("user_type", "customers");

      // Ajouter l'ID du magasin sélectionné si pas déjà défini
      if (!values.warehouse_id && selectedWarehouse) {
        const warehouseId = Number(selectedWarehouse);
        formData.append("warehouse_id", warehouseId);
        formData.append("details_warehouse_id", warehouseId);
        console.log("Ajout du magasin depuis le contexte:", warehouseId);
      } else if (values.warehouse_id) {
        const warehouseId = Number(values.warehouse_id);
        formData.append("warehouse_id", warehouseId);
        formData.append("details_warehouse_id", warehouseId);
        console.log("Ajout du magasin depuis le formulaire:", warehouseId);
      }

      // Ajouter l'ID de l'entreprise si pas déjà défini
      if (!values.company_id && selectedCompany) {
        const companyId = Number(selectedCompany);
        formData.append("company_id", companyId);
        console.log("Ajout de l'entreprise depuis le contexte:", companyId);
      } else if (values.company_id) {
        const companyId = Number(values.company_id);
        formData.append("company_id", companyId);
        console.log("Ajout de l'entreprise depuis le formulaire:", companyId);
      }

      // Ajouter les valeurs par défaut pour les champs requis par le backend
      formData.append(
        "timezone",
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      formData.append("date_format", "d-m-Y");
      formData.append("date_picker_format", "dd-mm-yyyy");
      formData.append("time_format", "h:i a");

      let response;
      if (editingClient) {
        // Mise à jour d'un client existant
        response = await axios.put(`/api/users/${editingClient.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Client mis à jour avec succès");
      } else {
        // Création d'un nouveau client
        response = await axios.post("/api/users", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Client ajouté avec succès");
      }

      // Rafraîchir la liste des clients
      fetchClients();
      setIsModalVisible(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      message.error(
        "Erreur lors de la soumission du formulaire: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns = [
    {
      title: "Nom ou Raison sociale",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <span
          style={{
            color:
              selectedWarehouse && !record.matchesWarehouse
                ? "#999"
                : "inherit",
            fontWeight:
              selectedWarehouse && record.matchesWarehouse ? "bold" : "normal",
          }}
        >
          {text}{" "}
          {selectedWarehouse && record.matchesWarehouse && (
            <span style={{ color: "green" }}>✓</span>
          )}
        </span>
      ),
    },
    {
      title: "Logo",
      dataIndex: "profile_image",
      key: "logo",
      width: 150,
      render: (profile_image) => {
        const imageUrl = getImageUrl(profile_image); // Use helper here

        if (!imageUrl) return "Pas de logo";

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={imageUrl} // Use the absolute URL
              alt="Logo"
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                marginRight: 8,
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40?text=No+Image";
              }}
            />
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering row click if any
                handlePreview(imageUrl); // Pass the URL directly to preview
              }}
            >
              Aperçu
            </Button>
          </div>
        );
      },
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_id",
      key: "warehouse",
      render: (warehouse_id) => {
        const warehouse = warehouses.find(
          (w) => Number(w.id) === Number(warehouse_id)
        );
        return warehouse ? warehouse.name : "N/A";
      },
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Téléphone", dataIndex: "phone", key: "phone" },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          style={{
            color: status === "enabled" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {status === "enabled" ? "Activé" : "Désactivé"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {hasPermission("Gestion Commerciale.Entites.Clients.edit") && (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ marginRight: 8 }}
            />
          )}
          {hasPermission("Gestion Commerciale.Entites.Clients.delete") && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          )}
        </>
      ),
    },
  ];

  // Vérifier si l'utilisateur a la permission de voir le module
  if (!hasPermission("Gestion Commerciale.Entites.Clients.view")) {
    return (
      <div className="gestion-entitie-container">
        <h1>Gestion des Clients</h1>
        <p>
          Vous n'avez pas les permissions nécessaires pour voir cette section.
        </p>
      </div>
    );
  }

  return (
    <div className="gestion-entitie-container">
      <div className="header-container">
        <h1>Gestion des Clients</h1>
        {hasPermission("Gestion Commerciale.Entites.Clients.create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="add-button"
          >
            Ajouter un Client
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Aucun client trouvé" }}
      />
      <Modal
        title={editingClient ? "Modifier le client" : "Ajouter un client"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Enregistrer"
        cancelText="Annuler"
        width={800}
        confirmLoading={confirmLoading}
      >
        <Form form={form} layout="vertical">
          {/* Section Informations Générales */}
          <Divider orientation="left">Informations Générales</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nom ou Raison sociale"
                rules={[{ required: true, message: "Veuillez saisir le nom" }]}
              >
                <Input
                  placeholder="Nom ou Raison sociale"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: "email", message: "Email invalide" },
                  { required: true, message: "Veuillez saisir l'email" },
                ]}
              >
                <Input placeholder="Email" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Téléphone">
                <Input placeholder="Téléphone" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Statut"
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner un statut",
                  },
                ]}
              >
                <Select placeholder="Sélectionner un statut">
                  <Option value="enabled">Activé</Option>
                  <Option value="disabled">Désactivé</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Section Adresse */}
          <Divider orientation="left">Adresse</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="address"
                label="Adresse"
                rules={[
                  { required: true, message: "Veuillez saisir l'adresse" },
                ]}
              >
                <Input placeholder="Adresse" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shipping_address" label="Adresse de livraison">
                <Input placeholder="Adresse de livraison (si différente)" />
              </Form.Item>
            </Col>
          </Row>

          {/* Section Association */}
          <Divider orientation="left">Association</Divider>
          <Form.Item
            name="warehouse_id"
            label="Magasin Associé"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un magasin",
              },
            ]}
            initialValue={selectedWarehouse}
            tooltip="Le magasin principal auquel ce client est rattaché."
          >
            <Select
              placeholder="Sélectionner un magasin"
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Section Informations Commerciales */}
          <Divider orientation="left">Informations Commerciales</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={["user_details", "rccm"]} label="Numéro RCCM">
                <Input placeholder="RCCM" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={["user_details", "ifu"]} label="Numéro IFU">
                <Input placeholder="IFU" />
              </Form.Item>
            </Col>
          </Row>

          {/* Section Conditions de Crédit */}
          <Divider orientation="left">Conditions de Crédit</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["user_details", "credit_period"]}
                label="Période de crédit (jours)"
                rules={[
                  {
                    required: true,
                    message: "Veuillez saisir la période de crédit",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Ex: 30"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["user_details", "credit_limit"]}
                label="Limite de crédit (Montant)"
                rules={[
                  {
                    required: true,
                    message: "Veuillez saisir la limite de crédit",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Ex: 500000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Section Solde Initial */}
          <Divider orientation="left">Solde Initial</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["user_details", "opening_balance"]}
                label="Solde d'ouverture"
                rules={[
                  {
                    required: true,
                    message: "Veuillez saisir le solde d'ouverture",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Montant initial"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["user_details", "opening_balance_type"]}
                label="Type de solde d'ouverture"
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner le type de solde",
                  },
                ]}
                initialValue="receive" // Default for client
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="receive">À recevoir (Créance)</Option>
                  <Option value="pay">À payer (Dette)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Section Logo */}
          <Divider orientation="left">Logo</Divider>
          <Form.Item
            name="profile_image"
            label="Télécharger un logo"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
            extra="Le logo sera affiché dans les listes et documents."
          >
            <Upload
              name="profile_image"
              listType="picture-card"
              onPreview={handlePreview}
              beforeUpload={() => false} // Prevent auto upload
              maxCount={1}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancelPreview}
      >
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default GestionEntitieClient;
