# Music4Chalemine - Version organisée

Application collaborative pour musiciens - Partagez vos répertoires et trouvez des musiciens qui maîtrisent les mêmes morceaux.

## Structure du projet

```
musicshare-organized/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── Login.jsx        # Page de connexion/inscription
│   │   ├── Header.jsx       # En-tête avec recherche
│   │   ├── SongCard.jsx     # Affichage d'un titre avec emplacements
│   │   ├── SongAddForm.jsx  # Formulaire d'ajout de titre (simple/masse)
│   │   ├── PersonalRepertoire.jsx  # Répertoire personnel
│   │   ├── GroupList.jsx    # Liste des groupes
│   │   └── SlotManager.jsx  # Gestion des emplacements d'instruments
│   ├── hooks/               # Hooks personnalisés
│   │   └── useAppState.js   # Gestion de l'état global
│   ├── utils/               # Fonctions utilitaires
│   │   └── helpers.js       # Helpers (filtrage, parsing, etc.)
│   ├── data/                # Constantes et données
│   │   └── constants.js     # Emplacements par défaut
│   ├── App.jsx              # Composant principal
│   ├── index.js             # Point d'entrée
│   └── index.css            # Styles globaux
├── public/
│   └── index.html           # Template HTML
├── package.json             # Dépendances
├── tailwind.config.js       # Configuration Tailwind
├── postcss.config.js        # Configuration PostCSS
├── Dockerfile               # Image Docker
└── docker-compose.yml       # Orchestration Docker

```

## Installation

### Option 1 : Avec Docker Compose (recommandé)

```bash
# Lancer l'application
docker-compose up

# En arrière-plan
docker-compose up -d

# Arrêter
docker-compose down
```

### Option 2 : Installation Node.js classique

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm start

# Build pour production
npm run build
```

L'application sera accessible sur **http://localhost:3000**

## Fonctionnalités

### Gestion des titres
- ✅ Répertoire personnel (sans groupe)
- ✅ Répertoires par groupe
- ✅ Ajout simple (titre par titre)
- ✅ Import en masse (copier/coller une liste)
- ✅ Liens YouTube optionnels
- ✅ Recherche globale

### Emplacements d'instruments
- ✅ 6 emplacements par défaut (Batterie, Chant, Basse, Guitare, Chœur, Piano)
- ✅ Emplacements personnalisables (ajouter saxophone, violon, etc.)
- ✅ Plusieurs musiciens par emplacement
- ✅ Un musicien peut occuper plusieurs emplacements sur le même titre
- ✅ Badge "✓ Jouable" quand Batterie + Guitare/Basse + Chant sont remplis
- ✅ Mise en évidence visuelle des titres jouables (fond vert)

### Groupes
- ✅ Créer des groupes
- ✅ Rejoindre plusieurs groupes
- ✅ Voir les membres de chaque groupe
- ✅ Répertoires séparés par groupe

### 🆕 Enrichissement automatique avec l'API Gemini
- ✅ Récupération automatique de la durée du titre
- ✅ Génération des grilles d'accords
- ✅ Extraction des paroles complètes
- ✅ Identification du genre musical
- ✅ Interface détaillée pour chaque titre avec modal
- ✅ Support de l'import en masse avec enrichissement automatique

#### Configuration de l'API Gemini

1. **Obtenir une clé API Gemini**
   - Visitez [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Créez une nouvelle clé API gratuite

2. **Configurer l'application**
   ```bash
   # Copier le fichier d'exemple
   cp .env.example .env

   # Éditer le fichier .env et ajouter votre clé
   REACT_APP_GEMINI_API_KEY=votre_cle_api_ici
   ```

3. **Redémarrer l'application**
   ```bash
   # Avec Docker
   docker-compose down && docker-compose up

   # Ou avec npm
   npm start
   ```

4. **Utilisation**
   - Lors de l'ajout d'un titre (simple ou en masse), l'API Gemini enrichit automatiquement les informations
   - Cliquez sur le bouton ℹ️ sur chaque titre pour voir les détails complets (accords, paroles, etc.)
   - Les titres enrichis affichent un badge ✨ "Enrichi"

**Note** : Si la clé API n'est pas configurée, l'application fonctionnera normalement mais sans l'enrichissement automatique.

## Architecture

### Composants

**Login.jsx** : Gère l'authentification (connexion et inscription)

**Header.jsx** : En-tête avec le nom d'utilisateur, bouton de gestion des emplacements, recherche et déconnexion

**SongCard.jsx** : Affiche un titre avec ses emplacements d'instruments cliquables, la liste des participants, et un bouton pour voir les détails enrichis

**SongDetails.jsx** : Modal affichant les informations détaillées d'un titre (durée, genre, accords, paroles) récupérées via l'API Gemini

**SongAddForm.jsx** : Formulaire avec bascule entre ajout simple et import en masse

**PersonalRepertoire.jsx** : Colonne de gauche avec le répertoire personnel

**GroupList.jsx** : Colonne de droite avec la liste des groupes (dépliables)

**SlotManager.jsx** : Modal pour ajouter/supprimer des emplacements d'instruments

### Hooks

**useAppState.js** : Hook personnalisé qui centralise tout l'état de l'application

### Services

**geminiService.js** : Service d'intégration avec l'API Gemini
- `enrichSongWithGemini()` : Enrichit un titre avec les données de l'API Gemini (durée, accords, paroles, genre)
- `enrichMultipleSongs()` : Enrichit plusieurs titres en batch avec gestion du rate limiting

### Utils

**helpers.js** : Fonctions utilitaires
- `isSongPlayable()` : Détermine si un titre est jouable
- `getFilteredSongs()` : Filtre les titres par groupe et recherche
- `parseBulkImportText()` : Parse le texte d'import en masse

### Data

**constants.js** : Emplacements d'instruments par défaut et critères de jouabilité

## Développement

### Ajouter un nouveau composant

1. Créer le fichier dans `src/components/NouveauComposant.jsx`
2. Importer et utiliser dans `App.jsx` ou un autre composant
3. Suivre les conventions de nommage (PascalCase pour les composants)

### Ajouter une nouvelle fonctionnalité

1. Ajouter l'état nécessaire dans `useAppState.js` si besoin
2. Créer les handlers dans `App.jsx`
3. Passer les props aux composants enfants
4. Ajouter les helpers dans `utils/helpers.js` si nécessaire

## Migration Firebase

Pour ajouter la persistance avec Firebase :

1. Installer Firebase : `npm install firebase`
2. Créer `src/firebase/config.js` avec votre configuration
3. Remplacer les `useState` par des appels Firestore
4. Utiliser `onSnapshot` pour la synchro en temps réel

## Notes

- Les données sont actuellement en mémoire (perdues au rafraîchissement)
- Aucune authentification réelle (mots de passe en clair)
- Prévu pour migration Firebase pour la production
