/**
 * Local audio storage using IndexedDB for browser-based storage
 * No Firebase Storage needed - all files stored locally in the browser
 */

const DB_NAME = 'Music4ShareAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Convert file to base64 data URL
 */
const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Store audio file locally in IndexedDB
 * @param {File} audioFile - The audio file to store
 * @param {string} songId - The ID of the song
 * @returns {Promise<string>} - A local reference ID
 */
export const storeAudioLocally = async (audioFile, songId) => {
  try {
    // Convert file to data URL
    const dataURL = await fileToDataURL(audioFile);

    // Store in IndexedDB
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const audioData = {
      id: songId,
      dataURL: dataURL,
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size,
      timestamp: Date.now()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(audioData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ Fichier audio stocké localement:', songId);

    // Return a local reference that we can use as "audioUrl"
    return `local://${songId}`;
  } catch (error) {
    console.error('Erreur lors du stockage local de l\'audio:', error);
    throw error;
  }
};

/**
 * Retrieve audio file from local storage
 * @param {string} songId - The ID of the song
 * @returns {Promise<string>} - The data URL of the audio file
 */
export const getAudioLocally = async (songId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(songId);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.dataURL);
        } else {
          reject(new Error('Audio not found'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audio local:', error);
    throw error;
  }
};

/**
 * Delete audio file from local storage
 * @param {string} songId - The ID of the song
 * @returns {Promise<void>}
 */
export const deleteAudioLocally = async (songId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.delete(songId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ Fichier audio supprimé localement:', songId);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'audio local:', error);
    // Don't throw - we don't want to block song deletion if audio deletion fails
  }
};

/**
 * Check if an audio URL is a local reference
 * @param {string} audioUrl - The audio URL to check
 * @returns {boolean}
 */
export const isLocalAudioUrl = (audioUrl) => {
  return audioUrl && audioUrl.startsWith('local://');
};

/**
 * Extract song ID from local audio URL
 * @param {string} audioUrl - The local audio URL
 * @returns {string} - The song ID
 */
export const getSongIdFromLocalUrl = (audioUrl) => {
  return audioUrl.replace('local://', '');
};

/**
 * Get all stored audio files info
 * @returns {Promise<Array>} - Array of audio file metadata
 */
export const getAllAudioFiles = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers audio:', error);
    return [];
  }
};
