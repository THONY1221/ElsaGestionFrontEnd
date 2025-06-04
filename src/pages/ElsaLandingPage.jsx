import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./ElsaLandingPage.css"; // CSS file will be named similarly

// Icon Placeholder Component (Consider using a library like react-icons for actual icons)
const IconPlaceholder = ({
  className = "w-10 h-10 p-2 bg-blue-100 text-blue-600 rounded-full inline-block mb-3",
  type,
}) => (
  <span
    className={className}
    role="img"
    aria-label={`${type || "icon"} placeholder`}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
      {type === "commerciale" && (
        <path d="M17.707 9.293l-7-7a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h14a1 1 0 00.707-1.707zM12 10a2 2 0 11-4 0 2 2 0 014 0zM5 12h10v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1z" />
      )}
      {type === "admin" && (
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978.992.24 1.437 1.383.948 2.287-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      )}
      {type === "support" && (
        <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
      )}
      {!type && (
        <path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zm0 14a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1zm-7-7a1 1 0 00-1 1H1a1 1 0 000 2h1a1 1 0 001-1V9a1 1 0 00-1-1zm14 0a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 000-2h-1a1 1 0 00-1-1zM6.343 6.343a1 1 0 00-1.414 0L3.515 7.757a1 1 0 001.414 1.414l1.414-1.414a1 1 0 000-1.414zm8.486 7.071a1 1 0 00-1.414 0l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414a1 1 0 000-1.414zM4.929 13.485a1 1 0 000-1.414L3.515 10.657a1 1 0 00-1.414 1.414l1.414 1.414a1 1 0 001.414 0zm8.486-7.071a1 1 0 000-1.414l-1.414-1.414a1 1 0 00-1.414 1.414l1.414 1.414a1 1 0 001.414 0z" />
      )}
    </svg>
  </span>
);

