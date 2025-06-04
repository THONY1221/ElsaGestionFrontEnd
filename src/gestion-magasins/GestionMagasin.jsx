// GestionWarehouses.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Upload,
  notification,
  message,
  Spin,
  Space,
  Row,
  Col,
  Switch,
  Card,
  Divider,
  Tag,
  Typography,
  Tooltip,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

// Configuration de l'URL de base pour Axios
axios.defaults.baseURL = "http://localhost:3000";

notification.config({
  duration: 2,
  placement: "topLeft",
  top: window.innerHeight / 2 - 50,
  style: { fontSize: "12px" },
});

const GestionWarehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [warehouseDetails, setWarehouseDetails] = useState(null);
  const { user, hasPermission } = useAuth();
  const { selectedCompany } = useSelection();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fonction pour construire l'URL du logo de manière simple
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;

    try {
      if (logoPath.startsWith("http")) {
        return logoPath;
      } else if (logoPath.startsWith("/uploads/")) {
        return `http://localhost:3000${logoPath}`;
      } else {
        return `http://localhost:3000/uploads/warehouses/${logoPath}`;
      }
    } catch (error) {
      console.error("Erreur lors de la construction de l'URL du logo:", error);
      return null;
    }
  };

  // Fonction pour prévisualiser un logo
  const handlePreviewLogo = (logoUrl, warehouseName) => {
    setPreviewImage(logoUrl);
    setPreviewVisible(true);
    setPreviewTitle(`Logo de ${warehouseName}`);
  };

  // Fonction pour fermer la prévisualisation
  const handleCancelPreview = () => {
    setPreviewVisible(false);
  };

  // Nouveau filtre dynamique pour les entrepôts
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredWarehouses(warehouses);
    } else {
      const filtered = warehouses.filter(
        (warehouse) =>
          warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          warehouse.company_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          warehouse.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          warehouse.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWarehouses(filtered);
    }
  }, [searchTerm, warehouses]);

  const fetchWarehouses = async (page = 1) => {
    try {
      setIsLoading(true);
      if (!selectedCompany) {
        console.log("No company selected, clearing warehouses.");
        setWarehouses([]);
        setFilteredWarehouses([]);
        setTotalPages(1);
        setCurrentPage(1);
        setIsLoading(false);
        return;
      }

      // Ajout du préfixe /api explicitement
      console.log(
        `Fetching warehouses for company ${selectedCompany} from: ${axios.defaults.baseURL}/api/warehouses?page=${page}&company_id=${selectedCompany}`
      );
      const response = await axios.get(
        `/api/warehouses?page=${page}&company_id=${selectedCompany}`
      );
      console.log("Warehouses response:", response.data);
      const warehousesData = response.data.warehouses || [];
      setWarehouses(warehousesData);
      setFilteredWarehouses(warehousesData);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur lors du chargement des entrepôts:", error);
      console.error(
        "URL utilisée:",
        `${axios.defaults.baseURL}/api/warehouses?page=${page}`
      );
      notification.error({
        message: "Erreur de chargement",
        description:
          error.response?.data?.error ||
          "Erreur lors du chargement des entrepôts",
      });
      setWarehouses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      // Ajout du préfixe /api explicitement
      console.log(
        `Fetching companies from: ${axios.defaults.baseURL}/api/companies`
      );
      const response = await axios.get("/api/companies");
      console.log("Companies response:", response.data);
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error);
      console.error("URL utilisée:", `${axios.defaults.baseURL}/api/companies`);
      notification.error({
        message: "Erreur de chargement",
        description:
          error.response?.data?.error ||
          "Erreur lors du chargement des entreprises",
      });
      setCompanies([]);
    }
  };

  useEffect(() => {
    fetchWarehouses(currentPage);
    fetchCompanies();
  }, [currentPage, selectedCompany]);

  const handleCreateWarehouse = async (formData) => {
    try {
      setIsLoading(true);
      const form = new FormData();

      // Traitement des champs standards
      Object.keys(formData).forEach((key) => {
        if (!["logo", "dark_logo", "signature"].includes(key)) {
          form.append(key, formData[key]);
        }
      });

      // Traitement spécifique des images
      if (formData.logo && formData.logo instanceof File) {
        form.append("logo", formData.logo);
        console.log("[CREATE] Logo ajouté:", formData.logo.name);
      }

      if (formData.dark_logo && formData.dark_logo instanceof File) {
        form.append("dark_logo", formData.dark_logo);
        console.log("[CREATE] Dark logo ajouté:", formData.dark_logo.name);
      }

      if (formData.signature && formData.signature instanceof File) {
        form.append("signature", formData.signature);
        console.log("[CREATE] Signature ajoutée:", formData.signature.name);
      }

      console.log("[CREATE] Données envoyées:", Object.fromEntries(form));

      const response = await axios.post("/api/warehouses", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[CREATE] Réponse du serveur:", response.data);
      message.success("Entrepôt créé avec succès");
      fetchWarehouses(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de la création de l'entrepôt",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWarehouse = async (formData) => {
    if (!selectedWarehouse?.id) {
      message.error("ID de l'entrepôt manquant");
      return;
    }
    try {
      setIsLoading(true);
      const form = new FormData();

      // Traitement des champs standards
      Object.keys(formData).forEach((key) => {
        if (!["logo", "dark_logo", "signature"].includes(key)) {
          form.append(key, formData[key]);
        }
      });

      // Traitement spécifique des images
      if (formData.logo && formData.logo instanceof File) {
        form.append("logo", formData.logo);
        console.log("[UPDATE] Logo ajouté:", formData.logo.name);
      }

      if (formData.dark_logo && formData.dark_logo instanceof File) {
        form.append("dark_logo", formData.dark_logo);
        console.log("[UPDATE] Dark logo ajouté:", formData.dark_logo.name);
      }

      if (formData.signature && formData.signature instanceof File) {
        form.append("signature", formData.signature);
        console.log("[UPDATE] Signature ajoutée:", formData.signature.name);
      }

      console.log("[UPDATE] Données envoyées:", Object.fromEntries(form));
      console.log("[UPDATE] ID de l'entrepôt:", selectedWarehouse.id);

      const response = await axios.put(
        `/api/warehouses/${selectedWarehouse.id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("[UPDATE] Réponse du serveur:", response.data);

      if (response.data.warehouse) {
        setWarehouses((prev) =>
          prev.map((w) =>
            w.id === selectedWarehouse.id
              ? { ...w, ...response.data.warehouse }
              : w
          )
        );
      }

      message.success("Entrepôt mis à jour avec succès");
      setIsModalOpen(false);
      fetchWarehouses(currentPage);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de la mise à jour de l'entrepôt",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWarehouse = async (warehouse) => {
    if (!warehouse?.id) {
      message.error("ID de l'entrepôt manquant");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet entrepôt ?")) {
      try {
        setIsLoading(true);
        await axios.delete(`/api/warehouses/${warehouse.id}`);
        message.success("Entrepôt supprimé avec succès");
        if (warehouses.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchWarehouses(currentPage);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        notification.error({
          message: "Erreur",
          description:
            error.response?.data?.error ||
            "Erreur lors de la suppression de l'entrepôt",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleStatus = async (warehouse) => {
    const newStatus = warehouse.status === "active" ? "inactive" : "active";
    try {
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === warehouse.id ? { ...w, status: newStatus } : w
        )
      );
      await axios.patch(`/api/warehouses/${warehouse.id}/status`, {
        status: newStatus,
      });
      message.success(`Statut mis à jour : ${newStatus}`);
    } catch (error) {
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === warehouse.id ? { ...w, status: warehouse.status } : w
        )
      );
      console.error("Erreur lors de la mise à jour du statut:", error);
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de la mise à jour du statut",
      });
    }
  };

  // Fonction pour afficher les détails du magasin
  const handleViewWarehouseDetails = (warehouse) => {
    setWarehouseDetails(warehouse);
    setDetailModalVisible(true);
  };

  // Fonction pour fermer le modal de détails
  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setWarehouseDetails(null);
  };

  const WarehouseModal = ({
    visible,
    onClose,
    warehouse = null,
    companies = [],
    onSubmit,
  }) => {
    const [form] = Form.useForm();
    const [modalPreviewVisible, setModalPreviewVisible] = useState(false);
    const [modalPreviewImage, setModalPreviewImage] = useState("");
    const [modalPreviewTitle, setModalPreviewTitle] = useState("");

    // Fonction pour convertir un fichier en base64 pour la prévisualisation
    const getBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };

    // Gestion de la prévisualisation des images dans le modal
    const handleModalPreview = async (file) => {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj);
      }
      setModalPreviewImage(file.url || file.preview);
      setModalPreviewVisible(true);
      setModalPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
    };

    const handleModalCancelPreview = () => setModalPreviewVisible(false);

    useEffect(() => {
      if (visible) {
        if (warehouse) {
          // Préparation des valeurs pour le formulaire
          const fileListLogo = [];
          const fileListDarkLogo = [];
          const fileListSignature = [];

          // Traitement du logo
          if (warehouse.logo) {
            const logoURL = warehouse.logo.startsWith("http")
              ? warehouse.logo
              : warehouse.logo.startsWith("/uploads/")
              ? `http://localhost:3000${warehouse.logo}`
              : `http://localhost:3000/uploads/warehouses/${warehouse.logo}`;

            fileListLogo.push({
              uid: "-1",
              name: "logo",
              status: "done",
              url: logoURL,
            });
          }

          // Traitement du dark_logo
          if (warehouse.dark_logo) {
            const darkLogoURL = warehouse.dark_logo.startsWith("http")
              ? warehouse.dark_logo
              : warehouse.dark_logo.startsWith("/uploads/")
              ? `http://localhost:3000${warehouse.dark_logo}`
              : `http://localhost:3000/uploads/warehouses/${warehouse.dark_logo}`;

            fileListDarkLogo.push({
              uid: "-1",
              name: "dark_logo",
              status: "done",
              url: darkLogoURL,
            });
          }

          // Traitement de la signature
          if (warehouse.signature) {
            const signatureURL = warehouse.signature.startsWith("http")
              ? warehouse.signature
              : warehouse.signature.startsWith("/uploads/")
              ? `http://localhost:3000${warehouse.signature}`
              : `http://localhost:3000/uploads/warehouses/${warehouse.signature}`;

            fileListSignature.push({
              uid: "-1",
              name: "signature",
              status: "done",
              url: signatureURL,
            });
          }

          // Conversion explicite des valeurs booléennes
          const values = {
            name: warehouse.name,
            company_id: warehouse.company_id,
            address: warehouse.address,
            phone: warehouse.phone,
            email: warehouse.email,
            status: warehouse.status === "active",
            show_email_on_invoice: Boolean(
              Number(warehouse.show_email_on_invoice)
            ),
            show_phone_on_invoice: Boolean(
              Number(warehouse.show_phone_on_invoice)
            ),
            terms_condition: warehouse.terms_condition,
            bank_details: warehouse.bank_details,
            prefixe_inv: warehouse.prefixe_inv,
            online_store_enabled: Boolean(
              Number(warehouse.online_store_enabled)
            ),
            customers_visibility: warehouse.customers_visibility || "all",
            suppliers_visibility: warehouse.suppliers_visibility || "all",
            products_visibility: warehouse.products_visibility || "all",
            default_pos_order_status:
              warehouse.default_pos_order_status || "delivered",
            show_mrp_on_invoice: Boolean(Number(warehouse.show_mrp_on_invoice)),
            show_discount_tax_on_invoice: Boolean(
              Number(warehouse.show_discount_tax_on_invoice)
            ),
            logo: fileListLogo,
            dark_logo: fileListDarkLogo,
            signature: fileListSignature,
          };
          form.setFieldsValue(values);
          console.log("[Modal] Valeurs chargées pour modification:", values);
        } else {
          form.resetFields();
        }
      }
    }, [visible, warehouse, form]);

    const handleOk = () => {
      form
        .validateFields()
        .then((values) => {
          console.log("[Modal] Valeurs soumises avant traitement:", values);
          const processedValues = { ...values };

          // Gérer les fichiers d'images
          ["logo", "dark_logo", "signature"].forEach((field) => {
            if (
              values[field] &&
              Array.isArray(values[field]) &&
              values[field].length > 0
            ) {
              // Si c'est un tableau d'objets fileList (comme retourné par Upload)
              processedValues[field] = values[field][0].originFileObj;
              console.log(
                `[Modal] Fichier ${field} traité:`,
                values[field][0].name
              );
            } else if (
              values[field] &&
              values[field].fileList &&
              values[field].fileList.length > 0
            ) {
              // Si c'est un objet avec une propriété fileList
              processedValues[field] = values[field].fileList[0].originFileObj;
              console.log(
                `[Modal] Fichier ${field} traité:`,
                values[field].fileList[0].name
              );
            } else {
              // Si aucun fichier n'est sélectionné, supprimer la propriété
              delete processedValues[field];
              console.log(`[Modal] Aucun fichier ${field} sélectionné`);
            }
          });

          // Convertir le statut en chaîne
          processedValues.status = values.status ? "active" : "inactive";

          console.log("[Modal] Valeurs envoyées au backend:", processedValues);
          onSubmit(processedValues);
          onClose();
          form.resetFields();
        })
        .catch((info) => {
          console.log("Échec de la validation :", info);
        });
    };

    return (
      <Modal
        key={warehouse ? warehouse.id : "new"} // force un re-rendu quand l'ID change
        visible={visible}
        title={warehouse ? "Modifier l'entrepôt" : "Créer un entrepôt"}
        onCancel={() => {
          onClose();
          form.resetFields();
        }}
        onOk={handleOk}
        width={isSmallScreen ? "95%" : 1000} // Responsive width
        bodyStyle={{ padding: "40px" }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nom de l'entrepôt *"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Le nom de l'entrepôt est requis",
                  },
                ]}
              >
                <Input placeholder="Nom de l'entrepôt" />
              </Form.Item>
              <Form.Item
                label="Adresse *"
                name="address"
                rules={[{ required: true, message: "L'adresse est requise" }]}
              >
                <Input.TextArea rows={3} placeholder="Adresse de l'entrepôt" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Entreprise *"
                name="company_id"
                rules={[
                  { required: true, message: "L'entreprise est requise" },
                ]}
              >
                <Select placeholder="Sélectionnez une entreprise">
                  {companies.map((comp) => (
                    <Select.Option key={comp.id} value={comp.id}>
                      {comp.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Téléphone" name="phone">
                <Input placeholder="Téléphone" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Email invalide" }]}
              >
                <Input placeholder="Email" />
              </Form.Item>
              <Form.Item label="Statut" name="status" valuePropName="checked">
                <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
              </Form.Item>
            </Col>
          </Row>

          {/* Options de facturation en direct */}
          <h5>Options de facturation </h5>
          <Form.Item
            label="Afficher l'email sur la facture"
            name="show_email_on_invoice"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Afficher le N° téléphone sur la facture"
            name="show_phone_on_invoice"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Afficher le MRP sur la facture"
            name="show_mrp_on_invoice"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Afficher remises/taxes sur la facture"
            name="show_discount_tax_on_invoice"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Préfixe de facturation"
            name="prefixe_inv"
            tooltip="Préfixe utilisé pour les numéros de facture générés par cet entrepôt (ex: MAG1-)"
            rules={[
              {
                max: 10,
                message: "Le préfixe ne doit pas dépasser 10 caractères",
              },
            ]}
          >
            <Input
              placeholder="Préfixe de facturation (ex: MAG1-)"
              maxLength={10}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Conditions générales" name="terms_condition">
                <Input.TextArea rows={4} placeholder="Conditions générales" />
              </Form.Item>
              <Form.Item label="Informations bancaires" name="bank_details">
                <Input.TextArea rows={4} placeholder="Informations bancaires" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Visibilité des clients"
                name="customers_visibility"
              >
                <Select>
                  <Select.Option value="all">Tous</Select.Option>
                  <Select.Option value="store">
                    Entrepôt uniquement
                  </Select.Option>
                  <Select.Option value="none">Aucun</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Visibilité des fournisseurs"
                name="suppliers_visibility"
              >
                <Select>
                  <Select.Option value="all">Tous</Select.Option>
                  <Select.Option value="store">
                    Entrepôt uniquement
                  </Select.Option>
                  <Select.Option value="none">Aucun</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Visibilité des produits"
                name="products_visibility"
              >
                <Select>
                  <Select.Option value="all">Tous</Select.Option>
                  <Select.Option value="store">
                    Entrepôt uniquement
                  </Select.Option>
                  <Select.Option value="none">Aucun</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Statut par défaut des commandes POS"
                name="default_pos_order_status"
              >
                <Select>
                  <Select.Option value="delivered">Livré</Select.Option>
                  <Select.Option value="pending">En attente</Select.Option>
                  <Select.Option value="processing">En cours</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Logo"
                name="logo"
                valuePropName="fileList"
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e && e.fileList
                }
              >
                <Upload
                  name="logo"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  onPreview={handleModalPreview}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Dark Logo"
                name="dark_logo"
                valuePropName="fileList"
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e && e.fileList
                }
              >
                <Upload
                  name="dark_logo"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  onPreview={handleModalPreview}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Signature"
                name="signature"
                valuePropName="fileList"
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e && e.fileList
                }
              >
                <Upload
                  name="signature"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  onPreview={handleModalPreview}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Modal
          visible={modalPreviewVisible}
          title={modalPreviewTitle}
          footer={null}
          onCancel={handleModalCancelPreview}
          width={isSmallScreen ? "95%" : undefined} // Responsive width for internal preview modal
        >
          <img
            alt="Preview"
            style={{ width: "100%" }}
            src={modalPreviewImage}
          />
        </Modal>
      </Modal>
    );
  };

  // Composant pour le modal de détails
  const WarehouseDetailModal = ({ visible, onClose, warehouse }) => {
    if (!warehouse) return null;

    const { Title } = Typography;

    // Construction des URLs des logos
    const logoURL = warehouse.logo ? getLogoUrl(warehouse.logo) : null;
    const darkLogoURL = warehouse.dark_logo
      ? getLogoUrl(warehouse.dark_logo)
      : null;
    const signatureURL = warehouse.signature
      ? getLogoUrl(warehouse.signature)
      : null;

    return (
      <Modal
        visible={visible}
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Détails de l'entrepôt: {warehouse.name}
            </Title>
          </div>
        }
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Fermer
          </Button>,
        ]}
        width={isSmallScreen ? "95%" : 900} // Responsive width
        centered
      >
        <div className="warehouse-details">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card>
                <Row gutter={16} align="middle">
                  {logoURL && (
                    <Col xs={24} sm={8} md={6}>
                      <div style={{ textAlign: "center" }}>
                        <img
                          src={logoURL}
                          alt="Logo"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/100?text=No+Image";
                          }}
                        />
                      </div>
                    </Col>
                  )}
                  <Col xs={24} sm={logoURL ? 16 : 24} md={logoURL ? 18 : 24}>
                    <Descriptions
                      title="Informations générales"
                      bordered
                      column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                    >
                      <Descriptions.Item label="Nom">
                        {warehouse.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Entreprise">
                        {warehouse.company_name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        <MailOutlined style={{ marginRight: "8px" }} />
                        {warehouse.email || "Non spécifié"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Téléphone">
                        <PhoneOutlined style={{ marginRight: "8px" }} />
                        {warehouse.phone || "Non spécifié"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Adresse" span={2}>
                        <EnvironmentOutlined style={{ marginRight: "8px" }} />
                        {warehouse.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut">
                        <Tag
                          color={
                            warehouse.status === "active" ? "green" : "red"
                          }
                        >
                          {warehouse.status === "active" ? "Actif" : "Inactif"}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Options de facturation" style={{ height: "100%" }}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Afficher email sur facture">
                    {Number(warehouse.show_email_on_invoice) ? "Oui" : "Non"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Afficher téléphone sur facture">
                    {Number(warehouse.show_phone_on_invoice) ? "Oui" : "Non"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Afficher MRP sur facture">
                    {Number(warehouse.show_mrp_on_invoice) ? "Oui" : "Non"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Afficher remises/taxes sur facture">
                    {Number(warehouse.show_discount_tax_on_invoice)
                      ? "Oui"
                      : "Non"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Préfixe de facturation">
                    {warehouse.prefixe_inv || "Non défini"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Paramètres de visibilité" style={{ height: "100%" }}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Visibilité des clients">
                    {warehouse.customers_visibility === "all"
                      ? "Tous"
                      : warehouse.customers_visibility === "store"
                      ? "Entrepôt uniquement"
                      : "Aucun"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Visibilité des fournisseurs">
                    {warehouse.suppliers_visibility === "all"
                      ? "Tous"
                      : warehouse.suppliers_visibility === "store"
                      ? "Entrepôt uniquement"
                      : "Aucun"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Visibilité des produits">
                    {warehouse.products_visibility === "all"
                      ? "Tous"
                      : warehouse.products_visibility === "store"
                      ? "Entrepôt uniquement"
                      : "Aucun"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut par défaut des commandes POS">
                    {warehouse.default_pos_order_status === "delivered"
                      ? "Livré"
                      : warehouse.default_pos_order_status === "pending"
                      ? "En attente"
                      : "En cours"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {(warehouse.terms_condition || warehouse.bank_details) && (
              <Col span={24}>
                <Row gutter={[16, 16]}>
                  {warehouse.terms_condition && (
                    <Col xs={24} sm={12}>
                      <Card
                        title={
                          <>
                            <FileTextOutlined /> Conditions générales
                          </>
                        }
                      >
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {warehouse.terms_condition}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {warehouse.bank_details && (
                    <Col xs={24} sm={12}>
                      <Card
                        title={
                          <>
                            <BankOutlined /> Informations bancaires
                          </>
                        }
                      >
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {warehouse.bank_details}
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>
              </Col>
            )}

            {(darkLogoURL || signatureURL) && (
              <Col span={24}>
                <Card title="Images supplémentaires">
                  <Row gutter={16}>
                    {darkLogoURL && (
                      <Col xs={24} sm={12}>
                        <div style={{ textAlign: "center" }}>
                          <p>Dark Logo</p>
                          <img
                            src={darkLogoURL}
                            alt="Dark Logo"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100px",
                              objectFit: "contain",
                              backgroundColor: "#1f1f1f",
                              padding: "10px",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/100?text=No+Image";
                            }}
                          />
                        </div>
                      </Col>
                    )}

                    {signatureURL && (
                      <Col xs={24} sm={12}>
                        <div style={{ textAlign: "center" }}>
                          <p>Signature</p>
                          <img
                            src={signatureURL}
                            alt="Signature"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100px",
                              objectFit: "contain",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/100?text=No+Image";
                            }}
                          />
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      </Modal>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Space
          direction="vertical"
          style={{ width: "100%", marginBottom: "20px" }}
        >
          <Typography.Title level={3}>Gestion des Magasins</Typography.Title>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {hasPermission("Admin.Magasins.create") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedWarehouse(null);
                  setIsModalOpen(true);
                }}
                className="w-full md:w-auto" // Responsive width
              >
                Créer un entrepôt
              </Button>
            )}

            {/* Champ de recherche pour filtrer dynamiquement */}
            <Input
              placeholder="Rechercher un entrepôt..."
              prefix={<SearchOutlined />}
              className="w-full md:w-auto md:max-w-sm" // Responsive width
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Space>
        {!selectedCompany ? (
          <Card>
            <Typography.Text type="secondary">
              Veuillez sélectionner une entreprise pour voir les magasins
              associés.
            </Typography.Text>
          </Card>
        ) : isLoading ? (
          <Spin tip="Chargement..." />
        ) : (
          <Table
            dataSource={filteredWarehouses}
            rowKey="id"
            pagination={{
              current: currentPage,
              total: totalPages * 10,
              onChange: (page) => setCurrentPage(page),
            }}
            rowClassName={() => "warehouse-table-row"}
            className="warehouse-table"
            size="middle"
            scroll={{ x: "max-content" }}
          >
            <Table.Column
              title="Logo"
              dataIndex="logo"
              key="logo"
              width={150}
              className="logo-column"
              render={(logo, record) => {
                if (!logo) return "No logo";

                const imageURL = getLogoUrl(logo);
                if (!imageURL) return "No logo";

                return (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      src={imageURL}
                      alt="Logo"
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        marginRight: 8,
                        borderRadius: "4px",
                        border: "1px solid #e8e8e8",
                      }}
                      onError={(e) => {
                        console.log(
                          `Erreur de chargement du logo pour ${record.name}:`,
                          e
                        );
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/40?text=No+Image";
                      }}
                    />
                    <Button
                      icon={<EyeOutlined />}
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewLogo(imageURL, record.name);
                      }}
                    >
                      Aperçu
                    </Button>
                  </div>
                );
              }}
            />
            <Table.Column
              title="Nom de l'entrepôt"
              dataIndex="name"
              key="name"
            />
            <Table.Column
              title="Entreprise"
              dataIndex="company_name"
              key="company_name"
              responsive={["md"]}
            />
            <Table.Column
              title="Adresse"
              dataIndex="address"
              key="address"
              responsive={["lg"]}
            />
            <Table.Column
              title="Téléphone"
              dataIndex="phone"
              key="phone"
              responsive={["lg"]}
            />
            <Table.Column
              title="Email"
              dataIndex="email"
              key="email"
              responsive={["md"]}
            />
            <Table.Column
              title="Statut"
              dataIndex="status"
              key="status"
              render={(text, record) => (
                <Switch
                  checkedChildren="Actif"
                  unCheckedChildren="Inactif"
                  checked={record.status === "active"}
                  onChange={() => handleToggleStatus(record)}
                  disabled={!hasPermission("Admin.Magasins.edit")}
                />
              )}
            />
            <Table.Column
              title="Actions"
              key="actions"
              render={(text, record) => (
                <Space>
                  {hasPermission("Admin.Magasins.view") && (
                    <Tooltip title="Voir les détails">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewWarehouseDetails(record)}
                      />
                    </Tooltip>
                  )}
                  {hasPermission("Admin.Magasins.edit") && (
                    <Tooltip title="Modifier">
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                          setSelectedWarehouse(record);
                          setIsModalOpen(true);
                        }}
                      />
                    </Tooltip>
                  )}
                  {hasPermission("Admin.Magasins.delete") && (
                    <Tooltip title="Supprimer">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteWarehouse(record)}
                      />
                    </Tooltip>
                  )}
                </Space>
              )}
            />
          </Table>
        )}
      </div>

      {/* Styles CSS pour contrôler la hauteur des lignes */}
      <style jsx>{`
        .warehouse-table .warehouse-table-row {
          height: 64px !important;
        }

        .warehouse-table .logo-column {
          vertical-align: middle;
        }

        .logo-container {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .empty-logo-placeholder {
          width: 40px;
          height: 40px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
      `}</style>

      <WarehouseModal
        key={selectedWarehouse ? selectedWarehouse.id : "new"}
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        companies={companies}
        onSubmit={
          selectedWarehouse ? handleUpdateWarehouse : handleCreateWarehouse
        }
      />

      {/* Modal de prévisualisation du logo */}
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancelPreview}
        centered
        width={isSmallScreen ? "95%" : 600} // Responsive width
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <img
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "500px",
              objectFit: "contain",
              border: "1px solid #e8e8e8",
              borderRadius: "4px",
              padding: "10px",
              backgroundColor: "#f9f9f9",
            }}
            src={previewImage}
          />
        </div>
      </Modal>

      {/* Modal de détails du magasin */}
      <WarehouseDetailModal
        visible={detailModalVisible}
        onClose={handleCloseDetailModal}
        warehouse={warehouseDetails}
      />
    </div>
  );
};

export default GestionWarehouses;
