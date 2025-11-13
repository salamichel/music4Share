import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

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
