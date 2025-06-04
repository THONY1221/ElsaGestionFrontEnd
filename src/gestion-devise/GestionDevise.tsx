import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Space,
  Popconfirm,
  Spin,
  Tooltip,
  Row,
  Col,
  Card,
  Radio,
  Empty,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import type { TableProps, TablePaginationConfig } from "antd";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

// --- Interfaces ---

// Define AuthContext type
interface AuthContext {
  hasPermission: (permissionKey: string) => boolean;
  isLoading: boolean;
  user?: any;
}

interface Company {
  id: number;
  name: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  position: "before" | "after";
  company_id: number;
  is_deletable: boolean;
  created_at: string;
  updated_at: string;
  company_name?: string; // Added from backend join
}

interface CurrencyFormData {
  company_id?: number | null;
  name: string;
  code: string;
  symbol: string;
  position: "before" | "after";
}

interface PaginationState extends TablePaginationConfig {
  current: number;
  pageSize: number;
  total: number;
}

interface TableParams {
  pagination?: PaginationState;
  sortField?: string;
  sortOrder?: "ascend" | "descend" | null;
  filters?: Record<string, FilterValue | null>;
  search?: string;
}

// --- Permissions Keys ---
const CURRENCY_PERMISSIONS = {
  VIEW: "Admin.Devises.view",
  CREATE: "Admin.Devises.create",
  EDIT: "Admin.Devises.edit",
  DELETE: "Admin.Devises.delete",
};
// -----------------------

const API_BASE_URL = "/api"; // Adjust if your API prefix is different

