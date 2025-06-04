import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    companyName: "",
    businessActivity: "",
    phoneNumber: "",
    fullName: "",
    email: "",
    address: "",
    paymentProof: null,
    agreed: false,
  });

  // Extract plan from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get("plan");
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [location]);

  // Pricing plans data
  const plans = {
    standard: {
      name: "Standard",
      monthlyPrice: "10 000",
      yearlyPrice: "100 000",
      features: [
        "Accès complet à la plateforme",
        "2 utilisateurs (Admin et gérant)",
        "1 entreprise avec 1 magasin",
        "Formation en ligne (Google Meet/Teams)",
        "Pack vidéo de formation inclus",
      ],
      color: "blue",
    },
    business: {
      name: "Business",
      monthlyPrice: "20 000",
      yearlyPrice: "200 000",
      features: [
        "Accès complet à la plateforme",
        "5 utilisateurs",
        "1 entreprise avec 3 magasins/points de vente",
        "Formation en ligne (Google Meet/Teams)",
        "Pack vidéo de formation inclus",
        "Formation présentielle (Ouaga) en option",
      ],
      color: "blue",
      popular: true,
    },
    vip: {
      name: "VIP",
      monthlyPrice: "35 000",
      yearlyPrice: "385 000",
      features: [
        "Accès complet à la plateforme",
        "2 entreprises distinctes",
        "Jusqu'à 10 magasins au total (5 par entreprise)",
        "Formation en ligne (Google Meet/Teams)",
        "Pack vidéo de formation inclus",
        "Formation présentielle (Ouaga) en option",
        "Support prioritaire",
      ],
      color: "red",
    },
  };

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici vous pouvez envoyer les données à votre backend
    // ou simplement afficher le message de confirmation
    setCurrentStep(3); // Affiche le message de confirmation
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const goNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Processus d'inscription | ELSA GESTION</title>
        <meta
          name="description"
          content="Complétez votre inscription à ELSA GESTION, la solution SaaS complète pour une gestion d'entreprise intuitive et performante."
        />
      </Helmet>

      {/* Header with progress bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/images/LOGO ELSA GESTION.png"
              alt="ELSA GESTION Logo"
              className="h-8 md:h-10 mr-2"
            />
          </Link>
          <div className="hidden sm:flex items-center space-x-6 text-sm">
            <div
              className={`flex items-center ${
                currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  currentStep >= 1
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                1
              </div>
              <span>Offre sélectionnée</span>
            </div>
            <div className="w-8 h-1 bg-gray-200">
              <div
                className={`h-full ${
                  currentStep >= 2 ? "bg-blue-500" : "bg-gray-200"
                }`}
              ></div>
            </div>
            <div
              className={`flex items-center ${
                currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  currentStep >= 2
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                2
              </div>
              <span>Informations</span>
            </div>
            <div className="w-8 h-1 bg-gray-200">
              <div
                className={`h-full ${
                  currentStep >= 3 ? "bg-blue-500" : "bg-gray-200"
                }`}
              ></div>
            </div>
            <div
              className={`flex items-center ${
                currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  currentStep >= 3
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                3
              </div>
              <span>Confirmation</span>
            </div>
          </div>
          <button
            onClick={goBack}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Retour
          </button>
        </div>
        <div className="block sm:hidden w-full bg-gray-200 h-2">
          <div
            className="bg-blue-600 h-full transition-all"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {currentStep === 1 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">
                  Votre offre sélectionnée
                </h1>
                <p className="text-gray-600 mt-1">
                  Vérifiez les détails de l'offre et choisissez votre cycle de
                  facturation
                </p>
              </div>

              {selectedPlan && plans[selectedPlan] ? (
                <div className="p-6">
                  <div className="flex justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Offre {plans[selectedPlan].name}
                        {plans[selectedPlan].popular && (
                          <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Tous les prix sont en FCFA
                      </p>
                    </div>
                    <img
                      src="/images/secure-payment.svg"
                      alt="Paiement sécurisé"
                      className="h-10"
                    />
                  </div>

                  <div className="mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                      <div className="inline-flex bg-white rounded-lg p-1 shadow-sm">
                        <button
                          onClick={() => setBillingCycle("monthly")}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            billingCycle === "monthly"
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          Mensuel
                        </button>
                        <button
                          onClick={() => setBillingCycle("yearly")}
                          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                            billingCycle === "yearly"
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          Annuel
                          <span
                            className={`ml-1 text-xs ${
                              billingCycle === "yearly"
                                ? "text-blue-100"
                                : "text-green-600"
                            }`}
                          >
                            -15%
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {billingCycle === "monthly"
                            ? "Facturation mensuelle"
                            : "Facturation annuelle"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {billingCycle === "monthly"
                            ? "Renouvelé chaque mois"
                            : "Renouvelé chaque année (économisez 15%)"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(
                            billingCycle === "monthly"
                              ? plans[selectedPlan].monthlyPrice
                              : plans[selectedPlan].yearlyPrice
                          )}{" "}
                          FCFA
                        </div>
                        <div className="text-sm text-gray-500">
                          {billingCycle === "monthly" ? "par mois" : "par an"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Inclus dans votre offre :
                    </h3>
                    <ul className="space-y-2">
                      {plans[selectedPlan].features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-${plans[selectedPlan].color}-500`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={goNext}
                      className={`inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-${plans[selectedPlan].color}-600 hover:bg-${plans[selectedPlan].color}-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${plans[selectedPlan].color}-500 shadow-md`}
                    >
                      Continuer
                      <svg
                        className="ml-2 w-5 h-5"
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
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Aucune offre n'a été sélectionnée.
                  </p>
                  <Link
                    to="/#tarification"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
                  >
                    Voir les offres disponibles
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Vos informations
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Complétez les informations pour créer votre compte
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                      <label
                        htmlFor="companyName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nom ou raison sociale de votre entreprise *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="businessActivity"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Activité principale de votre entreprise *
                      </label>
                      <input
                        type="text"
                        id="businessActivity"
                        name="businessActivity"
                        value={formData.businessActivity}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Numéro de téléphone *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Votre nom et prénom *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Adresse email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Votre adresse *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Pointe Noire, Rue Kouamé Krouma"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-3 px-4 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="paymentProof"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Capture d'écran du paiement (facultatif)
                      </label>
                      <input
                        type="file"
                        id="paymentProof"
                        name="paymentProof"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="block w-full py-2 px-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Vous pourrez également envoyer votre preuve de paiement
                        plus tard par WhatsApp.
                      </p>
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreed"
                        name="agreed"
                        checked={formData.agreed}
                        onChange={handleInputChange}
                        required
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label
                        htmlFor="agreed"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        J'accepte les{" "}
                        <a
                          href="/terms"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          conditions d'utilisation
                        </a>{" "}
                        et la{" "}
                        <a
                          href="/privacy"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          politique de confidentialité
                        </a>
                        .
                      </label>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
                      >
                        Finaliser l'inscription
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-24">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">
                      Processus de paiement
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        1. Paiement par Orange Money
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Le paiement se fait sur le numéro:
                        <br />
                        <span className="text-blue-700 font-semibold">
                          +226 64 98 90 99
                        </span>
                        <br />
                        (Propriétaire: Sansan P Anthony SIB)
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        2. Confirmation par WhatsApp
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Envoyez une capture d'écran de votre paiement au:
                        <br />
                        <span className="text-blue-700 font-semibold">
                          +226 64 98 90 99
                        </span>
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        3. Création de votre compte
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Votre compte sera créé dans un délai maximum de 24h.
                      </p>
                    </div>

                    <div className="pt-4">
                      <a
                        href="https://wa.me/22664989099"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.752.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Contacter par WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Merci pour votre inscription !
              </h1>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Vos informations ont été enregistrées avec succès. Notre équipe
                va procéder à la création de votre compte dès confirmation de
                votre paiement.
              </p>

              <div className="bg-blue-50 p-6 rounded-lg mb-8 mx-auto max-w-md text-left">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">
                  Prochaines étapes :
                </h2>
                <ol className="space-y-3 text-blue-800">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mr-2 text-sm font-semibold">
                      1
                    </span>
                    <span>
                      Effectuez votre paiement par Orange Money au{" "}
                      <span className="font-semibold">+226 64 98 90 99</span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mr-2 text-sm font-semibold">
                      2
                    </span>
                    <span>
                      Envoyez une capture d'écran de votre paiement par WhatsApp
                      au <span className="font-semibold">+226 64 98 90 99</span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mr-2 text-sm font-semibold">
                      3
                    </span>
                    <span>
                      Recevez vos accès par email dans un délai de 24h maximum
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.752.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contacter par WhatsApp
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-16">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <img
              src="/images/LOGO ELSA GESTION.png"
              alt="ELSA GESTION Logo"
              className="h-8 mx-auto md:mx-0"
            />
            <p className="text-sm text-gray-500 mt-2">
              La solution SaaS pour une gestion d'entreprise simplifiée et
              efficace.
            </p>
          </div>
          <div className="flex space-x-6 justify-center md:justify-start">
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Conditions d'utilisation
            </a>
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Politique de confidentialité
            </a>
            <a
              href="/contact"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Contact
            </a>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ELSA GESTION. Tous droits
            réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentPage;
