import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Spin,
  Tag,
  Space,
  DatePicker,
  Button,
  Tooltip,
  Empty,
  Alert,
  Modal,
  Descriptions,
  Avatar,
  Divider,
} from "antd";
import moment from "moment";
import {
  FileSearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getProductionHistory, getProductionDetails } from "./api";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";
import { message } from "antd";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Helper function for currency formatting
const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) {
    return "N/A";
  }
  const numValue = parseFloat(value);
  const roundedValue = Math.round(numValue);
  return `${roundedValue.toLocaleString("fr-FR")} CFA`;
};

const ProductionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [dateRange, setDateRange] = useState(null);
  const { hasPermission, user } = useAuth();
  const { selectedWarehouse, selectedCompany } = useSelection();

  // États pour le modal de détails
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProductionDetails, setSelectedProductionDetails] =
    useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Obtenir le nom du magasin sélectionné
  const selectedWarehouseName = React.useMemo(() => {
    if (!selectedWarehouse || !user?.assigned_warehouses) return null;
    const warehouse = user.assigned_warehouses.find(
      (w) => w.id === selectedWarehouse
    );
    return warehouse ? warehouse.name : `Magasin ID: ${selectedWarehouse}`;
  }, [selectedWarehouse, user]);

  // Charger l'historique des productions filtré par magasin
  const loadHistory = async (page = 1, limit = 10, customDateRange = null) => {
    if (!selectedWarehouse) {
      setLogs([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(
        "Chargement de l'historique pour le magasin:",
        selectedWarehouse
      );

      // Utiliser customDateRange si fourni, sinon utiliser dateRange du state
      const effectiveDateRange =
        customDateRange !== null ? customDateRange : dateRange;

      const data = await getProductionHistory(page, limit, {
        warehouse_id: selectedWarehouse,
        start_date: effectiveDateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: effectiveDateRange?.[1]?.format("YYYY-MM-DD"),
      });

      setLogs(
        data.logs.map((log) => ({
          ...log,
          key: log.id,
          created_at: moment(log.created_at).format("DD/MM/YYYY HH:mm"),
        }))
      );
      setTotal(data.total);
      console.log(
        `${data.logs.length} productions trouvées pour le magasin ${selectedWarehouse}`
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement de l'historique des productions:",
        error
      );
      message.error(
        "Erreur lors du chargement de l'historique des productions"
      );
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Charger l'historique au montage du composant et quand le magasin change
  useEffect(() => {
    if (selectedWarehouse) {
      loadHistory(pagination.current, pagination.pageSize);
    }
  }, [selectedWarehouse]);

  // Recharger quand la pagination change
  useEffect(() => {
    if (selectedWarehouse) {
      loadHistory(pagination.current, pagination.pageSize);
    }
  }, [pagination.current, pagination.pageSize]);

  // Recharger quand la plage de dates change
  useEffect(() => {
    if (selectedWarehouse) {
      // Réinitialiser à la première page quand les dates changent
      if (pagination.current !== 1) {
        setPagination({ ...pagination, current: 1 });
      } else {
        loadHistory(1, pagination.pageSize);
      }
    }
  }, [dateRange, selectedWarehouse]);

  // Gérer le changement de page
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Gérer le filtrage par date
  const handleDateChange = (dates) => {
    console.log("Changement de dates:", dates);
    setDateRange(dates);

    // Pas besoin d'appeler loadHistory ici car useEffect s'en chargera
    // mais on peut le faire pour une réponse plus immédiate
    if (selectedWarehouse) {
      // Réinitialiser à la première page et charger avec les nouvelles dates
      setPagination({ ...pagination, current: 1 });
      loadHistory(1, pagination.pageSize, dates);
    }
  };

  // Fonction pour charger et afficher les détails d'une production
  const handleViewDetails = async (record) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Historique.details"
      )
    ) {
      message.warning("Vous n'avez pas la permission de voir les détails.");
      return;
    }

    setLoadingDetails(true);
    setDetailsModalVisible(true);

    try {
      // Charger les détails complets via l'API
      const productionDetails = await getProductionDetails(record.id);
      setSelectedProductionDetails(productionDetails);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      message.error("Erreur lors du chargement des détails de la production");
      setDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fermer le modal de détails
  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedProductionDetails(null);
  };

  // Rendu conditionnel si aucun magasin n'est sélectionné
  if (!selectedWarehouse && !loading) {
    return (
      <Card className="p-sm md:p-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md">
          <Title level={3} className="!mb-0 text-xl md:text-2xl">
            Historique des productions
          </Title>
        </div>

        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Empty
            image={
              <ExclamationCircleOutlined
                style={{ fontSize: 64, color: "#faad14" }}
              />
            }
            description={
              <div>
                <h3
                  style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}
                >
                  Aucun magasin sélectionné
                </h3>
                <p style={{ color: "#666", marginBottom: 16 }}>
                  Veuillez sélectionner un magasin dans la barre de navigation
                  pour consulter l'historique des productions.
                </p>
                <Alert
                  message="Information importante"
                  description="L'historique des productions est filtré par magasin. Chaque magasin a son propre historique de production et ses unités de production associées."
                  type="info"
                  showIcon
                  style={{ textAlign: "left", maxWidth: 500, margin: "0 auto" }}
                />
              </div>
            }
          />
        </div>
      </Card>
    );
  }

  // Colonnes du tableau
  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) =>
        moment(a.created_at, "DD/MM/YYYY HH:mm").valueOf() -
        moment(b.created_at, "DD/MM/YYYY HH:mm").valueOf(),
      width: 150,
      responsive: ["sm"],
    },
    {
      title: "Unité de production",
      dataIndex: "production_unit_name",
      key: "production_unit_name",
    },
    {
      title: "Qté. Produite",
      dataIndex: "output_quantity",
      key: "output_quantity",
      align: "right",
      render: (text) => <span>{parseFloat(text).toFixed(2)}</span>,
      width: 120,
      responsive: ["sm"],
    },
    {
      title: "Utilisateur",
      dataIndex: "user_name",
      key: "user_name",
      render: (text) => text || <Text type="secondary">Système</Text>,
      responsive: ["md"],
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: (status) => {
        let color = "green";
        if (status === "failed") color = "red";
        if (status === "pending") color = "orange";

        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {hasPermission(
            "Gestion Commerciale.Approvisionnement.Production.Historique.details"
          ) && (
            <Tooltip title="Voir Détails">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card className="p-sm md:p-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md">
          <div style={{ flex: 1 }}>
            <Title level={3} className="!mb-0 text-xl md:text-2xl">
              Historique des productions
            </Title>
            {selectedWarehouseName && (
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: "#e6f7ff",
                    color: "#1890ff",
                    border: "1px solid #91d5ff",
                  }}
                >
                  <ShopOutlined style={{ marginRight: 4 }} />
                  {selectedWarehouseName}
                </span>
              </div>
            )}
          </div>
          <Space
            direction="vertical"
            className="w-full sm:w-auto sm:flex sm:flex-row sm:items-center sm:gap-sm"
          >
            <RangePicker
              onChange={handleDateChange}
              placeholder={["Date début", "Date fin"]}
              allowClear
              className="w-full"
              value={dateRange}
              disabled={!selectedWarehouse}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                loadHistory(pagination.current, pagination.pageSize)
              }
              className="w-full sm:w-auto"
              disabled={!selectedWarehouse}
              loading={loading}
            >
              Actualiser
            </Button>
          </Space>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            scroll={{ x: "max-content" }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} productions`,
            }}
            loading={loading}
            onChange={handleTableChange}
            locale={{
              emptyText: selectedWarehouse ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Aucune production trouvée pour ce magasin"
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Sélectionnez un magasin"
                />
              ),
            }}
            expandable={{
              expandedRowRender: (record) => (
                <p style={{ margin: 0 }}>
                  {record.notes || "Aucune note supplémentaire."}
                </p>
              ),
              expandIcon: ({ expanded, onExpand, record }) =>
                record.notes ? (
                  expanded ? (
                    <FileSearchOutlined
                      onClick={(e) => onExpand(record, e)}
                      style={{ color: "#1890ff" }}
                    />
                  ) : (
                    <FileSearchOutlined onClick={(e) => onExpand(record, e)} />
                  )
                ) : null,
            }}
          />
        </div>
      </Card>

      {/* Modal pour les détails de la production */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <span>Détails de la production</span>
            {selectedProductionDetails && (
              <Tag color="blue">ID: {selectedProductionDetails.id}</Tag>
            )}
          </div>
        }
        open={detailsModalVisible}
        onCancel={handleCloseDetailsModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailsModal}>
            Fermer
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {loadingDetails ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Chargement des détails...</p>
          </div>
        ) : selectedProductionDetails ? (
          <div>
            {/* Informations générales */}
            <Descriptions
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarOutlined />
                  <span>Informations générales</span>
                </div>
              }
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Date de production" span={2}>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {moment(
                    selectedProductionDetails.production.created_at
                  ).format("DD/MM/YYYY HH:mm")}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Unité de production">
                {selectedProductionDetails.production.production_unit_name}
              </Descriptions.Item>
              <Descriptions.Item label="Quantité produite">
                <Tag color="green">
                  {selectedProductionDetails.summary.output_quantity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Utilisateur">
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <UserOutlined />
                  {selectedProductionDetails.production.user_name || "Système"}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag
                  color={
                    selectedProductionDetails.production.status === "completed"
                      ? "green"
                      : selectedProductionDetails.production.status === "failed"
                      ? "red"
                      : "orange"
                  }
                >
                  {selectedProductionDetails.production.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {selectedProductionDetails.production.warehouse_name && (
                <Descriptions.Item label="Magasin" span={2}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <ShopOutlined />
                    {selectedProductionDetails.production.warehouse_name}
                  </div>
                </Descriptions.Item>
              )}
              {selectedProductionDetails.production.company_name && (
                <Descriptions.Item label="Entreprise" span={2}>
                  {selectedProductionDetails.production.company_name}
                </Descriptions.Item>
              )}
              {selectedProductionDetails.production.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedProductionDetails.production.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            {/* Section pour les matières premières */}
            <div style={{ marginBottom: 24 }}>
              <Title
                level={5}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <TagOutlined />
                Matières premières consommées
              </Title>
              {selectedProductionDetails.materials &&
              selectedProductionDetails.materials.length > 0 ? (
                <Table
                  dataSource={selectedProductionDetails.materials}
                  pagination={false}
                  size="small"
                  rowKey="product_id"
                  columns={[
                    {
                      title: "Produit",
                      dataIndex: "product_name",
                      key: "product_name",
                      render: (text, record) => (
                        <Space>
                          {record.image && (
                            <Avatar
                              src={`/uploads/image_produits/${record.image}`}
                              size="small"
                            />
                          )}
                          <span>{text}</span>
                        </Space>
                      ),
                    },
                    {
                      title: "Quantité utilisée",
                      dataIndex: "used_quantity",
                      key: "used_quantity",
                      align: "right",
                      render: (text, record) => (
                        <span>
                          {text} {record.unit_short_name || record.unit_name}
                        </span>
                      ),
                    },
                    {
                      title: "Prix unitaire",
                      dataIndex: "purchase_price",
                      key: "purchase_price",
                      align: "right",
                      render: (text) => formatCurrency(text),
                    },
                    {
                      title: "Coût total",
                      dataIndex: "total_cost",
                      key: "total_cost",
                      align: "right",
                      render: (text) => formatCurrency(text),
                    },
                  ]}
                  summary={(pageData) => (
                    <Table.Summary.Row style={{ background: "#fafafa" }}>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text strong>Total matières premières :</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong>
                          {formatCurrency(
                            selectedProductionDetails.summary
                              .total_material_cost
                          )}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ) : (
                <Alert
                  message="Aucune matière première"
                  description="Aucune matière première n'est associée à cette production."
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <Divider />

            {/* Section pour les produits finis */}
            <div style={{ marginBottom: 24 }}>
              <Title
                level={5}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <TagOutlined />
                Produits finis obtenus
              </Title>
              {selectedProductionDetails.outputs &&
              selectedProductionDetails.outputs.length > 0 ? (
                <Table
                  dataSource={selectedProductionDetails.outputs}
                  pagination={false}
                  size="small"
                  rowKey="product_id"
                  columns={[
                    {
                      title: "Produit",
                      dataIndex: "product_name",
                      key: "product_name",
                      render: (text, record) => (
                        <Space>
                          {record.image && (
                            <Avatar
                              src={`/uploads/image_produits/${record.image}`}
                              size="small"
                            />
                          )}
                          <span>{text}</span>
                        </Space>
                      ),
                    },
                    {
                      title: "Quantité produite",
                      dataIndex: "produced_quantity",
                      key: "produced_quantity",
                      align: "right",
                      render: (text, record) => (
                        <span>
                          {text} {record.unit_short_name || record.unit_name}
                        </span>
                      ),
                    },
                    {
                      title: "Prix de vente unitaire",
                      dataIndex: "sales_price",
                      key: "sales_price",
                      align: "right",
                      render: (text) => formatCurrency(text),
                    },
                    {
                      title: "Valeur totale",
                      dataIndex: "total_value",
                      key: "total_value",
                      align: "right",
                      render: (text) => formatCurrency(text),
                    },
                  ]}
                  summary={(pageData) => (
                    <Table.Summary.Row style={{ background: "#fafafa" }}>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text strong>Total produits finis :</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong>
                          {formatCurrency(
                            selectedProductionDetails.summary
                              .total_product_value
                          )}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ) : (
                <Alert
                  message="Aucun produit fini"
                  description="Aucun produit fini n'est associé à cette production."
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <Divider />

            {/* Résumé financier */}
            <div style={{ marginBottom: 24 }}>
              <Title
                level={5}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <InfoCircleOutlined />
                Résumé financier
              </Title>
              <Descriptions
                bordered
                column={2}
                size="small"
                style={{ marginTop: 8 }}
              >
                <Descriptions.Item label="Coût total matières">
                  <Text
                    type={
                      parseFloat(
                        selectedProductionDetails.summary.total_material_cost
                      ) > 0
                        ? "danger"
                        : "secondary"
                    }
                  >
                    {formatCurrency(
                      selectedProductionDetails.summary.total_material_cost
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Valeur totale produits">
                  <Text
                    type={
                      parseFloat(
                        selectedProductionDetails.summary.total_product_value
                      ) > 0
                        ? "success"
                        : "secondary"
                    }
                  >
                    {formatCurrency(
                      selectedProductionDetails.summary.total_product_value
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Coût unitaire production">
                  {formatCurrency(
                    selectedProductionDetails.summary.unit_production_cost
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Marge brute">
                  <Text
                    type={
                      parseFloat(
                        selectedProductionDetails.summary.profit_margin
                      ) >= 0
                        ? "success"
                        : "danger"
                    }
                  >
                    {formatCurrency(
                      selectedProductionDetails.summary.profit_margin
                    )}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Empty description="Aucun détail disponible" />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProductionHistory;
