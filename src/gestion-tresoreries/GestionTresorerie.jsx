import React, { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  Table,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Typography,
  Tag,
  DatePicker,
  Select,
  Space,
  Button,
  Modal,
  message,
  Checkbox,
} from "antd";
import axios from "axios";
import { useSelection } from "../SelectionContext";
import dayjs from "dayjs"; // For date formatting
import {
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx"; // Added xlsx library
import qs from "qs"; // <-- Import qs

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Helper function to format currency (assuming CFA)
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return typeof amount === "string" ? amount : "N/A";
  }
  return numericAmount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "XOF", // Assuming CFA Franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Helper function to get mode type from active key
const getModeTypeFromKey = (key) => {
  switch (key) {
    case "caisse":
      return "cash";
    case "banque":
      return "bank";
    case "mobile":
      return "mobile";
    default:
      return null;
  }
};

const GestionTresorerie = () => {
  const { selectedCompany, selectedWarehouse } = useSelection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    caisse: { dateRange: null, userId: null },
    banque: { dateRange: null, userId: null },
    mobile: { dateRange: null, userId: null },
  });
  const [activeTabKey, setActiveTabKey] = useState("caisse"); // Track active tab

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPaymentDetail, setCurrentPaymentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // State for total balance feature
  const [showTotalBalance, setShowTotalBalance] = useState(false);
  const [totalBalanceData, setTotalBalanceData] = useState({
    totalIncoming: 0,
    totalOutgoing: 0,
    count: 0,
  });
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // State for export loading

  // Fetch Payment Modes
  useEffect(() => {
    const fetchPaymentModes = async () => {
      if (!selectedCompany) {
        setPaymentModes([]);
        return;
      }
      try {
        const response = await axios.get("/api/payment-modes", {
          params: { company_id: selectedCompany, limit: 500 }, // Fetch all modes for the company
        });
        setPaymentModes(response.data.paymentModes || []);
      } catch (err) {
        console.error("Error fetching payment modes:", err);
        // Handle error appropriately, maybe set an error state
      }
    };
    fetchPaymentModes();
  }, [selectedCompany]);

  // Fetch Payments & Extract Users
  useEffect(() => {
    const fetchPayments = async () => {
      if (!selectedCompany || !selectedWarehouse || !paymentModes.length) {
        // Ensure paymentModes are loaded
        setPayments([]);
        setUsers([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
        return;
      }

      // Determine mode IDs based on the active tab
      const currentModeType = getModeTypeFromKey(activeTabKey);
      const modeIds = paymentModes
        .filter((mode) => mode.mode_type === currentModeType)
        .map((mode) => mode.id);

      // If no modes exist for this type, don't fetch (or handle as needed)
      if (modeIds.length === 0) {
        console.warn(`No payment modes found for type: ${currentModeType}.`);
        setPayments([]);
        setUsers([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
        setLoading(false); // Ensure loading is stopped
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Apply local filters (date, user) to params
        const currentLocalFilters = filters[activeTabKey];
        const apiParams = {
          company_id: selectedCompany,
          warehouse_id: selectedWarehouse,
          page: pagination.current,
          limit: pagination.pageSize,
          payment_mode_ids: modeIds, // <-- Send mode IDs for the active tab
        };

        if (
          currentLocalFilters.dateRange &&
          currentLocalFilters.dateRange[0] &&
          currentLocalFilters.dateRange[1]
        ) {
          apiParams.date_from = dayjs(currentLocalFilters.dateRange[0])
            .startOf("day")
            .format("YYYY-MM-DD");
          apiParams.date_to = dayjs(currentLocalFilters.dateRange[1])
            .endOf("day")
            .format("YYYY-MM-DD");
        }
        if (currentLocalFilters.userId) {
          apiParams.user_id = currentLocalFilters.userId;
        }

        console.log(
          `[Fetch Payments] Fetching for tab ${activeTabKey} with params:`,
          apiParams
        );

        const response = await axios.get("/api/payments", {
          params: apiParams, // Use the combined params
          // Use the same serializer as for totals
          paramsSerializer: (params) => {
            return qs.stringify(params, { arrayFormat: "repeat" });
          },
        });

        const fetchedPayments = response.data.payments || [];
        setPayments(fetchedPayments);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
        }));

        const uniqueUsers = fetchedPayments.reduce((acc, payment) => {
          if (
            payment.user_id &&
            payment.entity_name &&
            !acc.some((user) => user.id === payment.user_id)
          ) {
            acc.push({ id: payment.user_id, name: payment.entity_name });
          }
          return acc;
        }, []);
        setUsers(uniqueUsers);
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError(
          "Erreur lors de la récupération des paiements. Veuillez réessayer."
        );
        setPayments([]);
        setUsers([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [
    selectedCompany,
    selectedWarehouse,
    pagination.current,
    pagination.pageSize,
    activeTabKey,
    paymentModes,
    filters,
  ]);

  const handleFilterChange = (filterType, value) => {
    // Apply filter change to the currently active tab
    setFilters((prevFilters) => ({
      ...prevFilters,
      [activeTabKey]: {
        ...prevFilters[activeTabKey],
        [filterType]: value,
      },
    }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Simplified: This function is now less critical as filtering is mostly backend
  // We can use it to apply any *extra* client-side logic if needed in future
  // For now, it just returns the current payments state which should be tab-specific
  const getFilteredPayments = () => {
    // Basic client-side filtering (e.g., for quick search within the page if added later)
    // For now, the main filtering (mode, date, user) happens on the backend.
    // Let's still apply date/user filters here just in case backend missed something or for consistency
    // Note: This might become redundant if backend filtering is perfect.

    let filtered = [...payments]; // Start with data fetched for the current tab

    // Apply local filters (date, user) - redundant if backend handles it perfectly
    const localFilters = filters[activeTabKey];
    const dateRange = localFilters?.dateRange;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dayjs(dateRange[0]).startOf("day");
      const endDate = dayjs(dateRange[1]).endOf("day");
      filtered = filtered.filter((payment) => {
        const paymentDate = dayjs(payment.date);
        return (
          paymentDate.isAfter(startDate.subtract(1, "day")) &&
          paymentDate.isBefore(endDate.add(1, "day"))
        );
      });
    }

    const userId = localFilters?.userId;
    if (userId) {
      filtered = filtered.filter((payment) => payment.user_id === userId);
    }

    return filtered;
  };

  // Get data for the current tab (already fetched filtered by backend)
  // Apply further client-side filtering if needed
  const tabData = getFilteredPayments();

  // Calculate page totals based on the DATA ACTUALLY DISPLAYED for the active tab
  let pageIncoming = 0;
  let pageOutgoing = 0;
  let activeTabData = [];

  switch (activeTabKey) {
    case "caisse":
    case "banque":
    case "mobile":
      // Use the filtered data for the current tab directly
      activeTabData = tabData;
      break;
    default:
      activeTabData = [];
  }

  activeTabData.forEach((p) => {
    const amount = parseFloat(p.amount || 0);
    if (!isNaN(amount)) {
      if (p.payment_type === "in") {
        pageIncoming += amount;
      } else if (p.payment_type === "out") {
        pageOutgoing += amount;
      }
    }
  });

  const pageNetBalance = pageIncoming - pageOutgoing;

  const handleTableChange = (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
  };

  const fetchAndShowPaymentDetails = useCallback(async (paymentId) => {
    setLoadingDetail(true);
    setDetailModalVisible(true);
    try {
      const response = await axios.get(`/api/payments/${paymentId}`);
      setCurrentPaymentDetail(response.data);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      message.error("Erreur lors du chargement des détails du paiement.");
      setDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const columns = [
    {
      title: "Date de Paiement",
      dataIndex: "date",
      key: "date",
      render: (text) => (text ? dayjs(text).format("DD-MM-YYYY") : "N/A"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: "descend",
      width: 130,
    },
    {
      title: "Numéro de référence",
      dataIndex: "payment_number",
      key: "payment_number",
      render: (text, record) => (
        <Button
          type="link"
          style={{ padding: 0, height: "auto", lineHeight: "inherit" }}
          onClick={() => fetchAndShowPaymentDetails(record.id)}
        >
          {text}
        </Button>
      ),
      ellipsis: true,
      width: 170,
    },
    {
      title: "Type de paiement",
      dataIndex: "payment_type",
      key: "payment_type",
      render: (type) =>
        type === "in" ? (
          <Tag color="green">Paiement entrant</Tag>
        ) : type === "out" ? (
          <Tag color="red">Paiement sortant</Tag>
        ) : (
          <Tag>Inconnu</Tag>
        ),
      width: 150,
    },
    {
      title: "Entité",
      dataIndex: "entity_name",
      key: "entity_name",
      render: (name, record) =>
        name || (record.user_id ? `Utilisateur ID: ${record.user_id}` : "N/A"),
      ellipsis: true,
      width: 200,
    },
    {
      title: "Mode Type",
      dataIndex: "payment_mode_name",
      key: "payment_mode_name",
      render: (name, record) =>
        name ||
        (record.payment_mode_id ? `Mode ID: ${record.payment_mode_id}` : "N/A"),
      responsive: ["sm"],
      ellipsis: true,
      width: 150,
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>,
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
      width: 120,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      responsive: ["md"],
      width: 250,
    },
  ];

  const renderPaymentTable = (dataSource) => (
    <>
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handleTableChange,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          size="small"
          bordered
        />
      </div>
      <Text type="secondary" className="mt-2 block">
        Filtres appliqués sur les {dataSource.length} enregistrements de cette
        page. Total général: {pagination.total}.
      </Text>
    </>
  );

  // Component for the filters
  const TabFilters = () => (
    <Space
      // On xs screens, flex-col ensures vertical stacking. items-stretch helps if heights differ.
      // On sm+ screens, flex-row arranges them horizontally. items-center vertically aligns them.
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
      wrap // Allow wrapping if sm:flex-row still doesn't have enough space (less likely with w-auto)
    >
      <RangePicker
        value={filters[activeTabKey]?.dateRange}
        onChange={(dates) => handleFilterChange("dateRange", dates)}
        format="DD/MM/YYYY"
        allowClear
        className="w-full" // Full width when stacked (xs), auto on sm+ is handled by Space parent
        size="middle"
      />
      <Select
        allowClear
        className="w-full min-w-[200px] sm:min-w-0" // Full width when stacked, allow shrink on sm+
        placeholder="Filtrer par utilisateur"
        value={filters[activeTabKey]?.userId}
        onChange={(value) => handleFilterChange("userId", value)}
        showSearch
        optionFilterProp="children"
        size="middle"
      >
        {users.map((user) => (
          <Option key={user.id} value={user.id}>
            {user.name}
          </Option>
        ))}
      </Select>
      <Button
        icon={<FileExcelOutlined style={{ color: "#217346" }} />}
        onClick={handleExport}
        loading={exportLoading}
        disabled={loading || loadingTotals || exportLoading}
        className="w-full" // Full width when stacked
        size="middle"
      >
        {showTotalBalance ? "Exporter Tout" : "Exporter Page"}
      </Button>
    </Space>
  );

  // Calculate Net Balance based on mode (page or total)
  const displayNetBalance = showTotalBalance
    ? totalBalanceData.totalIncoming - totalBalanceData.totalOutgoing
    : pageNetBalance;
  const displayIncoming = showTotalBalance
    ? totalBalanceData.totalIncoming
    : pageIncoming;
  const displayOutgoing = showTotalBalance
    ? totalBalanceData.totalOutgoing
    : pageOutgoing;

  // Fetch total balances based on current filters for the active tab
  const fetchTotalBalances = useCallback(async () => {
    const modeType = getModeTypeFromKey(activeTabKey);
    if (
      !selectedCompany ||
      !selectedWarehouse ||
      !modeType ||
      !showTotalBalance
    ) {
      // Reset totals if context is missing or checkbox is off
      setTotalBalanceData({ totalIncoming: 0, totalOutgoing: 0, count: 0 });
      setLoadingTotals(false);
      return;
    }

    setLoadingTotals(true);
    setError(null); // Clear previous errors

    const currentFilters = filters[activeTabKey];
    const modeIds = paymentModes
      .filter((mode) => mode.mode_type === modeType)
      .map((mode) => mode.id);

    // If no modes exist for this type, don't fetch totals
    if (!modeIds.length) {
      setTotalBalanceData({ totalIncoming: 0, totalOutgoing: 0, count: 0 });
      setLoadingTotals(false);
      console.warn(
        `No payment modes found for type: ${modeType}. Skipping total balance fetch.`
      );
      return;
    }

    try {
      const params = {
        company_id: selectedCompany,
        warehouse_id: selectedWarehouse,
        payment_mode_ids: modeIds, // Send the array directly
      };

      if (
        currentFilters.dateRange &&
        currentFilters.dateRange[0] &&
        currentFilters.dateRange[1]
      ) {
        params.startDate = dayjs(currentFilters.dateRange[0])
          .startOf("day")
          .toISOString();
        params.endDate = dayjs(currentFilters.dateRange[1])
          .endOf("day")
          .toISOString();
      }
      if (currentFilters.userId) {
        params.user_id = currentFilters.userId;
      }

      console.log("Fetching total balances with params:", params); // Debug log

      // *** IMPORTANT: This assumes a backend endpoint '/api/payments/totals' exists ***
      // It should accept the params above and return { totalIncoming, totalOutgoing, count }
      // based on querying the database with the provided filters across all pages.
      const response = await axios.get("/api/payments/totals", {
        params,
        // Explicitly serialize array parameters
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "repeat" }); // Format as key=value1&key=value2
        },
      });

      console.log("Total balances response:", response.data); // Debug log

      setTotalBalanceData({
        totalIncoming: response.data.totalIncoming || 0,
        totalOutgoing: response.data.totalOutgoing || 0,
        count: response.data.count || 0,
      });
    } catch (err) {
      console.error("Error fetching total balances:", err);
      setError("Erreur lors du calcul des soldes totaux.");
      setTotalBalanceData({ totalIncoming: 0, totalOutgoing: 0, count: 0 }); // Reset on error
    } finally {
      setLoadingTotals(false);
    }
  }, [
    activeTabKey,
    filters,
    selectedCompany,
    selectedWarehouse,
    paymentModes,
    showTotalBalance,
  ]); // Added showTotalBalance dependency

  // Effect to fetch totals when checkbox is checked or filters/context change while checked
  useEffect(() => {
    if (showTotalBalance) {
      fetchTotalBalances();
    } else {
      // Optionally reset totals when checkbox is unchecked
      // setTotalBalanceData({ totalIncoming: 0, totalOutgoing: 0, count: 0 });
    }
  }, [showTotalBalance, fetchTotalBalances]); // fetchTotalBalances includes all its own dependencies

  const handleExport = async () => {
    // Make the function async
    if (exportLoading) return; // Prevent multiple clicks while exporting

    const currentModeType = getModeTypeFromKey(activeTabKey);
    let sheetName = "Export";
    switch (activeTabKey) {
      case "caisse":
        sheetName = "Caisse";
        break;
      case "banque":
        sheetName = "Banque";
        break;
      case "mobile":
        sheetName = "Mobile";
        break;
    }

    const exportType = showTotalBalance ? "Tout" : "Page";
    const messageKey = `export-${exportType}`;
    message.loading({
      content: `Préparation de l'export (${exportType})...`,
      key: messageKey,
    });
    setExportLoading(true);

    let dataToExport = [];
    let fetchError = null;

    try {
      if (showTotalBalance) {
        // Fetch all data based on filters
        const currentFilters = filters[activeTabKey];
        const modeIds = paymentModes
          .filter((mode) => mode.mode_type === currentModeType)
          .map((mode) => mode.id);

        if (!modeIds.length && currentModeType !== "all") {
          message.warning({
            content: `Aucun mode de paiement trouvé pour le type: ${currentModeType}`,
            key: messageKey,
          });
          setExportLoading(false);
          return;
        }

        const params = {
          company_id: selectedCompany,
          warehouse_id: selectedWarehouse,
          limit: 10000, // Fetch a large number to get all records
          page: 1,
          payment_mode_ids: modeIds, // Send mode IDs if needed (check if backend supports this for GET /payments)
          // Add other filters
          ...(currentFilters.dateRange &&
            currentFilters.dateRange[0] &&
            currentFilters.dateRange[1] && {
              date_from: dayjs(currentFilters.dateRange[0])
                .startOf("day")
                .format("YYYY-MM-DD"),
              date_to: dayjs(currentFilters.dateRange[1])
                .endOf("day")
                .format("YYYY-MM-DD"),
            }),
          ...(currentFilters.userId && { user_id: currentFilters.userId }),
        };

        console.log("Exporting all data with params:", params);

        const response = await axios.get("/api/payments", {
          params,
          // Ensure backend can handle array parameters correctly if needed
          // paramsSerializer: params => {
          //   const qs = require('qs');
          //   return qs.stringify(params, { arrayFormat: 'comma' });
          // }
        });
        dataToExport = response.data.payments || [];
        console.log(`Fetched ${dataToExport.length} records for full export.`);
      } else {
        // Use current page data
        switch (activeTabKey) {
          case "caisse":
          case "banque":
          case "mobile":
            dataToExport = tabData;
            break;
          default:
            dataToExport = [];
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        message.warning({
          content: `Aucune donnée à exporter pour l'onglet ${sheetName} (${exportType}).`,
          key: messageKey,
        });
        setExportLoading(false);
        return;
      }

      // Format data for export with separate amount and currency
      const formattedData = dataToExport.map((payment) => ({
        "Date de Paiement": payment.date
          ? dayjs(payment.date).format("DD/MM/YYYY")
          : "N/A",
        "Numéro de référence": payment.payment_number || "N/A",
        Type:
          payment.payment_type === "in"
            ? "Entrant"
            : payment.payment_type === "out"
            ? "Sortant"
            : "Inconnu",
        Entité:
          payment.entity_name ||
          (payment.user_id ? `Utilisateur ID: ${payment.user_id}` : "N/A"),
        "Mode de Paiement":
          payment.payment_mode_name ||
          (payment.payment_mode_id
            ? `Mode ID: ${payment.payment_mode_id}`
            : "N/A"),
        Montant: parseFloat(payment.amount || 0), // Keep amount as number
        Devise: "XOF", // Add currency column
        Notes: payment.notes || "",
        Magasin: payment.warehouse_name || "N/A",
        Entreprise: payment.company_name || "N/A",
      }));

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Adjust column widths (add currency column)
      const columnWidths = [
        { wch: 15 }, // Date
        { wch: 20 }, // Ref
        { wch: 10 }, // Type
        { wch: 25 }, // Entité
        { wch: 20 }, // Mode
        { wch: 15 }, // Montant
        { wch: 8 }, // Devise (New)
        { wch: 30 }, // Notes
        { wch: 20 }, // Magasin
        { wch: 20 }, // Entreprise
      ];
      worksheet["!cols"] = columnWidths;

      // Format Montant column as number (no currency symbol)
      Object.keys(worksheet).forEach((cellRef) => {
        // Assuming 'F' is Montant column (index 5)
        if (cellRef.match(/^F(\d+)$/) && cellRef !== "F1") {
          worksheet[cellRef].t = "n"; // number type
          worksheet[cellRef].z = "#,##0"; // Basic number format
        }
      });

      // Generate file name
      const fileName = `Tresorerie_${sheetName}_${exportType}_${dayjs().format(
        "YYYYMMDD_HHmmss"
      )}.xlsx`;

      // Trigger download
      XLSX.writeFile(workbook, fileName);

      message.success({
        content: `Export vers "${fileName}" (${exportType}) réussi!`,
        key: messageKey,
        duration: 5,
      });
    } catch (err) {
      fetchError = err;
      console.error(`Error during Excel export (${exportType}):`, err);
      message.error({
        content: `Erreur lors de la création du fichier Excel (${exportType}).`,
        key: messageKey,
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <Title level={3} className="mb-4 text-center sm:text-left">
        Gestion de la Trésorerie
      </Title>

      {!selectedCompany || !selectedWarehouse ? (
        <Alert
          message="Veuillez sélectionner une entreprise et un magasin pour afficher les données de trésorerie."
          type="info"
          showIcon
        />
      ) : (
        <>
          {/* Checkbox for Total Balance */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Checkbox
              checked={showTotalBalance}
              onChange={(e) => setShowTotalBalance(e.target.checked)}
              disabled={loading} // Disable while page is loading
            >
              Afficher les soldes totaux (toutes pages) pour les filtres actifs
            </Checkbox>
            {loadingTotals && <Spin size="small" className="ml-2" />}
          </div>

          <Row gutter={[16, 16]} className="mb-5">
            <Col xs={24} sm={24} md={8}>
              <Card bordered={false} size="small" className="h-full">
                {/* Use loadingTotals specifically for total balance display */}
                <Spin spinning={showTotalBalance ? loadingTotals : loading}>
                  <Title level={5} className="mb-1">
                    Solde Entrant{" "}
                    {showTotalBalance ? "(Total Filtres)" : "(Page)"}
                  </Title>
                  <Text className="text-2xl text-green-600">
                    {formatCurrency(displayIncoming)}
                  </Text>
                  {showTotalBalance && (
                    <Text type="secondary" className="block text-sm">
                      {" "}
                      ({totalBalanceData.count} paiements)
                    </Text>
                  )}
                </Spin>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Card bordered={false} size="small" className="h-full">
                <Spin spinning={showTotalBalance ? loadingTotals : loading}>
                  <Title level={5} className="mb-1">
                    Solde Sortant{" "}
                    {showTotalBalance ? "(Total Filtres)" : "(Page)"}
                  </Title>
                  <Text className="text-2xl text-red-600">
                    {formatCurrency(displayOutgoing)}
                  </Text>
                  {showTotalBalance && (
                    <Text type="secondary" className="block text-sm">
                      {" "}
                      ({totalBalanceData.count} paiements)
                    </Text>
                  )}
                </Spin>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Card bordered={false} size="small" className="h-full">
                <Spin spinning={showTotalBalance ? loadingTotals : loading}>
                  <Title level={5} className="mb-1">
                    Solde Net {showTotalBalance ? "(Total Filtres)" : "(Page)"}
                  </Title>
                  <Text
                    className={`text-2xl ${
                      displayNetBalance >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(displayNetBalance)}
                  </Text>
                  {showTotalBalance && (
                    <Text type="secondary" className="block text-sm">
                      {" "}
                      ({totalBalanceData.count} paiements)
                    </Text>
                  )}
                </Spin>
              </Card>
            </Col>
          </Row>

          {error && (
            <Alert message={error} type="error" showIcon className="mb-4" />
          )}

          {/* Filters for small screens (xs) - displayed ABOVE Tabs */}
          <div className="mb-4 sm:hidden">
            <TabFilters />
          </div>

          <div className="overflow-x-auto w-full">
            <Tabs
              defaultActiveKey="caisse"
              activeKey={activeTabKey}
              onChange={(key) => {
                setActiveTabKey(key);
                if (showTotalBalance) {
                  fetchTotalBalances();
                }
              }}
              // Filters for sm screens and up - displayed in tabBarExtraContent
              tabBarExtraContent={
                <div className="hidden sm:flex">
                  <TabFilters />
                </div>
              }
            >
              <TabPane tab="Caisse" key="caisse">
                {renderPaymentTable(tabData)}
              </TabPane>
              <TabPane tab="Banque" key="banque">
                {renderPaymentTable(tabData)}
              </TabPane>
              <TabPane tab="Mobile" key="mobile">
                {renderPaymentTable(tabData)}
                {!paymentModes.some((m) => m.mode_type === "mobile") &&
                  !loading && (
                    <Alert
                      message="Aucun mode de paiement de type 'Mobile' configuré pour cette entreprise."
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}
              </TabPane>
            </Tabs>
          </div>
        </>
      )}

      <Modal
        title="Détail du paiement"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Fermer
          </Button>,
        ]}
        width="95%"
        style={{ top: 20, maxWidth: 700 }}
        destroyOnClose
      >
        <Spin spinning={loadingDetail}>
          {currentPaymentDetail ? (
            <div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Informations générales">
                    <p>
                      <FileTextOutlined /> <strong>No Transaction:</strong>{" "}
                      {currentPaymentDetail.payment_number}
                    </p>
                    <p>
                      <CalendarOutlined /> <strong>Date:</strong>{" "}
                      {currentPaymentDetail.date
                        ? dayjs(currentPaymentDetail.date).format("DD/MM/YYYY")
                        : "N/A"}
                    </p>
                    <p>
                      <UserOutlined /> <strong>Entité:</strong>{" "}
                      {currentPaymentDetail.entity_name ||
                        (currentPaymentDetail.user_id
                          ? `ID: ${currentPaymentDetail.user_id}`
                          : "N/A")}
                    </p>
                    <p>
                      <BankOutlined /> <strong>Mode de paiement:</strong>{" "}
                      {currentPaymentDetail.payment_mode_name || "N/A"}
                    </p>
                    <p>
                      <strong>Type:</strong>{" "}
                      {currentPaymentDetail.payment_type === "in" ? (
                        <Tag color="green">Entrant</Tag>
                      ) : currentPaymentDetail.payment_type === "out" ? (
                        <Tag color="red">Sortant</Tag>
                      ) : (
                        "N/A"
                      )}
                    </p>
                    <p>
                      <strong>Montant:</strong>{" "}
                      <Text strong>
                        {formatCurrency(currentPaymentDetail.amount)}
                      </Text>
                    </p>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Informations complémentaires">
                    <p>
                      <strong>Magasin:</strong>{" "}
                      {currentPaymentDetail.warehouse_name || "N/A"}
                    </p>
                    <p>
                      <strong>Entreprise:</strong>{" "}
                      {currentPaymentDetail.company_name || "N/A"}
                    </p>
                    <p>
                      <strong>Remarques:</strong>{" "}
                      {currentPaymentDetail.notes || (
                        <Text type="secondary">Aucune</Text>
                      )}
                    </p>
                    {currentPaymentDetail.staff_user_id && (
                      <p>
                        <strong>Staff ID:</strong>{" "}
                        {currentPaymentDetail.staff_user_id}
                      </p>
                    )}
                  </Card>
                </Col>
              </Row>

              {currentPaymentDetail.orders &&
                currentPaymentDetail.orders.length > 0 && (
                  <Card
                    size="small"
                    title="Commandes associées"
                    className="mt-4"
                  >
                    <div className="overflow-x-auto">
                      <Table
                        dataSource={currentPaymentDetail.orders}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: "max-content" }}
                        columns={[
                          {
                            title: "No Facture",
                            dataIndex: "invoice_number",
                            key: "invoice_number",
                          },
                          {
                            title: "Montant Total Cde",
                            dataIndex: "total",
                            key: "total",
                            render: (amount) => formatCurrency(amount),
                          },
                          {
                            title: "Montant Payé (ce paiement)",
                            dataIndex: "amount", // This likely comes from the payment_order pivot table
                            key: "amount",
                            render: (amount) => {
                              // Simplify render function
                              // The 'amount' comes directly from the record (order_payments entry)
                              return formatCurrency(amount ?? "N/A");
                            },
                          },
                          {
                            title: "Statut Cde Après",
                            dataIndex: "payment_status",
                            key: "payment_status",
                            render: (status) => {
                              let color = "";
                              let displayText = status;
                              if (!status) return <Tag>N/A</Tag>;

                              const lowerStatus = status.toLowerCase();

                              if (
                                lowerStatus === "non payé" ||
                                lowerStatus === "unpaid"
                              ) {
                                color = "red";
                                displayText = "Non payé";
                              } else if (
                                lowerStatus === "partiel" ||
                                lowerStatus === "partially paid"
                              ) {
                                color = "orange";
                                displayText = "Partiellement payé";
                              } else if (
                                lowerStatus === "payé" ||
                                lowerStatus === "paid"
                              ) {
                                color = "green";
                                displayText = "Payé";
                              } else {
                                color = "default"; // Or another default color
                              }
                              return <Tag color={color}>{displayText}</Tag>;
                            },
                          },
                        ]}
                      />
                    </div>
                  </Card>
                )}
            </div>
          ) : (
            <p>Chargement des détails...</p>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default GestionTresorerie;
