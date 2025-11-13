# Résolution des problèmes Docker

## Problème : "ENOSPC: no space left on device"

Ce problème survient quand Docker manque d'espace disque. Voici les solutions :

### Solution 1 : Nettoyer Docker (Recommandé)

```bash
# 1. Arrêter tous les conteneurs
docker-compose down

# 2. Nettoyer les images, conteneurs et volumes inutilisés
docker system prune -a --volumes

# 3. Vérifier l'espace libéré
docker system df
```

### Solution 2 : Augmenter l'espace alloué à Docker

#### Sur Docker Desktop (Windows/Mac)

1. Ouvrir Docker Desktop
2. Aller dans **Settings** > **Resources** > **Advanced**
3. Augmenter "Disk image size" (ex: de 60 GB à 100 GB)
4. Cliquer sur "Apply & Restart"

#### Sur Linux

Docker utilise tout l'espace disponible sur le disque par défaut. Vérifiez l'espace disque :

```bash
df -h
```

Si le disque est plein, supprimez des fichiers inutiles ou ajoutez de l'espace disque.

### Solution 3 : Nettoyer sélectivement

```bash
# Supprimer les images non utilisées
docker image prune -a

# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les volumes non utilisés
docker volume prune

# Supprimer les réseaux non utilisés
docker network prune

# Supprimer le cache de build
docker builder prune -a
```

### Solution 4 : Libérer de l'espace sur le disque hôte

```bash
# Sur Linux/Mac
sudo du -sh /var/lib/docker
rm -rf ~/node_modules  # Si vous avez des node_modules locaux

# Vider le cache npm
npm cache clean --force
```

## Problème : Warnings "EBADENGINE" (Node.js 18 vs 20)

**Résolu** ✅ : Le Dockerfile a été mis à jour pour utiliser Node.js 20.

Si vous aviez déjà construit l'image avec Node.js 18 :

```bash
# Forcer la reconstruction de l'image
docker-compose build --no-cache

# Ou supprimer l'ancienne image et reconstruire
docker rmi music4share
docker-compose up --build
```

## Commandes utiles

```bash
# Voir l'utilisation de l'espace Docker
docker system df

# Voir les détails
docker system df -v

# Voir les conteneurs actifs
docker ps

# Voir tous les conteneurs (même arrêtés)
docker ps -a

# Voir les images
docker images

# Voir les volumes
docker volume ls
```

## Après le nettoyage

```bash
# Reconstruire et démarrer
docker-compose up --build

# Ou en arrière-plan
docker-compose up --build -d
```

## Alternative : Exécuter sans Docker

Si les problèmes Docker persistent, vous pouvez exécuter l'application directement avec npm :

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

L'application sera accessible sur http://localhost:3000

## Support

Si le problème persiste après ces étapes :
1. Vérifier l'espace disque disponible : `df -h`
2. Redémarrer Docker Desktop
3. Redémarrer votre ordinateur
