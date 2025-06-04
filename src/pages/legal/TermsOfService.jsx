import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Conditions d'Utilisation | ELSA GESTION</title>
        <meta
          name="description"
          content="Conditions d'utilisation du service ELSA GESTION, plateforme SaaS de gestion d'entreprise."
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
              Conditions d'Utilisation
            </h1>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                1. Objet
              </h2>
              <p className="text-gray-700 mb-4">
                La présente page définit les conditions d'utilisation (ci-après
                « Conditions ») du site web https://elsa-gestion.com (ci-après «
                le Site »). En accédant ou en utilisant le Site, vous acceptez
                sans réserve ces Conditions.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2. Accès au service
              </h2>
              <p className="text-gray-700 mb-4">
                L'accès au Site est gratuit et ouvert à tout utilisateur
                disposant d'un accès Internet.
              </p>
              <p className="text-gray-700 mb-4">
                ELSA Technologies se réserve la possibilité de modifier,
                suspendre ou interrompre tout ou partie du Site, sans préavis ni
                indemnité.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                3. Contenu et propriété intellectuelle
              </h2>
              <p className="text-gray-700 mb-4">
                Tous les contenus présents sur le Site (textes, logos, icônes,
                images, vidéos, code source) sont la propriété exclusive d'ELSA
                Technologies ou de ses partenaires et sont protégés par le droit
                de la propriété intellectuelle.
              </p>
              <p className="text-gray-700 mb-4">
                Toute reproduction, représentation ou rediffusion, totale ou
                partielle, sans autorisation écrite préalable est strictement
                interdite.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                4. Obligations de l'utilisateur
              </h2>
              <p className="text-gray-700 mb-4">
                Vous vous engagez à ne pas utiliser le Site de manière
                frauduleuse, abusive ou contraire à l'ordre public.
              </p>
              <p className="text-gray-700 mb-4">
                Vous acceptez de ne pas tenter d'accéder aux données d'autres
                utilisateurs, d'introduire des virus ou de perturber le
                fonctionnement du Site.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                5. Responsabilité
              </h2>
              <p className="text-gray-700 mb-4">
                ELSA Technologies met en œuvre tous les moyens raisonnables pour
                assurer un accès de qualité au Site. Toutefois, elle ne saurait
                être tenue responsable des interruptions, erreurs ou dommages
                résultant directement ou indirectement de l'accès au Site.
              </p>
              <p className="text-gray-700 mb-4">
                Les informations diffusées sont fournies « en l'état » sans
                garantie d'exactitude, de complétude ou d'actualité.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                6. Modification des Conditions
              </h2>
              <p className="text-gray-700 mb-4">
                ELSA Technologies se réserve le droit de mettre à jour ces
                Conditions à tout moment. La version applicable est celle en
                ligne sur le Site.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                7. Loi applicable et juridiction
              </h2>
              <p className="text-gray-700 mb-4">
                Ces Conditions sont soumises au droit burkinabè.
              </p>
              <p className="text-gray-700 mb-4">
                Tout litige relatif à l'interprétation ou à l'exécution sera de
                la compétence exclusive des tribunaux de Ouagadougou.
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

export default TermsOfService;
