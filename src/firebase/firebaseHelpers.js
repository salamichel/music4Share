import {
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

// ========== ARTISTS ==========

export const addArtist = async (artistData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return artistData;
  }

  try {
    await setDoc(doc(db, 'artists', artistData.id), artistData);
    return artistData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'artiste:', error);
    throw error;
  }
};

export const updateArtist = async (artistId, updates) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'artists', artistId), updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'artiste:', error);
    throw error;
  }
};

export const deleteArtist = async (artistId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'artists', artistId));
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'artiste:', error);
    throw error;
  }
};

// ========== USERS ==========

export const addUser = async (userData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return userData;
  }

  try {
    // Utiliser setDoc avec l'ID du user pour éviter les doublons
    await setDoc(doc(db, 'users', userData.id), userData);
    return userData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    throw error;
  }
};

export const updateUser = async (userId, updates) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'users', userId), updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    throw error;
  }
};

// ========== GROUPS ==========

export const addGroup = async (groupData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return groupData;
  }

  try {
    await setDoc(doc(db, 'groups', groupData.id), groupData);
    return groupData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du groupe:', error);
    throw error;
  }
};

export const updateGroup = async (groupId, updates) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'groups', groupId), updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du groupe:', error);
    throw error;
  }
};

// ========== SONGS ==========

export const addSong = async (songData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return songData;
  }

  try {
    await setDoc(doc(db, 'songs', songData.id), songData);
    return songData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du titre:', error);
    throw error;
  }
};

export const updateSong = async (songId, updates) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'songs', songId), updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du titre:', error);
    throw error;
  }
};

export const deleteSong = async (songId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'songs', songId));
  } catch (error) {
    console.error('Erreur lors de la suppression du titre:', error);
    throw error;
  }
};

// ========== PARTICIPATIONS ==========

export const addParticipation = async (participationData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return participationData;
  }

  try {
    await setDoc(doc(db, 'participations', participationData.id), participationData);
    return participationData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la participation:', error);
    throw error;
  }
};

export const deleteParticipation = async (participationId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'participations', participationId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la participation:', error);
    throw error;
  }
};

// ========== INSTRUMENT SLOTS ==========

export const addInstrumentSlot = async (slotData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return slotData;
  }

  try {
    await setDoc(doc(db, 'instrumentSlots', slotData.id), slotData);
    return slotData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du slot:', error);
    throw error;
  }
};

export const deleteInstrumentSlot = async (slotId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'instrumentSlots', slotId));
  } catch (error) {
    console.error('Erreur lors de la suppression du slot:', error);
    throw error;
  }
};

// ========== BATCH OPERATIONS ==========

export const addMultipleSongs = async (songsArray) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return songsArray;
  }

  try {
    const promises = songsArray.map(song => addSong(song));
    await Promise.all(promises);
    return songsArray;
  } catch (error) {
    console.error('Erreur lors de l\'ajout multiple de titres:', error);
    throw error;
  }
};

export const addMultipleParticipations = async (participationsArray) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return participationsArray;
  }

  try {
    const promises = participationsArray.map(participation => addParticipation(participation));
    await Promise.all(promises);
    return participationsArray;
  } catch (error) {
    console.error('Erreur lors de l\'ajout multiple de participations:', error);
    throw error;
  }
};

// ========== SETLISTS ==========

export const addSetlist = async (setlistData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return setlistData;
  }

  try {
    await setDoc(doc(db, 'setlists', setlistData.id), setlistData);
    return setlistData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la setlist:', error);
    throw error;
  }
};

export const updateSetlist = async (setlistId, updates) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'setlists', setlistId), updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la setlist:', error);
    throw error;
  }
};

export const deleteSetlist = async (setlistId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'setlists', setlistId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la setlist:', error);
    throw error;
  }
};

// ========== SETLIST SONGS ==========

export const addSetlistSong = async (setlistSongData) => {
  if (!db) {
    console.warn('Firebase non configuré - mode local');
    return setlistSongData;
  }

  try {
    await setDoc(doc(db, 'setlistSongs', setlistSongData.id), setlistSongData);
    return setlistSongData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du titre à la setlist:', error);
    throw error;
  }
};

export const deleteSetlistSong = async (setlistSongId) => {
  if (!db) return;

  try {
    await deleteDoc(doc(db, 'setlistSongs', setlistSongId));
  } catch (error) {
    console.error('Erreur lors de la suppression du titre de la setlist:', error);
    throw error;
  }
};

export const updateSetlistSongPosition = async (setlistSongId, newPosition) => {
  if (!db) return;

  try {
    await updateDoc(doc(db, 'setlistSongs', setlistSongId), { position: newPosition });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la position:', error);
    throw error;
  }
};

// Batch update positions after drag & drop
export const updateSetlistSongPositions = async (positionUpdates) => {
  if (!db) return;

  try {
    const promises = positionUpdates.map(({ id, position }) =>
      updateSetlistSongPosition(id, position)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des positions:', error);
    throw error;
  }
};

// Helper: Calculate total duration for a setlist
export const calculateSetlistDuration = (setlistSongs, allSongs) => {
  let totalSeconds = 0;

  setlistSongs.forEach(setlistSong => {
    const song = allSongs.find(s => s.id === setlistSong.songId);
    if (song && song.duration) {
      // Parse duration (format: "MM:SS" or "H:MM:SS")
      const parts = song.duration.split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1]; // MM:SS
      } else if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2]; // H:MM:SS
      }
    }
  });

  // Convert back to MM:SS or H:MM:SS
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
