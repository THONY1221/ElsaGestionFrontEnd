import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Tabs,
  Space,
  Checkbox,
  Tag,
  Avatar,
  Popconfirm,
  Typography,
  Descriptions,
  List,
  Row,
  Col,
  Dropdown,
  Menu,
  Spin,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelection } from "../SelectionContext"; // Assuming this context provides selectedCompany and selectedWarehouse
import { useAuth } from "../context/AuthContext"; // Use AuthContext

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;

// --- Helper function to construct absolute image URL ---
const BACKEND_URL = "http://localhost:3000"; // Adjust if your backend URL is different

const getImageUrl = (imagePath) => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http")) return imagePath; // Already absolute

  // Ensure path starts with '/' if it's relative to domain root
  // Assumes backend paths are like '/uploads/profiles/filename.png' or just 'filename.png'
  const path = imagePath.startsWith("/")
    ? imagePath
    : `/uploads/profiles/${imagePath}`;

  return `${BACKEND_URL}${path}`;
};
// --- End Helper ---

// --- Permissions Keys ---
const STAFF_PERMISSIONS = {
  VIEW: "Admin.GestionUtilisateurs.view",
  CREATE: "Admin.GestionUtilisateurs.create",
  EDIT: "Admin.GestionUtilisateurs.edit",
  DELETE: "Admin.GestionUtilisateurs.delete",
  ASSIGN_ROLE: "Admin.GestionUtilisateurs.assign_role", // Added if needed elsewhere
};
// -----------------------

