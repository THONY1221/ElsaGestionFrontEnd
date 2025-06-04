import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tree,
  Space,
  message,
  Popconfirm,
  Tag,
  Spin,
  Card,
  Alert,
  Dropdown,
  Menu,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  GlobalOutlined,
  BankOutlined,
  InfoCircleOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

const { TabPane } = Tabs;
const { Option } = Select;

// --- NEW: Function to build tree from flat permission keys ---
const buildTreeDataFromKeys = (permissionKeys) => {
  const tree = {};

  permissionKeys.forEach((fullKey) => {
    const parts = fullKey.split(".");
    let currentLevel = tree;

    parts.forEach((part, index) => {
      const isLeaf = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join(".");

      if (!currentLevel[part]) {
        // Try to make title more readable
        const title = part
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        currentLevel[part] = {
          title: title,
          key: currentPath,
          children: isLeaf ? undefined : {},
          isLeaf: isLeaf,
        };
      }

      if (!isLeaf) {
        currentLevel = currentLevel[part].children; // Move to the next level's children object
      }
    });
  });

  // Convert the intermediate tree object structure to Ant Design's required array format
  const convertToAntDFormat = (level) => {
    return Object.values(level).map((node) => {
      if (node.children) {
        node.children = convertToAntDFormat(node.children);
        // Ensure non-leaf nodes are not selectable if they only group permissions
        // node.selectable = false;
      }
      return node;
    });
  };

  return convertToAntDFormat(tree);
};
// --- END NEW FUNCTION ---

// Helper function to get all leaf keys from tree data
const getLeafKeys = (nodes) => {
  let keys = new Set();
  nodes.forEach((node) => {
    if (node.isLeaf) {
      keys.add(node.key);
    } else if (node.children && node.children.length > 0) {
      // Recursively get keys from children
      const childKeys = getLeafKeys(node.children);
      childKeys.forEach((key) => keys.add(key));
    }
  });
  return Array.from(keys); // Return as array
};

// Helper function to get all descendant leaf keys for a given node key from the tree structure
const getAllDescendantLeafKeys = (nodeKey, nodes) => {
  let descendantLeaves = new Set();

  const findNodeAndLeaves = (targetKey, currentNodes) => {
    for (const node of currentNodes) {
      if (node.key === targetKey) {
        // Found the node, now find its leaves recursively
        const collectLeaves = (currentNode) => {
          if (currentNode.isLeaf) {
            descendantLeaves.add(currentNode.key);
          } else if (currentNode.children) {
            currentNode.children.forEach(collectLeaves);
          }
        };
        collectLeaves(node);
        return true; // Node found and processed
      }
      // Recursively search in children if not found at this level
      if (node.children) {
        if (findNodeAndLeaves(targetKey, node.children)) {
          return true; // Node found in children
        }
      }
    }
    return false; // Node not found in this branch
  };

  findNodeAndLeaves(nodeKey, nodes);
  // Return as Array for easier iteration later if needed, although Set is fine too
  return Array.from(descendantLeaves);
};
// --- END NEW HELPER FUNCTION ---

