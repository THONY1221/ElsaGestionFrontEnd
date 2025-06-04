import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Card,
  Space,
  Spin,
  Typography,
  Alert,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/api/expenses/categories";
const { Text } = Typography;

const PERMISSIONS = {
  VIEW: "Gestion Commerciale.Depenses.Categories.view",
  EDIT: "Gestion Commerciale.Depenses.Categories.edit",
  DELETE: "Gestion Commerciale.Depenses.Categories.delete",
};

const GestionCategoriesDepenses = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const { selectedCompany } = useSelection();
  const { user, hasPermission, isLoading: isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }
    if (hasPermission(PERMISSIONS.VIEW) && selectedCompany) {
      fetchCategories();
    } else {
      setCategories([]);
      setLoading(false);
      if (!selectedCompany) {
        // console.log("[GestionCategoriesDepenses] No company selected, clearing categories.");
      } else if (!hasPermission(PERMISSIONS.VIEW)) {
        // console.log("[GestionCategoriesDepenses] User lacks VIEW permission.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, hasPermission, isLoadingAuth]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { company_id: selectedCompany },
      });
      setCategories(response.data);
    } catch (error) {
      message.error(
        "Erreur lors de la récupération des catégories: " + error.message
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (category = null) => {
    if (!hasPermission(PERMISSIONS.EDIT)) {
      message.warning(
        "Vous n'avez pas la permission de modifier ou ajouter des catégories."
      );
      return;
    }
    setEditingCategory(category);
    form.setFieldsValue(
      category ? { ...category } : { name: "", description: "" }
    );
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleOk = async () => {
    if (!hasPermission(PERMISSIONS.EDIT)) {
      message.error("Action non autorisée.");
      return;
    }
    try {
      const values = await form.validateFields();
      values.company_id = selectedCompany;

      if (editingCategory) {
        await axios.put(`${API_URL}/${editingCategory.id}`, values);
        message.success("Catégorie mise à jour avec succès");
      } else {
        await axios.post(API_URL, values);
        message.success("Catégorie ajoutée avec succès");
      }
      if (hasPermission(PERMISSIONS.VIEW)) {
        fetchCategories();
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
      await axios.delete(`${API_URL}/${id}`);
      message.success("Catégorie supprimée avec succès");
      if (hasPermission(PERMISSIONS.VIEW)) {
        fetchCategories();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 409 &&
        error.response.data?.error
      ) {
        message.error(error.response.data.error);
      } else {
        const errorMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message;
        message.error(`Erreur lors de la suppression: ${errorMsg}`);
      }
      console.error("Delete category error:", error.response || error);
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          {hasPermission(PERMISSIONS.EDIT) && (
            <Button
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              type="primary"
              ghost
            />
          )}
          {hasPermission(PERMISSIONS.DELETE) && (
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette catégorie?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
          {!hasPermission(PERMISSIONS.EDIT) &&
            !hasPermission(PERMISSIONS.DELETE) && <Text disabled>N/A</Text>}
        </Space>
      ),
    },
  ];

  if (isLoadingAuth) {
    return <Spin tip="Chargement de l'authentification..." />;
  }

  if (!hasPermission(PERMISSIONS.VIEW)) {
    return (
      <Card title="Gestion des Catégories de Dépenses">
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
    <Card title="Gestion des Catégories de Dépenses">
      {hasPermission(PERMISSIONS.EDIT) && (
        <Button
          disabled={!selectedCompany}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{ marginBottom: 16 }}
        >
          Ajouter une Catégorie
        </Button>
      )}
      {!selectedCompany && (
        <Text type="warning" style={{ display: "block", marginBottom: 16 }}>
          Veuillez sélectionner une entreprise pour voir ou ajouter des
          catégories.
        </Text>
      )}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </Spin>
      <Modal
        title={
          editingCategory ? "Modifier la Catégorie" : "Ajouter une Catégorie"
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingCategory ? "Mettre à jour" : "Ajouter"}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" name="category_form">
          <Form.Item
            name="name"
            label="Nom de la Catégorie"
            rules={[
              {
                required: true,
                message: "Veuillez saisir le nom de la catégorie!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default GestionCategoriesDepenses;
