import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Pagination,
  InputNumber,
  message,
  Alert,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  PartitionOutlined,
  SlidersOutlined,
  PercentageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useTheme } from "../hooks/useTheme";
import "./styles.css";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const { Option } = Select;
const API_URL = "http://localhost:3000";

const GestionUnites = () => {
  // États pour la liste des unités
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUnits, setTotalUnits] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // États pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [form] = Form.useForm();

  // Données additionnelles
  const [parentUnits, setParentUnits] = useState([]);

  // Hook pour le mode sombre
  const { isDarkMode } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedCompany } = useSelection();

  // Dérivation des entreprises disponibles à partir du contexte d'authentification
  const assignedWarehouses = useMemo(() => {
    return user && Array.isArray(user.assigned_warehouses)
      ? user.assigned_warehouses
      : [];
  }, [user]);

  const availableCompanies = useMemo(() => {
    if (
      authLoading ||
      !user ||
      !assignedWarehouses ||
      assignedWarehouses.length === 0
    ) {
      return [];
    }
    const companyMap = new Map();
    assignedWarehouses.forEach((wh) => {
      if (wh.company_id && !companyMap.has(wh.company_id)) {
        companyMap.set(wh.company_id, {
          id: wh.company_id,
          name: wh.company_name || `Entreprise ID ${wh.company_id}`,
        });
      }
    });
    return Array.from(companyMap.values());
  }, [user, assignedWarehouses, authLoading]);

  // Obtenir le nom de l'entreprise sélectionnée
  const selectedCompanyName = useMemo(() => {
    if (!selectedCompany || !availableCompanies.length) return null;
    const company = availableCompanies.find((c) => c.id === selectedCompany);
    return company ? company.name : `Entreprise ID: ${selectedCompany}`;
  }, [selectedCompany, availableCompanies]);

  // Chargement des unités avec pagination et filtre
  const fetchUnits = async (page = 1, search = "", companyId = null) => {
    if (!companyId) {
      setUnits([]);
      setTotalUnits(0);
      setCurrentPage(1);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/units`, {
        params: { page, search, company_id: companyId },
      });
      setUnits(response.data.units);
      setTotalUnits(
        response.data.pagination?.totalItems || response.data.total || 0
      );
      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur lors du chargement des unités:", error);
      message.error("Erreur lors du chargement des unités");
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement des unités parentes (filtré par entreprise sélectionnée)
  const fetchParentUnitsData = async (companyId = null) => {
    try {
      if (!companyId) {
        setParentUnits([]);
        return;
      }
      const unitsRes = await axios.get(`${API_URL}/api/units`, {
        params: { company_id: companyId, limit: 1000 }, // Récupérer toutes les unités de l'entreprise
      });
      setParentUnits(unitsRes.data.units || []);
    } catch (error) {
      console.error("Erreur lors du chargement des unités parentes:", error);
      message.error("Erreur lors du chargement des unités parentes");
    }
  };

  useEffect(() => {
    fetchUnits(currentPage, searchTerm, selectedCompany);
    fetchParentUnitsData(selectedCompany);
  }, [currentPage, searchTerm, selectedCompany]);

  // Ouvrir le modal en mode création
  const openCreateModal = () => {
    if (!selectedCompany) {
      message.warning(
        "Veuillez sélectionner une entreprise avant de créer une unité"
      );
      return;
    }

    setSelectedUnit(null);
    form.resetFields();
    // Pré-remplir le champ entreprise avec l'entreprise sélectionnée
    form.setFieldsValue({
      company_id: selectedCompany,
      operator: "*",
      operator_value: "1",
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal en mode édition
  const openEditModal = (unit) => {
    setSelectedUnit(unit);
    form.setFieldsValue({
      ...unit,
      operator_value: unit.operator_value ? String(unit.operator_value) : "1",
      date_peremption: unit.date_peremption
        ? dayjs(unit.date_peremption)
        : null,
    });
    setIsModalOpen(true);
  };

  // Gestion de la soumission du formulaire
  const handleFormSubmit = async (values) => {
    try {
      setIsLoading(true);
      const payload = {
        ...values,
        operator_value: Number(values.operator_value),
        date_peremption: values.date_peremption
          ? values.date_peremption.format("YYYY-MM-DD")
          : null,
      };
      if (selectedUnit) {
        await axios.put(`${API_URL}/api/units/${selectedUnit.id}`, payload);
        message.success("Unité mise à jour avec succès");
      } else {
        await axios.post(`${API_URL}/api/units`, payload);
        message.success("Unité créée avec succès");
      }
      setIsModalOpen(false);
      fetchUnits(currentPage, searchTerm, selectedCompany);
      fetchParentUnitsData(selectedCompany); // Recharger les unités parentes
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      message.error(
        error.response?.data?.error ||
          "Erreur lors de l'enregistrement de l'unité"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression d'une unité
  const handleDeleteUnit = async (unit) => {
    if (!unit?.id) {
      message.error("ID de l'unité manquant");
      return;
    }

    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette unité ?",
      content:
        "Cette action pourrait affecter les produits ou d'autres unités associés.",
      okText: "Oui, Supprimer",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        try {
          setIsLoading(true);
          await axios.delete(`${API_URL}/api/units/${unit.id}`);
          message.success("Unité supprimée avec succès");
          // Si c'était la dernière unité de la page et qu'on n'est pas sur la première page
          if (units.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          } else {
            fetchUnits(currentPage, searchTerm, selectedCompany);
          }
          fetchParentUnitsData(selectedCompany); // Recharger les unités parentes
        } catch (error) {
          if (
            error.response &&
            error.response.status === 409 &&
            error.response.data?.error
          ) {
            // Erreur spécifique du backend (ex: unité utilisée)
            message.error(error.response.data.error);
          } else {
            // Erreur générique
            message.error("Erreur lors de la suppression de l'unité.");
            console.error(
              "[handleDeleteUnit onOk] error:",
              error.response || error
            );
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // Colonnes du tableau
  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-medium flex items-center">
          <AppstoreOutlined className="mr-2" /> {text}
        </span>
      ),
    },
    {
      title: "Nom court",
      dataIndex: "short_name",
      key: "short_name",
      render: (text) => (
        <span className="flex items-center">
          <InfoCircleOutlined className="mr-2" /> {text}
        </span>
      ),
      responsive: ["sm"],
    },
    {
      title: "Unité de base",
      dataIndex: "base_unit",
      key: "base_unit",
      render: (text) => (text ? text : "-"),
      responsive: ["md"],
    },
    {
      title: "Opérateur",
      dataIndex: "operator",
      key: "operator",
      render: (text, record) => (
        <span>
          {text} {record.operator_value}
        </span>
      ),
      responsive: ["md"],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined style={{ fontSize: "16px" }} />}
            onClick={() => openEditModal(record)}
            title="Éditer"
            className="p-1"
          ></Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined style={{ fontSize: "16px" }} />}
            onClick={() => handleDeleteUnit(record)}
            title="Supprimer"
            className="p-1"
          ></Button>
        </Space>
      ),
    },
  ];

  // Rendu conditionnel si aucune entreprise n'est sélectionnée
  if (!selectedCompany && !authLoading) {
    return (
      <div
        className={`min-h-screen p-sm md:p-md lg:p-lg ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="max-w-full mx-auto">
          {/* En-tête */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-lg p-md bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="mb-sm md:mb-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                Gestion des Unités
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Gérez les unités de mesure de vos produits
              </p>
            </div>
          </div>

          {/* Message d'information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-md">
            <Empty
              image={
                <ExclamationCircleOutlined
                  style={{ fontSize: 64, color: "#faad14" }}
                />
              }
              description={
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                    Aucune entreprise sélectionnée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Veuillez sélectionner une entreprise dans la barre de
                    navigation pour afficher et gérer les unités.
                  </p>
                  <Alert
                    message="Information"
                    description="La gestion des unités est liée à l'entreprise sélectionnée. Chaque entreprise a ses propres unités de mesure."
                    type="info"
                    showIcon
                    className="text-left"
                  />
                </div>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-sm md:p-md lg:p-lg ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-full mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-lg p-md bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="mb-sm md:mb-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Gestion des Unités
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Gérez les unités de mesure de vos produits
            </p>
            {selectedCompanyName && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <UserOutlined className="mr-1" />
                  {selectedCompanyName}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm">
            <div className="relative flex-grow">
              <Input
                placeholder="Rechercher une unité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={
                  <SearchOutlined className="text-gray-400 dark:text-gray-500" />
                }
                className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              disabled={!selectedCompany}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Nouvelle Unité
            </Button>
          </div>
        </div>

        {/* Conteneur du Tableau des unités avec overflow */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <Table
            columns={columns}
            dataSource={units}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            className={`w-full min-w-[600px] ${isDarkMode ? "table-dark" : ""}`}
            locale={{
              emptyText: selectedCompany ? (
                <Empty
                  description="Aucune unité trouvée pour cette entreprise"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Empty
                  description="Sélectionnez une entreprise pour voir les unités"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </div>

        {/* Pagination */}
        {totalUnits > 0 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={currentPage}
              pageSize={10}
              total={totalUnits}
              onChange={(page) => fetchUnits(page, searchTerm, selectedCompany)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        title={selectedUnit ? "Modifier l'unité" : "Créer une unité"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedUnit(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
        className="custom-modal-width"
      >
        <div className="modal-header p-md border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            {selectedUnit ? "Modifier l'unité" : "Créer une unité"}
          </h2>
        </div>
        <div className="p-sm sm:p-md">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{ operator: "*", operator_value: "1" }}
          >
            {/* Section Informations Générales */}
            <div className="form-section mb-lg p-sm sm:p-md bg-white dark:bg-gray-800 shadow-sm rounded-md">
              <h3 className="text-lg font-semibold mb-md flex items-center text-gray-700 dark:text-gray-200">
                <UserOutlined className="mr-2" /> Informations Générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Form.Item
                  label="Entreprise *"
                  name="company_id"
                  rules={[
                    { required: true, message: "L'entreprise est requise" },
                  ]}
                  hidden={!selectedUnit && !!selectedCompany}
                >
                  <Select
                    placeholder="Sélectionner une entreprise"
                    className="w-full"
                    loading={authLoading}
                    disabled={!selectedUnit} // Désactivé en mode création si une entreprise est sélectionnée
                  >
                    {availableCompanies.map((company) => (
                      <Option key={company.id} value={company.id}>
                        {company.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Affichage de l'entreprise sélectionnée en mode création */}
                {!selectedUnit && selectedCompany && (
                  <Form.Item label="Entreprise">
                    <Input
                      value={selectedCompanyName}
                      disabled
                      className="w-full"
                    />
                  </Form.Item>
                )}

                <Form.Item
                  label="Nom *"
                  name="name"
                  rules={[{ required: true, message: "Le nom est requis" }]}
                >
                  <Input placeholder="Ex: Kilogramme" className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Nom court *"
                  name="short_name"
                  rules={[
                    { required: true, message: "Le nom court est requis" },
                  ]}
                >
                  <Input placeholder="Ex: kg" className="w-full" />
                </Form.Item>
                <Form.Item label="Slug" name="slug">
                  <Input
                    placeholder="Slug généré automatiquement"
                    className="w-full"
                    disabled
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section Paramètres de Conversion */}
            <div className="form-section mb-lg p-sm sm:p-md bg-white dark:bg-gray-800 shadow-sm rounded-md">
              <h3 className="text-lg font-semibold mb-md flex items-center text-gray-700 dark:text-gray-200">
                <SlidersOutlined className="mr-2" /> Paramètres de Conversion
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Form.Item
                  label="Unité de base"
                  name="base_unit"
                  className="md:col-span-2"
                >
                  <Input placeholder="Ex: g" className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Opérateur *"
                  name="operator"
                  rules={[
                    { required: true, message: "L'opérateur est requis" },
                  ]}
                >
                  <Select className="w-full">
                    <Option value="*">Multiplication (*)</Option>
                    <Option value="/">Division (/)</Option>
                    <Option value="+">Addition (+)</Option>
                    <Option value="-">Soustraction (-)</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Valeur de l'opérateur *"
                  name="operator_value"
                  rules={[
                    {
                      required: true,
                      message: "La valeur de l'opérateur est requise",
                    },
                    {
                      pattern: /^\d+$/,
                      message: "La valeur doit être un nombre",
                    },
                  ]}
                >
                  <Input placeholder="Ex: 1000" className="w-full" />
                </Form.Item>
              </div>
            </div>

            {/* Section Relation hiérarchique */}
            <div className="form-section mb-lg p-sm sm:p-md bg-white dark:bg-gray-800 shadow-sm rounded-md">
              <h3 className="text-lg font-semibold mb-md flex items-center text-gray-700 dark:text-gray-200">
                <PartitionOutlined className="mr-2" /> Relation hiérarchique
              </h3>
              <Form.Item label="Unité parente" name="parent_id">
                <Select placeholder="Aucune" className="w-full">
                  {parentUnits
                    .filter((u) => !selectedUnit || u.id !== selectedUnit.id)
                    .map((parentUnit) => (
                      <Option key={parentUnit.id} value={parentUnit.id}>
                        {parentUnit.name} ({parentUnit.short_name})
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-sm pt-md border-t border-gray-200 dark:border-gray-700">
              <Space>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUnit(null);
                    form.resetFields();
                  }}
                  className="dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {selectedUnit ? "Mettre à jour" : "Créer"}
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default GestionUnites;
