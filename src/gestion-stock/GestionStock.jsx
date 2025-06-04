import React, { useState, useEffect, useCallback } from "react";
import { useSelection } from "../SelectionContext";
import { useAuth } from "../context/AuthContext";
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tabs,
  message,
  Typography,
  Popconfirm,
  Tag,
  Radio,
  InputNumber,
  Row,
  Col,
  Divider,
  Tooltip,
  Statistic,
  Spin,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import dayjs from "dayjs";
import { debounce } from "lodash";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

/**
 * Main Stock Management component with two tabs:
 * 1. Stock Transfers - For transferring products between warehouses
 * 2. Stock Adjustments - For adjusting stock quantities (add/remove)
 */
const GestionStock = () => {
  const [activeTab, setActiveTab] = useState("transfers");
  const { selectedWarehouse, selectedCompany } = useSelection();
  const { hasPermission } = useAuth();

  // Verify selections
  useEffect(() => {
    if (!selectedWarehouse) {
      message.warning(
        "Veuillez sélectionner un magasin pour gérer le stock",
        5
      );
    }
  }, [selectedWarehouse]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Filter tab items based on view permissions
  const availableTabs = [];
  if (hasPermission("Gestion Commerciale.Stock.GestionStock.Transfer.view")) {
    availableTabs.push({
      label: "Transferts de Stock",
      key: "transfers",
      children: (
        <StockTransfers
          selectedWarehouse={selectedWarehouse}
          selectedCompany={selectedCompany}
        />
      ),
    });
  }
  if (hasPermission("Gestion Commerciale.Stock.GestionStock.Adjust.view")) {
    availableTabs.push({
      label: "Ajustements de Stock",
      key: "adjustments",
      children: (
        <StockAdjustments
          selectedWarehouse={selectedWarehouse}
          selectedCompany={selectedCompany}
        />
      ),
    });
  }

  return (
    <div className="stock-management-container p-3 md:p-5">
      <div className="page-header mb-6 flex flex-col sm:flex-row items-center sm:items-center justify-between">
        <Title level={2} className="mb-4 sm:mb-0 text-center sm:text-left">
          Gestion du Stock
        </Title>
      </div>

      {/* Render Tabs only if there are available tabs */}
      {availableTabs.length > 0 ? (
        <div className="overflow-x-auto">
          <Tabs
            activeKey={
              availableTabs.some((tab) => tab.key === activeTab)
                ? activeTab
                : availableTabs[0]?.key || ""
            }
            onChange={handleTabChange}
            items={availableTabs}
            className="mb-4"
          />
        </div>
      ) : (
        <Card>
          <Text type="secondary">
            {selectedWarehouse
              ? "Vous n'avez pas la permission de voir les transferts ou les ajustements pour ce magasin."
              : "Veuillez sélectionner un magasin."}
          </Text>
        </Card>
      )}
    </div>
  );
};

/**
 * Helper function to format numbers
 * @param {number | string | undefined | null} value The number to format
 * @returns {string} Formatted number string or '0'
 */
const formatNumber = (value) => {
  const num = Number(value);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("fr-FR").format(num);
};

/**
 * Stock Transfers Component - Handles transfers between warehouses
 */
const StockTransfers = ({ selectedWarehouse, selectedCompany }) => {
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]); // Holds full product list for reference
  const [warehouseDetails, setWarehouseDetails] = useState(null);
  const [viewMode, setViewMode] = useState("sent"); // 'sent' or 'received'
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  // State for the new item management
  const [transferItems, setTransferItems] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [productSearchKey, setProductSearchKey] = useState(Date.now());
  const { user, hasPermission } = useAuth();

  // Fetch transfers based on selected warehouse and view mode
  const fetchTransfers = useCallback(async () => {
    if (!selectedWarehouse) return;

    setLoading(true);
    try {
      const res = await axios.get("/api/orders", {
        params: {
          order_type: "stock-transfer",
          warehouse: selectedWarehouse,
          view_type: viewMode,
          page: currentPage,
          limit: pageSize,
        },
      });

      setTransfers(res.data.orders || []);
      setTotalTransfers(res.data.total || 0);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      message.error("Impossible de charger les transferts de stock");
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, viewMode, currentPage, pageSize]);

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    if (!selectedCompany) return;
    try {
      const res = await axios.get("/api/warehouses", {
        params: { company_id: selectedCompany },
      });
      setWarehouses(res.data.warehouses || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      message.error("Impossible de charger les magasins");
    }
  }, [selectedCompany]);

  // Fetch warehouse details
  const fetchWarehouseDetails = useCallback(
    async (warehouseId) => {
      if (!warehouseId) {
        setWarehouseDetails(null);
        return;
      }
      try {
        const res = await axios.get(`/api/warehouses/${warehouseId}`);
        setWarehouseDetails(res.data);
      } catch (error) {
        console.error("Error fetching warehouse details:", error);
        setWarehouseDetails(null);
      }
    },
    [] // Removed form, editingTransferId dependencies as terms are removed
  );

  // Fetch products for search
  const fetchProductsForSearch = useCallback(
    async (searchValue = "") => {
      const sourceWarehouseId = form.getFieldValue("from_warehouse_id");
      if (!sourceWarehouseId) {
        setProductOptions([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await axios.get("/api/produits", {
          params: {
            warehouse: sourceWarehouseId,
            search: searchValue,
            limit: 50,
            with_details: true,
            _cb: Date.now(),
          },
        });
        let productsData = [];
        if (res.data.produits) {
          productsData = res.data.produits;
        } else if (res.data.products) {
          productsData = res.data.products;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        }
        setProducts(productsData);
        const options = productsData.map((p) => ({
          value: p.id,
          label: `${p.name || p.nom_produit} (Stock: ${
            p.current_stock ?? p.quantite_stock ?? "N/A"
          })`,
          key: p.id,
          product: p,
        }));
        setProductOptions(options);
      } catch (error) {
        console.error("Error fetching products for search:", error);
        message.error("Impossible de charger les produits pour la recherche");
        setProductOptions([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [form]
  );

  const debouncedFetchProducts = useCallback(
    debounce(fetchProductsForSearch, 500),
    [fetchProductsForSearch]
  );

  const fetchInitialProducts = useCallback(async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/produits", {
        params: {
          warehouse: selectedWarehouse,
          all: true,
          with_details: true,
          _cb: Date.now(),
        },
      });
      let productsData = [];
      if (res.data.produits) {
        productsData = res.data.produits;
      } else if (res.data.products) {
        productsData = res.data.products;
      } else if (Array.isArray(res.data)) {
        productsData = res.data;
      }
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching initial products:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  // Initial data loading and updates
  useEffect(() => {
    if (selectedWarehouse) {
      setProducts([]);
      setProductOptions([]);
      fetchTransfers();
      fetchInitialProducts();
      fetchWarehouseDetails(selectedWarehouse);
    } else {
      setTransfers([]);
      setProducts([]);
      setTransferItems([]);
      setProductOptions([]);
      setWarehouseDetails(null);
    }
  }, [
    fetchTransfers,
    fetchInitialProducts,
    fetchWarehouseDetails,
    selectedWarehouse,
  ]);

  useEffect(() => {
    if (selectedCompany) {
      fetchWarehouses();
    } else {
      setWarehouses([]);
    }
  }, [fetchWarehouses, selectedCompany]);

  // Function to update calculations for a specific item (simplified)
  const calculateItemTotals = (item) => {
    if (!item) return item;

    const quantity = Number(item.quantity) || 0;
    const transferPrice = Number(item.transfer_price) || 0;
    const total = quantity * transferPrice;

    return {
      ...item,
      total: total, // Only total per line now
    };
  };

  // Function to update overall totals (simplified)
  const updateOverallTotals = useCallback(() => {
    let newGrandTotal = 0;
    transferItems.forEach((item) => {
      newGrandTotal += Number(item?.total) || 0;
    });
    setGrandTotal(newGrandTotal);
  }, [transferItems]);

  useEffect(() => {
    updateOverallTotals();
  }, [transferItems, updateOverallTotals]);

  // Handle create/edit modal opening
  const openTransferModal = (transferId = null) => {
    setEditingTransferId(transferId);
    form.resetFields();
    setWarehouseDetails(null);
    setTransferItems([]);
    setGrandTotal(0); // Reset grand total
    setProductOptions([]);

    if (transferId) {
      setLoading(true);
      axios
        .get(`/api/orders/${transferId}`)
        .then((res) => {
          const transferData = res.data;
          fetchWarehouseDetails(transferData.from_warehouse_id);
          if (transferData.from_warehouse_id) {
            axios
              .get("/api/produits", {
                params: {
                  warehouse: transferData.from_warehouse_id,
                  all: true,
                  with_details: true,
                },
              })
              .then((prodRes) => {
                let fetchedProds = [];
                if (prodRes.data.produits) fetchedProds = prodRes.data.produits;
                else if (prodRes.data.products)
                  fetchedProds = prodRes.data.products;
                else if (Array.isArray(prodRes.data))
                  fetchedProds = prodRes.data;
                setProducts(fetchedProds);

                axios
                  .get(`/api/orders/${transferId}/items`)
                  .then((itemsRes) => {
                    const formattedItems = itemsRes.data.map((item) => {
                      const productDetail = fetchedProds.find(
                        (p) => p.id === item.product_id
                      );
                      const transferPrice = Number(item.unit_price) || 0;
                      const quantity = Number(item.quantity) || 0;

                      const calculatedItem = calculateItemTotals({
                        key: item.id || item.product_id,
                        product_id: item.product_id,
                        product_name:
                          productDetail?.name ||
                          productDetail?.nom_produit ||
                          "Produit Inconnu",
                        current_stock:
                          productDetail?.current_stock ??
                          productDetail?.quantite_stock,
                        quantity: quantity,
                        transfer_price: transferPrice,
                      });
                      return calculatedItem;
                    });
                    setTransferItems(formattedItems);
                  })
                  .catch((itemError) => {
                    console.error("Error fetching transfer items:", itemError);
                    message.error(
                      "Impossible de charger les produits du transfert"
                    );
                  });
              })
              .catch((prodError) => {
                console.error("Error fetching products for edit:", prodError);
                message.error(
                  "Impossible de charger la liste des produits source"
                );
              });
          }

          form.setFieldsValue({
            date: dayjs(transferData.order_date),
            from_warehouse_id: transferData.from_warehouse_id,
            to_warehouse_id: transferData.warehouse_id,
            remarks: transferData.notes,
          });
        })
        .catch((error) => {
          console.error("Error fetching transfer details:", error);
          message.error("Impossible de charger les détails du transfert");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      fetchWarehouseDetails(selectedWarehouse);
      form.setFieldsValue({
        date: dayjs(),
        from_warehouse_id: selectedWarehouse,
      });
      if (selectedWarehouse) {
        fetchProductsForSearch();
      }
    }
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (transferItems.length === 0) {
      message.warning(
        "Veuillez ajouter au moins un produit valide au transfert."
      );
      return;
    }
    try {
      setLoading(true);
      const formData = {
        company_id: selectedCompany,
        from_warehouse_id: values.from_warehouse_id,
        warehouse_id: values.to_warehouse_id,
        order_date: values.date.format("YYYY-MM-DD"),
        order_type: "stock-transfer",
        notes: values.remarks,
        order_status: "completed",
        payment_status: "n/a",
        items: transferItems.map((item) => {
          return {
            product_id: item.product_id,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.transfer_price) || 0,
            subtotal: Number(item.total) || 0,
            discount_rate: 0,
          };
        }),
      };

      formData.subtotal = formData.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      formData.total = formData.subtotal;

      formData.total_items = formData.items.length;
      formData.total_quantity = formData.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      console.log("Submitting transfer data:", formData);

      let response;
      if (editingTransferId) {
        response = await axios.put(
          `/api/orders/${editingTransferId}`,
          formData
        );
        message.success("Transfert mis à jour avec succès");
      } else {
        response = await axios.post("/api/orders", formData);
        message.success("Transfert créé avec succès");
      }

      setModalVisible(false);
      fetchTransfers();
    } catch (error) {
      console.error(
        "Error submitting transfer:",
        error.response?.data || error.message || error
      );
      message.error(
        `Erreur lors de l'enregistrement du transfert: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete transfer
  const handleDelete = async (transferId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/orders/${transferId}`);
      message.success("Transfert supprimé avec succès");
      fetchTransfers();
    } catch (error) {
      console.error("Error deleting transfer:", error);
      message.error("Erreur lors de la suppression du transfert");
    } finally {
      setLoading(false);
    }
  };

  // When product is selected from search, add/update in transferItems state
  const handleProductSelect = (value, option) => {
    if (!option || !option.product) {
      console.warn("Product selection issue:", value, option);
      message.error(
        "Impossible de récupérer les détails du produit sélectionné."
      );
      return;
    }
    const selectedProduct = option.product;
    const sourceStock =
      selectedProduct.current_stock ?? selectedProduct.quantite_stock;

    if (sourceStock === undefined || sourceStock <= 0) {
      message.error(
        `Le produit "${
          selectedProduct.name || selectedProduct.nom_produit
        }" n'a pas de stock disponible dans le magasin source.`
      );
      setProductSearchKey(Date.now());
      setProductOptions([]);
      return;
    }

    setTransferItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) => item.product_id === selectedProduct.id
      );
      let updatedItems = [...currentItems];

      if (existingItemIndex !== -1) {
        const currentQuantity = updatedItems[existingItemIndex].quantity;
        if (sourceStock !== undefined && currentQuantity + 1 > sourceStock) {
          message.warning(
            `La quantité demandée dépasse le stock disponible (${sourceStock}).`
          );
        } else {
          updatedItems[existingItemIndex] = calculateItemTotals({
            ...updatedItems[existingItemIndex],
            quantity: currentQuantity + 1,
          });
          message.success(
            `Quantité de ${
              selectedProduct.name || selectedProduct.nom_produit
            } augmentée.`
          );
        }
      } else {
        const newItem = calculateItemTotals({
          key: selectedProduct.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name || selectedProduct.nom_produit,
          current_stock: sourceStock,
          quantity: 1,
          transfer_price:
            selectedProduct.cost_price ?? // Prioritize cost price
            selectedProduct.sales_price ??
            selectedProduct.price ??
            0,
        });
        updatedItems.push(newItem);
        message.success(
          `${
            selectedProduct.name || selectedProduct.nom_produit
          } ajouté au transfert.`
        );
      }
      return updatedItems;
    });
    setProductSearchKey(Date.now());
    setProductOptions([]);
  };

  // Handler for changes within the items table
  const handleItemChange = (key, field, value) => {
    setTransferItems((currentItems) => {
      const index = currentItems.findIndex((item) => item.key === key);
      if (index === -1) return currentItems;

      const updatedItems = [...currentItems];
      let itemToUpdate = { ...updatedItems[index], [field]: value };

      // Apply visual feedback for stock correction
      let quantityInput = document.getElementById(`quantity-input-${key}`);

      if (field === "quantity") {
        const sourceStock = itemToUpdate.current_stock;
        const numericValue = Number(value);

        if (sourceStock !== undefined && numericValue > sourceStock) {
          message.warning(
            `La quantité (${numericValue}) dépasse le stock disponible (${sourceStock}). Ajustement à ${sourceStock}.`,
            4 // Duration
          );
          itemToUpdate[field] = sourceStock;
          if (quantityInput) {
            quantityInput.style.borderColor = "red";
            setTimeout(() => {
              if (quantityInput) quantityInput.style.borderColor = "";
            }, 1500);
          }
        } else if (numericValue <= 0) {
          message.warning(`La quantité doit être positive. Ajustement à 1.`);
          itemToUpdate[field] = 1;
          if (quantityInput) {
            quantityInput.style.borderColor = "orange";
            setTimeout(() => {
              if (quantityInput) quantityInput.style.borderColor = "";
            }, 1500);
          }
        } else {
          // Clear border if quantity is valid
          if (quantityInput) {
            quantityInput.style.borderColor = "";
          }
        }
      }

      // Recalculate totals for the updated item
      updatedItems[index] = calculateItemTotals(itemToUpdate);

      return updatedItems;
    });
  };

  // Handle item deletion from the table
  const handleDeleteItem = (key) => {
    setTransferItems((currentItems) =>
      currentItems.filter((item) => item.key !== key)
    );
  };

  // Define columns for transfers list table
  const columns = [
    {
      title: "№ du Transfert",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
    {
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: viewMode === "sent" ? "Magasin Destination" : "Magasin Source",
      dataIndex: viewMode === "sent" ? "warehouse_name" : "from_warehouse_name",
      key: "warehouse",
    },
    {
      title: "Statut",
      dataIndex: "order_status",
      key: "order_status",
      render: (status) => (
        <Tag color={status === "completed" ? "green" : "blue"}>
          {status === "completed" ? "Complété" : status}
        </Tag>
      ),
    },
    {
      title: "Produits",
      dataIndex: "total_items",
      key: "total_items",
    },
    {
      title: "Quantité",
      dataIndex: "total_quantity",
      key: "total_quantity",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {hasPermission(
            "Gestion Commerciale.Stock.GestionStock.Transfer.edit"
          ) && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openTransferModal(record.id)}
              disabled={viewMode === "received"}
            />
          )}
          {hasPermission(
            "Gestion Commerciale.Stock.GestionStock.Transfer.delete"
          ) && (
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer ce transfert?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
              icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
              disabled={viewMode === "received"}
            >
              <Button
                type="danger"
                size="small"
                icon={<DeleteOutlined />}
                disabled={viewMode === "received"}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Define columns for the items table within the modal (Simplified)
  const itemTableColumns = [
    {
      title: "Produit",
      dataIndex: "product_name",
      key: "product_name",
      render: (name) => name,
    },
    {
      title: "Stock Source",
      dataIndex: "current_stock",
      key: "current_stock",
      width: 100,
      align: "center",
      render: (stock) => stock ?? "N/A",
    },
    {
      title: "Quantité",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (value, record) => (
        <InputNumber
          id={`quantity-input-${record.key}`}
          min={1}
          max={record.current_stock}
          value={value}
          onChange={(newValue) =>
            handleItemChange(record.key, "quantity", newValue)
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Prix Transfert",
      dataIndex: "transfer_price",
      key: "transfer_price",
      width: 150,
      render: (value, record) => (
        <InputNumber
          min={0}
          value={value}
          formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(val) => val?.replace(/\$\s?|(,*)/g, "")}
          onChange={(newValue) =>
            handleItemChange(record.key, "transfer_price", newValue)
          }
          style={{ width: "100%" }}
          addonAfter="CFA"
        />
      ),
    },
    {
      title: "Total Ligne",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => `${formatNumber(value)} CFA`,
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(record.key)}
        />
      ),
    },
  ];

  // Watch source warehouse changes
  const sourceWarehouseId = Form.useWatch("from_warehouse_id", form);
  useEffect(() => {
    if (modalVisible && sourceWarehouseId) {
      setTransferItems([]);
      setProductOptions([]);
    }
  }, [sourceWarehouseId, modalVisible, fetchProductsForSearch]);

  // Handle multiple delete
  const handleDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        "Veuillez sélectionner au moins un transfert à supprimer."
      );
      return;
    }

    Modal.confirm({
      title: `Êtes-vous sûr de vouloir supprimer ${selectedRowKeys.length} transfert(s) ?`,
      content: "Cette action est irréversible et le stock sera restauré.",
      okText: "Oui, Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        setLoading(true);
        try {
          // Create an array of delete promises
          const deletePromises = selectedRowKeys.map((id) =>
            axios.delete(`/api/orders/${id}`)
          );
          // Wait for all delete requests to complete
          await Promise.all(deletePromises);

          message.success(
            `${selectedRowKeys.length} transfert(s) supprimé(s) avec succès.`
          );
          setSelectedRowKeys([]); // Clear selection
          fetchTransfers(); // Refresh the list
        } catch (error) {
          console.error("Error deleting multiple transfers:", error);
          message.error(
            "Erreur lors de la suppression des transferts sélectionnés."
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div className="stock-transfers-container">
      <Card
        title={
          <Space>
            <Title level={4} className="my-1 hidden sm:block">
              {viewMode === "sent" ? "Transferts Envoyés" : "Transferts Reçus"}
            </Title>
          </Space>
        }
        extra={
          <Space className="flex flex-col sm:flex-row gap-2 items-center">
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              buttonStyle="solid"
              className="mb-2 sm:mb-0 flex justify-center"
              size="middle"
            >
              <Radio.Button value="sent">
                <ArrowRightOutlined /> Envoyés
              </Radio.Button>
              <Radio.Button value="received">
                <ArrowLeftOutlined /> Reçus
              </Radio.Button>
            </Radio.Group>
            {hasPermission(
              "Gestion Commerciale.Stock.GestionStock.Transfer.create"
            ) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openTransferModal()}
                disabled={!selectedWarehouse}
                className="w-full sm:w-auto mt-1 sm:mt-0 mx-auto sm:mx-0"
                size="middle"
              >
                Nouveau Transfert
              </Button>
            )}
            {hasSelected &&
              hasPermission(
                "Gestion Commerciale.Stock.GestionStock.Transfer.delete"
              ) && (
                <Space
                  className="mt-2 sm:mt-0 w-full sm:w-auto"
                  direction="vertical"
                  size="small"
                >
                  <Button
                    type="danger"
                    onClick={handleDeleteMultiple}
                    disabled={!hasSelected || viewMode === "received"}
                    loading={loading}
                    icon={<DeleteOutlined />}
                    className="w-full sm:w-auto mx-auto sm:mx-0"
                    size="middle"
                  >
                    Supprimer Sélection
                  </Button>
                  <Text
                    type="secondary"
                    className="text-center sm:text-left"
                  >{`${selectedRowKeys.length} sélectionné(s)`}</Text>
                </Space>
              )}
          </Space>
        }
      >
        <div className="overflow-x-auto">
          <Table
            rowSelection={rowSelection}
            dataSource={transfers}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: "max-content" }}
            expandable={{
              expandedRowRender: (record) => (
                <div className="overflow-x-auto">
                  <Table
                    columns={[
                      {
                        title: "Produit",
                        dataIndex: "product_name",
                        key: "product_name",
                      },
                      {
                        title: "Quantité",
                        dataIndex: "quantity",
                        key: "quantity",
                        align: "right",
                        render: (qty) => formatNumber(qty),
                      },
                      {
                        title: "Prix Unit.",
                        dataIndex: "unit_price",
                        key: "unit_price",
                        align: "right",
                        render: (price) => `${formatNumber(price)} CFA`,
                      },
                      {
                        title: "Total",
                        dataIndex: "subtotal",
                        key: "subtotal",
                        align: "right",
                        render: (total) => `${formatNumber(total)} CFA`,
                      },
                    ]}
                    dataSource={record.items || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    style={{ margin: 0 }}
                  />
                </div>
              ),
              rowExpandable: (record) =>
                record.items && record.items.length > 0,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalTransfers,
              onChange: (page) => setCurrentPage(page),
              onShowSizeChange: (_, size) => setPageSize(size),
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} transferts`,
            }}
          />
        </div>
      </Card>

      {/* Transfer Form Modal */}
      <Modal
        title={`${
          editingTransferId ? "Modifier" : "Créer"
        } un Transfert de Stock`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20, maxWidth: 1200 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="date"
                label="Date du Transfert"
                rules={[{ required: true, message: "La date est requise" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="from_warehouse_id"
                label="Magasin Source"
                rules={[{ required: true, message: "Magasin source requis" }]}
              >
                <Select
                  placeholder="Sélectionner magasin source"
                  disabled={!editingTransferId && selectedWarehouse}
                  allowClear={!!editingTransferId}
                  onChange={() => {
                    setTransferItems([]);
                    setProductOptions([]);
                  }}
                >
                  {warehouses.map((warehouse) => (
                    <Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="to_warehouse_id"
                label="Magasin Destination"
                rules={[
                  { required: true, message: "Magasin destination requis" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        value !== getFieldValue("from_warehouse_id")
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Le magasin destination doit être différent du magasin source."
                        )
                      );
                    },
                  }),
                ]}
              >
                <Select
                  placeholder="Sélectionner magasin destination"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {warehouses
                    .filter(
                      (w) => w.id !== form.getFieldValue("from_warehouse_id")
                    )
                    .map((warehouse) => (
                      <Option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" label="Remarques">
                <TextArea rows={2} placeholder="Notes additionnelles" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Produits à Transférer</Divider>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <Form.Item label="Rechercher un produit à ajouter">
                <Select
                  key={productSearchKey}
                  showSearch
                  placeholder="Tapez pour rechercher un produit..."
                  notFoundContent={
                    searchLoading ? (
                      <Spin size="small" />
                    ) : (
                      "Aucun produit trouvé"
                    )
                  }
                  filterOption={false}
                  onSearch={debouncedFetchProducts}
                  onChange={handleProductSelect}
                  style={{ width: "100%" }}
                  options={productOptions}
                  loading={searchLoading}
                  disabled={!form.getFieldValue("from_warehouse_id")}
                  value={null}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="overflow-x-auto">
            <Table
              dataSource={transferItems}
              columns={itemTableColumns}
              rowKey="key"
              pagination={false}
              size="small"
              bordered
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Aucun produit ajouté au transfert" }}
              style={{ marginBottom: 16 }}
            />
          </div>

          <Divider />
          <Row
            gutter={16}
            style={{ marginTop: 16, paddingBottom: 16 }}
            justify="end"
            className="bg-gray-50 p-4 rounded"
          >
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Grand Total Transfert"
                value={formatNumber(grandTotal)}
                suffix=" CFA"
                valueStyle={{ fontWeight: "bold" }}
              />
            </Col>
          </Row>

          <Row justify="end" style={{ marginTop: 24 }}>
            <Space className="flex flex-col xs:flex-row w-full xs:w-auto gap-2">
              <Button
                onClick={() => setModalVisible(false)}
                className="mb-2 xs:mb-0 w-full xs:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full xs:w-auto"
              >
                {editingTransferId ? "Mettre à Jour" : "Créer Transfert"}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * Stock Adjustments Component - Handles adding/removing stock quantities
 */
const StockAdjustments = ({ selectedWarehouse, selectedCompany }) => {
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState(null);
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [form] = Form.useForm();
  const { user, hasPermission } = useAuth();

  // Fetch adjustments based on selected warehouse and filters
  const fetchAdjustments = useCallback(async () => {
    if (!selectedWarehouse) return;

    setLoading(true);
    try {
      const params = {
        warehouse_id: selectedWarehouse,
        page: currentPage,
        limit: pageSize,
        sort_by: "created_at",
        order: "desc",
      };

      if (productFilter) {
        params.product_id = productFilter;
      }

      if (dateRangeFilter && dateRangeFilter.length === 2) {
        params.start_date = dateRangeFilter[0].format("YYYY-MM-DD");
        params.end_date = dateRangeFilter[1].format("YYYY-MM-DD");
      }

      const res = await axios.get("/api/stock-adjustments", { params });

      setAdjustments(res.data.adjustments || []);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error("Error fetching adjustments:", error);
      message.error("Impossible de charger les ajustements de stock");
    } finally {
      setLoading(false);
    }
  }, [
    selectedWarehouse,
    currentPage,
    pageSize,
    productFilter,
    dateRangeFilter,
  ]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!selectedWarehouse) return;

    console.log(
      "StockAdjustments: Fetching products for warehouse ID:",
      selectedWarehouse,
      typeof selectedWarehouse
    );
    setLoading(true);
    try {
      const res = await axios.get("/api/produits", {
        params: {
          warehouse: selectedWarehouse,
          all: true,
          with_details: true,
          _cb: Date.now(),
        },
      });

      console.log("StockAdjustments: Raw Products API response:", res.data);

      // S'adapter aux différents formats de réponse possibles
      let productsData = [];
      if (res.data.produits) {
        productsData = res.data.produits;
      } else if (res.data.products) {
        productsData = res.data.products;
      } else if (Array.isArray(res.data)) {
        productsData = res.data;
      }

      console.log(
        "StockAdjustments: Filtered products before setting state:",
        productsData
      );
      setProducts(productsData);
    } catch (error) {
      console.error(
        "StockAdjustments: Error fetching products:",
        error.response || error.message || error
      );
      message.error(
        "Impossible de charger les produits du magasin sélectionné"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  // Initial data loading
  useEffect(() => {
    if (selectedWarehouse) {
      console.log(
        "Selected warehouse changed, fetching adjustments and products:",
        selectedWarehouse
      );
      setProducts([]);
      fetchAdjustments();
      fetchProducts();
    } else {
      console.log("No warehouse selected, clearing products list");
      setAdjustments([]);
      setProducts([]);
      setTotalItems(0);
    }
  }, [fetchAdjustments, fetchProducts, selectedWarehouse]);

  // Handle create/edit modal
  const openAdjustmentModal = (adjustmentId = null) => {
    setEditingAdjustmentId(adjustmentId);
    form.resetFields();

    if (adjustmentId) {
      // Edit mode - fetch adjustment details
      setLoading(true);
      axios
        .get(`/api/stock-adjustments/${adjustmentId}`)
        .then((res) => {
          const adjustmentData = res.data.adjustment;
          form.setFieldsValue({
            product_id: adjustmentData.product_id,
            quantity: Math.abs(adjustmentData.quantity),
            adjustment_type: adjustmentData.quantity > 0 ? "add" : "subtract",
            notes: adjustmentData.notes,
          });
        })
        .catch((error) => {
          console.error("Error fetching adjustment details:", error);
          message.error("Impossible de charger les détails de l'ajustement");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Create mode - set defaults
      form.setFieldsValue({
        adjustment_type: "add",
      });
    }

    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const quantity =
        values.adjustment_type === "add" ? values.quantity : -values.quantity;

      const formData = {
        company_id: selectedCompany,
        warehouse_id: selectedWarehouse,
        product_id: values.product_id,
        quantity: quantity,
        notes: values.notes,
      };

      let response;
      if (editingAdjustmentId) {
        response = await axios.put(
          `/api/stock-adjustments/${editingAdjustmentId}`,
          formData
        );
        message.success("Ajustement mis à jour avec succès");
      } else {
        response = await axios.post("/api/stock-adjustments", formData);
        message.success("Ajustement créé avec succès");
      }

      setModalVisible(false);
      fetchAdjustments();
    } catch (error) {
      console.error("Error submitting adjustment:", error);
      message.error("Erreur lors de l'enregistrement de l'ajustement");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete adjustment
  const handleDelete = async (adjustmentId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/stock-adjustments/${adjustmentId}`);
      message.success("Ajustement supprimé avec succès");
      fetchAdjustments();
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      message.error("Erreur lors de la suppression de l'ajustement");
    } finally {
      setLoading(false);
    }
  };

  // Define columns for adjustments table
  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) =>
        moment(a.created_at).unix() - moment(b.created_at).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: "Produit",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a, b) => a.product_name.localeCompare(b.product_name),
    },
    {
      title: "Type",
      dataIndex: "quantity",
      key: "adjustment_type",
      render: (quantity) => {
        const type = quantity > 0 ? "add" : "subtract";
        return (
          <Tag color={type === "add" ? "green" : "red"}>
            {type === "add" ? "Ajout" : "Retrait"}
          </Tag>
        );
      },
    },
    {
      title: "Quantité",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => (
        <span style={{ color: quantity > 0 ? "green" : "red" }}>
          {quantity > 0 ? "+" : ""}
          {formatNumber(quantity)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
    {
      title: "Créé par",
      dataIndex: "user_name",
      key: "user_name",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {hasPermission(
            "Gestion Commerciale.Stock.GestionStock.Adjust.edit"
          ) && (
            <Tooltip title="Modifier Ajustement">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openAdjustmentModal(record.id)}
              />
            </Tooltip>
          )}
          {hasPermission(
            "Gestion Commerciale.Stock.GestionStock.Adjust.delete"
          ) && (
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cet ajustement?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
              icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
              disabled={record.is_deletable === false}
            >
              <Tooltip title="Supprimer Ajustement">
                <Button
                  type="danger"
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={record.is_deletable === false}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="stock-adjustments-container">
      <Card
        title={
          <Title level={4} className="my-1 hidden sm:block">
            Ajustements de Stock
          </Title>
        }
        extra={
          hasPermission(
            "Gestion Commerciale.Stock.GestionStock.Adjust.create"
          ) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openAdjustmentModal()}
              disabled={!selectedWarehouse}
              className="w-full sm:w-auto mx-auto sm:mx-0"
              size="middle"
            >
              Nouvel Ajustement
            </Button>
          )
        }
      >
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Select
              allowClear
              showSearch
              placeholder="Filtrer par produit"
              style={{ width: "100%", maxWidth: "200px" }}
              value={productFilter}
              onChange={(value) => {
                setProductFilter(value);
                setCurrentPage(1);
              }}
              loading={loading}
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name || product.nom_produit}
                </Option>
              ))}
            </Select>
            <DatePicker.RangePicker
              placeholder={["Date début", "Date fin"]}
              value={dateRangeFilter}
              onChange={(dates) => {
                setDateRangeFilter(dates);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Button
              onClick={() => {
                setProductFilter(null);
                setDateRangeFilter(null);
                setCurrentPage(1);
              }}
              icon={<SyncOutlined />}
              className="w-full sm:w-auto mb-2"
            >
              Réinitialiser
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table
              dataSource={adjustments}
              columns={columns}
              rowKey="id"
              loading={loading}
              scroll={{ x: "max-content" }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalItems,
                onChange: (page) => setCurrentPage(page),
                onShowSizeChange: (_, size) => setPageSize(size),
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} ajustements`,
              }}
              sortDirections={["descend", "ascend"]}
              onChange={(pagination, filters, sorter) => {
                console.log("Sorter:", sorter);
              }}
            />
          </div>
        </Space>
      </Card>

      {/* Adjustment Form Modal */}
      <Modal
        title={`${
          editingAdjustmentId ? "Modifier" : "Créer"
        } un Ajustement de Stock`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20, maxWidth: 700 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ adjustment_type: "add" }}
        >
          <Form.Item
            name="product_id"
            label="Produit"
            rules={[{ required: true, message: "Produit requis" }]}
          >
            <Select
              placeholder={
                selectedWarehouse
                  ? "Sélectionner un produit"
                  : "Veuillez d'abord sélectionner un magasin"
              }
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={!!editingAdjustmentId || !selectedWarehouse}
              loading={loading}
              notFoundContent={
                loading ? (
                  <Spin size="small" />
                ) : products.length === 0 ? (
                  "Aucun produit disponible dans ce magasin"
                ) : (
                  "Aucun produit trouvé"
                )
              }
            >
              {products.map((product) => (
                <Option
                  key={product.id}
                  value={product.id}
                  label={product.name || product.nom_produit}
                >
                  {product.name || product.nom_produit}{" "}
                  {product.current_stock !== undefined ? (
                    <Tooltip
                      title={`Stock actuel: ${formatNumber(
                        product.current_stock
                      )}`}
                    >
                      <Text type="secondary">{` (Stock: ${formatNumber(
                        product.current_stock
                      )})`}</Text>
                    </Tooltip>
                  ) : (
                    ""
                  )}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="adjustment_type"
                label="Type d'ajustement"
                rules={[{ required: true, message: "Type requis" }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="add">Ajout au stock (+)</Option>
                  <Option value="subtract">Retrait du stock (-)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="quantity"
                label="Quantité (Absolue)"
                rules={[
                  { required: true, message: "Quantité requise" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "La quantité doit être positive",
                  },
                ]}
                tooltip="Entrez toujours une quantité positive. Le type d'ajustement détermine l'opération."
              >
                <InputNumber
                  min={0.01}
                  style={{ width: "100%" }}
                  placeholder="Quantité à ajouter/retirer"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Raison / Notes">
            <TextArea rows={3} placeholder="Raison de l'ajustement" />
          </Form.Item>

          <Row justify="end">
            <Space className="flex flex-col xs:flex-row w-full xs:w-auto gap-2">
              <Button
                onClick={() => setModalVisible(false)}
                className="mb-2 xs:mb-0 w-full xs:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loading}
                className="w-full xs:w-auto"
              >
                {editingAdjustmentId
                  ? "Mettre à Jour"
                  : "Enregistrer Ajustement"}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionStock;
