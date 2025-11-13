import React, { useState } from 'react';
import { List, Filter, Sparkles, CheckSquare, Square, Trash2 } from 'lucide-react';
import SongCard from './SongCard';

const RepertoireView = ({
  songs,
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups,
  onJoinSlot,
  onLeaveSlot,
  onReenrichSong,
  onDeleteSong,
  enrichingSongs,
  selectedSongs,
  onToggleSongSelection,
  onEnrichSelected,
  onDeleteSelected,
  onSelectAllUnenriched,
  onDeselectAll
}) => {
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterPlayable, setFilterPlayable] = useState('all');

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

    return true;
  });

  const unenrichedCount = songs.filter(s => !s.enriched).length;

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header avec filtres */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex justify-between items-center mb-3">
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
          <Filter className="w-5 h-5" />
        </div>

        {/* Filtres */}
        <div className="flex gap-3">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-1 rounded bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="all">Tous les groupes</option>
            <option value="null">Personnel</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            value={filterPlayable}
            onChange={(e) => setFilterPlayable(e.target.value)}
            className="px-3 py-1 rounded bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="all">Tous les titres</option>
            <option value="playable">Jouables uniquement</option>
          </select>
        </div>
      </div>

      {/* Barre d'actions pour l'enrichissement en masse */}
      {onEnrichSelected && (
        <div className="p-3 border-b bg-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAllUnenriched}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded flex items-center gap-1"
              title="Sélectionner tous les titres non enrichis"
            >
              <CheckSquare className="w-3 h-3" />
              Tout sélectionner
            </button>
            {selectedSongs && selectedSongs.size > 0 && (
              <>
                <button
                  onClick={onDeselectAll}
                  className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded flex items-center gap-1"
                >
                  <Square className="w-3 h-3" />
                  Désélectionner
                </button>
                <span className="text-sm text-gray-600 ml-2">
                  {selectedSongs.size} titre{selectedSongs.size > 1 ? 's' : ''} sélectionné{selectedSongs.size > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
          {selectedSongs && selectedSongs.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onEnrichSelected}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Enrichir la sélection
              </button>
              {onDeleteSelected && (
                <button
                  onClick={onDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2"
                  title="Supprimer les titres sélectionnés"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Liste des titres */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSongs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun titre trouvé</p>
        ) : (
          <div className="space-y-3">
            {filteredSongs.map(song => {
              const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
              return (
                <div key={song.id}>
                  {ownerGroup && (
                    <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center">
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
                    onJoinSlot={onJoinSlot}
                    onLeaveSlot={onLeaveSlot}
                    onReenrichSong={onReenrichSong}
                    onDeleteSong={onDeleteSong}
                    isEnriching={enrichingSongs.has(song.id)}
                    isSelected={selectedSongs && selectedSongs.has(song.id)}
                    onToggleSelection={onToggleSongSelection}
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
