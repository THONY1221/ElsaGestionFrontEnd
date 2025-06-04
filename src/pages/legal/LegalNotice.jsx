import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Mentions Légales | ELSA GESTION</title>
        <meta
          name="description"
          content="Mentions légales d'ELSA GESTION, informations relatives à l'éditeur et à l'hébergeur du site."
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
              Mentions Légales
            </h1>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Éditeur du site
              </h2>
              <div className="space-y-2 text-gray-700 mb-6">
                <p>ELSA Technologies</p>
                <p>SARL au capital de 1 000 000 FCFA</p>
                <p>Siège social : Ouagadougou, Burkina Faso</p>
                <p>RCCM : [À compléter]</p>
                <p>N° IFU : [À compléter]</p>
                <p>Directeur de la publication : Anthony Sib, Fondateur</p>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Contact
              </h2>
              <div className="space-y-2 text-gray-700 mb-6">
                <p>ELSA Technologies</p>
                <p>
                  Email :{" "}
                  <a
                    href="mailto:info@elsa-technologies.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    info@elsa-technologies.com
                  </a>
                </p>
                <p>
                  Tél. :{" "}
                  <a
                    href="tel:+22664989099"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    +226 64 98 90 99
                  </a>
                </p>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Propriété intellectuelle
              </h2>
              <p className="text-gray-700 mb-6">
                Tous les éléments du Site sont protégés. Toute reproduction
                partielle ou totale est interdite sans autorisation.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Hébergement
              </h2>
              <p className="text-gray-700 mb-6">
                [À compléter avec les informations sur l'hébergeur]
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

export default LegalNotice;
