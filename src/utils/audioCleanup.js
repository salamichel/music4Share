import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { isLocalAudioUrl } from './localAudioStorage';

/**
 * Nettoie les références audio locales (local://) dans Firestore
 * Ces références pointent vers IndexedDB qui peut ne plus contenir les fichiers
 * @returns {Promise<number>} Nombre de références nettoyées
 */
export const cleanOrphanedLocalAudioRefs = async () => {
  if (!db) {
    console.warn('Firebase non configuré');
    return 0;
  }

  try {
    console.log('🧹 Nettoyage des références audio locales orphelines...');

    const songsRef = collection(db, 'songs');
    const snapshot = await getDocs(songsRef);

    let cleaned = 0;
    const updates = [];

    snapshot.forEach((docSnapshot) => {
      const song = docSnapshot.data();

      // Si la chanson a une référence audio locale
      if (song.audioUrl && isLocalAudioUrl(song.audioUrl)) {
        updates.push(
          updateDoc(doc(db, 'songs', docSnapshot.id), {
            audioUrl: null
          }).then(() => {
            console.log(`✅ Nettoyé: ${song.title} (${song.audioUrl})`);
            cleaned++;
          }).catch((err) => {
            console.error(`❌ Erreur pour ${song.title}:`, err);
          })
        );
      }
    });

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updates);

    console.log(`✅ ${cleaned} référence(s) audio locale(s) nettoyée(s)`);
    return cleaned;
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    throw error;
  }
};

/**
 * Compte le nombre de chansons avec des références audio locales
 * @returns {Promise<number>} Nombre de références locales
 */
export const countLocalAudioRefs = async () => {
  if (!db) return 0;

  try {
    const songsRef = collection(db, 'songs');
    const snapshot = await getDocs(songsRef);

    let count = 0;
    snapshot.forEach((docSnapshot) => {
      const song = docSnapshot.data();
      if (song.audioUrl && isLocalAudioUrl(song.audioUrl)) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Erreur lors du comptage:', error);
    return 0;
  }
};
