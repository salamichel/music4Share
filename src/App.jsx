import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFirebaseState } from './hooks/useFirebaseState';
import { parseBulkImportText } from './utils/helpers';
import { enrichSongWithGemini, enrichBatchSongs } from './services/geminiService';
import { enrichSongMultiAPI, enrichBatchMultiAPI } from './services/multiEnrichmentService';
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
  addMultipleParticipations
} from './firebase/firebaseHelpers';
import Login from './components/Login';
import Header from './components/Header';
import RepertoireView from './components/RepertoireView';
import MyGroupsView from './components/MyGroupsView';
import AllGroupsView from './components/AllGroupsView';
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

  // Restaurer la session utilisateur au chargement
  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId && users.length > 0) {
      const user = users.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
        setView('repertoire');
        console.log('✅ Session restaurée pour:', user.username);
      } else {
        // Utilisateur n'existe plus, nettoyer localStorage
        localStorage.removeItem('currentUserId');
      }
    }
  }, [users]); // Se déclenche quand les utilisateurs sont chargés depuis Firebase

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
    const song = {
      id: Date.now().toString(),
      title: newSongData.title,
      artist: newSongData.artist || 'Artiste inconnu',
      youtubeLink: newSongData.youtubeLink,
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

      // Si ajouté dans un groupe, inscrire automatiquement le créateur sur son instrument
      if (groupId) {
        const userSlotId = findUserSlotForInstrument(currentUser.instrument);
        console.log('🎸 Auto-inscription:', { instrument: currentUser.instrument, slotId: userSlotId });

        if (userSlotId) {
          const participation = {
            id: Date.now().toString() + '_auto',
            songId: song.id,
            userId: currentUser.id,
            slotId: userSlotId,
            comment: ''
          };
          await addParticipation(participation);
        }
      }

      toast.success('Titre ajouté avec succès !');
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, song]);
      if (groupId) {
        const userSlotId = findUserSlotForInstrument(currentUser.instrument);
        if (userSlotId) {
          const participation = {
            id: Date.now().toString() + '_auto',
            songId: song.id,
            userId: currentUser.id,
            slotId: userSlotId,
            comment: ''
          };
          setParticipations([...participations, participation]);
        }
      }
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
    const newParticipations = [];
    const userSlotId = findUserSlotForInstrument(currentUser.instrument);

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

      // Si titre de groupe ET slot trouvé, auto-inscrire l'utilisateur
      if (groupId && userSlotId) {
        const participation = {
          id: songId + '_auto',
          songId: songId,
          userId: currentUser.id,
          slotId: userSlotId,
          comment: ''
        };
        newParticipations.push(participation);
      }
    });

    try {
      await addMultipleSongs(newSongs);
      if (newParticipations.length > 0) {
        await addMultipleParticipations(newParticipations);
      }

      toast.success(`${parsedSongs.length} titre(s) importé(s) avec succès ! Utilisez "Tout sélectionner" puis "Enrichir la sélection" pour enrichir.`);
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, ...newSongs]);
      setParticipations([...participations, ...newParticipations]);
      toast.success(`${parsedSongs.length} titre(s) importé(s) avec succès ! Utilisez "Tout sélectionner" puis "Enrichir la sélection" pour enrichir.`);
    }
  };

  // Re-enrichir un titre existant
  const handleReenrichSong = async (songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    // Marquer le titre comme en cours d'enrichissement
    setEnrichingSongs(prev => new Set([...prev, songId]));

    try {
      // Enrichir le titre avec le service multi-API (MusicBrainz + Lyrics.ovh + Gemini fallback)
      const enrichedData = await enrichSongMultiAPI(song.title, song.artist);

      // Mettre à jour le titre avec les nouvelles données (inclut l'artiste si trouvé par Gemini)
      const updates = {
        artist: enrichedData.artist || song.artist || 'Artiste inconnu',
        duration: enrichedData.duration,
        chords: enrichedData.chords,
        lyrics: enrichedData.lyrics,
        genre: enrichedData.genre,
        enriched: enrichedData.enriched
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
    } else if (song.addedBy !== currentUser.id) {
      // Pour les titres personnels, seul le créateur peut supprimer
      alert("Seul le créateur peut supprimer ce titre.");
      return;
    }

    // Confirmation
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${song.title}" ?`)) {
      return;
    }

    try {
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
      return song.addedBy === currentUser.id;
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
      // Enrichir avec le service multi-API (MusicBrainz + Lyrics.ovh, puis Gemini pour accords)
      const enrichedResults = await enrichBatchMultiAPI(songsToEnrich);

      // Mettre à jour chaque titre avec les données enrichies
      for (const enrichedData of enrichedResults) {
        const updates = {
          artist: enrichedData.artist,
          duration: enrichedData.duration,
          chords: enrichedData.chords,
          lyrics: enrichedData.lyrics,
          genre: enrichedData.genre,
          enriched: enrichedData.enriched
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
  const handleJoinSlot = async (songId, slotId) => {
    const participation = {
      id: Date.now().toString() + '_' + Math.random(),
      songId: songId,
      userId: currentUser.id,
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
  const handleLeaveSlot = async (songId, slotId) => {
    const participationToDelete = participations.find(p =>
      p.songId === songId && p.userId === currentUser.id && p.slotId === slotId
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

  // Déconnexion
  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    // Nettoyer la session sauvegardée
    localStorage.removeItem('currentUserId');
    console.log('✅ Session supprimée');
  };

  // Page de connexion
  if (view === 'login') {
    return <Login onLogin={handleLogin} onSignup={handleSignup} instrumentSlots={instrumentSlots} />;
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
  const otherGroups = groups.filter(g => !g.memberIds.includes(currentUser.id));
  
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
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('repertoire')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'repertoire'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Répertoire Global
            </button>
            <button
              onClick={() => setActiveTab('mygroups')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'mygroups'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎸 Mes Groupes ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('allgroups')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'allgroups'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Tous les Groupes ({otherGroups.length})
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
              onJoinSlot={handleJoinSlot}
              onLeaveSlot={handleLeaveSlot}
              onReenrichSong={handleReenrichSong}
              onDeleteSong={handleDeleteSong}
              enrichingSongs={enrichingSongs}
              selectedSongs={selectedSongs}
              onToggleSongSelection={handleToggleSongSelection}
              onEnrichSelected={handleEnrichSelected}
              onDeleteSelected={handleDeleteSelected}
              onSelectAllUnenriched={handleSelectAllUnenriched}
              onDeselectAll={handleDeselectAll}
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
              onJoinSlot={handleJoinSlot}
              onLeaveSlot={handleLeaveSlot}
              onAddSong={handleAddSong}
              onBulkImport={handleBulkImport}
              onCreateGroup={handleCreateGroup}
              onReenrichSong={handleReenrichSong}
              onDeleteSong={handleDeleteSong}
              enrichingSongs={enrichingSongs}
              selectedSongs={selectedSongs}
              onToggleSongSelection={handleToggleSongSelection}
              onEnrichSelected={handleEnrichSelected}
              onDeleteSelected={handleDeleteSelected}
              onSelectAllUnenriched={handleSelectAllUnenriched}
              onDeselectAll={handleDeselectAll}
            />
          )}

          {activeTab === 'allgroups' && (
            <AllGroupsView
              groups={otherGroups}
              songs={songs}
              onJoinGroup={handleJoinGroup}
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
