import React, { useState, useEffect } from 'react';
import { useFirebaseState } from './hooks/useFirebaseState';
import { parseBulkImportText } from './utils/helpers';
import { enrichSongWithGemini, enrichMultipleSongs } from './services/geminiService';
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
      console.log('✅ Session sauvegardée pour:', user.username);
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
      console.log('✅ Session sauvegardée pour:', newUser.username);
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
      alert('Groupe créé !');
    } catch (error) {
      // Fallback mode local
      setGroups([...groups, group]);
      const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, group.id] };
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setNewGroup({ name: '', style: '' });
      setView('repertoire');
      alert('Groupe créé !');
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

      alert(`Vous avez rejoint le groupe ! Vous êtes inscrit(e) sur ${groupSongs.length} titre(s).`);
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
      alert(`Vous avez rejoint le groupe ! Vous êtes inscrit(e) sur ${groupSongs.length} titre(s).`);
    }
  };

  // Ajouter un titre
  const handleAddSong = async (newSongData, groupId) => {
    // Enrichir le titre avec l'API Gemini
    const enrichedData = await enrichSongWithGemini(newSongData.title, newSongData.artist);

    const song = {
      id: Date.now().toString(),
      title: newSongData.title,
      artist: enrichedData.artist || newSongData.artist || 'Artiste inconnu', // Utiliser l'artiste enrichi si disponible
      youtubeLink: newSongData.youtubeLink,
      ownerGroupId: groupId, // null si personnel
      addedBy: currentUser.id,
      // Nouvelles données enrichies par Gemini
      duration: enrichedData.duration,
      chords: enrichedData.chords,
      lyrics: enrichedData.lyrics,
      genre: enrichedData.genre,
      enriched: enrichedData.enriched
    };

    try {
      await addSong(song);

      // Si ajouté dans un groupe, inscrire automatiquement le créateur
      if (groupId) {
        const participation = {
          id: Date.now().toString() + '_auto',
          songId: song.id,
          userId: currentUser.id,
          slotId: findUserSlotForInstrument(currentUser.instrument),
          comment: ''
        };
        await addParticipation(participation);
      }

      if (enrichedData.enriched) {
        alert('Titre ajouté et enrichi avec succès ! 🎵');
      } else {
        alert('Titre ajouté (enrichissement non disponible)');
      }
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, song]);
      if (groupId) {
        const participation = {
          id: Date.now().toString() + '_auto',
          songId: song.id,
          userId: currentUser.id,
          slotId: findUserSlotForInstrument(currentUser.instrument),
          comment: ''
        };
        setParticipations([...participations, participation]);
      }
      if (enrichedData.enriched) {
        alert('Titre ajouté et enrichi avec succès ! 🎵');
      } else {
        alert('Titre ajouté (enrichissement non disponible)');
      }
    }
  };

  // Import en masse
  const handleBulkImport = async (text, groupId) => {
    const parsedSongs = parseBulkImportText(text);
    if (parsedSongs.length === 0) {
      alert('Aucun titre valide trouvé');
      return;
    }

    // Afficher un message d'attente
    alert(`Import de ${parsedSongs.length} titre(s) en cours... Enrichissement avec l'API Gemini.`);

    const newSongs = [];
    const newParticipations = [];
    const userSlot = findUserSlotForInstrument(currentUser.instrument);

    // Enrichir tous les titres avec l'API Gemini
    const enrichedSongs = await enrichMultipleSongs(parsedSongs, 1000); // 1 seconde entre chaque requête

    enrichedSongs.forEach((enrichedData, index) => {
      const songId = Date.now().toString() + '_' + index;
      const song = {
        id: songId,
        title: enrichedData.title,
        artist: enrichedData.artist,
        youtubeLink: '',
        ownerGroupId: groupId,
        addedBy: currentUser.id,
        // Données enrichies par Gemini
        duration: enrichedData.duration,
        chords: enrichedData.chords,
        lyrics: enrichedData.lyrics,
        genre: enrichedData.genre,
        enriched: enrichedData.enriched
      };
      newSongs.push(song);

      // Si titre de groupe ET slot trouvé, auto-inscrire
      if (groupId && userSlot) {
        const participation = {
          id: songId + '_auto',
          songId: songId,
          userId: currentUser.id,
          slotId: userSlot,
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

      const enrichedCount = enrichedSongs.filter(s => s.enriched).length;
      alert(`${parsedSongs.length} titre(s) importé(s) avec succès ! (${enrichedCount} enrichis) 🎵`);
    } catch (error) {
      // Fallback mode local
      setSongs([...songs, ...newSongs]);
      setParticipations([...participations, ...newParticipations]);
      const enrichedCount = enrichedSongs.filter(s => s.enriched).length;
      alert(`${parsedSongs.length} titre(s) importé(s) avec succès ! (${enrichedCount} enrichis) 🎵`);
    }
  };

  // Re-enrichir un titre existant
  const handleReenrichSong = async (songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    // Marquer le titre comme en cours d'enrichissement
    setEnrichingSongs(prev => new Set([...prev, songId]));

    try {
      // Enrichir le titre avec l'API Gemini
      const enrichedData = await enrichSongWithGemini(song.title, song.artist);

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
          alert(`Titre "${song.title}" enrichi avec succès ! 🎵`);
        } else {
          alert(`Impossible d'enrichir le titre "${song.title}". Veuillez réessayer plus tard.`);
        }
      } catch (error) {
        // Fallback mode local
        setSongs(songs.map(s => s.id === songId ? { ...s, ...updates } : s));
        if (enrichedData.enriched) {
          alert(`Titre "${song.title}" enrichi avec succès ! 🎵`);
        } else {
          alert(`Impossible d'enrichir le titre "${song.title}". Veuillez réessayer plus tard.`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du re-enrichissement:', error);
      alert(`Erreur lors de l'enrichissement du titre "${song.title}".`);
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
      alert(`Titre "${song.title}" supprimé avec succès.`);
    } catch (error) {
      // Fallback mode local
      setSongs(songs.filter(s => s.id !== songId));
      setParticipations(participations.filter(p => p.songId !== songId));
      alert(`Titre "${song.title}" supprimé avec succès.`);
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
      alert('Emplacement ajouté !');
    } catch (error) {
      // Fallback mode local
      setInstrumentSlots([...instrumentSlots, slot]);
      alert('Emplacement ajouté !');
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
      alert('Instrument mis à jour avec succès ! 🎵');
    } catch (error) {
      // Mode local - mettre à jour directement le state
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      alert('Instrument mis à jour avec succès ! 🎵');
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
    </div>
  );
}
