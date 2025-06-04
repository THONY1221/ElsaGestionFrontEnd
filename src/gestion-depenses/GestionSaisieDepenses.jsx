import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Card,
  Space,
  Spin,
  Row,
  Col,
  Tooltip,
  Tag,
  Alert,
  Typography,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

const API_URL_EXPENSES = "http://localhost:3000/api/expenses";
const API_URL_CATEGORIES = "http://localhost:3000/api/expenses/categories";
const API_URL_SUPPLIERS = "http://localhost:3000/api/users/suppliers";

// --- Permissions Keys ---
const PERMISSIONS = {
  VIEW: "Gestion Commerciale.Depenses.SaisieDepenses.view",
  CREATE: "Gestion Commerciale.Depenses.SaisieDepenses.create",
  EDIT: "Gestion Commerciale.Depenses.SaisieDepenses.edit",
  DELETE: "Gestion Commerciale.Depenses.SaisieDepenses.delete",
};
// -----------------------

const { Option } = Select;
const { Text } = Typography;

const GestionSaisieDepenses = () => {
  const { selectedCompany, selectedWarehouse } = useSelection();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true); // For table data
  const [loadingDependencies, setLoadingDependencies] = useState(false); // For dropdowns
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({ search: "" });
  const [searchInput, setSearchInput] = useState(""); // Nouvel état pour la saisie dynamique
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [viewingExpense, setViewingExpense] = useState(null);

  const companyId = selectedCompany;
  const { user, hasPermission, isLoading: isLoadingAuth } = useAuth();

  // Fetch Dependencies - dépend de hasPermission et companyId
  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }
    if (
      companyId &&
      (hasPermission(PERMISSIONS.CREATE) || hasPermission(PERMISSIONS.EDIT))
    ) {
      fetchDependencies();
    } else {
      setCategories([]);
      setSuppliers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, hasPermission, isLoadingAuth]);

  // Fetch Expenses - dépend de hasPermission, companyId, selectedWarehouse, etc.
  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }
    if (companyId && selectedWarehouse && hasPermission(PERMISSIONS.VIEW)) {
      fetchExpenses();
    } else {
      setExpenses([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
      setLoading(false); // Ensure table loading is false if not fetching
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.current,
    pagination.pageSize,
    filters,
    companyId,
    selectedWarehouse,
    hasPermission, // Utiliser hasPermission du contexte
    isLoadingAuth, // Utiliser isLoadingAuth du contexte
  ]);

  // --- Recherche dynamique avec debounce ---
  useEffect(() => {
    const handler = setTimeout(() => {
      // Search should only be available if view is allowed
      if (!hasPermission(PERMISSIONS.VIEW)) return;
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, hasPermission]);

  const fetchDependencies = async () => {
    setLoadingDependencies(true); // Set loading for dropdowns
    try {
      const [catRes, supRes] = await Promise.all([
        axios.get(API_URL_CATEGORIES, { params: { companyId } }),
        axios.get(API_URL_SUPPLIERS, { params: { companyId } }),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
    } catch (error) {
      message.error(
        "Erreur lors de la récupération des catégories ou fournisseurs."
      );
      setCategories([]);
      setSuppliers([]);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const fetchExpenses = async () => {
    // Guard clause already handled in useEffect based on permission
    setLoading(true); // Set loading for table
    try {
      const response = await axios.get(API_URL_EXPENSES, {
        params: {
          companyId: companyId,
          warehouseId: selectedWarehouse,
          page: pagination.current,
          limit: pagination.pageSize,
          search: filters.search,
        },
      });
      setExpenses(response.data?.expenses || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.pagination?.totalItems || 0,
      }));
    } catch (error) {
      message.error(
        "Erreur lors de la récupération des dépenses: " + error.message
      );
      setExpenses([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination((prev) => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleSearch = (value) => {
    // Search should only be available if view is allowed
    if (!hasPermission(PERMISSIONS.VIEW)) return;
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const showModal = (expense = null) => {
    const requiredPermission = expense ? PERMISSIONS.EDIT : PERMISSIONS.CREATE;
    if (!hasPermission(requiredPermission)) {
      message.warning(
        `Vous n'avez pas la permission de ${
          expense ? "modifier" : "créer"
        } des dépenses.`
      );
      return;
    }
    if (!selectedWarehouse) {
      message.warning(
        "Veuillez sélectionner un magasin avant d'ajouter ou modifier une dépense."
      );
      return;
    }

    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue({
        ...expense,
        warehouse_id: expense.warehouse_id || selectedWarehouse,
        date: expense.date ? dayjs(expense.date) : null,
        supplier_id: expense.supplier_id || undefined,
      });
    } else {
      form.setFieldsValue({
        expense_category_id: undefined,
        supplier_id: undefined,
        amount: null,
        date: dayjs(),
        bill: "",
        notes: "",
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingExpense(null);
    form.resetFields();
  };

  const handleOk = async () => {
    const requiredPermission = editingExpense
      ? PERMISSIONS.EDIT
      : PERMISSIONS.CREATE;
    if (!hasPermission(requiredPermission)) {
      message.error("Action non autorisée.");
      return;
    }
    if (!selectedWarehouse) {
      message.error("Erreur: Aucun magasin sélectionné.");
      return;
    }

    try {
      const values = await form.validateFields();
      // Utiliser user.id du contexte s'il existe, sinon une valeur par défaut ou gérer l'erreur
      const userIdToSubmit = user?.id || null; // Ou gérer le cas où user.id n'existe pas
      if (!userIdToSubmit) {
        message.error(
          "Erreur: ID utilisateur non trouvé. Veuillez vous reconnecter."
        );
        return;
      }

      const submissionData = {
        ...values,
        company_id: companyId,
        warehouse_id: selectedWarehouse,
        user_id: userIdToSubmit,
        date: values.date ? values.date.toISOString() : null,
        supplier_id: values.supplier_id || null,
      };

      if (editingExpense) {
        await axios.put(
          `${API_URL_EXPENSES}/${editingExpense.id}`,
          submissionData
        );
        message.success("Dépense mise à jour avec succès");
      } else {
        await axios.post(API_URL_EXPENSES, submissionData);
        message.success("Dépense ajoutée avec succès");
      }
      // Refetch only if user has view permission
      if (hasPermission(PERMISSIONS.VIEW)) {
        fetchExpenses();
      }
      handleCancel();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      message.error("Erreur lors de la sauvegarde: " + errorMsg);
      console.error("Form validation/API error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission(PERMISSIONS.DELETE)) {
      message.error("Action non autorisée.");
      return;
    }
    try {
      await axios.delete(`${API_URL_EXPENSES}/${id}`);
      message.success("Dépense supprimée avec succès");
      // Refetch only if user has view permission
      if (hasPermission(PERMISSIONS.VIEW)) {
        fetchExpenses();
      }
    } catch (error) {
      message.error("Erreur lors de la suppression: " + error.message);
    }
  };

  const showDetailsModal = (expense) => {
    setViewingExpense(expense);
    setIsDetailsModalVisible(true);
  };

  const handleCancelDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setViewingExpense(null);
  };

  const formatAmount = (amount) => {
    const number = parseFloat(String(amount || 0));
    // Using French locale ('fr') which typically uses spaces for thousands separator
    // and comma for decimal.
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF", // Currency code for FCFA
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
    // Manually replace the comma decimal separator with a period
    return formatted.replace(",", ".");
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => (text ? dayjs(text).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Magasin",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
    },
    {
      title: "Catégorie",
      dataIndex: "category_name",
      key: "category_name",
    },
    {
      title: "Fournisseur",
      dataIndex: "supplier_name",
      key: "supplier_name",
      render: (text) => text || <Tag>N/A</Tag>,
    },
    {
      title: "Référence Facture",
      dataIndex: "bill",
      key: "bill",
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      render: (text) => formatAmount(text),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Enregistré par",
      dataIndex: "user_name",
      key: "user_name",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir Détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => showDetailsModal(record)}
              type="default"
              size="small"
            />
          </Tooltip>
          {hasPermission(PERMISSIONS.EDIT) && (
            <Tooltip title="Modifier">
              <Button
                icon={<EditOutlined />}
                onClick={() => showModal(record)}
                type="primary"
                ghost
                size="small"
              />
            </Tooltip>
          )}
          {hasPermission(PERMISSIONS.DELETE) && (
            <Tooltip title="Supprimer">
              <Popconfirm
                title="Êtes-vous sûr de vouloir supprimer cette dépense?"
                onConfirm={() => handleDelete(record.id)}
                okText="Oui"
                cancelText="Non"
              >
                <Button icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Render logic based on permissions loading and view permission
  if (isLoadingAuth) {
    return <Spin tip="Chargement de l'authentification..." />;
  }

  if (!hasPermission(PERMISSIONS.VIEW)) {
    return (
      <Card title="Saisie des Dépenses">
        <Alert
          message="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour voir cette section."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  // Main component render if permission is granted
  return (
    <Card
      title={
        <Typography.Title level={3} className="text-center sm:text-left mb-0">
          Saisie des Dépenses
        </Typography.Title>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="w-full sm:w-auto">
          {/* Add Button: Requires CREATE permission */}
          {hasPermission(PERMISSIONS.CREATE) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              disabled={!selectedWarehouse} // Keep warehouse check
              className="w-full sm:w-auto"
              size="middle" // Explicitly set size
            >
              Ajouter une Dépense
            </Button>
          )}
        </div>
        <div className="w-full sm:w-auto sm:flex-1">
          {/* Search: Requires VIEW permission (already checked by main render block) */}
          <Input.Search
            placeholder="Rechercher (Facture, Notes, Catégorie, Fournisseur)"
            allowClear
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
            enterButton={<SearchOutlined />}
            disabled={!selectedWarehouse} // Keep warehouse check
            size="middle" // Explicitly set size
          />
        </div>
      </div>
      {/* Table loading includes data loading state */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          bordered
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Spin>
      {/* Modal: Visibility controlled by state, opening controlled by permission check */}
      <Modal
        title={editingExpense ? "Modifier la Dépense" : "Ajouter une Dépense"}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width="95%" // Responsive width
        style={{ maxWidth: 600, top: 20 }} // Max width and top position
        okText={editingExpense ? "Mettre à jour" : "Ajouter"}
        cancelText="Annuler"
        destroyOnClose
      >
        {/* Modal content doesn't need permission checks if opening is controlled */}
        <Form form={form} layout="vertical" name="expense_form">
          {/* Row 1: Date and Category */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[
                  { required: true, message: "Veuillez choisir la date!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expense_category_id"
                label="Catégorie de Dépense"
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner une catégorie!",
                  },
                ]}
              >
                <Select
                  placeholder="Sélectionner une catégorie"
                  loading={loadingDependencies} // Use dependency loading state
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* Row 2: Amount and Supplier */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="amount"
                label="Montant"
                rules={[
                  { required: true, message: "Veuillez saisir le montant!" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "Le montant doit être positif.",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  precision={2}
                  addonAfter="FCFA"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="supplier_id" label="Fournisseur (Optionnel)">
                <Select
                  placeholder="Sélectionner un fournisseur"
                  allowClear
                  loading={loadingDependencies} // Use dependency loading state
                >
                  {suppliers.map((sup) => (
                    <Option key={sup.id} value={sup.id}>
                      {sup.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* Row 3: Bill Reference and Notes */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="bill" label="Référence Facture (Optionnel)">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="notes" label="Notes (Optionnel)">
                <Input.TextArea rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      {viewingExpense && (
        <Modal
          title="Détails de la Dépense"
          visible={isDetailsModalVisible}
          onCancel={handleCancelDetailsModal}
          footer={[
            <Button key="back" onClick={handleCancelDetailsModal}>
              Fermer
            </Button>,
          ]}
          width={600}
        >
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Date">
              {viewingExpense.date
                ? dayjs(viewingExpense.date).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Magasin">
              {viewingExpense.warehouse_name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Catégorie">
              {viewingExpense.category_name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Fournisseur">
              {viewingExpense.supplier_name || <Tag>N/A</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Référence Facture">
              {viewingExpense.bill || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              {formatAmount(viewingExpense.amount)}
            </Descriptions.Item>
            <Descriptions.Item label="Notes">
              {viewingExpense.notes || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Enregistré par">
              {viewingExpense.user_name || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      )}
    </Card>
  );
};

export default GestionSaisieDepenses;
