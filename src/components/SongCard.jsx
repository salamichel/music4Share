import React, { useState } from 'react';
import { Youtube, Info, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { isSongPlayable } from '../utils/helpers';
import SongDetails from './SongDetails';
import AddToSetlistButton from './AddToSetlistButton';

const SongCard = ({
  song,
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups = [],
  onJoinSlot,
  onLeaveSlot,
  onReenrichSong,
  onDeleteSong,
  isEnriching = false,
  isSelected = false,
  onToggleSelection,
  setlists = [],
  setlistSongs = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const songParticipations = participations.filter(p => p.songId === song.id);
  const isPlayable = isSongPlayable(song.id, participations);

  // Vérifier si l'utilisateur peut supprimer ce titre
  const canDelete = () => {
    if (song.ownerGroupId) {
      const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
      return ownerGroup && ownerGroup.memberIds.includes(currentUser.id);
    }
    return song.addedBy === currentUser.id;
  };

  return (
    <>
      <div className={`border-b last:border-b-0 py-3 px-2 ${isPlayable ? 'bg-green-50 border-l-4 border-l-green-500' : ''} ${isSelected ? 'bg-orange-50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              {/* Checkbox de sélection */}
              {onToggleSelection && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelection(song.id)}
                  className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                  title="Sélectionner pour enrichissement"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{song.title}</h4>
                <p className="text-sm text-gray-600">{song.artist}</p>
                {song.youtubeLink && (
                  <a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-red-600 text-xs flex items-center mt-1 hover:underline">
                    <Youtube className="w-3 h-3 mr-1" />
                    YouTube
                  </a>
                )}
                {song.enriched && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-600 font-medium">✨ Enrichi</span>
                    {song.duration && (
                      <span className="text-xs text-gray-500">⏱️ {song.duration}</span>
                    )}
                    {song.genre && (
                      <span className="text-xs text-gray-500">🎵 {song.genre}</span>
                    )}
                  </div>
                )}
                {!isEnriching && (
                  <button
                    onClick={() => onReenrichSong && onReenrichSong(song.id)}
                    className={`text-xs font-medium mt-1 flex items-center ${
                      song.enriched
                        ? 'text-purple-600 hover:text-purple-700'
                        : 'text-orange-600 hover:text-orange-700'
                    }`}
                    title={song.enriched ? "Réenrichir avec l'API Gemini" : "Enrichir avec l'API Gemini"}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {song.enriched ? 'Réenrichir' : 'Enrichir'}
                  </button>
                )}
                {isEnriching && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Enrichissement...
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {setlists.length > 0 && (
                  <AddToSetlistButton
                    songId={song.id}
                    setlists={setlists}
                    setlistSongs={setlistSongs}
                  />
                )}
                <button
                  onClick={() => setShowDetails(true)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-1.5 rounded transition"
                  title="Voir les détails"
                >
                  <Info className="w-4 h-4" />
                </button>
                {canDelete() && onDeleteSong && (
                  <button
                    onClick={() => onDeleteSong(song.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded transition"
                    title="Supprimer ce titre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {isPlayable && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">✓ Jouable</span>
          )}
        </div>
      
      {/* Emplacements d'instruments */}
      <div className="flex flex-wrap gap-2 mt-3">
        {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => {
          const slotParticipants = songParticipations.filter(p => p.slotId === slot.id);
          const userInSlot = slotParticipants.find(p => p.userId === currentUser.id);
          
          return (
            <div key={slot.id} className="relative">
              <button
                onClick={() => {
                  if (userInSlot) {
                    onLeaveSlot(song.id, slot.id);
                  } else {
                    onJoinSlot(song.id, slot.id);
                  }
                }}
                className={`text-xs px-2 py-1 rounded-full border transition ${
                  userInSlot
                    ? 'bg-purple-600 text-white border-purple-600'
                    : slotParticipants.length > 0
                    ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
                title={slotParticipants.map(p => users.find(u => u.id === p.userId)?.username).join(', ') || 'Libre'}
              >
                <span className="mr-1">{slot.icon}</span>
                {slot.name}
                {slotParticipants.length > 0 && (
                  <span className="ml-1 font-semibold">({slotParticipants.length})</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Liste des participants */}
      {songParticipations.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => {
            const slotParts = songParticipations.filter(p => p.slotId === slot.id);
            if (slotParts.length === 0) return null;
            return (
              <span key={slot.id} className="mr-3">
                {slot.icon} {slotParts.map(p => users.find(u => u.id === p.userId)?.username).join(', ')}
              </span>
            );
          })}
        </div>
      )}
    </div>

      {/* Modal de détails */}
      {showDetails && (
        <SongDetails song={song} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
};

export default SongCard;
