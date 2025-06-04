// RightSideNav.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Select, Space, message, Spin } from "antd";
import axios from "axios";
import { DownOutlined } from "@ant-design/icons";
import { useSelection } from "./SelectionContext";
import { useAuth } from "./context/AuthContext";

const { Option } = Select;

const RightSideNav = () => {
  const {
    selectedCompany,
    setSelectedCompany,
    selectedWarehouse,
    setSelectedWarehouse,
  } = useSelection();

  const { user, isLoading: authLoading } = useAuth();

  const assignedWarehouses = useMemo(() => {
    return user && Array.isArray(user.assigned_warehouses)
      ? user.assigned_warehouses
      : [];
  }, [user]);

  const availableCompanies = useMemo(() => {
    if (!assignedWarehouses || assignedWarehouses.length === 0) return [];

    const companyMap = new Map();
    assignedWarehouses.forEach((wh) => {
      if (wh.company_id && !companyMap.has(wh.company_id)) {
        companyMap.set(wh.company_id, {
          id: wh.company_id,
          name: wh.company_name || `Entreprise ID ${wh.company_id}`,
        });
      }
    });
    return Array.from(companyMap.values());
  }, [assignedWarehouses]);

  const warehousesForSelectedCompany = useMemo(() => {
    if (!selectedCompany || !assignedWarehouses) return [];
    return assignedWarehouses.filter((wh) => wh.company_id === selectedCompany);
  }, [selectedCompany, assignedWarehouses]);

  useEffect(() => {
    console.log(
      "[RightSideNav Effect] Running checks. Assigned WH:",
      assignedWarehouses.length,
      "Available Comp:",
      availableCompanies.length
    );
    if (authLoading || !user) return;

    if (assignedWarehouses.length === 0) {
      if (selectedCompany) setSelectedCompany(null);
      if (selectedWarehouse) setSelectedWarehouse(null);
      console.log(
        "[RightSideNav Effect] No assigned warehouses, cleared selections."
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
    user,
    assignedWarehouses,
    availableCompanies,
    selectedCompany,
    selectedWarehouse,
    setSelectedCompany,
    setSelectedWarehouse,
    warehousesForSelectedCompany,
    authLoading,
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

  if (!user || assignedWarehouses.length === 0) {
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
