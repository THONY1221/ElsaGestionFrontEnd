import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Spin,
  Alert,
  Typography,
  Empty,
  List,
  Avatar,
  Tag,
  Tooltip as AntTooltip,
  Statistic,
  Skeleton,
  Button,
  Radio,
} from "antd";
import { Column } from "@ant-design/charts";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  RiseOutlined,
  FallOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  CalculatorOutlined,
  SyncOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useSelection } from "../SelectionContext";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- Fonction utilitaire pour formater en devise (Exemple simple pour CFA) ---
const formatCurrency = (amount, currency = "CFA") => {
  // Ensure amount is a number, default to 0 if not
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    // Return "N/A" or "0 CFA" based on preference for invalid input
    // Let's return formatted 0 for consistency on charts
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const Dashboard = () => {
  const { selectedCompany, selectedWarehouse, setSelectedWarehouse } =
    useSelection();
  const { user } = useAuth(); // Get user from AuthContext
  // const companyId = user?.company_id; // No longer needed for this logic

  // --- États pour les Filtres ---
  // Remove local warehouses state fetched by API
  // const [warehouses, setWarehouses] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "days"),
    dayjs(),
  ]);

  // --- DERIVED State for Warehouse Filter based on AuthContext ---
  const warehousesForFilter = useMemo(() => {
    if (!user || !Array.isArray(user.assigned_warehouses) || !selectedCompany) {
      return [];
    }
    // Filter the user's assigned warehouses by the currently selected company
    return user.assigned_warehouses.filter(
      (wh) => wh.company_id === selectedCompany
    );
  }, [user, selectedCompany]);
  // --- End DERIVED State ---

  // --- États pour les Données et le Chargement ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totals: null,
    salesPurchasesChart: null,
    topSellingProducts: null,
    topCustomers: null,
    stockAlerts: null,
    paymentsChart: null,
    grossMargin: null,
    averageOrderValue: null,
    stockTurnover: null,
    expenseBreakdown: null,
    stockValuation: null,
  });

  // Nouvel état pour suivre les catégories désactivées dans la légende du PieChart
  const [inactiveCategories, setInactiveCategories] = useState([]);
  // Nouvel état pour l'effet de survol du PieChart
  const [activePieIndex, setActivePieIndex] = useState(null);

  // State for Sales/Purchases chart line visibility
  const [salesPurchasesFilter, setSalesPurchasesFilter] = useState("Tous"); // "Tous", "Ventes", "Achats"

  // State for Payments chart line visibility
  const [paymentsFilter, setPaymentsFilter] = useState("Tous"); // "Tous", "Reçus", "Envoyés"

  // --- Fonction utilitaire pour formater la date sur l'axe X ---
  const formatDateTick = (tickItem) => {
    // tickItem est un timestamp ou une chaîne de date
    return dayjs(tickItem).format("DD/MM"); // Format court jj/mm
  };

  // --- Fonction utilitaire pour formater les valeurs sur l'axe Y ---
  const formatYAxisTick = (tickItem) => {
    // Simplifier les grands nombres (ex: 1500000 -> 1.5M)
    if (tickItem >= 1000000) {
      return `${(tickItem / 1000000).toFixed(1)}M`;
    }
    if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(0)}k`;
    }
    return tickItem;
  };

  // --- Fonction pour charger toutes les données du dashboard ---
  const fetchDashboardData = useCallback(async () => {
    // Use selectedCompany as the definitive source for the current company ID
    const currentCompanyId = selectedCompany;
    if (
      !currentCompanyId ||
      !dateRange ||
      dateRange.length !== 2 ||
      !dateRange[0] ||
      !dateRange[1]
    ) {
      console.log(
        "Dashboard Fetch: Prérequis non remplis (company, dateRange). Annulation.",
        { currentCompanyId, dateRange }
      );
      // Reset data to initial state if prerequisites are not met
      setDashboardData({
        totals: null,
        salesPurchasesChart: null,
        topSellingProducts: null,
        topCustomers: null,
        stockAlerts: null,
        paymentsChart: null,
        grossMargin: null,
        averageOrderValue: null,
        stockTurnover: null,
        expenseBreakdown: null,
        stockValuation: null,
      });
      setLoading(false); // Ensure loading is turned off
      return;
    }

    setLoading(true);
    setError(null);
    const params = {
      companyId: currentCompanyId,
      startDate: dateRange[0].format("YYYY-MM-DD"),
      endDate: dateRange[1].format("YYYY-MM-DD"),
      // Ensure warehouseId is a number if selected, otherwise undefined
      warehouseId: selectedWarehouse ? Number(selectedWarehouse) : undefined,
    };

    console.log("Dashboard Fetch: Début avec params:", params);

    try {
      const endpoints = [
        { key: "totals", url: "/api/dashboard/totals" },
        {
          key: "salesPurchasesChart",
          url: "/api/dashboard/sales-purchases-chart",
        },
        {
          key: "topSellingProducts",
          url: "/api/dashboard/top-selling-products",
          params: { limit: 5 },
        },
        {
          key: "topCustomers",
          url: "/api/dashboard/top-customers",
          params: { limit: 5 },
        },
        {
          key: "stockAlerts",
          url: "/api/dashboard/stock-alerts",
          params: { limit: 10 },
        },
        { key: "paymentsChart", url: "/api/dashboard/payments-chart" },
        { key: "grossMargin", url: "/api/dashboard/gross-margin" },
        { key: "averageOrderValue", url: "/api/dashboard/average-order-value" },
        { key: "stockTurnover", url: "/api/dashboard/stock-turnover" },
        { key: "expenseBreakdown", url: "/api/dashboard/expense-breakdown" },
        { key: "stockValuation", url: "/api/dashboard/stock-valuation" },
      ];

      const requests = endpoints.map((ep) =>
        axios
          .get(ep.url, { params: { ...params, ...(ep.params || {}) } })
          .catch((err) => {
            console.error(`API Error for ${ep.key}:`, {
              message: err.message,
              url: ep.url,
              params: { ...params, ...(ep.params || {}) },
              responseStatus: err.response?.status,
              responseData: err.response?.data,
            });
            // Return a structured error object
            return {
              key: ep.key,
              error: true,
              message:
                err.response?.data?.error ||
                err.response?.data?.message ||
                `Erreur chargement ${ep.key}: ${err.message}`,
              status: err.response?.status,
            };
          })
      );

      const results = await Promise.all(requests);

      console.log("Dashboard Fetch: Résultats bruts API:", results);

      const newData = {};
      const errors = []; // Collect specific errors

      results.forEach((res, index) => {
        const key = endpoints[index].key;
        if (res.error) {
          console.error(
            `Erreur API traitée pour ${key}:`,
            res.message,
            `(Status: ${res.status || "N/A"})`
          );
          newData[key] = null; // Ensure data is null on error
          errors.push(`${key}: ${res.message}`); // Collect error message
        } else if (
          res.data &&
          res.data.data !== undefined &&
          res.data.data !== null
        ) {
          // Primary case: data is correctly nested
          newData[key] = res.data.data;
          // Add specific data structure validations if necessary
          if (key === "salesPurchasesChart" || key === "paymentsChart") {
            if (!res.data.data.labels || !Array.isArray(res.data.data.labels)) {
              console.warn(
                `Structure invalide pour ${key}: 'labels' manquant ou n'est pas un tableau.`
              );
              newData[key] = null;
              errors.push(`${key}: Structure de données invalide (labels)`);
            }
          } else if (
            key === "expenseBreakdown" &&
            !Array.isArray(res.data.data)
          ) {
            console.warn(
              `Structure invalide pour ${key}: la donnée n'est pas un tableau.`
            );
            newData[key] = null;
            errors.push(
              `${key}: Structure de données invalide (attendu tableau)`
            );
          } else if (key === "stockValuation") {
            if (
              res.data.data.totalStockValueCost === undefined ||
              res.data.data.totalStockValueSale === undefined
            ) {
              console.warn(`Structure invalide pour ${key}: champs manquants.`);
              newData[key] = null;
              errors.push(`${key}: Structure de données invalide`);
            } else {
              newData[key] = res.data.data;
            }
          }
          // ... other validations
        } else if (
          key === "totals" &&
          res.data &&
          res.data.totalSales !== undefined
        ) {
          // Specific fallback for 'totals' if not nested under 'data'
          console.warn(
            `Structure 'totals' détectée directement dans res.data pour ${key}. Adaptation.`
          );
          newData[key] = {
            // Reconstruct the object as expected by the frontend
            totalSales: res.data.totalSales,
            totalPurchases: res.data.totalPurchases,
            totalExpenses: res.data.totalExpenses,
            totalPaymentsReceived: res.data.totalPaymentsReceived,
            totalPaymentsSent: res.data.totalPaymentsSent,
            // Add other expected fields if any
          };
        } else {
          // Case where res.data is present but res.data.data is missing/null (excluding handled 'totals' case)
          console.warn(
            `Données attendues (res.data.data) manquantes, nulles ou vides pour ${key}. Réponse reçue:`,
            res.data
          );
          newData[key] = null; // Set to null for consistency
          // Optionally consider this an error depending on the endpoint's importance
          // errors.push(`${key}: Données manquantes ou vides`);
        }
      });

      console.log("Dashboard Fetch: Données traitées (newData):", newData);
      console.log("Dashboard Fetch: Erreurs collectées:", errors);

      setDashboardData(newData); // Update state with potentially partial data

      if (errors.length > 0) {
        // Aggregate error messages for display
        const aggregateErrorMessage = errors.join("; ");
        setError(
          `Certaines données n'ont pas pu être chargées: ${aggregateErrorMessage}`
        );
      }
    } catch (err) {
      // Catch unexpected errors (e.g., network issues before requests start, synchronous errors)
      console.error(
        "Erreur générale non interceptée dans fetchDashboardData:",
        err
      );
      setError(
        "Une erreur inattendue est survenue lors du chargement: " + err.message
      );
      // Reset all data on catastrophic failure
      setDashboardData({
        totals: null,
        salesPurchasesChart: null,
        topSellingProducts: null,
        topCustomers: null,
        stockAlerts: null,
        paymentsChart: null,
        grossMargin: null,
        averageOrderValue: null,
        stockTurnover: null,
        expenseBreakdown: null,
        stockValuation: null,
      });
    } finally {
      setLoading(false); // Ensure loading is always turned off
    }
    // Dependencies: selectedCompany, selectedWarehouse, dateRange (which are state variables)
  }, [selectedCompany, selectedWarehouse, dateRange, setSelectedWarehouse]); // Include setSelectedWarehouse if it's used inside

  // Effect to trigger data fetching when filters change
  useEffect(() => {
    fetchDashboardData();
    // The dependency array correctly lists the inputs to fetchDashboardData
  }, [fetchDashboardData]);

  const handleWarehouseChange = (value) => {
    setSelectedWarehouse(value === undefined ? null : Number(value));
  };

  const handleDateChange = (dates) => {
    // `dates` is an array [dayjsObject, dayjsObject] or null if cleared
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      setDateRange(dates);
    } else if (!dates) {
      // Handle clear case explicitly
      // Option 1: Reset to default (e.g., last 30 days)
      // setDateRange([dayjs().subtract(29, "days"), dayjs()]);
      // Option 2: Set to null/empty to indicate no selection (might require handling in fetchDashboardData)
      setDateRange(null); // Or an empty array [] depending on how you want to handle "no date range"
      console.log("Date range cleared.");
      // Note: fetchDashboardData logic needs to handle null dateRange gracefully
    }
    // If dates array is malformed (e.g., only one date), do nothing or reset?
  };

  // --- Configurations des Graphiques ---
  const lineChartConfigBase = {
    height: 300,
    xField: "date",
    yField: "value", // Common field for Y value
    seriesField: "type", // Common field for distinguishing lines (Sales/Purchases, Received/Sent)
    xAxis: {
      type: "time", // Treat x-axis values as continuous time
      title: null, // Optionally hide axis title { text: "Date" }
    },
    yAxis: {
      title: null, // Optionally hide axis title { text: "Montant (CFA)" }
    },
    padding: "auto", // Let the chart calculate padding
  };

  // --- MODIFICATION 4: Rendre la transformation de données plus robuste ---
  const transformChartData = (
    chartRawData,
    valueField1,
    valueField2,
    type1,
    type2
  ) => {
    if (
      !chartRawData ||
      !chartRawData.labels ||
      !Array.isArray(chartRawData.labels)
    ) {
      return []; // Return empty array if data structure is invalid
    }
    const { labels, [valueField1]: data1, [valueField2]: data2 } = chartRawData;

    // Ensure data arrays exist and have the same length as labels
    if (
      !data1 ||
      !data2 ||
      data1.length !== labels.length ||
      data2.length !== labels.length
    ) {
      console.warn(
        "Mismatch in chart data arrays length or missing data arrays."
      );
      // Attempt partial transformation or return empty? Let's try partial.
      // You might want to return [] here for stricter validation.
    }

    return labels.flatMap((label, index) => {
      const rawValue1 = data1?.[index]; // Use optional chaining
      const rawValue2 = data2?.[index];

      // Convert to number, default to 0 if null, undefined, NaN, or invalid number
      let num1 = parseFloat(rawValue1);
      let num2 = parseFloat(rawValue2);

      // Ensure values are valid numbers, default to 0 otherwise
      const val1 = Number.isFinite(num1) ? num1 : 0;
      const val2 = Number.isFinite(num2) ? num2 : 0;

      // Attempt to parse date string into a JS Date object
      const dateObj = dayjs(label, "YYYY-MM-DD").toDate();

      return [
        { date: dateObj, value: val1, type: type1 },
        { date: dateObj, value: val2, type: type2 },
      ];
    });
  };

  // --- NOUVELLE FONCTION: Pivoter les données pour Recharts LineChart ---
  const transformLineChartDataForRecharts = (data, type1Key, type2Key) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    const pivotedData = {};
    data.forEach(({ date, value, type }) => {
      const dateStr = dayjs(date).format("YYYY-MM-DD"); // Utiliser une clé string
      if (!pivotedData[dateStr]) {
        pivotedData[dateStr] = { date: date }; // Garder l'objet Date pour l'axe
      }
      // Assigner la valeur à la bonne clé (type1Key ou type2Key)
      if (type === type1Key) {
        pivotedData[dateStr][type1Key] = value;
      } else if (type === type2Key) {
        pivotedData[dateStr][type2Key] = value;
      }
    });
    // Convertir l'objet en tableau et trier par date
    return Object.values(pivotedData).sort((a, b) => a.date - b.date);
  };

  // Transformer les données pour Recharts
  const salesPurchasesDataLong = transformChartData(
    dashboardData.salesPurchasesChart,
    "salesData",
    "purchasesData",
    "Ventes",
    "Achats"
  );
  const salesPurchasesDataRecharts = transformLineChartDataForRecharts(
    salesPurchasesDataLong,
    "Ventes",
    "Achats"
  );

  const paymentsDataLong = transformChartData(
    dashboardData.paymentsChart,
    "receivedData",
    "sentData",
    "Reçus",
    "Envoyés"
  );
  const paymentsDataRecharts = transformLineChartDataForRecharts(
    paymentsDataLong,
    "Reçus",
    "Envoyés"
  );

  // Process expense data safely
  const expenseData = (dashboardData.expenseBreakdown || [])
    .map((item) => {
      const amount = parseFloat(item.totalAmount);
      return {
        name: item.categoryName,
        value: Number.isFinite(amount) ? amount : 0,
        categoryId: item.categoryId,
      };
    })
    // Optional: Filter out items with zero amount to avoid tiny/invisible slices
    .filter((item) => item.value > 0);

  // Filtrer les données pour le graphique Pie en fonction des catégories inactives
  const filteredExpenseData = expenseData.filter(
    (entry) => !inactiveCategories.includes(entry.name)
  );

  // Calculer le total des dépenses filtrées pour l'affichage central
  const totalFilteredExpenses = filteredExpenseData.reduce(
    (sum, entry) => sum + entry.value,
    0
  );

  // Définir une palette de couleurs pour Recharts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1919",
  ];

  // Fonction pour le label personnalisé (pourcentage)
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    // Position légèrement à l'extérieur pour la lisibilité si besoin, ou à l'intérieur
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Au milieu du secteur
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Afficher seulement si le pourcentage est significatif
    if (percent < 0.03) {
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="11px"
        fontWeight="bold"
        style={{ textShadow: "0px 0px 4px rgba(0,0,0,0.6)" }} // Ombre pour lisibilité
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Formatter pour le Tooltip Recharts PieChart (nommé pour clarté)
  const pieTooltipFormatter = (value, name, props) => {
    return [formatCurrency(value), name];
  };

  // Formatter pour le Tooltip Recharts LineChart (à rétablir)
  const lineTooltipFormatter = (value, name, props) => {
    // value: la valeur numérique de la ligne survolée
    // name: le nom de la ligne (ex: "Ventes", "Achats")
    // props: contient d'autres infos, notamment la couleur
    return [formatCurrency(value), name];
  };

  // Gestionnaire pour le clic sur la légende
  const handleLegendClick = (e) => {
    const { value } = e; // Le nom de la catégorie cliquée
    setInactiveCategories(
      (prev) =>
        prev.includes(value)
          ? prev.filter((name) => name !== value) // Réactiver: le retirer des inactifs
          : [...prev, value] // Désactiver: l'ajouter aux inactifs
    );
  };

  // Gestionnaires pour le survol du Pie
  const handlePieEnter = (_, index) => {
    setActivePieIndex(index);
  };

  const handlePieLeave = () => {
    setActivePieIndex(null);
  };

  // --- Rendu ---
  return (
    <div style={{ padding: "20px" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Tableau de bord
          </Title>
        </Col>
        {/* Optional: Add global actions here if needed */}
      </Row>

      {/* Filter Row - MODIFIED */}
      <Card style={{ marginBottom: "20px" }} bordered={false}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Entrepôt
            </label>
            <Select
              placeholder="Tous les entrepôts assignés"
              onChange={handleWarehouseChange}
              value={selectedWarehouse ?? undefined} // Use undefined for placeholder
              style={{ width: "100%" }}
              allowClear
              // Disable if no company selected, general loading, or no warehouses available for this user/company combo
              disabled={
                !selectedCompany || loading || warehousesForFilter.length === 0
              }
              // Show loading indicator specifically if general loading OR user data hasn't loaded yet
              loading={loading || !user}
            >
              {/* Map over the derived warehousesForFilter state */}
              {warehousesForFilter.map((wh) => (
                <Option key={wh.id} value={Number(wh.id)}>
                  {wh.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Période
            </label>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={handleDateChange}
              allowClear={true} // Allow clearing the date range
              disabled={loading}
              // Default date format can be customized if needed: format="DD/MM/YYYY"
              ranges={{
                "Aujourd'hui": [dayjs(), dayjs()],
                "7 derniers jours": [dayjs().subtract(6, "days"), dayjs()],
                "30 derniers jours": [dayjs().subtract(29, "days"), dayjs()],
                "Ce mois": [dayjs().startOf("month"), dayjs().endOf("month")],
                "Mois dernier": [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
                "Cette année": [dayjs().startOf("year"), dayjs().endOf("year")],
              }}
            />
          </Col>
          {/* Optional: Add a refresh button */}
          {/* <Col xs={24} sm={4} md={4} lg={3}>
              <Button type="primary" onClick={fetchDashboardData} loading={loading} icon={<ReloadOutlined />}>
                Actualiser
              </Button>
            </Col> */}
        </Row>
      </Card>

      {/* Loading and Error States */}
      {error && !loading && (
        <Alert
          message="Erreur de chargement"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Dashboard Content - Render structure even when loading */}
      {/* Ligne 1: KPIs - Refactored to use .main-grid */}
      <div className="main-grid" style={{ marginBottom: "16px" }}>
        {/* KPI 1: Ventes Totales */}
        <div className="card">
          {" "}
          {/* Utilisation de la classe .card de index.css */}
          {loading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ width: "80%", margin: "auto" }}
            />
          ) : (
            <Statistic
              title={
                <>
                  <RiseOutlined style={{ marginRight: 8 }} /> Ventes Totales
                </>
              }
              value={dashboardData.totals?.totalSales ?? 0}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#3f8600" }}
            />
          )}
        </div>

        {/* KPI 2: Achats Totals */}
        <div className="card">
          {loading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ width: "80%", margin: "auto" }}
            />
          ) : (
            <Statistic
              title={
                <>
                  <FallOutlined style={{ marginRight: 8 }} /> Achats Totals
                </>
              }
              value={dashboardData.totals?.totalPurchases ?? 0}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#cf1322" }}
            />
          )}
        </div>

        {/* KPI 3: Dépenses Totales */}
        <div className="card">
          {loading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ width: "80%", margin: "auto" }}
            />
          ) : (
            <Statistic
              title={
                <>
                  <WalletOutlined style={{ marginRight: 8 }} /> Dépenses Totales
                </>
              }
              value={dashboardData.totals?.totalExpenses ?? 0}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#faad14" }}
            />
          )}
        </div>

        {/* KPI 4: Solde Paiements */}
        <div className="card">
          {loading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ width: "80%", margin: "auto" }}
            />
          ) : (
            <Statistic
              title={
                <>
                  <DollarCircleOutlined style={{ marginRight: 8 }} /> Solde
                  Paiements
                </>
              }
              value={
                (dashboardData.totals?.totalPaymentsReceived ?? 0) -
                (dashboardData.totals?.totalPaymentsSent ?? 0)
              }
              arrow={
                (dashboardData.totals?.totalPaymentsReceived ?? 0) -
                  (dashboardData.totals?.totalPaymentsSent ?? 0) >=
                0
                  ? "up"
                  : "down"
              }
              formatter={(val) => formatCurrency(val)}
              valueStyle={{
                color:
                  (dashboardData.totals?.totalPaymentsReceived ?? 0) -
                    (dashboardData.totals?.totalPaymentsSent ?? 0) >=
                  0
                    ? "#52c41a"
                    : "#ff4d4f",
              }}
              precision={0} // No decimals needed here
            />
          )}
        </div>
      </div>

      {/* Ligne 2: Graphiques Lignes */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Ventes vs Achats"
            bordered={false}
            hoverable
            extra={
              <Radio.Group
                value={salesPurchasesFilter}
                onChange={(e) => setSalesPurchasesFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="Tous">Tous</Radio.Button>
                <Radio.Button value="Ventes">Ventes</Radio.Button>
                <Radio.Button value="Achats">Achats</Radio.Button>
              </Radio.Group>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : salesPurchasesDataRecharts.length > 0 ? (
              // Graphique Recharts
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={salesPurchasesDataRecharts}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="date" tickFormatter={formatDateTick} />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip formatter={lineTooltipFormatter} />
                  <Legend />
                  {(salesPurchasesFilter === "Tous" ||
                    salesPurchasesFilter === "Ventes") && (
                    <RechartsLine
                      type="monotone"
                      dataKey="Ventes"
                      stroke="#3f8600"
                      yAxisId={0}
                      name="Ventes"
                    />
                  )}
                  {(salesPurchasesFilter === "Tous" ||
                    salesPurchasesFilter === "Achats") && (
                    <RechartsLine
                      type="monotone"
                      dataKey="Achats"
                      stroke="#cf1322"
                      yAxisId={0}
                      name="Achats"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                description="Aucune donnée de vente ou d'achat"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Paiements Reçus vs Envoyés"
            bordered={false}
            hoverable
            extra={
              <Radio.Group
                value={paymentsFilter}
                onChange={(e) => setPaymentsFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="Tous">Tous</Radio.Button>
                <Radio.Button value="Reçus">Reçus</Radio.Button>
                <Radio.Button value="Envoyés">Envoyés</Radio.Button>
              </Radio.Group>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : paymentsDataRecharts.length > 0 ? (
              // Graphique Recharts
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={paymentsDataRecharts}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="date" tickFormatter={formatDateTick} />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip formatter={lineTooltipFormatter} />
                  <Legend />
                  {(paymentsFilter === "Tous" ||
                    paymentsFilter === "Reçus") && (
                    <RechartsLine
                      type="monotone"
                      dataKey="Reçus"
                      stroke="#52c41a"
                      yAxisId={0}
                      name="Reçus"
                    />
                  )}
                  {(paymentsFilter === "Tous" ||
                    paymentsFilter === "Envoyés") && (
                    <RechartsLine
                      type="monotone"
                      dataKey="Envoyés"
                      stroke="#ff4d4f"
                      yAxisId={0}
                      name="Envoyés"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                description="Aucune donnée de paiement"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>

        {/* Ligne 3: Listes & Graphique Dépenses */}
        <Col xs={24} md={12} lg={8}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                Répartition des Dépenses
                {/* Afficher le bouton Reset seulement si un filtre est actif */}
                {inactiveCategories.length > 0 && (
                  <Button
                    type="link"
                    icon={<ReloadOutlined />}
                    size="small"
                    onClick={() => setInactiveCategories([])} // Action Reset
                    style={{ marginLeft: "8px" }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            }
            bordered={false}
            hoverable
            bodyStyle={{ position: "relative", paddingBottom: "10px" }}
          >
            {loading ? (
              <Skeleton.Node active style={{ width: 200, height: 200 }}>
                <div
                  style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                />
              </Skeleton.Node>
            ) : expenseData.length > 0 ? (
              <div style={{ position: "relative" }}>
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  key={`expense-pie-${selectedWarehouse || "all"}-${
                    dateRange ? dateRange[0].format() : "nodate"
                  }-${dateRange ? dateRange[1].format() : "nodate"}`}
                >
                  <PieChart>
                    <Pie
                      data={filteredExpenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      onMouseEnter={handlePieEnter}
                      onMouseLeave={handlePieLeave}
                    >
                      {filteredExpenseData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.categoryId || index}`}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={
                            activePieIndex === null || activePieIndex === index
                              ? 1
                              : 0.6
                          }
                          style={{
                            transition: "fill-opacity 0.2s ease-in-out",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={pieTooltipFormatter}
                      cursor={{ fill: "transparent" }}
                      wrapperStyle={{ outline: "none", zIndex: 1000 }}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      onClick={handleLegendClick}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                description="Aucune dépense enregistrée"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            title="Produits les plus vendus"
            bordered={false}
            hoverable
            bodyStyle={{
              padding: "0 20px 10px 20px", // Consistent padding
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            ) : dashboardData.topSellingProducts &&
              dashboardData.topSellingProducts.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={dashboardData.topSellingProducts}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: "8px 20px" }}>
                    {" "}
                    {/* Reduced padding */}
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{
                            backgroundColor: "#fde3cf",
                            color: "#f56a00",
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <AntTooltip title={item.name}>{item.name}</AntTooltip>
                      }
                      description={`Revenu: ${formatCurrency(
                        item.totalRevenue
                      )} | Qté: ${item.quantitySold}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Aucun produit vendu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: "20px" }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            title="Meilleurs Clients"
            bordered={false}
            hoverable
            bodyStyle={{
              padding: "0 20px 10px 20px", // Consistent padding
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            ) : dashboardData.topCustomers &&
              dashboardData.topCustomers.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={dashboardData.topCustomers}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: "8px 20px" }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{
                            backgroundColor: "#d6e4ff",
                            color: "#1d39c4",
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <AntTooltip title={item.name}>{item.name}</AntTooltip>
                      }
                      description={`Total: ${formatCurrency(
                        item.totalSpent
                      )} | ${item.salesCount} Achat(s)`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Aucun client trouvé"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: "20px" }}
              />
            )}
          </Card>
        </Col>

        {/* Ligne 4: KPIs Sup & Alertes Stock */}
        <Col xs={24} md={12} lg={8}>
          <Card
            title="Alertes de Stock Bas"
            bordered={false}
            hoverable
            bodyStyle={{
              padding: "0 20px 10px 20px", // Consistent padding
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            ) : dashboardData.stockAlerts &&
              dashboardData.stockAlerts.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={dashboardData.stockAlerts}
                renderItem={(item) => (
                  <List.Item style={{ padding: "8px 20px" }}>
                    <List.Item.Meta
                      avatar={
                        // Optional: Show product image
                        <Avatar
                          src={
                            item.product_image || "/images/default_product.png"
                          }
                          size="small"
                          shape="square"
                        />
                      }
                      title={
                        <AntTooltip
                          title={`${item.name} (${item.warehouseName})`}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              maxWidth: "180px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              verticalAlign: "bottom",
                            }}
                          >
                            {item.name}
                          </span>
                        </AntTooltip>
                      }
                      description={
                        <Tag
                          color={item.currentStock <= 0 ? "error" : "warning"}
                          style={{ marginRight: 0 }}
                        >
                          Stock: {item.currentStock} (Alerte:{" "}
                          {item.alertQuantity})
                        </Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Aucune alerte de stock"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: "20px" }}
              />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} lg={5}>
          <Card bordered={false} hoverable bodyStyle={{ padding: "15px" }}>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: "80%" }} />
            ) : (
              <AntTooltip title="Total Ventes - Coût Marchandises Vendues (Prix d'achat actuel)">
                <Statistic
                  title={
                    <>
                      <CalculatorOutlined style={{ marginRight: 8 }} /> Marge
                      Brute
                    </>
                  }
                  value={dashboardData.grossMargin?.grossMargin ?? 0}
                  formatter={(val) => formatCurrency(val)}
                  precision={0}
                />
                <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
                  (
                  {(
                    dashboardData.grossMargin?.grossMarginPercentage ?? 0
                  ).toFixed(1)}
                  %)
                </span>
              </AntTooltip>
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} lg={5}>
          <Card bordered={false} hoverable bodyStyle={{ padding: "15px" }}>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: "80%" }} />
            ) : (
              <AntTooltip title="Total Ventes / Nombre de Commandes (Vente)">
                <Statistic
                  title={
                    <>
                      <ShoppingOutlined style={{ marginRight: 8 }} /> Panier
                      Moyen
                    </>
                  }
                  value={
                    dashboardData.averageOrderValue?.averageOrderValue ?? 0
                  }
                  formatter={(val) => formatCurrency(val)}
                  precision={0}
                />
              </AntTooltip>
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} lg={6}>
          {" "}
          {/* Adjusted width */}
          <Card bordered={false} hoverable bodyStyle={{ padding: "15px" }}>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: "80%" }} />
            ) : (
              <>
                <Statistic
                  title={
                    <>
                      <SyncOutlined style={{ marginRight: 8 }} /> Rotation Stock
                      (Ratio)
                    </>
                  }
                  value={dashboardData.stockTurnover?.stockTurnoverRatio ?? 0}
                  precision={2}
                  // suffix=" fois" // Suffix can be added if desired
                />
                <AntTooltip title="Approximation basée sur COGS / Valeur inventaire actuelle">
                  <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
                    (Approximation)
                  </span>
                </AntTooltip>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* NOUVELLE LIGNE 5: Valorisation Stock */}
      <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
        <Col xs={12} lg={6}>
          <Card bordered={false} hoverable bodyStyle={{ padding: "15px" }}>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: "80%" }} />
            ) : (
              <Statistic
                title={
                  <>
                    <DatabaseOutlined style={{ marginRight: 8 }} /> Valorisation
                    Stock (Coût)
                  </>
                }
                value={dashboardData.stockValuation?.totalStockValueCost ?? 0}
                formatter={(val) => formatCurrency(val)}
              />
            )}
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} hoverable bodyStyle={{ padding: "15px" }}>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: "80%" }} />
            ) : (
              <Statistic
                title={
                  <>
                    <TagsOutlined style={{ marginRight: 8 }} /> Valorisation
                    Stock (Vente)
                  </>
                }
                value={dashboardData.stockValuation?.totalStockValueSale ?? 0}
                formatter={(val) => formatCurrency(val)}
              />
            )}
          </Card>
        </Col>
        {/* Ajouter d'autres KPIs sur cette ligne si besoin, ajuster lg span */}
      </Row>
    </div>
  );
};

export default Dashboard;
