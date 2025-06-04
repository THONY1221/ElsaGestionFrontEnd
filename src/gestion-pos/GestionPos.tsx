import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import {
  Layout,
  Input,
  Button,
  Select,
  Card,
  List,
  Spin,
  Modal,
  Form,
  Row,
  Col,
  message,
  Switch,
} from "antd";
import {
  SearchOutlined,
  QrcodeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSelection } from "../SelectionContext"; // Import useSelection hook
import "./GestionPos.css"; // Vos styles personnalisés
import TicketCaisse from "./TicketCaisse"; // Import du composant TicketCaisse
import { useAuth } from "../context/AuthContext"; // Use AuthContext

const { Header, Content, Footer } = Layout;
const { Option } = Select;

// --- Définition des types ---

interface Product {
  id_produit: number;
  nom_produit: string;
  prix_vente: number;
  quantite_stock: number;
  image: string;
  id_categorie: number;
  code_qr?: string;
}

interface CartItem extends Omit<Product, "quantite_stock"> {
  cartQuantity: number;
  prix_unitaire_HT?: number;
}

interface Customer {
  ID_Client: number;
  Nom_Raison_Sociale: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Tax {
  id: number;
  parent_id?: number;
  tax_type?: string;
  company_id?: number;
  code: string;
  name: string;
  status: string;
  rate: number;
  effective_date: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

interface Category {
  id: number;
  categorie: string;
}

// --- Composant principal ---
const GestionPos: React.FC = () => {
  // Utiliser le contexte de sélection pour accéder au magasin et à l'entreprise sélectionnés
  const { selectedWarehouse, selectedCompany } = useSelection();

  // Référence pour suivre la valeur précédente du magasin sélectionné
  const prevWarehouseRef = useRef<number | null>(null);

  // États principaux
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [filteredTaxes, setFilteredTaxes] = useState<Tax[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Ajout des modes de paiement depuis l'API
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [loadingPaymentModes, setLoadingPaymentModes] =
    useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1024);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // États pour le ticket et le paiement
  const [ticketVisible, setTicketVisible] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Sélection du mode de paiement (maintenant par ID et non par index)
  const [selectedModePaiement, setSelectedModePaiement] = useState<
    number | null
  >(null);

  // États pour le ticket et l'impression
  const [ticketData, setTicketData] = useState<any>(null);
  const [showTicket, setShowTicket] = useState<boolean>(false);
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [warehouseData, setWarehouseData] = useState<any>(null);

  // États pour la recherche et le formulaire client
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const [showClientForm, setShowClientForm] = useState<boolean>(false);

  // @ts-ignore - Context from JS file
  const { user } = useAuth(); // Get user object from AuthContext

  // ========== FONCTION DE TEST CONNECTIVITÉ API PAIEMENT ==========
  const testPaymentAPIConnectivity = async () => {
    try {
      console.log("🔍 Test de connectivité API paiement...");
      const response = await axios.get(
        "http://localhost:3000/api/payments/totals",
        {
          timeout: 5000,
          params: { company_id: 1 }, // Test simple avec company_id
        }
      );
      console.log("✅ API paiement accessible - Status:", response.status);
      return true;
    } catch (error: any) {
      console.error("❌ API paiement non accessible:", error.message);
      return false;
    }
  };

  // Liste des modes de paiement disponibles (utilisée uniquement comme fallback)
  const modesPaiementDefault = [
    { id: 1, name: "Espèces" },
    { id: 2, name: "Carte bancaire" },
    { id: 3, name: "Virement" },
    { id: 4, name: "Chèque" },
    { id: 5, name: "Mobile Money" },
  ];

  // Mise à jour de l'état selon la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowCart(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Nettoyage du scanner lors du démontage
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  // Filtrer les taxes en fonction de l'entreprise sélectionnée
  useEffect(() => {
    if (selectedCompany && taxes.length > 0) {
      const filtered = taxes.filter(
        (tax) => !tax.company_id || tax.company_id === selectedCompany
      );
      console.log(
        `Taxes filtrées pour l'entreprise ${selectedCompany}:`,
        filtered.length
      );
      setFilteredTaxes(filtered);

      // Réinitialiser la taxe sélectionnée si elle n'est plus dans la liste filtrée
      if (selectedTax && !filtered.find((t) => t.id === selectedTax.id)) {
        setSelectedTax(null);
      }
    } else {
      setFilteredTaxes(taxes);
    }
  }, [selectedCompany, taxes, selectedTax]);

  // Fonction pour charger les modes de paiement
  const fetchPaymentModes = async () => {
    try {
      setLoadingPaymentModes(true);
      console.log("Chargement des modes de paiement...");

      // Préparation des paramètres (filtrer par magasin/entreprise si disponible)
      const params: any = {};

      if (selectedWarehouse) {
        try {
          // Récupérer les détails du magasin pour obtenir l'ID de l'entreprise
          const warehouseResponse = await axios.get(
            `http://localhost:3000/api/warehouses/${selectedWarehouse}`
          );

          if (warehouseResponse.status === 200 && warehouseResponse.data) {
            const warehouse = warehouseResponse.data;
            setWarehouseData(warehouse);

            if (warehouse.company_id) {
              params.company_id = warehouse.company_id;
              console.log(
                `Filtrage des modes de paiement par entreprise ID: ${warehouse.company_id}`
              );
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des détails du magasin:",
            error
          );
        }
      }

      // Appel API pour récupérer les modes de paiement
      const response = await axios.get(
        "http://localhost:3000/api/payment-modes",
        { params }
      );

      if (response.status === 200) {
        let modes;

        // Traiter différents formats de réponse possibles
        if (response.data.paymentModes) {
          modes = response.data.paymentModes;
        } else if (response.data.payment_modes) {
          modes = response.data.payment_modes;
        } else if (Array.isArray(response.data)) {
          modes = response.data;
        } else {
          modes = [];
        }

        console.log(`${modes.length} modes de paiement récupérés`);
        setPaymentModes(modes);

        // Définir le mode de paiement par défaut si aucun n'est sélectionné
        if (selectedModePaiement === null && modes.length > 0) {
          setSelectedModePaiement(modes[0].id);
        }
      } else {
        console.warn("Réponse API non attendue:", response);
        // Utiliser les modes de paiement par défaut
        setPaymentModes(modesPaiementDefault);
        if (selectedModePaiement === null) {
          setSelectedModePaiement(modesPaiementDefault[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des modes de paiement:", error);
      // Utiliser les modes de paiement par défaut en cas d'erreur
      setPaymentModes(modesPaiementDefault);
      if (selectedModePaiement === null) {
        setSelectedModePaiement(modesPaiementDefault[0].id);
      }
    } finally {
      setLoadingPaymentModes(false);
    }
  };

  const fetchProducts = async (categoryId: number | null) => {
    try {
      // Construire les paramètres de la requête
      const params: any = {};

      // Ajouter le filtre de catégorie si spécifié
      if (categoryId) {
        params.categorie = categoryId;
      }

      // Ajouter le filtre de magasin si spécifié
      if (selectedWarehouse) {
        params.warehouse = selectedWarehouse;
      }

      // Exclure les matières premières (raw) du POS - ne montrer que les produits commercialisables
      params.exclude_types = "raw";

      // Récupérer tous les produits pour le POS (pas de pagination)
      params.all = "true";

      // Construire l'URL avec les paramètres
      const url = "http://localhost:3000/api/produits";
      const response = await axios.get(url, { params });

      // Mapping des données produits pour correspondre à l'interface Product
      const mappedProducts: Product[] = response.data.products.map(
        (prod: any) => ({
          id_produit: prod.id,
          nom_produit: prod.name,
          prix_vente: prod.sales_price,
          quantite_stock: prod.current_stock || 0,
          image: prod.image,
          id_categorie: prod.category_id,
          code_qr: prod.item_code,
        })
      );

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      message.error("Erreur lors du chargement des produits");
    }
  };

  // Chargement initial des données depuis le backend
  // Cette useEffect est exécutée au montage du composant et quand selectedWarehouse change
  // Elle charge toutes les données nécessaires au fonctionnement du composant
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Préparer les paramètres pour les clients (filtrer par magasin)
        const clientsParams = selectedWarehouse
          ? { warehouseId: selectedWarehouse }
          : {};

        const [categoriesRes, clientsRes, taxesRes] = await Promise.all([
          axios.get("http://localhost:3000/api/categories"),
          axios.get("http://localhost:3000/api/users/customers", {
            params: clientsParams,
          }),
          axios.get("http://localhost:3000/api/taxes?status=active"),
        ]);

        // Mapping des données catégories pour correspondre à l'interface Category
        const mappedCategories: Category[] = categoriesRes.data.map(
          (cat: any) => ({
            id: cat.id,
            categorie: cat.name,
          })
        );
        setCategories(mappedCategories);

        // Mapping des données clients pour correspondre à l'interface Customer
        const mappedCustomers: Customer[] = clientsRes.data.map(
          (client: any) => ({
            ID_Client: client.id,
            Nom_Raison_Sociale: client.name,
          })
        );
        setCustomers(mappedCustomers);

        // La réponse de l'API taxes a changé, elle renvoie maintenant un objet avec une propriété 'taxes'
        const activeTaxes =
          taxesRes.data.taxes?.filter((tax: Tax) => tax.status === "active") ||
          [];
        setTaxes(activeTaxes);

        // Chargement initial des produits
        await fetchProducts(null);

        // Charger les modes de paiement
        await fetchPaymentModes();
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse]); // Recharger les données quand le magasin sélectionné change

  // Fermeture des résultats de recherche si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchWrapper = document.getElementById("search-wrapper");
      if (searchWrapper && !searchWrapper.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rafraîchir les produits quand le magasin sélectionné change
  useEffect(() => {
    // Vérifier si c'est le chargement initial
    const isInitialLoad = prevWarehouseRef.current === null;

    // Si ce n'est pas le chargement initial et qu'il y a un changement de magasin
    if (!isInitialLoad && prevWarehouseRef.current !== selectedWarehouse) {
      // Réinitialiser la catégorie active et le client sélectionné
      setActiveCategory(null);
      setSelectedCategory(null);
      setSelectedCustomer(null);

      // Avertir l'utilisateur que le panier sera vidé si le panier n'est pas vide
      if (cart.length > 0) {
        Modal.confirm({
          title: "Changement de magasin",
          content:
            "Le changement de magasin va vider votre panier actuel. Voulez-vous continuer ?",
          onOk: () => {
            // Vider le panier
            setCart([]);
            // Recharger les produits avec le nouveau filtre de magasin
            setLoading(true);
            fetchProducts(null).finally(() => setLoading(false));
          },
          onCancel: () => {
            // Faire rien
          },
        });
      } else {
        // Recharger les produits avec le nouveau filtre de magasin
        if (!loading) {
          setLoading(true);
          fetchProducts(null).finally(() => setLoading(false));
        }
      }
    } else if (isInitialLoad) {
      // Premier chargement, on ne fait rien de spécial car useEffect pour le chargement initial s'en occupe
    }

    // Mettre à jour la référence
    prevWarehouseRef.current = selectedWarehouse;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse, loading, cart.length]);

  // Gestion du clic sur une catégorie (par identifiant)
  const handleCategoryClick = async (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      await fetchProducts(categoryId);
    } finally {
      setLoading(false);
    }
  };

  // Ajout d'un produit au panier avec contrôle du stock
  const handleAddToCart = (product: Product) => {
    // Vérifier la quantité déjà ajoutée
    const existingItem = cart.find(
      (item) => item.id_produit === product.id_produit
    );
    const currentCartQty = existingItem ? existingItem.cartQuantity : 0;
    if (currentCartQty >= product.quantite_stock) {
      message.error("Stock insuffisant pour ce produit.");
      return;
    }

    const cartItem: CartItem = {
      id_produit: product.id_produit,
      nom_produit: product.nom_produit,
      prix_vente: product.prix_vente,
      image: product.image,
      id_categorie: product.id_categorie,
      code_qr: product.code_qr || "",
      cartQuantity: 1,
    };

    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.id_produit === product.id_produit
      );
      if (existing) {
        // Incrémenter la quantité si possible
        return prevCart.map((item) =>
          item.id_produit === product.id_produit
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prevCart, cartItem];
    });
    if (isMobile) {
      setShowCart(true);
    }
    message.success(`${product.nom_produit} ajouté au panier`);
  };

  // Recherche des produits (filtrage) en ne considérant que ceux dont le stock est positif
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term.trim()) {
        const results = products.filter(
          (p) =>
            p.quantite_stock > 0 &&
            (p.nom_produit.toLowerCase().includes(term.toLowerCase()) ||
              (p.code_qr && p.code_qr === term))
        );
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    },
    [products]
  );

  // Sélection d'un résultat de recherche (ajout au panier)
  const handleSearchResultClick = (product: Product) => {
    handleAddToCart(product);
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Vider le panier (avec confirmation)
  const handleEmptyCart = () => {
    if (cart.length === 0) return;
    Modal.confirm({
      title: "Vider le panier",
      content: "Êtes-vous sûr de vouloir vider le panier ?",
      onOk: () => setCart([]),
    });
  };

  // Initialisation du scanner QR
  const initializeScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    const qrContainer = document.createElement("div");
    qrContainer.id = "qr-reader";
    const scannerContainer = document.querySelector("#scanner-container");
    if (scannerContainer) {
      scannerContainer.innerHTML = "";
      scannerContainer.appendChild(qrContainer);
      const newScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false
      );
      newScanner.render(
        (decodedText: string) => {
          handleSearch(decodedText);
        },
        (error: any) => {
          console.warn("Erreur de scan:", error);
        }
      );
      setScanner(newScanner);
      setIsScanning(true);
    }
  };

