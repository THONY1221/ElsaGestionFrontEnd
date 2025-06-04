import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Typography,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Alert,
  Spin,
  Space,
  Divider,
  message,
  List,
  Avatar,
  Statistic,
  Descriptions,
  Modal,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  RocketOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProductionUnitById,
  getProductionUnits,
  calculateProductionNeeds,
  processProduction,
  cancelProduction,
  finalizeProduction,
} from "./api";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const { Title, Text } = Typography;
const { Option } = Select;

// Helper function for currency formatting
const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) {
    return "N/A";
  }
  const numValue = parseFloat(value);
  const roundedValue = Math.round(numValue);
  // 'fr-FR' typically uses a space as a thousand separator and no decimals for whole numbers.
  return `${roundedValue.toLocaleString("fr-FR")} CFA`;
};

const ProductionProcess = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission, user } = useAuth();
  const { selectedWarehouse, selectedCompany } = useSelection();

  // Ref pour tracker le magasin précédent
  const prevWarehouseRef = useRef(selectedWarehouse);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [calculationResults, setCalculationResults] = useState(null);
  const [producing, setProducing] = useState(false);

  // New state for the production result modal
  const [productionResultModalVisible, setProductionResultModalVisible] =
    useState(false);
  const [productionResultData, setProductionResultData] = useState(null);

  // Obtenir le nom du magasin sélectionné
  const selectedWarehouseName = React.useMemo(() => {
    if (!selectedWarehouse || !user?.assigned_warehouses) return null;
    const warehouse = user.assigned_warehouses.find(
      (w) => w.id === selectedWarehouse
    );
    return warehouse ? warehouse.name : `Magasin ID: ${selectedWarehouse}`;
  }, [selectedWarehouse, user]);

  // Charger les unités de production et en sélectionner une si id est fourni
  useEffect(() => {
    loadUnits();
    if (id && selectedWarehouse) {
      form.setFieldsValue({ production_unit_id: parseInt(id) });
      handleUnitChange(parseInt(id));
    }
  }, [id, selectedWarehouse]);

  // Nouveau useEffect pour détecter les changements de magasin et réinitialiser le formulaire
  useEffect(() => {
    // Vérifier si c'est un vrai changement de magasin (pas le premier chargement)
    if (
      prevWarehouseRef.current !== null &&
      prevWarehouseRef.current !== selectedWarehouse
    ) {
      // Réinitialiser tous les états
      form.resetFields();
      setSelectedUnit(null);
      setCalculationResults(null);
      setProductionResultData(null);
      setProductionResultModalVisible(false);

      // Afficher un message informatif
      if (selectedWarehouse) {
        message.info("Magasin changé - Formulaire réinitialisé");
      }

      // Si on a un ID dans l'URL et que le magasin a changé,
      // on va recharger l'unité pour vérifier qu'elle appartient au nouveau magasin
      if (id && selectedWarehouse) {
        form.setFieldsValue({ production_unit_id: parseInt(id) });
        handleUnitChange(parseInt(id));
      }
    }

    // Mettre à jour la référence pour le prochain changement
    prevWarehouseRef.current = selectedWarehouse;
  }, [selectedWarehouse, id, form]); // Déclenché quand selectedWarehouse change

  // Charger toutes les unités de production filtrées par magasin
  const loadUnits = async () => {
    if (!selectedWarehouse) {
      setUnits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Chargement des unités pour le magasin:", selectedWarehouse);
      const data = await getProductionUnits({
        page: 1,
        limit: 100,
        warehouse_id: selectedWarehouse,
      });

      // Filtrer côté client si l'API ne le fait pas déjà
      let filteredUnits = data.units || [];
      if (filteredUnits.length > 0) {
        filteredUnits = filteredUnits.filter(
          (unit) => unit.warehouse_id === selectedWarehouse
        );
      }

      setUnits(filteredUnits);
      console.log(
        `${filteredUnits.length} unités trouvées pour le magasin ${selectedWarehouse}`
      );
    } catch (error) {
      message.error("Erreur lors du chargement des unités de production");
      console.error(error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les détails d'une unité de production
  const handleUnitChange = async (unitId) => {
    if (!unitId) {
      setSelectedUnit(null);
      setCalculationResults(null);
      return;
    }

    setLoading(true);
    try {
      const data = await getProductionUnitById(unitId);

      // Vérifier que l'unité appartient au magasin sélectionné
      if (data.warehouse_id !== selectedWarehouse) {
        message.error(
          "Cette unité de production n'appartient pas au magasin sélectionné"
        );
        setSelectedUnit(null);
        form.setFieldsValue({ production_unit_id: undefined });
        return;
      }

      setSelectedUnit(data);
      form.setFieldsValue({ output_quantity: 1 });

      // Calculer les besoins pour la quantité par défaut
      handleCalculate({ production_unit_id: unitId, output_quantity: 1 });
    } catch (error) {
      message.error("Erreur lors du chargement de l'unité de production");
      console.error(error);
      setSelectedUnit(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les besoins en matières premières
  const handleCalculate = async (values) => {
    if (!selectedWarehouse) {
      message.warning(
        "Veuillez sélectionner un magasin avant de calculer les besoins"
      );
      return;
    }

    setLoading(true);
    try {
      const data = await calculateProductionNeeds({
        ...values,
        warehouse_id: selectedWarehouse,
      });
      setCalculationResults(data);
    } catch (error) {
      message.error("Erreur lors du calcul des besoins en matières premières");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Invalidate calculation results if output quantity changes after a calculation has been made
  const handleFormValuesChange = (changedValues) => {
    if (changedValues.hasOwnProperty("output_quantity") && calculationResults) {
      setCalculationResults(null);
    }
  };

  // Lancer la production
  const handleProduce = async () => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Gerer.create"
      )
    ) {
      message.error(
        "Vous n'avez pas la permission de démarrer une production."
      );
      return;
    }

    if (!selectedWarehouse) {
      message.error(
        "Veuillez sélectionner un magasin avant de lancer la production"
      );
      return;
    }

    if (!calculationResults || !calculationResults.all_available) {
      message.error(
        "Impossible de lancer la production car certaines matières premières sont insuffisantes"
      );
      return;
    }

    setProducing(true);
    try {
      const values = form.getFieldsValue();
      const user_id = localStorage.getItem("user_id") || 1; // Récupérer l'ID utilisateur

      await processProduction({
        ...values,
        user_id,
        warehouse_id: selectedWarehouse,
        notes: `Production de ${values.output_quantity} unités`,
      });

      message.success("Production effectuée avec succès");

      // Set data for modal and show it
      setProductionResultData(calculationResults);
      setProductionResultModalVisible(true);

      // Clear form fields and related state on the main page
      form.setFieldsValue({
        production_unit_id: undefined, // Clear production unit selection
        output_quantity: 1, // Reset quantity to default
      });
      setSelectedUnit(null); // Clear selected unit details from display
      setCalculationResults(null); // Clear calculation results from the main display

      // Removed handleCalculate(values) as the form/context for it is now cleared.
      // Stock updates are assumed to be handled by processProduction on the backend.
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else if (error.error) {
        message.error(error.error);
      } else {
        message.error("Erreur lors de la production");
      }
      console.error(error);
    } finally {
      setProducing(false);
    }
  };

  const handleCancelProduction = async (productionId) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Gerer.delete"
      )
    ) {
      message.error("Vous n'avez pas la permission d'annuler une production.");
      return;
    }
    // Placeholder: Implement actual cancel logic
    message.info(
      `Tentative d'annulation de la production ${productionId} (logique à implémenter)`
    );
    // try {
    //   await cancelProduction(productionId);
    //   message.success("Production annulée");
    //   // Refresh or update state
    // } catch (error) { message.error("Erreur d'annulation"); }
  };

  const handleFinalizeProduction = async (productionId) => {
    if (
      !hasPermission(
        "Gestion Commerciale.Approvisionnement.Production.Gerer.finalize"
      )
    ) {
      message.error(
        "Vous n'avez pas la permission de finaliser une production."
      );
      return;
    }
    // Placeholder: Implement actual finalize logic
    message.info(
      `Tentative de finalisation de la production ${productionId} (logique à implémenter)`
    );
    // try {
    //   await finalizeProduction(productionId);
    //   message.success("Production finalisée");
    //   // Refresh or update state
    // } catch (error) { message.error("Erreur de finalisation"); }
  };

  // Colonnes pour la table des matières premières
  const materialColumns = [
    {
      title: "Matière première",
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
      title: "Quantité nécessaire",
      dataIndex: "required_quantity",
      key: "required_quantity",
      align: "right",
      render: (text, record) => (
        <span>
          {text} {record.unit_short_name}
        </span>
      ),
    },
    {
      title: "Prix d'achat unitaire",
      dataIndex: "purchase_price",
      key: "purchase_price",
      align: "right",
      render: (text, record) => formatCurrency(record.purchase_price),
    },
    {
      title: "Coût d'achat total (matière)",
      key: "total_material_purchase_cost",
      align: "right",
      render: (_, record) => {
        const quantity = parseFloat(record.required_quantity);
        const cost = parseFloat(record.purchase_price);
        if (
          !isNaN(quantity) &&
          record.purchase_price !== undefined &&
          !isNaN(cost)
        ) {
          return formatCurrency(quantity * cost);
        }
        return "N/A";
      },
    },
    {
      title: "Stock disponible",
      dataIndex: "available",
      key: "available",
      align: "right",
      render: (text, record) => (
        <span>
          {text} {record.unit_short_name}
        </span>
      ),
    },
    {
      title: "Statut",
      key: "status",
      align: "center",
      render: (_, record) =>
        record.is_sufficient ? (
          <CheckCircleOutlined style={{ color: "green", fontSize: 18 }} />
        ) : (
          <CloseCircleOutlined style={{ color: "red", fontSize: 18 }} />
        ),
    },
  ];

  // Colonnes pour la table des produits finis
  const outputColumns = [
    {
      title: "Produit fini",
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
      dataIndex: "result_quantity",
      key: "result_quantity",
      align: "right",
      render: (text, record) => (
        <span>
          {text} {record.unit_short_name}
        </span>
      ),
    },
  ];

  // Rendu conditionnel si aucun magasin n'est sélectionné
  if (!selectedWarehouse && !loading) {
    return (
      <Card>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/production/units")}
            style={{ marginRight: 16 }}
          >
            Retour
          </Button>
          <Title level={3}>Gérer la production</Title>
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
                  pour accéder aux unités de production.
                </p>
                <Alert
                  message="Information importante"
                  description="La gestion de la production est liée au magasin sélectionné. Chaque magasin a ses propres unités de production et stocks de matières premières."
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

  if (loading && !units.length) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/production/units")}
          style={{ marginRight: 16 }}
        >
          Retour
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0 }}>
            Gérer la production
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
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleCalculate}
        onValuesChange={handleFormValuesChange}
        initialValues={{
          production_unit_id: id ? parseInt(id) : undefined,
          output_quantity: 1,
        }}
      >
        <Form.Item
          name="production_unit_id"
          label="Unité de production"
          rules={[
            {
              required: true,
              message: "Veuillez sélectionner une unité de production",
            },
          ]}
        >
          <Select
            placeholder={
              !selectedWarehouse
                ? "Sélectionnez d'abord un magasin"
                : units.length === 0
                ? "Aucune unité de production disponible"
                : "Sélectionner une unité de production"
            }
            loading={loading}
            onChange={handleUnitChange}
            showSearch
            optionFilterProp="children"
            disabled={!selectedWarehouse}
            notFoundContent={
              !selectedWarehouse ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Sélectionnez un magasin"
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Aucune unité de production trouvée pour ce magasin"
                />
              )
            }
          >
            {units.map((unit) => (
              <Option key={unit.id} value={unit.id}>
                {unit.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedUnit && (
          <>
            <Descriptions
              title="Détails de l'unité de production"
              bordered
              size="small"
              column={1}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Nom">
                {selectedUnit.name}
              </Descriptions.Item>
              {selectedUnit.description && (
                <Descriptions.Item label="Description">
                  {selectedUnit.description}
                </Descriptions.Item>
              )}
              {selectedUnit.warehouse_name && (
                <Descriptions.Item label="Magasin">
                  {selectedUnit.warehouse_name}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Form.Item
              name="output_quantity"
              label="Quantité à produire"
              rules={[
                { required: true, message: "Veuillez saisir une quantité" },
              ]}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                style={{ width: 200 }}
                addonAfter={
                  selectedUnit.outputs &&
                  selectedUnit.outputs[0]?.unit_short_name
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => form.submit()}
                loading={loading}
                disabled={!selectedWarehouse}
              >
                Calculer les besoins
              </Button>
            </Form.Item>
          </>
        )}
      </Form>

      {calculationResults && (
        <>
          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Statistic
              title="Production demandée"
              value={calculationResults.output_quantity}
              precision={2}
              suffix={calculationResults.outputs[0]?.unit_short_name}
              style={{ display: "inline-block", marginRight: 32 }}
            />
          </div>

          {!calculationResults.all_available && (
            <Alert
              message="Stock insuffisant"
              description="Certaines matières premières ne sont pas disponibles en quantité suffisante pour effectuer cette production."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Title level={4}>Matières premières nécessaires</Title>
          <Table
            columns={materialColumns}
            dataSource={calculationResults.materials}
            rowKey="id"
            pagination={false}
            size="middle"
            summary={(pageData) => {
              let totalMaterialPurchaseCost = 0;
              pageData.forEach(({ required_quantity, purchase_price }) => {
                const quantityNum = parseFloat(required_quantity);
                const costNum = parseFloat(purchase_price);
                if (
                  !isNaN(quantityNum) &&
                  purchase_price !== undefined &&
                  !isNaN(costNum)
                ) {
                  totalMaterialPurchaseCost += quantityNum * costNum;
                }
              });

              const outputQty = parseFloat(calculationResults.output_quantity);
              const unitMaterialCost =
                !isNaN(outputQty) &&
                outputQty > 0 &&
                totalMaterialPurchaseCost > 0
                  ? totalMaterialPurchaseCost / outputQty
                  : 0;

              return (
                <>
                  <Table.Summary.Row style={{ background: "#fafafa" }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text strong>Total Coût d'Achat Matières:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong>
                        {formatCurrency(totalMaterialPurchaseCost)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                    <Table.Summary.Cell index={5} />
                  </Table.Summary.Row>
                  {calculationResults.outputs &&
                    calculationResults.outputs.length > 0 &&
                    !isNaN(outputQty) &&
                    outputQty > 0 && (
                      <Table.Summary.Row style={{ background: "#fafafa" }}>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          <Text strong>
                            Coût Matières / Unité Produite (
                            {calculationResults.outputs[0]?.product_name ||
                              "Produit"}
                            ):
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <Text strong>
                            {formatCurrency(unitMaterialCost)} /{" "}
                            {calculationResults.outputs[0]?.unit_short_name ||
                              "unité"}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                        <Table.Summary.Cell index={5} />
                      </Table.Summary.Row>
                    )}
                </>
              );
            }}
          />

          <Title level={4} style={{ marginTop: 24 }}>
            Produits finis obtenus
          </Title>
          <Table
            columns={outputColumns}
            dataSource={calculationResults.outputs}
            rowKey="id"
            pagination={false}
            size="middle"
          />

          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              size="large"
              onClick={handleProduce}
              disabled={
                !calculationResults ||
                !calculationResults.all_available ||
                !selectedWarehouse ||
                producing ||
                !hasPermission(
                  "Gestion Commerciale.Approvisionnement.Production.Gerer.create"
                )
              }
              loading={producing}
            >
              Lancer la production
            </Button>
          </div>
        </>
      )}

      {/* Modal for displaying production results */}
      {productionResultData && (
        <Modal
          title="Résultat de la Production"
          open={productionResultModalVisible}
          onOk={() => setProductionResultModalVisible(false)}
          onCancel={() => setProductionResultModalVisible(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setProductionResultModalVisible(false)}
            >
              OK
            </Button>,
          ]}
          width={600} // You can adjust the width as needed
        >
          {productionResultData.outputs &&
            productionResultData.outputs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>Produit(s) Fini(s)</Title>
                {productionResultData.outputs.map((output, index) => (
                  <Descriptions
                    key={index}
                    bordered
                    column={1}
                    size="small"
                    style={{ marginBottom: 8 }}
                  >
                    <Descriptions.Item label="Produit">
                      {output.product_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quantité Produite">
                      {`${output.result_quantity} ${
                        output.unit_short_name || ""
                      }`}
                    </Descriptions.Item>
                  </Descriptions>
                ))}
              </div>
            )}

          {productionResultData.materials &&
            productionResultData.materials.length > 0 && (
              <div>
                <Title level={5}>Matières Premières Consommées</Title>
                <Table
                  dataSource={productionResultData.materials}
                  columns={[
                    {
                      title: "Matière première",
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
                      title: "Quantité Utilisée",
                      dataIndex: "required_quantity",
                      key: "required_quantity",
                      align: "right",
                      render: (text, record) =>
                        `${text} ${record.unit_short_name || ""}`,
                    },
                  ]}
                  rowKey="id" // Ensure 'id' is a unique key in materials array items
                  pagination={false}
                  size="small"
                />
              </div>
            )}
        </Modal>
      )}
    </Card>
  );
};

export default ProductionProcess;
