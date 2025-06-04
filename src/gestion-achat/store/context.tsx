import React, { createContext, useReducer, ReactNode } from "react";
import { AchatsState, AchatsAction } from "../types";
import { achatsReducer, initialState } from "./reducer";
import { api } from "../api";

// Définition du type pour le contexte
interface AchatsContextType {
  state: AchatsState;
  dispatch: React.Dispatch<AchatsAction>;
  api: typeof api;
}

// Création du contexte
export const AchatsContext = createContext<AchatsContextType | null>(null);

// Provider du contexte
interface AchatsProviderProps {
  children: ReactNode;
}

export const AchatsProvider: React.FC<AchatsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(achatsReducer, initialState);

  return (
    <AchatsContext.Provider value={{ state, dispatch, api }}>
      {children}
    </AchatsContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useAchatsContext = () => {
  const context = React.useContext(AchatsContext);
  if (!context) {
    throw new Error("useAchatsContext must be used within an AchatsProvider");
  }
  return context;
};
