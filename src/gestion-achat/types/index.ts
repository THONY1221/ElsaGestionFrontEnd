// Types et interfaces pour le module GestionAchat

export interface Product {
  id: number;
  name: string;
  purchase_price?: number;
  current_stock?: number;
}

export interface ProduitAchete {
  produit_id: number;
  nom_produit: string;
  quantite: number;
  prix_unitaire_HT: number;
  remise?: number;
  taxe?: number | null;
  montant_taxe?: number;
}

export interface AchatFormData {
  id?: number;
  Date_Facture: string;
  Statut_Achat: string;
  Fournisseur_ID?:
    | number
    | { value: number; label: string; USER_ID?: number | string };
  Fournisseur_USER_ID?: number | string;
  warehouse_id?: number | null;
  produitsAches: ProduitAchete[];
  remise_globale: number;
  termes_conditions?: string;
  remarques?: string;
  paid_amount?: number;
  supplier_name?: string; // Nom du fournisseur récupéré du backend
}

export interface DateRange {
  start: string;
  end: string;
}

export interface AchatsState {
  achats: any[];
  fournisseurs: any[];
  produits: Product[];
  taxes: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  searchTerm: string;
  dateRange: DateRange;
  selectedFournisseur: any | null;
  showForm: boolean;
  showScanner: boolean;
  formData: AchatFormData;
  showDeleted: boolean;
  activeTab: string;
}

export type AchatsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACHATS"; payload: { achats: any[]; total: number } }
  | { type: "DELETE_ACHAT"; payload: number }
  | { type: "SET_FOURNISSEURS"; payload: any[] }
  | { type: "SET_PRODUITS"; payload: Product[] }
  | { type: "SET_TAXES"; payload: any[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: DateRange }
  | { type: "SET_SELECTED_FOURNISSEUR"; payload: any }
  | { type: "TOGGLE_FORM"; payload: boolean }
  | { type: "TOGGLE_SCANNER"; payload: boolean }
  | { type: "SET_FORM_DATA"; payload: AchatFormData }
  | { type: "UPDATE_FORM_DATA"; payload: Partial<AchatFormData> }
  | {
      type: "UPDATE_ACHAT_DETAIL";
      payload: { id: number; produitsAches: ProduitAchete[] };
    }
  | { type: "TOGGLE_SHOW_DELETED"; payload: boolean }
  | { type: "SET_ACTIVE_TAB"; payload: string };

export interface PaymentFormModalProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onPaymentAdded: (closeDetailModal?: boolean) => Promise<void>;
}

export interface OrderDetailModalProps {
  order: any;
  visible: boolean;
  onClose: () => void;
  produits: Product[];
  taxes: any[];
  fournisseurs: any[];
  refreshOrderDetails: (orderId: string) => Promise<any>;
  refreshAchats: () => Promise<void>;
}

export interface AchatFormProps {
  visible: boolean;
  onClose: () => void;
  refreshAchats: () => Promise<void>;
}

export interface AchatsTableProps {
  refreshAchats: () => Promise<void>;
}
