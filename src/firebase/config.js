import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase (à remplir avec vos identifiants)
// Note: Audio files are stored locally in IndexedDB, not in Firebase Storage
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialiser Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialisé avec succès (Firestore only - audio stored locally)');
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
  console.warn('⚠️ L\'application fonctionnera en mode local sans persistance.');
}

export { db };
