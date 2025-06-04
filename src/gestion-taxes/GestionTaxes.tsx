import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tag,
  Space,
  InputNumber,
  Popconfirm,
  Spin,
  Tooltip,
  Row,
  Col,
  Card,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { TableProps, TablePaginationConfig } from "antd";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

// --- Interfaces ---

interface Company {
  id: number;
  name: string;
}

interface Tax {
  id: number;
  code: string;
  name: string;
  rate: number;
  description?: string;
  status: "active" | "inactive";
  company_id: number;
  parent_id?: number | null;
  effective_date?: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string; // Added from backend join
  parent_tax_name?: string; // Added from backend join
}

interface TaxFormData {
  code: string;
  name: string;
  rate: number;
  description?: string;
  status: "active" | "inactive";
  company_id?: number | null;
  parent_id?: number | null;
  effective_date?: Dayjs | null;
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

// Define the expected shape of the Auth Context value
interface AuthContextValue {
  isAuthenticated: boolean;
  user: any; // Replace 'any' with a proper User interface if available
  token: string | null;
  isLoading: boolean;
  login: (newToken: string, userData: any) => void; // Adjust types if needed
  logout: () => void;
  hasPermission: (permissionKey: string) => boolean;
  refreshUserPermissions: (force?: boolean) => Promise<void>;
  refreshUserStatus: () => Promise<void>;
}

const API_BASE_URL = "/api"; // Adjust if your API prefix is different

const GestionTaxes: React.FC = () => {
  const { selectedCompany } = useSelection();
  // Explicitly type the value from useAuth
  const auth = useAuth() as AuthContextValue | null;
  // Safely get hasPermission, defaulting to a function returning false if auth or hasPermission is null/undefined
  const hasPermission = auth?.hasPermission ?? (() => false);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [parentTaxes, setParentTaxes] = useState<Tax[]>([]); // For parent tax dropdown
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
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
  const [form] = Form.useForm<TaxFormData>();

  // --- Data Fetching ---

  const fetchCompanies = useCallback(async () => {
    try {
      // Fetch companies for the modal dropdown
      const response = await axios.get<{ companies: Company[] }>(
        `${API_BASE_URL}/companies?status=active&limit=1000`
      );
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error);
      // Non-blocking error for modal
      message.error("Erreur chargement entreprises pour le formulaire.", 2);
    }
  }, []);

  const fetchParentTaxes = useCallback(
    async (companyId: number | null) => {
      // Fetch potential parent taxes ONLY for the selected company
      if (!companyId) {
        setParentTaxes([]);
        return;
      }
      try {
        const response = await axios.get<{ taxes: Tax[] }>(
          `${API_BASE_URL}/taxes?status=active&limit=1000&companyId=${companyId}`
        );
        // Ensure parent tax list excludes the currently editing tax ID if applicable
        const filteredTaxes = response.data.taxes.filter(
          (pt) => pt.id !== editingTax?.id
        );
        setParentTaxes(filteredTaxes || []);
      } catch (error) {
        console.error("Erreur lors du chargement des taxes parentes:", error);
        message.error("Erreur lors du chargement des taxes parentes.");
        setParentTaxes([]);
      }
    },
    [editingTax?.id]
  ); // Re-fetch if editingTax changes

