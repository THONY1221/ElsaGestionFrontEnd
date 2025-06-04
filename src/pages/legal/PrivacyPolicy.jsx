import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Politique de Confidentialité | ELSA GESTION</title>
        <meta
          name="description"
          content="Politique de confidentialité et de protection des données personnelles d'ELSA GESTION."
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
              Politique de Confidentialité
            </h1>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                1. Responsable de traitement
              </h2>
              <p className="text-gray-700 mb-4">
                ELSA Technologies, SARL au capital de 1 000 000 FCFA
                <br />
                Siège social : Ouagadougou, Burkina Faso
                <br />
                Email : info@elsa-technologies.com
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2. Données collectées
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>Données de navigation</strong> : adresses IP, pages
                consultées, durée de visite, type de navigateur.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Données de contact</strong> : nom, prénom, email,
                téléphone (lors de la demande de démo ou inscription à la
                newsletter).
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                3. Finalités du traitement
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">
                  Gestion des demandes de démonstration et contact client.
                </li>
                <li className="mb-2">
                  Envoi d'informations commerciales et newsletters (avec
                  consentement préalable).
                </li>
                <li className="mb-2">Amélioration et sécurité du Site.</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                4. Base légale
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">
                  Consentement (pour newsletter et marketing).
                </li>
                <li className="mb-2">
                  Exécution d'un contrat (pour la démo et la relation client).
                </li>
                <li className="mb-2">
                  Intérêt légitime (amélioration et sécurité du Site).
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                5. Durée de conservation
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">
                  Données de contact : 3 ans à compter de la dernière
                  interaction.
                </li>
                <li className="mb-2">
                  Données de navigation : 13 mois (conformément aux bonnes
                  pratiques).
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                6. Destinataires
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">Équipe interne d'ELSA Technologies.</li>
                <li className="mb-2">
                  Hébergeur du Site (fournisseur d'infrastructure).
                </li>
                <li className="mb-2">
                  Prestataires techniques (maintenance, outils d'analyse).
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                7. Sécurité
              </h2>
              <p className="text-gray-700 mb-4">
                Mise en place de mesures physiques, techniques et
                organisationnelles pour protéger vos données contre tout accès
                non autorisé.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                8. Droits des personnes
              </h2>
              <p className="text-gray-700 mb-4">
                Vous pouvez exercer les droits suivants en écrivant à :
                info@elsa-technologies.com
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">
                  Droit d'accès, de rectification, d'effacement, d'opposition,
                  de limitation et de portabilité.
                </li>
                <li className="mb-2">
                  Droit d'introduire une réclamation auprès de l'Autorité de
                  protection des données compétente.
                </li>
              </ul>
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

export default PrivacyPolicy;
