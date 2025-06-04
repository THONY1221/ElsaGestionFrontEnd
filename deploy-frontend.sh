#!/bin/bash

# Script de déploiement automatique ELSA Frontend
echo "🚀 Déploiement ELSA Frontend en cours..."

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Build de production
echo "🔨 Construction de l'application..."
npm run build

echo "✅ Déploiement terminé !"
echo "📁 Les fichiers de production se trouvent dans le dossier 'build/'"
echo "🌐 Copiez le contenu du dossier 'build/' vers votre serveur web"
