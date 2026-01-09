import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFirebaseState } from './hooks/useFirebaseState';
import { parseBulkImportText } from './utils/helpers';
import { enrichSongWithGemini, enrichBatchSongs } from './services/geminiService';
import {
  addUser,
  updateUser,
  addGroup,
  updateGroup,
  addSong,
  updateSong,
  deleteSong,
  addParticipation,
  deleteParticipation,
  addInstrumentSlot,
  deleteInstrumentSlot,
  addMultipleSongs,
  addMultipleParticipations,
  addArtist,
  updateArtist,
  deleteArtist,
  uploadAudioFile,
  deleteAudioFile
} from './firebase/firebaseHelpers';
import { cleanOrphanedLocalAudioRefs } from './utils/audioCleanup';
import Header from './components/Header';
import RepertoireView from './components/RepertoireView';
import MyGroupsView from './components/MyGroupsView';
import SetlistsView from './components/SetlistsView';
import ArtistsView from './components/ArtistsView';
import ArtistPositioningView from './components/ArtistPositioningView';
import SlotManager from './components/SlotManager';
import UserSettings from './components/UserSettings';
import { Music, LogOut } from 'lucide-react';

export default function App() {
  const {
    currentUser,
    setCurrentUser,
    view,
    setView,
    users,
    setUsers,
    groups,
    setGroups,
    songs,
    setSongs,
    participations,
    setParticipations,
    instrumentSlots,
    setInstrumentSlots,
    setlists,
    setSetlists,
    setlistSongs,
    setSetlistSongs,
    artists,
    setArtists,
    songPdfs,
    setSongPdfs,
    searchTerm,
    setSearchTerm,
    showSlotManager,
    setShowSlotManager,
    isFirebaseReady
  } = useFirebaseState();

  const [newGroup, setNewGroup] = useState({ name: '', style: '' });
  const [activeTab, setActiveTab] = useState('repertoire'); // repertoire, mygroups, allgroups
  const [enrichingSongs, setEnrichingSongs] = useState(new Set()); // IDs des titres en cours d'enrichissement
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState(new Set()); // IDs des titres sélectionnés pour enrichissement

  // Auto-connexion avec utilisateur par défaut (pas d'authentification)
  useEffect(() => {
    if (!isFirebaseReady) return;
    if (currentUser) return; // Déjà connecté

    const DEFAULT_USER_ID = 'default_user';
    const DEFAULT_USER = {
      id: DEFAULT_USER_ID,
      username: 'Utilisateur',
      password: '',
      instrument: 'guitar',
      groupIds: []
    };

    // Chercher ou créer l'utilisateur par défaut
    const initDefaultUser = async () => {
      const defaultUser = users.find(u => u.id === DEFAULT_USER_ID);

      if (!defaultUser && users.length >= 0) {
        // Créer l'utilisateur par défaut s'il n'existe pas
        console.log('🔧 Création utilisateur par défaut...');
        try {
          await addUser(DEFAULT_USER);
          // Ne pas set currentUser ici, Firebase va trigger un update
        } catch (error) {
          console.error('Erreur création utilisateur:', error);
          // Mode local - set directement
          setCurrentUser(DEFAULT_USER);
          setView('repertoire');
        }
      } else if (defaultUser) {
        // Utilisateur existe, connexion
        setCurrentUser(defaultUser);
        setView('repertoire');
        localStorage.setItem('currentUserId', DEFAULT_USER_ID);
        console.log('✅ Connexion automatique');
      }
    };

    initDefaultUser();
  }, [users, isFirebaseReady, currentUser]); // Se déclenche quand les utilisateurs sont chargés depuis Firebase

  // Nettoyer les références audio locales orphelines (local://) au démarrage
  useEffect(() => {
    if (!isFirebaseReady || songs.length === 0) return;

    // Nettoyer une seule fois au démarrage
    let hasRun = false;

    const cleanup = async () => {
      if (hasRun) return;
      hasRun = true;

      try {
        const cleaned = await cleanOrphanedLocalAudioRefs();
        if (cleaned > 0) {
          console.log(`🧹 ${cleaned} référence(s) audio locale(s) orpheline(s) supprimée(s)`);
        }
      } catch (error) {
        console.error('Erreur nettoyage audio:', error);
      }
    };

    // Attendre 2 secondes après le chargement pour ne pas bloquer l'interface
    const timer = setTimeout(cleanup, 2000);
    return () => clearTimeout(timer);
  }, [isFirebaseReady, songs.length]); // Se déclenche une fois que les chansons sont chargées

  // Trouver le slot correspondant à un instrument
  const findUserSlotForInstrument = (instrumentName) => {
    if (!instrumentName) return null;

    const lowerInstrument = instrumentName.toLowerCase();

    // Vérifier d'abord si c'est directement un ID de slot existant
    const directSlot = instrumentSlots.find(slot => slot.id.toLowerCase() === lowerInstrument);
    if (directSlot) {
      return directSlot.id;
    }

    // Mapping de rétrocompatibilité pour les anciens noms d'instruments
    const mapping = {
      'batterie': 'drums',
      'chant': 'vocals',
      'chanteur': 'vocals',
      'chanteuse': 'vocals',
      'vocal': 'vocals',
      'basse': 'bass',
      'guitare': 'guitar',
      'choeur': 'choir',
      'chœur': 'choir',
      'clavier': 'piano'
    };

    return mapping[lowerInstrument] || null;
  };

  // Connexion
  const handleLogin = (loginForm) => {
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setView('repertoire');
      // Sauvegarder la session dans localStorage
      localStorage.setItem('currentUserId', user.id);
      toast.success(`Bienvenue ${user.username} !`);
    } else {
      alert('Pseudo ou mot de passe incorrect');
    }
  };

  // Inscription
  const handleSignup = async (signupForm) => {
    if (users.find(u => u.username === signupForm.username)) {
      alert('Ce pseudo existe déjà');
      return;
    }
    const newUser = {
      id: Date.now().toString(),
      username: signupForm.username,
      password: signupForm.password,
      instrument: signupForm.instrument,
      groupIds: []
    };

    try {
      await addUser(newUser);
      setCurrentUser(newUser);
      setView('repertoire');
      // Sauvegarder la session dans localStorage
      localStorage.setItem('currentUserId', newUser.id);
      toast.success(`Compte créé avec succès ! Bienvenue ${newUser.username}`);
    } catch (error) {
      // En cas d'erreur Firebase, utiliser le mode local
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setView('repertoire');
      // Sauvegarder la session dans localStorage même en mode local
      localStorage.setItem('currentUserId', newUser.id);
      console.log('✅ Session sauvegardée pour:', newUser.username);
    }
  };

  // Créer un groupe
  const handleCreateGroup = () => {
    setView('create-group');
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    const group = {
      id: Date.now().toString(),
      name: newGroup.name,
      style: newGroup.style,
      creatorId: currentUser.id,
      memberIds: [currentUser.id]
    };

    try {
      await addGroup(group);

      const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, group.id] };
      await updateUser(currentUser.id, { groupIds: updatedUser.groupIds });
      setCurrentUser(updatedUser);

      setNewGroup({ name: '', style: '' });
      setView('repertoire');
      toast.success('Groupe créé avec succès !');
    } catch (error) {
      // Fallback mode local
      setGroups([...groups, group]);
      const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, group.id] };
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setNewGroup({ name: '', style: '' });
      setView('repertoire');
      toast.success('Groupe créé avec succès !');
    }
  };

  // Rejoindre un groupe
  const handleJoinGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group.memberIds.includes(currentUser.id)) {
      alert('Vous êtes déjà membre de ce groupe');
      return;
    }

    try {
      // Mettre à jour le groupe
      await updateGroup(groupId, { memberIds: [...group.memberIds, currentUser.id] });

      // Mettre à jour l'utilisateur
      const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, groupId] };
      await updateUser(currentUser.id, { groupIds: updatedUser.groupIds });
      setCurrentUser(updatedUser);

      // Auto-inscrire l'utilisateur sur tous les titres du groupe
      const groupSongs = songs.filter(s => s.ownerGroupId === groupId);
      const userSlot = findUserSlotForInstrument(currentUser.instrument);

      if (userSlot && groupSongs.length > 0) {
        const newParticipations = groupSongs.map((song, index) => ({
          id: Date.now().toString() + '_join_' + index,
          songId: song.id,
          userId: currentUser.id,
          slotId: userSlot,
          comment: ''
        }));
        await addMultipleParticipations(newParticipations);
      }

      toast.success(`Groupe rejoint ! Inscrit(e) sur ${groupSongs.length} titre(s)`);
    } catch (error) {
      // Fallback mode local
      setGroups(groups.map(g =>
        g.id === groupId ? { ...g, memberIds: [...g.memberIds, currentUser.id] } : g
      ));
      const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, groupId] };
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      const groupSongs = songs.filter(s => s.ownerGroupId === groupId);
      const userSlot = findUserSlotForInstrument(currentUser.instrument);
      if (userSlot && groupSongs.length > 0) {
        const newParticipations = groupSongs.map((song, index) => ({
          id: Date.now().toString() + '_join_' + index,
          songId: song.id,
          userId: currentUser.id,
          slotId: userSlot,
          comment: ''
        }));
        setParticipations([...participations, ...newParticipations]);
      }
      toast.success(`Groupe rejoint ! Inscrit(e) sur ${groupSongs.length} titre(s)`);
    }
  };

  // Ajouter un titre (SANS enrichissement automatique)
  const handleAddSong = async (newSongData, groupId) => {
    const songId = Date.now().toString();

    let audioUrl = null;

    // Store audio file locally if provided
    if (newSongData.audioFile) {
      try {
        toast.info('Sauvegarde du fichier audio en local...');
        audioUrl = await uploadAudioFile(newSongData.audioFile, songId);
        toast.success('Fichier audio sauvegardé localement !');
      } catch (error) {
        console.error('Erreur stockage audio local:', error);
        toast.error('Erreur lors de la sauvegarde du fichier audio');
        return; // Stop if audio storage fails
      }
    }

    const song = {
      id: songId,
      title: newSongData.title,
      artist: newSongData.artist || 'Artiste inconnu',
      youtubeLink: newSongData.youtubeLink,
      audioUrl: audioUrl,
      ownerGroupId: groupId, // null si personnel
      addedBy: currentUser.id,
      // Pas d'enrichissement automatique - sera fait manuellement
      duration: null,
      chords: null,
      lyrics: null,
      genre: null,
      enriched: false
    };

    try {
      await addSong(song);
      toast.success('Titre ajouté avec succès !');
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, song]);
      toast.success('Titre ajouté avec succès !');
    }
  };

  // Import en masse (SANS enrichissement automatique)
  const handleBulkImport = async (text, groupId) => {
    const parsedSongs = parseBulkImportText(text);
    if (parsedSongs.length === 0) {
      alert('Aucun titre valide trouvé');
      return;
    }

    const newSongs = [];

    // Créer les titres SANS enrichissement (sera fait manuellement après)
    parsedSongs.forEach((parsedSong, index) => {
      const songId = Date.now().toString() + '_' + index;
      const song = {
        id: songId,
        title: parsedSong.title,
        artist: parsedSong.artist || 'Artiste inconnu',
        youtubeLink: '',
        ownerGroupId: groupId,
        addedBy: currentUser.id,
        // Pas d'enrichissement automatique
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        enriched: false
      };
      newSongs.push(song);
    });

    try {
      await addMultipleSongs(newSongs);
      toast.success(`${parsedSongs.length} titre(s) importé(s) avec succès ! Utilisez "Tout sélectionner" puis "Enrichir la sélection" pour enrichir.`);
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, ...newSongs]);
      toast.success(`${parsedSongs.length} titre(s) importé(s) avec succès ! Utilisez "Tout sélectionner" puis "Enrichir la sélection" pour enrichir.`);
    }
  };

  // Import JSON avec données enrichies - ENRICHIT LES TITRES EXISTANTS
  const handleJsonImport = async (jsonSongs, groupId) => {
    if (!jsonSongs || jsonSongs.length === 0) {
      toast.error('Aucun titre trouvé dans le JSON');
      return;
    }

    // Fonction pour normaliser les strings pour le matching
    const normalize = (str) => {
      if (!str) return '';
      return str.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    let matchedCount = 0;
    let notFoundCount = 0;
    const notFoundTitles = [];

    // Pour chaque titre du JSON, chercher le titre existant correspondant
    for (const jsonSong of jsonSongs) {
      const jsonTitle = normalize(jsonSong.title);
      const jsonArtist = normalize(jsonSong.artist || '');

      // Filtrer les titres du groupe
      const groupSongs = groupId
        ? songs.filter(s => s.ownerGroupId === groupId)
        : songs;

      // Chercher le titre correspondant
      const existingSong = groupSongs.find(song => {
        const songTitle = normalize(song.title);
        const songArtist = normalize(song.artist);

        // Match si titre identique ET (artiste identique OU l'un des deux est vide/inconnu)
        return songTitle === jsonTitle && (
          songArtist === jsonArtist ||
          !jsonArtist ||
          songArtist === 'artiste inconnu' ||
          jsonArtist === 'artiste inconnu'
        );
      });

      if (existingSong) {
        // ENRICHIR le titre existant avec les données du JSON
        const updates = {
          artist: jsonSong.artist || existingSong.artist,
          duration: jsonSong.duration || existingSong.duration,
          chords: jsonSong.chords || existingSong.chords,
          lyrics: jsonSong.lyrics || existingSong.lyrics,
          genre: jsonSong.genre || existingSong.genre,
          youtubeLink: jsonSong.youtubeLink || existingSong.youtubeLink,
          enriched: !!(
            jsonSong.chords || existingSong.chords ||
            jsonSong.lyrics || existingSong.lyrics ||
            jsonSong.duration || existingSong.duration ||
            jsonSong.genre || existingSong.genre
          )
        };

        try {
          await updateSong(existingSong.id, updates);
          matchedCount++;
        } catch (error) {
          // Fallback local
          const updatedSongs = songs.map(s =>
            s.id === existingSong.id ? { ...s, ...updates } : s
          );
          setSongs(updatedSongs);
          matchedCount++;
        }
      } else {
        // Titre non trouvé
        notFoundCount++;
        notFoundTitles.push(`"${jsonSong.title}" - ${jsonSong.artist || '?'}`);
      }
    }

    // Notification des résultats
    if (matchedCount > 0) {
      toast.success(`✅ ${matchedCount} titre(s) enrichi(s) avec succès !`);
    }

    if (notFoundCount > 0) {
      toast.warning(
        `⚠️ ${notFoundCount} titre(s) non trouvé(s) dans le groupe.\n` +
        `Titres manquants: ${notFoundTitles.slice(0, 3).join(', ')}` +
        (notFoundTitles.length > 3 ? '...' : ''),
        { autoClose: 8000 }
      );
    }

    if (matchedCount === 0 && notFoundCount > 0) {
      toast.error('❌ Aucun titre correspondant trouvé. Vérifiez les titres/artistes.');
    }
  };

  // Re-enrichir un titre existant
  const handleReenrichSong = async (songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    // Marquer le titre comme en cours d'enrichissement
    setEnrichingSongs(prev => new Set([...prev, songId]));

    try {
      // Enrichir le titre avec Gemini
      const enrichedData = await enrichSongWithGemini(song.title, song.artist);

      // Mettre à jour le titre avec les nouvelles données UNIQUEMENT si les champs n'existent pas déjà
      const updates = {
        artist: enrichedData.artist || song.artist || 'Artiste inconnu',
        duration: song.duration || enrichedData.duration,
        chords: song.chords || enrichedData.chords,
        lyrics: song.lyrics || enrichedData.lyrics,
        genre: song.genre || enrichedData.genre,
        youtubeLink: song.youtubeLink || enrichedData.youtubeLink,
        enriched: enrichedData.enriched || song.enriched
      };

      try {
        await updateSong(songId, updates);
        if (enrichedData.enriched) {
          toast.success(`"${song.title}" enrichi avec succès !`);
        } else {
          toast.error(`Impossible d'enrichir "${song.title}"`);
        }
      } catch (error) {
        // Fallback mode local
        setSongs(songs.map(s => s.id === songId ? { ...s, ...updates } : s));
        if (enrichedData.enriched) {
          toast.success(`"${song.title}" enrichi avec succès !`);
        } else {
          toast.error(`Impossible d'enrichir "${song.title}"`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du re-enrichissement:', error);
      toast.error(`Erreur lors de l'enrichissement de "${song.title}"`);
    } finally {
      // Retirer le titre de la liste des enrichissements en cours
      setEnrichingSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  };

  // Sauvegarder les modifications d'un titre
  const handleSaveSong = async (songId, editedData) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    try {
      // Handle audio file operations
      let audioUrl = song.audioUrl; // Keep existing URL by default

      // Remove audio if requested
      if (editedData.removeAudio && song.audioUrl) {
        try {
          await deleteAudioFile(songId, song.audioUrl);
          audioUrl = null;
          toast.success('Fichier audio supprimé');
        } catch (error) {
          console.error('Erreur lors de la suppression du fichier audio:', error);
          toast.error('Erreur lors de la suppression du fichier audio');
          // Continue anyway - don't block the save
        }
      }

      // Upload new audio file if provided
      if (editedData.audioFile) {
        try {
          // If replacing an existing file, delete the old one first
          if (song.audioUrl && !editedData.removeAudio) {
            await deleteAudioFile(songId, song.audioUrl);
          }

          toast.info('Sauvegarde du fichier audio en local...');
          audioUrl = await uploadAudioFile(editedData.audioFile, songId);
          toast.success('Fichier audio sauvegardé localement !');
        } catch (error) {
          console.error('Erreur stockage audio local:', error);
          toast.error('Erreur lors de la sauvegarde du fichier audio');
          return; // Stop if audio storage fails
        }
      }

      // Mettre à jour le titre avec les nouvelles données
      const updates = {
        title: editedData.title,
        artist: editedData.artist,
        duration: editedData.duration,
        chords: editedData.chords,
        lyrics: editedData.lyrics,
        genre: editedData.genre,
        youtubeLink: editedData.youtubeLink,
        audioUrl: audioUrl,
        // Marquer comme enrichi si au moins un champ enrichi est rempli
        enriched: Boolean(editedData.chords || editedData.lyrics || editedData.genre || editedData.duration)
      };

      try {
        await updateSong(songId, updates);
        toast.success(`"${editedData.title}" sauvegardé avec succès !`);
      } catch (error) {
        // Fallback mode local
        setSongs(songs.map(s => s.id === songId ? { ...s, ...updates } : s));
        toast.success(`"${editedData.title}" sauvegardé avec succès !`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(`Erreur lors de la sauvegarde de "${editedData.title}"`);
    }
  };

  // Supprimer un titre (si membre du groupe propriétaire)
  const handleDeleteSong = async (songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    // Vérifier les permissions
    if (song.ownerGroupId) {
      const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
      if (!ownerGroup || !ownerGroup.memberIds.includes(currentUser.id)) {
        alert("Vous devez être membre du groupe pour supprimer ce titre.");
        return;
      }
    } else if (song.addedBy && song.addedBy !== currentUser.id) {
      // Pour les titres personnels, seul le créateur peut supprimer (si addedBy est défini)
      alert("Seul le créateur peut supprimer ce titre.");
      return;
    }
    // Si addedBy est undefined/null, on autorise la suppression (anciens titres)

    // Confirmation
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${song.title}" ?`)) {
      return;
    }

    try {
      // Delete audio file first if it exists
      if (song.audioUrl) {
        await deleteAudioFile(songId, song.audioUrl);
      }

      await deleteSong(songId);
      // Supprimer aussi les participations liées
      const songParticipations = participations.filter(p => p.songId === songId);
      for (const p of songParticipations) {
        await deleteParticipation(p.id);
      }
      toast.success(`"${song.title}" supprimé`);
    } catch (error) {
      // Fallback mode local
      setSongs(songs.filter(s => s.id !== songId));
      setParticipations(participations.filter(p => p.songId !== songId));
      toast.success(`"${song.title}" supprimé`);
    }
  };

  // Toggle sélection d'un titre
  const handleToggleSongSelection = (songId) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  // Sélectionner tous les titres non enrichis
  const handleSelectAllUnenriched = () => {
    const unenrichedSongIds = songs.filter(s => !s.enriched).map(s => s.id);
    setSelectedSongs(new Set(unenrichedSongIds));
  };

  // Désélectionner tous
  const handleDeselectAll = () => {
    setSelectedSongs(new Set());
  };

  // Supprimer les titres sélectionnés en masse
  const handleDeleteSelected = async () => {
    if (selectedSongs.size === 0) {
      console.log('⚠️ Aucun titre sélectionné');
      return;
    }

    const songsToDelete = songs.filter(s => selectedSongs.has(s.id));

    // Vérifier les permissions pour chaque titre
    const deletableSongs = songsToDelete.filter(song => {
      if (song.ownerGroupId) {
        const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
        return ownerGroup && ownerGroup.memberIds.includes(currentUser.id);
      }
      // Pour les titres personnels: vérifier addedBy ou accepter si addedBy est manquant (anciens titres)
      return !song.addedBy || song.addedBy === currentUser.id;
    });

    if (deletableSongs.length === 0) {
      alert('Aucun titre sélectionné ne peut être supprimé (permissions insuffisantes).');
      return;
    }

    // Confirmation
    const confirmMessage = deletableSongs.length === songsToDelete.length
      ? `Supprimer ${deletableSongs.length} titre(s) sélectionné(s) ?`
      : `Vous pouvez supprimer ${deletableSongs.length} titre(s) sur ${songsToDelete.length} sélectionné(s). Continuer ?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Supprimer tous les titres autorisés
    let successCount = 0;
    for (const song of deletableSongs) {
      try {
        await deleteSong(song.id);
        // Supprimer aussi les participations liées
        const songParticipations = participations.filter(p => p.songId === song.id);
        for (const p of songParticipations) {
          await deleteParticipation(p.id);
        }
        successCount++;
      } catch (error) {
        // Fallback mode local
        setSongs(prevSongs => prevSongs.filter(s => s.id !== song.id));
        setParticipations(prevParts => prevParts.filter(p => p.songId !== song.id));
        successCount++;
      }
    }

    toast.success(`${successCount} titre(s) supprimé(s) avec succès`);
    setSelectedSongs(new Set());
  };

  // Enrichir les titres sélectionnés en masse
  const handleEnrichSelected = async () => {
    if (selectedSongs.size === 0) {
      toast.warning('Aucun titre sélectionné');
      return;
    }

    const songsToEnrich = songs.filter(s => selectedSongs.has(s.id));

    // Marquer tous comme en cours d'enrichissement
    setEnrichingSongs(prev => new Set([...prev, ...selectedSongs]));
    toast.info(`Enrichissement de ${selectedSongs.size} titre(s) en cours...`);

    try {
      // Enrichir avec Gemini
      const enrichedResults = await enrichBatchSongs(songsToEnrich);

      // Mettre à jour chaque titre avec les données enrichies
      for (const enrichedData of enrichedResults) {
        const song = songs.find(s => s.id === enrichedData.id);
        if (!song) continue;

        // Ne mettre à jour que les champs qui n'existent pas déjà
        const updates = {
          artist: song.artist || enrichedData.artist,
          duration: song.duration || enrichedData.duration,
          chords: song.chords || enrichedData.chords,
          lyrics: song.lyrics || enrichedData.lyrics,
          genre: song.genre || enrichedData.genre,
          youtubeLink: song.youtubeLink || enrichedData.youtubeLink,
          enriched: enrichedData.enriched || song.enriched
        };

        try {
          await updateSong(enrichedData.id, updates);
        } catch (error) {
          // Fallback mode local
          setSongs(prevSongs => prevSongs.map(s =>
            s.id === enrichedData.id ? { ...s, ...updates } : s
          ));
        }
      }

      const enrichedCount = enrichedResults.filter(r => r.enriched).length;
      toast.success(`${enrichedCount}/${selectedSongs.size} titre(s) enrichi(s) avec succès !`);

      // Désélectionner après enrichissement
      setSelectedSongs(new Set());
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement en masse:', error);
      toast.error('Erreur lors de l\'enrichissement. Veuillez réessayer.');
    } finally {
      // Retirer tous de la liste des enrichissements en cours
      setEnrichingSongs(new Set());
    }
  };

  // Rejoindre un emplacement
  const handleJoinSlot = async (songId, slotId, artistId = null) => {
    const participation = {
      id: Date.now().toString() + '_' + Math.random(),
      songId: songId,
      userId: artistId ? null : currentUser.id,
      artistId: artistId || null,
      slotId: slotId,
      comment: ''
    };

    try {
      await addParticipation(participation);
    } catch (error) {
      // Fallback mode local
      setParticipations([...participations, participation]);
    }
  };

  // Quitter un emplacement
  const handleLeaveSlot = async (songId, slotId, artistId = null) => {
    // Si artistId est fourni, retirer cet artiste spécifique
    // Sinon, comportement par défaut: retirer le premier participant trouvé
    const participationToDelete = participations.find(p =>
      p.songId === songId && p.slotId === slotId &&
      (artistId ? p.artistId === artistId : (p.artistId || p.userId === currentUser.id))
    );

    if (participationToDelete) {
      try {
        await deleteParticipation(participationToDelete.id);
      } catch (error) {
        // Fallback mode local
        setParticipations(participations.filter(p => p.id !== participationToDelete.id));
      }
    }
  };

  // Ajouter un emplacement personnalisé
  const handleAddSlot = async (newSlotData) => {
    const slot = {
      id: 'custom_' + Date.now(),
      name: newSlotData.name,
      icon: newSlotData.icon || '🎼'
    };

    try {
      await addInstrumentSlot(slot);
      toast.success('Emplacement ajouté !');
    } catch (error) {
      // Fallback mode local
      setInstrumentSlots([...instrumentSlots, slot]);
      toast.success('Emplacement ajouté !');
    }
  };

  // Supprimer un emplacement
  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Supprimer cet emplacement ? Les participations associées seront perdues.')) {
      try {
        await deleteInstrumentSlot(slotId);
        // Supprimer les participations associées
        const participationsToDelete = participations.filter(p => p.slotId === slotId);
        for (const part of participationsToDelete) {
          await deleteParticipation(part.id);
        }
      } catch (error) {
        // Fallback mode local
        setInstrumentSlots(instrumentSlots.filter(s => s.id !== slotId));
        setParticipations(participations.filter(p => p.slotId !== slotId));
      }
    }
  };

  // Mettre à jour l'instrument de l'utilisateur
  const handleUpdateUserInstrument = async (newInstrumentId) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      instrument: newInstrumentId
    };

    try {
      await updateUser(currentUser.id, { instrument: newInstrumentId });
      setCurrentUser(updatedUser);
      toast.success('Instrument mis à jour avec succès !');
    } catch (error) {
      // Mode local - mettre à jour directement le state
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      toast.success('Instrument mis à jour avec succès !');
    }
  };

  // ========== ARTISTES ==========

  // Ajouter un artiste
  const handleAddArtist = async (artistData) => {
    try {
      await addArtist(artistData);
      toast.success('Artiste ajouté avec succès !');
    } catch (error) {
      // Fallback mode local
      setArtists([...artists, artistData]);
      toast.success('Artiste ajouté avec succès !');
    }
  };

  // Mettre à jour un artiste
  const handleUpdateArtist = async (artistId, updates) => {
    try {
      await updateArtist(artistId, updates);
      toast.success('Artiste mis à jour !');
    } catch (error) {
      // Fallback mode local
      setArtists(artists.map(a => a.id === artistId ? { ...a, ...updates } : a));
      toast.success('Artiste mis à jour !');
    }
  };

  // Supprimer un artiste
  const handleDeleteArtist = async (artistId) => {
    try {
      await deleteArtist(artistId);
      // Supprimer les participations associées
      const participationsToDelete = participations.filter(p => p.artistId === artistId);
      for (const part of participationsToDelete) {
        await deleteParticipation(part.id);
      }
      toast.success('Artiste supprimé !');
    } catch (error) {
      // Fallback mode local
      setArtists(artists.filter(a => a.id !== artistId));
      setParticipations(participations.filter(p => p.artistId !== artistId));
      toast.success('Artiste supprimé !');
    }
  };

  // Déconnexion (désactivée - auto-reconnexion automatique)
  const handleLogout = () => {
    // Rechargement de la page pour réinitialiser l'état
    window.location.reload();
  };

  // Affichage du loader pendant le chargement initial
  if (!currentUser || !isFirebaseReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold">Music4Chalemine</h1>
          <p className="text-purple-200 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  // Page de création de groupe
  if (view === 'create-group') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-purple-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Music className="w-8 h-8 mr-2" />
              <h1 className="text-2xl font-bold">Music4Chalemine</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <button onClick={() => setView('repertoire')} className="mb-6 text-purple-600 hover:underline">
            ← Retour au répertoire
          </button>
          
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Créer un nouveau groupe</h2>
            <form onSubmit={handleSubmitGroup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du groupe</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Style musical</label>
                <input
                  type="text"
                  value={newGroup.style}
                  onChange={(e) => setNewGroup({...newGroup, style: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Rock, Jazz, Blues, etc."
                  required
                />
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium">
                Créer le groupe
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Page principale - Répertoire avec onglets
  const myGroups = groups.filter(g => g.memberIds.includes(currentUser.id));

  // Filtrer tous les titres par recherche
  const allFilteredSongs = songs.filter(song => {
    if (!searchTerm) return true;
    return song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           song.artist.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenSlotManager={() => setShowSlotManager(true)}
        onOpenUserSettings={() => setShowUserSettings(true)}
        instrumentSlots={instrumentSlots}
      />

      {/* Onglets */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('repertoire')}
              className={`px-3 py-2 sm:px-4 md:px-6 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'repertoire'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Répertoire Global
            </button>
            <button
              onClick={() => setActiveTab('mygroups')}
              className={`px-3 py-2 sm:px-4 md:px-6 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'mygroups'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎸 Mes Groupes ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('setlists')}
              className={`px-3 py-2 sm:px-4 md:px-6 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'setlists'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎵 Setlists ({setlists.length})
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`px-3 py-2 sm:px-4 md:px-6 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'artists'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Artistes ({artists.length})
            </button>
            <button
              onClick={() => setActiveTab('positioning')}
              className={`px-3 py-2 sm:px-4 md:px-6 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'positioning'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Positionnement
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="flex-1 container mx-auto px-4 py-6 overflow-hidden">
        <div className="h-full">
          {activeTab === 'repertoire' && (
            <RepertoireView
              songs={allFilteredSongs}
              participations={participations}
              instrumentSlots={instrumentSlots}
              users={users}
              currentUser={currentUser}
              groups={groups}
              artists={artists}
              songPdfs={songPdfs}
              onJoinSlot={handleJoinSlot}
              onLeaveSlot={handleLeaveSlot}
              onReenrichSong={handleReenrichSong}
              onDeleteSong={handleDeleteSong}
              onSaveSong={handleSaveSong}
              enrichingSongs={enrichingSongs}
              selectedSongs={selectedSongs}
              onToggleSongSelection={handleToggleSongSelection}
              onEnrichSelected={handleEnrichSelected}
              onDeleteSelected={handleDeleteSelected}
              onSelectAllUnenriched={handleSelectAllUnenriched}
              onDeselectAll={handleDeselectAll}
              setlists={setlists}
              setlistSongs={setlistSongs}
            />
          )}

          {activeTab === 'mygroups' && (
            <MyGroupsView
              groups={myGroups}
              songs={songs}
              participations={participations}
              instrumentSlots={instrumentSlots}
              users={users}
              currentUser={currentUser}
              artists={artists}
              onJoinSlot={handleJoinSlot}
              onLeaveSlot={handleLeaveSlot}
              onAddSong={handleAddSong}
              onBulkImport={handleBulkImport}
              onJsonImport={handleJsonImport}
              onCreateGroup={handleCreateGroup}
              onReenrichSong={handleReenrichSong}
              onDeleteSong={handleDeleteSong}
              onSaveSong={handleSaveSong}
              enrichingSongs={enrichingSongs}
              selectedSongs={selectedSongs}
              onToggleSongSelection={handleToggleSongSelection}
              onEnrichSelected={handleEnrichSelected}
              onDeleteSelected={handleDeleteSelected}
              onSelectAllUnenriched={handleSelectAllUnenriched}
              onDeselectAll={handleDeselectAll}
              setlists={setlists}
              setlistSongs={setlistSongs}
            />
          )}

          {activeTab === 'setlists' && (
            <SetlistsView
              setlists={setlists}
              setlistSongs={setlistSongs}
              songs={songs}
              participations={participations}
              instrumentSlots={instrumentSlots}
              users={users}
              artists={artists}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'artists' && (
            <ArtistsView
              artists={artists}
              instrumentSlots={instrumentSlots}
              onAddArtist={handleAddArtist}
              onUpdateArtist={handleUpdateArtist}
              onDeleteArtist={handleDeleteArtist}
            />
          )}

          {activeTab === 'positioning' && (
            <ArtistPositioningView
              artists={artists}
              participations={participations}
              songs={songs}
              instrumentSlots={instrumentSlots}
            />
          )}
        </div>
      </div>

      {/* Modal de gestion des emplacements */}
      {showSlotManager && (
        <SlotManager
          instrumentSlots={instrumentSlots}
          onAddSlot={handleAddSlot}
          onDeleteSlot={handleDeleteSlot}
          onClose={() => setShowSlotManager(false)}
        />
      )}

      {/* Modal des paramètres utilisateur */}
      {showUserSettings && (
        <UserSettings
          currentUser={currentUser}
          instrumentSlots={instrumentSlots}
          onUpdateInstrument={handleUpdateUserInstrument}
          onClose={() => setShowUserSettings(false)}
        />
      )}

      {/* Toast Container pour les notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
