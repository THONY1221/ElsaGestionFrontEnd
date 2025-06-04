import { AchatsState, AchatsAction, AchatFormData } from "../types";
import dayjs from "dayjs";

// État initial pour le reducer
export const initialFormData: AchatFormData = {
  Date_Facture: dayjs().format("YYYY-MM-DD"),
  Statut_Achat: "Commandé",
  produitsAches: [],
  remise_globale: 0,
};

export const initialState: AchatsState = {
  achats: [],
  fournisseurs: [],
  produits: [],
  taxes: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  searchTerm: "",
  dateRange: {
    start: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    end: dayjs().format("YYYY-MM-DD"),
  },
  selectedFournisseur: null,
  showForm: false,
  showScanner: false,
  formData: initialFormData,
  showDeleted: false,
  activeTab: "all",
};

// Reducer pour gérer les actions
export const achatsReducer = (
  state: AchatsState,
  action: AchatsAction
): AchatsState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACHATS":
      return {
        ...state,
        achats: action.payload.achats,
        totalPages: Math.ceil(action.payload.total / state.itemsPerPage),
        loading: false,
        error: null,
      };
    case "DELETE_ACHAT":
      return {
        ...state,
        achats: state.achats.filter((achat) => achat.id !== action.payload),
      };
    case "SET_FOURNISSEURS":
      return { ...state, fournisseurs: action.payload, loading: false };
    case "SET_PRODUITS":
      return { ...state, produits: action.payload, loading: false };
    case "SET_TAXES":
      return { ...state, taxes: action.payload, loading: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, currentPage: 1 };
    case "SET_SELECTED_FOURNISSEUR":
      return { ...state, selectedFournisseur: action.payload, currentPage: 1 };
    case "TOGGLE_FORM":
      return { ...state, showForm: action.payload };
    case "TOGGLE_SCANNER":
      return { ...state, showScanner: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "UPDATE_FORM_DATA":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case "UPDATE_ACHAT_DETAIL":
      return {
        ...state,
        achats: state.achats.map((achat) =>
          achat.id === action.payload.id
            ? { ...achat, produitsAches: action.payload.produitsAches }
            : achat
        ),
      };
    case "TOGGLE_SHOW_DELETED":
      return { ...state, showDeleted: action.payload, currentPage: 1 };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};