const ElsaLandingPage = () => {
  const logoUrl = "/images/LOGO ELSA GESTION.png"; // Ensure this image is in your public/images folder

  const featureCategories = [
    {
      title: "Gestion Commerciale Puissante",
      iconType: "commerciale",
      description:
        "Optimisez chaque étape de votre cycle commercial, de la prospection à la fidélisation.",
      features: [
        {
          name: "Tableau de Bord Intuitif",
          description:
            "Visualisez vos performances clés en un coup d'œil pour des décisions rapides.",
        },
        {
          name: "Gestion des Entités (Clients & Fournisseurs)",
          description:
            "Centralisez et gérez efficacement vos contacts, historiques et interactions.",
        },
        {
          name: "Catalogue Produits Complet",
          description:
            "Organisez vos produits, marques, catégories, et unités de mesure avec flexibilité.",
        },
        {
          name: "Cycle d'Achat Simplifié",
          description:
            "Gérez vos commandes d'achat, réceptions, retours fournisseurs et paiements.",
        },
        {
          name: "Processus de Vente Fluide",
          description:
            "Créez devis, bons de commande, factures, et suivez les retours clients et paiements entrants.",
        },
        {
          name: "Gestion de Production Intégrée",
          description:
            "Planifiez, suivez vos ordres de fabrication, gérez vos nomenclatures et coûts de production.",
        },
        {
          name: "Contrôle des Stocks en Temps Réel",
          description:
            "Maîtrisez vos inventaires multi-magasins, transferts, et ajustements de stock précis.",
        },
        {
          name: "Suivi de Trésorerie Rigoureux",
          description:
            "Gardez un œil sur vos flux de trésorerie, gérez vos comptes bancaires et caisses.",
        },
        {
          name: "Gestion des Dépenses Maîtrisée",
          description:
            "Catégorisez, enregistrez et analysez toutes vos dépenses professionnelles.",
        },
        {
          name: "Module E-commerce Connecté",
          description:
            "Synchronisez vos produits, stocks et commandes avec votre boutique en ligne.",
        },
        {
          name: "Point de Vente (POS) Moderne",
          description:
            "Encaissez rapidement en magasin avec une interface simple et connectée à votre stock.",
        },
        {
          name: "Rapports et Analyses Détaillés",
          description:
            "Prenez des décisions éclairées grâce à des rapports personnalisables et pertinents.",
        },
      ],
    },
    {
      title: "Administration Flexible et Sécurisée",
      iconType: "admin",
      description:
        "Configurez la plateforme selon vos besoins et gérez les accès en toute sécurité.",
      features: [
        {
          name: "Gestion des Souscriptions",
          description:
            "Administrez les plans d'abonnement et les accès aux fonctionnalités.",
        },
        {
          name: "Support Multi-Entreprises",
          description:
            "Gérez plusieurs sociétés ou filiales au sein d'une interface unique.",
        },
        {
          name: "Gestion des Utilisateurs et Rôles",
          description:
            "Attribuez des rôles précis et contrôlez les permissions d'accès pour chaque membre de votre équipe.",
        },
        {
          name: "Configuration des Magasins/Entrepôts",
          description:
            "Définissez et gérez vos différents lieux de stockage et points de vente.",
        },
        {
          name: "Paramétrage Avancé des Taxes",
          description:
            "Adaptez la gestion des taxes (TVA, etc.) à vos obligations légales et géographiques.",
        },
        {
          name: "Support Multi-Devises",
          description:
            "Facturez et encaissez dans différentes devises pour vos opérations internationales.",
        },
        {
          name: "Modes de Paiement Multiples",
          description:
            "Intégrez et gérez une variété de méthodes de paiement pour vos clients.",
        },
      ],
    },
    {
      title: "Accompagnement et Support Dédié",
      iconType: "support",
      description:
        "Nous sommes à vos côtés pour vous aider à tirer le meilleur parti d'ELSA GESTION.",
      features: [
        {
          name: "Guides et Tutoriels Complets",
          description:
            "Accédez à une base de connaissance riche pour maîtriser chaque fonctionnalité.",
        },
        {
          name: "Support Client Réactif",
          description:
            "Notre équipe d'experts est disponible pour répondre à vos questions et vous assister.",
        },
        {
          name: "Mises à Jour Régulières",
          description:
            "Bénéficiez des dernières innovations et améliorations en continu.",
        },
      ],
    },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Refs for scroll animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const whyElsaRef = useRef(null);
  const clientsRef = useRef(null);
  const contactRef = useRef(null);
  const pricingRef = useRef(null);

  // Add scroll state for header
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe all section refs
    const refs = [
      heroRef,
      featuresRef,
      whyElsaRef,
      clientsRef,
      contactRef,
      pricingRef,
    ];
    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      refs.forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <div className="font-sans text-grey-900 antialiased elsagestion-landing">
      <Helmet>
        <title>
          ELSA GESTION | Solution SaaS de gestion d'entreprise tout-en-un
        </title>
        <meta
          name="description"
          content="ELSA GESTION est une solution SaaS complète pour une gestion d'entreprise intuitive et performante. Centralisez vos opérations, de la vente à la production."
        />
        <meta
          name="keywords"
          content="gestion entreprise, logiciel saas, ERP, gestion commerciale, gestion stock, facturation, PME"
        />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="ELSA GESTION | Solution SaaS de gestion d'entreprise"
        />
        <meta
          property="og:description"
          content="La solution tout-en-un pour centraliser et optimiser la gestion de votre entreprise."
        />
        <meta property="og:image" content="/images/elsa-social-preview.jpg" />
        <meta property="og:url" content="https://www.elsagestion.com" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="ELSA GESTION | Pilotez votre croissance"
        />
        <meta
          name="twitter:description"
          content="La solution SaaS complète pour une gestion d'entreprise intuitive et performante."
        />
        <meta name="twitter:image" content="/images/elsa-social-preview.jpg" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.elsagestion.com" />
      </Helmet>

      {/* Header */}
      <header
        className={`transition-all duration-300 ease-in-out fixed w-full top-0 z-50 
          ${
            scrolled
              ? "bg-white/95 text-blue-900 shadow-lg backdrop-blur-md py-2"
              : "bg-transparent text-white py-4"
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center shrink-0 relative z-10">
            <img
              src={logoUrl}
              alt="ELSA GESTION Logo"
              className={`h-10 md:h-12 mr-2 transition-all duration-300 ${
                scrolled ? "filter-none" : "brightness-[1.15]"
              }`}
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              "Fonctionnalités",
              "Pourquoi ELSA?",
              "Tarification",
              "Contact",
            ].map((item, i) => (
              <a
                key={i}
                href={`#${item
                  .toLowerCase()
                  .replace(" ", "-")
                  .replace("?", "")}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${
                    scrolled
                      ? "text-gray-700 hover:text-blue-700 hover:bg-blue-50/80"
                      : "text-gray-200 hover:text-white hover:bg-white/10"
                  }`}
              >
                {item}
              </a>
            ))}

            <div className="h-6 mx-2 w-px bg-gray-400/30"></div>

            <Link
              to="/login"
              className={`font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200
                ${
                  scrolled
                    ? "text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-300 hover:bg-blue-50/80"
                    : "text-blue-100 hover:text-white border border-blue-100/30 hover:border-blue-100/80 hover:bg-white/10"
                }`}
            >
              Connexion
            </Link>

            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow-md transition duration-300 ease-out hover:bg-red-600"
            >
              <span className="relative">Démarrer</span>
              <span className="absolute right-0 -mt-0 h-full w-12 translate-x-12 rotate-12 transform bg-white opacity-10 transition-all duration-300 ease-out group-hover:translate-x-40"></span>
            </Link>
          </nav>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-md focus:outline-none"
            aria-label="Ouvrir le menu"
          >
            <span
              className={`block w-5 h-0.5 rounded-full transition-all duration-300 ease-out mb-1.5 ${
                scrolled ? "bg-blue-900" : "bg-white"
              } ${mobileMenuOpen ? "transform rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`block w-6 h-0.5 rounded-full transition-all duration-200 ease-out ${
                scrolled ? "bg-blue-900" : "bg-white"
              } ${mobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-5 h-0.5 rounded-full transition-all duration-300 ease-out mt-1.5 ${
                scrolled ? "bg-blue-900" : "bg-white"
              } ${mobileMenuOpen ? "transform -rotate-45 -translate-y-2" : ""}`}
            ></span>
          </button>
        </div>

        <div
          className={`md:hidden bg-white/95 backdrop-blur-md absolute top-full left-0 right-0 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col space-y-1 px-4 py-3">
            {[
              "Fonctionnalités",
              "Pourquoi ELSA?",
              "Tarification",
              "Contact",
            ].map((item, i) => (
              <a
                key={i}
                href={`#${item
                  .toLowerCase()
                  .replace(" ", "-")
                  .replace("?", "")}`}
                onClick={toggleMobileMenu}
                className="text-gray-800 hover:bg-blue-50 hover:text-blue-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                {item}
              </a>
            ))}

            <div className="h-px w-full bg-gray-200 my-2"></div>

            <Link
              to="/login"
              onClick={toggleMobileMenu}
              className="text-blue-700 hover:bg-blue-50 block px-3 py-2 rounded-md text-base font-medium"
            >
              Connexion
            </Link>

            <Link
              to="/register"
              onClick={toggleMobileMenu}
              className="bg-red-500 hover:bg-red-600 text-white block px-3 py-2 rounded-md text-base font-medium shadow-sm text-center mt-2 transition-colors"
            >
              Démarrer
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer to account for fixed header */}
      <div className="h-20"></div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white pt-16 pb-20 md:pt-20 md:pb-32 relative overflow-hidden"
      >
        {/* Abstract Shapes Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 w-96 h-96 rounded-full bg-blue-700 opacity-20 blur-3xl"></div>
          <div className="absolute -left-20 top-1/3 w-72 h-72 rounded-full bg-red-500 opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
        </div>

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-transparent to-red-900/30 backdrop-blur-[1px]"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0">
              <span className="animate-fade-in-up inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-blue-100 mb-6 border border-blue-100/20">
                Plateforme SaaS tout-en-un
              </span>

              <h1 className="animate-fade-in-up [animation-delay:200ms] text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                <span className="block mb-2">ELSA GESTION</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-blue-200">
                  Pilotez Votre Croissance
                </span>
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-100">
                  Simplifiez Votre Gestion
                </span>
              </h1>

              <p className="animate-fade-in-up [animation-delay:400ms] text-lg md:text-xl text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Centralisez vos opérations, de la vente à la production. Une
                solution complète et intuitive conçue pour les entrepreneurs
                ambitieux.
              </p>

              <div className="animate-fade-in-up [animation-delay:600ms] flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-8 py-4 font-bold text-white transition-all duration-300 ease-out hover:from-red-600 hover:to-red-700 text-lg shadow-lg hover:shadow-red-500/20"
                >
                  <span className="absolute right-0 -mt-0 h-full w-12 translate-x-12 rotate-6 transform bg-white opacity-10 transition-all duration-300 ease-out group-hover:translate-x-40"></span>
                  <span className="relative flex items-center">
                    Essai Gratuit 14 Jours
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </span>
                </Link>

                <a
                  href="#fonctionnalités"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm"
                >
                  <span>Découvrir</span>
                  <svg
                    className="ml-2 h-5 w-5 animate-bounce-gentle"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative">
              <div className="animate-float relative mx-auto max-w-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-red-500 opacity-20 rounded-3xl blur-xl transform rotate-3 scale-105"></div>
                <div className="relative bg-white/[0.15] backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                  <img
                    src="/images/dashboard-mockup.png"
                    alt="ELSA GESTION Interface Dashboard"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500 rounded-full blur-lg opacity-40 animate-pulse-slow"></div>
                <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-blue-500 rounded-full blur-lg opacity-40 animate-pulse-slow [animation-delay:3000ms]"></div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up [animation-delay:800ms]">
            {[
              { value: "10K+", label: "Utilisateurs" },
              { value: "99.9%", label: "Disponibilité" },
              { value: "24/7", label: "Support client" },
              { value: "4.8/5", label: "Note clients" },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center backdrop-blur-md bg-white/10 rounded-lg py-4 px-2 border border-white/10"
              >
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-blue-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave Bottom Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-gradient-to-r from-white to-white text-white overflow-hidden">
          <svg
            className="absolute bottom-0 w-full h-full text-white fill-current"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V69.81C82.39,56.44,142.31,40.11,198.54,30.66,238.91,24.3,262.93,20.14,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Pourquoi ELSA GESTION Section */}
      <section
        id="pourquoi-elsa"
        ref={whyElsaRef}
        className="py-16 md:py-24 bg-grey-100"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-grey-900 mb-3">
              Pourquoi ELSA GESTION est Votre Meilleur Allié ?
            </h2>
            <p className="text-lg text-grey-700 max-w-2xl mx-auto">
              Nous avons conçu ELSA GESTION pour répondre aux besoins concrets
              des PME et entrepreneurs ambitieux.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-12 h-12 text-blue-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                  </svg>
                ),
                title: "Solution Tout-en-Un",
                description:
                  "Gérez ventes, achats, stock, production, e-commerce, et plus, depuis une plateforme unique. Fini le jonglage entre logiciels !",
              },
              {
                icon: (
                  <svg
                    className="w-12 h-12 text-red-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                ),
                title: "Intuitif et Ergonomique",
                description:
                  "Une interface claire et une expérience utilisateur soignée pour une prise en main rapide par toutes vos équipes.",
              },
              {
                icon: (
                  <svg
                    className="w-12 h-12 text-blue-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                ),
                title: "Adapté à Votre Croissance",
                description:
                  "ELSA GESTION est une solution évolutive qui s'adapte à la taille et aux ambitions de votre entreprise.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center"
              >
                <div className="mb-4 p-3 rounded-full bg-opacity-10 bg-gray-200">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-grey-700 mb-2">
                  {item.title}
                </h3>
                <p className="text-grey-700 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section
        id="fonctionnalités"
        ref={featuresRef}
        className="py-24 md:py-32 bg-white relative"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-0 w-full h-20 bg-gradient-to-b from-white/50 to-transparent"></div>
          <div className="absolute right-0 top-1/4 w-1/3 h-2/3 bg-blue-50/50 blur-3xl rounded-full"></div>
          <div className="absolute left-0 bottom-1/4 w-1/4 h-1/3 bg-red-50/30 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 text-sm font-medium text-blue-700 mb-4">
              Tout ce dont vous avez besoin
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Découvrez la <span className="text-blue-700">Puissance</span>{" "}
              d'ELSA GESTION
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une couverture fonctionnelle complète pour une gestion à 360°.
              Tout ce dont votre entreprise a besoin dans une seule plateforme
              intuitive.
            </p>
          </div>

          {featureCategories.map((category, catIndex) => (
            <div
              key={catIndex}
              className={`mb-32 last:mb-0 ${
                catIndex % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="max-w-3xl mx-auto mb-12">
                <div className="flex items-center justify-center lg:justify-start space-x-4 mb-6">
                  <div
                    className={`
                    p-4 rounded-xl flex items-center justify-center
                    ${
                      catIndex === 0
                        ? "bg-blue-50 text-blue-700"
                        : catIndex === 1
                        ? "bg-red-50 text-red-700"
                        : "bg-violet-50 text-violet-700"
                    }
                  `}
                  >
                    <IconPlaceholder
                      type={category.iconType}
                      className="w-10 h-10"
                    />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {category.title}
                  </h3>
                </div>
                <p className="text-lg text-gray-600 lg:pl-20">
                  {category.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {category.features.map((feature, index) => (
                  <div
                    key={index}
                    className={`
                      group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl 
                      transition-all duration-300 transform hover:-translate-y-1
                      overflow-hidden
                      ${
                        catIndex === 0
                          ? "hover:border-blue-500 border border-gray-100"
                          : catIndex === 1
                          ? "hover:border-red-500 border border-gray-100"
                          : "hover:border-violet-500 border border-gray-100"
                      }
                    `}
                  >
                    {/* Hover effect gradient */}
                    <div
                      className={`
                      absolute inset-0 w-3 group-hover:w-full transition-all duration-500 ease-out
                      ${
                        catIndex === 0
                          ? "bg-blue-500/10"
                          : catIndex === 1
                          ? "bg-red-500/10"
                          : "bg-violet-500/10"
                      }
                    `}
                    ></div>

                    <div className="relative">
                      <h4
                        className={`
                        text-lg font-semibold mb-3 flex items-center
                        ${
                          catIndex === 0
                            ? "text-blue-700"
                            : catIndex === 1
                            ? "text-red-700"
                            : "text-violet-700"
                        }
                      `}
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature.name}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add a "See more" link if there are a lot of features */}
              {category.features.length > 6 && (
                <div className="text-center mt-8">
                  <a
                    href="#"
                    className={`
                      inline-flex items-center font-medium
                      ${
                        catIndex === 0
                          ? "text-blue-600 hover:text-blue-800"
                          : catIndex === 1
                          ? "text-red-600 hover:text-red-800"
                          : "text-violet-600 hover:text-violet-800"
                      }
                    `}
                  >
                    Voir toutes les fonctionnalités
                    <svg
                      className="w-5 h-5 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Nos clients Section */}
      <section className="py-16 bg-grey-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-grey-900 mb-3">
            Nos clients
          </h2>
          <p className="text-lg text-grey-700 mb-10">
            Ils nous font déjà confiance pour gérer leur activité avec ELSA
            GESTION.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              "/images/companies/company1.png",
              "/images/companies/company2.png",
              "/images/companies/company3.png",
              "/images/companies/company4.png",
            ].map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Logo entreprise ${idx + 1}`}
                className="h-12 object-contain"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section - Secondary */}
      <section className="py-16 md:py-24 bg-brand-gradient text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Transformer Votre Quotidien ?
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Rejoignez des centaines d'entreprises qui optimisent leur gestion
            avec ELSA GESTION. <br />
            Démarrez votre essai gratuit dès aujourd'hui – aucune carte de
            crédit requise.
          </p>
          <Link
            to="/register"
            className="btn-primary bg-red-500 hover:bg-red-700 text-white font-extrabold py-4 px-10 rounded-lg text-xl shadow-xl transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 focus:ring-opacity-75"
          >
            Je Lance Mon Essai Gratuit !
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        ref={contactRef}
        className="py-24 md:py-32 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-blue-50/50 blur-3xl rounded-full opacity-70"></div>
          <div className="absolute -left-40 bottom-0 w-96 h-96 bg-red-50/40 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-red-50 text-sm font-medium text-red-700 mb-4">
              Nous contacter
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Une Question ? Besoin d'aide ?
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Notre équipe est prête à vous aider et à discuter de vos besoins
              spécifiques.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-10 items-center max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="md:col-span-2 space-y-8">
              <div className="grid gap-8">
                {[
                  {
                    icon: (
                      <svg
                        className="h-8 w-8 text-blue-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    ),
                    title: "Email",
                    value: "info@elsa-technologies.com",
                    link: "mailto:info@elsa-technologies.com",
                  },
                  {
                    icon: (
                      <svg
                        className="h-8 w-8 text-blue-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    ),
                    title: "Téléphone",
                    value: "+226 64 98 90 99",
                    link: "tel:+22664989099",
                  },
                  {
                    icon: (
                      <svg
                        className="h-8 w-8 text-blue-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ),
                    title: "Adresse",
                    value: "Burkina Faso, Ouagadougou, Patte d'oie",
                    link: "https://maps.google.com",
                  },
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start hover:bg-gray-50 p-4 rounded-xl transition-colors group"
                  >
                    <div className="shrink-0 mr-4 p-3 rounded-lg bg-white shadow-sm group-hover:shadow group-hover:bg-blue-50 transition-all">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-lg">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              <div className="flex space-x-4 pt-4 justify-center md:justify-start">
                {[
                  {
                    name: "facebook",
                    url: "https://web.facebook.com/ElsaTechno",
                  },
                  { name: "twitter", url: "#twitter" },
                  { name: "linkedin", url: "#linkedin" },
                  { name: "instagram", url: "#instagram" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors"
                    aria-label={`Visitez notre page ${social.name}`}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {social.name === "facebook" && (
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                      )}
                      {social.name === "twitter" && (
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.035 10.035 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482c0 .388.042.765.12 1.122A13.978 13.978 0 011.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                      )}
                      {social === "linkedin" && (
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      )}
                      {social === "instagram" && (
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <form action="#" method="POST" className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Prénom
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="first-name"
                          id="first-name"
                          autoComplete="given-name"
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="last-name"
                          id="last-name"
                          autoComplete="family-name"
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Entreprise (Optionnel)
                    </label>
                    <div className="mt-1">
                      <input
                        id="company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Message
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="message"
                        name="message"
                        rows="4"
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      ></textarea>
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center py-3 px-6 border border-transparent shadow-md text-base font-medium rounded-lg text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Envoyer le Message
                    </button>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    En soumettant ce formulaire, vous acceptez notre{" "}
                    <a
                      href="/privacy-policy"
                      className="font-medium text-blue-700 hover:text-blue-500"
                    >
                      politique de confidentialité
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Prix */}
      <section
        id="tarification"
        ref={pricingRef}
        className="py-24 md:py-32 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-40 top-40 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl opacity-70"></div>
          <div className="absolute -left-40 bottom-20 w-96 h-96 rounded-full bg-red-100/40 blur-3xl opacity-60"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 text-sm font-medium text-blue-700 mb-4">
              Offres adaptées à vos besoins
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Une tarification simple et transparente
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choisissez la formule qui correspond à vos besoins. Toutes nos
              offres incluent un accès complet à la plateforme.
            </p>
          </div>

          {/* Pricing Toggle */}
          <div className="max-w-3xl mx-auto mb-16 flex justify-center">
            <div className="bg-white p-1 rounded-lg shadow-md inline-flex">
              <button className="relative px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Mensuel
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                  Populaire
                </span>
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none">
                Annuel
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  Économisez 15%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Standard Plan */}
            <div className="relative rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="absolute inset-0 w-3 group-hover:w-full transition-all duration-500 ease-out bg-blue-50/50"></div>
              <div className="p-6 sm:p-8 relative h-full flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Standard
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Idéal pour les petites entreprises
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    10 000
                  </span>
                  <span className="text-xl font-medium text-gray-700 ml-1">
                    FCFA
                  </span>
                  <span className="text-gray-500 ml-2">/mois</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Ou 100 000 FCFA/an
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Accès complet à la plateforme</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>2 utilisateurs (Admin et gérant)</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>1 entreprise avec 1 magasin</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Formation en ligne (Google Meet/Teams)</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Pack vidéo de formation inclus</span>
                  </li>
                </ul>
                <Link
                  to="/payment?plan=standard"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                >
                  Choisir cette offre
                </Link>
              </div>
            </div>

            {/* Business Plan */}
            <div className="relative rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-blue-500 transform md:-translate-y-4">
              <div className="absolute inset-x-0 top-0 h-2 bg-blue-500"></div>
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAIRE
              </div>
              <div className="p-6 sm:p-8 relative h-full flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Business
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Pour les entreprises en croissance
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    20 000
                  </span>
                  <span className="text-xl font-medium text-gray-700 ml-1">
                    FCFA
                  </span>
                  <span className="text-gray-500 ml-2">/mois</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Ou 200 000 FCFA/an
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Accès complet à la plateforme</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>5 utilisateurs</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>1 entreprise avec 3 magasins/points de vente</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Formation en ligne (Google Meet/Teams)</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Pack vidéo de formation inclus</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Formation présentielle (Ouaga) en option</span>
                  </li>
                </ul>
                <Link
                  to="/payment?plan=business"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
                >
                  Choisir cette offre
                </Link>
              </div>
            </div>

            {/* VIP Plan */}
            <div className="relative rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="absolute inset-0 w-3 group-hover:w-full transition-all duration-500 ease-out bg-red-50/50"></div>
              <div className="p-6 sm:p-8 relative h-full flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  VIP
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Pour les entreprises exigeantes
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    35 000
                  </span>
                  <span className="text-xl font-medium text-gray-700 ml-1">
                    FCFA
                  </span>
                  <span className="text-gray-500 ml-2">/mois</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Ou 385 000 FCFA/an
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Accès complet à la plateforme</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>
                      <span className="font-semibold">2 entreprises</span>{" "}
                      distinctes
                    </span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Jusqu'à 10 magasins au total (5 par entreprise)</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Formation en ligne (Google Meet/Teams)</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Pack vidéo de formation inclus</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Formation présentielle (Ouaga) en option</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Link
                  to="/payment?plan=vip"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                >
                  Choisir cette offre
                </Link>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <p className="text-gray-600 text-lg mb-8">
              Besoin d'une solution personnalisée pour votre entreprise ?
              <a
                href="#contact"
                className="text-blue-600 hover:text-blue-800 font-medium ml-1"
              >
                Contactez-nous
              </a>
              pour discuter de vos besoins spécifiques.
            </p>
            <div className="px-6 py-4 bg-blue-50 rounded-lg inline-flex items-center gap-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="text-blue-700">
                Tous les prix sont en FCFA et incluent toutes les taxes
                applicables.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Processus de Paiement */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Processus d'inscription et de paiement
              </h2>
              <p className="text-lg text-gray-600">
                Suivez ces étapes simples pour vous abonner à ELSA GESTION
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Comment effectuer votre paiement
              </h3>

              <ol className="space-y-6">
                <li className="flex">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-lg mr-4">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Le paiement se fait par{" "}
                      <span className="font-medium">Orange Money</span> sur le
                      numéro mobile du Burkina FASO :
                    </p>
                    <p className="text-lg font-semibold text-blue-700 mt-1">
                      +226 64 98 90 99
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      (Propriétaire : Sansan P Anthony SIB)
                    </p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-lg mr-4">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Faites une capture d'écran du paiement et envoyez-la par
                      WhatsApp au{" "}
                      <span className="font-medium">+226 64 98 90 99</span> pour
                      confirmer votre paiement.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Précisez la formule et le nombre de mois souscrits
                    </p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-lg mr-4">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Fournissez les informations suivantes par WhatsApp ou par
                      email à{" "}
                      <span className="font-medium">
                        info@elsa-technologies.com
                      </span>{" "}
                      :
                    </p>
                    <ul className="mt-2 space-y-2 list-disc pl-5 text-gray-600">
                      <li>Nom ou raison sociale de votre entreprise</li>
                      <li>Activité principale de votre entreprise</li>
                      <li>Numéro de téléphone</li>
                      <li>Logo de votre entreprise</li>
                      <li>Votre nom et prénom</li>
                      <li>Adresse email</li>
                      <li>
                        Votre adresse (ex: Pointe Noire, Rue Kouamé Krouma)
                      </li>
                    </ul>
                  </div>
                </li>
              </ol>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-blue-800">
                    <span className="font-semibold">Délai de création :</span>{" "}
                    Maximum 24h après votre paiement (parfois dans l'heure en
                    cas de faible trafic).
                  </span>
                </p>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Besoin d'aide pour votre inscription ?
              </h3>
              <p className="text-gray-600 mb-6">
                Notre équipe est disponible pour vous accompagner dans votre
                inscription et répondre à toutes vos questions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="https://wa.me/22664989099"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.075-.149-.669zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.752.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contacter par WhatsApp
                </a>
                <a
                  href="mailto:info@elsa-technologies.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contacter par Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <img
                src={logoUrl}
                alt="ELSA GESTION Footer Logo"
                className="h-12 mb-5 opacity-90"
              />
              <p className="text-gray-400 mb-6 max-w-xs">
                La solution SaaS pour une gestion d'entreprise simplifiée et
                efficace.
              </p>
              <div className="flex space-x-4">
                {[
                  {
                    name: "facebook",
                    url: "https://web.facebook.com/ElsaTechno",
                  },
                  { name: "twitter", url: "#twitter" },
                  { name: "linkedin", url: "#linkedin" },
                  { name: "instagram", url: "#instagram" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                    aria-label={`Visitez notre page ${social.name}`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {social.name === "facebook" && (
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                      )}
                      {social.name === "twitter" && (
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.035 10.035 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482c0 .388.042.765.12 1.122A13.978 13.978 0 011.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                      )}
                      {social.name === "linkedin" && (
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      )}
                      {social.name === "instagram" && (
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-5 text-white">Société</h5>
              <ul className="space-y-3">
                {[
                  { name: "À Propos", link: "#pourquoi-elsa", isAnchor: true },
                  { name: "Partenaires", link: "#partenaires", isAnchor: true },
                  { name: "Blog", link: "/blog", isAnchor: false },
                  { name: "Carrières", link: "/carrieres", isAnchor: false },
                  { name: "Contactez-nous", link: "#contact", isAnchor: true },
                ].map((item, i) => (
                  <li key={i}>
                    {item.isAnchor ? (
                      <a
                        href={item.link}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        to={item.link}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-5 text-white">Produit</h5>
              <ul className="space-y-3">
                {[
                  {
                    name: "Fonctionnalités",
                    link: "#fonctionnalités",
                    isAnchor: true,
                  },
                  { name: "Tarification", link: "/pricing", isAnchor: false },
                  {
                    name: "Guides d'Utilisation",
                    link: "/guides",
                    isAnchor: false,
                  },
                  {
                    name: "Témoignages",
                    link: "/testimonials",
                    isAnchor: false,
                  },
                  { name: "API", link: "/api-docs", isAnchor: false },
                ].map((item, i) => (
                  <li key={i}>
                    {item.isAnchor ? (
                      <a
                        href={item.link}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        to={item.link}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-5 text-white">Légal</h5>
              <ul className="space-y-3">
                {[
                  {
                    name: "Conditions d'Utilisation",
                    link: "/terms-of-service",
                  },
                  {
                    name: "Politique de Confidentialité",
                    link: "/privacy-policy",
                  },
                  { name: "Cookies", link: "/cookie-policy" },
                  { name: "Mentions Légales", link: "/legal" },
                  { name: "RGPD", link: "/gdpr" },
                ].map((item, i) => (
                  <li key={i}>
                    <Link
                      to={item.link}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} ELSA GESTION. Tous droits
              réservés.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/privacy-policy"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Politique de Confidentialité
              </Link>
              <Link
                to="/terms-of-service"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Conditions d'Utilisation
              </Link>
              <Link
                to="/cookie-policy"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Cookies
              </Link>
              <Link
                to="/legal"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Mentions Légales
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ElsaLandingPage;
