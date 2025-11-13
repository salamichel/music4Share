import React, { useState } from 'react';
import { List, Filter } from 'lucide-react';
import SongCard from './SongCard';

const RepertoireView = ({ 
  songs, 
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups,
  onJoinSlot,
  onLeaveSlot
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
                    onJoinSlot={onJoinSlot}
                    onLeaveSlot={onLeaveSlot}
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