const GestionDevise: React.FC = () => {
  const { selectedCompany } = useSelection();
  // Simplified approach - get auth context object
  const auth = useAuth();

  // Create a safe permission check helper with strict type checking to avoid TypeScript errors
  const checkPermission = (permissionKey: string): boolean => {
    // Cast auth to any to bypass TypeScript's strict type checking
    const authAny = auth as any;

    // Safely check if hasPermission exists and is a function
    return !!(
      authAny &&
      typeof authAny.hasPermission === "function" &&
      authAny.hasPermission(permissionKey)
    );
  };

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
  });
  const [tableParams, setTableParams] = useState<TableParams>({});
  const [form] = Form.useForm<CurrencyFormData>();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Screen size detection effect
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Data Fetching ---

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axios.get<{ companies: Company[] }>(
        `${API_BASE_URL}/companies?status=active&limit=1000`
      );
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des entreprises pour le modal.",
        error
      );
      message.error("Erreur lors du chargement des entreprises pour le modal.");
    }
  }, []);

  const fetchCurrencies = useCallback(
    async (params: TableParams = {}) => {
      if (!selectedCompany) {
        setCurrencies([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { current = 1, pageSize = 10 } = params.pagination ?? {};
        const { search = tableParams.search } = params;

        const queryParams = new URLSearchParams({
          page: current.toString(),
          limit: pageSize.toString(),
          companyId: selectedCompany.toString(),
          ...(search ? { search } : {}),
        });

        const response = await axios.get<{
          currencies: Currency[];
          pagination: any;
        }>(`${API_BASE_URL}/currencies?${queryParams.toString()}`);

        setCurrencies(response.data.currencies);
        setPagination((prev) => ({
          ...prev,
          current: response.data.pagination.currentPage,
          pageSize: response.data.pagination.itemsPerPage,
          total: response.data.pagination.totalItems,
        }));
        setTableParams(params);
      } catch (error) {
        console.error("Erreur lors du chargement des devises:", error);
        message.error("Erreur lors du chargement des devises.");
        setCurrencies([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      } finally {
        setLoading(false);
      }
    },
    [selectedCompany, tableParams.search]
  );

  useEffect(() => {
    fetchCompanies();
    if (selectedCompany) {
      fetchCurrencies({ pagination });
    } else {
      setCurrencies([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
    }
  }, [selectedCompany, fetchCompanies, fetchCurrencies]);

  // --- Modal Handling ---

  const showModal = (currency: Currency | null = null) => {
    const requiredPermission = currency
      ? CURRENCY_PERMISSIONS.EDIT
      : CURRENCY_PERMISSIONS.CREATE;

    if (!checkPermission(requiredPermission)) {
      message.warning("Action non autorisée.");
      return;
    }

    if (!selectedCompany && !currency) {
      message.warning("Veuillez d'abord sélectionner une entreprise.");
      return;
    }

    setEditingCurrency(currency);
    if (currency) {
      form.setFieldsValue({
        ...currency,
        company_id: currency.company_id ?? null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        position: "before",
        company_id: selectedCompany,
      });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCurrency(null);
    form.resetFields();
  };

  // --- Form Submission ---

  const handleFormSubmit = async (values: CurrencyFormData) => {
    setModalLoading(true);

    const requiredPermission = editingCurrency
      ? CURRENCY_PERMISSIONS.EDIT
      : CURRENCY_PERMISSIONS.CREATE;
    if (!checkPermission(requiredPermission)) {
      message.error("Action non autorisée.");
      setModalLoading(false);
      return;
    }

    let companyIdToSubmit = values.company_id;

    if (!companyIdToSubmit) {
      message.error("ID de l'entreprise manquant.");
      setModalLoading(false);
      return;
    }

    const payload = {
      ...values,
      code: values.code.toUpperCase(),
      company_id: companyIdToSubmit,
    };

    try {
      if (editingCurrency) {
        if (!editingCurrency.is_deletable) {
          message.error("Cette devise ne peut pas être modifiée.");
          setModalLoading(false);
          return;
        }
        await axios.put(
          `${API_BASE_URL}/currencies/${editingCurrency.id}`,
          payload
        );
        message.success("Devise mise à jour avec succès!");
      } else {
        await axios.post(`${API_BASE_URL}/currencies`, payload);
        message.success("Devise créée avec succès!");
      }
      setIsModalOpen(false);
      setEditingCurrency(null);
      fetchCurrencies({
        pagination: { ...pagination, current: 1 },
        search: tableParams.search,
      });
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        `Erreur lors de ${editingCurrency ? "la mise à jour" : "la création"}.`;
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Actions ---

  const handleDelete = async (id: number, isDeletable: boolean) => {
    // Permission check first
    if (!checkPermission(CURRENCY_PERMISSIONS.DELETE)) {
      message.error("Action non autorisée.");
      return;
    }

    // Then check if item is deletable
    if (!isDeletable) {
      message.warning("Cette devise ne peut pas être supprimée.");
      return;
    }

    if (!selectedCompany) {
      message.error("Erreur: Aucune entreprise sélectionnée.");
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/currencies/${id}`);
      message.success("Devise supprimée avec succès!");
      const newTotal = pagination.total ? pagination.total - 1 : 0;
      const newCurrentPage =
        currencies.length === 1 && pagination.current > 1
          ? pagination.current - 1
          : pagination.current;

      fetchCurrencies({
        pagination: { ...pagination, current: newCurrentPage, total: newTotal },
        search: tableParams.search,
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de la suppression.";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  // --- Table Config ---

  const handleTableChange: TableProps<Currency>["onChange"] = (
    newPagination,
    filters,
    sorter
  ) => {
    if (selectedCompany) {
      const sortInfo = Array.isArray(sorter) ? sorter[0] : sorter;
      fetchCurrencies({
        pagination: newPagination as PaginationState,
        filters,
        sortField: sortInfo?.field as string,
        sortOrder: sortInfo?.order,
        search: tableParams.search,
      });
    } else {
      setCurrencies([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
    }
  };

  // The columns config for the table must be defined after checkPermission is available
  const getColumns = (): TableProps<Currency>["columns"] => [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: true,
      width: 100,
    },
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      sorter: true,
      ellipsis: true,
    },
    {
      title: "Symbole",
      dataIndex: "symbol",
      key: "symbol",
      width: 100,
      align: "center",
    },
    {
      title: "Position Symbole",
      dataIndex: "position",
      key: "position",
      width: 150,
      render: (position: "before" | "after") =>
        position === "before" ? "Avant le montant" : "Après le montant",
      responsive: ["sm"],
    },
    {
      title: "Entreprise",
      dataIndex: "company_name",
      key: "company_name",
      ellipsis: true,
      render: (companyName: string, record: Currency) =>
        companyName || `ID: ${record.company_id}`,
      responsive: ["sm"],
    },
    {
      title: "Modifiable",
      dataIndex: "is_deletable",
      key: "is_deletable",
      width: 120,
      align: "center",
      render: (isDeletable: boolean) => (
        <Tag color={isDeletable ? "success" : "warning"}>
          {isDeletable ? "Oui" : "Non"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record: Currency) => (
        <Space size="small">
          <Tooltip title={record.is_deletable ? "Modifier" : "Non modifiable"}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              size="small"
              disabled={
                !record.is_deletable ||
                !checkPermission(CURRENCY_PERMISSIONS.EDIT)
              }
            />
          </Tooltip>
          <Tooltip
            title={record.is_deletable ? "Supprimer" : "Non supprimable"}
          >
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette devise ?"
              onConfirm={() => handleDelete(record.id, record.is_deletable)}
              okText="Oui"
              cancelText="Non"
              okButtonProps={{ danger: true }}
              disabled={
                !record.is_deletable ||
                !checkPermission(CURRENCY_PERMISSIONS.DELETE)
              }
              icon={<QuestionCircleOutlined style={{ color: "red" }} />}
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={
                  !record.is_deletable ||
                  !checkPermission(CURRENCY_PERMISSIONS.DELETE)
                }
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- Search Handler ---
  const handleSearch = (value: string) => {
    if (selectedCompany) {
      fetchCurrencies({
        pagination: { ...pagination, current: 1 },
        search: value,
      });
    } else {
      message.info("Veuillez sélectionner une entreprise pour rechercher.");
    }
  };

  // --- Render ---

  // Check if auth is loading (safely using any type cast to avoid TypeScript errors)
  if ((auth as any)?.isLoading) {
    return (
      <Card title="Gestion des Devises">
        <Spin tip="Chargement de l'authentification..." />
      </Card>
    );
  }

  // Handle No View Permission
  if (!checkPermission(CURRENCY_PERMISSIONS.VIEW)) {
    return (
      <Card title="Gestion des Devises">
        <Alert
          message="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour voir cette section."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="Gestion des Devises" style={{ margin: "20px" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
        gutter={[16, 16]}
      >
        <Col xs={24} sm={12} md={10} lg={8}>
          <Input.Search
            placeholder="Rechercher par nom, code, symbole..."
            onSearch={handleSearch}
            onChange={(e) => {
              setTableParams((prev) => ({ ...prev, search: e.target.value }));
            }}
            value={tableParams.search}
            enterButton={<SearchOutlined />}
            allowClear
            disabled={!selectedCompany}
          />
        </Col>
        <Col
          xs={24}
          sm={"auto"}
          className="text-left sm:text-right mt-2 sm:mt-0"
        >
          <Space>
            <Tooltip title="Rafraîchir les données">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedCompany) {
                    fetchCurrencies({ pagination, search: tableParams.search });
                  }
                }}
                loading={loading}
                disabled={!selectedCompany || loading}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              disabled={
                !selectedCompany ||
                !checkPermission(CURRENCY_PERMISSIONS.CREATE)
              }
              className="w-full sm:w-auto"
            >
              Nouvelle Devise
            </Button>
          </Space>
        </Col>
      </Row>

      {selectedCompany ? (
        <Spin spinning={loading}>
          <Table
            columns={getColumns()}
            dataSource={currencies}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
            bordered
            size="middle"
          />
        </Spin>
      ) : (
        <Empty description="Veuillez sélectionner une entreprise pour voir les devises associées." />
      )}

      <Modal
        title={editingCurrency ? "Modifier la Devise" : "Créer une Devise"}
        open={isModalOpen}
        onCancel={handleCancel}
        confirmLoading={modalLoading}
        footer={[
          <Button key="back" onClick={handleCancel} disabled={modalLoading}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={modalLoading}
            onClick={() => form.submit()}
            disabled={
              (editingCurrency ? !editingCurrency.is_deletable : false) ||
              modalLoading ||
              (editingCurrency
                ? !checkPermission(CURRENCY_PERMISSIONS.EDIT)
                : !checkPermission(CURRENCY_PERMISSIONS.CREATE))
            }
          >
            {editingCurrency ? "Enregistrer" : "Créer"}
          </Button>,
        ]}
        width={isSmallScreen ? "95%" : 600}
        destroyOnClose
      >
        <Spin spinning={modalLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{ position: "before" }}
          >
            <Form.Item
              name="company_id"
              label="Entreprise"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner une entreprise!",
                },
              ]}
              hidden={!editingCurrency && !!selectedCompany}
            >
              <Select
                placeholder="Sélectionner une entreprise"
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                disabled={true}
                style={editingCurrency ? {} : { display: "none" }}
              >
                {companies.map((company) => (
                  <Select.Option
                    key={company.id}
                    value={company.id}
                    label={company.name}
                  >
                    {company.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {!editingCurrency && selectedCompany && (
              <Form.Item label="Entreprise">
                <Input
                  value={
                    companies.find((c) => c.id === selectedCompany)?.name ||
                    `ID: ${selectedCompany}`
                  }
                  disabled
                />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Nom de la devise"
                  rules={[
                    { required: true, message: "Veuillez entrer le nom!" },
                  ]}
                >
                  <Input
                    placeholder="Ex: Euro"
                    disabled={
                      editingCurrency ? !editingCurrency.is_deletable : false
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="code"
                  label="Code (ISO 4217)"
                  rules={[
                    { required: true, message: "Veuillez entrer le code!" },
                    { len: 3, message: "Le code doit faire 3 caractères." },
                    {
                      pattern: /^[A-Z]+$/,
                      message: "Le code doit être en majuscules.",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ex: EUR"
                    maxLength={3}
                    style={{ textTransform: "uppercase" }}
                    disabled={
                      editingCurrency ? !editingCurrency.is_deletable : false
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="symbol"
                  label="Symbole"
                  rules={[
                    { required: true, message: "Veuillez entrer le symbole!" },
                  ]}
                >
                  <Input
                    placeholder="Ex: €"
                    disabled={
                      editingCurrency ? !editingCurrency.is_deletable : false
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="position"
                  label="Position du Symbole"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez choisir la position!",
                    },
                  ]}
                >
                  <Radio.Group
                    disabled={
                      editingCurrency ? !editingCurrency.is_deletable : false
                    }
                  >
                    <Radio value="before">Avant le montant</Radio>
                    <Radio value="after">Après le montant</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {editingCurrency && !editingCurrency.is_deletable && (
              <p style={{ color: "orange", marginTop: "10px" }}>
                Cette devise est protégée et ne peut pas être modifiée ou
                supprimée.
              </p>
            )}
          </Form>
        </Spin>
      </Modal>
    </Card>
  );
};

export default GestionDevise;
