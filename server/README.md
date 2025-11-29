# Music4Share Server

Serveur backend pour gérer l'upload et le stockage des fichiers audio MP3.

## Installation

```bash
cd server
npm install
```

## Démarrage

```bash
# Mode production
npm start

# Mode développement (avec auto-reload)
npm run dev
```

Le serveur démarrera sur le port 5000 par défaut.

## Endpoints API

### Upload d'un fichier audio
- **POST** `/api/upload/audio`
- Body: `multipart/form-data` avec le champ `audioFile` et `songId`
- Retourne: `{ success: true, url: "/api/audio/filename.mp3", filename: "...", size: ... }`

### Récupérer un fichier audio
- **GET** `/api/audio/:filename`
- Retourne: Le fichier audio

### Supprimer un fichier audio
- **DELETE** `/api/audio/:filename`
- Retourne: `{ success: true, message: "..." }`

### Health check
- **GET** `/api/health`
- Retourne: `{ status: "OK", message: "Server is running" }`

## Stockage

Les fichiers sont stockés dans le dossier `server/uploads/`.

## Limites

- Taille maximale: 50MB par fichier
- Formats acceptés: MP3, WAV, OGG, M4A
