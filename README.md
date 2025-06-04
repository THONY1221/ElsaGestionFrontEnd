# ELSA GESTION - Documentation de déploiement

## 1. Architecture système

- **Application**: Node.js (backend) + React (frontend)
- **Base de données**: MySQL
- **Serveur web**: Nginx (proxy inverse)
- **Gestionnaire de processus**: PM2

## 2. Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Node.js v16+ et npm
- MySQL 8.0+
- Nginx
- Domaine configuré avec DNS pointant vers l'IP du serveur
- Certificat SSL (Let's Encrypt recommandé)

## 3. Configuration de l'environnement

### Variables d'environnement (.env)

```
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_USER=elsa_prod_user
DB_PASSWORD=mot_de_passe_sécurisé
DB_NAME=GestionCommerciale
DB_PORT=3306

# JWT
JWT_SECRET=votre_secret_jwt_très_long_et_complexe
JWT_EXPIRY=1d

# Upload paths
UPLOAD_DIR=/var/www/elsa-gestion/uploads
```

### Configuration MySQL

```sql
CREATE USER 'elsa_prod_user'@'localhost' IDENTIFIED BY 'mot_de_passe_sécurisé';
GRANT SELECT, INSERT, UPDATE, DELETE ON GestionCommerciale.* TO 'elsa_prod_user'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Procédure de déploiement initial

1. **Préparation du serveur**

   ```bash
   # Mise à jour du système
   sudo apt update && sudo apt upgrade -y

   # Installation des dépendances
   sudo apt install -y nodejs npm mysql-server nginx certbot

   # Installation de PM2
   sudo npm install -g pm2
   ```

2. **Déploiement de l'application**

   ```bash
   # Cloner le dépôt
   git clone [URL_DU_REPO] /var/www/elsa-gestion
   cd /var/www/elsa-gestion

   # Installer les dépendances
   npm install --production

   # Créer le fichier .env
   nano .env
   # [Ajouter les variables d'environnement]

   # Construire le front-end
   npm run build

   # Démarrer avec PM2
   pm2 start app.js --name="elsa-gestion"
   pm2 save
   pm2 startup
   ```

3. **Configuration Nginx**

   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;

       location / {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl;
       server_name votre-domaine.com;

       ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

       root /var/www/elsa-gestion/build;
       index index.html;

       # Frontend - fichiers statiques
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Uploads
       location /uploads {
           alias /var/www/elsa-gestion/uploads;
       }
   }
   ```

## 5. Procédures de maintenance

### Sauvegardes de la base de données

```bash
# Script de sauvegarde quotidienne (à placer dans /etc/cron.daily)
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/var/backups/mysql
mkdir -p $BACKUP_DIR
mysqldump -u elsa_prod_user -p"mot_de_passe_sécurisé" GestionCommerciale > $BACKUP_DIR/GestionCommerciale-$DATE.sql
# Rotation: supprime les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.sql" -type f -mtime +30 -delete
```

### Mise à jour de l'application

```bash
cd /var/www/elsa-gestion
git pull
npm install --production
npm run build
pm2 restart elsa-gestion
```

## 6. Procédures de restauration

### Restauration en cas de panne

```bash
# Restauration de la base de données
mysql -u elsa_prod_user -p"mot_de_passe_sécurisé" GestionCommerciale < /var/backups/mysql/GestionCommerciale-YYYY-MM-DD.sql

# Redémarrage du service
pm2 restart elsa-gestion
```

### Restauration complète

En cas de panne majeure nécessitant une reconstruction complète:

1. Installer le système d'exploitation
2. Suivre la procédure de déploiement initial
3. Restaurer la dernière sauvegarde de la base de données
4. Restaurer les fichiers uploads depuis la sauvegarde

## 7. Surveillance et logging

### Configuration PM2 pour logs et monitoring

```bash
# Visualiser les logs
pm2 logs elsa-gestion

# Configurer la rotation des logs
pm2 install pm2-logrotate

# Dashboard de monitoring
pm2 monit
```

### Alertes par email

Configuration des alertes PM2 pour les plantages d'application:

```bash
pm2 install pm2-notifications
```

## 8. Informations de contact

- **Administrateur système**: [Nom, email, téléphone]
- **Support technique**: [Nom, email, téléphone]
- **Hébergeur**: [Nom, numéro de compte, contact support]
