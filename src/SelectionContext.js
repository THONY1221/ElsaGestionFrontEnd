// SelectionContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  // Initialiser les états avec les valeurs de localStorage
  const [selectedCompany, setSelectedCompanyState] = useState(() => {
    try {
      const storedCompany = localStorage.getItem("selectedCompany");

      if (
        storedCompany === null ||
        storedCompany === "null" ||
        storedCompany === "undefined"
      ) {
        return null;
      }

      // Convertir en nombre
      const parsedCompany = Number(JSON.parse(storedCompany));
      return parsedCompany;
    } catch (error) {
      // console.error("Error parsing selectedCompany from localStorage:", error);
      return null;
    }
  });

  const [selectedWarehouse, setSelectedWarehouseState] = useState(() => {
    try {
      const storedWarehouse = localStorage.getItem("selectedWarehouse");

      if (
        storedWarehouse === null ||
        storedWarehouse === "null" ||
        storedWarehouse === "undefined"
      ) {
        return null;
      }

      // Convertir en nombre
      const parsedWarehouse = Number(JSON.parse(storedWarehouse));
      return parsedWarehouse;
    } catch (error) {
      // console.error(
      //   "Error parsing selectedWarehouse from localStorage:",
      //   error
      // );
      return null;
    }
  });

  // Wrapper pour setSelectedCompany qui met à jour également localStorage
  const setSelectedCompany = (company) => {
    if (company === undefined || company === null) {
      localStorage.removeItem("selectedCompany");
      setSelectedCompanyState(null);
    } else {
      // Assurer que c'est un nombre
      const companyId = Number(company);
      localStorage.setItem("selectedCompany", JSON.stringify(companyId));
      setSelectedCompanyState(companyId);
    }
  };

  // Wrapper pour setSelectedWarehouse qui met à jour également localStorage
  const setSelectedWarehouse = (warehouse) => {
    if (warehouse === undefined || warehouse === null) {
      localStorage.removeItem("selectedWarehouse");
      setSelectedWarehouseState(null);
    } else {
      // Assurer que c'est un nombre
      const warehouseId = Number(warehouse);
      localStorage.setItem("selectedWarehouse", JSON.stringify(warehouseId));
      setSelectedWarehouseState(warehouseId);
    }
  };

  // Vérifier la cohérence des sélections
  useEffect(() => {
    // Si un magasin est sélectionné mais pas d'entreprise, réinitialiser le magasin
    if (selectedWarehouse && !selectedCompany) {
      setSelectedWarehouse(null);
    }
  }, [selectedCompany, selectedWarehouse]);

  // Journaliser les changements d'état pour le débogage
  // useEffect(() => {},
  //    [selectedCompany, selectedWarehouse]); // Kept for structure, but empty

  return (
    <SelectionContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        selectedWarehouse,
        setSelectedWarehouse,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
};