  const fetchTaxes = useCallback(
    async (params: TableParams = {}) => {
      if (!selectedCompany) {
        setTaxes([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
        setLoading(false);
        return; // Don't fetch if no company selected
      }
      setLoading(true);
      try {
        const { current = 1, pageSize = 10 } = params.pagination ?? {};
        const { search = tableParams.search } = params;

        const queryParams = new URLSearchParams({
          page: current.toString(),
          limit: pageSize.toString(),
          companyId: selectedCompany.toString(), // <<< Add companyId filter
          ...(search ? { search } : {}),
          // Add other filters/sorters from params if implemented in backend
        });

        const response = await axios.get<{ taxes: Tax[]; pagination: any }>(
          `${API_BASE_URL}/taxes?${queryParams.toString()}`
        );

        setTaxes(response.data.taxes);
        setPagination((prev) => ({
          ...prev,
          current: response.data.pagination.currentPage,
          pageSize: response.data.pagination.itemsPerPage,
          total: response.data.pagination.totalItems,
        }));
        setTableParams(params);
      } catch (error) {
        console.error("Erreur lors du chargement des taxes:", error);
        message.error("Erreur lors du chargement des taxes.");
        setTaxes([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      } finally {
        setLoading(false);
      }
    },
    [selectedCompany, tableParams.search]
  ); // Add selectedCompany dependency

  useEffect(() => {
    fetchCompanies(); // Fetch companies list for modal
    if (selectedCompany) {
      fetchTaxes({ pagination });
      fetchParentTaxes(selectedCompany); // Fetch parents for the selected company
    } else {
      setTaxes([]);
      setParentTaxes([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
    }
  }, [selectedCompany, fetchCompanies, fetchTaxes, fetchParentTaxes]); // Add selectedCompany and fetchParentTaxes

  // --- Modal Handling ---

  const showModal = (tax: Tax | null = null) => {
    if (!selectedCompany && !tax) {
      message.warning("Veuillez d'abord sélectionner une entreprise.");
      return;
    }
    setEditingTax(tax);
    // Fetch/Refetch parent taxes for the correct company, excluding self if editing
    fetchParentTaxes(tax ? tax.company_id : selectedCompany);

    if (tax) {
      form.setFieldsValue({
        ...tax,
        company_id: tax.company_id ?? null,
        parent_id: tax.parent_id ?? null,
        effective_date: tax.effective_date ? dayjs(tax.effective_date) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "active",
        rate: 0,
        company_id: selectedCompany, // Pre-fill and disable company
      });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingTax(null); // Clear editing state
    form.resetFields();
  };

  // --- Form Submission ---

  const handleFormSubmit = async (values: TaxFormData) => {
    setModalLoading(true);
    let companyIdToSubmit = values.company_id;

    if (!editingTax) {
      if (!selectedCompany) {
        message.error("Erreur: Aucune entreprise sélectionnée globalement.");
        setModalLoading(false);
        return;
      }
      companyIdToSubmit = selectedCompany;
    } else {
      // Ensure company_id from the editing record is used if somehow form value is wrong
      companyIdToSubmit = editingTax.company_id;
    }

    if (!companyIdToSubmit) {
      message.error("ID de l'entreprise manquant pour la soumission.");
      setModalLoading(false);
      return;
    }

    const payload = {
      ...values,
      company_id: companyIdToSubmit,
      effective_date: values.effective_date?.format("YYYY-MM-DD"),
      parent_id: values.parent_id === null ? undefined : values.parent_id,
      description: values.description?.trim() || null,
    };

    try {
      if (editingTax) {
        await axios.put(`${API_BASE_URL}/taxes/${editingTax.id}`, payload);
        message.success("Taxe mise à jour avec succès!");
      } else {
        await axios.post(`${API_BASE_URL}/taxes`, payload);
        message.success("Taxe créée avec succès!");
      }
      setIsModalOpen(false);
      setEditingTax(null);
      fetchTaxes({
        pagination: { ...pagination, current: 1 },
        search: tableParams.search,
      });
      fetchParentTaxes(selectedCompany); // Refresh parent list for the current company
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        `Erreur lors de ${editingTax ? "la mise à jour" : "la création"}.`;
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Actions ---

  const handleDelete = async (id: number) => {
    if (!selectedCompany) {
      message.error("Erreur: Aucune entreprise sélectionnée.");
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/taxes/${id}`);
      message.success("Taxe supprimée avec succès!");
      const newTotal = pagination.total ? pagination.total - 1 : 0;
      const newCurrentPage =
        taxes.length === 1 && pagination.current > 1
          ? pagination.current - 1
          : pagination.current;
      fetchTaxes({
        pagination: { ...pagination, current: newCurrentPage, total: newTotal },
        search: tableParams.search,
      });
      fetchParentTaxes(selectedCompany);
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      const errorMsg =
        error.response?.data?.error || "Erreur lors de la suppression.";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  const handleStatusToggle = async (tax: Tax) => {
    if (!selectedCompany) {
      message.error("Erreur: Aucune entreprise sélectionnée.");
      return;
    }
    setLoading(true);
    const newStatus = tax.status === "active" ? "inactive" : "active";
    try {
      await axios.patch(`${API_BASE_URL}/taxes/${tax.id}/status`, {
        status: newStatus,
      });
      message.success(`Statut de la taxe mis à jour avec succès!`);
      fetchTaxes({ pagination, search: tableParams.search });
      fetchParentTaxes(selectedCompany);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      const errorMsg =
        error.response?.data?.error ||
        "Erreur lors de la mise à jour du statut.";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  // --- Table Config ---

  const handleTableChange: TableProps<Tax>["onChange"] = (
    newPagination,
    filters,
    sorter
  ) => {
    if (selectedCompany) {
      const sortInfo = Array.isArray(sorter) ? sorter[0] : sorter;
      fetchTaxes({
        pagination: newPagination as PaginationState,
        filters: filters,
        sortField: sortInfo?.field as string,
        sortOrder: sortInfo?.order,
        search: tableParams.search,
      });
    } else {
      setTaxes([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
    }
  };

  const columns: TableProps<Tax>["columns"] = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: true,
      width: 120,
    },
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      sorter: true,
      ellipsis: true,
    },
    {
      title: "Taux (%)",
      dataIndex: "rate",
      key: "rate",
      sorter: true,
      width: 100,
      align: "right",
      render: (rate: number) => `${rate}%`,
    },
    {
      title: "Entreprise",
      dataIndex: "company_name",
      key: "company_name",
      ellipsis: true,
      render: (companyName: string, record: Tax) =>
        companyName || `ID: ${record.company_id}`,
    },
    {
      title: "Taxe Parente",
      dataIndex: "parent_tax_name",
      key: "parent_tax_name",
      ellipsis: true,
      render: (parentName: string | undefined) => parentName || "-",
    },
    {
      title: "Date Effet",
      dataIndex: "effective_date",
      key: "effective_date",
      sorter: true,
      width: 120,
      render: (date: string | null) =>
        date ? dayjs(date).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 100,
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      render: (status: "active" | "inactive") => (
        <Tag
          icon={
            status === "active" ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === "active" ? "success" : "error"}
        >
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "center",
      render: (_, record: Tax) => (
        <Space size="small">
          <Tooltip
            title={
              !hasPermission("Admin.Taxes.edit")
                ? "Permissions insuffisantes"
                : "Modifier"
            }
          >
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              size="small"
              disabled={!hasPermission("Admin.Taxes.edit")}
            />
          </Tooltip>
          <Tooltip
            title={
              !hasPermission("Admin.Taxes.edit")
                ? "Permissions insuffisantes"
                : record.status === "active"
                ? "Désactiver"
                : "Activer"
            }
          >
            <Popconfirm
              title={`Êtes-vous sûr de vouloir ${
                record.status === "active" ? "désactiver" : "activer"
              } cette taxe ?`}
              onConfirm={() => handleStatusToggle(record)}
              okText="Oui"
              cancelText="Non"
              disabled={!hasPermission("Admin.Taxes.edit")}
            >
              <Button
                icon={
                  record.status === "active" ? (
                    <CloseCircleOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )
                }
                size="small"
                danger={record.status === "active"}
                disabled={!hasPermission("Admin.Taxes.edit")}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip
            title={
              !hasPermission("Admin.Taxes.delete")
                ? "Permissions insuffisantes"
                : "Supprimer"
            }
          >
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette taxe ? Cette action est irréversible."
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
              okButtonProps={{ danger: true }}
              disabled={!hasPermission("Admin.Taxes.delete")}
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={!hasPermission("Admin.Taxes.delete")}
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
      fetchTaxes({ pagination: { ...pagination, current: 1 }, search: value });
    } else {
      message.info("Veuillez sélectionner une entreprise pour rechercher.");
    }
  };

  // --- Render ---

  return (
    <Card title="Gestion des Taxes" style={{ margin: "20px" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
        gutter={[16, 16]}
      >
        <Col xs={24} sm={12} md={10} lg={8}>
          <Input.Search
            placeholder="Rechercher par code ou nom..."
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
          sm={{ span: 12, offset: 0 }}
          md={{ span: 14, offset: 0 }}
          lg={{ span: 16, offset: 0 }}
          className="text-left sm:text-right mt-2 sm:mt-0"
        >
          <Space>
            <Tooltip title="Rafraîchir les données">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedCompany)
                    fetchTaxes({ pagination, search: tableParams.search });
                }}
                loading={loading}
                disabled={!selectedCompany || loading}
              />
            </Tooltip>
            <Tooltip
              title={
                !hasPermission("Admin.Taxes.create")
                  ? "Permissions insuffisantes"
                  : "Nouvelle Taxe"
              }
            >
              <span
                style={{
                  display:
                    !selectedCompany || !hasPermission("Admin.Taxes.create")
                      ? "inline-block"
                      : "initial",
                  cursor:
                    !selectedCompany || !hasPermission("Admin.Taxes.create")
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showModal()}
                  disabled={
                    !selectedCompany || !hasPermission("Admin.Taxes.create")
                  }
                  style={{
                    pointerEvents:
                      !selectedCompany || !hasPermission("Admin.Taxes.create")
                        ? "none"
                        : "auto",
                  }}
                  className="w-full sm:w-auto"
                >
                  Nouvelle Taxe
                </Button>
              </span>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {selectedCompany ? (
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={taxes}
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
        <Empty description="Veuillez sélectionner une entreprise pour voir les taxes associées." />
      )}

      <Modal
        title={editingTax ? "Modifier la Taxe" : "Créer une Taxe"}
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
              modalLoading ||
              (editingTax
                ? !hasPermission("Admin.Taxes.edit")
                : !hasPermission("Admin.Taxes.create"))
            }
          >
            {editingTax ? "Enregistrer" : "Créer"}
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Spin spinning={modalLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{
              status: "active",
              rate: 0,
            }}
          >
            <Form.Item
              name="company_id"
              label="Entreprise"
              rules={[{ required: true, message: "Champ requis" }]}
              hidden={!editingTax && !!selectedCompany}
            >
              <Select
                placeholder="Sélectionner une entreprise"
                disabled={true}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
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

            {!editingTax && selectedCompany && (
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
                <Form.Item name="parent_id" label="Taxe Parente (Optionnel)">
                  <Select
                    placeholder="Sélectionner une taxe parente"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {parentTaxes.map((ptax) => (
                      <Select.Option
                        key={ptax.id}
                        value={ptax.id}
                        label={`${ptax.code} - ${ptax.name}`}
                      >
                        {`${ptax.code} - ${ptax.name}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="code"
                  label="Code"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez entrer le code de la taxe!",
                    },
                    {
                      max: 50,
                      message: "Le code ne peut pas dépasser 50 caractères.",
                    },
                  ]}
                >
                  <Input placeholder="Ex: TVA20" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="name"
              label="Nom"
              rules={[
                {
                  required: true,
                  message: "Veuillez entrer le nom de la taxe!",
                },
                {
                  max: 255,
                  message: "Le nom ne peut pas dépasser 255 caractères.",
                },
              ]}
            >
              <Input placeholder="Ex: Taxe sur la Valeur Ajoutée 20%" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="rate"
                  label="Taux (%)"
                  rules={[
                    { required: true, message: "Veuillez entrer le taux!" },
                    {
                      type: "number",
                      min: -100,
                      max: 100,
                      message: "Le taux doit être entre -100 et 100",
                    },
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} placeholder="Ex: 20" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="status"
                  label="Statut"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner le statut!",
                    },
                  ]}
                >
                  <Select>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="inactive">Inactive</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="effective_date"
                  label="Date d'effet (Optionnel)"
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description (Optionnel)"
              rules={[
                {
                  max: 500,
                  message:
                    "La description ne peut pas dépasser 500 caractères.",
                },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Informations supplémentaires sur la taxe..."
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </Card>
  );
};

export default GestionTaxes;