const GestionStaff = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState(""); // Existing state for search
  const [form] = Form.useForm();
  const { selectedCompany } = useSelection(); // Get selected company ID
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { user, hasPermission } = useAuth(); // Get user and hasPermission from AuthContext
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  // Effet pour mettre à jour isSmallScreen lors du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine if the LOGGED IN user is SysAdmin
  const loggedInUserIsSysAdmin = user?.is_superadmin === 1;

  const fetchStaff = useCallback(
    async (
      page = pagination.current,
      pageSize = pagination.pageSize,
      status = activeTabKey,
      search = searchTerm
    ) => {
      if (!selectedCompany) {
        setStaff([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
        return; // Don't fetch if no company selected
      }
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
          user_type: "staff_members", // Always fetch staff members
          companyId: selectedCompany,
          search: search || undefined,
          status: status === "all" ? undefined : status, // 'enabled' or 'disabled'
        };
        const response = await axios.get("/api/users", { params });
        setStaff(response.data.users || []);
        setPagination({
          current: response.data.pagination.currentPage,
          pageSize: response.data.pagination.itemsPerPage,
          total: response.data.pagination.totalItems,
        });
      } catch (error) {
        console.error("Erreur lors de la récupération du personnel:", error);
        message.error(
          "Erreur lors de la récupération des données du personnel."
        );
        setStaff([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      } finally {
        setLoading(false);
      }
    },
    [
      selectedCompany,
      pagination.current,
      pagination.pageSize,
      activeTabKey,
      searchTerm,
    ]
  );

  const fetchRoles = useCallback(async () => {
    if (!selectedCompany) {
      setRoles([]);
      return;
    }
    try {
      const response = await axios.get(`/api/roles`, {
        params: { company_id: selectedCompany },
      });
      const fetchedRoles = response.data.roles || [];
      console.log(
        "[GestionStaff] API response for /api/roles (company:",
        selectedCompany,
        "):",
        response.data
      ); // LOG API RESPONSE
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Erreur lors de la récupération des rôles:", error);
      message.error("Impossible de charger les rôles.");
      setRoles([]);
    }
  }, [selectedCompany]);

  const fetchWarehouses = useCallback(async () => {
    if (!selectedCompany) {
      setWarehouses([]);
      return;
    }
    try {
      const response = await axios.get(`/api/warehouses`, {
        params: { company_id: selectedCompany },
      });
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des magasins:", error);
      message.error("Impossible de charger les magasins.");
      setWarehouses([]);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedCompany) {
      fetchStaff();
    } else {
      setStaff([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
    }
  }, [fetchStaff, selectedCompany]);

  useEffect(() => {
    if (selectedCompany) {
      fetchRoles();
      fetchWarehouses();
    } else {
      setRoles([]);
      setWarehouses([]);
      setEditingUser(null);
      setIsModalVisible(false);
    }
  }, [selectedCompany, fetchRoles, fetchWarehouses]);

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchStaff(
      newPagination.current,
      newPagination.pageSize,
      activeTabKey,
      searchTerm
    );
  };

  const handleTabChange = (key) => {
    setActiveTabKey(key);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchStaff(1, pagination.pageSize, key, searchTerm);
  };

  const handleSearch = (value) => {
    const trimmedValue = value.trim();
    setSearchTerm(trimmedValue);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchStaff(1, pagination.pageSize, activeTabKey, trimmedValue);
  };

  const showModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: "enabled" });
    setIsModalVisible(true);
    if (selectedCompany) {
      fetchRoles();
      fetchWarehouses();
    }
  };

  const handleEdit = async (record) => {
    // Ensure roles and warehouses are fetched *before* setting form values
    // Also check if roles contains SysAdmin if the logged-in user CAN assign it, to ensure data freshness
    const needsFetch =
      selectedCompany &&
      (!roles.length ||
        !warehouses.length ||
        (hasPermission("Admin.GestionUtilisateurs.assign_sysadmin") &&
          !roles.some((r) => r.name === "SysAdmin" && !r.company_id)));

    if (needsFetch) {
      console.log(
        "[GestionStaff handleEdit] Roles/Warehouses need fetch/refresh, fetching..."
      );
      setModalLoading(true); // Show loading indicator early
      try {
        // Fetch roles and warehouses concurrently
        await Promise.all([fetchRoles(), fetchWarehouses()]);
        console.log(
          "[GestionStaff handleEdit] Roles/Warehouses fetch complete after check."
        );
      } catch (fetchError) {
        console.error(
          "[GestionStaff handleEdit] Error fetching roles/warehouses:",
          fetchError
        );
        message.error("Erreur lors du chargement des données nécessaires.");
        setModalLoading(false);
        return; // Stop if essential data failed to load
      }
      // Let the state update and re-render before proceeding further
      // We might need a small delay or useEffect dependency chain in complex cases,
      // but often Promise.all is sufficient if setRoles triggers re-render promptly.
    } else {
      console.log(
        "[GestionStaff handleEdit] Roles/Warehouses already available/fresh."
      );
    }

    setEditingUser(record);
    setIsModalVisible(true);
    setModalLoading(true); // Keep modal loading while fetching user details

    try {
      // Fetch specific user details (existing logic)
      const response = await axios.get(`/api/users/${record.id}`);
      const userData = response.data;

      // Use helper function to get absolute URL for preview
      const absoluteImageUrl = getImageUrl(userData.profile_image);
      const profileImageFileList = absoluteImageUrl
        ? [
            {
              uid: "-1",
              name: userData.profile_image?.split("/")?.pop() || "image.png",
              status: "done",
              url: absoluteImageUrl, // Use absolute URL
              thumbUrl: absoluteImageUrl, // Use absolute URL for thumbnail
            },
          ]
        : [];

      const assignedWarehouseIds = (userData.assigned_warehouses || []).map(
        (wh) => Number(wh.id)
      );

      form.resetFields();
      // Set form values AFTER potentially fetching roles
      form.setFieldsValue({
        ...userData,
        warehouse_ids: assignedWarehouseIds,
        role_id: userData.role_id ? Number(userData.role_id) : null,
        password: "",
        password_confirmation: "",
        profile_image: profileImageFileList,
      });
      console.log("[GestionStaff handleEdit] Form fields set.");
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails pour la modification:",
        error
      );
      message.error("Impossible de charger les détails de l'utilisateur.");
      setIsModalVisible(false); // Close modal on error
      setEditingUser(null);
    } finally {
      setModalLoading(false); // Stop modal loading indicator
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`/api/users/${id}`);
      message.success("Membre du personnel supprimé avec succès !");
      fetchStaff(pagination.current);
    } catch (error) {
      console.error("Erreur lors de la suppression du membre:", error);
      message.error(
        error.response?.data?.error || "Erreur lors de la suppression."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const formData = new FormData();

      // Populate FormData
      Object.keys(values).forEach((key) => {
        const value = values[key];

        if (key === "profile_image") {
          // Handle file upload
          if (value && value.length > 0 && value[0].originFileObj) {
            formData.append(key, value[0].originFileObj);
          }
          // If no new file, don't append (backend keeps old or null)
        } else if (key === "warehouse_ids") {
          // Send warehouse_ids as an array of fields
          if (Array.isArray(value)) {
            value.forEach((id) => formData.append(`warehouse_ids[]`, id));
          }
        } else if (key === "password") {
          // Only append password if it has a value.
          // For create: validation ensures it has a value if required.
          // For update: if empty, it means don't change password.
          if (value) {
            formData.append(key, value);
          }
        } else if (key === "password_confirmation") {
          // Only append confirmation if the main password field has a value
          if (values["password"] && value) {
            formData.append(key, value);
          }
          // Otherwise skip (no need to confirm an empty or unchanged password)
        } else if (value !== undefined && value !== null) {
          // Append other fields
          formData.append(key, value);
        }
      });

      // Add user_type and company_id
      formData.append("user_type", "staff_members");
      if (selectedCompany) {
        formData.append("company_id", selectedCompany);
      } else {
        message.error("Aucune entreprise sélectionnée.");
        setModalLoading(false);
        return;
      }

      if (editingUser) {
        // Update existing user (PUT)
        console.log(
          "Updating user:",
          editingUser.id,
          Object.fromEntries(formData)
        ); // Debug log
        await axios.put(`/api/users/${editingUser.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Membre du personnel mis à jour avec succès !");
      } else {
        // Create new user (POST)
        console.log("Creating user:", Object.fromEntries(formData)); // Debug log
        await axios.post("/api/users", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Membre du personnel ajouté avec succès !");
      }

      setIsModalVisible(false);
      setEditingUser(null);
      fetchStaff(editingUser ? pagination.current : 1);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du membre:", error);
      // Log the detailed error response if available
      if (error.response) {
        console.error("Backend error response:", error.response.data);
      }
      const errorMsg =
        error.response?.data?.error ||
        "Une erreur s'est produite lors de la sauvegarde.";
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const showDetailsModal = async (record) => {
    setDetailsLoading(true);
    setIsDetailsModalVisible(true);
    try {
      const response = await axios.get(`/api/users/${record.id}`);
      setViewingUser(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails de l'utilisateur:",
        error
      );
      message.error("Impossible de charger les détails.");
      setIsDetailsModalVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDetailsModalCancel = () => {
    setIsDetailsModalVisible(false);
    setViewingUser(null);
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space>
          <Avatar
            src={getImageUrl(record.profile_image)}
            icon={!record.profile_image && <UserOutlined />}
          />
          {text}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
      responsive: ["sm"], // Masqué sur xs
    },
    {
      title: "Magasin Principal",
      dataIndex: "assigned_warehouse_name",
      key: "assigned_warehouse_name",
      responsive: ["sm"], // Masqué sur xs
      render: (name) => name || "N/A",
    },
    {
      title: "Rôle",
      dataIndex: "role_name",
      key: "role_name",
      responsive: ["sm"], // Masqué sur xs
      render: (name) => name || "N/A",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "enabled" ? "success" : "error"}>
          {status === "enabled" ? "Activé" : "Désactivé"}
        </Tag>
      ),
      filters: [
        { text: "Activé", value: "enabled" },
        { text: "Désactivé", value: "disabled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (text, record) => {
        const menu = (
          <Menu>
            {hasPermission(STAFF_PERMISSIONS.VIEW) && (
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => showDetailsModal(record)}
              >
                Voir Détails
              </Menu.Item>
            )}
            {hasPermission(STAFF_PERMISSIONS.EDIT) && (
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Modifier
              </Menu.Item>
            )}
            {hasPermission(STAFF_PERMISSIONS.DELETE) && (
              <Menu.Item key="delete" danger icon={<DeleteOutlined />}>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer ce membre ?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Oui"
                  cancelText="Non"
                  placement="left"
                >
                  <span style={{ display: "block", width: "100%" }}>
                    Supprimer
                  </span>
                </Popconfirm>
              </Menu.Item>
            )}
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <h2>Les membres du personnel</h2>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {hasPermission(STAFF_PERMISSIONS.CREATE) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showModal}
              disabled={!selectedCompany}
              className="w-full sm:w-auto"
            >
              Ajouter un nouveau membre du personnel
            </Button>
          )}
          <Button
            icon={<UploadOutlined />}
            disabled
            className="w-full sm:w-auto"
          >
            Importer des membres du personnel
          </Button>
        </div>
        <Input.Search
          placeholder="Rechercher par nom..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => {
            if (e.target.value === "") {
              handleSearch("");
            }
          }}
          className="w-full sm:w-auto sm:max-w-xs"
        />
      </div>

      <Tabs activeKey={activeTabKey} onChange={handleTabChange}>
        <TabPane tab="Tous" key="all" />
        <TabPane tab="Activés" key="enabled" />
        <TabPane tab="Désactivés" key="disabled" />
      </Tabs>

      <Table
        columns={columns}
        dataSource={staff}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={
          editingUser
            ? "Modifier le membre du personnel"
            : "Ajouter un nouveau membre du personnel"
        }
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={modalLoading}
            onClick={handleOk}
          >
            {editingUser ? "Mettre à jour" : "Créer"}
          </Button>,
        ]}
        width={isSmallScreen ? "95%" : 800} // Responsive width
      >
        <Spin spinning={modalLoading} tip="Chargement...">
          <Form
            form={form}
            layout="vertical"
            name="staff_form"
            initialValues={{ warehouse_ids: [] }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="profile_image"
                  label="Image de profil"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  extra="Importer une image (max 5MB). Laissez vide pour conserver l'image actuelle lors de la modification."
                >
                  <Upload
                    name="logo"
                    listType="picture"
                    beforeUpload={() => false}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>Importer</Button>
                  </Upload>
                </Form.Item>
                <Form.Item
                  name="name"
                  label="Nom"
                  rules={[
                    { required: true, message: "Veuillez entrer le nom !" },
                  ]}
                >
                  <Input placeholder="Entrer Nom" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Numéro de téléphone"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez entrer le numéro de téléphone !",
                    },
                  ]}
                >
                  <Input placeholder="Entrer Numéro de téléphone" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Veuillez entrer l'email !" },
                    { type: "email", message: "Format d'email invalide !" },
                  ]}
                >
                  <Input placeholder="Entrer Email" />
                </Form.Item>
                <Form.Item
                  name="status"
                  label="Statut"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner le statut !",
                    },
                  ]}
                >
                  <Select placeholder="Sélectionner Statut">
                    <Option value="enabled">Activé</Option>
                    <Option value="disabled">Désactivé</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="address" label="Adresse">
                  <Input.TextArea rows={3} placeholder="Entrer Adresse" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="warehouse_ids"
                  label="Magasins"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner au moins un magasin !",
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Sélectionner Magasin(s)..."
                    loading={!warehouses.length && selectedCompany}
                    disabled={!selectedCompany || warehouses.length === 0}
                    allowClear
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    optionFilterProp="children"
                  >
                    {warehouses.map((wh) => (
                      <Option key={wh.id} value={Number(wh.id)}>
                        {wh.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="role_id"
                  label="Rôle"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un rôle !",
                    },
                  ]}
                >
                  <Select
                    placeholder="Sélectionner Rôle..."
                    loading={!roles.length && selectedCompany}
                    disabled={!selectedCompany || roles.length === 0}
                    allowClear
                  >
                    {roles.map((role) => {
                      const isThisOptionTheGlobalSysAdminRole =
                        role.name === "SysAdmin" && !role.company_id;

                      // Render condition: Show the option if
                      // 1. It's NOT the global SysAdmin role OR
                      // 2. It IS the global SysAdmin role AND the logged-in user IS a SysAdmin.
                      const shouldRender =
                        !isThisOptionTheGlobalSysAdminRole ||
                        loggedInUserIsSysAdmin;

                      // Optional log for verification
                      console.log(
                        `[GestionStaff Select Map V4] Role: ${role.name}, ID: ${role.id}, isGlobalSysAdminOption: ${isThisOptionTheGlobalSysAdminRole}, loggedInIsSysAdmin: ${loggedInUserIsSysAdmin}, shouldRender: ${shouldRender}`
                      );

                      if (!shouldRender) {
                        return null; // Don't render this option
                      }
                      return (
                        <Option key={role.id} value={Number(role.id)}>
                          {role.name}{" "}
                          {role.company_id ? `(Entreprise)` : `(Global)`}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Mot de Passe"
                  rules={[
                    {
                      required: !editingUser,
                      message: "Veuillez entrer le mot de passe !",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || value.length >= 6) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            "Le mot de passe doit contenir au moins 6 caractères"
                          )
                        );
                      },
                    }),
                  ]}
                  extra={
                    editingUser
                      ? "Laissez vide pour ne pas changer le mot de passe."
                      : ""
                  }
                  hasFeedback
                >
                  <Input.Password
                    placeholder={
                      editingUser
                        ? "Nouveau mot de passe (optionnel)"
                        : "Entrer Mot de Passe"
                    }
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="password_confirmation"
                  label="Confirmer Mot de Passe"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    ({ getFieldValue }) => ({
                      required: !!getFieldValue("password"),
                      message: "Veuillez confirmer le mot de passe !",
                    }),
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            "Les deux mots de passe ne correspondent pas !"
                          )
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder={
                      editingUser
                        ? "Confirmer nouveau mot de passe"
                        : "Confirmer Mot de Passe"
                    }
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title="Détails du membre du personnel"
        visible={isDetailsModalVisible}
        onCancel={handleDetailsModalCancel}
        footer={[
          <Button key="close" onClick={handleDetailsModalCancel}>
            Fermer
          </Button>,
        ]}
        width={isSmallScreen ? "95%" : 600} // Responsive width
      >
        <Spin spinning={detailsLoading} tip="Chargement...">
          {viewingUser ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Image">
                <Avatar
                  size={64}
                  src={viewingUser.profile_image}
                  icon={<UserOutlined />}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Nom">
                {viewingUser.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewingUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">
                {viewingUser.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag
                  color={viewingUser.status === "enabled" ? "success" : "error"}
                >
                  {viewingUser.status === "enabled" ? "Activé" : "Désactivé"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rôle">
                {viewingUser.role_name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Adresse">
                {viewingUser.address || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Magasins Assignés">
                {viewingUser.assigned_warehouses &&
                viewingUser.assigned_warehouses.length > 0 ? (
                  <List
                    size="small"
                    dataSource={viewingUser.assigned_warehouses}
                    renderItem={(item) => (
                      <List.Item>
                        {item.name} (ID: {item.id})
                      </List.Item>
                    )}
                  />
                ) : (
                  "Aucun"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">
                {viewingUser.created_at
                  ? new Date(viewingUser.created_at).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Modifié le">
                {viewingUser.updated_at
                  ? new Date(viewingUser.updated_at).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <p>Impossible de charger les détails.</p>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default GestionStaff;
