import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DEFAULT_INSTRUMENT_SLOTS } from '../data/constants';

export const useFirebaseState = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [songs, setSongs] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [instrumentSlots, setInstrumentSlots] = useState(DEFAULT_INSTRUMENT_SLOTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Vérifier si Firebase est configuré
  useEffect(() => {
    if (db) {
      setIsFirebaseReady(true);
      console.log('✅ Connexion à Firebase établie');
    } else {
      setIsFirebaseReady(false);
      console.warn('⚠️ Firebase non configuré - mode local uniquement');
    }
  }, []);

  // Synchroniser les utilisateurs avec Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setUsers(usersData);
      },
      (error) => {
        console.error('Erreur lors de la synchronisation des utilisateurs:', error);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Synchroniser les groupes avec Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, 'groups'),
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setGroups(groupsData);
      },
      (error) => {
        console.error('Erreur lors de la synchronisation des groupes:', error);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Synchroniser les titres avec Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, 'songs'),
      (snapshot) => {
        const songsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setSongs(songsData);
      },
      (error) => {
        console.error('Erreur lors de la synchronisation des titres:', error);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Synchroniser les participations avec Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, 'participations'),
      (snapshot) => {
        const participationsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setParticipations(participationsData);
      },
      (error) => {
        console.error('Erreur lors de la synchronisation des participations:', error);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Synchroniser les emplacements d'instruments avec Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, 'instrumentSlots'),
      (snapshot) => {
        const slotsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Si aucun slot n'existe, initialiser avec les valeurs par défaut
        if (slotsData.length === 0) {
          DEFAULT_INSTRUMENT_SLOTS.forEach(async (slot) => {
            await setDoc(doc(db, 'instrumentSlots', slot.id), slot);
          });
          setInstrumentSlots(DEFAULT_INSTRUMENT_SLOTS);
        } else {
          setInstrumentSlots(slotsData);
        }
      },
      (error) => {
        console.error('Erreur lors de la synchronisation des slots:', error);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Fonctions de mise à jour (wrapper pour Firebase ou local)
  const updateUsers = async (newUsers) => {
    if (db && Array.isArray(newUsers)) {
      // Pas besoin de mettre à jour manuellement, onSnapshot s'en charge
      // Cette fonction est gardée pour compatibilité avec l'ancien code
    } else {
      setUsers(newUsers);
    }
  };

  const updateGroups = async (newGroups) => {
    if (db && Array.isArray(newGroups)) {
      // onSnapshot gère la mise à jour
    } else {
      setGroups(newGroups);
    }
  };

  const updateSongs = async (newSongs) => {
    if (db && Array.isArray(newSongs)) {
      // onSnapshot gère la mise à jour
    } else {
      setSongs(newSongs);
    }
  };

  const updateParticipations = async (newParticipations) => {
    if (db && Array.isArray(newParticipations)) {
      // onSnapshot gère la mise à jour
    } else {
      setParticipations(newParticipations);
    }
  };

  const updateInstrumentSlots = async (newSlots) => {
    if (db && Array.isArray(newSlots)) {
      // onSnapshot gère la mise à jour
    } else {
      setInstrumentSlots(newSlots);
    }
  };

  return {
    currentUser,
    setCurrentUser,
    view,
    setView,
    users,
    setUsers: updateUsers,
    groups,
    setGroups: updateGroups,
    songs,
    setSongs: updateSongs,
    participations,
    setParticipations: updateParticipations,
    instrumentSlots,
    setInstrumentSlots: updateInstrumentSlots,
    searchTerm,
    setSearchTerm,
    showSlotManager,
    setShowSlotManager,
    isFirebaseReady
  };
};
