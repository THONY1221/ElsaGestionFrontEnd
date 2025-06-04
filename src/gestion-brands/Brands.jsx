// Brands.jsx
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Space, Alert } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from "@ant-design/icons";
import BrandsService from "./BrandsService";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [form] = Form.useForm();
  const { user } = useAuth();
  const { selectedCompany } = useSelection();
  const isDarkMode = false; // Valeur par défaut, à remplacer si vous avez un hook useTheme

  // Helper function for permission checks
  const hasPermission = (permissionKey) => {
    return user?.permissions?.includes(permissionKey) || false;
  };

  // Charger les données
  const fetchBrands = async () => {
    if (!selectedCompany) {
      setBrands([]);
      return;
    }

    setLoading(true);
    try {
      const response = await BrandsService.getAll(selectedCompany);
      setBrands(response.data);
    } catch (error) {
      message.error("Erreur lors de la récupération des marques");
      console.error("fetchBrands() error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [selectedCompany]);

  // Ouvrir la modal (création ou édition)
  const showModal = (brand = null) => {
    if (!selectedCompany) {
      message.warning("Veuillez sélectionner une entreprise");
      return;
    }

    setEditingBrand(brand);
    form.resetFields();

    if (brand) {
      form.setFieldsValue({
        name: brand.name,
        description: brand.description,
        slug: brand.slug,
      });
    } else {
      form.setFieldsValue({
        name: "",
        description: "",
        slug: "",
      });
    }
    setIsModalVisible(true);
  };

  // Fermer la modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingBrand(null);
  };

  // Génération automatique du slug en fonction du nom
  const handleNameChange = (e) => {
    const newName = e.target.value;
    const newSlug = newName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    form.setFieldsValue({ name: newName, slug: newSlug });
  };

  // Suppression
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette marque ?",
      content: "Cette action pourrait affecter les produits associés.",
      okText: "Oui, Supprimer",
      okType: "danger",
      cancelText: "Non",
      centered: true,
      onOk: async () => {
        try {
          await BrandsService.delete(id);
          message.success("Marque supprimée avec succès");
          fetchBrands();
        } catch (error) {
          if (
            error.response &&
            error.response.status === 409 &&
            error.response.data?.error
          ) {
            message.error(error.response.data.error);
          } else {
            message.error("Erreur lors de la suppression de la marque.");
            console.error(
              "[handleDelete onOk] error:",
              error.response || error
            );
          }
        }
      },
    });
  };

  // Création ou mise à jour
  const handleSubmit = async (values) => {
    if (!selectedCompany) {
      message.error("Aucune entreprise sélectionnée");
      return;
    }

    try {
      const dataWithCompany = {
        ...values,
        company_id: selectedCompany,
      };

      if (editingBrand) {
        await BrandsService.update(editingBrand.id, dataWithCompany);
        message.success("Marque mise à jour avec succès");
      } else {
        await BrandsService.create(dataWithCompany);
        message.success("Marque créée avec succès");
      }
      setIsModalVisible(false);
      fetchBrands();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        message.error(
          error.response.data?.error || "Cette marque existe déjà !"
        );
      } else if (error.response && error.response.status === 400) {
        message.error(error.response.data?.error || "Données invalides");
      } else {
        message.error("Erreur lors de la sauvegarde de la marque");
      }
      console.error("handleSubmit() error:", error);
    }
  };

  // Colonnes du tableau
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
      responsive: ["md"],
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {hasPermission("Gestion Commerciale.Produits.Marques.edit") && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              className="p-0 text-blue-600 hover:text-blue-800"
            >
              Modifier
            </Button>
          )}
          {hasPermission("Gestion Commerciale.Produits.Marques.delete") && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className="p-0"
            >
              Supprimer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Si aucune entreprise n'est sélectionnée
  if (!selectedCompany) {
    return (
      <div
        className={`p-sm md:p-md lg:p-lg min-h-screen ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="mb-lg p-md bg-white dark:bg-gray-800 shadow rounded-lg">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <TagOutlined className="mr-3" /> Gestion des Marques
          </h1>
          <Alert
            message="Aucune entreprise sélectionnée"
            description="Veuillez sélectionner une entreprise dans le menu de droite pour gérer les marques."
            type="warning"
            showIcon
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-sm md:p-md lg:p-lg min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mb-lg p-md bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-sm sm:mb-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <TagOutlined className="mr-3" /> Gestion des Marques
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Administrez les marques de vos produits.
          </p>
        </div>
        {hasPermission("Gestion Commerciale.Produits.Marques.create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="w-full sm:w-auto"
          >
            Ajouter une marque
          </Button>
        )}
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <Table
          dataSource={brands}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className={`w-full min-w-[600px] ${isDarkMode ? "table-dark" : ""}`}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: selectedCompany
              ? "Aucune marque trouvée pour cette entreprise"
              : "Veuillez sélectionner une entreprise",
          }}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center text-gray-800 dark:text-white">
            <TagOutlined className="mr-2" />
            {editingBrand ? "Modifier la Marque" : "Ajouter une Marque"}
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        centered
      >
        <div
          className={`modal-body p-sm sm:p-md ${
            isDarkMode
              ? "bg-gray-700 text-gray-200"
              : "bg-gray-50 text-gray-900"
          } rounded-b-lg`}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Nom de la marque"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le nom de la marque",
                },
              ]}
            >
              <Input
                onChange={handleNameChange}
                placeholder="Ex: SuperMarque"
              />
            </Form.Item>

            <Form.Item name="slug" label="Slug (auto-généré)">
              <Input readOnly placeholder="sera-genere-automatiquement" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={3}
                placeholder="Brève description de la marque (optionnel)"
              />
            </Form.Item>

            <Form.Item className="mt-md pt-md border-t border-gray-200 dark:border-gray-600">
              <Space className="flex justify-end w-full">
                <Button
                  onClick={handleCancel}
                  className={
                    isDarkMode
                      ? "dark:text-white dark:border-gray-500 hover:dark:bg-gray-600"
                      : ""
                  }
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingBrand ? "Mettre à jour" : "Créer"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Brands;
