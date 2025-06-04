import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const GDPR = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Conformité RGPD | ELSA GESTION</title>
        <meta
          name="description"
          content="Informations sur la conformité d'ELSA GESTION au Règlement Général sur la Protection des Données (RGPD)."
        />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="py-8 px-6 md:px-10">
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  ></path>
                </svg>
                Retour à l'accueil
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
              Conformité au RGPD
            </h1>

            <div className="prose prose-blue max-w-none">
              <p className="text-gray-700 mb-6">
                ELSA Technologies s'engage à respecter le Règlement Général sur
                la Protection des Données (RGPD) :
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Transparence et information
              </h2>
              <p className="text-gray-700 mb-6">
                Vous êtes informé de la collecte et de l'utilisation de vos
                données (cf.{" "}
                <Link
                  to="/privacy-policy"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Politique de Confidentialité
                </Link>
                ).
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Limitation des finalités
              </h2>
              <p className="text-gray-700 mb-6">
                Les données ne sont collectées que pour les finalités déclarées
                et légitimes.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Minimisation des données
              </h2>
              <p className="text-gray-700 mb-6">
                Seules les données strictement nécessaires sont conservées.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Exactitude et mise à jour
              </h2>
              <p className="text-gray-700 mb-6">
                Vous pouvez demander la rectification de vos données inexactes.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Durée de conservation limitée
              </h2>
              <p className="text-gray-700 mb-6">
                Conforme aux recommandations CNIL.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Sécurité
              </h2>
              <p className="text-gray-700 mb-6">
                Mesures techniques et organisationnelles pour prévenir tout
                accès illégal.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Droits des personnes
              </h2>
              <div className="space-y-2 text-gray-700 mb-6">
                <p>
                  <span className="font-medium">
                    Droit d'accès, rectification, effacement, opposition,
                    limitation, portabilité.
                  </span>
                </p>
                <p>
                  Exercice auprès de :{" "}
                  <a
                    href="mailto:info@elsa-technologies.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    info@elsa-technologies.com
                  </a>{" "}
                  ou par courrier à l'adresse du siège social.
                </p>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Délégué à la protection des données (DPO)
              </h2>
              <p className="text-gray-700 mb-6">
                Contact :{" "}
                <a
                  href="mailto:info@elsa-technologies.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  info@elsa-technologies.com
                </a>
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Notification des violations
              </h2>
              <p className="text-gray-700 mb-6">
                En cas de faille de sécurité affectant vos données, notification
                à l'ANPD et aux personnes concernées sous 72 h.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Dernière mise à jour : {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPR;
