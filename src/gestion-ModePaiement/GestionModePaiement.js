// GestionModePaiement.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
  Alert,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

// Définir l'URL de base pour les appels API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
axios.defaults.baseURL = API_URL;

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// Définir les types de paiement de manière centralisée pour assurer la cohérence
const PAYMENT_MODE_TYPES = {
  cash: { value: "cash", color: "green", label: "Espèces" },
  bank: { value: "bank", color: "blue", label: "Virement bancaire" },
  card: { value: "card", color: "purple", label: "Carte de crédit" },
  cheque: { value: "cheque", color: "orange", label: "Chèque" },
  mobile: { value: "mobile", color: "cyan", label: "Mobile Money" },
  other: { value: "other", color: "default", label: "Autre" },
};

/**
 * Composant PaymentModeModal
 * Utilise le composant Modal et Form d'Ant Design pour créer ou modifier un mode de paiement.
 */
const PaymentModeModal = ({
  visible,
  onCancel,
  paymentMode,
  onSubmit,
  companies = [],
}) => {
  const [form] = Form.useForm();
  const { selectedCompany } = useSelection();
  const { hasPermission } = useAuth();
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [localCompanies, setLocalCompanies] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Obtenir les informations correctes de l'entreprise sélectionnée
  const companyId =
    typeof selectedCompany === "object" && selectedCompany
      ? selectedCompany.id
      : typeof selectedCompany === "number"
      ? selectedCompany
      : null;

  // Charger la liste des entreprises si elle n'est pas fournie en props
  useEffect(() => {
    // Utiliser les entreprises fournies en props si disponibles
    if (companies && companies.length > 0) {
      setLocalCompanies(companies);
      return;
    }

    // Sinon charger les entreprises directement
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await axios.get("/api/companies");
        setLocalCompanies(response.data.companies || []);
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        notification.error({
          message: "Erreur",
          description: "Impossible de charger la liste des entreprises.",
        });
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [companies]);

  // Réinitialiser le formulaire quand le mode de paiement change ou devient visible
  useEffect(() => {
    if (visible) {
      form.resetFields();

      if (paymentMode) {
        // Édition - Remplir le formulaire avec les valeurs du mode de paiement existant
        form.setFieldsValue({
          name: paymentMode.name,
          mode_type: paymentMode.mode_type || "bank",
          company_id: paymentMode.company_id || undefined,
          credentials: paymentMode.credentials || undefined,
        });
      } else {
        // Création - Définir l'entreprise sélectionnée par défaut si elle existe
        if (companyId) {
          form.setFieldsValue({
            company_id: companyId,
          });
        }
      }
    }
  }, [form, paymentMode, visible, companyId]);

  return (
    <Modal
      title={
        paymentMode && paymentMode.id
          ? "Modifier un Mode de Paiement"
          : "Ajouter un Mode de Paiement"
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={isSmallScreen ? "95%" : 520} // Responsive width
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="name"
          label="Nom du Mode de Paiement"
          rules={[
            {
              required: true,
              message: "Veuillez saisir le nom du mode de paiement",
            },
          ]}
        >
          <Input placeholder="Ex: Espèces, Carte bancaire, etc." />
        </Form.Item>

        <Form.Item
          name="mode_type"
          label="Type"
          rules={[{ required: true, message: "Veuillez sélectionner un type" }]}
        >
          <Select placeholder="Sélectionner un type">
            {Object.values(PAYMENT_MODE_TYPES).map((type) => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="company_id"
          label="Entreprise (optionnel)"
          tooltip="Laissez vide pour un mode de paiement disponible à toutes les entreprises"
        >
          <Select
            placeholder="Sélectionner une entreprise"
            allowClear
            loading={loadingCompanies}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {localCompanies.map((company) => (
              <Option key={company.id} value={company.id}>
                {company.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="credentials" label="Informations (optionnel)">
          <Input.TextArea
            placeholder="Informations supplémentaires: coordonnées bancaires, identifiants, etc."
            rows={3}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ marginRight: 8 }}
            disabled={
              paymentMode && paymentMode.id
                ? !hasPermission("Admin.ModesPaiement.edit")
                : !hasPermission("Admin.ModesPaiement.create")
            }
          >
            {paymentMode && paymentMode.id ? "Mettre à jour" : "Créer"}
          </Button>
          <Button onClick={onCancel}>Annuler</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * Composant PaymentModeList
 * Affiche la liste des modes de paiement dans un tableau avec recherche, pagination et actions (édition / suppression).
 */
const PaymentModeList = () => {
  const { selectedCompany } = useSelection();
  const { hasPermission } = useAuth();
  const [paymentModes, setPaymentModes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null);
  const [filterByCompany, setFilterByCompany] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Screen size detection for responsive title level
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Using 768px as a breakpoint (Tailwind md)
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Obtenir les informations correctes de l'entreprise sélectionnée
  const companyId =
    typeof selectedCompany === "object" && selectedCompany
      ? selectedCompany.id
      : typeof selectedCompany === "number"
      ? selectedCompany
      : null;

  // Charger la liste des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("/api/companies");
        setCompanies(response.data.companies || []);
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        notification.error({
          message: "Erreur",
          description: "Impossible de charger la liste des entreprises.",
        });
      }
    };
    fetchCompanies();
  }, []);

  // Trouver le nom de l'entreprise à partir de son ID
  const getCompanyName = (id) => {
    if (!id) return "Générale";
    const company = companies.find((c) => c.id === id);
    return company ? company.name : `Entreprise #${id}`;
  };

  // Obtenir le nom de l'entreprise actuelle
  const companyName =
    typeof selectedCompany === "object" &&
    selectedCompany &&
    selectedCompany.name
      ? selectedCompany.name
      : getCompanyName(companyId);

  const pageSize = 10;

  // Fonction de récupération des modes de paiement via l'API
  const fetchPaymentModes = async (page = 1) => {
    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtrage
      let url = `/api/payment-modes?page=${page}&limit=${pageSize}&search=${searchTerm}`;

      // Ajouter le filtre par entreprise si une entreprise est sélectionnée et que le filtre est actif
      if (companyId && filterByCompany) {
        url += `&company_id=${companyId}`;
        console.log(
          `Filtrage des modes de paiement pour l'entreprise: ${companyName} (ID: ${companyId})`
        );
      }

      console.log(`Appel API: ${url}`);
      const response = await axios.get(url);

      setPaymentModes(response.data.paymentModes);
      setTotalItems(response.data.pagination.totalItems);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur lors du chargement des modes de paiement:", error);
      notification.error({
        message: "Erreur",
        description: "Erreur lors du chargement des modes de paiement.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Recharger la liste lors du changement du terme de recherche
  useEffect(() => {
    fetchPaymentModes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Recharger la liste lors du changement d'entreprise ou du statut du filtre
  useEffect(() => {
    if (companyId || !filterByCompany) {
      fetchPaymentModes(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, filterByCompany]);

  // Gérer la création ou la mise à jour d'un mode de paiement
  const handleCreateOrUpdate = async (values) => {
    setLoading(true);
    try {
      if (selectedPaymentMode && selectedPaymentMode.id) {
        // Mise à jour
        await axios.put(`/api/payment-modes/${selectedPaymentMode.id}`, values);
        notification.success({
          message: "Succès",
          description: "Mode de paiement mis à jour avec succès.",
        });
      } else {
        // Création
        // Si une entreprise est sélectionnée et que le filtre est actif, on associe le nouveau mode à cette entreprise
        if (companyId && filterByCompany && !values.company_id) {
          values.company_id = companyId;
        }

        await axios.post("/api/payment-modes", values);
        notification.success({
          message: "Succès",
          description: "Mode de paiement créé avec succès.",
        });
      }
      setModalVisible(false);
      setSelectedPaymentMode(null);
      fetchPaymentModes(currentPage);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de l'enregistrement du mode de paiement.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gérer la suppression d'un mode de paiement avec confirmation
  const handleDelete = (record) => {
    confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce mode de paiement ?",
      icon: <ExclamationCircleOutlined />,
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        setLoading(true);
        try {
          await axios.delete(`/api/payment-modes/${record.id}`);
          notification.success({
            message: "Succès",
            description: "Mode de paiement supprimé avec succès.",
          });
          // Si c'est le dernier élément de la page et qu'on n'est pas sur la première page, on revient à la page précédente
          if (paymentModes.length === 1 && currentPage > 1) {
            fetchPaymentModes(currentPage - 1);
          } else {
            fetchPaymentModes(currentPage);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          notification.error({
            message: "Erreur",
            description:
              error.response?.data?.error ||
              "Erreur lors de la suppression du mode de paiement.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Définition des colonnes du tableau
  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Type",
      dataIndex: "mode_type",
      key: "mode_type",
      render: (mode_type) => {
        const typeConfig =
          PAYMENT_MODE_TYPES[mode_type] || PAYMENT_MODE_TYPES.other;
        return <Tag color={typeConfig.color}>{typeConfig.label}</Tag>;
      },
    },
    {
      title: "Entreprise",
      dataIndex: "company_name",
      key: "company_name",
      render: (company_name, record) => {
        if (record.company_id) {
          return (
            <Tag color="blue">
              {company_name || getCompanyName(record.company_id)}
            </Tag>
          );
        }
        return <Tag color="default">Général</Tag>;
      },
      responsive: ["sm"], // Hide on xs screens
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip
            title={
              !hasPermission("Admin.ModesPaiement.edit")
                ? "Permissions insuffisantes"
                : "Modifier"
            }
          >
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setSelectedPaymentMode(record);
                setModalVisible(true);
              }}
              disabled={!hasPermission("Admin.ModesPaiement.edit")}
            />
          </Tooltip>
          <Tooltip
            title={
              !hasPermission("Admin.ModesPaiement.delete")
                ? "Permissions insuffisantes"
                : "Supprimer"
            }
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record)}
              disabled={!hasPermission("Admin.ModesPaiement.delete")}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="payment-mode-list" style={{ marginTop: 20 }}>
      <Card
        title={
          <Title level={isSmallScreen ? 5 : 4} style={{ marginBottom: 0 }}>
            Gestion des Modes de Paiement
          </Title>
        }
        style={{ marginBottom: 20 }}
      >
        {/* Moved controls into Card body for better responsive stacking */}
        <div className="mb-5">
          <Row gutter={[16, 16]} align="middle">
            {/* Button Col */}
            <Col xs={24} lg="auto" className="mb-3 lg:mb-0">
              <Tooltip
                title={
                  !hasPermission("Admin.ModesPaiement.create")
                    ? "Permissions insuffisantes"
                    : "Ajouter un Mode de Paiement"
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedPaymentMode(null);
                    setModalVisible(true);
                  }}
                  disabled={!hasPermission("Admin.ModesPaiement.create")}
                  className="w-full lg:w-auto"
                >
                  Ajouter un Mode de Paiement
                </Button>
              </Tooltip>
            </Col>

            {/* Search Input Col */}
            <Col xs={24} lg={{ flex: "auto" }} className="mb-3 lg:mb-0">
              <Input
                placeholder="Rechercher..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                allowClear
              />
            </Col>

            {/* Filter Button Col (conditionally rendered) */}
            {companyId && (
              <Col xs={24} lg="auto" className="mb-3 lg:mb-0">
                <Tooltip
                  title={
                    filterByCompany
                      ? "Désactiver le filtre par entreprise"
                      : "Activer le filtre par entreprise"
                  }
                >
                  <Button
                    type={filterByCompany ? "primary" : "default"}
                    icon={<FilterOutlined />}
                    onClick={() => setFilterByCompany(!filterByCompany)}
                    className="w-full lg:w-auto"
                  >
                    Filtre par Entreprise
                  </Button>
                </Tooltip>
              </Col>
            )}
          </Row>
        </div>

        {companyId && filterByCompany && (
          <Alert
            message={`Modes de paiement filtrés pour l'entreprise: ${companyName}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => setFilterByCompany(false)}>
                Voir tous
              </Button>
            }
          />
        )}

        <Spin spinning={loading}>
          <Table
            dataSource={paymentModes}
            columns={columns}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: false,
              showTotal: (total) => `Total: ${total} modes de paiement`,
              onChange: (page) => fetchPaymentModes(page),
            }}
            scroll={{ x: "max-content" }} // Added for horizontal scroll
            locale={{
              emptyText: (
                <div style={{ padding: "20px 0" }}>
                  {companyId && filterByCompany ? (
                    <div>
                      <p>
                        Aucun mode de paiement trouvé pour cette entreprise.
                      </p>
                      <Button onClick={() => setFilterByCompany(false)}>
                        Voir tous les modes de paiement
                      </Button>
                    </div>
                  ) : (
                    "Aucun mode de paiement trouvé."
                  )}
                </div>
              ),
            }}
          />
        </Spin>

        <PaymentModeModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedPaymentMode(null);
          }}
          paymentMode={selectedPaymentMode}
          onSubmit={handleCreateOrUpdate}
          companies={companies}
        />
      </Card>
    </div>
  );
};

/**
 * Composant principal GestionModePaiement
 */
const GestionModePaiement = () => {
  return <PaymentModeList />;
};

export default GestionModePaiement;