  // Modification de la quantité d'un article dans le panier avec contrôle sur le stock
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    // Récupérer les informations initiales du produit depuis le tableau products
    const productData = products.find((p) => p.id_produit === productId);
    if (!productData) return;
    if (newQuantity > productData.quantite_stock) {
      message.error("La quantité demandée dépasse le stock disponible.");
      return;
    }
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id_produit === productId
            ? { ...item, cartQuantity: newQuantity }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  // Édition du prix d'un article
  const handleEditPrice = (productId: number, currentPrice: number) => {
    setEditingItem(productId);
    setEditPrice(currentPrice);
  };

  // Sauvegarde du nouveau prix
  const handleSavePrice = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id_produit === productId
          ? { ...item, prix_vente: editPrice }
          : item
      )
    );
    setEditingItem(null);
  };

  // Suppression d'un article du panier
  const handleRemoveItem = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.id_produit !== productId)
    );
  };

  // Réinitialisation après validation de vente ou annulation
  const handleReset = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSelectedTax(null);
    setDiscount(0);
    setPaidAmount(0); // Réinitialiser le montant payé
    setSelectedModePaiement(null);
    setSearchTerm("");
    if (scanner) {
      scanner.clear();
      setIsScanning(false);
    }
    setTicketVisible(false);
  };

  // Soumission de la vente
  const handleSubmit = async () => {
    try {
      // Vérifier si un client est sélectionné
      if (!selectedCustomer) {
        message.error("Veuillez sélectionner un client");
        return;
      }

      // Récupérer le statut de commande par défaut pour le magasin
      let defaultOrderStatus = "delivered"; // Valeur par défaut si le magasin n'est pas trouvé ou n'a pas de valeur

      try {
        if (selectedWarehouse) {
          const warehouseResponse = await axios.get(
            `http://localhost:3000/api/warehouses/${selectedWarehouse}`
          );
          if (warehouseResponse.status === 200 && warehouseResponse.data) {
            defaultOrderStatus =
              warehouseResponse.data.default_pos_order_status || "delivered";
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du statut par défaut:",
          error
        );
        // Continuer avec la valeur par défaut en cas d'erreur
      }

      // Traduire le statut de commande en français
      const translatedOrderStatus = translateOrderStatus(defaultOrderStatus);

      // ========== UTILISATION DES CALCULS CORRIGÉS ==========
      // Utiliser les valeurs calculées correctement selon la formule spécifiée
      const montantBaseHT = baseHT; // Base HT initiale
      const montantNetHT_calc = montantNetHT; // Montant net HT après remise
      const montantTaxe = taxAmount; // Montant de la taxe
      const montantTotalTTC = total; // Total TTC final
      // ========== FIN UTILISATION DES CALCULS CORRIGÉS ==========

      // Créer un identifiant unique pour la vente
      const uniqueId = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const today = new Date().toISOString().split("T")[0];

      // Calculer le total d'articles et de quantités
      const totalItems = cart.length;
      const totalQuantity = cart.reduce(
        (sum, item) => sum + item.cartQuantity,
        0
      );

      // Utiliser les valeurs calculées pour le montant payé et le montant dû
      const finalPaidAmount = paidAmount; // Utiliser exactement le montant saisi
      const finalDueAmount = Math.max(0, montantTotalTTC - finalPaidAmount);

      // Calcul du trop-perçu (si le paiement dépasse le total)
      const overpaidAmount = Math.max(0, finalPaidAmount - montantTotalTTC);

      // Préparer les données de la vente pour la table 'orders'
      const saleData = {
        company_id: 1, // À adapter selon votre structure
        unique_id: uniqueId,
        invoice_number: uniqueId, // On utilise le même ID unique comme numéro de facture
        invoice_type: "standard",
        order_type: "sales", // Utiliser "sales" au lieu de "sale"
        order_date: new Date().toISOString(), // Format datetime complet
        customer_id: selectedCustomer,
        warehouse_id: selectedWarehouse,
        from_warehouse_id: selectedWarehouse, // Même entrepôt d'origine
        user_id: selectedCustomer, // Conserver user_id comme l'ID du client pour la commande
        staff_user_id: user?.id || null, // MODIFICATION: ID de l'utilisateur connecté (vendeur)
        tax_id: selectedTax?.id || null,
        tax_rate: selectedTax?.rate || 0,
        tax_amount: montantTaxe, // Utiliser le montant de taxe calculé
        discount: discount || 0,
        shipping: 0,
        subtotal: montantBaseHT, // Base HT initiale
        total: montantTotalTTC, // Total TTC calculé
        paid_amount: finalPaidAmount, // Utiliser le montant payé
        due_amount: finalDueAmount, // Utiliser le montant dû
        payment_status: paymentStatus, // Utiliser le statut de paiement en français
        payment_mode: selectedModePaiement
          ? paymentModes.find((mode) => mode.id === selectedModePaiement)
              ?.name || "Espèces"
          : "Espèces",
        order_status: translatedOrderStatus, // Utiliser le statut de commande traduit en français
        total_items: totalItems,
        total_quantity: totalQuantity,
        notes: "",
        terms_condition: "",
        is_deletable: 1,
        cancelled: 0,
        is_deleted: 0,
        is_converted: 0,
        items: cart.map((item) => ({
          product_id: item.id_produit,
          warehouse_id: selectedWarehouse,
          quantity: item.cartQuantity,
          unit_price: item.prix_vente, // Prix unitaire HT
          single_unit_price: item.prix_vente,
          unit_id: null,
          total_price: item.prix_vente * item.cartQuantity, // Total HT pour cet item
          subtotal: item.prix_vente * item.cartQuantity, // Sous-total HT pour cet item
          tax_id: selectedTax?.id || null,
          tax_rate: selectedTax?.rate || 0,
          tax_type: selectedTax?.tax_type || null,
          tax_amount: selectedTax?.rate
            ? item.prix_vente * item.cartQuantity * (selectedTax.rate / 100)
            : 0,
          total_tax: selectedTax?.rate
            ? item.prix_vente * item.cartQuantity * (selectedTax.rate / 100)
            : 0,
          discount_rate: 0, // Remise au niveau ligne (si applicable)
          total_discount: 0, // Montant remise au niveau ligne
          original_order_id: null,
          original_order_item_id: null,
        })),
      };

      console.log("Envoi des données de vente:", saleData);

      // Envoi des données au backend
      const response = await axios.post(
        "http://localhost:3000/api/orders",
        saleData
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Erreur lors de l'enregistrement de la vente");
      }

      const result = response.data;
      console.log("Résultat de l'enregistrement:", result);

      // Enregistrer le paiement si un montant a été payé
      if (finalPaidAmount > 0) {
        try {
          // ========== TEST DE CONNECTIVITÉ ==========
          console.log(
            "🔍 Test de connectivité API avant traitement paiement..."
          );
          const isAPIAvailable = await testPaymentAPIConnectivity();
          if (!isAPIAvailable) {
            throw new Error(
              "L'API de paiement n'est pas accessible. Veuillez vérifier que le serveur backend est démarré."
            );
          }

          // ========== VALIDATION DES DONNÉES DE PAIEMENT ==========
          console.log("=== DÉBUT TRAITEMENT PAIEMENT ===");
          console.log(`Montant à payer: ${finalPaidAmount}`);
          console.log(`Mode de paiement sélectionné: ${selectedModePaiement}`);
          console.log(`Client sélectionné: ${selectedCustomer}`);
          console.log(`Magasin sélectionné: ${selectedWarehouse}`);
          console.log(`ID commande: ${result.orderId || result.id}`);

          // Validation des données essentielles
          if (!selectedModePaiement) {
            throw new Error("Mode de paiement non sélectionné");
          }
          if (!selectedCustomer) {
            throw new Error("Client non sélectionné");
          }
          if (!selectedWarehouse) {
            throw new Error("Magasin non sélectionné");
          }
          if (!result.orderId && !result.id) {
            throw new Error("ID de commande manquant dans la réponse");
          }

          // Trouver le mode de paiement sélectionné dans la liste
          const selectedMode = paymentModes.find(
            (mode) => mode.id === selectedModePaiement
          );

          if (!selectedMode) {
            console.warn(
              "Mode de paiement non trouvé dans la liste, utilisation d'un mode par défaut"
            );
            throw new Error(
              `Mode de paiement ID ${selectedModePaiement} non trouvé dans la liste disponible`
            );
          }

          console.log(
            `Mode de paiement trouvé: ${selectedMode.name} (ID: ${selectedMode.id})`
          );

          // Récupérer le nom du mode de paiement pour l'affichage
          const paymentModeName = selectedMode.name;

          // ========== PRÉPARATION DES DONNÉES DE PAIEMENT ==========
          // Préparer les données du paiement pour l'API
          const paymentData = {
            payment: {
              company_id: saleData.company_id || 1, // Utiliser la company_id de la vente
              warehouse_id: selectedWarehouse,
              payment_type: "in", // Paiement entrant pour une vente
              date: new Date().toISOString().split("T")[0], // Date du jour au format YYYY-MM-DD
              amount: finalPaidAmount,
              payment_mode_id: selectedModePaiement, // ID du mode de paiement sélectionné
              user_id: selectedCustomer, // ID du client
              notes: "Paiement effectué lors de la vente POS",
              staff_user_id: user?.id || null, // Assurer que l'ID du vendeur est inclus
            },
            order: {
              id: result.orderId || result.id,
              paid_amount: finalPaidAmount,
              due_amount: finalDueAmount,
              payment_status: paymentStatus,
            },
          };

          console.log("=== DONNÉES DE PAIEMENT PRÉPARÉES ===");
          console.log(
            "Données complètes envoyées à l'API:",
            JSON.stringify(paymentData, null, 2)
          );

          // ========== ENVOI À L'API DE PAIEMENT ==========
          console.log(
            "Envoi vers l'API: http://localhost:3000/api/payments/process-order-payment"
          );

          // Appel à l'API de traitement du paiement avec timeout
          const paymentResponse = await axios.post(
            "http://localhost:3000/api/payments/process-order-payment",
            paymentData,
            {
              timeout: 10000, // 10 secondes de timeout
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          console.log("=== RÉPONSE DE L'API PAIEMENT ===");
          console.log(`Statut HTTP: ${paymentResponse.status}`);
          console.log(
            "Données de réponse:",
            JSON.stringify(paymentResponse.data, null, 2)
          );

          // ========== VALIDATION DE LA RÉPONSE ==========
          if (
            paymentResponse.status === 200 ||
            paymentResponse.status === 201
          ) {
            // Vérifier que la réponse contient les données attendues
            if (
              paymentResponse.data &&
              paymentResponse.data.success !== false
            ) {
              console.log("✅ Paiement enregistré avec succès!");
              console.log(`Payment ID: ${paymentResponse.data.payment_id}`);
              console.log(
                `Payment Number: ${paymentResponse.data.payment_number}`
              );

              // Vérifier si c'est un duplicata
              if (paymentResponse.data.is_duplicate) {
                console.warn(
                  "⚠️ Paiement en duplicata détecté:",
                  paymentResponse.data.message
                );
              }
            } else {
              console.error("❌ Réponse d'API invalide - succès = false");
              throw new Error(
                `Réponse d'API invalide: ${JSON.stringify(
                  paymentResponse.data
                )}`
              );
            }
          } else {
            console.warn("⚠️ Statut HTTP non attendu:", paymentResponse.status);
            throw new Error(
              `Statut HTTP non attendu: ${paymentResponse.status}`
            );
          }
        } catch (paymentError: any) {
          console.error("=== ERREUR LORS DU TRAITEMENT DU PAIEMENT ===");
          console.error("Type d'erreur:", paymentError.name);
          console.error("Message d'erreur:", paymentError.message);

          // Analyser le type d'erreur pour donner un message plus spécifique
          let errorMessage =
            "La vente a été enregistrée mais le paiement n'a pas pu être traité correctement.";

          if (paymentError.code === "ECONNREFUSED") {
            errorMessage += " (Erreur de connexion au serveur)";
            console.error(
              "❌ Erreur de connexion - Le serveur de paiement n'est pas accessible"
            );
          } else if (
            paymentError.code === "ECONNABORTED" ||
            paymentError.message.includes("timeout")
          ) {
            errorMessage += " (Timeout de connexion)";
            console.error(
              "❌ Timeout - Le serveur de paiement met trop de temps à répondre"
            );
          } else if (paymentError.response) {
            console.error(
              "❌ Réponse d'erreur du serveur:",
              paymentError.response.status
            );
            console.error("Données d'erreur:", paymentError.response.data);
            errorMessage += ` (Erreur serveur: ${paymentError.response.status})`;

            // Log détaillé pour debug
            if (
              paymentError.response.data &&
              paymentError.response.data.error
            ) {
              console.error(
                "Détails de l'erreur serveur:",
                paymentError.response.data.error
              );
            }
          } else if (paymentError.request) {
            console.error("❌ Aucune réponse reçue du serveur");
            console.error("Requête:", paymentError.request);
            errorMessage += " (Aucune réponse du serveur)";
          } else {
            console.error(
              "❌ Erreur lors de la préparation de la requête:",
              paymentError.message
            );
          }

          console.error("Stack trace:", paymentError.stack);
          console.log("=== FIN ERREUR PAIEMENT ===");

          // Ne pas faire échouer toute la transaction si l'enregistrement du paiement échoue
          // La vente est déjà enregistrée
          message.warning(errorMessage);
        }
      } else {
        console.log("=== AUCUN PAIEMENT À TRAITER ===");
        console.log("Montant payé = 0, aucun paiement à enregistrer");
      }

      message.success("Vente enregistrée avec succès!");

      // --- Début de la logique d'impression/affichage du ticket ---
      if (printReceipt) {
        try {
          // Récupérer les informations complètes de la commande pour l'impression
          const orderResponse = await axios.get(
            `http://localhost:3000/api/orders/${result.orderId || result.id}`
          );

          if (orderResponse.status === 200) {
            const orderData = orderResponse.data;
            console.log("Données complètes de la commande:", orderData);

            // Préparer les données pour l'impression
            const ticketDataForPrint = {
              order: {
                id: result.orderId || result.id,
                invoice_number:
                  orderData.invoice_number || result.invoice_number || uniqueId,
                order_date: new Date().toISOString(),
                total: montantTotalTTC,
                subtotal: montantBaseHT,
                tax_amount: montantTaxe,
                discount: discount,
                paid_amount: finalPaidAmount,
                due_amount: finalDueAmount,
                payment_mode: selectedModePaiement
                  ? paymentModes.find(
                      (mode) => mode.id === selectedModePaiement
                    )?.name || "Espèces"
                  : "Espèces",
                payment_status: paymentStatus,
                order_status: translatedOrderStatus,
                warehouse_id: selectedWarehouse,
                client_name:
                  customers.find((c) => c.ID_Client === selectedCustomer)
                    ?.Nom_Raison_Sociale ||
                  orderData.customer?.name ||
                  "Client inconnu",
              },
              items: cart.map((item) => ({
                product_id: item.id_produit,
                nom_produit: item.nom_produit,
                cartQuantity: item.cartQuantity,
                prix_vente: item.prix_vente,
                total_price: item.prix_vente * item.cartQuantity,
              })),
              customer: {
                id: selectedCustomer,
                name:
                  customers.find((c) => c.ID_Client === selectedCustomer)
                    ?.Nom_Raison_Sociale ||
                  orderData.customer?.name ||
                  "Client inconnu",
                phone: orderData.customer?.phone || "",
                email: orderData.customer?.email || "",
                address: orderData.customer?.address || "",
              },
              warehouse: warehouseData,
              staff_member: {
                name: user?.name || orderData.staff_name || "Vendeur",
              },
            };

            setOrderData(ticketDataForPrint);
            setTicketVisible(true);
          } else {
            console.warn(
              "Impossible de récupérer les détails complets de la commande"
            );
            const localTicket = createLocalTicketData(saleData, result, [
              ...cart,
            ]);
            setOrderData(localTicket);
            setTicketVisible(true);
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des détails pour l'impression:",
            error
          );
          const localTicket = createLocalTicketData(saleData, result, [
            ...cart,
          ]);
          setOrderData(localTicket);
          setTicketVisible(true);
        }
      }
      // --- Fin de la logique d'impression/affichage du ticket ---

      // Réinitialiser l'interface (panier, etc.)
      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      setClientSearchTerm("");
      setShowClientForm(false);
      setShowSearchResults(false);
      // Ne pas réinitialiser selectedCustomer pour permettre plusieurs ventes au même client

      // *** Actualiser la liste des produits pour refléter le nouveau stock ***
      setLoading(true); // Afficher le spinner pendant le rechargement
      try {
        await fetchProducts(selectedCategory); // Recharger les produits de la catégorie active (ou tous)
      } catch (fetchError) {
        console.error(
          "Erreur lors du rechargement des produits après vente:",
          fetchError
        );
        message.error(
          "Erreur lors de l'actualisation de la liste des produits."
        );
      } finally {
        setLoading(false); // Cacher le spinner
      }
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la vente:", error);
      message.error(
        `Erreur: ${error.message || "Erreur inconnue lors de l'enregistrement"}`
      );
    } finally {
      // Assurer que le loading est false même si une erreur survient avant le rechargement
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Fonction pour créer des données locales pour le ticket en cas d'échec de récupération
  const createLocalTicketData = (
    saleData: any,
    result: any,
    cartItems: any[]
  ) => {
    // Récupérer les informations de l'entrepôt sélectionné
    const currentWarehouseInfo = warehouseData || {
      // Utiliser warehouseData s'il est chargé, sinon fallback
      id: selectedWarehouse,
      name: "Votre Entreprise",
      address: "Adresse de l'entreprise",
      phone: "Téléphone",
      email: "Email",
      logo_url: "/logo-placeholder.png",
      default_pos_order_status: "delivered",
    };

    // Récupérer les informations du client
    const customerInfo = customers.find(
      (c) => c.ID_Client === selectedCustomer
    ) || {
      ID_Client: 0,
      Nom_Raison_Sociale: "Client",
      phone: "",
      email: "",
      address: "",
    };

    // Obtenir le statut de commande en français
    let orderStatus = "Livré"; // Valeur par défaut
    if (saleData.order_status) {
      orderStatus = saleData.order_status;
    } else if (currentWarehouseInfo.default_pos_order_status) {
      orderStatus = translateOrderStatus(
        currentWarehouseInfo.default_pos_order_status
      );
    }

    return {
      order: {
        id: result.orderId || result.id || Date.now(),
        invoice_number:
          result.invoice_number ||
          saleData.invoice_number ||
          `VENTE-${Date.now()}`,
        order_date: saleData.order_date || new Date().toISOString(),
        total: saleData.total,
        subtotal: saleData.subtotal,
        tax_amount: saleData.tax_amount || 0,
        discount: saleData.discount || 0,
        paid_amount: saleData.paid_amount,
        due_amount: saleData.due_amount || 0,
        payment_mode: saleData.payment_mode,
        payment_status: saleData.payment_status || "Non payé",
        order_status: orderStatus,
        warehouse_id: selectedWarehouse,
        client_name: customerInfo.Nom_Raison_Sociale, // Ajout du nom du client
      },
      items: cartItems.map((item) => ({
        product_id: item.id_produit,
        nom_produit: item.nom_produit,
        cartQuantity: item.cartQuantity,
        prix_vente: item.prix_vente,
        total_price: item.prix_vente * item.cartQuantity,
      })),
      customer: {
        id: customerInfo.ID_Client,
        name: customerInfo.Nom_Raison_Sociale,
        phone: customerInfo.phone || "",
        email: customerInfo.email || "",
        address: customerInfo.address || "",
      },
      warehouse: currentWarehouseInfo,
      staff_member: {
        // MODIFICATION: Utiliser le nom de l'utilisateur connecté
        name: user?.name || "Vendeur",
        // email: user?.email || "vendeur@example.com", // Optionnel
      },
    };
  };

  // --- Filtrage dynamique des produits par catégorie ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.quantite_stock >= 1);
  }, [products]);

  // ========== LOGIQUE DE CALCUL CORRIGÉE ==========
  // 1. Base HT initiale = Σ (quantité × PU HT)
  const baseHT = cart.reduce(
    (sum, item) => sum + item.prix_vente * item.cartQuantity,
    0
  );

  // 2. Montant net HT = Base HT – total_remises (remises commerciales avant taxe)
  const montantNetHT = baseHT - discount;

  // 3. Taxe = Montant net HT × taux_Taxe
  const taxAmount = useMemo(() => {
    if (!selectedTax?.rate || montantNetHT <= 0) return 0;
    return montantNetHT * (selectedTax.rate / 100);
  }, [selectedTax, montantNetHT]);

  // 4. Total TTC = Montant net HT + Taxe
  const total = montantNetHT + taxAmount;

  // 5. Montant restant après paiement = Total TTC - Montant payé
  const dueAmount = Math.max(0, total - paidAmount);

  // Calcul du trop-perçu (si le paiement dépasse le total)
  const overpaidAmount = Math.max(0, paidAmount - total);

  // Pour compatibilité avec l'affichage (noms utilisés dans l'interface)
  const subtotal = baseHT; // Alias pour l'affichage
  // ========== FIN LOGIQUE DE CALCUL CORRIGÉE ==========

  // Détermination du statut de paiement
  const paymentStatus = useMemo(() => {
    if (paidAmount <= 0) return "Non payé";
    if (paidAmount >= total) return "Payé";
    return "Partiellement payé";
  }, [paidAmount, total]);

  // Conversion du statut de commande en français
  const translateOrderStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
        return "En attente";
      case "delivered":
        return "Livré";
      case "ordered":
        return "Commandé";
      case "processing":
        return "En traitement";
      case "completed":
        return "Terminé";
      default:
        return "Livré"; // Valeur par défaut
    }
  };

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
  };

  return (
    <Layout
      className={isDarkMode ? "dark-mode" : ""}
      style={{ minHeight: "100vh" }}
    >
      {/* En-tête */}
      <Header
        style={{
          background: isDarkMode ? "#001529" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>
          Point de Vente
        </div>
        <div>
          <Switch
            checkedChildren="Sombre"
            unCheckedChildren="Clair"
            checked={isDarkMode}
            onChange={toggleTheme}
          />
        </div>
      </Header>
      {/* Contenu principal */}
      <Layout>
        <Content
          style={{
            padding: "20px",
            background: isDarkMode ? "#141414" : "#f0f2f5",
          }}
        >
          {loading ? (
            <Spin tip="Chargement..." size="large" />
          ) : (
            <Row gutter={[16, 16]}>
              {/* Section Produits */}
              <Col xs={24} lg={showCart ? 0 : 16}>
                {!selectedWarehouse ? (
                  <Card>
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      Veuillez sélectionner un magasin dans l'en-tête pour
                      afficher les produits.
                    </p>
                  </Card>
                ) : (
                  <>
                    {/* Barre de recherche et scanner */}
                    <Row gutter={8} align="middle" style={{ marginBottom: 16 }}>
                      <Col xs={24} sm={16} md={18}>
                        <div
                          id="search-wrapper"
                          style={{ position: "relative" }}
                        >
                          <Input
                            placeholder="Rechercher un produit..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full" // Assure que l'input prend toute la largeur de sa colonne
                          />
                          {showSearchResults && searchResults.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                zIndex: 1000,
                                background: "#fff",
                                width: "100%",
                                border: "1px solid #d9d9d9",
                                borderRadius: "4px",
                                maxHeight: "300px",
                                overflowY: "auto",
                              }}
                            >
                              {searchResults.map((product) => (
                                <div
                                  key={product.id_produit}
                                  style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                  onClick={() =>
                                    handleSearchResultClick(product)
                                  }
                                >
                                  <img
                                    src={`http://localhost:3000/uploads/image_produits/${product.image}`}
                                    alt={product.nom_produit}
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      objectFit: "cover",
                                      marginRight: 8,
                                    }}
                                    onError={(e: any) => {
                                      e.currentTarget.src =
                                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNEgwVjBoMjR2MjR6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptMCAxOGMtNC40MTEgMC04LTMuNTg5LTgtOHMzLjU4OS04IDgtOCA4IDMuNTg5IDggOC0zLjU4OSA4LTggOHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTMgN2gtMnY0SDd2Mmg0djRoMnYtNGg0di0yaC00Vjd6Ii8+PC9zdmc+";
                                    }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: "bold" }}>
                                      {product.nom_produit}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#888",
                                      }}
                                    >
                                      {product.prix_vente.toLocaleString()} CFA
                                      - Stock: {product.quantite_stock}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Button
                          icon={<QrcodeOutlined />}
                          type={isScanning ? "primary" : "default"}
                          onClick={() => {
                            if (isScanning) {
                              if (scanner) {
                                scanner.clear();
                                setScanner(null);
                              }
                              setIsScanning(false);
                            } else {
                              initializeScanner();
                            }
                          }}
                          className="w-full sm:w-auto" // Prend toute la largeur sur xs, largeur auto sinon
                        >
                          {isScanning ? "Arrêter" : "Scanner"}
                        </Button>
                      </Col>
                    </Row>
                    {isScanning && (
                      <div
                        style={{
                          marginBottom: 16,
                          background: "#fff",
                          padding: 16,
                          borderRadius: 4,
                          textAlign: "center",
                        }}
                      >
                        <div
                          id="scanner-container"
                          style={{ margin: "auto", maxWidth: 300 }}
                        ></div>
                      </div>
                    )}
                    {/* Menu des catégories - barre coulissante horizontalement */}
                    <Row
                      style={{
                        marginBottom: 16,
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        padding: "0 8px", // Ajout d'un padding pour éviter que les boutons collent aux bords
                      }}
                      wrap={false}
                    >
                      <Col style={{ display: "inline-block", marginRight: 8 }}>
                        <Button
                          type={activeCategory === null ? "primary" : "default"}
                          onClick={() => handleCategoryClick(null)}
                        >
                          Tous les produits
                        </Button>
                      </Col>
                      {categories.map((category) => (
                        <Col
                          key={category.id}
                          style={{ display: "inline-block", marginRight: 8 }}
                        >
                          <Button
                            type={
                              activeCategory === category.id
                                ? "primary"
                                : "default"
                            }
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            {category.categorie}
                          </Button>
                        </Col>
                      ))}
                    </Row>
                    {/* Grille des produits */}
                    <Row gutter={[16, 16]}>
                      {filteredProducts.map((product) => (
                        <Col
                          key={product.id_produit}
                          xs={12} // 2 produits par ligne
                          sm={8} // 3 produits par ligne
                          md={6} // 4 produits par ligne
                          lg={4} // 6 produits par ligne
                        >
                          <Card
                            hoverable
                            cover={
                              <img
                                src={`http://localhost:3000/uploads/image_produits/${product.image}`}
                                alt={product.nom_produit}
                                style={{ height: 150, objectFit: "cover" }}
                                onError={(e: any) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNEgwVjBoMjR2MjR6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptMCAxOGMtNC40MTEgMC04LTMuNTg5LTgtOHMzLjU4OS04IDgtOCA4IDMuNTg5IDggOC0zLjU4OSA4LTggOHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTMgN2gtMnY0SDd2Mmg0djRoMnYtNGg0di0yaC00Vjd6Ii8+PC9zdmc+";
                                }}
                              />
                            }
                            onClick={() => handleAddToCart(product)}
                          >
                            <Card.Meta
                              title={product.nom_produit}
                              description={
                                <div>
                                  {product.prix_vente.toLocaleString()} CFA
                                  <br />
                                  Stock: {product.quantite_stock}
                                </div>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </Col>
              {/* Section Panier */}
              <Col xs={24} lg={showCart || !isMobile ? 8 : 0}>
                <Card
                  title="Panier"
                  extra={
                    isMobile && (
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => setShowCart(false)}
                      />
                    )
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Form layout="vertical">
                    <Form.Item label="Client">
                      <Select
                        showSearch
                        placeholder="Sélectionner un client"
                        optionFilterProp="children"
                        value={selectedCustomer || undefined}
                        onChange={(value: number) => setSelectedCustomer(value)}
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {customers.map((customer) => (
                          <Option
                            key={customer.ID_Client}
                            value={customer.ID_Client}
                          >
                            {customer.Nom_Raison_Sociale}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Form>
                  {cart.length > 0 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      block
                      onClick={handleEmptyCart}
                    >
                      Vider le panier
                    </Button>
                  )}
                  <div
                    style={{
                      maxHeight: cart.length > 5 ? 300 : "auto",
                      overflowY: cart.length > 5 ? "auto" : "visible",
                    }}
                  >
                    <List
                      dataSource={cart}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
                              {/* Action 1: Quantité */}
                              <div className="flex items-center justify-center">
                                <Button
                                  icon={<LeftOutlined />}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id_produit,
                                      item.cartQuantity - 1
                                    )
                                  }
                                />
                                <Input
                                  style={{
                                    width: 50,
                                    textAlign: "center",
                                    margin: "0 4px",
                                  }}
                                  type="number"
                                  min={1}
                                  value={item.cartQuantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id_produit,
                                      parseInt(e.target.value)
                                    )
                                  }
                                />
                                <Button
                                  icon={<RightOutlined />}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id_produit,
                                      item.cartQuantity + 1
                                    )
                                  }
                                />
                              </div>
                              ,{/* Action 2: Prix/Édition Prix */}
                              <div className="flex items-center justify-center">
                                {editingItem === item.id_produit ? (
                                  <Input
                                    style={{ width: 80, textAlign: "right" }}
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) =>
                                      setEditPrice(Number(e.target.value))
                                    }
                                    onBlur={() =>
                                      handleSavePrice(item.id_produit)
                                    }
                                    onPressEnter={() =>
                                      handleSavePrice(item.id_produit)
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span style={{ marginRight: 4 }}>
                                      {item.prix_vente.toLocaleString()} CFA
                                    </span>
                                    <Button
                                      icon={<EditOutlined />}
                                      onClick={() =>
                                        handleEditPrice(
                                          item.id_produit,
                                          item.prix_unitaire_HT ??
                                            item.prix_vente
                                        )
                                      }
                                      size="small"
                                    />
                                  </div>
                                )}
                              </div>
                              ,{/* Action 3: Supprimer */}
                              <div className="flex items-center justify-center sm:justify-end">
                                <Button
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleRemoveItem(item.id_produit)
                                  }
                                  type="text"
                                  danger
                                />
                              </div>
                            </div>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <img
                                src={`http://localhost:3000/uploads/image_produits/${item.image}`}
                                alt={item.nom_produit}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                }}
                                onError={(e: any) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNEgwVjBoMjR2MjR6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptMCAxOGMtNC40MTEgMC04LTMuNTg5LTgtOHMzLjU4OS04IDgtOCA4IDMuNTg5IDggOC0zLjU4OSA4LTggOHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTMgN2gtMnY0SDd2Mmg0djRoMnYtNGg0di0yaC00Vjd6Ii8+PC9zdmc+";
                                }}
                              />
                            }
                            title={item.nom_produit}
                            description={`Total: ${(
                              item.prix_vente * item.cartQuantity
                            ).toLocaleString()} CFA`}
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                  <div
                    style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Remise (CFA)">
                          <Input
                            type="number"
                            min={0}
                            value={discount}
                            onChange={(e) =>
                              setDiscount(Number(e.target.value))
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Taxe applicable">
                          <Select
                            placeholder="Aucune taxe"
                            value={selectedTax?.id || undefined}
                            onChange={(value: number) => {
                              const tax = filteredTaxes.find(
                                (t) => t.id === value
                              );
                              setSelectedTax(tax || null);
                            }}
                          >
                            {filteredTaxes.map((tax) => (
                              <Option key={tax.id} value={tax.id}>
                                {tax.name} - {tax.rate}%{" "}
                                {tax.rate < 0 && "(Déduction)"}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Mode de paiement">
                          <Select
                            value={selectedModePaiement}
                            onChange={(value: number) =>
                              setSelectedModePaiement(value)
                            }
                          >
                            {paymentModes.map((mode) => (
                              <Option key={mode.id} value={mode.id}>
                                {mode.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    {/* ========== AFFICHAGE DES TOTAUX - LOGIQUE DE CALCUL ==========
                         1. Base HT initiale = Σ (quantité × PU HT)
                         2. Remise commerciale (avant taxe)
                         3. Montant net HT = Base HT – remise
                         4. Taxe = Montant net HT × taux_taxe
                         5. Total TTC = Montant net HT + Taxe
                         ============================================================ */}
                    <div
                      style={{
                        background: "#fafafa",
                        padding: 16,
                        borderRadius: 4,
                        marginBottom: 16,
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>Base HT:</Col>
                        <Col className="text-right">
                          {subtotal.toLocaleString()} CFA
                        </Col>
                      </Row>
                      <Row justify="space-between" align="middle">
                        <Col>Remise:</Col>
                        <Col className="text-right" style={{ color: "red" }}>
                          -{discount.toLocaleString()} CFA
                        </Col>
                      </Row>
                      <Row justify="space-between" align="middle">
                        <Col>Montant net HT:</Col>
                        <Col
                          className="text-right"
                          style={{ fontWeight: "500" }}
                        >
                          {montantNetHT.toLocaleString()} CFA
                        </Col>
                      </Row>
                      <Row justify="space-between" align="middle">
                        <Col>
                          Taxe{" "}
                          {selectedTax &&
                            `(${selectedTax.name} ${selectedTax.rate}%)`}
                          :
                        </Col>
                        <Col className="text-right">
                          {taxAmount.toLocaleString()} CFA
                        </Col>
                      </Row>
                      <Row
                        justify="space-between"
                        align="middle"
                        style={{
                          borderTop: "1px solid #d9d9d9",
                          paddingTop: 8,
                          fontWeight: "bold",
                        }}
                      >
                        <Col>Total TTC:</Col>
                        <Col
                          className="text-right"
                          style={{ color: "#1890ff" }}
                        >
                          {total.toLocaleString()} CFA
                        </Col>
                      </Row>
                    </div>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item label="Montant payé (CFA)">
                          <Input
                            type="number"
                            min={0}
                            value={paidAmount}
                            onChange={(e) => {
                              let amount = Number(e.target.value);
                              if (isNaN(amount)) {
                                amount = 0;
                              }
                              setPaidAmount(amount);
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div
                      style={{
                        background: "#f6f6f6",
                        padding: 16,
                        borderRadius: 4,
                        marginBottom: 16,
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>Montant dû:</Col>
                        <Col
                          className="text-right"
                          style={{
                            fontWeight: "bold",
                            color: dueAmount > 0 ? "#ff4d4f" : "#52c41a",
                          }}
                        >
                          {dueAmount.toLocaleString()} CFA
                        </Col>
                      </Row>
                      {overpaidAmount > 0 && (
                        <Row justify="space-between" align="middle">
                          <Col>Trop-perçu:</Col>
                          <Col
                            className="text-right"
                            style={{
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            +{overpaidAmount.toLocaleString()} CFA
                          </Col>
                        </Row>
                      )}
                      <Row justify="space-between" align="middle">
                        <Col>Statut du paiement:</Col>
                        <Col className="text-right">
                          <span
                            style={{
                              color:
                                paymentStatus === "Payé"
                                  ? "#52c41a"
                                  : paymentStatus === "Partiellement payé"
                                  ? "#faad14"
                                  : "#ff4d4f",
                              fontWeight: "bold",
                            }}
                          >
                            {paymentStatus}
                            {overpaidAmount > 0 && " (Trop-perçu)"}
                          </span>
                        </Col>
                      </Row>
                    </div>
                    {user &&
                    user?.permissions?.includes(
                      "Gestion Commerciale.POS.use"
                    ) ? (
                      <Button
                        type="primary"
                        block
                        disabled={cart.length === 0 || !selectedCustomer}
                        onClick={handleSubmit}
                      >
                        {cart.length === 0
                          ? "Panier vide"
                          : !selectedCustomer
                          ? "Sélectionner un client"
                          : "Finaliser la vente"}
                      </Button>
                    ) : (
                      <Button type="primary" block disabled>
                        Action non autorisée
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </Content>
        {isMobile && (
          <Footer
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "10px 20px",
              background: "#fff",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              icon={<MenuOutlined />}
              type={!showCart ? "primary" : "default"}
              onClick={() => setShowCart(false)}
            >
              Produits
            </Button>
            <Button
              icon={<ShoppingCartOutlined />}
              type={showCart ? "primary" : "default"}
              onClick={() => setShowCart(true)}
            >
              Panier ({cart.length})
            </Button>
          </Footer>
        )}
      </Layout>

      {/* Composant de ticket de caisse */}
      <TicketCaisse
        visible={ticketVisible}
        order={orderData}
        onClose={handleReset}
      />
    </Layout>
  );
};

export default GestionPos;
