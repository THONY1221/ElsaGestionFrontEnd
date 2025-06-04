import React from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Breadcrumb, Alert, Steps, Collapse, Empty } from "antd";
import {
  HomeOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  InteractionOutlined,
  RetweetOutlined,
  SettingOutlined,
  ShopOutlined,
  AuditOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  FileExcelOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import "./GuidesPage.css"; // Shared CSS file

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

// Placeholder content - In a real app, this would come from a CMS, a JSON file, or be dynamically imported.
const guidesContent = {
  "premiers-pas": {
    title: "Premiers Pas avec ELSA GESTION",
    introduction:
      "Ce guide vous aidera à configurer votre compte et à vous familiariser avec l'interface d'ELSA GESTION.",
    sections: [
      {
        type: "steps",
        title: "Configuration de votre Compte",
        steps: [
          {
            title: "Inscription",
            description: "Créez votre compte ELSA GESTION en quelques clics.",
          },
          {
            title: "Informations de l'entreprise",
            description: "Renseignez les détails de votre entreprise.",
          },
          {
            title: "Première connexion",
            description:
              "Accédez à votre tableau de bord pour la première fois.",
          },
        ],
      },
      {
        type: "media_placeholder",
        text: "Placeholder pour une vidéo de présentation de l'interface (2 min)",
      },
      {
        type: "paragraph",
        title: "Navigation dans l'Application",
        content:
          "Découvrez les menus principaux, la barre latérale et comment accéder rapidement aux différentes fonctionnalités.",
      },
      {
        type: "alert",
        messageType: "info",
        message: "Astuce",
        description:
          "Utilisez la barre de recherche globale pour trouver rapidement ce que vous cherchez.",
      },
    ],
    faq: [
      {
        question: "Comment modifier mon mot de passe ?",
        answer: "Allez dans Paramètres du compte > Sécurité.",
      },
      {
        question: "Où trouver mes factures d'abonnement ?",
        answer: "Dans la section Souscription > Historique des paiements.",
      },
    ],
  },
  // Add more guides here, e.g., 'gestion-commerciale', 'administration', etc.
  "gestion-commerciale": {
    title: "Maîtriser la Gestion Commerciale",
    introduction:
      "Apprenez à gérer efficacement vos clients, fournisseurs, produits, et l'ensemble de vos flux d'achats et de ventes.",
    sections: [
      {
        type: "paragraph",
        title: "Introduction à la Gestion Commerciale",
        content:
          "La gestion commerciale est le cœur de votre activité. ELSA GESTION vous offre des outils puissants pour piloter vos opérations, de la prise de commande à la facturation, en passant par la gestion des stocks et des relations avec vos tiers.",
      },
      // --- GESTION DES VENTES (GestionVente.tsx) ---
      {
        type: "subtitle",
        title: "Gestion des Ventes",
        icon: <PlayCircleOutlined />,
      },
      {
        type: "paragraph",
        title: "Aperçu du Module des Ventes",
        content:
          "Le module de gestion des ventes vous permet d'enregistrer vos transactions de vente, de générer des factures, de suivre les paiements clients et d'analyser vos performances commerciales. Il est directement lié à votre gestion de stock et à la gestion de vos clients.",
      },
      {
        type: "steps",
        title: "Processus Clés de la Gestion des Ventes",
        steps: [
          {
            title: "Créer une Nouvelle Vente",
            description:
              "Sélectionnez un client, ajoutez des produits depuis votre catalogue, ajustez les quantités, les prix, appliquez des remises unitaires ou globales, et gérez les taxes applicables.",
          },
          {
            title: "Rechercher et Filtrer les Ventes",
            description:
              "Utilisez les filtres (par client, date, statut de paiement, numéro de facture) pour retrouver facilement des ventes spécifiques.",
          },
          {
            title: "Visualiser les Détails d'une Vente",
            description:
              "Accédez à une vue complète d'une vente incluant les produits vendus, les montants, les statuts et l'historique des paiements.",
          },
          {
            title: "Modifier une Vente",
            description:
              "Modifiez les informations d'une vente tant qu'elle n'a pas atteint certains statuts (ex: entièrement payée ou expédiée). Les permissions peuvent restreindre cette action.",
          },
          {
            title: "Supprimer ou Annuler une Vente",
            description:
              "Supprimez une vente (si les conditions le permettent, ex: pas de paiement enregistré) ou annulez-la pour la sortir du flux principal tout en conservant un historique.",
          },
          {
            title: "Télécharger une Facture PDF",
            description:
              "Générez et téléchargez une version PDF de la facture pour vos clients ou pour vos archives.",
          },
          {
            title: "Exporter la Liste des Ventes",
            description:
              "Exportez vos données de ventes au format Excel pour des analyses personnalisées ou pour l'importation dans d'autres systèmes.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Points Clés pour la Gestion des Ventes",
        description:
          "Le statut de paiement d'une vente (Non payé, Partiellement payé, Payé) est crucial. Chaque vente impacte vos niveaux de stock en temps réel (si la gestion de stock est active pour les produits concernés).",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Créer et gérer une facture de vente (5 min)",
      },
      // --- GESTION DES RETOURS DE VENTE (GestionRetourVente.tsx) ---
      {
        type: "subtitle",
        title: "Gestion des Retours de Vente",
        icon: <RetweetOutlined />,
      },
      {
        type: "paragraph",
        title: "Comprendre les Retours de Vente",
        content:
          "Le module de gestion des retours de vente vous aide à traiter les retours de marchandises de vos clients de manière organisée, en assurant la traçabilité et en mettant à jour votre stock et votre comptabilité (avoirs, remboursements).",
      },
      {
        type: "steps",
        title: "Processus de Gestion d'un Retour de Vente",
        steps: [
          {
            title: "Initier un Retour de Vente",
            description:
              "Créez un nouveau retour en le liant à une vente d'origine. Sélectionnez les produits retournés et spécifiez les quantités.",
          },
          {
            title: "Valider et Traiter le Retour",
            description:
              "Vérifiez les articles retournés, mettez à jour le statut du retour (ex: Reçu, Traité, Remboursé).",
          },
          {
            title: "Impact sur le Stock",
            description:
              "Les produits acceptés en retour réintègrent votre stock disponible.",
          },
          {
            title: "Gestion des Remboursements/Avoirs",
            description:
              "Générez un avoir pour le client ou enregistrez un remboursement. (Note: La gestion des paiements sortants sera détaillée dans la section Finances).",
          },
        ],
      },
      {
        type: "alert",
        messageType: "warning",
        message: "Conditions Importantes pour les Retours",
        description:
          "Assurez-vous que la vente d'origine est dans un statut permettant un retour (ex: Complétée, Livrée). Définissez clairement votre politique de retour pour vos clients.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Schéma illustrant le flux d'un retour de vente",
      },
      // --- GESTION DES ACHATS (GestionAchat.tsx) ---
      {
        type: "subtitle",
        title: "Gestion des Achats",
        icon: <UnorderedListOutlined />,
      },
      {
        type: "paragraph",
        title: "Introduction à la Gestion des Achats",
        content:
          "Ce module est essentiel pour gérer vos approvisionnements auprès de vos fournisseurs. Il couvre la création de bons de commande, le suivi des réceptions et la gestion des factures d'achat.",
      },
      {
        type: "steps",
        title: "Étapes Clés de la Gestion des Achats",
        steps: [
          {
            title: "Créer un Bon de Commande Fournisseur",
            description:
              "Sélectionnez un fournisseur, listez les produits à commander, spécifiez les quantités et les prix d'achat négociés.",
          },
          {
            title: "Suivi des Statuts de Commande",
            description:
              "Suivez l'évolution de vos commandes (Commandé, Partiellement Reçu, Reçu, Annulé).",
          },
          {
            title: "Réceptionner les Marchandises",
            description:
              "Enregistrez la réception des produits commandés. Cette action met à jour vos niveaux de stock et peut générer un bon de réception.",
          },
          {
            title: "Gérer les Factures Fournisseurs",
            description:
              "Associez les factures fournisseurs à vos commandes d'achats et suivez les échéances de paiement. (Note: La gestion des paiements sortants sera détaillée dans la section Finances).",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Bonnes Pratiques pour les Achats",
        description:
          "Maintenez à jour votre base de données fournisseurs. Vérifiez la conformité des livraisons par rapport à vos commandes.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - De la commande fournisseur à la réception (6 min)",
      },
      // --- GESTION DES RETOURS D'ACHAT (GestionRetourAchat.tsx) ---
      {
        type: "subtitle",
        title: "Gestion des Retours d'Achat",
        icon: <InteractionOutlined />,
      },
      {
        type: "paragraph",
        title: "Comprendre les Retours aux Fournisseurs",
        content:
          "Ce module vous permet de gérer le renvoi de marchandises à vos fournisseurs, que ce soit pour non-conformité, produits défectueux, ou autres raisons. Il assure le suivi et l'impact sur votre stock et vos relations fournisseurs.",
      },
      {
        type: "steps",
        title: "Processus de Gestion d'un Retour d'Achat",
        steps: [
          {
            title: "Initier un Retour Fournisseur",
            description:
              "Créez un nouveau retour en le liant à un achat d'origine. Sélectionnez les produits à retourner et spécifiez les quantités.",
          },
          {
            title: "Obtenir l'Accord du Fournisseur",
            description:
              "Communiquez avec votre fournisseur pour obtenir une autorisation de retour (RMA) si nécessaire.",
          },
          {
            title: "Expédier les Marchandises",
            description: "Organisez l'expédition des produits retournés.",
          },
          {
            title: "Suivi des Avoirs/Remboursements Fournisseur",
            description:
              "Suivez la réception des notes de crédit ou des remboursements de la part de vos fournisseurs.",
          },
          {
            title: "Impact sur le Stock",
            description:
              "La sortie des marchandises retournées diminue votre stock disponible.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "warning",
        message: "Points d'Attention pour les Retours d'Achat",
        description:
          "Documentez bien la raison du retour et conservez toute la correspondance avec le fournisseur. Vérifiez les conditions de retour de chaque fournisseur.",
      },
    ],
    faq: [
      {
        question: "Comment créer une facture proforma ?",
        answer: "Allez dans Ventes > Proforma/Devis > Nouveau.",
      },
      {
        question: "Puis-je lier un paiement à plusieurs factures d'achat ?",
        answer:
          "Oui, lors de la saisie du paiement sortant, vous pouvez sélectionner plusieurs factures.",
      },
      {
        question: "Comment le stock est-il affecté lors d'un retour client ?",
        answer:
          "Si le produit retourné est en bon état et accepté, il est réintégré dans votre stock disponible. Vous pouvez ajuster cela manuellement si nécessaire.",
      },
      {
        question:
          "Que faire si je reçois une livraison partielle de mon fournisseur ?",
        answer:
          'Vous pouvez enregistrer une réception partielle dans le module Achats. La commande restera en statut "Partiellement Reçu" jusqu\'à la réception complète.',
      },
    ],
  },
  // --- GESTION FINANCIERE ET PAIEMENTS ---
  "gestion-financiere": {
    title: "Gestion Financière et Paiements",
    introduction:
      "Une gestion rigoureuse des paiements est essentielle pour la santé financière de votre entreprise. ELSA GESTION vous aide à suivre les encaissements clients et les décaissements fournisseurs.",
    sections: [
      {
        type: "paragraph",
        title: "Principes de la Gestion des Paiements",
        content:
          "Ce module centralise l'enregistrement et le suivi de tous les mouvements financiers liés à vos transactions commerciales. Il vise à vous donner une vue claire de vos créances et de vos dettes.",
      },
      // --- PAIEMENTS ENTRANTS (PaymentEntrant.tsx) ---
      {
        type: "subtitle",
        title: "Paiements Entrants (Clients)",
        icon: <PlayCircleOutlined />,
      },
      {
        type: "paragraph",
        title: "Comprendre les Paiements Entrants",
        content:
          "Le module des paiements entrants vous permet d'enregistrer les règlements reçus de vos clients. Chaque paiement peut être lié à une ou plusieurs factures de vente, facilitant ainsi le suivi des soldes clients et l'état de vos créances.",
      },
      {
        type: "steps",
        title: "Gérer les Paiements Clients : Étapes Clés",
        steps: [
          {
            title: "Enregistrer un Nouveau Paiement Client",
            description:
              "Sélectionnez le client, la date du paiement, le montant reçu et le mode de paiement. Vous pouvez également ajouter des références ou des notes.",
          },
          {
            title: "Lier le Paiement aux Factures",
            description:
              "Associez le paiement reçu à une ou plusieurs factures de vente ouvertes pour ce client. Le système vous aidera à identifier les factures dues.",
          },
          {
            title: "Suivi des Soldes Clients",
            description:
              "Consultez le solde de chaque client et l'historique de ses paiements pour une meilleure gestion de la relation client.",
          },
          {
            title: "Mise à Jour Automatique des Statuts de Facture",
            description:
              'Lorsqu\'un paiement est enregistré et lié, le statut de paiement de la facture concernée (ex: "Payé", "Partiellement payé") est mis à jour automatiquement.',
          },
          {
            title: "Consulter l'Historique des Paiements",
            description:
              "Accédez à un historique complet de tous les paiements entrants, avec des options de filtre et de recherche.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Importance du Rapprochement",
        description:
          "Il est conseillé de rapprocher régulièrement les paiements enregistrés dans ELSA GESTION avec vos relevés bancaires pour assurer l'exactitude de votre trésorerie.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Enregistrer et lier un paiement client (4 min)",
      },
      // --- PAIEMENTS SORTANTS (PaymentSortant.tsx) ---
      {
        type: "subtitle",
        title: "Paiements Sortants (Fournisseurs)",
        icon: <InteractionOutlined />,
      },
      {
        type: "paragraph",
        title: "Comprendre les Paiements Sortants",
        content:
          "Ce module vous aide à gérer les paiements que vous effectuez auprès de vos fournisseurs. Il permet de suivre vos dépenses, de lier les paiements aux factures d'achat et de maintenir une bonne relation avec vos fournisseurs.",
      },
      {
        type: "steps",
        title: "Gérer les Paiements Fournisseurs : Étapes Clés",
        steps: [
          {
            title: "Enregistrer un Nouveau Paiement Fournisseur",
            description:
              "Sélectionnez le fournisseur, la date du paiement, le montant payé, le mode de paiement utilisé et les éventuelles références.",
          },
          {
            title: "Lier le Paiement aux Factures d'Achat",
            description:
              "Associez le paiement effectué à une ou plusieurs factures d'achat en attente de règlement pour ce fournisseur.",
          },
          {
            title: "Suivi des Échéances Fournisseurs",
            description:
              "Gardez un œil sur les échéances de vos factures d'achat pour optimiser votre trésorerie et éviter les retards de paiement.",
          },
          {
            title: "Mise à Jour des Statuts de Facture d'Achat",
            description:
              "L'enregistrement d'un paiement met à jour le statut de la facture d'achat correspondante.",
          },
          {
            title: "Historique des Dépenses",
            description:
              "Consultez l'historique de vos paiements sortants pour analyser vos dépenses par fournisseur ou par période.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "warning",
        message: "Gestion des Devises",
        description:
          "Si vous traitez avec des fournisseurs étrangers, assurez-vous que les paiements sont enregistrés dans la bonne devise et que les taux de change sont correctement gérés (si applicable).",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Enregistrer un paiement fournisseur et gérer les échéances (5 min)",
      },
    ],
    faq: [
      {
        question:
          "Puis-je enregistrer un paiement partiel pour une facture client ?",
        answer:
          'Oui, vous pouvez enregistrer un montant inférieur au total de la facture. La facture passera au statut "Partiellement payé".',
      },
      {
        question: "Comment gérer un acompte reçu d'un client ?",
        answer:
          "Enregistrez l'acompte comme un paiement entrant. Vous pourrez le lier ultérieurement à la facture finale ou l'utiliser comme crédit pour le client.",
      },
      {
        question:
          "Est-il possible de lier un seul paiement fournisseur à plusieurs factures d'achat ?",
        answer:
          "Oui, lors de l'enregistrement du paiement, vous pouvez sélectionner plusieurs factures d'achat du même fournisseur à régler avec ce paiement.",
      },
      {
        question:
          "Comment ELSA GESTION gère-t-il les avoirs fournisseurs suite à un retour d'achat ?",
        answer:
          "L'avoir reçu de votre fournisseur peut être enregistré et utilisé pour réduire le montant d'un prochain paiement à ce fournisseur, ou enregistré comme une note de crédit.",
      },
    ],
  },
  // --- GESTION DE PRODUCTION ---
  "gestion-production": {
    title: "Guide de la Gestion de Production Industrielle",
    introduction:
      "Ce guide vous explique comment utiliser le module de production pour transformer des matières premières en produits finis, gérer vos ratios de conversion et suivre l'historique de vos productions.",
    sections: [
      {
        type: "paragraph",
        title: "Comprendre le Module de Production",
        content:
          "La gestion de production dans ELSA GESTION est conçue pour les entreprises qui assemblent ou transforment des composants (matières premières) pour créer de nouveaux produits (produits finis). Elle s'articule autour du concept d'Unités de Production.",
      },
      {
        type: "alert",
        messageType: "success",
        message: "Concept Clé : Unité de Production Auto-Référencée",
        description:
          "Dans ce module, une unité de production est définie à la fois comme l'entité qui consomme des matières premières ET comme le produit fini qui est créé. Cela simplifie la gestion en liant directement la recette de production au produit résultant.",
      },
      // --- Unités de Production (ProductionList.js, ProductionUnitForm.js) ---
      {
        type: "subtitle",
        title: "1. Définir vos Unités de Production",
        icon: <SettingOutlined />,
      },
      {
        type: "paragraph",
        content:
          'Avant de pouvoir lancer une production, vous devez définir vos "Unités de Production". Chaque unité représente une recette ou une nomenclature (Bill of Materials - BoM) qui spécifie quelles matières premières sont nécessaires, et en quelles quantités, pour produire une certaine quantité de produit fini.',
      },
      {
        type: "steps",
        title: "Créer et Gérer une Unité de Production",
        steps: [
          {
            title: "Accéder à la Liste des Unités",
            description:
              "Naviguez vers Production > Unités de production pour voir toutes vos unités existantes.",
          },
          {
            title: "Créer une Nouvelle Unité (ProductionUnitForm.js)",
            description:
              'Cliquez sur "Créer". Remplissez les informations de base (nom de l\'unité/produit fini, description). Définissez la quantité de produit fini générée par cette recette (ex: 1 unité, 100 litres).',
          },
          {
            title: "Ajouter les Matières Premières",
            description:
              "Spécifiez chaque matière première requise : sélectionnez le produit existant (matière première), indiquez la quantité nécessaire pour produire la quantité de sortie définie à l'étape précédente.",
          },
          {
            title: "Sauvegarder l'Unité de Production",
            description:
              "Une fois toutes les informations saisies, sauvegardez. L'unité de production est maintenant prête à être utilisée.",
          },
          {
            title: "Modifier/Supprimer une Unité",
            description:
              "Depuis la liste, vous pouvez modifier les détails d'une unité existante ou la supprimer si elle n'est plus utilisée (des restrictions peuvent s'appliquer si elle a été utilisée dans des productions).",
            icon: <BookOutlined />,
          },
        ],
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Créer une unité de production (recette) (7 min)",
      },
      // --- Lancement et Suivi de Production (ProductionProcess.js) ---
      {
        type: "subtitle",
        title: "2. Lancer et Suivre une Production",
        icon: <PlayCircleOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Une fois vos unités de production définies, vous pouvez lancer des ordres de fabrication.",
      },
      {
        type: "steps",
        title: "Processus de Lancement d'une Production",
        steps: [
          {
            title: 'Accéder à "Gérer la Production"',
            description: "Naviguez vers Production > Gérer la production.",
          },
          {
            title: "Sélectionner une Unité de Production",
            description:
              "Choisissez l'unité de production (la recette/le produit fini) que vous souhaitez fabriquer dans la liste déroulante.",
          },
          {
            title: "Indiquer la Quantité à Produire",
            description:
              "Saisissez la quantité de produit fini que vous désirez obtenir (ex: produire 50 unités du produit X).",
          },
          {
            title: "Calculer les Besoins en Matières Premières",
            description:
              "Le système calcule automatiquement la quantité de chaque matière première nécessaire en fonction de la recette de l'unité de production et de la quantité à produire.",
          },
          {
            title: "Vérifier la Disponibilité des Stocks",
            description:
              "ELSA GESTION vérifie si vous disposez des quantités suffisantes de chaque matière première en stock. Un indicateur visuel vous informe des éventuels manques.",
          },
          {
            title: "Lancer la Production",
            description:
              "Si les stocks sont suffisants (ou si vous choisissez de continuer malgré un avertissement), lancez la production. Cette action va décrémenter les stocks de matières premières et incrémenter le stock du produit fini.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "warning",
        message: "Impact sur les Stocks",
        description:
          "Le lancement d'une production a un impact direct et immédiat sur vos niveaux de stock : les matières premières sont consommées, les produits finis sont ajoutés. Assurez-vous de la justesse de vos recettes et de vos stocks initiaux.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Animation illustrant le flux de stock lors d'une production",
      },
      // --- Historique de Production (ProductionHistory.js) ---
      {
        type: "subtitle",
        title: "3. Consulter l'Historique des Productions",
        icon: <UnorderedListOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Le module d'historique vous permet de suivre toutes les opérations de production qui ont été effectuées.",
      },
      {
        type: "steps",
        title: "Explorer l'Historique",
        steps: [
          {
            title: "Accéder à l'Historique",
            description: "Naviguez vers Production > Historique.",
          },
          {
            title: "Visualiser les Productions Passées",
            description:
              "Consultez la liste de toutes les productions, avec des informations telles que la date, l'unité de production utilisée, les quantités produites, et les matières premières consommées.",
          },
          {
            title: "Filtrer et Rechercher",
            description:
              "Utilisez les options de filtre (par date, par unité de production) pour retrouver des productions spécifiques.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Traçabilité",
        description:
          "L'historique de production est essentiel pour la traçabilité de vos produits et l'analyse de vos coûts de production (si ces derniers sont calculés et suivis).",
      },
    ],
    faq: [
      {
        question:
          "Puis-je définir plusieurs produits finis pour une seule unité de production (co-produits) ?",
        answer:
          "Dans la version actuelle avec auto-référencement, chaque unité de production est conçue pour générer un seul type de produit fini (elle-même). Pour des co-produits distincts, vous devrez créer des unités de production séparées ou envisager une évolution du module.",
      },
      {
        question: "Comment gérer les pertes ou les déchets de production ?",
        answer:
          "Actuellement, le module se concentre sur la transformation directe basée sur la recette. Les pertes pourraient être gérées via des ajustements de stock manuels ou nécessiteraient une fonctionnalité additionnelle pour un suivi précis des rendements.",
      },
      {
        question:
          "Comment le système sait-il quel produit fini est créé par une unité de production ?",
        answer:
          "Lorsque vous créez une unité de production (par exemple, \"Pain Complet Maison\"), cette unité représente à la fois la recette (les ingrédients nécessaires) et le produit fini lui-même (le \"Pain Complet Maison\"). Le système est conçu pour que le nom que vous donnez à votre unité de production devienne automatiquement le nom du produit fini qui sera ajouté à votre stock après une production réussie. Il n'y a pas d'étape séparée pour définir le produit de sortie ; c'est l'unité de production elle-même.",
      },
    ],
  },
  // --- POINT DE VENTE (POS) --- (GestionPos.tsx)
  "point-de-vente": {
    title: "Utilisation du Point de Vente (POS)",
    introduction:
      "Le module Point de Vente (POS) d'ELSA GESTION est conçu pour vous permettre d'enregistrer les ventes directes en magasin ou au comptoir de manière rapide et efficace. Ce guide vous expliquera comment l'utiliser pleinement.",
    sections: [
      {
        type: "paragraph",
        title: "Accès et Configuration Initiale",
        content:
          "Pour accéder au POS, naviguez vers le module correspondant. Assurez-vous d'avoir sélectionné le bon magasin (entrepôt) dans les paramètres globaux de l'application, car le POS affichera les produits et gérera les stocks en fonction de cette sélection.",
      },
      {
        type: "subtitle",
        title: "Interface Principale du POS",
        icon: <ShopOutlined />,
      },
      {
        type: "paragraph",
        content:
          "L'interface du POS est divisée en plusieurs zones clés : la sélection des produits (avec recherche, catégories, et scan QR), le panier, et la section de finalisation de la vente (client, taxes, remises, paiement).",
      },
      {
        type: "steps",
        title: "Processus de Vente au POS",
        steps: [
          {
            title: "1. Sélectionner les Produits",
            description:
              "Utilisez la barre de recherche pour trouver des produits par nom ou code. Cliquez sur les catégories pour filtrer l'affichage. Vous pouvez également utiliser un scanner de code-barres/QR pour ajouter rapidement des articles.",
            icon: <SearchOutlined />,
          },
          {
            title: "2. Gérer le Panier",
            description:
              "Les produits sélectionnés s'ajoutent au panier. Vous pouvez y ajuster les quantités, modifier le prix de vente unitaire (si les permissions le permettent), ou supprimer des articles.",
            icon: <ShoppingCartOutlined />,
          },
          {
            title: "3. Sélectionner un Client",
            description:
              "Choisissez un client existant dans la liste déroulante ou, si la fonctionnalité est activée, créez un nouveau client directement depuis l'interface du POS.",
          },
          {
            title: "4. Appliquer Remises et Taxes",
            description:
              "Saisissez une remise globale sur la vente si nécessaire. Sélectionnez la taxe applicable si configurée.",
          },
          {
            title: "5. Encaisser le Paiement",
            description:
              "Indiquez le montant payé par le client et sélectionnez le mode de paiement (Espèces, Carte Bancaire, Mobile Money, etc.). Le système calculera le montant dû ou la monnaie à rendre.",
            icon: <WalletOutlined />,
          },
          {
            title: "6. Finaliser la Vente",
            description:
              "Une fois toutes les informations saisies, cliquez sur 'Finaliser la vente'. Un ticket de caisse peut être généré pour impression ou envoi par email.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Gestion des Stocks en Temps Réel",
        description:
          "Chaque vente finalisée au POS met automatiquement à jour les niveaux de stock des produits concernés pour le magasin sélectionné.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Réaliser une vente complète au POS (5 min)",
      },
      {
        type: "paragraph",
        title: "Fonctionnalités Additionnelles",
        content:
          "Le POS peut inclure des fonctionnalités comme le mode sombre pour un meilleur confort visuel, la gestion de plusieurs modes de paiement par transaction, et l'affichage du ticket de caisse avant impression.",
      },
    ],
    faq: [
      {
        question: "Puis-je mettre une vente en attente ?",
        answer:
          "La fonctionnalité de mise en attente des ventes n'est pas explicitement mentionnée dans le code fourni. Veuillez vérifier les options disponibles sur l'interface ou consulter la documentation la plus récente.",
      },
      {
        question: "Comment gérer les retours produits via le POS ?",
        answer:
          "Le module POS se concentre sur les ventes. Les retours de vente sont généralement gérés via le module dédié 'Gestion des Retours de Vente' pour assurer un suivi comptable et de stock correct.",
      },
      {
        question: "Est-il possible d'utiliser le POS en mode hors-ligne ?",
        answer:
          "Le fonctionnement hors-ligne dépend de l'architecture de l'application. Le code actuel suggère des appels API en temps réel, ce qui implique une connexion internet nécessaire. Des fonctionnalités de synchronisation hors-ligne pourraient être des développements futurs.",
      },
    ],
  },
  // --- GESTION DE LA TRESORERIE --- (GestionTresorerie.jsx)
  "gestion-tresorerie": {
    title: "Guide de la Gestion de la Trésorerie",
    introduction:
      "Le module de Gestion de la Trésorerie vous offre une vue d'ensemble et détaillée de tous vos mouvements financiers, classés par type de compte : Caisse, Banque, et Mobile Money. Il est essentiel pour suivre la santé financière de votre entreprise.",
    sections: [
      {
        type: "paragraph",
        title: "Tableau de Bord et Soldes",
        content:
          "Dès l'accès au module, vous visualisez les soldes entrants, sortants et nets pour la période et les filtres sélectionnés. Vous pouvez choisir d'afficher les soldes pour la page actuelle ou les soldes totaux pour l'ensemble des transactions correspondant à vos filtres.",
        icon: <AuditOutlined />,
      },
      {
        type: "subtitle",
        title: "Navigation par Onglets : Caisse, Banque, Mobile",
        icon: <WalletOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Chaque onglet (Caisse, Banque, Mobile) affiche les transactions spécifiques au type de mode de paiement sélectionné. Les modes de paiement doivent être préalablement configurés dans l'administration avec le type approprié (cash, bank, mobile).",
      },
      {
        type: "steps",
        title: "Fonctionnalités Communes aux Onglets",
        steps: [
          {
            title: "1. Filtrage des Transactions",
            description:
              "Utilisez les filtres par période (plage de dates) et par utilisateur (entité) pour affiner la liste des transactions affichées.",
          },
          {
            title: "2. Liste des Paiements",
            description:
              "Chaque transaction affiche la date, le numéro de référence, le type (entrant/sortant), l'entité concernée, le mode de paiement spécifique, et le montant.",
          },
          {
            title: "3. Pagination et Tri",
            description:
              "Naviguez entre les pages de résultats. Vous pouvez trier les transactions par date ou par montant.",
          },
          {
            title: "4. Exporter les Données",
            description:
              "Exportez la liste des transactions (page actuelle ou toutes les transactions filtrées) au format Excel pour une analyse externe.",
            icon: <FileExcelOutlined />,
          },
          {
            title: "5. Visualiser les Détails d'un Paiement",
            description:
              "Cliquez sur le numéro de référence d'un paiement pour ouvrir une fenêtre modale affichant tous les détails de la transaction, y compris les commandes associées.",
          },
        ],
      },
      {
        type: "alert",
        messageType: "info",
        message: "Configuration des Modes de Paiement",
        description:
          "Assurez-vous que vos modes de paiement (ex: 'Caisse Principale', 'Compte Bancaire SGBC', 'Orange Money Bureau') sont correctement créés et assignés au bon type (cash, bank, mobile) et à la bonne entreprise/magasin pour un fonctionnement optimal de ce module.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Naviguer et filtrer dans la Gestion de Trésorerie (4 min)",
      },
    ],
    faq: [
      {
        question: "Comment ajouter un nouveau compte de caisse ou de banque ?",
        answer:
          "Les comptes de caisse, banque ou mobile money sont gérés via les 'Modes de Paiement' dans la section d'administration. Créez un nouveau mode de paiement et assignez-lui le type approprié.",
      },
      {
        question: "Puis-je voir un rapprochement bancaire ici ?",
        answer:
          "Le module actuel se concentre sur l'enregistrement et la visualisation des flux de trésorerie. Une fonctionnalité de rapprochement bancaire automatisé pourrait être une extension future.",
      },
      {
        question:
          "Les soldes affichés tiennent-ils compte des chèques non encore encaissés ?",
        answer:
          "Les soldes reflètent les transactions enregistrées dans le système. La gestion des statuts spécifiques des chèques (émis, encaissé) dépend de la manière dont ces transactions sont saisies et gérées.",
      },
    ],
  },
  // --- GESTION DES DEPENSES --- (GestionCategoriesDepenses.jsx, GestionSaisieDepenses.jsx)
  "gestion-depenses": {
    title: "Suivi et Gestion des Dépenses",
    introduction:
      "La gestion rigoureuse des dépenses est cruciale pour contrôler vos coûts et assurer la rentabilité de votre entreprise. Ce module vous permet de catégoriser et d'enregistrer toutes vos dépenses opérationnelles.",
    sections: [
      {
        type: "subtitle",
        title: "1. Gérer les Catégories de Dépenses",
        icon: <UnorderedListOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Avant d'enregistrer des dépenses, il est essentiel de définir des catégories claires et pertinentes. Cela facilitera l'analyse et le suivi de vos postes de coûts. (Module : `GestionCategoriesDepenses.jsx`)",
      },
      {
        type: "steps",
        title: "Actions sur les Catégories",
        steps: [
          {
            title: "Créer une Nouvelle Catégorie",
            description:
              "Donnez un nom explicite à votre catégorie de dépense (ex: Loyer, Fournitures de bureau, Carburant, Salaires).",
          },
          {
            title: "Modifier une Catégorie",
            description: "Corrigez le nom d'une catégorie existante.",
          },
          {
            title: "Supprimer une Catégorie",
            description:
              "Supprimez une catégorie si elle n'est plus pertinente ou n'a pas été utilisée (des restrictions peuvent s'appliquer).",
          },
        ],
      },
      {
        type: "alert",
        messageType: "success",
        message: "Bonne Pratique",
        description:
          "Créez une structure de catégories qui correspond à votre plan comptable ou à vos besoins d'analyse pour des rapports financiers plus pertinents.",
      },
      {
        type: "subtitle",
        title: "2. Saisir et Suivre les Dépenses",
        icon: <DollarCircleOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Une fois vos catégories définies, vous pouvez commencer à enregistrer toutes les dépenses de votre entreprise de manière détaillée. (Module : `GestionSaisieDepenses.jsx`)",
      },
      {
        type: "steps",
        title: "Processus d'Enregistrement d'une Dépense",
        steps: [
          {
            title: "Informations Générales",
            description:
              "Sélectionnez la date de la dépense, le magasin concerné, et la catégorie de dépense appropriée.",
          },
          {
            title: "Montant et Mode de Paiement",
            description:
              "Indiquez le montant total de la dépense. Sélectionnez le mode de paiement utilisé (ex: Caisse, Banque, carte de crédit de l'entreprise).",
          },
          {
            title: "Fournisseur/Bénéficiaire (Optionnel)",
            description:
              "Si pertinent, associez la dépense à un fournisseur ou à un bénéficiaire.",
          },
          {
            title: "Référence et Notes",
            description:
              "Ajoutez un numéro de référence (ex: numéro de facture fournisseur) et des notes descriptives pour plus de contexte.",
          },
          {
            title: "Pièce Jointe (Optionnel)",
            description:
              "Possibilité d'attacher un justificatif numérisé (facture, reçu). (Note: Cette fonctionnalité dépend de l'implémentation).",
          },
          {
            title: "Sauvegarder la Dépense",
            description:
              "Une fois enregistrée, la dépense apparaîtra dans l'historique.",
          },
        ],
      },
      {
        type: "paragraph",
        title: "Consulter l'Historique des Dépenses",
        content:
          "Visualisez la liste de toutes les dépenses enregistrées, avec des options de filtre (par date, catégorie, magasin) et de recherche pour retrouver facilement des informations.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Tutoriel vidéo - Enregistrer une dépense et la consulter (6 min)",
      },
    ],
    faq: [
      {
        question: "Puis-je lier une dépense à un projet spécifique ?",
        answer:
          "La liaison directe à des projets n'est pas explicitement mentionnée dans les noms des fichiers. Cela pourrait être une fonctionnalité additionnelle ou gérée via des catégories de dépenses spécifiques.",
      },
      {
        question: "Comment sont gérées les taxes (TVA) sur les dépenses ?",
        answer:
          "Le détail de la gestion des taxes sur les dépenses (TVA déductible, etc.) n'est pas spécifié. En général, le montant de la dépense est enregistré TTC, et la gestion de la TVA est traitée au niveau comptable ou via des configurations de taxes spécifiques si disponibles.",
      },
      {
        question: "Est-il possible de programmer des dépenses récurrentes ?",
        answer:
          "La programmation de dépenses récurrentes (ex: loyer mensuel) n'est pas une fonctionnalité standard habituellement présente dans un simple module de saisie. Cela nécessiterait une logique de création automatique.",
      },
    ],
  },
  // --- E-COMMERCE ET MODULES FUTURS ---
  "ecommerce-futur": {
    title: "Module E-commerce : Votre Boutique en Ligne (En Développement)",
    introduction:
      "ELSA GESTION prépare l'intégration d'un module E-commerce complet pour vous permettre de vendre vos produits en ligne facilement, en parfaite synchronisation avec votre gestion commerciale et vos stocks.",
    icon: <GlobalOutlined />,
    sections: [
      {
        type: "alert",
        messageType: "info",
        message: "Module en Cours de Développement",
        description:
          "Les fonctionnalités décrites ci-dessous représentent notre vision pour le module E-commerce. Certaines pourraient évoluer d'ici sa sortie officielle. Restez informés de nos mises à jour !",
      },
      {
        type: "subtitle",
        title: "Vision : Une Extension Naturelle de Votre Activité",
        icon: <ShoppingCartOutlined />,
      },
      {
        type: "paragraph",
        content:
          "Notre objectif est de vous fournir une solution E-commerce intégrée, transformant ELSA GESTION en une plateforme de vente omnicanale. Vous pourrez gérer vos ventes physiques et en ligne depuis un seul endroit, avec une vue unifiée de vos clients, produits, et commandes.",
      },
      {
        type: "steps",
        title: "Fonctionnalités Clés Envisagées",
        steps: [
          {
            title: "Création de Votre Boutique en Ligne",
            description:
              "Des outils intuitifs pour créer et personnaliser l'apparence de votre boutique en ligne, reflétant votre marque.",
            icon: <SettingOutlined />,
          },
          {
            title: "Catalogue Produits Synchronisé",
            description:
              "Vos produits et leurs informations (descriptions, prix, images, stocks) gérés dans ELSA GESTION seront automatiquement disponibles sur votre boutique en ligne.",
          },
          {
            title: "Gestion des Commandes Clients",
            description:
              "Les clients pourront naviguer dans votre catalogue, ajouter des produits au panier et passer commande directement en ligne. Les commandes apparaîtront dans votre interface ELSA GESTION pour traitement.",
            icon: <UnorderedListOutlined />,
          },
          {
            title: "Intégration des Paiements en Ligne",
            description:
              "Nous prévoyons d'intégrer des solutions de paiement en ligne sécurisées pour faciliter les transactions.",
            icon: <WalletOutlined />,
          },
          {
            title: "Fiches Produits Partageables",
            description:
              "Générez facilement des liens vers vos fiches produits à partager sur les réseaux sociaux, emails, ou autres canaux marketing pour attirer les clients vers votre boutique.",
          },
          {
            title: "Suivi des Stocks en Temps Réel",
            description:
              "La disponibilité des produits sur votre boutique en ligne sera synchronisée avec les niveaux de stock réels de votre magasin ou entrepôt principal.",
          },
        ],
      },
      {
        type: "paragraph",
        title: "Inspiré des Meilleures Pratiques",
        content:
          "Nous nous inspirons des plateformes E-commerce modernes comme Shopify pour vous offrir une expérience utilisateur fluide, tant pour vous que pour vos clients, avec des fonctionnalités robustes pour développer votre présence en ligne.",
      },
      {
        type: "media_placeholder",
        text: "Placeholder : Maquette ou aperçu vidéo du futur module E-commerce (Prochainement)",
      },
    ],
    faq: [
      {
        question: "Quand le module E-commerce sera-t-il disponible ?",
        answer:
          "Le module E-commerce est activement en cours de développement. Nous annoncerons une date de lancement dès que nous aurons une estimation plus précise. Suivez nos communications !",
      },
      {
        question:
          "Sera-t-il possible de connecter un nom de domaine existant ?",
        answer:
          "C'est un objectif important pour nous. Nous étudions les meilleures options pour vous permettre d'utiliser votre propre nom de domaine avec votre boutique ELSA GESTION.",
      },
      {
        question: "Quels types de produits pourrai-je vendre ?",
        answer:
          "L'idée est de vous permettre de vendre tous les produits que vous gérez actuellement dans ELSA GESTION, qu'ils soient physiques ou, à terme, des services.",
      },
      {
        question: "Y aura-t-il des outils marketing intégrés ?",
        answer:
          "Nous prévoyons des fonctionnalités de base pour le partage et la visibilité, et explorerons des intégrations marketing plus poussées dans les phases ultérieures de développement.",
      },
    ],
  },
};

const GuideDetailPage = () => {
  const { guideSlug } = useParams();
  const guide = guidesContent[guideSlug];

  if (!guide) {
    return (
      <div
        className="guide-detail-page"
        style={{ padding: "24px", background: "#fff" }}
      >
        <Breadcrumb style={{ marginBottom: "24px" }}>
          <Breadcrumb.Item>
            <Link to="/">
              <HomeOutlined />
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/guides">Guides & Tutoriels</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Guide Introuvable</Breadcrumb.Item>
        </Breadcrumb>
        <Empty
          description={
            <Title level={4}>Oops! Ce guide n\'existe pas encore.</Title>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="guide-detail-page"
      style={{ padding: "24px", background: "#fff" }}
    >
      <Breadcrumb style={{ marginBottom: "24px" }}>
        <Breadcrumb.Item>
          <Link to="/">
            <HomeOutlined />
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/guides">Guides & Tutoriels</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{guide.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} style={{ color: "#003366", marginBottom: "16px" }}>
        {guide.icon &&
          React.cloneElement(guide.icon, {
            style: {
              marginRight: "12px",
              fontSize: "28px",
              verticalAlign: "bottom",
            },
          })}
        {guide.title}
      </Title>
      <Paragraph style={{ fontSize: "16px", marginBottom: "32px" }}>
        {guide.introduction}
      </Paragraph>

      <div className="guide-content">
        {guide.sections &&
          guide.sections.map((section, index) => {
            if (section.type === "paragraph") {
              return (
                <div key={index} style={{ marginBottom: "20px" }}>
                  {section.title && <Title level={3}>{section.title}</Title>}
                  {section.icon &&
                    React.cloneElement(section.icon, {
                      style: { marginRight: "8px", verticalAlign: "middle" },
                    })}
                  <Paragraph>{section.content}</Paragraph>
                </div>
              );
            }
            if (section.type === "subtitle") {
              return (
                <Title
                  level={3}
                  key={index}
                  style={{
                    marginTop: "32px",
                    marginBottom: "16px",
                    color: "#0055a4",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {section.icon &&
                    React.cloneElement(section.icon, {
                      style: { marginRight: "10px", fontSize: "24px" },
                    })}
                  {section.title}
                </Title>
              );
            }
            if (section.type === "steps") {
              return (
                <div key={index} style={{ marginBottom: "32px" }}>
                  {section.title && (
                    <Title level={4} style={{ marginBottom: "16px" }}>
                      {section.title}
                    </Title>
                  )}
                  <Steps direction="vertical" current={-1}>
                    {" "}
                    {/* Changed current to -1 for no active step */}
                    {section.steps.map((step, stepIndex) => (
                      <Step
                        key={stepIndex}
                        title={step.title}
                        description={step.description}
                        icon={step.icon || <BookOutlined />}
                      />
                    ))}
                  </Steps>
                </div>
              );
            }
            if (section.type === "alert") {
              return (
                <Alert
                  key={index}
                  message={section.message}
                  description={section.description}
                  type={section.messageType}
                  showIcon
                  icon={
                    section.messageType === "info" ||
                    section.messageType === "success" ? (
                      <BulbOutlined />
                    ) : section.messageType === "warning" ? (
                      <QuestionCircleOutlined /> // Or a more specific warning icon
                    ) : (
                      <QuestionCircleOutlined />
                    )
                  }
                  style={{ marginBottom: "20px" }}
                />
              );
            }
            if (section.type === "media_placeholder") {
              return (
                <div key={index} className="guide-media-placeholder">
                  <PlayCircleOutlined
                    style={{ fontSize: "24px", marginRight: "8px" }}
                  />
                  {section.text}
                </div>
              );
            }
            return null;
          })}

        {guide.faq && guide.faq.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <Title level={3} style={{ marginBottom: "20px" }}>
              Questions Fréquemment Posées (FAQ)
            </Title>
            <Collapse accordion>
              {guide.faq.map((item, index) => (
                <Panel header={item.question} key={index}>
                  <Paragraph>{item.answer}</Paragraph>
                </Panel>
              ))}
            </Collapse>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideDetailPage;
