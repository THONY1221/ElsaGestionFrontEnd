import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Space,
  Pagination,
  InputNumber,
  Spin,
  Alert,
  Tooltip,
  Typography,
  Dropdown,
  Menu,
} from "antd";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  DownOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";
import "./styles.css";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { Option } = Select;
const { Dragger } = Upload;
const { Title, Text, Link } = Typography;
const API_URL = "http://localhost:3000";

// Fonction utilitaire pour formater les nombres
const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value);

const GestionProduit = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState(null);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [formUnits, setFormUnits] = useState([]);
  const [formSelectedWarehouseCompanyId, setFormSelectedWarehouseCompanyId] =
    useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    categorie: "",
    warehouse: "",
  });

  // --- State for Import Modal ---
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [importResult, setImportResult] = useState(null);
  // --- End State for Import Modal ---

  const [exporting, setExporting] = useState(false);

  // Extraction du magasin sélectionné (et son setter) depuis le contexte global
  const { selectedCompany, selectedWarehouse, setSelectedWarehouse } =
    useSelection();
  const { user } = useAuth(); // Get user from AuthContext

  // --- DEBUGGING PERMISSIONS ---
  useEffect(() => {
    if (user && user.permissions) {
      console.log("[Permissions Debug] User permissions:", user.permissions);
    } else {
      console.log("[Permissions Debug] User or permissions not yet loaded.");
    }
  }, [user]);
  // --- END DEBUGGING ---

  // Helper function for permission checks
  const hasPermission = (permissionKey) => {
    // Ensure user and permissions are loaded
    return user?.permissions?.includes(permissionKey) || false;
  };

  // --- Gestion du filtre "categorie" (schéma existant) ---
  const handleCategoryFilter = (value) => {
    setFilters((prev) => ({ ...prev, categorie: value }));
    console.log(
      "[handleCategoryFilter] Nouvelle catégorie sélectionnée :",
      value
    );
  };

  // --- Gestion du filtre "warehouse" ---
  // On traite la valeur en tant que nombre pour éviter les problèmes de type
  const handleWarehouseFilter = (value) => {
    const numericValue = value ? Number(value) : "";
    setSelectedWarehouse(numericValue);
    setFilters((prev) => ({ ...prev, warehouse: numericValue }));
    console.log(
      "[handleWarehouseFilter] Nouveau filtre magasin :",
      numericValue
    );
  };

  // useEffect qui surveille le changement de selectedWarehouse dans le contexte
  useEffect(() => {
    console.log(
      "[useEffect] Changement de selectedWarehouse =",
      selectedWarehouse
    );
    // Met à jour le filtre local "warehouse" (on s'assure d'avoir un nombre ou une chaîne vide)
    setFilters((prev) => ({ ...prev, warehouse: selectedWarehouse || "" }));
    // Ne pas appeler fetchProducts ici, il sera déclenché par le changement de filters
  }, [selectedWarehouse]);

  // --- Génération du code-barres, slug et article code ---
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

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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

  // --- Récupération des catégories ---
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      if (response.data) setCategories(response.data);
      console.log("[fetchCategories] Réponse :", response.data);
    } catch (error) {
      message.error("Erreur lors du chargement des catégories");
      console.error("[fetchCategories] Erreur :", error);
    }
  };

  // --- Affichage et impression du code-barres ---
  const showBarcode = () => {
    const currentBarcodeValue = form.getFieldValue("item_code");
    if (currentBarcodeValue) {
      setCurrentBarcode(currentBarcodeValue);
      setBarcodeModalVisible(true);
    } else {
      message.error("Aucun code-barres disponible");
    }
  };

  const printBarcode = async () => {
    const barcodeElement = document.getElementById("barcode-print");
    if (barcodeElement) {
      try {
        const canvas = await html2canvas(barcodeElement);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [50, 30],
        });
        pdf.addImage(imgData, "PNG", 0, 0, 50, 30);
        pdf.save(`barcode-${currentBarcode}.pdf`);
      } catch (error) {
        message.error("Erreur lors de l'impression du code-barres");
        console.error("[printBarcode] Erreur :", error);
      }
    }
  };

  // --- Récupération des autres données ---
  useEffect(() => {
    fetchTaxes();
    fetchCategories();
    fetchAllUnits();
  }, []);

  // Effet pour charger les unités spécifiques à l'entreprise pour le formulaire
  useEffect(() => {
    const fetchUnitsForSelectedCompanyInForm = async () => {
      if (formSelectedWarehouseCompanyId) {
        try {
          setLoading(true); // Peut-être un indicateur de chargement spécifique pour les unités du formulaire
          const response = await axios.get(`${API_URL}/api/units`, {
            params: { company_id: formSelectedWarehouseCompanyId, limit: 1000 }, // Assurer de récupérer toutes les unités pour cette entreprise
          });
          if (response.data && response.data.units) {
            setFormUnits(response.data.units);
          } else {
            setFormUnits([]);
          }
        } catch (error) {
          message.error(
            "Erreur lors du chargement des unités pour le formulaire"
          );
          console.error("[fetchUnitsForSelectedCompanyInForm] Erreur :", error);
          setFormUnits([]);
        } finally {
          setLoading(false); // Fin du chargement
        }
      } else {
        setFormUnits([]); // Vider si aucune entreprise de formulaire n'est sélectionnée
      }
    };

    fetchUnitsForSelectedCompanyInForm();
  }, [formSelectedWarehouseCompanyId]);

  // Appel de fetchProducts lors des changements de pagination ou de filtres
  useEffect(() => {
    console.log(
      "[useEffect] Déclenchement de fetchProducts avec filters =",
      filters
    );
    fetchProducts();
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    console.log("[useEffect] Liste des produits affichés :", products);
  }, [products]);

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingProduct(null);
    setBarcodeGenerated(false);
    setCurrentBarcode(null);
    form.resetFields();
  };

  // --- MODIFIED: handleImport to open the modal ---
  const handleImport = () => {
    setImportResult(null);
    setFileList([]);
    setImportModalVisible(true);
  };
  // --- END MODIFIED ---

  // --- Récupération des entrepôts ---
  const fetchWarehouses = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany } : {};
      const response = await axios.get(`${API_URL}/api/warehouses`, { params });
      if (response.data && response.data.warehouses) {
        setWarehouses(response.data.warehouses);
      } else {
        setWarehouses([]);
      }
      console.log("[fetchWarehouses] Réponse :", response.data);
    } catch (error) {
      message.error("Erreur lors du chargement des entrepôts");
      console.error("[fetchWarehouses] Erreur :", error);
    }
  };

  const fetchAllUnits = async () => {
    try {
      // Cet appel récupère toutes les unités, potentiellement sans filtre d'entreprise,
      // ou avec une logique pour récupérer celles pertinentes pour l'affichage général.
      // Pour l'instant, on suppose qu'il récupère toutes les unités nécessaires pour le tableau.
      const response = await axios.get(`${API_URL}/api/units`, {
        params: { limit: 1000 },
      }); // limite haute pour tout avoir
      if (response.data && response.data.units) {
        setAllUnits(response.data.units); // Met à jour allUnits
      }
      console.log("[fetchAllUnits] Réponse :", response.data);
    } catch (error) {
      message.error("Erreur lors du chargement de toutes les unités");
      console.error("[fetchAllUnits] Erreur :", error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/taxes`);
      if (response.data && response.data.taxes) {
        setTaxes(response.data.taxes);
      }
      console.log("[fetchTaxes] Réponse :", response.data);
    } catch (error) {
      message.error("Erreur lors du chargement des taxes");
      console.error("[fetchTaxes] Erreur :", error);
    }
  };

  // --- Récupération des produits avec filtrage côté serveur ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };
      console.log("[fetchProducts] Params envoyés :", params);
      const response = await axios.get(`${API_URL}/api/produits`, { params });
      console.log("[fetchProducts] Réponse reçue :", response.data);
      if (response.data && response.data.products) {
        const transformedProducts = response.data.products.map((product) => ({
          ...product,
          key: product.id,
          warehouse_nom: product.warehouse_nom || "N/A",
        }));

        // On fait confiance au filtrage côté serveur uniquement
        console.log(
          "[fetchProducts] Produits retournés par le serveur :",
          transformedProducts
        );
        setProducts(transformedProducts);
        setPagination((prev) => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      message.error("Erreur lors du chargement des produits");
      console.error("[fetchProducts] Erreur :", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Function to handle CSV Upload ---
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Veuillez sélectionner un fichier CSV.");
      return;
    }

    const formData = new FormData();
    // Use actual File object; originFileObj may be undefined when using Dragger
    const fileObj = fileList[0].originFileObj || fileList[0];
    formData.append("importFile", fileObj);

    setIsUploading(true);
    setImportResult(null);

    try {
      // Let axios set Content-Type with appropriate boundary
      const response = await axios.post(
        `${API_URL}/api/produits/import`,
        formData
      );
      setImportResult(response.data);
      message.success(response.data.message);

      // Vérifier si l'importation a réussi (au moins un succès)
      if (response.data && response.data.successCount > 0) {
        // Laisser un petit délai pour que l'utilisateur voie le message de succès global
        setTimeout(() => {
          setImportModalVisible(false); // Fermer le modal
          setFileList([]); // Réinitialiser la liste des fichiers
          setImportResult(null); // Réinitialiser les résultats de l'import précédent
        }, 2000); // Délai de 2 secondes
      } else if (response.data && response.data.errorCount > 0) {
        // Si que des erreurs, ne pas fermer, laisser l'utilisateur voir les erreurs
        // setFileList([]); // On peut aussi vider le fichier ici si on veut forcer une nouvelle sélection
      }
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Erreur inconnue lors de l'importation.";
      const errorDetails = error.response?.data?.errors;
      setImportResult({
        errorCount: errorDetails ? errorDetails.length : 1,
        errors: errorDetails || [{ error: errorMessage }],
      });
      message.error(`Échec de l'importation: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // --- Function to create and trigger download of CSV template ---
  const downloadTemplate = () => {
    const headers = [
      "item_code",
      "name",
      "warehouse_name",
      "category_name",
      "unit_short_name",
      "product_type",
      "barcode_symbology",
      "purchase_price",
      "sales_price",
      "stock_quantitiy_alert",
      "tax_name",
      "slug",
      "description",
      "opening_stock",
    ];
    const exampleRow = [
      "PROD001",
      "Exemple Produit 1",
      "Entrepôt Principal",
      "Électronique",
      "pcs",
      "single",
      "CODE128",
      "15000",
      "25000",
      "10",
      "TVA 18%",
      "exemple-produit-1",
      "Ceci est une description exemple",
      "50",
    ];
    const exampleRow2 = [
      "MATPREM01",
      "Matière A",
      "Entrepôt Matières",
      "Matières Premières",
      "kg",
      "raw",
      "CODE128",
      "5000",
      "0",
      "50",
      "",
      "",
      "Composant essentiel",
      "250.5",
    ];

    const formatCsvRow = (row) =>
      row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      formatCsvRow(exampleRow) +
      "\n" +
      formatCsvRow(exampleRow2);

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_produits.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Téléchargement du template lancé.");
  };

  // --- MODIFIED: Function to handle product export (CSV or Excel) ---
  const handleExportProducts = async (format = "csv") => {
    setExporting(true);
    try {
      const apiParams = {
        ...filters,
        all: true,
      };

      const response = await axios.get(`${API_URL}/api/produits`, {
        params: apiParams,
      });
      const productsToExport = response.data.products;

      if (!productsToExport || productsToExport.length === 0) {
        message.info("Aucun produit à exporter selon les filtres actuels.");
        setExporting(false);
        return;
      }

      const exportData = productsToExport.map((product) => {
        const unit = allUnits.find((u) => u.id === product.unit_id);
        return {
          "Code Article": product.item_code || "",
          "Nom du Produit": product.name || "",
          "Entrepôt Principal": product.warehouse_nom || "",
          Catégorie: product.categorie_nom || "",
          "Unité (Abrégé)": unit ? unit.short_name : "",
          "Type de Produit": product.product_type || "",
          "Symbole Code-barres": product.barcode_symbology || "",
          "Prix d'Achat":
            product.purchase_price !== null &&
            product.purchase_price !== undefined
              ? Number(product.purchase_price)
              : "",
          "Prix de Vente":
            product.sales_price !== null && product.sales_price !== undefined
              ? Number(product.sales_price)
              : "",
          "Stock Actuel":
            product.current_stock !== null &&
            product.current_stock !== undefined
              ? Number(product.current_stock)
              : "",
          "Alerte Quantité":
            product.stock_quantitiy_alert !== null &&
            product.stock_quantitiy_alert !== undefined
              ? Number(product.stock_quantitiy_alert)
              : "",
          Slug: product.slug || "",
          Description: product.description || "",
        };
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      if (format === "csv") {
        const csvHeaders = Object.keys(exportData[0]);
        const csvRows = exportData.map((row) =>
          csvHeaders
            .map((header) => `"${String(row[header]).replace(/"/g, '""')}"`)
            .join(",")
        );
        const csvContent =
          "data:text/csv;charset=utf-8," +
          csvHeaders.join(",") +
          "\n" +
          csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_produits_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Produits");
        XLSX.writeFile(workbook, `export_produits_${timestamp}.xlsx`);
      }

      message.success(
        `Produits exportés en ${format.toUpperCase()} avec succès.`
      );
    } catch (error) {
      console.error(
        `[handleExportProducts ${format.toUpperCase()}] Erreur :`,
        error
      );
      message.error(
        `Erreur lors de l'exportation des produits en ${format.toUpperCase()}.`
      );
    } finally {
      setExporting(false);
    }
  };

  // Menu for the export dropdown
  const exportMenu = (
    <Menu onClick={(e) => handleExportProducts(e.key)}>
      <Menu.Item key="csv" icon={<DownloadOutlined />}>
        Exporter en CSV
      </Menu.Item>
      <Menu.Item key="excel" icon={<DownloadOutlined />}>
        Exporter en Excel
      </Menu.Item>
    </Menu>
  );

  // --- Définition des colonnes du tableau ---
  const columns = [
    {
      title: "Produit",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        const { current_stock, stock_quantitiy_alert } = record;
        let dotColor = "green";
        if (current_stock > stock_quantitiy_alert) {
          dotColor = "green";
        } else if (current_stock > stock_quantitiy_alert) {
          dotColor = "orange";
        } else {
          dotColor = "red";
        }
        return (
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: dotColor,
                marginRight: 8,
              }}
            ></span>
            {text}
          </span>
        );
      },
    },
    {
      title: "Unité",
      dataIndex: "unit_id",
      key: "unit",
      render: (unit_id) => {
        const unit = allUnits.find((u) => u.id === unit_id);
        return unit ? `${unit.name} (${unit.short_name})` : "N/A";
      },
    },
    {
      title: "Entrepôt",
      dataIndex: "warehouse_nom",
      key: "warehouse",
      filters: warehouses.map((w) => ({
        text: w.name,
        value: w.id,
      })),
      render: (text, record) => {
        const currentContextWarehouseName = text || "N/A";
        const mainWarehouseName = record.main_warehouse_nom;

        if (
          mainWarehouseName &&
          mainWarehouseName !== currentContextWarehouseName &&
          currentContextWarehouseName !== "N/A"
        ) {
          return (
            <Tooltip title={`Magasin principal: ${mainWarehouseName}`}>
              {currentContextWarehouseName}{" "}
              <InfoCircleOutlined
                style={{ color: "#1890ff", marginLeft: "4px" }}
              />
            </Tooltip>
          );
        }
        return currentContextWarehouseName;
      },
    },
    {
      title: "Catégorie",
      dataIndex: "categorie_nom",
      key: "categorie",
      render: (text) => text || "N/A",
    },
    {
      title: "Stock actuel",
      dataIndex: "current_stock",
      key: "current_stock",
      sorter: (a, b) => a.current_stock - b.current_stock,
      render: (value) => formatNumber(value),
    },
    {
      title: "Prix d'achat",
      dataIndex: "purchase_price",
      key: "purchase_price",
      render: (value) => `${formatNumber(value)} CFA`,
      sorter: (a, b) => a.purchase_price - b.purchase_price,
    },
    {
      title: "Prix de vente",
      dataIndex: "sales_price",
      key: "sales_price",
      render: (value) => `${formatNumber(value)} CFA`,
      sorter: (a, b) => a.sales_price - b.sales_price,
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => {
        // --- DEBUGGING PERMISSIONS ---
        const canView = hasPermission(
          "Gestion Commerciale.Produits.Produits.view"
        );
        // console.log(
        //   `[Permissions Debug] Checking for 'Gestion Commerciale.Produits.Produits.view': ${canView}`
        // );
        // --- Remove or comment out debug logs once confirmed working ---
        const canEdit = hasPermission(
          "Gestion Commerciale.Produits.Produits.edit"
        );
        const canDelete = hasPermission(
          "Gestion Commerciale.Produits.Produits.delete"
        );

        // If no actions are possible for this row, render null or an empty fragment
        if (!canView && !canEdit && !canDelete) {
          return null;
        }

        return (
          <Space size="small">
            {canView && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
                size="small"
                title="Voir détails"
              />
            )}
            {canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                type="primary"
                title="Modifier"
              />
            )}
            {canDelete && (
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                size="small"
                danger
                title="Supprimer"
              />
            )}
          </Space>
        );
      },
    },
  ];

  // --- Affichage détaillé du produit ---
  const handleView = async (record) => {
    try {
      // 1. Récupérer les détails complets et à jour du produit
      // On suppose une route GET /api/produits/:id qui retourne les détails
      // Y compris les prix, même si plusieurs entrepôts existent (peut-être ceux du warehouse principal?)
      const productDetailsResponse = await axios.get(
        `${API_URL}/api/produits/${record.id}`
      );
      const productDetails = productDetailsResponse.data;

      // 2. Récupérer les commandes associées (supposons une route)
      // Ajustez l'URL si nécessaire
      let productOrders = [];
      try {
        const ordersResponse = await axios.get(
          `${API_URL}/api/orders?product_id=${record.id}&limit=1000`
        ); // Limite haute pour tout récupérer
        // Adaptez la structure de la réponse si besoin (ex: ordersResponse.data.orders)
        productOrders = ordersResponse.data.orders || ordersResponse.data || [];
      } catch (orderError) {
        console.error("Erreur récupération commandes produit:", orderError);
        message.error("Impossible de récupérer les commandes du produit.");
      }

      // 3. Récupérer l'historique des stocks (supposons une route)
      // Ajustez l'URL si nécessaire (ex: /api/stock-history ou /api/stock-movements)
      let stockHistory = [];
      try {
        // Utilisons l'URL vue dans StockHistory.vue mais adaptée
        const historyResponse = await axios.get(
          `${API_URL}/api/stock-history?product_id=${record.id}&limit=1000`
        ); // Limite haute
        // Adaptez la structure de la réponse si besoin (ex: historyResponse.data.movements)
        stockHistory =
          historyResponse.data.stock_history || historyResponse.data || [];
      } catch (historyError) {
        console.error("Erreur récupération historique stock:", historyError);
        message.error("Impossible de récupérer l'historique des stocks.");
      }

      // Préparer les données complètes pour le modal
      const completeProductData = {
        ...productDetails, // Détails de base et prix à jour depuis /api/produits/:id
        commandes: productOrders, // Liste des commandes
        historique: stockHistory, // Historique des stocks
        // Assurez-vous que l'unité est présente (peut venir de productDetails)
        unit: productDetails.unit || record.unit || null,
        warehouse_nom:
          productDetails.warehouse_nom || record.warehouse_nom || null,
        // Recalculer/vérifier les champs potentiellement NaN ou manquants
        purchase_price: Number(productDetails.purchase_price) || 0,
        sales_price: Number(productDetails.sales_price) || 0,
        taxe_rate: Number(productDetails.tax_rate) || 0, // Assumons que taxe_rate est dans productDetails
        current_stock: Number(productDetails.current_stock) || 0,
        stock_quantitiy_alert:
          Number(productDetails.stock_quantitiy_alert) || 0,
        opening_stock: Number(productDetails.opening_stock) || 0,
      };

      // Le composant interne pour le contenu du Modal
      const ModalContent = () => {
        const [activeTab, setActiveTab] = useState("commandes");
        const [commandesPage, setCommandesPage] = useState(1);
        const [commandesPageSize, setCommandesPageSize] = useState(10);
        const [historiquePage, setHistoriquePage] = useState(1);
        const [historiquePageSize, setHistoriquePageSize] = useState(10);

        // Utiliser les données complètes récupérées
        const displayData = completeProductData;
        const unit = displayData.unit; // Utiliser l'unité des données complètes

        // Calcul du prix avec taxe (exemple simple, ajuster si la logique est différente)
        const prixAvecTaxe =
          displayData.sales_price * (1 + displayData.taxe_rate / 100);

        return (
          <div className="product-details-modal-content">
            {/* Première section : Infos générales */}
            <div style={{ display: "flex", marginBottom: "20px" }}>
              {/* Colonne Image */}
              <div
                style={{
                  marginRight: "20px",
                  width: "150px",
                  textAlign: "center",
                }}
              >
                {displayData.image ? (
                  <img
                    src={`/uploads/image_produits/${displayData.image}`}
                    alt={displayData.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "150px",
                      height: "150px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                    }}
                  >
                    no image
                  </div>
                )}
              </div>

              {/* Colonne Informations */}
              <div style={{ flex: 1 }}>
                {/* Première ligne d'informations */}
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Nom:
                    </div>
                    <div>{displayData.name || "-"}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Code de l'article:
                    </div>
                    <div>{displayData.item_code || "-"}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Catégorie:
                    </div>
                    <div>{displayData.categorie_nom || "-"}</div>
                  </div>
                </div>

                {/* Deuxième ligne d'informations */}
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Entrepôt:
                    </div>
                    {/* Afficher l'entrepôt principal si dispo, sinon "-" */}
                    <div>{displayData.warehouse_nom || "-"}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Stock actuel:
                    </div>
                    {/* Afficher le stock total ou celui de l'entrepôt principal? 
                        Ici on affiche current_stock retourné par /produits/:id */}
                    <div>
                      {formatNumber(displayData.current_stock)}{" "}
                      {unit ? unit.short_name : ""}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Alerte de quantité:
                    </div>
                    <div>{formatNumber(displayData.stock_quantitiy_alert)}</div>
                  </div>
                </div>

                {/* Troisième ligne d'informations */}
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Prix de vente:
                    </div>
                    {/* Utiliser le prix formaté */}
                    <div>{`${formatNumber(displayData.sales_price)} CFA`}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Prix d'achat:
                    </div>
                    <div>{`${formatNumber(
                      displayData.purchase_price
                    )} CFA`}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Prix avec taxe:
                    </div>
                    {/* Utiliser le prix calculé */}
                    <div>{`${formatNumber(prixAvecTaxe)} CFA`}</div>
                  </div>
                </div>

                {/* Quatrième ligne d'informations */}
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Taux d'imposition:
                    </div>
                    <div>
                      {displayData.taxe_rate
                        ? `${displayData.taxe_rate}%`
                        : "-"}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Stock d'ouverture:
                    </div>
                    <div>
                      {formatNumber(displayData.opening_stock)}{" "}
                      {unit ? unit.short_name : ""}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}></div> {/* Placeholder */}
                </div>
              </div>
            </div>

            {/* Onglets pour les commandes et l'historique */}
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: "16px",
                }}
              >
                {/* Tab Commandes */}
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom:
                      activeTab === "commandes" ? "2px solid #1890ff" : "none",
                    fontWeight: activeTab === "commandes" ? "bold" : "normal",
                    marginRight: "16px",
                    cursor: "pointer",
                    color: activeTab === "commandes" ? "#1890ff" : "#666",
                  }}
                  onClick={() => setActiveTab("commandes")}
                >
                  Commandes sur le produit
                </div>
                {/* Tab Historique */}
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom:
                      activeTab === "historique" ? "2px solid #1890ff" : "none",
                    fontWeight: activeTab === "historique" ? "bold" : "normal",
                    cursor: "pointer",
                    color: activeTab === "historique" ? "#1890ff" : "#666",
                  }}
                  onClick={() => setActiveTab("historique")}
                >
                  Historique des stocks
                </div>
              </div>

              {/* Tableau des commandes */}
              {activeTab === "commandes" && (
                <>
                  <Table
                    dataSource={displayData.commandes || []} // Utiliser les commandes récupérées
                    pagination={{
                      current: commandesPage,
                      pageSize: commandesPageSize,
                      total: displayData.commandes?.length || 0,
                      onChange: (page, pageSize) => {
                        setCommandesPage(page);
                        setCommandesPageSize(pageSize);
                      },
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                    }}
                    size="small"
                    rowKey={(item) => item.id.toString()}
                  >
                    {/* ... Colonnes de la table Commandes ... */}
                    <Table.Column
                      title="Date de commande"
                      dataIndex="order_date"
                      key="order_date"
                      render={(date) =>
                        dayjs(date).format("DD-MM-YYYY HH:mm:ss")
                      }
                    />
                    <Table.Column
                      title="Type de commande"
                      dataIndex="order_type"
                      key="order_type"
                      render={(type) =>
                        type === "purchase"
                          ? "Achats"
                          : type === "sales"
                          ? "Ventes"
                          : type === "stock-transfer"
                          ? "Transfert"
                          : type
                      }
                    />
                    <Table.Column
                      title="Quantité"
                      dataIndex="total_quantity" // Ou le champ approprié de l'item si besoin
                      key="quantity"
                      render={(qty, orderItem) => {
                        // Trouver l'item spécifique à ce produit dans la commande
                        const relevantItem = orderItem.items?.find(
                          (i) => i.product_id === displayData.id
                        );
                        const itemQty = relevantItem
                          ? relevantItem.quantity
                          : orderItem.total_quantity; // Fallback
                        return `${formatNumber(itemQty)} ${
                          unit ? unit.short_name : ""
                        }`;
                      }}
                    />
                    <Table.Column
                      title="Prix Unitaire"
                      dataIndex="items" // Utiliser les items pour trouver le prix
                      key="unit_price"
                      render={(items) => {
                        const relevantItem = items?.find(
                          (i) => i.product_id === displayData.id
                        );
                        const price = relevantItem
                          ? relevantItem.unit_price
                          : 0;
                        return `${formatNumber(price)} CFA`;
                      }}
                    />
                    <Table.Column
                      title="Remise"
                      dataIndex="items"
                      key="discount"
                      render={(items) => {
                        const relevantItem = items?.find(
                          (i) => i.product_id === displayData.id
                        );
                        const disc = relevantItem
                          ? relevantItem.discount_rate || 0
                          : 0;
                        return `${disc}%`;
                      }}
                    />
                    <Table.Column
                      title="Taxe"
                      dataIndex="items"
                      key="tax"
                      render={(items) => {
                        const relevantItem = items?.find(
                          (i) => i.product_id === displayData.id
                        );
                        const tax = relevantItem
                          ? relevantItem.tax_rate || 0
                          : 0;
                        return `${tax}%`;
                      }}
                    />
                    <Table.Column
                      title="Sous Total"
                      dataIndex="items"
                      key="total"
                      render={(items) => {
                        const relevantItem = items?.find(
                          (i) => i.product_id === displayData.id
                        );
                        const subtotal = relevantItem
                          ? relevantItem.subtotal
                          : 0;
                        return `${formatNumber(subtotal)} CFA`;
                      }}
                    />
                  </Table>
                </>
              )}

              {/* Tableau de l'historique des stocks */}
              {activeTab === "historique" && (
                <>
                  <Table
                    dataSource={displayData.historique || []} // Utiliser l'historique récupéré
                    pagination={{
                      current: historiquePage,
                      pageSize: historiquePageSize,
                      total: displayData.historique?.length || 0,
                      onChange: (page, pageSize) => {
                        setHistoriquePage(page);
                        setHistoriquePageSize(pageSize);
                      },
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                    }}
                    size="small"
                    rowKey={(item) =>
                      item.id ? item.id.toString() : Math.random().toString()
                    }
                  >
                    {/* ... Colonnes de la table Historique ... */}
                    <Table.Column
                      title="Date"
                      dataIndex="created_at"
                      key="date"
                      render={(date) =>
                        dayjs(date).format("DD-MM-YYYY HH:mm:ss")
                      }
                    />
                    <Table.Column
                      title="Entrepôt"
                      dataIndex="warehouse_name" // Assumer que l'API retourne le nom
                      key="warehouse"
                      render={(name) => name || "-"} // Afficher le nom de l'entrepôt du mouvement
                    />
                    <Table.Column
                      title="Quantité"
                      dataIndex="quantity"
                      key="quantity"
                      render={(qty) =>
                        `${formatNumber(qty)} ${unit ? unit.short_name : ""}`
                      }
                    />
                    <Table.Column
                      title="Type"
                      dataIndex="movement_type" // Utiliser movement_type
                      key="type"
                      render={(type) => type || "-"} // Afficher le type de mouvement
                    />
                    <Table.Column
                      title="Référence"
                      key="reference"
                      render={(text, record) =>
                        `${record.reference_type}:${record.reference_id}`
                      }
                    />
                    <Table.Column
                      title="Mouvement"
                      dataIndex="quantity"
                      key="mouvement"
                      render={(qty) =>
                        qty > 0 ? "Entrée" : qty < 0 ? "Sortie" : "Aucun"
                      }
                    />
                    <Table.Column
                      title="Remarques"
                      dataIndex="remarks"
                      key="remarks"
                    />
                  </Table>
                </>
              )}
            </div>
          </div>
        );
      };

      Modal.info({
        title: "Détails du produit",
        width: 1000,
        content: <ModalContent />,
        onOk() {},
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails du produit:",
        error
      );
      message.error("Impossible de récupérer les détails du produit");
    }
  };

  // --- Préchargement du formulaire en modification ---
  const handleEdit = async (tableRecord) => {
    try {
      setLoading(true); // Indicate loading while fetching product details

      // 1. Fetch full, definitive product data for editing
      const response = await axios.get(
        `${API_URL}/api/produits/${tableRecord.id}`
      );
      const productToEdit = response.data;

      setEditingProduct(productToEdit); // Use the more complete data

      // 2. Ensure the warehouses list is available (the existing fetchWarehouses call tied to selectedCompany is generally okay)
      // If the product's main warehouse's company differs from selectedCompany, `warehouses` might not contain it.
      // However, productToEdit.warehouse_id will be used directly.
      if (selectedCompany) {
        // This ensures warehouses for the current global context are loaded.
        // The logic below will try to find the product's warehouse in this list.
        await fetchWarehouses();
      }

      // 3. Construct formValues from the fetched definitive product data
      const formValues = {
        nom_produit: productToEdit.name,
        warehouse: productToEdit.warehouse_id, // Main warehouse_id of the product
        product_type:
          productToEdit.product_type === "single"
            ? "Produits finis"
            : "Matières premières",
        image: productToEdit.image
          ? [
              {
                uid: "-1",
                name: productToEdit.image,
                status: "done",
                url: `/uploads/image_produits/${productToEdit.image}`,
              },
            ]
          : [],
        prix_achat: Number(productToEdit.purchase_price), // Specific to main warehouse
        prix_vente: Number(productToEdit.sales_price), // Specific to main warehouse
        quantite_stock: Number(productToEdit.current_stock), // Current stock in main warehouse
        alerte_quantite: Number(productToEdit.stock_quantitiy_alert), // Specific to main warehouse
        barcode_symbology: productToEdit.barcode_symbology,
        item_code: productToEdit.item_code,
        slug: productToEdit.slug,
        id_categorie: productToEdit.category_id,
        id_unit: productToEdit.unit_id,
        taxe: productToEdit.tax_id, // Specific to main warehouse
        description: productToEdit.description,
      };

      if (productToEdit.item_code) {
        setBarcodeGenerated(true);
        setCurrentBarcode(productToEdit.item_code);
      } else {
        setBarcodeGenerated(false);
        setCurrentBarcode(null);
      }

      form.setFieldsValue(formValues);
      console.log(
        "[handleEdit] Valeurs chargées pour modification:",
        formValues
      );

      // 4. Déterminer company_id de l'entrepôt du produit en cours d'édition pour charger les bonnes unités
      if (productToEdit.warehouse_id) {
        // Try to find the warehouse in the currently loaded `warehouses` state
        const productWarehouseInfo = warehouses.find(
          (w) => w.id === productToEdit.warehouse_id
        );
        if (productWarehouseInfo && productWarehouseInfo.company_id) {
          setFormSelectedWarehouseCompanyId(productWarehouseInfo.company_id);
        } else {
          // Fallback: If warehouse not in list (e.g. different global company selected)
          // or warehouse has no company_id, use the product's own company_id.
          console.warn(
            `[handleEdit] L'entrepôt principal du produit (ID: ${productToEdit.warehouse_id}) n'a pas été trouvé dans la liste des entrepôts actuellement chargés pour la company sélectionnée, ou il manque company_id. Tentative d'utilisation de productToEdit.company_id (${productToEdit.company_id}) pour les unités.`
          );
          if (productToEdit.company_id) {
            setFormSelectedWarehouseCompanyId(productToEdit.company_id);
          } else {
            console.warn(
              `[handleEdit] productToEdit.company_id est également manquant. Les unités pourraient ne pas se charger.`
            );
            setFormSelectedWarehouseCompanyId(null);
          }
        }
      } else {
        // No main warehouse associated with the product at the 'products' table level
        setFormSelectedWarehouseCompanyId(null);
      }

      setModalVisible(true);
    } catch (error) {
      message.error(
        "Erreur lors du chargement des données du produit pour modification."
      );
      console.error("[handleEdit] Erreur :", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // --- Suppression d'un produit ---
  const handleDelete = async (id) => {
    try {
      await Modal.confirm({
        title: "Êtes-vous sûr de vouloir supprimer ce produit ?",
        content: "Cette action est irréversible.",
        okText: "Oui",
        cancelText: "Non",
        onOk: async () => {
          try {
            await axios.delete(`${API_URL}/api/produits/${id}`);
            message.success("Produit supprimé avec succès");
            fetchProducts();
          } catch (deleteError) {
            if (
              deleteError.response &&
              deleteError.response.status === 409 &&
              deleteError.response.data?.error
            ) {
              message.error(deleteError.response.data.error);
            } else if (
              deleteError.response &&
              deleteError.response.status === 400 &&
              deleteError.response.data?.error
            ) {
              message.error(deleteError.response.data.error);
            } else {
              message.error("Erreur lors de la suppression du produit.");
              console.error(
                "[handleDelete onOk] Erreur :",
                deleteError.response || deleteError
              );
            }
          }
        },
      });
    } catch (error) {
      message.error(
        "Une erreur est survenue lors de l'ouverture de la confirmation."
      );
      console.error("[handleDelete] Erreur Modal.confirm:", error);
    }
  };

  // --- Création ou mise à jour du produit ---
  const handleSubmit = async (values) => {
    try {
      console.log("[handleSubmit] Valeurs du formulaire:", values);
      const formData = new FormData();

      const warehouseId = Number(values.warehouse);
      const selectedWarehouseLocal = warehouses.find(
        (w) => w.id === warehouseId
      );
      console.log(
        "[handleSubmit] Warehouse sélectionné:",
        selectedWarehouseLocal
      );
      if (!selectedWarehouseLocal) {
        message.error("Entrepôt non trouvé");
        return;
      }

      const mappedValues = {
        company_id: selectedWarehouseLocal.company_id,
        warehouse_id: warehouseId,
        product_type:
          values.product_type === "Produits finis" ? "single" : "raw",
        name: values.nom_produit,
        slug: values.slug,
        barcode_symbology: values.barcode_symbology,
        item_code: values.item_code,
        category_id: values.id_categorie,
        unit_id: values.id_unit,
        current_stock: values.quantite_stock,
        purchase_price: values.prix_achat,
        sales_price: values.prix_vente,
        tax_id: values.taxe,
        stock_quantitiy_alert: values.alerte_quantite,
      };
      console.log("[handleSubmit] Valeurs mappées:", mappedValues);

      formData.append("company_id", mappedValues.company_id);
      formData.append("warehouse_id", mappedValues.warehouse_id);
      formData.append("product_type", mappedValues.product_type);
      formData.append("name", values.nom_produit);
      formData.append("slug", values.slug);
      formData.append("barcode_symbology", values.barcode_symbology);
      formData.append("barcode", values.item_code);
      formData.append("category_id", values.id_categorie);
      formData.append("unit_id", values.id_unit);
      formData.append("current_stock", values.quantite_stock);
      formData.append("purchase_price", values.prix_achat);
      formData.append("sales_price", values.prix_vente);
      formData.append("tax_id", values.taxe);
      formData.append("alert_quantity", values.alerte_quantite);

      if (values.description) {
        formData.append("description", values.description);
      }

      if (values.image && values.image[0] && values.image[0].originFileObj) {
        console.log(
          "[handleSubmit] Ajout de l'image:",
          values.image[0].originFileObj
        );
        formData.append("image", values.image[0].originFileObj);
      }

      for (let [key, value] of formData.entries()) {
        console.log("[handleSubmit] FormData entry:", key, value);
      }

      if (editingProduct) {
        console.log(
          "[handleSubmit] Mise à jour du produit avec id:",
          editingProduct.id
        );
        await axios.put(
          `${API_URL}/api/produits/${editingProduct.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        message.success("Produit modifié avec succès");
      } else {
        console.log("[handleSubmit] Création d'un nouveau produit");
        await axios.post(`${API_URL}/api/produits`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Produit ajouté avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement du produit");
      console.error("[handleSubmit] Erreur:", error);
    }
  };

  // Update warehouses list when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      fetchWarehouses();
    } else {
      setWarehouses([]);
    }
  }, [selectedCompany]);

  return (
    <div className="gestion-produit-container p-sm md:p-md">
      <div className="header-section flex flex-col md:flex-row md:justify-between md:items-center gap-md mb-md p-md bg-white shadow rounded-lg">
        <div className="button-group flex flex-wrap items-center gap-sm">
          <Space size="middle">
            {hasPermission("Gestion Commerciale.Produits.Produits.create") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingProduct(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                Nouveau Produit
              </Button>
            )}
            {hasPermission("Gestion Commerciale.Produits.Produits.import") && (
              <Button
                type="default"
                icon={<ImportOutlined />}
                onClick={handleImport}
              >
                Importer les Produits
              </Button>
            )}
            {hasPermission("Gestion Commerciale.Produits.Produits.export") && (
              <Dropdown.Button
                type="default"
                icon={<DownOutlined />}
                overlay={exportMenu}
                loading={exporting}
                onClick={() => handleExportProducts("csv")}
              >
                <ExportOutlined style={{ marginRight: 8 }} />
                Exporter
              </Dropdown.Button>
            )}
          </Space>
        </div>
        <div className="filter-section flex flex-wrap items-center gap-sm md:gap-md mt-sm md:mt-0">
          <Input
            placeholder="Rechercher un produit..."
            allowClear
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full sm:w-auto md:max-w-xs lg:max-w-sm"
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Filtrer par catégorie"
            allowClear
            className="w-full sm:w-auto md:min-w-[180px] lg:min-w-[200px]"
            onChange={handleCategoryFilter}
          >
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filtrer par magasin"
            allowClear
            className="w-full sm:w-auto md:min-w-[180px] lg:min-w-[200px]"
            value={selectedWarehouse || undefined}
            onChange={handleWarehouseFilter}
          >
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
      />

      <div className="pagination-container">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={(page, pageSize) =>
            setPagination({ ...pagination, current: page, pageSize })
          }
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} sur ${total} produits`
          }
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>

      <Modal
        title={editingProduct ? "Modifier le produit" : "Nouveau produit"}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={1000}
        bodyStyle={{ padding: "24px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            product_type: "Produits finis",
            alerte_quantite: 0,
            quantite_stock: 0,
            prix_achat: 0,
            prix_vente: 0,
          }}
          className="product-form"
        >
          <div className="form-container p-sm md:p-md">
            {/* Section Image et Informations de base - Refactorisée avec Tailwind */}
            <div className="form-section flex flex-col md:flex-row gap-md mb-lg p-md bg-white rounded-lg shadow-sm">
              <div className="image-section w-full md:w-1/3 flex flex-col items-center justify-center">
                <Form.Item
                  name="image"
                  label="Image du produit"
                  valuePropName="fileList"
                  getValueFromEvent={(e) =>
                    Array.isArray(e) ? e : e?.fileList
                  }
                  className="w-full"
                >
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => false}
                    className="product-image-upload flex justify-center"
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Télécharger</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
              <div className="basic-info w-full md:w-2/3 flex flex-col justify-center">
                <Form.Item
                  name="warehouse"
                  label="Entrepôt"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un entrepôt",
                    },
                  ]}
                  className="mb-md"
                >
                  <Select
                    placeholder="Sélectionner un entrepôt"
                    onChange={(value) => {
                      // `value` est l'ID de l'entrepôt
                      form.setFieldsValue({
                        warehouse: value,
                        id_unit: undefined,
                      }); // Réinitialiser l'unité sélectionnée
                      const selectedWh = warehouses.find((w) => w.id === value);
                      if (selectedWh && selectedWh.company_id) {
                        setFormSelectedWarehouseCompanyId(
                          selectedWh.company_id
                        );
                      } else {
                        setFormSelectedWarehouseCompanyId(null);
                      }
                    }}
                  >
                    {warehouses.map((w) => (
                      <Option key={w.id} value={w.id}>
                        {w.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="product_type"
                  label="Type de produit"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un type",
                    },
                  ]}
                >
                  <Select placeholder="Sélectionner le type">
                    <Option value="Produits finis">Produits finis</Option>
                    <Option value="Matières premières">
                      Matières premières
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Section Identification du produit - Refactorisée avec Tailwind */}
            <div className="form-section mb-lg p-md bg-white rounded-lg shadow-sm">
              <h3 className="section-title text-lg font-semibold mb-md">
                Identification du produit
              </h3>

              {/* Rangée 1: Nom du produit et Code article */}
              <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-x-md gap-y-sm mb-md">
                <Form.Item
                  name="nom_produit"
                  label="Nom du produit"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez entrer le nom du produit",
                    },
                  ]}
                >
                  <Input
                    placeholder="Nom du produit"
                    onChange={(e) => {
                      const name = e.target.value;
                      if (name) {
                        const slug = generateSlug(name);
                        const code = generateArticleCode(name);
                        form.setFieldsValue({ slug: slug, item_code: code });
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="item_code"
                  label="Code de l'article"
                  rules={[
                    { required: true, message: "Le code article est requis" },
                  ]}
                >
                  <Input
                    placeholder="Code article"
                    disabled
                    className="disabled-input"
                  />
                </Form.Item>
              </div>

              {/* Rangée 2: Catégorie et Slug */}
              <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-x-md gap-y-sm mb-md">
                <Form.Item
                  name="id_categorie"
                  label="Catégorie"
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
                  >
                    {categories.map((category) => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="slug"
                  label="Slug"
                  rules={[{ required: true, message: "Le slug est requis" }]}
                >
                  <Input
                    placeholder="slug-du-produit"
                    disabled
                    className="disabled-input"
                  />
                </Form.Item>
              </div>

              {/* Rangée 3: Description (100% largeur) */}
              <div className="form-row grid grid-cols-1 gap-y-sm mb-md">
                <Form.Item name="description" label="Description">
                  <Input.TextArea
                    placeholder="Description du produit"
                    rows={3}
                  />
                </Form.Item>
              </div>

              {/* Rangée 4: Code-barres symbology et valeur */}
              <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-x-md gap-y-sm mb-sm">
                <Form.Item
                  name="barcode_symbology"
                  label="Symbole des codes-barres"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un type de code-barres",
                    },
                  ]}
                >
                  <Select placeholder="Sélectionner le type de code-barres">
                    <Option value="CODE128">CODE 128</Option>
                    <Option value="EAN13">EAN-13</Option>
                    <Option value="CODE39">CODE 39</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="item_code"
                  label="Code-barres"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez entrer ou générer un code-barres",
                    },
                  ]}
                >
                  <Input.Group compact>
                    <Input
                      style={{ width: "calc(100% - 150px)" }}
                      placeholder="Code-barres"
                      readOnly={barcodeGenerated}
                      value={currentBarcode}
                    />
                    <Button
                      type="primary"
                      onClick={barcodeGenerated ? showBarcode : generateBarcode}
                    >
                      {barcodeGenerated ? "Afficher" : "Générer"}
                    </Button>
                  </Input.Group>
                </Form.Item>
              </div>
            </div>

            {/* Section Gestion des stocks - Refactorisée avec Tailwind */}
            <div className="form-section mb-lg p-md bg-white rounded-lg shadow-sm">
              <h3 className="section-title text-lg font-semibold mb-md">
                Gestion des stocks
              </h3>
              <div className="form-row grid grid-cols-1 md:grid-cols-3 gap-x-md gap-y-sm">
                <Form.Item
                  name="quantite_stock"
                  label="Stock initial"
                  rules={[{ required: true, type: "number", min: 0 }]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="Quantité en stock"
                  />
                </Form.Item>
                <Form.Item
                  name="id_unit"
                  label="Unité"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner une unité",
                    },
                  ]}
                >
                  <Select
                    placeholder="Sélectionner une unité"
                    showSearch
                    allowClear
                    disabled={
                      !formSelectedWarehouseCompanyId || formUnits.length === 0
                    }
                    loading={
                      loading &&
                      !formUnits.length &&
                      !!formSelectedWarehouseCompanyId
                    }
                  >
                    {formUnits.map((unit) => (
                      <Option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.short_name})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="alerte_quantite"
                  label="Alerte de quantité"
                  tooltip="Seuil d'alerte pour le réapprovisionnement"
                  rules={[{ required: true, type: "number", min: 0 }]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="Seuil d'alerte"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section Prix et taxes - Refactorisée avec Tailwind */}
            <div className="form-section mb-lg p-md bg-white rounded-lg shadow-sm">
              <h3 className="section-title text-lg font-semibold mb-md">
                Prix et taxes
              </h3>
              <div className="form-row grid grid-cols-1 md:grid-cols-3 gap-x-md gap-y-sm">
                <Form.Item
                  name="prix_achat"
                  label="Prix d'achat"
                  rules={[{ required: true, type: "number", min: 0 }]}
                >
                  <InputNumber
                    className="w-full"
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
                <Form.Item
                  name="prix_vente"
                  label="Prix de vente"
                  rules={[{ required: true, type: "number", min: 0 }]}
                >
                  <InputNumber
                    className="w-full"
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
                <Form.Item name="taxe" label="Taxe applicable">
                  <Select placeholder="Sélectionner une taxe">
                    <Option value={null}>Aucune taxe</Option>
                    {taxes.map((t) => (
                      <Option key={t.id} value={t.id}>
                        {t.name} ({t.rate}%)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
          </div>

          <div className="form-actions flex justify-end gap-sm mt-md p-sm">
            <Space>
              <Button onClick={handleModalClose}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? "Modifier" : "Créer"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Code-barres"
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        footer={[
          <Button key="print" type="primary" onClick={printBarcode}>
            Imprimer
          </Button>,
          <Button key="close" onClick={() => setBarcodeModalVisible(false)}>
            Fermer
          </Button>,
        ]}
      >
        <div
          id="barcode-print"
          style={{ textAlign: "center", padding: "20px" }}
        >
          {currentBarcode && (
            <Barcode
              value={currentBarcode}
              format={form.getFieldValue("barcode_symbology")}
            />
          )}
        </div>
      </Modal>

      <Modal
        title="Importer des Produits par CSV"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setImportModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isUploading}
            onClick={handleUpload}
            disabled={fileList.length === 0 || isUploading}
          >
            {isUploading ? "Importation..." : "Lancer l'importation"}
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Alert
            message="Instructions pour l'importation"
            description={
              <div>
                <p>
                  Utilisez cette fonctionnalité pour créer ou mettre à jour des
                  produits en masse via un fichier CSV.
                </p>
                <p>
                  Le fichier doit avoir les colonnes suivantes (respecter
                  l'ordre et les noms exacts) :<br />
                  <code>item_code</code> (unique, requis), <code>name</code>{" "}
                  (requis), <code>warehouse_name</code> (requis),{" "}
                  <code>category_name</code> (requis),{" "}
                  <code>unit_short_name</code> (requis, ex: 'kg', 'pcs'),{" "}
                  <code>product_type</code> (requis: 'single' ou 'raw'),{" "}
                  <code>barcode_symbology</code> (requis: 'CODE128', 'EAN13',
                  'CODE39'), <code>purchase_price</code> (requis),{" "}
                  <code>sales_price</code> (requis),{" "}
                  <code>stock_quantitiy_alert</code> (requis),{" "}
                  <code>tax_name</code> (optionnel), <code>slug</code>{" "}
                  (optionnel, généré si vide), <code>description</code>{" "}
                  (optionnel), <code>opening_stock</code> (optionnel).
                </p>
                <p>
                  <Link onClick={downloadTemplate}>
                    <DownloadOutlined /> Télécharger le fichier template (.csv)
                  </Link>
                </p>
                <p>
                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                  Si un <code>item_code</code> existe déjà, la ligne mettra à
                  jour le produit existant (infos générales) et les détails pour
                  l'entrepôt spécifié (prix, taxe, alerte). Si l'entrepôt n'est
                  pas encore lié au produit, il sera ajouté.
                </p>
                <p>
                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                  La colonne <code>opening_stock</code> sert à définir le stock
                  initial
                  <em>uniquement</em> lors de la première création du produit ou
                  de son ajout à un entrepôt via cet import. Laisser vide ou 0
                  si non applicable. Elle ne modifie pas le stock des
                  associations produit-entrepôt déjà existantes.
                </p>
              </div>
            }
            type="info"
            showIcon
          />

          <Dragger
            name="importFile"
            multiple={false}
            accept=".csv"
            fileList={fileList}
            beforeUpload={(file) => {
              const isCsv =
                file.type === "text/csv" ||
                file.name.toLowerCase().endsWith(".csv");
              if (!isCsv) {
                message.error(`${file.name} n'est pas un fichier CSV.`);
              } else {
                setFileList([file]);
                setImportResult(null);
                message.success(`${file.name} sélectionné.`);
              }
              return false;
            }}
            onRemove={() => {
              setFileList([]);
              setImportResult(null);
            }}
            style={{ padding: "20px" }}
            disabled={isUploading}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Cliquez ou glissez votre fichier .csv ici
            </p>
            <p className="ant-upload-hint">
              Sélectionnez un seul fichier CSV à importer.
            </p>
          </Dragger>

          {isUploading && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Spin size="large" tip="Traitement du fichier en cours..." />
            </div>
          )}

          {importResult && !isUploading && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}>Résultat de l'importation :</Title>
              {importResult.successCount > 0 && (
                <Alert
                  message={`${importResult.successCount} produit(s) importé(s)/mis à jour avec succès.`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 10 }}
                />
              )}
              {importResult.errorCount > 0 && (
                <Alert
                  message={`${importResult.errorCount} erreur(s) lors de l'importation.`}
                  description={
                    <ul
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        paddingLeft: "20px",
                      }}
                    >
                      {importResult.errors?.map((err, index) => (
                        <li key={index}>
                          {err.row ? `Ligne ${err.row} ` : ""}
                          {err.itemCode && err.itemCode !== "N/A"
                            ? `(Code: ${err.itemCode}) `
                            : ""}
                          : {err.error}
                        </li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default GestionProduit;
