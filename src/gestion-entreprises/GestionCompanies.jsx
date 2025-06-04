import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Upload,
  notification,
  Spin,
  Space,
  Row,
  Col,
  message,
  Card,
  Typography,
  Avatar,
  Tag,
  Tabs,
  Tooltip,
  Divider,
  Badge,
  Empty,
  Drawer,
  Skeleton,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  UserOutlined,
  BulbOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

// Configuration d'axios (endpoint API)
axios.defaults.baseURL = "http://localhost:3000";

// Configuration globale des notifications
notification.config({
  duration: 3,
  placement: "topRight",
  top: 80,
  style: { fontSize: "14px", borderRadius: "8px" },
});

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Hook de gestion du thème (intégré dans ce fichier)
const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  return { isDarkMode, toggleTheme };
};

const GestionCompanies = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  // États principaux
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailCompany, setDetailCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [form] = Form.useForm();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768); // État pour la taille de l'écran

  // Effet pour mettre à jour isSmallScreen lors du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chargement des entreprises depuis l'API avec filtre sur le statut
  const fetchCompanies = async (page = 1) => {
    try {
      setLoading(true);
      const statusFilter = showInactive ? "inactive" : "active";
      const response = await axios.get(
        `/api/companies?page=${page}&status=${statusFilter}`
      );
      setCompanies(response.data.companies);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      notification.error({
        message: "Erreur de chargement",
        description:
          error.response?.data?.error ||
          "Erreur lors du chargement des entreprises",
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(currentPage);
  }, [currentPage, showInactive]);

  // Effet pour filtrer les entreprises localement lorsque le texte de recherche change
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const searchTermLower = searchText.toLowerCase();
      const filtered = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTermLower) ||
          (company.short_name &&
            company.short_name.toLowerCase().includes(searchTermLower)) ||
          company.email.toLowerCase().includes(searchTermLower) ||
          company.phone.toLowerCase().includes(searchTermLower) ||
          (company.website &&
            company.website.toLowerCase().includes(searchTermLower))
      );
      setFilteredCompanies(filtered);
    }
  }, [searchText, companies]);

  // Gestion de la soumission du formulaire (création ou modification)
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("short_name", values.shortName || "");
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("website", values.website || "");
      formData.append("address", values.address || "");
      formData.append("status", values.isActive ? "active" : "inactive");
      formData.append("currency_id", values.currency);

      // Traitement des logos
      const logoFields = [
        { formKey: "lightLogo", dbKey: "light_logo" },
        { formKey: "darkLogo", dbKey: "dark_logo" },
        { formKey: "smallLightLogo", dbKey: "small_light_logo" },
        { formKey: "smallDarkLogo", dbKey: "small_dark_logo" },
      ];
      logoFields.forEach(({ formKey, dbKey }) => {
        if (values[formKey] && values[formKey].length > 0) {
          formData.append(dbKey, values[formKey][0].originFileObj);
        }
      });

      setLoading(true);
      if (selectedCompany) {
        await axios.put(`/api/companies/${selectedCompany.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success({
          content: "Entreprise mise à jour avec succès",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        });
      } else {
        await axios.post(`/api/companies`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success({
          content: "Entreprise créée avec succès",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        });
      }
      fetchCompanies(currentPage);
      setModalVisible(false);
      form.resetFields();
      setSelectedCompany(null);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: error.response?.data?.error || "Une erreur s'est produite",
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'une entreprise avec confirmation
  const handleDelete = (company) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Êtes-vous sûr de vouloir supprimer cette entreprise ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
      onOk: async () => {
        try {
          setLoading(true);
          await axios.delete(`/api/companies/${company.id}`);
          message.success({
            content: "Entreprise supprimée avec succès",
            icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          });
          if (companies.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchCompanies(currentPage);
          }
        } catch (error) {
          notification.error({
            message: "Erreur",
            description:
              error.response?.data?.error ||
              "Erreur lors de la suppression de l'entreprise",
            icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Basculement du statut d'une entreprise
  const handleToggleStatus = async (company) => {
    const newStatus = company.status === "active" ? "inactive" : "active";
    try {
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, status: newStatus } : c))
      );
      await axios.patch(`/api/companies/${company.id}/status`, {
        status: newStatus,
      });
      message.success({
        content: "Statut mis à jour avec succès",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    } catch (error) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id ? { ...c, status: company.status } : c
        )
      );
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de la mise à jour du statut",
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      });
    }
  };

  const showCompanyDetails = (company) => {
    setDetailCompany(company);
    setDetailVisible(true);
  };

  // Définition des colonnes du tableau
  const columns = [
    {
      title: "Entreprise",
      key: "company",
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            src={record.light_logo}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <Text strong>{record.name}</Text>
            {record.short_name && (
              <div>
                <Text type="secondary">{record.short_name}</Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["sm"],
      render: (text) => (
        <Space>
          <MailOutlined style={{ color: "#1890ff" }} />
          <Text copyable>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
      responsive: ["sm"],
      render: (text) => (
        <Space>
          <PhoneOutlined style={{ color: "#1890ff" }} />
          <Text copyable>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Site Web",
      dataIndex: "website",
      key: "website",
      responsive: ["md"],
      render: (text) => {
        if (!text) return <Text type="secondary">-</Text>;
        return (
          <Space>
            <GlobalOutlined style={{ color: "#1890ff" }} />
            <a href={text} target="_blank" rel="noopener noreferrer">
              {text.replace(/^https?:\/\//, "")}
            </a>
          </Space>
        );
      },
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (text) => (
        <Tag
          color={text === "active" ? "success" : "error"}
          style={{ borderRadius: "12px", padding: "4px 12px" }}
        >
          {text === "active" ? "Actif" : "Inactif"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showCompanyDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedCompany(record);
                form.setFieldsValue({
                  name: record.name,
                  shortName: record.short_name,
                  email: record.email,
                  phone: record.phone,
                  website: record.website,
                  address: record.address,
                  currency: record.currency_id || "XOF",
                  isActive: record.status === "active",
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
          <Tooltip
            title={record.status === "active" ? "Désactiver" : "Activer"}
          >
            <Switch
              size="small"
              checked={record.status === "active"}
              onChange={() => handleToggleStatus(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Rendu d'une entreprise en mode carte
  const renderCompanyCard = (company) => {
    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={4} key={company.id}>
        <Card
          hoverable
          style={{
            marginBottom: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
          actions={[
            <Tooltip title="Voir détails" key="view">
              <EyeOutlined onClick={() => showCompanyDetails(company)} />
            </Tooltip>,
            <Tooltip title="Modifier" key="edit">
              <EditOutlined
                onClick={() => {
                  setSelectedCompany(company);
                  form.setFieldsValue({
                    name: company.name,
                    shortName: company.short_name,
                    email: company.email,
                    phone: company.phone,
                    website: company.website,
                    address: company.address,
                    currency: company.currency_id || "XOF",
                    isActive: company.status === "active",
                  });
                  setModalVisible(true);
                }}
              />
            </Tooltip>,
            <Tooltip title="Supprimer" key="delete">
              <DeleteOutlined onClick={() => handleDelete(company)} />
            </Tooltip>,
          ]}
        >
          <div
            style={{
              position: "relative",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src={company.light_logo}
              style={{ backgroundColor: "#1890ff" }}
            />
            <Badge
              status={company.status === "active" ? "success" : "error"}
              style={{ position: "absolute", top: 8, right: 8 }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <Title level={5} ellipsis style={{ marginBottom: 4 }}>
              {company.name}
            </Title>
            {company.short_name && (
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 12 }}
              >
                {company.short_name}
              </Text>
            )}
          </div>
          <Divider style={{ margin: "12px 0" }} />
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div>
              <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              <Text ellipsis style={{ maxWidth: "calc(100% - 24px)" }}>
                {company.email}
              </Text>
            </div>
            <div>
              <PhoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              <Text>{company.phone}</Text>
            </div>
            {company.website && (
              <div>
                <GlobalOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </Space>
        </Card>
      </Col>
    );
  };

  return (
    <div
      style={{
        padding: "24px",
        background: isDarkMode ? "#141414" : "#f5f5f5",
        minHeight: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <Title level={4} className="mb-2 sm:mb-0" style={{ margin: 0 }}>
            Gestion des Entreprises
          </Title>
          <Space wrap>
            <Button
              key="theme"
              icon={<BulbOutlined />}
              onClick={toggleTheme}
              style={{ marginRight: 8 }}
            >
              {isDarkMode ? "Mode Clair" : "Mode Sombre"}
            </Button>
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalVisible(true);
                setSelectedCompany(null);
                form.resetFields();
              }}
            >
              Créer une entreprise
            </Button>
          </Space>
        </div>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            <Input
              placeholder="Rechercher par nom, email ou téléphone"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", borderRadius: "8px" }}
              allowClear
              size="large"
              onPressEnter={() => {
                notification.info({
                  message: "Recherche",
                  description:
                    searchText.trim() !== ""
                      ? `Recherche de: "${searchText}"`
                      : "Réinitialisation de la recherche",
                  icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
                });
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Space wrap>
              <Text>Afficher:</Text>
              <Switch
                checked={showInactive}
                onChange={(checked) => {
                  setShowInactive(checked);
                  notification.info({
                    message: "Filtrage",
                    description: checked
                      ? "Affichage des entreprises inactives"
                      : "Affichage des entreprises actives",
                    icon: <FilterOutlined style={{ color: "#1890ff" }} />,
                  });
                }}
                checkedChildren="Inactifs"
                unCheckedChildren="Actifs"
              />
              <Tooltip title="Actualiser">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchCompanies(currentPage)}
                />
              </Tooltip>
            </Space>
          </Col>
          <Col
            xs={24}
            sm={12}
            md={8}
            lg={8}
            className="text-left sm:text-right"
          >
            <Space wrap>
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === "table" ? "primary" : "default"}
                onClick={() => setViewMode("table")}
              >
                Liste
              </Button>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === "card" ? "primary" : "default"}
                onClick={() => setViewMode("card")}
              >
                Cartes
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card style={{ borderRadius: "12px" }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : (
        <>
          {viewMode === "table" ? (
            <Card
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
              }}
            >
              <Table
                dataSource={
                  searchText.trim() !== "" ? filteredCompanies : companies
                }
                columns={columns}
                rowKey="id"
                scroll={{ x: "max-content" }}
                pagination={{
                  current: currentPage,
                  total:
                    searchText.trim() !== ""
                      ? filteredCompanies.length
                      : totalPages * 10,
                  onChange: (page) => {
                    if (searchText.trim() === "") {
                      setCurrentPage(page);
                    }
                  },
                  pageSize: 10,
                  showSizeChanger: false,
                  style: { marginTop: 16 },
                }}
                bordered={false}
                size="middle"
                locale={{
                  emptyText: (
                    <Empty
                      description="Aucune entreprise trouvée"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {(searchText.trim() !== "" ? filteredCompanies : companies)
                .length > 0 ? (
                (searchText.trim() !== "" ? filteredCompanies : companies).map(
                  renderCompanyCard
                )
              ) : (
                <Col span={24} style={{ textAlign: "center" }}>
                  <Empty
                    description="Aucune entreprise trouvée"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Col>
              )}
            </Row>
          )}
        </>
      )}

      <Modal
        visible={modalVisible}
        title={
          <Title level={4}>
            {selectedCompany ? "Modifier l'entreprise" : "Créer une entreprise"}
          </Title>
        }
        width={isSmallScreen ? "95%" : 1000} // Largeur adaptative
        style={{ top: 20 }}
        bodyStyle={{ padding: "24px" }}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedCompany(null);
        }}
        onOk={handleFormSubmit}
        okText={selectedCompany ? "Mettre à jour" : "Créer"}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ currency: "XOF", isActive: true }}
        >
          <Tabs type="card">
            <TabPane tab="Informations générales" key="1">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nom ou raison sociale"
                    name="name"
                    rules={[{ required: true, message: "Le nom est requis" }]}
                  >
                    <Input
                      placeholder="Nom de l'entreprise"
                      prefix={<UserOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "L'email est requis" },
                      { type: "email", message: "Email invalide" },
                    ]}
                  >
                    <Input
                      placeholder="exemple@domaine.com"
                      prefix={<MailOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item label="Adresse" name="address">
                    <Input.TextArea
                      rows={3}
                      placeholder="Adresse"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nom court" name="shortName">
                    <Input
                      placeholder="Nom court"
                      prefix={<UserOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Téléphone"
                    name="phone"
                    rules={[
                      { required: true, message: "Le téléphone est requis" },
                    ]}
                  >
                    <Input
                      placeholder="Téléphone"
                      prefix={<PhoneOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item label="Site Web" name="website">
                    <Input
                      placeholder="https://www.example.com"
                      prefix={<GlobalOutlined />}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Devise" name="currency">
                    <Select size="large">
                      <Select.Option value="XOF">
                        Franc CFA BCEAO (XOF)
                      </Select.Option>
                      <Select.Option value="EUR">Euro (EUR)</Select.Option>
                      <Select.Option value="USD">Dollar US (USD)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Statut"
                    name="isActive"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Actif"
                      unCheckedChildren="Inactif"
                      style={{ width: 80 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Logos et images" key="2">
              <Row gutter={24}>
                <Col xs={12} sm={6}>
                  <Form.Item
                    label="Light Logo"
                    name="lightLogo"
                    valuePropName="fileList"
                    getValueFromEvent={(e) =>
                      Array.isArray(e) ? e : e && e.fileList
                    }
                  >
                    <Upload
                      name="light_logo"
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Light Logo</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Item
                    label="Dark Logo"
                    name="darkLogo"
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
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Dark Logo</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Item
                    label="Small Light Logo"
                    name="smallLightLogo"
                    valuePropName="fileList"
                    getValueFromEvent={(e) =>
                      Array.isArray(e) ? e : e && e.fileList
                    }
                  >
                    <Upload
                      name="small_light_logo"
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Small Light</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Item
                    label="Small Dark Logo"
                    name="smallDarkLogo"
                    valuePropName="fileList"
                    getValueFromEvent={(e) =>
                      Array.isArray(e) ? e : e && e.fileList
                    }
                  >
                    <Upload
                      name="small_dark_logo"
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Small Dark</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      <Drawer
        title={<Title level={4}>{detailCompany?.name}</Title>}
        placement="right"
        width={isSmallScreen ? "90%" : 500} // Largeur adaptative
        onClose={() => setDetailVisible(false)}
        visible={detailVisible}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                if (detailCompany) {
                  setSelectedCompany(detailCompany);
                  form.setFieldsValue({
                    name: detailCompany.name,
                    shortName: detailCompany.short_name,
                    email: detailCompany.email,
                    phone: detailCompany.phone,
                    website: detailCompany.website,
                    address: detailCompany.address,
                    currency: detailCompany.currency_id || "XOF",
                    isActive: detailCompany.status === "active",
                  });
                  setModalVisible(true);
                  setDetailVisible(false);
                }
              }}
            >
              Modifier
            </Button>
          </Space>
        }
      >
        {detailCompany && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={detailCompany.light_logo}
                style={{ backgroundColor: "#1890ff" }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {detailCompany.name}
              </Title>
              {detailCompany.short_name && (
                <Text type="secondary">{detailCompany.short_name}</Text>
              )}
              <div style={{ marginTop: 12 }}>
                <Tag
                  color={
                    detailCompany.status === "active" ? "success" : "error"
                  }
                  style={{ borderRadius: "12px", padding: "4px 12px" }}
                >
                  {detailCompany.status === "active" ? "Actif" : "Inactif"}
                </Tag>
              </div>
            </div>

            <Divider orientation="left">Informations de contact</Divider>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Text strong style={{ marginRight: 8 }}>
                  Email:
                </Text>
                <Space>
                  <MailOutlined style={{ color: "#1890ff" }} />
                  <Text>{detailCompany.email}</Text>
                </Space>
              </div>
              <div>
                <Text strong style={{ marginRight: 8 }}>
                  Téléphone:
                </Text>
                <Space>
                  <PhoneOutlined style={{ color: "#1890ff" }} />
                  <Text>{detailCompany.phone}</Text>
                </Space>
              </div>
              {detailCompany.website && (
                <div>
                  <Text strong style={{ marginRight: 8 }}>
                    Site web:
                  </Text>
                  <Space>
                    <GlobalOutlined style={{ color: "#1890ff" }} />
                    <a
                      href={detailCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {detailCompany.website}
                    </a>
                  </Space>
                </div>
              )}
              {detailCompany.address && (
                <div>
                  <Text strong>Adresse:</Text>
                  <div style={{ marginTop: 8 }}>{detailCompany.address}</div>
                </div>
              )}
            </Space>

            <Divider orientation="left">Informations financières</Divider>
            <div>
              <Text strong style={{ marginRight: 8 }}>
                Devise:
              </Text>
              <Text>{detailCompany.currency_id || "XOF"}</Text>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default GestionCompanies;
