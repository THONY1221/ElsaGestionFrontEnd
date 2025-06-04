import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  Divider,
  Table,
  InputNumber,
  Space,
  message,
  Spin,
  Modal,
  Upload,
  Row,
  Col,
  Tag,
  Tabs,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  BarcodeOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  SettingOutlined,
  TagOutlined,
  CopyOutlined,
  PrinterOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProductionUnitById,
  createProductionUnit,
  updateProductionUnit,
  getProducts,
} from "./api";
import { useSelection } from "../SelectionContext";
import axios from "axios";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const API_URL = "http://localhost:3000";

// Styles globaux pour le formulaire
const formStyles = {
  card: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 16px 0",
    padding: "0 0 8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  formSection: {
    padding: "0 0 16px 0",
  },
  actionButton: {
    borderRadius: "4px",
  },
};

// Fonction utilitaire pour formater les nombres
const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value);

const ProductionUnitForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { hasPermission, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [modalVisible, setModalVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState(null);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Extraction du magasin et de l'entreprise sélectionnés depuis le contexte global
  const { selectedCompany, selectedWarehouse } = useSelection();

  // Charger l'unité de production si en mode édition
  useEffect(() => {
    if (isEditing) {
      loadProductionUnit();
    }
    loadProducts();
    fetchCategories();
    fetchUnits();
    fetchWarehouses();
  }, [isEditing, selectedCompany]);

  // Recharger les produits quand l'entrepôt change
  useEffect(() => {
    if (selectedWarehouse && !isEditing) {
      loadProducts();
    }
  }, [selectedWarehouse]);

  // Recharger les produits quand l'entreprise change
  useEffect(() => {
    if (selectedCompany) {
      // Recharger également les produits car l'entreprise peut affecter l'entrepôt sélectionné
      if (selectedWarehouse) {
        loadProducts();
      }
    }
  }, [selectedCompany]);

  // UseEffect pour récupérer les prix manquants après le chargement des matières premières
  useEffect(() => {
    if (isEditing && materials.length > 0 && selectedWarehouse) {
      console.log("Matières premières chargées, vérification des prix...");
      const materialsWithoutPrices = materials.filter(
        (material) => !material.purchase_price || material.purchase_price === 0
      );

      if (materialsWithoutPrices.length > 0) {
        console.log("Prix manquants détectés, récupération en cours...");
        updateMissingPrices(materials);
      }
    }
  }, [materials.length, isEditing, selectedWarehouse]);

  // Charger l'unité de production
  const loadProductionUnit = async () => {
    setLoading(true);
    try {
      const data = await getProductionUnitById(id);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        company_id: data.company_id,
        status: data.status === "active", // Convertir le statut textuel en booléen
        warehouse: data.warehouse_id,
        category_id: data.category_id,
        slug: data.slug,
        barcode_symbology: data.barcode_symbology || "CODE128",
        item_code: data.item_code,
        stock_quantitiy_alert: data.stock_quantitiy_alert,
        unit_id: data.unit_id,
        output_quantity:
          data.outputs && data.outputs.length > 0
            ? data.outputs[0].quantity
            : 0,
        sales_price: data.sales_price,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      // Si des produits de sortie existent, récupérer la quantité du premier
      // (généralement l'auto-référence à l'unité de production elle-même)
      if (data.outputs && data.outputs.length > 0) {
        // Utiliser la quantité du premier output comme quantité de sortie
        form.setFieldsValue({
          output_quantity: data.outputs[0].quantity,
        });
      }

      if (data.item_code) {
        setBarcodeGenerated(true);
        setCurrentBarcode(data.item_code);
      }

      // Configurer l'image si elle existe
      if (data.image) {
        // Créer un objet fileList compatible avec le composant Upload
        form.setFieldsValue({
          image: [
            {
              uid: "-1",
              name: data.image,
              status: "done",
              url: `${API_URL}/uploads/image_produits/${data.image}`,
            },
          ],
        });
      }

      // Configurer les matières premières et les produits finis
      const initialMaterials = data.materials.map((item) => ({
        key: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        purchase_price: item.purchase_price || 0, // Utiliser 0 par défaut si non disponible
        unit_short_name: item.unit_short_name,
      }));

      setMaterials(initialMaterials);

      setOutputs(
        data.outputs.map((item) => ({
          key: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
        }))
      );

      // Charger les produits utilisés dans cette unité pour les rendre disponibles dans les Select
      const usedProductIds = [];

      // Ajouter les IDs des matières premières
      if (data.materials && data.materials.length > 0) {
        data.materials.forEach((material) => {
          if (
            material.product_id &&
            !usedProductIds.includes(material.product_id)
          ) {
            usedProductIds.push(material.product_id);
          }
        });
      }

      // Ajouter les IDs des produits finis (sauf si c'est une auto-référence)
      if (data.outputs && data.outputs.length > 0) {
        data.outputs.forEach((output) => {
          if (
            output.product_id &&
            output.product_id !== parseInt(id) &&
            !usedProductIds.includes(output.product_id)
          ) {
            usedProductIds.push(output.product_id);
          }
        });
      }

      // Charger les détails de ces produits si nécessaire
      if (usedProductIds.length > 0) {
        try {
          const response = await axios.get(`${API_URL}/api/produits/by-ids`, {
            params: {
              ids: usedProductIds.join(","),
              warehouse_id: selectedWarehouse,
            },
          });

          if (response.data && response.data.products) {
            // Ajouter ces produits à la liste existante (éviter les doublons)
            const existingProductIds = products.map((p) => p.id);
            const newProducts = response.data.products.filter(
              (p) => !existingProductIds.includes(p.id)
            );
            setProducts((prevProducts) => [...prevProducts, ...newProducts]);

            // Mettre à jour les matières premières avec les prix récupérés depuis l'API
            const updatedMaterials = initialMaterials.map((material) => {
              const productData = response.data.products.find(
                (p) => p.id === material.product_id
              );
              if (
                productData &&
                productData.purchase_price &&
                !material.purchase_price
              ) {
                return {
                  ...material,
                  purchase_price: productData.purchase_price,
                  unit_short_name:
                    productData.unit_short_name || material.unit_short_name,
                };
              }
              return material;
            });

            // Si des prix ont été mis à jour, mettre à jour le state
            const hasUpdatedPrices = updatedMaterials.some(
              (mat, index) =>
                mat.purchase_price !== initialMaterials[index].purchase_price
            );

            if (hasUpdatedPrices) {
              console.log(
                "Mise à jour des prix des matières premières:",
                updatedMaterials
              );
              setMaterials(updatedMaterials);
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des produits utilisés:",
            error
          );
          // Continuer même si cette étape échoue
        }
      }

      // Récupérer les prix manquants pour les matières premières
      setTimeout(() => {
        updateMissingPrices(initialMaterials);
      }, 1000);
    } catch (error) {
      message.error("Erreur lors du chargement de l'unité de production");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits pour les sélecteurs
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      // Charger les matières premières avec leurs détails de prix
      const data = await getProducts("", selectedWarehouse, "raw");
      console.log("Produits chargés:", data.products); // Debug log

      // Vérifier si les produits ont des prix d'achat
      const productsWithPrices = data.products.filter((p) => p.purchase_price);
      const productsWithoutPrices = data.products.filter(
        (p) => !p.purchase_price
      );

      if (productsWithoutPrices.length > 0) {
        console.warn(
          `${productsWithoutPrices.length} produit(s) sans prix d'achat détecté(s):`,
          productsWithoutPrices.map((p) => p.name)
        );
      }

      setProducts(data.products);
    } catch (error) {
      message.error("Erreur lors du chargement des produits");
      console.error("Erreur loadProducts:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Rechercher des produits
  const handleProductSearch = async (value, productType = "raw") => {
    if (value.length > 2) {
      setLoadingProducts(true);
      try {
        // Spécifier le type de produit à rechercher (par défaut "raw" pour les matières premières)
        const data = await getProducts(value, selectedWarehouse, productType);
        setProducts(data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  // Récupération des catégories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`, {
        params: { company_id: selectedCompany },
      });
      if (response.data) setCategories(response.data);
    } catch (error) {
      message.error("Erreur lors du chargement des catégories");
      console.error("[fetchCategories] Erreur :", error);
    }
  };

  // Récupération des unités
  const fetchUnits = async () => {
    try {
      if (!selectedCompany) {
        // Si aucune entreprise n'est sélectionnée, vider la liste des unités
        setUnits([]);
        return;
      }

      const response = await axios.get(`${API_URL}/api/units`, {
        params: { company_id: selectedCompany },
      });
      if (response.data && response.data.units) {
        setUnits(response.data.units);
      } else {
        setUnits([]);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des unités");
      console.error("[fetchUnits] Erreur :", error);
      setUnits([]);
    }
  };

  // Récupération des entrepôts
  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/warehouses`, {
        params: { company_id: selectedCompany },
      });
      if (response.data && response.data.warehouses) {
        setWarehouses(response.data.warehouses);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des entrepôts");
      console.error("[fetchWarehouses] Erreur :", error);
    }
  };

  // Fonction pour afficher les métadonnées de création et modification
  const renderTimestamps = () => {
    if (!isEditing) return null;

    // Récupérer les dates depuis l'API
    const createdAt = form.getFieldValue("created_at");
    const updatedAt = form.getFieldValue("updated_at");

    if (!createdAt && !updatedAt) return null;

    return (
      <Card style={{ ...formStyles.card, marginTop: 16 }}>
        <Row gutter={16}>
          {createdAt && (
            <Col span={12}>
              <Text type="secondary">Créé le:</Text>
              <div>
                <Text strong>{new Date(createdAt).toLocaleString()}</Text>
              </div>
            </Col>
          )}
          {updatedAt && (
            <Col span={12}>
              <Text type="secondary">Dernière modification:</Text>
              <div>
                <Text strong>{new Date(updatedAt).toLocaleString()}</Text>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    );
  };

  // Génération du slug
  const generateSlug = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Génération du code article
  const generateArticleCode = (name) => {
    const cleanName = name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "");
    const prefix = cleanName.slice(0, 3);
    const timestamp = Date.now().toString().slice(-5);
    return `${prefix}${timestamp}`;
  };

  // Génération du code-barres
  const generateBarcode = async () => {
    try {
      const type = form.getFieldValue("barcode_symbology");
      if (!type) {
        message.error("Veuillez d'abord sélectionner un type de code-barres");
        return;
      }
      const response = await axios.get(
        `${API_URL}/api/produits/generate-barcode`,
        {
          params: { type },
        }
      );
      if (response.data.success) {
        const newBarcode = response.data.barcode;
        form.setFieldsValue({ item_code: newBarcode });
        setCurrentBarcode(newBarcode);
        setBarcodeGenerated(true);
        message.success("Code-barres généré avec succès");
      }
    } catch (error) {
      message.error("Erreur lors de la génération du code-barres");
      console.error("[generateBarcode] Erreur :", error);
    }
  };

  // Affichage du code-barres
  const showBarcode = () => {
    const currentBarcodeValue = form.getFieldValue("item_code");
    if (currentBarcodeValue) {
      setCurrentBarcode(currentBarcodeValue);
      setBarcodeModalVisible(true);
    } else {
      message.error("Aucun code-barres disponible");
    }
  };

  // Ajouter une matière première
  const addMaterial = () => {
    const newMaterial = {
      key: Date.now(),
      product_id: undefined,
      quantity: 1,
    };
    setMaterials([...materials, newMaterial]);
  };

  // Supprimer une matière première
  const removeMaterial = (key) => {
    setMaterials(materials.filter((item) => item.key !== key));
  };

  // Mettre à jour une matière première
  const updateMaterial = (key, field, value) => {
    setMaterials(
      materials.map((item) => {
        if (item.key === key) {
          if (field === "product_id") {
            const product = products.find((p) => p.id === value);
            if (product) {
              const updatedItem = {
                ...item,
                [field]: value,
                product_name: product.name || "",
                purchase_price: product.purchase_price || 0,
                unit_short_name: product.unit_short_name || "",
              };

              // Si le purchase_price n'est pas disponible dans la liste products,
              // essayer de le récupérer via l'API
              if (!product.purchase_price && selectedWarehouse) {
                fetchProductPriceDetails(value, key);
              }

              return updatedItem;
            } else {
              // Si le produit n'est pas trouvé dans la liste, essayer de le récupérer
              if (selectedWarehouse) {
                fetchProductPriceDetails(value, key);
              }
              return {
                ...item,
                [field]: value,
                product_name: "",
                purchase_price: 0,
                unit_short_name: "",
              };
            }
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Fonction pour récupérer les détails de prix d'un produit spécifique
  const fetchProductPriceDetails = async (productId, materialKey) => {
    try {
      const response = await axios.get(`${API_URL}/api/produits/${productId}`, {
        params: {
          warehouse_id: selectedWarehouse,
          with_stock: true,
        },
      });

      if (response.data) {
        const productData = response.data;
        // Mettre à jour la matière première avec les détails récupérés
        setMaterials((prevMaterials) =>
          prevMaterials.map((item) => {
            if (item.key === materialKey) {
              return {
                ...item,
                product_name: productData.name || item.product_name,
                purchase_price: productData.purchase_price || 0,
                unit_short_name:
                  productData.unit_short_name || item.unit_short_name,
              };
            }
            return item;
          })
        );

        // Également mettre à jour la liste des produits pour éviter de refaire l'appel
        setProducts((prevProducts) => {
          const existingIndex = prevProducts.findIndex(
            (p) => p.id === productId
          );
          if (existingIndex >= 0) {
            const updatedProducts = [...prevProducts];
            updatedProducts[existingIndex] = {
              ...updatedProducts[existingIndex],
              purchase_price: productData.purchase_price,
              unit_short_name: productData.unit_short_name,
            };
            return updatedProducts;
          }
          return prevProducts;
        });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails du produit:",
        error
      );
      // Ne pas afficher d'erreur à l'utilisateur pour ne pas le perturber
    }
  };

  // Ajouter un produit fini
  const addOutput = () => {
    const newOutput = {
      key: Date.now(),
      product_id: undefined,
      quantity: 1,
    };
    setOutputs([...outputs, newOutput]);
  };

  // Supprimer un produit fini
  const removeOutput = (key) => {
    setOutputs(outputs.filter((item) => item.key !== key));
  };

  // Mettre à jour un produit fini
  const updateOutput = (key, field, value) => {
    setOutputs(
      outputs.map((item) => {
        if (item.key === key) {
          if (field === "product_id") {
            const product = products.find((p) => p.id === value);
            return {
              ...item,
              [field]: value,
              product_name: product ? product.name : "",
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Fermer le modal
  const handleModalClose = () => {
    setModalVisible(false);
    navigate("/production/units");
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (values) => {
    setSubmitting(true);

    const requiredPermission = isEditing
      ? "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
      : "Gestion Commerciale.Approvisionnement.Production.Unites.create";

    if (!hasPermission(requiredPermission)) {
      message.error(
        `Vous n'avez pas la permission de ${
          isEditing ? "modifier" : "créer"
        } des unités.`
      );
      setSubmitting(false);
      return;
    }

    try {
      // 1. Vérifier tous les champs obligatoires sont présents
      if (!values.name) {
        message.error("Veuillez remplir le champ 'Nom de l'unité'");
        setSubmitting(false);
        return;
      }
      if (!values.category_id) {
        message.error("Veuillez sélectionner une 'Catégorie'");
        setSubmitting(false);
        return;
      }
      if (!values.unit_id) {
        message.error("Veuillez sélectionner une 'Unité de mesure (Stock)'");
        setSubmitting(false);
        return;
      }
      if (!values.warehouse) {
        message.error("Veuillez sélectionner un 'Entrepôt'");
        setSubmitting(false);
        return;
      }

      // 2. Vérifier qu'un entrepôt valide est sélectionné
      const selectedWarehouseData = warehouses.find(
        (w) => w.id === Number(values.warehouse)
      );

      if (!selectedWarehouseData) {
        message.error("Entrepôt non valide");
        setSubmitting(false);
        return;
      }

      // 3. Vérifier les matières premières
      if (
        !materials ||
        materials.length === 0 ||
        materials.some((m) => !m.product_id)
      ) {
        message.error("Veuillez ajouter au moins une matière première valide");
        setActiveTab("2"); // Aller à l'onglet des matières premières
        setSubmitting(false);
        return;
      }

      // 4. Préparer les données, à la fois pour FormData et pour un envoi JSON standard
      const formData = new FormData();
      const jsonData = {
        product_type: "production", // Spécifier explicitement le type
      };

      // Ajout des données de base
      formData.append("name", values.name);
      jsonData.name = values.name;

      formData.append("description", values.description || "");
      jsonData.description = values.description || "";

      // Conversion explicite des valeurs pour le statut (utiliser 'active' ou 'inactive' au lieu de 1 ou 0)
      const statusValue = values.status ? "active" : "inactive";
      formData.append("status", statusValue);
      jsonData.status = statusValue;

      formData.append("company_id", selectedWarehouseData.company_id);
      jsonData.company_id = selectedWarehouseData.company_id;

      formData.append("warehouse_id", values.warehouse);
      jsonData.warehouse_id = parseInt(values.warehouse, 10);

      formData.append("category_id", values.category_id);
      jsonData.category_id = parseInt(values.category_id, 10);

      formData.append("slug", values.slug);
      jsonData.slug = values.slug;

      // Handle potentially undefined barcode_symbology
      const barcodeSymbologyValue = values.barcode_symbology || null;
      formData.append("barcode_symbology", barcodeSymbologyValue);
      jsonData.barcode_symbology = barcodeSymbologyValue;

      // Handle potentially undefined item_code
      const itemCodeValue = values.item_code || null;
      formData.append("item_code", itemCodeValue);
      jsonData.item_code = itemCodeValue;

      formData.append("unit_id", values.unit_id);
      jsonData.unit_id = parseInt(values.unit_id, 10);

      const stockAlertValue = parseInt(values.stock_quantitiy_alert || 0, 10);
      formData.append("stock_quantitiy_alert", stockAlertValue);
      jsonData.stock_quantitiy_alert = stockAlertValue;

      const salesPriceValue = parseFloat(values.sales_price || 0);
      formData.append("sales_price", salesPriceValue);
      jsonData.sales_price = salesPriceValue;

      // S'assurer que output_quantity est un nombre
      const outputQuantity = parseFloat(values.output_quantity) || 1;
      formData.append("output_quantity", outputQuantity);
      jsonData.output_quantity = outputQuantity;

      formData.append("product_type", "production");

      // Add user_id
      const userIdValue = user && user.id ? user.id : null;
      formData.append("user_id", userIdValue);
      jsonData.user_id = userIdValue;

      // Ajout de l'image si fournie
      if (values.image && values.image[0] && values.image[0].originFileObj) {
        formData.append("image", values.image[0].originFileObj);
      }

      // Ajout des matières premières - s'assurer qu'ils ont tous un product_id
      const materialsJson = materials
        .filter((item) => item.product_id) // Filtrer les éléments sans product_id
        .map(({ product_id, quantity }) => ({
          product_id: parseInt(product_id, 10),
          quantity: parseFloat(quantity) || 1,
        }));

      // Vérifier qu'il y a des matières premières valides
      if (materialsJson.length === 0) {
        message.error("Veuillez ajouter au moins une matière première valide");
        setActiveTab("2");
        setSubmitting(false);
        return;
      }

      const materialsJsonString = JSON.stringify(materialsJson);
      formData.append("materials", materialsJsonString);
      jsonData.materials = materialsJson;

      // Considérer l'unité de production elle-même comme le produit de sortie
      let outputsJson = [];

      if (isEditing && id) {
        // En mode édition, utiliser l'ID existant comme produit de sortie
        outputsJson = [
          {
            product_id: parseInt(id, 10), // L'ID de l'unité de production elle-même
            quantity: outputQuantity, // Utiliser la valeur convertie
          },
        ];
      } else {
        // En mode création, utiliser la valeur spéciale "self_reference"
        outputsJson = [
          {
            product_id: "self_reference", // Valeur spéciale
            quantity: outputQuantity, // Utiliser la valeur convertie
          },
        ];
      }

      const outputsJsonString = JSON.stringify(outputsJson);
      formData.append("outputs", outputsJsonString);
      jsonData.outputs = outputsJson;

      // Afficher les données pour le débogage
      console.log("Données JSON à envoyer:", jsonData);
      console.log("Materials JSON:", materialsJsonString);
      console.log("Outputs JSON:", outputsJsonString);

      let response;
      if (isEditing) {
        // En cas de mise à jour, utiliser FormData (avec l'image)
        response = await updateProductionUnit(id, formData);
        message.success("Unité de production mise à jour avec succès");
        navigate("/production/units");
      } else {
        try {
          // En cas de création, essayer d'abord avec FormData (pour l'image)
          response = await createProductionUnit(formData);
          message.success("Unité de production créée avec succès");
          navigate("/production/units");
        } catch (formDataError) {
          console.error("Erreur lors de l'envoi avec FormData:", formDataError);

          // Tenter d'extraire le message d'erreur spécifique
          if (formDataError.error) {
            message.error(formDataError.error);
          } else if (formDataError.details) {
            message.error(formDataError.details);
          } else {
            // Si ça échoue, essayer avec JSON standard (sans l'image)
            try {
              response = await axios.post(
                `${API_URL}/api/production/units`,
                jsonData,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
              message.success(
                "Unité de production créée avec succès (sans image)"
              );
              navigate("/production/units");
            } catch (jsonError) {
              console.error("Erreur détaillée:", jsonError);
              const errorMessage =
                jsonError.response?.data?.error ||
                jsonError.response?.data?.details ||
                "Erreur lors de l'enregistrement";
              message.error(errorMessage);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      const errorMessage =
        error.error ||
        error.details ||
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Erreur lors de l'enregistrement de l'unité de production";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour récupérer les détails d'une unité
  const fetchUnitDetails = async (unitId) => {
    try {
      const unit = units.find((u) => u.id === unitId);
      return unit ? unit.short_name : "unité";
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de l'unité:",
        error
      );
      return "unité";
    }
  };

  // Fonction pour mettre à jour l'affichage des unités dans le tableau lors du changement d'unité
  const handleUnitChange = (unitId) => {
    // Mettre à jour les matières premières existantes avec la nouvelle unité par défaut
    if (materials.length > 0) {
      const unit = units.find((u) => u.id === unitId);
      const defaultUnitName = unit ? unit.short_name : "unité";

      setMaterials((prevMaterials) =>
        prevMaterials.map((material) => ({
          ...material,
          // Mettre à jour seulement si l'unité n'est pas déjà définie pour ce matériau spécifique
          unit_short_name: material.unit_short_name || defaultUnitName,
        }))
      );
    }
  };

  // Définition des colonnes de la table des matières premières
  const materialColumns = [
    {
      title: "Matière première",
      dataIndex: "product_id",
      key: "product_id",
      render: (_, record) => (
        <Select
          value={record.product_id}
          onChange={(value) => updateMaterial(record.key, "product_id", value)}
          style={{ width: "100%", minWidth: 180 }}
          placeholder="Sélectionner une matière première"
          showSearch
          filterOption={false}
          onSearch={(value) => handleProductSearch(value, "raw")}
          loading={loadingProducts}
          notFoundContent={loadingProducts ? <Spin size="small" /> : null}
          dropdownStyle={{ minWidth: "300px" }}
        >
          {/* Si le produit actuel n'est pas dans la liste des options, l'afficher comme première option */}
          {record.product_id &&
            record.product_name &&
            !products.find((p) => p.id === record.product_id) && (
              <Option
                key={`current-${record.product_id}`}
                value={record.product_id}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ flex: 1, fontStyle: "italic" }}>
                    {record.product_name} (actuel)
                  </span>
                </div>
              </Option>
            )}
          {products
            .filter((p) => p.product_type === "raw")
            .map((product) => (
              <Option key={product.id} value={product.id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ flex: 1 }}>{product.name}</span>
                  {product.purchase_price && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {formatNumber(product.purchase_price)} CFA
                    </Tag>
                  )}
                </div>
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Qté Nécessaire",
      dataIndex: "quantity",
      key: "quantity",
      width: 150,
      align: "center",
      render: (text, record) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.quantity}
          onChange={(value) => updateMaterial(record.key, "quantity", value)}
          style={{ width: "100%" }}
          controls={true}
          addonAfter={record.unit_short_name || "unité"}
        />
      ),
    },
    {
      title: "Prix Unitaire",
      dataIndex: "purchase_price",
      key: "purchase_price",
      align: "right",
      width: 130,
      responsive: ["sm"],
      render: (price, record) => {
        return price && price > 0 ? `${formatNumber(price)} CFA` : "-";
      },
    },
    {
      title: "Coût Total",
      key: "total_cost",
      align: "right",
      width: 140,
      responsive: ["sm"],
      render: (_, record) => {
        const total =
          record.quantity && record.purchase_price && record.purchase_price > 0
            ? record.quantity * record.purchase_price
            : 0;
        return total > 0 ? `${formatNumber(total)} CFA` : "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Supprimer matière">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeMaterial(record.key)}
            size="small"
            style={{ borderRadius: "4px" }}
          />
        </Tooltip>
      ),
    },
  ];

  // Définition des colonnes de la table des produits finis (outputs)
  const outputColumns = [
    {
      title: "Produit fini",
      key: "product_id",
      render: (_, record) => (
        <Select
          value={record.product_id}
          onChange={(value) => updateOutput(record.key, "product_id", value)}
          style={{ width: "100%" }}
          placeholder="Sélectionner un produit fini"
          showSearch
          filterOption={false}
          onSearch={(value) => handleProductSearch(value, "single")}
          loading={loadingProducts}
          notFoundContent={loadingProducts ? <Spin size="small" /> : null}
          dropdownStyle={{ minWidth: "300px" }}
        >
          <Option value="self_reference">
            <Tag color="blue">Auto-référence (cette unité)</Tag>
          </Option>
          {/* Si le produit actuel n'est pas dans la liste des options, l'afficher comme première option */}
          {record.product_id &&
            record.product_name &&
            record.product_id !== "self_reference" &&
            !products.find((p) => p.id === record.product_id) && (
              <Option
                key={`current-${record.product_id}`}
                value={record.product_id}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ flex: 1, fontStyle: "italic" }}>
                    {record.product_name} (actuel)
                  </span>
                </div>
              </Option>
            )}
          {products
            .filter((p) => p.product_type === "single")
            .map((product) => (
              <Option key={product.id} value={product.id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ flex: 1 }}>{product.name}</span>
                </div>
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Quantité",
      dataIndex: "quantity",
      key: "quantity",
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.quantity}
          onChange={(value) => updateOutput(record.key, "quantity", value)}
          style={{ width: "100%" }}
          controls={true}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeOutput(record.key)}
          size="small"
          style={{ borderRadius: "4px" }}
        />
      ),
    },
  ];

  // Fonction pour mettre à jour les prix manquants des matières premières
  const updateMissingPrices = async (materialsToCheck) => {
    const materialsWithoutPrices = materialsToCheck.filter(
      (material) => !material.purchase_price || material.purchase_price === 0
    );

    if (materialsWithoutPrices.length === 0) {
      return;
    }

    // Récupérer les prix pour chaque matière première sans prix
    for (const material of materialsWithoutPrices) {
      if (material.product_id && selectedWarehouse) {
        try {
          const response = await axios.get(
            `${API_URL}/api/produits/${material.product_id}`,
            {
              params: {
                warehouse_id: selectedWarehouse,
                with_stock: true,
              },
            }
          );

          if (response.data && response.data.purchase_price) {
            // Mettre à jour cette matière première spécifique
            setMaterials((prevMaterials) =>
              prevMaterials.map((item) => {
                if (
                  item.key === material.key &&
                  item.product_id === material.product_id
                ) {
                  return {
                    ...item,
                    purchase_price: response.data.purchase_price || 0,
                    unit_short_name:
                      response.data.unit_short_name || item.unit_short_name,
                  };
                }
                return item;
              })
            );

            // Mettre à jour également la liste des produits
            setProducts((prevProducts) => {
              const existingIndex = prevProducts.findIndex(
                (p) => p.id === material.product_id
              );
              if (existingIndex >= 0) {
                const updatedProducts = [...prevProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  purchase_price: response.data.purchase_price,
                  unit_short_name: response.data.unit_short_name,
                };
                return updatedProducts;
              }
              return prevProducts;
            });
          }
        } catch (error) {
          console.error(
            `Erreur lors de la récupération du prix pour ${material.product_name}:`,
            error
          );
        }
      }
    }
  };

  return (
    <div className="production-unit-form-container p-sm md:p-md">
      <Card
        style={{ ...formStyles.card, marginBottom: 0 }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header: Back, Title, Save */}
        <div className="bg-white p-md rounded-t-lg border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-sm">
          <div className="flex items-center gap-md">
            <Tooltip title="Retour à la liste">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/production/units")}
                type="text"
                className="text-lg"
              />
            </Tooltip>
            <Title
              level={4}
              style={{ margin: 0 }}
              className="text-lg sm:text-xl"
            >
              {isEditing
                ? "Modifier l'Unité de Production"
                : "Créer une Unité de Production"}
            </Title>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()} // Trigger form submission
            loading={submitting}
            style={formStyles.actionButton}
            className="w-full sm:w-auto"
            disabled={
              !hasPermission(
                isEditing
                  ? "Gestion Commerciale.Approvisionnement.Production.Unites.edit"
                  : "Gestion Commerciale.Approvisionnement.Production.Unites.create"
              )
            }
          >
            Enregistrer
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: "50px", textAlign: "center" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="p-md"
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab=<span className="flex items-center gap-xs">
                  <InfoCircleOutlined /> Informations Générales
                </span>
                key="1"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      label="Nom de l'unité"
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez saisir un nom",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Ex: Production de jus d'orange"
                        onChange={(e) => {
                          const nameVal = e.target.value;
                          if (nameVal) {
                            const slug = generateSlug(nameVal);
                            const code = generateArticleCode(nameVal);
                            form.setFieldsValue({
                              slug: slug,
                              item_code: code,
                            });
                          } else {
                            // When name is cleared, clear dependent fields
                            form.setFieldsValue({
                              slug: "",
                              item_code: "",
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Slug"
                      name="slug"
                      rules={[
                        { required: true, message: "Le slug est requis" },
                      ]}
                    >
                      <Input
                        placeholder="slug-de-unite"
                        disabled
                        className="disabled-input"
                        addonAfter={
                          <Tooltip title="Identifiant unique pour les URL">
                            <InfoCircleOutlined />
                          </Tooltip>
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Entrepôt"
                      name="warehouse"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez sélectionner un entrepôt",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Sélectionner un entrepôt"
                        loading={!warehouses.length}
                        disabled={!selectedCompany}
                        showSearch
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {warehouses.map((wh) => (
                          <Option key={wh.id} value={wh.id}>
                            {wh.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Catégorie"
                      name="category_id"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez sélectionner une catégorie",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Sélectionner une catégorie"
                        showSearch
                        allowClear
                        className="w-full"
                      >
                        {categories.map((category) => (
                          <Option key={category.id} value={category.id}>
                            {category.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Unité de mesure (Stock)"
                      name="unit_id"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez sélectionner une unité",
                        },
                      ]}
                      tooltip="Unité de mesure pour le stock. Seules les unités de l'entreprise sélectionnée sont disponibles."
                    >
                      <Select
                        placeholder={
                          selectedCompany
                            ? "Sélectionner une unité"
                            : "Veuillez d'abord sélectionner une entreprise"
                        }
                        showSearch
                        allowClear
                        disabled={!selectedCompany}
                        loading={!units.length && selectedCompany}
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                        onSelect={(value) => handleUnitChange(value)}
                      >
                        {units.map((unit) => (
                          <Option key={unit.id} value={unit.id}>
                            {unit.name} ({unit.short_name})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="Description">
                  <TextArea
                    rows={3}
                    placeholder="Description de cette unité de production..."
                  />
                </Form.Item>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Image de l'unité"
                      name="image"
                      valuePropName="fileList"
                      getValueFromEvent={(e) =>
                        Array.isArray(e) ? e : e?.fileList
                      }
                    >
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        className="w-full flex justify-center"
                      >
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Télécharger</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} className="flex flex-col justify-center">
                    <Form.Item
                      name="status"
                      label="Statut de l'unité"
                      valuePropName="checked"
                      className="mb-0"
                    >
                      <Switch
                        checkedChildren="Actif"
                        unCheckedChildren="Inactif"
                      />
                    </Form.Item>
                    <Text type="secondary" className="text-xs">
                      Indique si cette unité de production est actuellement
                      active et peut être utilisée.
                    </Text>
                  </Col>
                </Row>
              </TabPane>

              <TabPane
                tab=<span className="flex items-center gap-xs">
                  <InfoCircleOutlined /> Paramètres de stock
                </span>
                key="2"
              >
                <Card
                  style={{ ...formStyles.card, marginBottom: 16 }}
                  bodyStyle={{ padding: "16px" }}
                  title={
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      <SettingOutlined style={{ marginRight: "8px" }} />
                      Paramètres de Stock de l'Unité
                    </div>
                  }
                >
                  <Row gutter={[16, 24]}>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="output_quantity"
                        label="Quantité Produite (par défaut)"
                        tooltip="Quantité de produit fini obtenue par cycle de production de cette unité."
                        rules={[{ required: true, type: "number", min: 0.01 }]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Ex: 100"
                          min={0.01}
                          step={0.01}
                          addonAfter={
                            form.getFieldValue("unit_id")
                              ? units.find(
                                  (u) => u.id === form.getFieldValue("unit_id")
                                )?.short_name || "unités"
                              : "unités"
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="stock_quantitiy_alert"
                        label="Alerte Stock (Produit Fini)"
                        tooltip="Seuil d'alerte pour le réapprovisionnement du produit fini de cette unité."
                        rules={[{ required: true, type: "number", min: 0 }]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Ex: 10"
                          addonAfter={
                            form.getFieldValue("unit_id")
                              ? units.find(
                                  (u) => u.id === form.getFieldValue("unit_id")
                                )?.short_name || "unités"
                              : "unités"
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="sales_price"
                        label="Prix de Vente (Produit Fini)"
                        rules={[{ required: true, type: "number", min: 0 }]}
                        tooltip="Prix de vente suggéré pour le produit fini de cette unité."
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          min={0}
                          step={100}
                          formatter={(value) =>
                            value ? `${formatNumber(value)} CFA` : ""
                          }
                          parser={(value) => {
                            const parsed = value.replace(/[^\d]/g, "");
                            return parsed ? Number(parsed) : "";
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card
                  style={{ ...formStyles.card, marginBottom: 16 }}
                  bodyStyle={{ padding: "16px" }}
                  title={
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      <ShoppingOutlined style={{ marginRight: "8px" }} />
                      Matières Premières Requises
                    </div>
                  }
                >
                  <Text
                    type="secondary"
                    style={{ marginBottom: 16, display: "block" }}
                  >
                    Ajoutez les matières premières nécessaires et leur quantité
                    pour produire la "Quantité Produite" définie ci-dessus.
                  </Text>
                  <div className="overflow-x-auto mb-md">
                    <Table
                      columns={materialColumns}
                      dataSource={materials}
                      rowKey="key"
                      pagination={false}
                      size="small"
                      bordered
                      scroll={{ x: "max-content" }}
                      locale={{ emptyText: "Aucune matière première ajoutée." }}
                    />
                  </div>
                  <Button
                    type="dashed"
                    onClick={addMaterial}
                    block
                    icon={<PlusOutlined />}
                    className="w-full sm:w-auto"
                  >
                    Ajouter une matière première
                  </Button>
                </Card>

                <Card
                  style={formStyles.card}
                  bodyStyle={{ padding: "16px" }}
                  title={
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      <ShoppingOutlined style={{ marginRight: "8px" }} />
                      Produit Fini Principal (Output)
                    </div>
                  }
                >
                  <Text
                    type="secondary"
                    style={{ marginBottom: 16, display: "block" }}
                  >
                    Ceci représente généralement l'unité de production elle-même
                    en tant que produit fini. La quantité est celle définie dans
                    "Quantité Produite".
                  </Text>
                  <div className="overflow-x-auto mb-md">
                    <Table
                      columns={outputColumns.filter(
                        (col) => col.key !== "actions"
                      )}
                      dataSource={outputs.filter(
                        (out) => out.product_name === form.getFieldValue("name")
                      )}
                      rowKey="key"
                      pagination={false}
                      size="small"
                      bordered
                      scroll={{ x: "max-content" }}
                      locale={{
                        emptyText:
                          "Le produit fini principal (cette unité) sera automatiquement ajouté/mis à jour.",
                      }}
                    />
                  </div>
                </Card>
              </TabPane>

              <TabPane
                tab=<span className="flex items-center gap-xs">
                  <BarcodeOutlined /> Code-barres
                </span>
                key="4"
              >
                <Row gutter={[16, 24]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="item_code"
                      label="Code Article / SKU"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez entrer ou générer un code article",
                        },
                      ]}
                      tooltip="Le code unique pour identifier cet article/unité de production. Peut être utilisé pour le code-barres."
                    >
                      <Input placeholder="Ex: UJP001" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="barcode_symbology"
                      label="Type de Code-barres"
                      rules={[
                        {
                          required: true,
                          message:
                            "Veuillez sélectionner un type de code-barres",
                        },
                      ]}
                      initialValue="CODE128"
                    >
                      <Select
                        placeholder="Sélectionner le type"
                        className="w-full"
                      >
                        <Option value="CODE128">CODE128</Option>
                        <Option value="EAN13">EAN-13</Option>
                        <Option value="CODE39">CODE39</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <div className="flex flex-col sm:flex-row gap-sm mt-md">
                  <Button
                    type="primary"
                    icon={<BarcodeOutlined />}
                    onClick={showBarcode}
                    disabled={!form.getFieldValue("item_code")}
                    className="w-full sm:w-auto"
                  >
                    Afficher/Imprimer le Code-barres
                  </Button>
                </div>
              </TabPane>
            </Tabs>
          </Form>
        )}
      </Card>

      {/* Modal pour afficher le code-barres */}
      <Modal
        title={
          <div className="flex items-center">
            <BarcodeOutlined className="mr-sm" />
            <span>Code-barres pour: {currentBarcode}</span>
          </div>
        }
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        width="90%"
        style={{ maxWidth: 450, top: 20 }}
        footer={[
          <Button
            key="close"
            icon={<RollbackOutlined />}
            onClick={() => setBarcodeModalVisible(false)}
            className="w-full sm:w-auto mb-sm sm:mb-0"
          >
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            className="w-full sm:w-auto"
            onClick={() => {
              const barcodeElement =
                document.getElementById("barcode-print-area");
              if (barcodeElement) {
                html2canvas(barcodeElement, { scale: 2 }).then((canvas) => {
                  const imgData = canvas.toDataURL("image/png");
                  const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: [70, 40],
                  });
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = pdf.internal.pageSize.getHeight();
                  const imgProps = pdf.getImageProperties(imgData);
                  const imgWidth = pdfWidth * 0.8;
                  const imgHeight =
                    (imgProps.height * imgWidth) / imgProps.width;
                  const x = (pdfWidth - imgWidth) / 2;
                  const y =
                    (pdfHeight - imgHeight) / 2 > 0
                      ? (pdfHeight - imgHeight) / 2
                      : 0;

                  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
                  pdf.save(`barcode-${currentBarcode}.pdf`);
                });
              }
            }}
          >
            Imprimer en PDF
          </Button>,
        ]}
      >
        <div
          id="barcode-print-area"
          className="text-center p-lg bg-white border border-dashed border-gray-300 rounded-md"
        >
          {currentBarcode && (
            <div>
              <Barcode
                value={currentBarcode}
                format={form.getFieldValue("barcode_symbology") || "CODE128"}
                width={1.5}
                height={60}
                displayValue={true}
                fontSize={14}
              />
            </div>
          )}
          {!currentBarcode && (
            <Text type="secondary">
              Aucun code article défini pour générer un code-barres.
            </Text>
          )}
        </div>
      </Modal>

      {renderTimestamps()}
    </div>
  );
};

export default ProductionUnitForm;
