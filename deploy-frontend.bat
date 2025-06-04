@echo off
echo 🚀 Déploiement ELSA Frontend en cours...

echo 📦 Installation des dépendances...
npm install

echo 🔨 Construction de l'application...
npm run build

echo ✅ Déploiement terminé !
echo 📁 Les fichiers de production se trouvent dans le dossier 'build/'
echo 🌐 Copiez le contenu du dossier 'build/' vers votre serveur web
pause
