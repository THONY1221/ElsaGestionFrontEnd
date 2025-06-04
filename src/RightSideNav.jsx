// RightSideNav.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Select, Space, message, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useSelection } from "./SelectionContext";
import { useAuth } from "./context/AuthContext";
import { companiesApi, warehousesApi } from "./api/supabaseApi";

const { Option } = Select;

const RightSideNav = () => {
  const {
    selectedCompany,
    setSelectedCompany,
    selectedWarehouse,
    setSelectedWarehouse,
  } = useSelection();

  const { user, isLoading: authLoading } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les entreprises depuis Supabase
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const companiesData = await companiesApi.getAll();
        setCompanies(companiesData);
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        message.error("Erreur lors du chargement des entreprises");
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  // Charger les entrepôts pour l'entreprise sélectionnée
  useEffect(() => {
    const loadWarehouses = async () => {
      if (!selectedCompany) {
        setWarehouses([]);
        return;
      }

      try {
        const warehousesData = await warehousesApi.getByCompany(
          selectedCompany
        );
        setWarehouses(warehousesData);
      } catch (error) {
        console.error("Erreur lors du chargement des entrepôts:", error);
        message.error("Erreur lors du chargement des entrepôts");
      }
    };

    loadWarehouses();
  }, [selectedCompany]);

  const availableCompanies = companies;
  const warehousesForSelectedCompany = warehouses;

  useEffect(() => {
    console.log(
      "[RightSideNav Effect] Running checks. Companies:",
      availableCompanies.length
    );
    if (loading) return;

    if (availableCompanies.length === 0) {
      if (selectedCompany) setSelectedCompany(null);
      if (selectedWarehouse) setSelectedWarehouse(null);
      console.log(
        "[RightSideNav Effect] No companies available, cleared selections."
      );
      return;
    }

    const companyIsValid = availableCompanies.some(
      (c) => c.id === selectedCompany
    );
    if (selectedCompany && !companyIsValid) {
      console.log(
        `[RightSideNav Effect] Invalid selectedCompany ${selectedCompany}, resetting.`
      );
      setSelectedCompany(null);
      setSelectedWarehouse(null);
      return;
    }

    if (availableCompanies.length === 1 && !selectedCompany) {
      const singleCompanyId = availableCompanies[0].id;
      console.log(
        "[RightSideNav Effect] Auto-selecting single company:",
        singleCompanyId
      );
      setSelectedCompany(singleCompanyId);
    }

    if (selectedCompany && selectedWarehouse) {
      const warehouseIsValid = warehousesForSelectedCompany.some(
        (w) => w.id === selectedWarehouse
      );
      if (!warehouseIsValid) {
        console.log(
          `[RightSideNav Effect] Invalid selectedWarehouse ${selectedWarehouse} for company ${selectedCompany}, resetting warehouse.`
        );
        setSelectedWarehouse(null);
      }
    }

    if (
      selectedCompany &&
      warehousesForSelectedCompany.length === 1 &&
      !selectedWarehouse
    ) {
      const singleWarehouseId = warehousesForSelectedCompany[0].id;
      console.log(
        `[RightSideNav Effect] Auto-selecting single warehouse ${singleWarehouseId} for company ${selectedCompany}.`
      );
      setSelectedWarehouse(singleWarehouseId);
    }
  }, [
    loading,
    availableCompanies,
    selectedCompany,
    selectedWarehouse,
    setSelectedCompany,
    setSelectedWarehouse,
    warehousesForSelectedCompany,
  ]);

  const handleCompanyChange = (value) => {
    console.log("Company changed to:", value, "type:", typeof value);
    const companyId = value ? Number(value) : null;

    if (companyId !== selectedCompany) {
      setSelectedCompany(companyId);
      setSelectedWarehouse(null);
    }
  };

  const handleWarehouseChange = (value) => {
    console.log("Warehouse changed to:", value, "type:", typeof value);
    const warehouseId = value ? Number(value) : null;

    if (warehouseId !== selectedWarehouse) {
      setSelectedWarehouse(warehouseId);
    }
  };

  if (authLoading) {
    return (
      <div className="right-nav flex items-center justify-end w-full sm:w-auto">
        <Space>
          <Spin size="small" /> Chargement...
        </Space>
      </div>
    );
  }

  if (availableCompanies.length === 0) {
    return (
      <div className="right-nav flex items-center justify-end w-full sm:w-auto">
        <Space direction="vertical" className="sm:flex-row gap-2">
          <Select
            placeholder="Aucune entreprise assignée"
            className="w-full min-w-[150px] sm:w-[180px] md:w-[200px]"
            disabled
          />
          <Select
            placeholder="Aucun magasin assigné"
            className="w-full min-w-[150px] sm:w-[180px] md:w-[200px]"
            disabled
          />
        </Space>
      </div>
    );
  }

  return (
    <div className="right-nav flex items-center justify-end w-full sm:w-auto">
      <Space direction="vertical" className="sm:flex-row gap-2">
        <Select
          placeholder="Entreprise..."
          className="w-full min-w-[150px] sm:w-[180px] md:w-[200px]"
          value={selectedCompany || undefined}
          onChange={handleCompanyChange}
          allowClear
          suffixIcon={<DownOutlined />}
          disabled={availableCompanies.length === 0}
          loading={authLoading}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {availableCompanies.map((company) => (
            <Option key={company.id} value={company.id}>
              {company.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Magasin..."
          className="w-full min-w-[150px] sm:w-[180px] md:w-[200px]"
          value={selectedWarehouse || undefined}
          onChange={handleWarehouseChange}
          disabled={
            !selectedCompany || warehousesForSelectedCompany.length === 0
          }
          allowClear
          suffixIcon={<DownOutlined />}
          loading={authLoading}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {warehousesForSelectedCompany.map((warehouse) => (
            <Option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  );
};

export default RightSideNav;
