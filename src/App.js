// App.js
import React, { useState, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
// Import des icônes ant-design
import {
  HomeOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DropboxOutlined,
  ShoppingOutlined,
  BankOutlined,
  WalletOutlined,
  ShopFilled,
  GlobalOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  InteractionOutlined,
  IdcardOutlined,
  KeyOutlined,
  PercentageOutlined,
  DollarCircleOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

// Importation des composants existants
import Login from "./auth/Login";
import HomePage from "./pages/accueil/HomePage";
import GestionProduit from "./gestion-produits/GestionProduit.jsx";
import GestionEntitieClient from "./gestion-entites/Gestion.entitie_client.jsx";
import GestionEntitieFournisseur from "./gestion-entites/Gestion.entitie_fournisseur.jsx";
import GestionAchat from "./gestion-achat/GestionAchat.tsx";
import GestionRetourAchat from "./gestion-retour-achat/GestionRetourAchat.tsx";
import GestionVente from "./gestion-vente/GestionVente.tsx";
import GestionRetourVente from "./gestion-retour-vente/GestionRetourVente.tsx";
import GestionPos from "./gestion-pos/GestionPos.tsx";
import GestionStaff from "./gestion-User/GestionStaff.jsx";
import GestionMagasin from "./gestion-magasins/GestionMagasin.jsx";
import GestionRolesPermissions from "./gestion-RolesPermissions/GestionRolesPermissions.jsx";
import GestionTaxes from "./gestion-taxes/GestionTaxes.tsx";
import GestionDevise from "./gestion-devise/GestionDevise.tsx";
import GestionModePaiement from "./gestion-ModePaiement/GestionModePaiement.js";
import GestionUnites from "./gestion-unites/GestionUnites.js";
import Brands from "./gestion-brands/Brands";
import GestionCategories from "./gestion-categories/GestionCategories";
import GestionCompanies from "./gestion-entreprises/GestionCompanies";
import GestionProforma from "./gestion-proforma/GestionProforma.tsx";
import GestionStock from "./gestion-stock/GestionStock.jsx";
import RightSideNav from "./RightSideNav.jsx";
import LeftSideNav from "./LeftSideNav.jsx";
import { SelectionProvider } from "./SelectionContext";
import "./App.css";
import PaymentSortant from "./gestion-payments/PaymentSortant.tsx";
import PaymentEntrant from "./gestion-payments/PaymentEntrant.tsx";
/// Importation des composants de production
import {
  ProductionList,
  ProductionUnitForm,
  ProductionProcess,
  ProductionHistory,
} from "./GestionProductions";
// Import des nouveaux composants Dépenses
import GestionCategoriesDepenses from "./gestion-depenses/GestionCategoriesDepenses.jsx";
import GestionSaisieDepenses from "./gestion-depenses/GestionSaisieDepenses.jsx";
import GestionTresorerie from "./gestion-tresoreries/GestionTresorerie.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
// Import du nouveau composant Dashboard
import Dashboard from "./gestion-dashboard/Dashboard";

// Import des nouvelles pages de guides
import GuidesLandingPage from "./pages/guides/GuidesLandingPage.jsx";
import GuideDetailPage from "./pages/guides/GuideDetailPage.jsx";
import SupportPage from "./pages/support/SupportPage.jsx";

// Import de la nouvelle Landing Page
import ElsaLandingPage from "./pages/ElsaLandingPage"; // Ajustez le chemin si nécessaire
import { Helmet, HelmetProvider } from "react-helmet-async"; // SEO
import PaymentPage from "./pages/PaymentPage";

// Import des pages légales
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";
import LegalNotice from "./pages/legal/LegalNotice";
import GDPR from "./pages/legal/GDPR";

// Amélioré avec useLocation pour un meilleur suivi de navigation
const PermissionRefresher = () => {
  const { refreshUserPermissions } = useAuth();
  const location = useLocation();

  // Rafraîchir les permissions lorsque l'utilisateur navigue vers des modules importants
  React.useEffect(() => {
    // Liste des chemins importants où les permissions doivent être vérifiées
    const importantPaths = [
      "/gestion-produits",
      "/gestion-entites/clients",
      "/gestion-achat",
      "/gestion-vente",
      "/gestion-pos",
      "/gestion-personnel",
      "/gestion-roles-permissions",
      "/gestion-entreprises",
      // Ajoutez d'autres chemins selon vos besoins
    ];

    // Si l'utilisateur navigue vers un module important, rafraîchir les permissions
    if (importantPaths.some((path) => location.pathname.startsWith(path))) {
      console.log(
        "Navigation vers un module important, rafraîchissement des permissions..."
      );
      refreshUserPermissions(false); // false = ne pas forcer si récemment rafraîchi
    }
  }, [location.pathname, refreshUserPermissions]); // Ajout de refreshUserPermissions aux dépendances

  // Ce composant ne rend rien, il effectue simplement son effet secondaire
  return null;
};

// --- Composant pour les Routes Protégées (Modifié) ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Chargement de l'authentification...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route protégée par permission spécifique
const PermissionProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Chargement des permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les permissions
  if (!hasPermission(requiredPermission)) {
    // Rediriger vers une page d'accès refusé ou la page d'accueil
    return <Navigate to="/acces-refuse" replace />;
  }

  return children;
};

// --- Composant pour le Layout Principal ---
const MainAppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuForceClose, setMenuForceClose] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({
    gestionCommerciale: false,
    entites: false,
    produits: false,
    approvisionnement: false,
    achats: false,
    production: false,
    ventes: false,
    stock: false,
    ecommerce: false,
    depenses: false,
    admin: false,
    "ecommerce-config": false,
    staff: false,
    magasins: false,
    rolesPermissions: false,
    userCompanies: false,
    settings: false,
    ventesPos: false,
    ventesEcommerce: false,
    retoursVente: false,
    proformas: false,
    achatsDirects: false,
    retoursAchat: false,
  });

  const { user, logout } = useAuth();

  const menuHierarchy = useMemo(
    () => ({
      gestionCommerciale: [
        "entites",
        "produits",
        "approvisionnement",
        "achats",
        "production",
        "ventes",
        "stock",
        "ecommerce",
        "depenses",
      ],
      admin: [
        "staff",
        "magasins",
        "rolesPermissions",
        "userCompanies",
        "settings",
        "ecommerce-config",
      ],
      ventes: ["ventesPos", "ventesEcommerce", "retoursVente", "proformas"],
      achats: ["achatsDirects", "retoursAchat"],
    }),
    []
  );

  const getAllDescendantKeys = React.useCallback(
    (itemName, hierarchy, currentOpenState) => {
      let descendants = [];
      const directChildren = hierarchy[itemName] || [];
      for (const child of directChildren) {
        if (currentOpenState.hasOwnProperty(child)) {
          descendants.push(child);
          descendants = descendants.concat(
            getAllDescendantKeys(child, hierarchy, currentOpenState)
          );
        }
      }
      return descendants;
    },
    [] // Removed menuHierarchy and openSubmenus, as they might cause stale closures if not updated.
    // Let toggleSubmenu handle current state directly from its closure or props.
  );

  const userPermissions = useMemo(
    () => new Set(user?.permissions || []),
    [user]
  );

  const hasPermission = React.useCallback(
    (permissionKey) => {
      // useCallback for stable function reference
      return userPermissions.has(permissionKey);
    },
    [userPermissions]
  );

  const hasAnyPermissionInModule = React.useCallback(
    (modulePrefix) => {
      // useCallback
      if (!user?.permissions) return false;
      return user.permissions.some((p) => p.startsWith(modulePrefix));
    },
    [user]
  );

  const resetAllMobileVisualStates = () => {
    if (typeof document !== "undefined") {
      document
        .querySelectorAll(
          ".submenu.visible, .submenu2.visible, .submenu3.visible"
        )
        .forEach((el) => {
          el.classList.remove("visible");
        });
      document
        .querySelectorAll(
          ".submenu-indicator.open, .submenu-indicator-right.open"
        )
        .forEach((el) => {
          el.classList.remove("open");
        });
    }
  };

  const toggleMobileMenu = () => {
    const newMobileMenuOpen = !mobileMenuOpen;
    setMobileMenuOpen(newMobileMenuOpen);
    if (!newMobileMenuOpen) {
      setOpenSubmenus((prevState) =>
        Object.keys(prevState).reduce(
          (acc, key) => ({ ...acc, [key]: false }),
          {}
        )
      );
      resetAllMobileVisualStates();
    }
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setMenuForceClose(true); // This helps ensure desktop hover menus don't immediately pop open
    // Close all submenus logically
    setOpenSubmenus((prevState) =>
      Object.keys(prevState).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {}
      )
    );
    // Reset visual states for mobile, though it might be redundant if mobileMenuOpen is false
    resetAllMobileVisualStates();
  };

  const toggleSubmenu = (submenuName, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // This logic is primarily for mobile view (controlled by mobileMenuOpen)
    // Desktop hover effects are usually CSS-driven and don't need this state as much for visibility,
    // but state can be used for aria-expanded attributes for accessibility.
    // For simplicity here, we'll focus on the click-to-toggle for mobile.

    if (window.innerWidth <= 768) {
      // Or your Tailwind md breakpoint
      const parentLi = event.currentTarget.closest("li");
      if (!parentLi) return;

      const submenuElement = parentLi.querySelector(
        ":scope > .submenu, :scope > .submenu2, :scope > .submenu3"
      );
      // const indicatorElement = event.currentTarget.querySelector(
      //   ".submenu-indicator, .submenu-indicator-right"
      // );

      if (!submenuElement) return;

      const isCurrentlyOpenForState = openSubmenus[submenuName];

      setOpenSubmenus((prevOpenSubmenus) => {
        const newOpenState = { ...prevOpenSubmenus };

        // If the clicked menu is currently open, close it and all its descendants
        if (isCurrentlyOpenForState) {
          newOpenState[submenuName] = false;
          const descendantKeys = getAllDescendantKeys(
            submenuName,
            menuHierarchy,
            prevOpenSubmenus
          );
          descendantKeys.forEach((key) => {
            if (newOpenState.hasOwnProperty(key)) newOpenState[key] = false;
          });
        } else {
          // If the clicked menu is closed, open it.
          // Optionally, close sibling submenus at the same level first.
          const parentUl = parentLi.parentElement;
          if (parentUl) {
            Array.from(parentUl.children).forEach((siblingLi) => {
              if (siblingLi !== parentLi && siblingLi.dataset.submenuName) {
                const siblingKey = siblingLi.dataset.submenuName;
                if (newOpenState[siblingKey]) {
                  // if sibling is open
                  newOpenState[siblingKey] = false;
                  const siblingDescendants = getAllDescendantKeys(
                    siblingKey,
                    menuHierarchy,
                    prevOpenSubmenus
                  );
                  siblingDescendants.forEach((descKey) => {
                    if (newOpenState.hasOwnProperty(descKey))
                      newOpenState[descKey] = false;
                  });
                }
              }
            });
          }
          newOpenState[submenuName] = true;
        }
        return newOpenState;
      });
    }
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // Tailwind's 'md' breakpoint
        if (mobileMenuOpen) {
          // If mobile menu was open and we resized to desktop
          setMobileMenuOpen(false); // Close mobile menu
          // Reset all submenu states, as desktop relies on hover (or different logic)
          setOpenSubmenus((prevState) =>
            Object.keys(prevState).reduce(
              (acc, key) => ({ ...acc, [key]: false }),
              {}
            )
          );
          resetAllMobileVisualStates(); // Clean up any mobile-specific classes
        }
        setMenuForceClose(false); // Allow hover menus on desktop
      } else {
        // Mobile view
        // On mobile, if menuForceClose was true (e.g. after a link click), set it to false
        // so that the menu can be opened again.
        if (menuForceClose) setMenuForceClose(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen, menuForceClose]); // Added menuForceClose

  const handleNavMouseEnter = () => {
    if (window.innerWidth > 768) {
      // Only apply for desktop
      setMenuForceClose(false);
    }
  };

  const handleLogout = () => {
    logout();
    // Optionally navigate to login or home page after logout
    // navigate('/login'); // if you have access to navigate function
  };

  return (
    <div className="app-container">
      <PermissionRefresher />
      <header className="main-header">
        <div className="logo-container">
          <Link to={user ? "/accueil" : "/"} onClick={handleLinkClick}>
            <img
              src="/images/LOGO ELSA GESTION.png"
              alt="ELSA GESTION"
              className="logo-image"
            />
          </Link>
        </div>
        <nav className="main-nav" onMouseEnter={handleNavMouseEnter}>
          <div className="menu-toggle" onClick={toggleMobileMenu}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
          <ul
            className={`menu ${mobileMenuOpen ? "open" : ""} ${
              menuForceClose ? "force-close" : ""
            }`}
          >
            <li className="menu-item">
              <Link to="/accueil" onClick={handleLinkClick}>
                <HomeOutlined className="menu-icon" /> Accueil
              </Link>
            </li>

            {/* --- GESTION COMMERCIALE --- */}
            {hasAnyPermissionInModule("Gestion Commerciale.") && (
              <li
                className="menu-item has-submenu"
                data-submenu-name="gestionCommerciale"
              >
                <span onClick={(e) => toggleSubmenu("gestionCommerciale", e)}>
                  <ShopFilled className="menu-icon" /> Gestion Commerciale{" "}
                  <span
                    className={`submenu-indicator ${
                      openSubmenus.gestionCommerciale ? "open" : ""
                    }`}
                  >
                    {openSubmenus.gestionCommerciale ? "▴" : "▾"}
                  </span>
                </span>
                <ul
                  className={`submenu ${
                    openSubmenus.gestionCommerciale ? "visible" : ""
                  }`}
                >
                  {" "}
                  {hasPermission("Gestion Commerciale.Dashboard.view") && (
                    <li>
                      <Link to="/tableau-de-bord" onClick={handleLinkClick}>
                        <DashboardOutlined className="menu-icon" /> Tableau de
                        bord
                      </Link>
                    </li>
                  )}
                  {(hasPermission("Gestion Commerciale.Entites.Clients.view") ||
                    hasPermission(
                      "Gestion Commerciale.Entites.Fournisseurs.view"
                    )) && (
                    <li className="has-submenu" data-submenu-name="entites">
                      <a href="#" onClick={(e) => toggleSubmenu("entites", e)}>
                        {" "}
                        <TeamOutlined className="menu-icon" /> Gestion Entités{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.entites ? "open" : ""
                          }`}
                        >
                          {openSubmenus.entites ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.entites ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {hasPermission(
                          "Gestion Commerciale.Entites.Clients.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-entites/clients"
                              onClick={handleLinkClick}
                            >
                              Clients
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Entites.Fournisseurs.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-entites/fournisseurs"
                              onClick={handleLinkClick}
                            >
                              Fournisseurs
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {(hasPermission(
                    "Gestion Commerciale.Produits.Marques.view"
                  ) ||
                    hasPermission(
                      "Gestion Commerciale.Produits.Categories.view"
                    ) ||
                    hasPermission(
                      "Gestion Commerciale.Produits.Produits.view"
                    ) ||
                    hasPermission(
                      "Gestion Commerciale.Produits.Unites.view"
                    )) && (
                    <li className="has-submenu" data-submenu-name="produits">
                      <a href="#" onClick={(e) => toggleSubmenu("produits", e)}>
                        <ShopOutlined className="menu-icon" /> Gestion Produits{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.produits ? "open" : ""
                          }`}
                        >
                          {openSubmenus.produits ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.produits ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {hasPermission(
                          "Gestion Commerciale.Produits.Marques.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-brands"
                              onClick={handleLinkClick}
                            >
                              Marques
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Produits.Categories.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-categories"
                              onClick={handleLinkClick}
                            >
                              Catégories
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Produits.Produits.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-produits"
                              onClick={handleLinkClick}
                            >
                              Produits
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Produits.Unites.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-unites"
                              onClick={handleLinkClick}
                            >
                              Unités
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {(hasAnyPermissionInModule(
                    "Gestion Commerciale.Approvisionnement.Achats."
                  ) ||
                    hasAnyPermissionInModule(
                      "Gestion Commerciale.Approvisionnement.Production."
                    )) && (
                    <li
                      className="has-submenu"
                      data-submenu-name="approvisionnement"
                    >
                      <a
                        href="#"
                        onClick={(e) => toggleSubmenu("approvisionnement", e)}
                      >
                        <ShoppingCartOutlined className="menu-icon" />{" "}
                        Approvisionnement{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.approvisionnement ? "open" : ""
                          }`}
                        >
                          {openSubmenus.approvisionnement ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.approvisionnement ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {(hasPermission(
                          "Gestion Commerciale.Approvisionnement.Achats.Achat.view"
                        ) ||
                          hasPermission(
                            "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view"
                          ) ||
                          hasPermission(
                            "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.view"
                          )) && (
                          <li
                            className="has-submenu"
                            data-submenu-name="achats"
                          >
                            <a
                              href="#"
                              onClick={(e) => toggleSubmenu("achats", e)}
                            >
                              Gestion Achats{" "}
                              <span
                                className={`submenu-indicator submenu-indicator-right ${
                                  openSubmenus.achats ? "open" : ""
                                }`}
                              >
                                {openSubmenus.achats ? "▴" : "▾"}
                              </span>
                            </a>
                            <ul
                              className={`submenu3 ${
                                openSubmenus.achats ? "visible" : ""
                              }`}
                            >
                              {" "}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Achats.Achat.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/gestion-achat"
                                    onClick={handleLinkClick}
                                  >
                                    Achat
                                  </Link>
                                </li>
                              )}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/retour-achat"
                                    onClick={handleLinkClick}
                                  >
                                    Retour d'achat
                                  </Link>
                                </li>
                              )}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/paiements-sortants"
                                    onClick={handleLinkClick}
                                  >
                                    Paiements Sortants
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </li>
                        )}
                        {(hasPermission(
                          "Gestion Commerciale.Approvisionnement.Production.Unites.view"
                        ) ||
                          hasPermission(
                            "Gestion Commerciale.Approvisionnement.Production.Gerer.view"
                          ) ||
                          hasPermission(
                            "Gestion Commerciale.Approvisionnement.Production.Historique.view"
                          )) && (
                          <li
                            className="has-submenu"
                            data-submenu-name="production"
                          >
                            <a
                              href="#"
                              onClick={(e) => toggleSubmenu("production", e)}
                            >
                              Gestion Production{" "}
                              <span
                                className={`submenu-indicator submenu-indicator-right ${
                                  openSubmenus.production ? "open" : ""
                                }`}
                              >
                                {openSubmenus.production ? "▴" : "▾"}
                              </span>
                            </a>
                            <ul
                              className={`submenu3 ${
                                openSubmenus.production ? "visible" : ""
                              }`}
                            >
                              {" "}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Production.Unites.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/production/units"
                                    onClick={handleLinkClick}
                                  >
                                    Unités de production
                                  </Link>
                                </li>
                              )}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Production.Gerer.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/production/process"
                                    onClick={handleLinkClick}
                                  >
                                    Gérer la production
                                  </Link>
                                </li>
                              )}
                              {hasPermission(
                                "Gestion Commerciale.Approvisionnement.Production.Historique.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/production/history"
                                    onClick={handleLinkClick}
                                  >
                                    Historique productions
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {(hasPermission("Gestion Commerciale.Ventes.Ventes.view") ||
                    hasPermission(
                      "Gestion Commerciale.Ventes.RetourVente.view"
                    ) ||
                    hasPermission(
                      "Gestion Commerciale.Ventes.ProformaDevis.view"
                    ) ||
                    hasPermission(
                      "Gestion Commerciale.Ventes.PaiementsEntrants.view"
                    )) && (
                    <li className="has-submenu" data-submenu-name="ventes">
                      <a href="#" onClick={(e) => toggleSubmenu("ventes", e)}>
                        <ShoppingOutlined className="menu-icon" /> Gestion
                        Ventes{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.ventes ? "open" : ""
                          }`}
                        >
                          {openSubmenus.ventes ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.ventes ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {hasPermission(
                          "Gestion Commerciale.Ventes.Ventes.view"
                        ) && (
                          <li>
                            <Link to="/gestion-vente" onClick={handleLinkClick}>
                              Ventes
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Ventes.RetourVente.view"
                        ) && (
                          <li>
                            <Link to="/retour-vente" onClick={handleLinkClick}>
                              Retour de vente
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Ventes.ProformaDevis.view"
                        ) && (
                          <li>
                            <Link
                              to="/gestion-proforma"
                              onClick={handleLinkClick}
                            >
                              Proforma/Devis
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Ventes.PaiementsEntrants.view"
                        ) && (
                          <li>
                            <Link
                              to="/paiements-entrants"
                              onClick={handleLinkClick}
                            >
                              Paiements Entrants
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {(hasPermission(
                    "Gestion Commerciale.Stock.GestionStock.Transfer.view"
                  ) ||
                    hasPermission(
                      "Gestion Commerciale.Stock.GestionStock.Adjust.view"
                    )) && (
                    <li className="has-submenu" data-submenu-name="stock">
                      <a href="#" onClick={(e) => toggleSubmenu("stock", e)}>
                        <DropboxOutlined className="menu-icon" /> Gestion Stock{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.stock ? "open" : ""
                          }`}
                        >
                          {openSubmenus.stock ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.stock ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {(hasPermission(
                          "Gestion Commerciale.Stock.GestionStock.Transfer.view"
                        ) ||
                          hasPermission(
                            "Gestion Commerciale.Stock.GestionStock.Adjust.view"
                          )) && (
                          <li>
                            <Link to="/gestion-stock" onClick={handleLinkClick}>
                              <InteractionOutlined
                                style={{ marginRight: "8px" }}
                              />
                              Transfert & Ajustement
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {hasPermission(
                    "Gestion Commerciale.Tresorerie.Comptes.view"
                  ) && (
                    <li>
                      <Link to="/caisse-banques" onClick={handleLinkClick}>
                        <BankOutlined className="menu-icon" /> Trésoreries
                      </Link>
                    </li>
                  )}
                  {(hasPermission(
                    "Gestion Commerciale.Depenses.Categories.view"
                  ) ||
                    hasPermission(
                      "Gestion Commerciale.Depenses.SaisieDepenses.view"
                    )) && (
                    <li className="has-submenu" data-submenu-name="depenses">
                      <a href="#" onClick={(e) => toggleSubmenu("depenses", e)}>
                        <WalletOutlined className="menu-icon" /> Dépenses{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.depenses ? "open" : ""
                          }`}
                        >
                          {openSubmenus.depenses ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.depenses ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {hasPermission(
                          "Gestion Commerciale.Depenses.Categories.view"
                        ) && (
                          <li>
                            <Link
                              to="/categories-depenses"
                              onClick={handleLinkClick}
                            >
                              Catégories de dépenses
                            </Link>
                          </li>
                        )}
                        {hasPermission(
                          "Gestion Commerciale.Depenses.SaisieDepenses.view"
                        ) && (
                          <li>
                            <Link
                              to="/saisie-depenses"
                              onClick={handleLinkClick}
                            >
                              Saisie dépenses
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {(hasPermission(
                    "Gestion Commerciale.Ecommerce.CommandesEnLigne.view"
                  ) ||
                    hasAnyPermissionInModule(
                      "Gestion Commerciale.Ecommerce.Configuration."
                    )) && (
                    <li className="has-submenu" data-submenu-name="ecommerce">
                      <a
                        href="#"
                        onClick={(e) => toggleSubmenu("ecommerce", e)}
                      >
                        <GlobalOutlined className="menu-icon" /> E-commerce{" "}
                        <span
                          className={`submenu-indicator submenu-indicator-right ${
                            openSubmenus.ecommerce ? "open" : ""
                          }`}
                        >
                          {openSubmenus.ecommerce ? "▴" : "▾"}
                        </span>
                      </a>
                      <ul
                        className={`submenu2 ${
                          openSubmenus.ecommerce ? "visible" : ""
                        }`}
                      >
                        {" "}
                        {hasPermission(
                          "Gestion Commerciale.Ecommerce.CommandesEnLigne.view"
                        ) && (
                          <li>
                            <Link
                              to="/commandes-en-ligne"
                              onClick={handleLinkClick}
                            >
                              Commandes en ligne
                            </Link>
                          </li>
                        )}
                        {hasAnyPermissionInModule(
                          "Gestion Commerciale.Ecommerce.Configuration."
                        ) && (
                          <li
                            className="has-submenu"
                            data-submenu-name="ecommerce-config"
                          >
                            <a
                              href="#"
                              onClick={(e) =>
                                toggleSubmenu("ecommerce-config", e)
                              }
                            >
                              Configuration du site{" "}
                              <span
                                className={`submenu-indicator submenu-indicator-right ${
                                  openSubmenus["ecommerce-config"] ? "open" : ""
                                }`}
                              >
                                {openSubmenus["ecommerce-config"] ? "▴" : "▾"}
                              </span>
                            </a>
                            <ul
                              className={`submenu3 ${
                                openSubmenus["ecommerce-config"]
                                  ? "visible"
                                  : ""
                              }`}
                            >
                              {" "}
                              {hasPermission(
                                "Gestion Commerciale.Ecommerce.Configuration.FichesProduit.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/fiches-produit"
                                    onClick={handleLinkClick}
                                  >
                                    Fiches produit
                                  </Link>
                                </li>
                              )}
                              {hasPermission(
                                "Gestion Commerciale.Ecommerce.Configuration.Frontend.view"
                              ) && (
                                <li>
                                  <Link
                                    to="/parametres-frontend"
                                    onClick={handleLinkClick}
                                  >
                                    Paramètres frontend
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </li>
                        )}
                      </ul>
                    </li>
                  )}
                  {hasPermission("Gestion Commerciale.Rapports.view") && (
                    <li>
                      <Link to="/rapport" onClick={handleLinkClick}>
                        <BarChartOutlined className="menu-icon" /> Rapport
                      </Link>
                    </li>
                  )}
                  {hasPermission("Gestion Commerciale.POS.use") && (
                    <li>
                      <Link to="/gestion-pos" onClick={handleLinkClick}>
                        <ShopOutlined className="menu-icon" /> Point de vente
                      </Link>
                    </li>
                  )}
                </ul>
              </li>
            )}
            {/* --- ADMIN --- */}
            {hasAnyPermissionInModule("Admin.") && (
              <li className="menu-item has-submenu" data-submenu-name="admin">
                <span onClick={(e) => toggleSubmenu("admin", e)}>
                  <SettingOutlined className="menu-icon" /> Admin{" "}
                  <span
                    className={`submenu-indicator ${
                      openSubmenus.admin ? "open" : ""
                    }`}
                  >
                    {openSubmenus.admin ? "▴" : "▾"}
                  </span>
                </span>
                <ul
                  className={`submenu ${openSubmenus.admin ? "visible" : ""}`}
                >
                  {" "}
                  {hasPermission("Admin.Souscription.view") && (
                    <li>
                      <Link to="/souscription" onClick={handleLinkClick}>
                        <IdcardOutlined className="menu-icon" /> Souscription
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.GestionEntreprises.view") && (
                    <li>
                      <Link to="/gestion-entreprises" onClick={handleLinkClick}>
                        <BankOutlined className="menu-icon" /> Gestion
                        Entreprises
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.GestionUtilisateurs.view") && (
                    <li>
                      <Link to="/gestion-personnel" onClick={handleLinkClick}>
                        <UserOutlined className="menu-icon" /> Utilisateurs
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.Magasins.view") && (
                    <li>
                      <Link to="/gestion-magasin" onClick={handleLinkClick}>
                        <ShopOutlined className="menu-icon" /> Magasin
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.RolesPermissions.view") && (
                    <li>
                      <Link
                        to="/gestion-roles-permissions"
                        onClick={handleLinkClick}
                      >
                        <KeyOutlined className="menu-icon" /> Rôles et
                        permissions
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.Taxes.view") && (
                    <li>
                      <Link to="/gestion-taxes" onClick={handleLinkClick}>
                        <PercentageOutlined className="menu-icon" /> Taxes
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.Devises.view") && (
                    <li>
                      <Link to="/gestion-devise" onClick={handleLinkClick}>
                        <DollarCircleOutlined className="menu-icon" /> Devise
                      </Link>
                    </li>
                  )}
                  {hasPermission("Admin.ModesPaiement.view") && (
                    <li>
                      <Link
                        to="/gestion-mode-paiement"
                        onClick={handleLinkClick}
                      >
                        <CreditCardOutlined className="menu-icon" /> Mode de
                        paiement
                      </Link>
                    </li>
                  )}
                </ul>
              </li>
            )}
            <li className="menu-item">
              <a href="#" onClick={handleLogout} style={{ cursor: "pointer" }}>
                Déconnexion
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <div className="top-section-below-header relative flex flex-col sm:flex-row sm:justify-between items-stretch gap-3 p-sm sm:p-md bg-gray-50 border-b border-gray-200">
        <LeftSideNav />
        <RightSideNav />
      </div>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// --- Composant Principal App ---
const App = () => {
  return (
    <HelmetProvider>
      {" "}
      {/* Needed for react-helmet-async */}
      <SelectionProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </SelectionProvider>
    </HelmetProvider>
  );
};

// Create a new component to handle conditional routing based on auth state
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log(
    "[AppRoutes] isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated,
    "Current Path:",
    window.location.pathname
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Chargement de l'application...
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/accueil" replace /> : <Login />
        }
      />

      {/* Payment Route */}
      <Route path="/payment" element={<PaymentPage />} />

      {/* Registration Route (Placeholder - Create this component) */}
      {!isAuthenticated && (
        <Route
          path="/register"
          element={
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h1>Page d'inscription</h1>
              <p>Cette page est en cours de construction.</p>
              <Link to="/">Retour à la Landing Page</Link>
            </div>
          }
        />
      )}

      {/* Pages légales */}
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/legal" element={<LegalNotice />} />
      <Route path="/gdpr" element={<GDPR />} />

      {/* Page d'accès refusé */}
      <Route
        path="/acces-refuse"
        element={
          <ProtectedRoute>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h1>Accès refusé</h1>
              <p>
                Vous n'avez pas les permissions nécessaires pour accéder à cette
                page.
              </p>
              <Link to="/accueil">Retour à l'accueil</Link>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Main Application Layout */}
      {/* This should catch all other paths intended for the authenticated app */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainAppLayout />
          ) : window.location.pathname === "/" ? (
            <ElsaLandingPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {/* Default route for authenticated users if MainAppLayout is hit via /* but no sub-path matched */}
        {/* This index route under /* is now more critical */}
        <Route index element={<Navigate to="/accueil" replace />} />

        {/* All your existing protected routes are defined here, nested under MainAppLayout */}
        <Route path="accueil" element={<HomePage />} />
        <Route path="gestion-produits" element={<GestionProduit />} />
        <Route path="gestion-brands" element={<Brands />} />
        <Route path="gestion-categories" element={<GestionCategories />} />
        <Route
          path="gestion-entites/clients"
          element={<GestionEntitieClient />}
        />
        <Route
          path="gestion-entites/fournisseurs"
          element={<GestionEntitieFournisseur />}
        />
        <Route
          path="gestion-achat"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Achats.Achat.view">
              <GestionAchat />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="retour-achat"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view">
              <GestionRetourAchat />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="paiements-sortants"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.view">
              <PaymentSortant />
            </PermissionProtectedRoute>
          }
        />
        <Route path="gestion-vente" element={<GestionVente />} />
        <Route path="gestion-pos" element={<GestionPos />} />
        <Route path="gestion-entreprises" element={<GestionCompanies />} />
        <Route path="gestion-personnel" element={<GestionStaff />} />
        <Route path="gestion-magasin" element={<GestionMagasin />} />
        <Route
          path="gestion-roles-permissions"
          element={<GestionRolesPermissions />}
        />
        <Route path="gestion-taxes" element={<GestionTaxes />} />
        <Route path="gestion-devise" element={<GestionDevise />} />
        <Route path="gestion-mode-paiement" element={<GestionModePaiement />} />
        <Route path="gestion-unites" element={<GestionUnites />} />
        <Route path="paiements-entrants" element={<PaymentEntrant />} />
        <Route path="retour-vente" element={<GestionRetourVente />} />
        <Route path="gestion-proforma" element={<GestionProforma />} />
        <Route
          path="production/units"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Unites.view">
              <ProductionList />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="production/units/create"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Unites.create">
              <ProductionUnitForm />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="production/units/edit/:id"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Unites.edit">
              <ProductionUnitForm />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="production/process"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Gerer.view">
              <ProductionProcess />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="production/process/:id"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Gerer.view">
              <ProductionProcess />
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="production/history"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Approvisionnement.Production.Historique.view">
              <ProductionHistory />
            </PermissionProtectedRoute>
          }
        />
        <Route path="gestion-stock" element={<GestionStock />} />
        <Route path="caisse-banques" element={<GestionTresorerie />} />
        <Route
          path="categories-depenses"
          element={<GestionCategoriesDepenses />}
        />
        <Route path="saisie-depenses" element={<GestionSaisieDepenses />} />
        <Route
          path="commandes-en-ligne"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Ecommerce.CommandesEnLigne.view">
              <div>Commandes en ligne (à implémenter)</div>
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="fiches-produit"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Ecommerce.Configuration.FichesProduit.view">
              <div>Fiches produit (à implémenter)</div>
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="parametres-frontend"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Ecommerce.Configuration.Frontend.view">
              <div>Paramètres frontend (à implémenter)</div>
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="rapport"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Rapports.view">
              <div>Rapport (à implémenter)</div>
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="souscription"
          element={
            <PermissionProtectedRoute requiredPermission="Admin.Souscription.view">
              <div>Souscription (à implémenter)</div>
            </PermissionProtectedRoute>
          }
        />
        <Route
          path="tableau-de-bord"
          element={
            <PermissionProtectedRoute requiredPermission="Gestion Commerciale.Dashboard.view">
              <Dashboard />
            </PermissionProtectedRoute>
          }
        />
        <Route path="guides" element={<GuidesLandingPage />} />
        <Route path="guides/:guideSlug" element={<GuideDetailPage />} />
        <Route path="support" element={<SupportPage />} />
        {/* Catch-all for any other paths within the authenticated app's MainAppLayout */}
        {/* This ensures that if an authenticated user types a non-existent path like /dfgdfg, they see this */}
        <Route
          path="*"
          element={
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h1>404 - Page Introuvable dans l'application</h1>
              <p>La page que vous cherchez n'existe pas.</p>
              <Link to="/accueil">Retour à l'accueil</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
