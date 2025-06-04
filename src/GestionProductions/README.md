# Module de Gestion de Production Industrielle

Ce module permet de gérer la production industrielle en transformant des matières premières en produits finis.

## Fonctionnalités

- Définition d'unités de production (ratios de conversion)
- Calcul des besoins en matières premières
- Vérification de la disponibilité des stocks
- Processus de production (transformation de matières premières en produits finis)
- Historique des productions

## Structure des fichiers

- `index.js` - Point d'entrée du module, exporte tous les composants
- `api.js` - Service pour les appels API
- `ProductionList.js` - Liste des unités de production
- `ProductionUnitForm.js` - Formulaire de création/édition des unités de production
- `ProductionProcess.js` - Processus de production
- `ProductionHistory.js` - Historique des productions

## Intégration

### 1. Intégrez les routes dans votre fichier de routes principal :

```javascript
// Exemple d'intégration dans votre fichier de routes principal
import React from "react";
import { Routes, Route } from "react-router-dom";
import {
  ProductionList,
  ProductionUnitForm,
  ProductionProcess,
  ProductionHistory,
} from "./GestionProductions";

function AppRoutes() {
  return (
    <Routes>
      {/* Vos routes existantes */}

      {/* Routes pour le module de production */}
      <Route path="/production/units" element={<ProductionList />} />
      <Route path="/production/units/create" element={<ProductionUnitForm />} />
      <Route
        path="/production/units/edit/:id"
        element={<ProductionUnitForm />}
      />
      <Route path="/production/process" element={<ProductionProcess />} />
      <Route path="/production/process/:id" element={<ProductionProcess />} />
      <Route path="/production/history" element={<ProductionHistory />} />
    </Routes>
  );
}

export default AppRoutes;
```

### 2. Ajoutez les entrées au menu principal :

```javascript
// Exemple d'ajout au menu principal (avec Ant Design)
import { ExperimentOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const items = [
  // Autres éléments de menu...

  {
    key: "production",
    icon: <ExperimentOutlined />,
    label: "Production",
    children: [
      {
        key: "production-units",
        label: <Link to="/production/units">Unités de production</Link>,
      },
      {
        key: "production-process",
        label: <Link to="/production/process">Gérer la production</Link>,
      },
      {
        key: "production-history",
        label: <Link to="/production/history">Historique</Link>,
      },
    ],
  },
];
```

### 3. Intégrez le backend en ajoutant la route au fichier app.js :

```javascript
// Dans le fichier app.js du backend
const productionRoutes = require("./routes/production");
app.use("/api/production", productionRoutes);
```

## Tables de base de données requises

Trois nouvelles tables sont nécessaires :

1. `production_units` - Définit les unités de production
2. `production_unit_items` - Stocke les associations entre produits et unités de production
3. `production_logs` - Enregistre l'historique des productions

Le fichier SQL pour créer ces tables est disponible dans `BD DATA/production_units.sql`.

## Utilisation

1. Créez une unité de production (définissez les matières premières et les produits finis)
2. Accédez à "Gérer la production"
3. Sélectionnez une unité de production
4. Entrez la quantité souhaitée
5. Calculez les besoins en matières premières
6. Lancez la production si le stock est suffisant
7. Consultez l'historique des productions

## Conception et implémentation

Dans ce module, une unité de production est à la fois :

1. Une entité qui consomme des matières premières
2. Et le produit fini lui-même qui est créé

Cette approche d'auto-référencement simplifie le processus de production en évitant d'avoir à créer séparément les produits de sortie.

## Implémentation Frontend

Le formulaire de création d'unité de production enregistre :

- Les informations de base de l'unité (nom, description, etc.)
- Les paramètres de stock (unité, quantité de sortie, etc.)
- Les matières premières nécessaires

## Implémentation Backend requise

Pour que cette approche fonctionne correctement, les ajustements suivants sont nécessaires dans l'API backend :

### 1. Pour la création d'unité de production (`POST /api/production/units`)

Quand une unité de production est créée :

1. Créer d'abord l'enregistrement dans la table `products`
2. Créer l'enregistrement associé dans `product_details`
3. Pour le produit de sortie avec l'indicateur `"product_id": "self_reference"` :
   - Remplacer "self_reference" par l'ID du produit qui vient d'être créé
   - Ainsi l'unité de production fait référence à elle-même comme produit fini

```php
// Exemple de code PHP pour le backend
if ($outputs[0]['product_id'] === 'self_reference') {
    $outputs[0]['product_id'] = $newlyCreatedProductId;
}
```

### 2. Pour la mise à jour d'unité de production (`PUT /api/production/units/{id}`)

Lors de la mise à jour, le frontend envoie déjà l'ID correct dans `outputs[0]['product_id']`.

### 3. Pour le processus de production (`POST /api/production/process`)

Le processus de production doit être adapté pour traiter le cas où le produit de sortie est l'unité de production elle-même.

## Avantages de cette approche

1. **Simplicité de l'interface** : l'utilisateur n'a pas à sélectionner de produits finis
2. **Cohérence des données** : une unité de production représente directement un produit fini
3. **Maintenance simplifiée** : une seule entité à gérer au lieu de deux séparées
4. **Meilleure expérience utilisateur** : processus plus intuitif

## Note technique

La valeur spéciale "self_reference" est utilisée comme indicateur pour le backend. Si cette approche n'est pas compatible avec l'implémentation actuelle du backend, une autre solution serait de revenir à l'approche précédente avec un produit de sortie fictif.
