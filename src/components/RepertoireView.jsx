import React, { useState } from 'react';
import { List, Filter, Sparkles, CheckSquare, Square, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import SongCard from './SongCard';
import SongListItem from './SongListItem';
import ViewModeToggle from './ViewModeToggle';

const RepertoireView = ({
  songs,
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups,
  artists = [],
  songPdfs = [],
  onJoinSlot,
  onLeaveSlot,
  onReenrichSong,
  onDeleteSong,
  onSaveSong,
  enrichingSongs,
  selectedSongs,
  onToggleSongSelection,
  onEnrichSelected,
  onDeleteSelected,
  onSelectAllUnenriched,
  onDeselectAll,
  setlists = [],
  setlistSongs = []
}) => {
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterPlayable, setFilterPlayable] = useState('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const filteredSongs = songs.filter(song => {
    // Filtre par groupe
    if (filterGroup !== 'all' && song.ownerGroupId !== filterGroup) return false;

    // Filtre par jouabilité
    if (filterPlayable === 'playable') {
      const songParts = participations.filter(p => p.songId === song.id);
      const filledSlots = new Set(songParts.map(p => p.slotId));
      const hasDrums = filledSlots.has('drums');
      const hasString = filledSlots.has('guitar') || filledSlots.has('bass');
      const hasVocals = filledSlots.has('vocals');
      if (!(hasDrums && hasString && hasVocals)) return false;
    }

    // Filtre par artiste
    if (filterArtist !== 'all') {
      const songParts = participations.filter(p => p.songId === song.id);
      const hasArtist = songParts.some(p => p.artistId === filterArtist);
      if (!hasArtist) return false;
    }

    return true;
  }).sort((a, b) => a.title.localeCompare(b.title));

  const unenrichedCount = songs.filter(s => !s.enriched).length;

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <List className="w-5 h-5 mr-2" />
              Répertoire Global
            </h2>
            <p className="text-sm text-purple-100 mt-1">
              {filteredSongs.length} titre{filteredSongs.length > 1 ? 's' : ''}
              {unenrichedCount > 0 && ` · ${unenrichedCount} non enrichi${unenrichedCount > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

            {/* Filter toggle button for mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition md:hidden"
            >
              <Filter className="w-5 h-5" />
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filtres - Always visible on desktop, collapsible on mobile */}
        <div className={`
          ${showFilters ? 'block' : 'hidden'} md:block
          transition-all duration-300
        `}>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex-1">
              <label className="text-xs text-purple-100 mb-1 block">Groupe</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                <option value="all" className="text-gray-900">Tous les groupes</option>
                <option value="null" className="text-gray-900">Personnel</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id} className="text-gray-900">{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-purple-100 mb-1 block">Artiste</label>
              <select
                value={filterArtist}
                onChange={(e) => setFilterArtist(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                <option value="all" className="text-gray-900">Tous les artistes</option>
                {artists.sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                  <option key={a.id} value={a.id} className="text-gray-900">{a.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-purple-100 mb-1 block">Jouabilité</label>
              <select
                value={filterPlayable}
                onChange={(e) => setFilterPlayable(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                <option value="all" className="text-gray-900">Tous les titres</option>
                <option value="playable" className="text-gray-900">Jouables uniquement</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions pour l'enrichissement en masse */}
      {onEnrichSelected && (
        <div className="p-3 border-b bg-orange-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSelectAllUnenriched}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm"
              title="Sélectionner tous les titres non enrichis"
            >
              <CheckSquare className="w-3 h-3" />
              Tout sélectionner
            </button>
            {selectedSongs && selectedSongs.size > 0 && (
              <>
                <button
                  onClick={onDeselectAll}
                  className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Square className="w-3 h-3" />
                  Désélectionner
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {selectedSongs.size} titre{selectedSongs.size > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
          {selectedSongs && selectedSongs.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onEnrichSelected}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Enrichir
              </button>
              {onDeleteSelected && (
                <button
                  onClick={onDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition shadow-sm"
                  title="Supprimer les titres sélectionnés"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid de cards ou Liste - Responsive */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filteredSongs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center py-8">Aucun titre trouvé</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSongs.map(song => {
              const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
              return (
                <div key={song.id} className="flex flex-col">
                  {/* Group label - Plus visible */}
                  {ownerGroup && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold mb-2 px-3 py-1.5 rounded-t-lg shadow-md flex items-center">
                      📁 {ownerGroup.name}
                    </div>
                  )}
                  <SongCard
                    song={song}
                    participations={participations}
                    instrumentSlots={instrumentSlots}
                    users={users}
                    currentUser={currentUser}
                    groups={groups}
                    artists={artists}
                    songPdfs={songPdfs}
                    onJoinSlot={onJoinSlot}
                    onLeaveSlot={onLeaveSlot}
                    onReenrichSong={onReenrichSong}
                    onDeleteSong={onDeleteSong}
                    onSaveSong={onSaveSong}
                    isEnriching={enrichingSongs.has(song.id)}
                    isSelected={selectedSongs && selectedSongs.has(song.id)}
                    onToggleSelection={onToggleSongSelection}
                    setlists={setlists}
                    setlistSongs={setlistSongs}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSongs.map(song => {
              const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
              return (
                <div key={song.id} className="flex flex-col">
                  {/* Group label pour la vue liste */}
                  {ownerGroup && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold mb-2 px-3 py-1 rounded shadow-md inline-flex items-center w-fit">
                      📁 {ownerGroup.name}
                    </div>
                  )}
                  <SongListItem
                    song={song}
                    participations={participations}
                    instrumentSlots={instrumentSlots}
                    users={users}
                    currentUser={currentUser}
                    groups={groups}
                    artists={artists}
                    songPdfs={songPdfs}
                    onJoinSlot={onJoinSlot}
                    onLeaveSlot={onLeaveSlot}
                    onReenrichSong={onReenrichSong}
                    onDeleteSong={onDeleteSong}
                    onSaveSong={onSaveSong}
                    isEnriching={enrichingSongs.has(song.id)}
                    isSelected={selectedSongs && selectedSongs.has(song.id)}
                    onToggleSelection={onToggleSongSelection}
                    setlists={setlists}
                    setlistSongs={setlistSongs}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepertoireView;
