# Documentation : Unités de Production

## Conception de l'auto-référencement

Dans cette implémentation, une unité de production est à la fois :

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

## Solutions alternatives

Si l'implémentation d'auto-référencement n'est pas possible côté backend :

1. **Solution temporaire** : Utiliser un produit fictif comme dans l'implémentation précédente

   ```javascript
   // Produit de sortie fictif - utiliser un produit valide existant
   const defaultProductId = products.length > 0 ? products[0].id : 1;
   formData.append(
     "outputs",
     JSON.stringify([
       {
         product_id: defaultProductId,
         quantity: values.output_quantity || 1,
       },
     ])
   );
   ```

2. **Solution à long terme** : Modifier le backend pour accepter un indicateur spécial ou un tableau vide pour `outputs` lorsqu'il s'agit d'une unité de production.
