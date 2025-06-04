import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Card,
  Typography,
  Tag,
  message,
  Tooltip,
  Avatar,
  Row,
  Col,
  Statistic,
  Divider,
  Badge,
  Empty,
  Select,
  Breadcrumb,
  PageHeader,
  Segmented,
  Switch,
  Modal,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilterOutlined,
  SettingOutlined,
  EyeOutlined,
  FormOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { getProductionUnits, deleteProductionUnit } from "./api";
import axios from "axios";
import { notification } from "antd";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const { Title, Text } = Typography;
const { Option } = Select;

const API_URL = "http://localhost:3000";

// Définir des styles cohérents
const styles = {
  card: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  statCard: {
    textAlign: "center",
    padding: "16px",
    height: "100%",
  },
  tableCard: {
    borderRadius: "8px",
    overflow: "hidden",
  },
  actionButton: {
    borderRadius: "4px",
  },
  headerBar: {
    background: "#fff",
    padding: "16px",
    borderRadius: "8px 8px 0 0",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterSection: {
    padding: "12px 16px",
    background: "#f9f9f9",
    borderRadius: "0",
    marginBottom: "0",
  },
};

const ProductionList = () => {
  const [units, setUnits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedUnitDetails, setSelectedUnitDetails] = useState(null);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { selectedWarehouse } = useSelection();

  // Fonction pour charger les unités de production
  const loadUnits = async (
    page = 1,
    limit = 10,
    search = "",
    status = null,
    warehouseId = null
  ) => {
    if (!warehouseId) {
      setUnits([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    console.log("Loading units with warehouse ID:", warehouseId);

    setLoading(true);
    try {
      // Simplify to focus on the core parameters
      let params = {
        page,
        limit,
        search,
      };

      // Add the warehouse ID as a direct filter parameter in a way the backend expects
      // Try the most common format for filtering
      params.warehouse_id = warehouseId;

      if (status !== null) {
        params.status = status;
      }

      console.log("API request params:", params);

      const data = await getProductionUnits(params);
      console.log("API response:", data);

      // If the units are returned but not filtered by warehouse, apply client-side filtering
      let filteredUnits = data.units;

      // Check if the API didn't filter by warehouse_id (by examining if units from other warehouses exist)
      const needsClientFiltering = filteredUnits.some((unit) => {
        // Check different possible warehouse ID fields
        const unitWarehouseId =
          unit.warehouse_id || (unit.warehouse && unit.warehouse.id);
        return unitWarehouseId && unitWarehouseId !== warehouseId;
      });

      // Apply client-side filter if needed
      if (needsClientFiltering) {
        console.log("Applying client-side warehouse filtering");
        filteredUnits = filteredUnits.filter((unit) => {
          // Handle different possible warehouse ID fields
          const unitWarehouseId =
            unit.warehouse_id || (unit.warehouse && unit.warehouse.id);
          return unitWarehouseId === warehouseId;
        });
      }

      // Also apply status filtering if needed
      if (status !== null && !params.hasOwnProperty("status")) {
        filteredUnits = filteredUnits.filter((unit) => unit.status === status);
      }

      setUnits(filteredUnits);
      setTotal(needsClientFiltering ? filteredUnits.length : data.total);
    } catch (error) {
      message.error("Erreur lors du chargement des unités de production");
      console.error(error);
      setUnits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Charger les unités au montage du composant ou quand refreshKey ou selectedWarehouse change
  useEffect(() => {
    console.log("selectedWarehouse changed:", selectedWarehouse);
    console.log("All warehouses in context:", selectedWarehouse);

    if (selectedWarehouse) {
      loadUnits(
        pagination.current,
        pagination.pageSize,
        searchText,
        selectedStatus,
        selectedWarehouse
      );
    } else {
      setUnits([]);
      setTotal(0);
    }
  }, [
    refreshKey,
    selectedWarehouse,
    pagination.current,
    pagination.pageSize,
    searchText,
    selectedStatus,
  ]);

  // Gérer le changement de page
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Gérer la recherche
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
  };

  // Gérer le filtre par statut
  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Gérer la suppression d'une unité
  const handleDelete = async (id) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Unites.delete"
      )
    ) {
      message.error("Vous n'avez pas la permission de supprimer des unités.");
      return;
    }
    try {
      // Vérification du stock avant la suppression
      const unitToDelete = units.find((unit) => unit.id === id);

      // Si l'unité a un stock, empêcher la suppression
      if (unitToDelete && unitToDelete.current_stock > 0) {
        message.error(
          "Impossible de supprimer cette unité car elle possède un stock. Veuillez d'abord épuiser le stock."
        );
        return;
      }

      await deleteProductionUnit(id);
      message.success("Unité de production supprimée avec succès");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      if (error.error) {
        message.error(error.error);
      } else {
        message.error("Erreur lors de la suppression de l'unité de production");
      }
      console.error(error);
    }
  };

  // Basculement du statut d'une unité de production
  const handleToggleStatus = async (unit) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
      )
    ) {
      message.error(
        "Vous n'avez pas la permission de modifier le statut des unités."
      );
      return;
    }
    const newStatus = unit.status === "active" ? "inactive" : "active";
    try {
      // Optimistic UI update
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, status: newStatus } : u))
      );

      // API call to update status
      await axios.patch(`${API_URL}/api/production/units/${unit.id}/status`, {
        status: newStatus,
      });

      message.success("Statut mis à jour avec succès");
    } catch (error) {
      // Revert to original status on error
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, status: unit.status } : u))
      );
      notification.error({
        message: "Erreur",
        description:
          error.response?.data?.error ||
          "Erreur lors de la mise à jour du statut",
      });
    }
  };

  // Fonction pour afficher les détails d'une unité
  const showUnitDetails = (unit) => {
    const formattedDate = unit.created_at
      ? new Date(unit.created_at).toLocaleDateString()
      : "N/A";

    const details = [
      { label: "Nom", value: unit.name },
      { label: "Description", value: unit.description || "Aucune description" },
      {
        label: "Statut",
        value: unit.status === "active" ? "Actif" : "Inactif",
      },
      { label: "Stock actuel", value: `${unit.current_stock || 0} unité(s)` },
      {
        label: "Matières premières",
        value: `${unit.materials_count} matière(s)`,
      },
      { label: "Produits finis", value: `${unit.outputs_count} produit(s)` },
      { label: "Date de création", value: formattedDate },
    ];

    Modal.info({
      title: (
        <div style={{ display: "flex", alignItems: "center" }}>
          {unit.image ? (
            <Avatar
              src={`${API_URL}/uploads/image_produits/${unit.image}`}
              style={{ marginRight: "8px" }}
            />
          ) : (
            <Avatar style={{ backgroundColor: "#87d068", marginRight: "8px" }}>
              {unit.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <span>Détails de l'unité de production</span>
        </div>
      ),
      width: 500,
      content: (
        <div style={{ marginTop: "20px" }}>
          <Descriptions bordered column={1}>
            {details.map((item, index) => (
              <Descriptions.Item key={index} label={item.label}>
                {item.value}
              </Descriptions.Item>
            ))}
          </Descriptions>
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => {
                Modal.destroyAll();
                navigate(`/production/process/${unit.id}`);
              }}
            >
              Produire
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                Modal.destroyAll();
                navigate(`/production/units/edit/${unit.id}`);
              }}
            >
              Modifier
            </Button>
          </div>
        </div>
      ),
      okText: "Fermer",
    });
  };

  // Actualiser la liste
  const handleRefresh = () => {
    setSearchText("");
    setSelectedStatus(null);
    setPagination({ current: 1, pageSize: 10 });
    setRefreshKey((oldKey) => oldKey + 1);
  };

  // Basculer l'affichage des filtres
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAdd = () => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Unites.create"
      )
    ) {
      message.error("Vous n'avez pas la permission de créer des unités.");
      return;
    }
    navigate("/production/units/create");
  };

  const handleEdit = (unit) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
      )
    ) {
      message.error("Vous n'avez pas la permission de modifier des unités.");
      return;
    }
    navigate(`/production/units/edit/${unit.id}`, { state: { unit } });
  };

  // Colonnes du tableau
  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {record.image ? (
            <Avatar src={`${API_URL}/uploads/image_produits/${record.image}`} />
          ) : (
            <Avatar style={{ backgroundColor: "#87d068" }}>
              {text.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Text strong>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      fixed: "left",
      width: 200,
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      render: (text, record) =>
        text ||
        (record.warehouse && record.warehouse.name) || (
          <Text type="secondary" italic>
            Non défini
          </Text>
        ),
      sorter: (a, b) => {
        const nameA =
          a.warehouse_name || (a.warehouse && a.warehouse.name) || "";
        const nameB =
          b.warehouse_name || (b.warehouse && b.warehouse.name) || "";
        return nameA.localeCompare(nameB);
      },
      responsive: ["sm"],
      width: 180,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: { showTitle: true },
      render: (text) => (
        <Tooltip placement="topLeft" title={text || "Aucune description"}>
          <span>
            {text || (
              <Text type="secondary" italic>
                Non défini
              </Text>
            )}
          </span>
        </Tooltip>
      ),
      responsive: ["md"],
      width: 250,
    },
    {
      title: "Stock actuel",
      dataIndex: "current_stock",
      key: "current_stock",
      align: "center",
      render: (stock, record) => {
        const stockValue = stock || 0;
        const alertValue = record.stock_quantitiy_alert || 0;
        const isLow = stockValue <= alertValue && stockValue > 0;
        const isEmpty = stockValue === 0;

        let color = "green";
        if (isLow) color = "orange";
        if (isEmpty) color = "red";

        return (
          <Tooltip
            title={
              isLow
                ? "Stock faible"
                : isEmpty
                ? "Stock épuisé"
                : "Stock disponible"
            }
          >
            <Tag
              color={color}
              style={{ borderRadius: "12px", padding: "0 8px" }}
            >
              {stockValue} {record.unit_short_name || "unité(s)"}
            </Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => (a.current_stock || 0) - (b.current_stock || 0),
      width: 150,
      responsive: ["sm"],
    },
    {
      title: "Matières",
      dataIndex: "materials_count",
      key: "materials_count",
      align: "center",
      render: (count) => (
        <Tag color="blue" style={{ borderRadius: "12px", padding: "0 8px" }}>
          {count}
        </Tag>
      ),
      sorter: (a, b) => a.materials_count - b.materials_count,
      responsive: ["lg"],
      width: 100,
    },
    {
      title: "Produits",
      dataIndex: "outputs_count",
      key: "outputs_count",
      align: "center",
      render: (count) => (
        <Tag color="green" style={{ borderRadius: "12px", padding: "0 8px" }}>
          {count}
        </Tag>
      ),
      sorter: (a, b) => a.outputs_count - b.outputs_count,
      responsive: ["lg"],
      width: 100,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (text, record) => (
        <Switch
          checkedChildren="Actif"
          unCheckedChildren="Inactif"
          checked={record.status === "active"}
          onChange={() => handleToggleStatus(record)}
        />
      ),
      filters: [
        { text: "Actif", value: "active" },
        { text: "Inactif", value: "inactive" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Produire">
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => navigate(`/production/process/${record.id}`)}
              style={styles.actionButton}
              size="middle"
            />
          </Tooltip>
          <Tooltip title="Voir les détails">
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => showUnitDetails(record)}
              style={styles.actionButton}
              size="middle"
            />
          </Tooltip>
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
          ) && (
            <Tooltip title="Modifier">
              <Button
                style={styles.actionButton}
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Production.Unites.delete"
          ) && (
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette unité ?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
              placement="topRight"
            >
              <Tooltip title="Supprimer">
                <Button
                  style={styles.actionButton}
                  icon={<DeleteOutlined />}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Fonction pour transformer les données du tableau en vue de cartes
  const renderCardView = () => {
    if (units.length === 0 && !loading) {
      return <Empty description="Aucune unité de production trouvée" />;
    }
    return (
      <Row gutter={[16, 16]}>
        {units.map((unit) => (
          <Col xs={24} sm={12} md={12} lg={8} xl={6} key={unit.id}>
            <Card
              hoverable
              style={{
                marginBottom: 16,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              bodyStyle={{ flexGrow: 1 }}
              cover={
                <div
                  style={{
                    padding: "16px",
                    background: "#f0f2f5",
                    textAlign: "center",
                    borderBottom: "1px solid #e8e8e8",
                  }}
                >
                  <ExperimentOutlined
                    style={{ fontSize: "48px", color: "#1890ff" }}
                  />
                  <Title
                    level={5}
                    style={{ marginTop: 8, marginBottom: 0 }}
                    className="text-base truncate"
                  >
                    {unit.name}
                  </Title>
                </div>
              }
              actions={[
                <Tooltip key={`view-${unit.id}`} title="Détails">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => showUnitDetails(unit)}
                  />
                </Tooltip>,
                hasPermission(
                  "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
                ) ? (
                  <Tooltip key={`edit-${unit.id}`} title="Modifier">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(unit)}
                    />
                  </Tooltip>
                ) : null,
                hasPermission(
                  "Gestion Commerciale.Approvisionnement.Production.Unites.delete"
                ) ? (
                  <Popconfirm
                    key={`delete-${unit.id}`}
                    title="Supprimer cette unité ?"
                    onConfirm={() => handleDelete(unit.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Tooltip title="Supprimer">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                ) : null,
              ].filter(Boolean)}
            >
              <Card.Meta
                description={
                  <Tooltip title={unit.description || "Aucune description"}>
                    <Text
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{
                        height: 44,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {unit.description || "Aucune description"}
                    </Text>
                  </Tooltip>
                }
              />
              <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Tag color={unit.status === "active" ? "green" : "red"}>
                    {unit.status === "active" ? "Actif" : "Inactif"}
                  </Tag>
                  <Text type="secondary">
                    Stock: {unit.current_stock || 0}{" "}
                    {unit.unit_short_name || "unités"}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Statistiques résumées
  const renderSummaryStats = () => {
    // Compter le nombre d'unités actives et inactives
    const activeUnits = units.filter((unit) => unit.status === "active").length;
    const inactiveUnits = units.length - activeUnits;

    // Calculer le nombre total de matières premières et produits finis
    const totalMaterials = units.reduce(
      (sum, unit) => sum + unit.materials_count,
      0
    );
    const totalOutputs = units.reduce(
      (sum, unit) => sum + unit.outputs_count,
      0
    );

    // Calculer le stock total disponible
    const totalStock = units.reduce(
      (sum, unit) => sum + (unit.current_stock || 0),
      0
    );

    // Trouver l'unité de mesure la plus commune
    const unitCounts = {};
    units.forEach((unit) => {
      if (unit.unit_short_name) {
        unitCounts[unit.unit_short_name] =
          (unitCounts[unit.unit_short_name] || 0) + 1;
      }
    });
    let mostCommonUnit = "unités";
    if (Object.keys(unitCounts).length > 0) {
      mostCommonUnit = Object.keys(unitCounts).reduce((a, b) =>
        unitCounts[a] > unitCounts[b] ? a : b
      );
    }

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card style={{ ...styles.card, ...styles.statCard }}>
            <Statistic
              title="Unités de production"
              value={units.length}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card style={{ ...styles.card, ...styles.statCard }}>
            <Statistic
              title="Unités actives"
              value={activeUnits}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card style={{ ...styles.card, ...styles.statCard }}>
            <Statistic
              title="Matières premières"
              value={totalMaterials}
              prefix={<FileExcelOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card style={{ ...styles.card, ...styles.statCard }}>
            <Statistic
              title="Produits finis"
              value={totalOutputs}
              prefix={<FormOutlined />}
              valueStyle={{ color: "#13c2c2" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={16} lg={8}>
          <Card style={{ ...styles.card, ...styles.statCard }}>
            <Statistic
              title="Stock total disponible"
              value={totalStock}
              suffix={mostCommonUnit}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#fa541c" }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // Si aucun magasin n'est sélectionné, afficher un message
  if (!selectedWarehouse) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Card style={styles.card}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Typography.Text strong>
                Veuillez sélectionner un magasin dans la barre de navigation en
                haut à droite pour afficher les unités de production.
              </Typography.Text>
            }
          />
        </Card>
      </div>
    );
  }

  // Debug information to display on the page
  console.log("Rendering with warehouse ID:", selectedWarehouse);

  return (
    <div className="production-units-container p-sm md:p-md">
      {/* Breadcrumb et titre */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Breadcrumb>
            <Breadcrumb.Item>Accueil</Breadcrumb.Item>
            <Breadcrumb.Item>Production</Breadcrumb.Item>
            <Breadcrumb.Item>Unités de production</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>

      {/* En-tête avec titre et bouton d'ajout */}
      <Card
        style={{ ...styles.card, marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="bg-white p-md rounded-t-lg border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <Title
              level={3}
              style={{ margin: 0 }}
              className="text-xl md:text-2xl"
            >
              Unités de production
            </Title>
            <Text type="secondary" className="text-sm md:text-base">
              Gérez vos unités de production
            </Text>
          </div>
          <Space className="mt-sm sm:mt-0 w-full sm:w-auto">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={
                !hasPermission(
                  "Gestion Commerciale.Approvisionnement.Production.Unites.create"
                )
              }
              className="w-full sm:w-auto"
            >
              Ajouter Unité
            </Button>
          </Space>
        </div>

        {/* Section de statistiques */}
        <div style={{ padding: "16px" }}>{renderSummaryStats()}</div>

        {/* Section de recherche et filtres */}
        <div className="px-md py-sm bg-gray-50 rounded-b-lg">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={8}>
              <Input.Search
                placeholder="Rechercher une unité..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                style={{ width: "100%" }}
                className="mb-sm md:mb-0"
              />
            </Col>
            {showFilters && (
              <Col xs={24} md={12} lg={6}>
                <Select
                  placeholder="Statut"
                  style={{ width: "100%" }}
                  allowClear
                  onChange={handleStatusChange}
                  value={selectedStatus}
                  className="mb-sm md:mb-0"
                >
                  <Option value="active">Actif</Option>
                  <Option value="inactive">Inactif</Option>
                </Select>
              </Col>
            )}
            <Col
              xs={24}
              lg={showFilters ? 10 : 16}
              className="flex flex-col sm:flex-row items-center gap-sm justify-start sm:justify-end"
            >
              <Space
                wrap
                className="w-full sm:w-auto flex justify-start sm:justify-end"
              >
                <Button
                  icon={<FilterOutlined />}
                  onClick={toggleFilters}
                  type={showFilters ? "primary" : "default"}
                  style={styles.actionButton}
                  className="w-full sm:w-auto"
                >
                  Filtres
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  style={styles.actionButton}
                  className="w-full sm:w-auto"
                >
                  Actualiser
                </Button>
                <Segmented
                  options={[
                    {
                      value: "table",
                      icon: <BarsOutlined />,
                    },
                    {
                      value: "cards",
                      icon: <AppstoreOutlined />,
                    },
                  ]}
                  value={viewMode}
                  onChange={setViewMode}
                  className="w-full sm:w-auto"
                />
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Section principale du tableau ou de la vue en cartes */}
      <Card style={styles.tableCard} bodyStyle={{ padding: 0 }}>
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={units}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} unités`,
                style: { marginBottom: 0, padding: "16px 0" },
              }}
              loading={loading}
              onChange={handleTableChange}
              bordered={false}
              style={{ borderRadius: "8px 8px 0 0", overflow: "hidden" }}
              rowClassName={() => "table-row-hover"}
              scroll={{ x: "max-content" }}
            />
          </div>
        ) : (
          <div style={{ padding: "16px" }}>{renderCardView()}</div>
        )}
      </Card>
    </div>
  );
};

export default ProductionList;
