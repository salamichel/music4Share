# Guide de déploiement du serveur backend

## Option 1 : Déploiement manuel sur serveur Linux

### 1. Installer Node.js sur votre serveur
```bash
# Se connecter au serveur
ssh user@music4chalemine.moka-web.net

# Installer Node.js (version 18 ou plus)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Copier les fichiers du serveur
```bash
# Depuis votre machine locale
scp -r server/ user@music4chalemine.moka-web.net:/var/www/music4share-backend/
```

### 3. Installer les dépendances et démarrer
```bash
# Sur le serveur
cd /var/www/music4share-backend
npm install
npm start
```

### 4. Configurer PM2 pour auto-restart (recommandé)
```bash
# Installer PM2
sudo npm install -g pm2

# Démarrer le serveur avec PM2
pm2 start server.js --name music4share-backend

# Auto-restart au démarrage du serveur
pm2 startup
pm2 save
```

### 5. Configurer Nginx comme reverse proxy
Créer `/etc/nginx/sites-available/backend`:
```nginx
server {
    listen 80;
    server_name api.music4chalemine.moka-web.net;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Augmenter la limite pour les uploads
        client_max_body_size 50M;
    }
}
```

Activer et redémarrer :
```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configurer le frontend
Dans votre fichier `.env` de production :
```bash
REACT_APP_SERVER_URL=https://api.music4chalemine.moka-web.net
```

Rebuild le frontend :
```bash
npm run build
```

---

## Option 2 : Déploiement avec Docker Compose (sur le serveur)

### 1. Installer Docker et Docker Compose sur le serveur
```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Copier le projet sur le serveur
```bash
scp -r . user@music4chalemine.moka-web.net:/var/www/music4share/
```

### 3. Démarrer avec Docker Compose
```bash
# Sur le serveur
cd /var/www/music4share
docker-compose up -d --build
```

### 4. Configurer Nginx pour router vers les conteneurs
```nginx
# Frontend
server {
    listen 80;
    server_name music4chalemine.moka-web.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend
server {
    listen 80;
    server_name api.music4chalemine.moka-web.net;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

---

## Option 3 : Déploiement sur Heroku / Railway / Render

### Pour le backend seul :

1. Créer un nouveau fichier `package.json` à la racine avec :
```json
{
  "name": "music4share-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "cd server && npm start",
    "install": "cd server && npm install"
  }
}
```

2. Déployer sur la plateforme de votre choix
3. Noter l'URL publique (ex: `https://music4share-backend.herokuapp.com`)
4. Configurer `.env` :
```bash
REACT_APP_SERVER_URL=https://music4share-backend.herokuapp.com
```

---

## Vérification du déploiement

Tester que le backend est accessible :
```bash
curl https://api.music4chalemine.moka-web.net/api/health
# Devrait retourner: {"status":"OK","message":"Server is running"}
```

## Sécurité

⚠️ **Important** : Configurez CORS dans `server/server.js` pour n'autoriser que votre domaine :

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://music4chalemine.moka-web.net', 'http://localhost:3000']
}));
```
