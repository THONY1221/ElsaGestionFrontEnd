import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Row,
  Col,
  Upload,
  Space,
  Typography,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  AlignLeftOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  UploadOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const { Option } = Select;
const { Title } = Typography;
// Adaptez cette URL si votre back end tourne sur un autre port :
const API_URL = "http://localhost:3000/api/categories";

const GestionCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterParent, setFilterParent] = useState(null);

  // État pour la liste de fichiers dans l'Upload
  const [fileList, setFileList] = useState([]);

  // État pour la preview (aperçu d'image)
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const [form] = Form.useForm();
  const { user } = useAuth();
  const { selectedCompany } = useSelection();

  // Helper function for permission checks (copied from GestionProduit)
  const hasPermission = (permissionKey) => {
    return user?.permissions?.includes(permissionKey) || false;
  };

  // Charger la liste des catégories avec filter par entreprise
  const fetchCategories = async () => {
    if (!selectedCompany) {
      setCategories([]);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (filterName) params.name = filterName;
      if (filterParent) params.parent_id = filterParent;
      params.company_id = selectedCompany;
      const response = await axios.get(API_URL, { params });
      setCategories(response.data);
    } catch (error) {
      message.error("Erreur lors de la récupération des catégories");
      console.error("fetchCategories() error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filterName, filterParent, selectedCompany]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Ouvrir la modal
  const showModal = (category = null) => {
    setEditingCategory(category);
    form.resetFields();

    if (category) {
      // Édition
      form.setFieldsValue({
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id || null,
        image: category.image,
      });

      // Pré-remplir la liste de fichiers si l'image existe
      if (category.image) {
        setFileList([
          {
            uid: "-1",
            name: category.image.split("/").pop(),
            status: "done",
            url: category.image,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      // Création
      form.setFieldsValue({
        name: "",
        slug: "",
        description: "",
        parent_id: null,
        image: "",
      });
      setFileList([]);
    }

    setIsModalVisible(true);
  };

  // Fermer la modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    setFileList([]);
    setSelectedRowKeys([]); // Clear selection on modal close/submit
  };

  // Génération du slug
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
      title: "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
      content: "Cette action pourrait affecter les produits associés.",
      okText: "Oui, Supprimer",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`);
          message.success("Catégorie supprimée avec succès");
          fetchCategories(); // Recharger la liste
        } catch (error) {
          if (
            error.response &&
            error.response.status === 409 &&
            error.response.data?.error
          ) {
            // Erreur spécifique du backend (ex: catégorie utilisée)
            message.error(error.response.data.error);
          } else {
            // Erreur générique
            message.error("Erreur lors de la suppression de la catégorie.");
            console.error(
              "[handleDelete onOk] error:",
              error.response || error
            );
          }
        }
      },
    });
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.info("Veuillez sélectionner au moins une catégorie à supprimer.");
      return;
    }
    Modal.confirm({
      title: `Êtes-vous sûr de vouloir supprimer ${selectedRowKeys.length} catégorie(s) ?`,
      content:
        "Cette action est irréversible et pourrait affecter les produits associés.",
      okText: "Oui, Supprimer Tout",
      okType: "danger",
      cancelText: "Non",
      onOk: async () => {
        try {
          // Assuming your backend supports a bulk delete endpoint or you'll loop through individual deletes.
          // For now, let's simulate or prepare for individual deletes:
          // We'll need to adjust this if you have a specific bulk delete API endpoint.
          await axios.delete(`${API_URL}/bulk`, {
            data: { ids: selectedRowKeys },
          });
          message.success(
            `${selectedRowKeys.length} catégorie(s) supprimée(s) avec succès`
          );
          fetchCategories(); // Recharger la liste
          setSelectedRowKeys([]); // Clear selection
        } catch (error) {
          message.error("Erreur lors de la suppression des catégories.");
          console.error(
            "[handleBulkDelete onOk] error:",
            error.response || error
          );
        }
      },
    });
  };

  // Création ou mise à jour
  const handleSubmit = async (values) => {
    try {
      const payload = { ...values, company_id: selectedCompany };
      if (editingCategory) {
        // Mise à jour
        await axios.put(`${API_URL}/${editingCategory.id}`, payload);
        message.success("Catégorie mise à jour avec succès");
      } else {
        // Création
        await axios.post(API_URL, payload);
        message.success("Catégorie créée avec succès");
      }
      setIsModalVisible(false);
      fetchCategories();
      setFileList([]);
      setSelectedRowKeys([]); // Clear selection on modal close/submit
    } catch (error) {
      message.error("Erreur lors de la sauvegarde de la catégorie");
      console.error("handleSubmit() error:", error);
    }
  };

  // Upload de l'image (customRequest)
  const handleImageUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(response.data); // Indique à Ant Design que c'est OK
    } catch (error) {
      onError({ error });
    }
  };

  // Gérer l'état de l'upload dans Ant Design
  const handleUploadChange = (info) => {
    setFileList(info.fileList);

    if (info.file.status === "done") {
      // Le serveur a renvoyé filePath
      const { filePath } = info.file.response;
      form.setFieldsValue({ image: filePath });
      message.success("Image uploadée avec succès");
    } else if (info.file.status === "error") {
      message.error("Erreur lors de l'upload de l'image");
    }
  };

  const handlePreview = (imgUrl) => {
    // Si l'URL n'est pas absolue, on préfixe (selon votre config)
    const imageURL = imgUrl.startsWith("http")
      ? imgUrl
      : `http://localhost:3000${imgUrl}`;
    setPreviewImage(imageURL);
    setPreviewVisible(true);
  };

  const handleClearFilters = () => {
    setFilterName("");
    setFilterParent(null);
    // fetchCategories will be called automatically by useEffect
  };

  // Colonnes du tableau
  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      responsive: ["md"],
      ellipsis: true,
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (img) => {
        if (!img) return <span className="text-gray-400 italic">N/A</span>;
        const imageURL = img.startsWith("http")
          ? img
          : `${axios.defaults.baseURL || "http://localhost:3000"}${
              img.startsWith("/") ? "" : "/"
            }${img}`;
        return (
          <div className="flex items-center">
            <img
              src={imageURL}
              alt="cat-img"
              className="w-10 h-10 object-cover mr-2 rounded"
            />
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() => handlePreview(img)}
              className="p-0 h-auto leading-none"
            >
              Aperçu
            </Button>
          </div>
        );
      },
      width: 150,
      responsive: ["sm"],
    },
    {
      title: "Parente",
      dataIndex: "parent_name",
      key: "parent_name",
      render: (text) =>
        text ? text : <span className="text-gray-400 italic">Aucune</span>,
      width: 150,
      responsive: ["lg"],
      sorter: (a, b) =>
        (a.parent_name || "").localeCompare(b.parent_name || ""),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size="small" direction="vertical" className="sm:flex-row">
          {hasPermission("Gestion Commerciale.Produits.Categories.edit") && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              Modifier
            </Button>
          )}
          {hasPermission("Gestion Commerciale.Produits.Categories.delete") && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className="p-0 h-auto"
            >
              Supprimer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Liste déroulante pour la catégorie parente
  const parentCategories = editingCategory
    ? categories.filter((cat) => cat.id !== editingCategory.id)
    : categories;

  return (
    <Card
      title={
        <Space align="center">
          <ApartmentOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          <Title level={4} style={{ marginBottom: 0 }}>
            Gestion des Catégories
          </Title>
        </Space>
      }
      className="m-sm md:m-md shadow-lg rounded-lg"
      bodyStyle={{ background: "#f8f9fa" }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              {selectedCompany &&
                hasPermission(
                  "Gestion Commerciale.Produits.Categories.create"
                ) && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showModal()}
                    size="middle"
                  >
                    Ajouter une Catégorie
                  </Button>
                )}
              {hasPermission(
                "Gestion Commerciale.Produits.Categories.delete"
              ) &&
                selectedRowKeys.length > 0 && (
                  <Button
                    type="dashed"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBulkDelete}
                    disabled={selectedRowKeys.length === 0}
                    size="middle"
                  >
                    Supprimer ({selectedRowKeys.length})
                  </Button>
                )}
            </Space>
          </Col>
        </Row>

        <Card
          bordered={false}
          className="bg-white dark:bg-gray-800 p-0 rounded-lg shadow-sm"
        >
          <Title level={5} style={{ marginBottom: "16px" }}>
            Filtrer les catégories
          </Title>
          <Form layout="vertical">
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="Nom de la catégorie" className="mb-0">
                  <Input
                    placeholder="Rechercher par nom..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    allowClear
                    prefix={<SearchOutlined className="text-gray-400" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="Catégorie parente" className="mb-0">
                  <Select
                    placeholder="Filtrer par parente..."
                    value={filterParent}
                    onChange={(value) => setFilterParent(value)}
                    allowClear
                    style={{ width: "100%" }}
                  >
                    <Option value={null}>Toutes</Option>
                    {categories
                      .filter((cat) => !cat.parent_id)
                      .map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6}>
                <Form.Item className="mb-0">
                  <Button onClick={handleClearFilters} block>
                    Réinitialiser
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <div className="overflow-x-auto">
          <Table
            dataSource={categories}
            columns={columns.map((col) => ({
              ...col,
              ellipsis: col.key === "description",
            }))}
            rowKey="id"
            loading={loading}
            bordered
            rowSelection={rowSelection}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
            scroll={{ x: "max-content" }}
            size="middle"
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} sur ${total} catégories`,
            }}
          />
        </div>
      </Space>

      <Modal
        title={
          <Space align="center">
            <FolderOpenOutlined
              style={{ fontSize: "22px", color: "#1890ff" }}
            />
            <Title level={5} style={{ marginBottom: 0 }}>
              {editingCategory
                ? "Modifier la Catégorie"
                : "Ajouter une Catégorie"}
            </Title>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width="90%"
        style={{ maxWidth: 700, top: 20 }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ paddingTop: "16px" }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Title level={5} style={{ marginBottom: "12px" }}>
                Informations de base
              </Title>
              <Divider style={{ marginTop: 0, marginBottom: "16px" }} />
              <Form.Item
                name="name"
                label="Nom de la catégorie"
                rules={[{ required: true, message: "Veuillez saisir le nom" }]}
              >
                <Input
                  onChange={handleNameChange}
                  placeholder="Ex: Électronique, Livres..."
                  prefix={
                    <FolderOpenOutlined className="site-form-item-icon" />
                  }
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug"
                tooltip="Ceci est généré automatiquement et utilisé dans les URLs."
              >
                <Input
                  readOnly
                  placeholder="sera-genere-automatiquement"
                  prefix={<LinkOutlined className="site-form-item-icon" />}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description (optionnelle)"
                rules={[
                  {
                    max: 255,
                    message: "La description ne peut excéder 255 caractères",
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Brève description de la catégorie..."
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5} style={{ marginBottom: "12px" }}>
                Organisation & Visuel
              </Title>
              <Divider style={{ marginTop: 0, marginBottom: "16px" }} />
              <Form.Item
                name="parent_id"
                label="Catégorie Parente (optionnelle)"
              >
                <Select
                  allowClear
                  placeholder="Choisir une catégorie parente..."
                  prefix={<ApartmentOutlined className="site-form-item-icon" />}
                >
                  {parentCategories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Image de la catégorie"
                tooltip="Une image représentative pour la catégorie."
              >
                <Upload
                  name="file"
                  listType="picture-card"
                  customRequest={handleImageUpload}
                  onChange={handleUploadChange}
                  maxCount={1}
                  accept="image/*"
                  fileList={fileList}
                  onPreview={() =>
                    fileList[0]?.url && handlePreview(fileList[0].url)
                  }
                >
                  {fileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Uploader</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item name="image" style={{ display: "none" }}>
                <Input type="hidden" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Row justify="end">
              <Space>
                <Button onClick={handleCancel}>Annuler</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingCategory
                    ? "Mettre à jour la catégorie"
                    : "Créer la catégorie"}
                </Button>
              </Space>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        title="Aperçu de l'image"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
      >
        <img
          alt="preview"
          style={{ width: "100%", marginTop: "16px" }}
          src={previewImage}
        />
      </Modal>
    </Card>
  );
};

export default GestionCategories;
