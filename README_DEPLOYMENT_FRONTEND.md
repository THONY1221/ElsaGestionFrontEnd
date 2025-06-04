# ELSA GESTION - Frontend Deployment Package

## 🚀 Instructions de déploiement

### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation
1. Décompressez ce fichier sur votre serveur
2. Naviguez vers le dossier décompressé :
   ```bash
   cd elsa-frontend-deploy
   ```

3. Installez les dépendances :
   ```bash
   npm install
   ```

4. Construisez l'application pour la production :
   ```bash
   npm run build
   ```

### Configuration
1. Copiez `.env.example` vers `.env` et configurez vos variables d'environnement
2. Assurez-vous que l'URL de votre API backend est correctement configurée

### Déploiement
1. **Serveur statique** : Copiez le contenu du dossier `build/` vers votre serveur web
2. **Nginx** : Pointez votre configuration vers le dossier `build/`
3. **Apache** : Configurez votre DocumentRoot vers le dossier `build/`

### Scripts disponibles
- `npm start` : Démarre le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm test` : Lance les tests
- `npm run setup` : Installation complète + build

### Structure des fichiers
- `src/` : Code source React
- `public/` : Fichiers statiques
- `build/` : Version compilée (générée après npm run build)

### Support
Pour toute question concernant le déploiement, consultez la documentation complète dans le repository principal.

---
Package généré le: 04/06/2025 10:18:09
