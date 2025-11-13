import React, { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { parseBulkImportText } from './utils/helpers';
import { enrichSongWithGemini, enrichMultipleSongs } from './services/geminiService';
import Login from './components/Login';
import Header from './components/Header';
import RepertoireView from './components/RepertoireView';
import MyGroupsView from './components/MyGroupsView';
import AllGroupsView from './components/AllGroupsView';
import SlotManager from './components/SlotManager';
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
    setShowSlotManager
  } = useAppState();

  const [newGroup, setNewGroup] = useState({ name: '', style: '' });
  const [activeTab, setActiveTab] = useState('repertoire'); // repertoire, mygroups, allgroups
  const [enrichingSongs, setEnrichingSongs] = useState(new Set()); // IDs des titres en cours d'enrichissement

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
    } else {
      alert('Pseudo ou mot de passe incorrect');
    }
  };

  // Inscription
  const handleSignup = (signupForm) => {
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
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setView('repertoire');
  };

  // Créer un groupe
  const handleCreateGroup = () => {
    setView('create-group');
  };

  const handleSubmitGroup = (e) => {
    e.preventDefault();
    const group = {
      id: Date.now().toString(),
      name: newGroup.name,
      style: newGroup.style,
      creatorId: currentUser.id,
      memberIds: [currentUser.id]
    };
    setGroups([...groups, group]);
    
    const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, group.id] };
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    
    setNewGroup({ name: '', style: '' });
    setView('repertoire');
    alert('Groupe créé !');
  };

  // Rejoindre un groupe
  const handleJoinGroup = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group.memberIds.includes(currentUser.id)) {
      alert('Vous êtes déjà membre de ce groupe');
      return;
    }
    
    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, memberIds: [...g.memberIds, currentUser.id] } : g
    ));
    
    const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, groupId] };
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
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
      setParticipations([...participations, ...newParticipations]);
    }
    
    alert(`Vous avez rejoint le groupe ! Vous êtes inscrit(e) sur ${groupSongs.length} titre(s).`);
  };

  // Ajouter un titre
  const handleAddSong = async (newSongData, groupId) => {
    // Enrichir le titre avec l'API Gemini
    const enrichedData = await enrichSongWithGemini(newSongData.title, newSongData.artist);

    const song = {
      id: Date.now().toString(),
      title: newSongData.title,
      artist: newSongData.artist,
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
    setSongs([...songs, song]);

    // Si ajouté dans un groupe, inscrire automatiquement le créateur
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

    setSongs([...songs, ...newSongs]);
    setParticipations([...participations, ...newParticipations]);

    const enrichedCount = enrichedSongs.filter(s => s.enriched).length;
    alert(`${parsedSongs.length} titre(s) importé(s) avec succès ! (${enrichedCount} enrichis) 🎵`);
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

      // Mettre à jour le titre avec les nouvelles données
      const updatedSongs = songs.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            duration: enrichedData.duration,
            chords: enrichedData.chords,
            lyrics: enrichedData.lyrics,
            genre: enrichedData.genre,
            enriched: enrichedData.enriched
          };
        }
        return s;
      });

      setSongs(updatedSongs);

      if (enrichedData.enriched) {
        alert(`Titre "${song.title}" enrichi avec succès ! 🎵`);
      } else {
        alert(`Impossible d'enrichir le titre "${song.title}". Veuillez réessayer plus tard.`);
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

  // Rejoindre un emplacement
  const handleJoinSlot = (songId, slotId) => {
    const participation = {
      id: Date.now().toString() + '_' + Math.random(),
      songId: songId,
      userId: currentUser.id,
      slotId: slotId,
      comment: ''
    };
    setParticipations([...participations, participation]);
  };

  // Quitter un emplacement
  const handleLeaveSlot = (songId, slotId) => {
    setParticipations(participations.filter(p => 
      !(p.songId === songId && p.userId === currentUser.id && p.slotId === slotId)
    ));
  };

  // Ajouter un emplacement personnalisé
  const handleAddSlot = (newSlotData) => {
    const slot = {
      id: 'custom_' + Date.now(),
      name: newSlotData.name,
      icon: newSlotData.icon || '🎼'
    };
    setInstrumentSlots([...instrumentSlots, slot]);
    alert('Emplacement ajouté !');
  };

  // Supprimer un emplacement
  const handleDeleteSlot = (slotId) => {
    if (window.confirm('Supprimer cet emplacement ? Les participations associées seront perdues.')) {
      setInstrumentSlots(instrumentSlots.filter(s => s.id !== slotId));
      setParticipations(participations.filter(p => p.slotId !== slotId));
    }
  };

  // Déconnexion
  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
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
    </div>
  );
}