const GestionRolesPermissions = () => {
  const { selectedCompany } = useSelection();
  const { refreshUserPermissions } = useAuth();
  const [roles, setRoles] = useState([]);
  const [fetchedPermissions, setFetchedPermissions] = useState([]); // NEW state for flat list
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleCompanyId, setSelectedRoleCompanyId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [treeData, setTreeData] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [leafPermissionKeys, setLeafPermissionKeys] = useState([]); // Store as array
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Now used for fetching permissions
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- NEW: Fetch all available permissions from backend ---
  useEffect(() => {
    const fetchAllPermissions = async () => {
      setLoadingPermissions(true);
      try {
        // Assuming backend endpoint /api/permissions returns { permissions: ['key1', 'key2', ...] } or similar
        const response = await axios.get("/api/permissions");
        const permissionKeys = response.data.permissions || response.data || []; // Adapt based on actual API response
        if (!Array.isArray(permissionKeys)) {
          console.error("Fetched permissions is not an array:", permissionKeys);
          message.error(
            "Format de données des permissions invalide reçu du serveur."
          );
          setFetchedPermissions([]);
        } else {
          setFetchedPermissions(permissionKeys);
          console.log("Fetched permissions keys:", permissionKeys);
        }
      } catch (error) {
        message.error(
          error.response?.data?.message ||
            "Impossible de charger la liste complète des permissions."
        );
        setFetchedPermissions([]); // Clear on error
      } finally {
        // Keep loadingPermissions true until treeData is also built in the next effect
        // setLoadingPermissions(false); // setLoading will be handled in the next useEffect
      }
    };
    fetchAllPermissions();
  }, []);
  // --- END NEW FETCH ---

  // --- UPDATED: Build tree when fetchedPermissions changes ---
  useEffect(() => {
    if (fetchedPermissions.length > 0) {
      console.log("Building tree from fetched keys:", fetchedPermissions);
      setLoadingPermissions(true); // Show loading while building tree
      try {
        const newTreeData = buildTreeDataFromKeys(fetchedPermissions);
        setTreeData(newTreeData);

        // Automatically expand the top-level keys
        const topLevelKeys = newTreeData.map((node) => node.key);
        setExpandedKeys(topLevelKeys);

        // Get all leaf keys from the newly built tree
        const leaves = getLeafKeys(newTreeData);
        setLeafPermissionKeys(leaves);
        console.log("Built tree data:", newTreeData);
        console.log("Leaf permission keys:", leaves);
      } catch (error) {
        console.error("Error building tree data:", error);
        message.error(
          "Erreur lors de la construction de l'arbre des permissions."
        );
        setTreeData([]);
        setLeafPermissionKeys([]);
      } finally {
        setLoadingPermissions(false); // Tree building finished
      }
    } else {
      // Handle case where fetchedPermissions is empty (e.g., after an error)
      setTreeData([]);
      setLeafPermissionKeys([]);
      setLoadingPermissions(false); // Ensure loading stops if no permissions
    }
  }, [fetchedPermissions]);
  // --- END UPDATED ---

  // Mettre à jour les cases cochées (leaf keys state) lorsque le rôle sélectionné change
  useEffect(() => {
    if (selectedRoleId && rolePermissions[selectedRoleId]) {
      const currentPermissionsData = rolePermissions[selectedRoleId];
      const keysToSet = Array.isArray(currentPermissionsData)
        ? currentPermissionsData
        : Object.keys(currentPermissionsData).filter(
            (key) => currentPermissionsData[key] === true
          );

      const validLeafKeysToSet = keysToSet.filter((key) =>
        leafPermissionKeys.includes(key)
      );

      setCheckedKeys(validLeafKeysToSet);
    } else {
      setCheckedKeys([]);
    }
  }, [selectedRoleId, rolePermissions, leafPermissionKeys]);

  // Charger les rôles quand l'entreprise sélectionnée change
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      setRoles([]);
      setSelectedRoleId(null);
      setRolePermissions({});
      try {
        const params = selectedCompany ? { company_id: selectedCompany } : {};
        const response = await axios.get("/api/roles", { params });
        setRoles(response.data.roles || []);
      } catch (error) {
        message.error(
          error.response?.data?.message || "Impossible de charger les rôles."
        );
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [selectedCompany]);

  // Charger les permissions du rôle sélectionné
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!selectedRoleId) {
        setLoadingPermissions(false);
        return;
      }
      setLoadingPermissions(true);
      try {
        const response = await axios.get(
          `/api/roles/${selectedRoleId}/permissions`
        );
        const fetchedPerms = response.data.permissions || [];
        setRolePermissions((prev) => ({
          ...prev,
          [selectedRoleId]: fetchedPerms,
        }));
      } catch (error) {
        message.error(
          error.response?.data?.message ||
            "Impossible de charger les permissions pour ce rôle."
        );
        setRolePermissions((prev) => ({
          ...prev,
          [selectedRoleId]: [],
        }));
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [selectedRoleId]);

  // --- Fonctions Gestion des Rôles ---

  const showModal = (role = null) => {
    setEditingRole(role);
    form.setFieldsValue({ name: role ? role.name : "" });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    if (savingRole) return; // Empêcher la fermeture pendant la sauvegarde
    setIsModalVisible(false);
    form.resetFields();
    setEditingRole(null);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const roleName = values.name.trim();
      if (!roleName) {
        message.error("Le nom du rôle ne peut pas être vide.");
        return;
      }

      setSavingRole(true);
      const requestData = { name: roleName };
      if (!editingRole && selectedCompany) {
        requestData.company_id = selectedCompany;
      }
      const queryParams = editingRole
        ? { company_id: editingRole.company_id ?? undefined }
        : {};

      if (editingRole) {
        await axios.put(`/api/roles/${editingRole.id}`, requestData, {
          params: queryParams,
        });
        setRoles(
          roles.map((r) =>
            r.id === editingRole.id
              ? { ...r, ...requestData, company_id: editingRole.company_id }
              : r
          )
        );
        message.success(`Rôle "${roleName}" mis à jour.`);
      } else {
        const response = await axios.post("/api/roles", requestData);
        const newRole = response.data;
        setRoles([...roles, newRole]);
        message.success(`Rôle "${roleName}" créé.`);
      }
      handleCancel();
    } catch (errorInfo) {
      if (errorInfo.response) {
        message.error(
          errorInfo.response.data.message ||
            "Erreur lors de la sauvegarde du rôle."
        );
      } else if (errorInfo.name === "AxiosError") {
        message.error("Erreur réseau lors de la sauvegarde du rôle.");
      } else {
        message.error("Veuillez corriger les erreurs du formulaire.");
      }
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    try {
      const params = { company_id: role.company_id ?? undefined };
      await axios.delete(`/api/roles/${role.id}`, { params });

      setRoles(roles.filter((r) => r.id !== role.id));
      const newRolePerms = { ...rolePermissions };
      delete newRolePerms[role.id];
      setRolePermissions(newRolePerms);
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
        setSelectedRoleCompanyId(null);
      }
      message.success(`Rôle "${role.name}" supprimé.`);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Impossible de supprimer le rôle."
      );
    }
  };

  const roleColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      width: 80,
    },
    {
      title: "Nom du Rôle",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterSearch: true,
      onFilter: (value, record) => record.name.includes(value),
    },
    {
      title: "Scope",
      dataIndex: "company_id",
      key: "scope",
      width: 120,
      align: "center",
      render: (company_id) =>
        company_id ? (
          <Tag icon={<BankOutlined />} color="blue">
            Entreprise
          </Tag>
        ) : (
          <Tag icon={<GlobalOutlined />} color="success">
            Global
          </Tag>
        ),
      filters: [
        { text: "Global", value: null },
        { text: "Entreprise", value: true }, // Utiliser true juste pour filtrer ceux qui ont un company_id
      ],
      onFilter: (value, record) =>
        value === null ? !record.company_id : !!record.company_id,
      responsive: ["sm"], // Masqué sur xs
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => {
        const isSysAdmin = record.name === "SysAdmin" && !record.company_id; // Check for global SysAdmin
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              disabled={isSysAdmin} // Disable edit for SysAdmin
            >
              Modifier
            </Menu.Item>
            <Menu.Item
              key="delete"
              danger
              icon={<DeleteOutlined />}
              disabled={isSysAdmin}
            >
              {" "}
              {/* Disable delete for SysAdmin */}
              <Popconfirm
                title={`Supprimer le rôle "${record.name}" ?`}
                description={
                  record.company_id
                    ? "Lié à cette entreprise."
                    : "Ceci est un rôle global."
                }
                onConfirm={() => handleDeleteRole(record)}
                okText="Oui"
                cancelText="Non"
                placement="left"
                disabled={isSysAdmin} // Disable Popconfirm for SysAdmin
              >
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    color: isSysAdmin ? "grey" : "inherit",
                  }}
                >
                  {" "}
                  {/* Optionally grey out text */}
                  Supprimer
                </span>
              </Popconfirm>
            </Menu.Item>
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

  // --- Fonctions Gestion des Permissions ---

  const handleRoleSelect = (value, option) => {
    // Stocker l'ID et le company_id du rôle sélectionné
    setSelectedRoleId(value);
    const selectedRole = roles.find((r) => r.id === value);
    setSelectedRoleCompanyId(selectedRole ? selectedRole.company_id : null);
    // Le chargement des permissions est géré par le useEffect dépendant de selectedRoleId
    // The update of checkedKeys is handled by another useEffect depending on rolePermissions
  };

  // --- MODIFIED onCheck ---
  // When checkStrictly is false, onCheck receives the array of *all* checked keys (leaves and parents)
  // The goal is to update our state `checkedKeys` which *only* stores leaf keys.
  const onCheck = (checkedKeysValue, info) => {
    const currentLeafKeys = new Set(leafPermissionKeys);
    const newCheckedLeafKeys = checkedKeysValue.filter((key) =>
      currentLeafKeys.has(key)
    );

    setCheckedKeys(newCheckedLeafKeys);
  };
  // --- END MODIFIED onCheck ---

  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
  };

  // --- NEW: Calculate Tree State for Display (Checked and Half-Checked) ---
  const treeCheckedState = useMemo(() => {
    const checked = new Set(checkedKeys);
    const halfChecked = new Set();
    const checkedLeafKeysSet = new Set(checkedKeys);

    const determineParentStates = (nodes) => {
      nodes.forEach((node) => {
        if (!node.isLeaf && node.children && node.children.length > 0) {
          determineParentStates(node.children);

          const descendantLeaves = getAllDescendantLeafKeys(node.key, treeData);
          if (descendantLeaves.length > 0) {
            let checkedCount = 0;
            descendantLeaves.forEach((leafKey) => {
              if (checkedLeafKeysSet.has(leafKey)) {
                checkedCount++;
              }
            });

            if (checkedCount === 0) {
              checked.delete(node.key);
            } else if (checkedCount === descendantLeaves.length) {
              checked.add(node.key);
              halfChecked.delete(node.key);
            } else {
              halfChecked.add(node.key);
              checked.delete(node.key);
            }
          }
        }
      });
    };

    determineParentStates(treeData);

    const result = {
      checked: Array.from(checked),
      halfChecked: Array.from(halfChecked),
    };
    return result;
  }, [checkedKeys, treeData]);
  // --- END NEW ---

  // Ajoutons un endpoint pour notifier les changements de permissions
  const notifyPermissionsChanged = async (roleId) => {
    try {
      const response = await axios.post("/api/roles/notify-changes", {
        role_id: roleId,
      });
      console.log("Notification envoyée:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la notification des changements:", error);
      // Ne pas faire échouer le flux principal si la notification échoue
      return { error: true, message: error.message };
    }
  };

  // Modifions la fonction handleSavePermissions pour inclure la notification
  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;

    try {
      setSavingPermissions(true);
      message.loading({
        content: "Enregistrement des permissions...",
        key: "permSave",
      });

      // Filter keys to permissions only (not parent/group nodes)
      const permissionsToSave = checkedKeys.filter((key) =>
        leafPermissionKeys.includes(key)
      );

      const response = await axios.put(
        `/api/roles/${selectedRoleId}/permissions`,
        {
          permissions: permissionsToSave,
        }
      );

      // Forcer le rafraîchissement IMMÉDIATEMENT après la sauvegarde réussie
      console.log(
        "[GestionRolesPermissions] Permissions saved, attempting force refresh BEFORE notification..."
      );
      await refreshUserPermissions(true);

      // Après avoir enregistré les permissions, notifier les utilisateurs concernés
      await notifyPermissionsChanged(selectedRoleId);

      message.success({
        content: "Permissions mises à jour avec succès",
        key: "permSave",
      });

      // Mettre à jour le state local avec les nouvelles permissions
      setRolePermissions((prev) => ({
        ...prev,
        [selectedRoleId]: permissionsToSave,
      }));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des permissions:", error);
      message.error({
        content: "Erreur lors de la sauvegarde des permissions",
        key: "permSave",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-5">
      {" "}
      {/* Responsive padding */}
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
        {" "}
        {/* Responsive title and margin */}
        Gestion des Rôles et Permissions
      </h1>
      <Tabs
        defaultActiveKey="1"
        type="card" /* style={{ marginTop: "20px" }} Removed, margin added to h1 */
      >
        <TabPane tab="Gestion des Rôles" key="1">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Scope Information Alerts */}
            {!selectedCompany && (
              <Alert
                message="Affichage des rôles globaux uniquement."
                description="Aucune entreprise n'est sélectionnée. Vous pouvez voir et gérer les rôles applicables à toutes les entreprises."
                type="info"
                showIcon
                icon={<GlobalOutlined />}
              />
            )}
            {selectedCompany && (
              <Alert
                message="Affichage des rôles globaux et spécifiques à l'entreprise."
                description="Vous voyez les rôles globaux ainsi que ceux créés spécifiquement pour l'entreprise sélectionnée."
                type="success" // Changed type for better distinction
                showIcon
                icon={<BankOutlined />}
              />
            )}

            {/* Roles Table Card */}
            <Card title="Liste des Rôles">
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <Button
                  type="primary"
                  onClick={() => showModal()}
                  disabled={savingRole}
                  className="w-full sm:w-auto" // Responsive width
                >
                  Créer un Rôle{" "}
                  {selectedCompany ? "pour cette Entreprise" : "(Global)"}
                </Button>
                <Table
                  columns={roleColumns}
                  dataSource={roles}
                  rowKey="id"
                  bordered
                  size="middle"
                  loading={loadingRoles}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: "max-content" }} // Ajout du scroll horizontal
                  locale={{
                    filterTitle: "Filtrer",
                    filterConfirm: "OK",
                    filterReset: "Réinitialiser",
                    emptyText: "Aucun rôle trouvé pour le scope actuel",
                  }}
                />
              </Space>
            </Card>
          </Space>

          {/* Role Creation/Edit Modal (remains the same) */}
          <Modal
            title={
              editingRole
                ? `Modifier le Rôle "${editingRole.name}"`
                : selectedCompany
                ? "Créer un Rôle pour l'Entreprise"
                : "Créer un Rôle Global"
            }
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={savingRole}
            okText={editingRole ? "Sauvegarder" : "Créer"}
            cancelText="Annuler"
            destroyOnClose
            maskClosable={!savingRole}
            width={isSmallScreen ? "95%" : 520} // Responsive width
          >
            <Spin spinning={savingRole} tip="Sauvegarde...">
              <Form
                form={form}
                layout="vertical"
                name="role_form"
                initialValues={{ name: "" }}
              >
                <Form.Item
                  name="name"
                  label="Nom du Rôle"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez entrer le nom du rôle!",
                    },
                    {
                      whitespace: true,
                      message: "Le nom ne peut pas être vide!",
                    },
                  ]}
                >
                  <Input placeholder="Ex: Vendeur, Comptable..." />
                </Form.Item>
                {editingRole && (
                  <p style={{ fontStyle: "italic", color: "#888" }}>
                    Scope :{" "}
                    {editingRole.company_id
                      ? `Entreprise (ID: ${editingRole.company_id})`
                      : "Global"}
                  </p>
                )}
              </Form>
            </Spin>
          </Modal>
        </TabPane>

        <TabPane tab="Personnalisation de Rôle" key="2">
          <Spin
            spinning={loadingRoles || loadingPermissions || savingPermissions}
            tip="Chargement..."
          >
            <Card title="Configuration des Permissions">
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                <Select
                  showSearch
                  className="w-full md:w-auto md:min-w-[300px] lg:min-w-[350px]" // Responsive width
                  placeholder="Sélectionner un rôle à personnaliser"
                  onChange={handleRoleSelect}
                  value={selectedRoleId}
                  allowClear
                  onClear={() => {
                    setSelectedRoleId(null);
                    setSelectedRoleCompanyId(null);
                  }}
                  filterOption={(input, option) =>
                    (option?.children?.props?.children?.[1] ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  loading={loadingRoles} // Add loading state to Select
                >
                  {roles.map((role) => (
                    <Option key={role.id} value={role.id}>
                      <Space size="small">
                        {role.company_id ? (
                          <BankOutlined style={{ color: "#1890ff" }} />
                        ) : (
                          <GlobalOutlined style={{ color: "#52c41a" }} />
                        )}
                        {role.name}
                      </Space>
                    </Option>
                  ))}
                </Select>

                {selectedRoleId && (
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <div className="text-center sm:text-right mb-4">
                      {" "}
                      {/* Responsive alignment and margin */}
                      <Button
                        type="primary"
                        onClick={handleSavePermissions}
                        loading={savingPermissions}
                        disabled={
                          roles.find((r) => r.id === selectedRoleId)?.name ===
                          "SysAdmin"
                        } // Disable save for SysAdmin
                        className="w-full xs:w-auto" // Responsive width for button
                      >
                        Sauvegarder les Permissions{" "}
                        {selectedRoleCompanyId
                          ? "pour ce Rôle d'Entreprise"
                          : "pour ce Rôle Global"}
                      </Button>
                    </div>

                    <div
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-4 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-800" // Tailwind classes for styling and responsive padding
                    >
                      {treeData.length > 0 ? (
                        // Check if the selected role is SysAdmin
                        roles.find((r) => r.id === selectedRoleId)?.name ===
                          "SysAdmin" && selectedRoleCompanyId === null ? (
                          <Alert
                            message="Accès Complet"
                            description="Le rôle SysAdmin a accès à toutes les fonctionnalités par défaut. Aucune configuration de permission n'est requise."
                            type="info"
                            showIcon
                          />
                        ) : (
                          // Render the tree if not SysAdmin
                          <Tree
                            checkable
                            checkStrictly={false} // Keep this false for parent/child checking logic
                            onCheck={onCheck}
                            checkedKeys={treeCheckedState} // Use the calculated state for checked/half-checked
                            onExpand={onExpand}
                            expandedKeys={expandedKeys}
                            autoExpandParent={false}
                            treeData={treeData}
                            switcherIcon={<DownOutlined />}
                            blockNode
                          />
                        )
                      ) : (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                          {loadingPermissions
                            ? "Chargement de la structure..."
                            : "Structure non disponible."}
                        </div>
                      )}
                    </div>
                  </Space>
                )}
                {!selectedRoleId && (
                  <Alert
                    message="Sélectionnez un rôle"
                    description="Veuillez sélectionner un rôle dans la liste ci-dessus pour voir et modifier ses permissions."
                    type="info"
                    showIcon
                  />
                )}
              </Space>
            </Card>
          </Spin>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default GestionRolesPermissions;
