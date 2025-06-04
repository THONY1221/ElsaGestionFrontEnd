import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Politique Relative aux Cookies | ELSA GESTION</title>
        <meta
          name="description"
          content="Information sur l'utilisation des cookies par ELSA GESTION et comment les gérer."
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
              Politique Relative aux Cookies
            </h1>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                1. Qu'est-ce qu'un cookie ?
              </h2>
              <p className="text-gray-700 mb-4">
                Un cookie est un petit fichier texte déposé sur votre appareil
                lors de votre visite.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2. Types de cookies utilisés
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-medium">
                  Cookies strictement nécessaires :{" "}
                  <span className="font-normal">
                    assurent la navigation et l'accès aux fonctionnalités.
                  </span>
                </p>
                <p className="font-medium">
                  Cookies de performance :{" "}
                  <span className="font-normal">
                    statistiques de fréquentation (Google Analytics).
                  </span>
                </p>
                <p className="font-medium">
                  Cookies fonctionnels :{" "}
                  <span className="font-normal">
                    mémorisent vos préférences (langue, affichage).
                  </span>
                </p>
                <p className="font-medium">
                  Cookies de marketing :{" "}
                  <span className="font-normal">
                    diffusent des publicités ciblées (avec votre consentement).
                  </span>
                </p>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                3. Finalités
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li className="mb-2">
                  Amélioration de l'expérience utilisateur.
                </li>
                <li className="mb-2">Analyse anonymisée du trafic.</li>
                <li className="mb-2">Suggestions de contenus adaptés.</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                4. Gestion et refus des cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Vous pouvez configurer votre navigateur pour refuser tous les
                cookies ou certains d'entre eux :
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="font-medium mb-2 text-gray-800">Chrome :</p>
                <p className="text-gray-700">
                  Paramètres &gt; Confidentialité et sécurité &gt; Cookies et
                  autres données de site
                </p>

                <p className="font-medium mb-2 mt-4 text-gray-800">Firefox :</p>
                <p className="text-gray-700">
                  Options &gt; Vie privée et sécurité &gt; Cookies et données de
                  sites
                </p>

                <p className="font-medium mb-2 mt-4 text-gray-800">Edge :</p>
                <p className="text-gray-700">
                  Paramètres &gt; Cookies et autorisations de site
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800">
                  <strong>Note :</strong> le refus de certains cookies peut
                  altérer votre navigation.
                </p>
              </div>
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

export default CookiePolicy;
