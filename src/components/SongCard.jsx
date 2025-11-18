import React, { useState } from 'react';
import { Youtube, Info, Trash2, Music } from 'lucide-react';
import { isSongPlayable } from '../utils/helpers';
import SongDetails from './SongDetails';
import AddToSetlistButton from './AddToSetlistButton';
import ArtistSelector from './ArtistSelector';

const SongCard = ({
  song,
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups = [],
  artists = [],
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
  const [showArtistSelector, setShowArtistSelector] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const songParticipations = participations.filter(p => p.songId === song.id);
  const isPlayable = isSongPlayable(song.id, participations);

  // Vérifier si l'utilisateur peut supprimer ce titre
  const canDelete = () => {
    if (song.ownerGroupId) {
      const ownerGroup = groups.find(g => g.id === song.ownerGroupId);
      return ownerGroup && ownerGroup.memberIds.includes(currentUser.id);
    }
    // Pour les titres personnels: autoriser si addedBy est manquant (anciens titres) ou correspond
    return !song.addedBy || song.addedBy === currentUser.id;
  };

  // Ouvrir le sélecteur d'artiste pour un slot
  const handleOpenArtistSelector = (slotId) => {
    setSelectedSlotId(slotId);
    setShowArtistSelector(true);
  };

  // Gérer la sélection d'un artiste
  const handleArtistSelected = (artist) => {
    if (artist && selectedSlotId) {
      onJoinSlot(song.id, selectedSlotId, artist.id);
    }
    setShowArtistSelector(false);
    setSelectedSlotId(null);
  };

  // Annuler la sélection
  const handleCancelArtistSelection = () => {
    setShowArtistSelector(false);
    setSelectedSlotId(null);
  };

  return (
    <>
      {/* Material Design Card */}
      <div
        className={`
          bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300
          flex flex-col h-full
          ${isPlayable ? 'ring-2 ring-green-500' : ''}
          ${isSelected ? 'ring-2 ring-orange-500' : ''}
        `}
      >
        {/* Header with title and artist */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 relative rounded-t-xl">
          {/* Checkbox de sélection */}
          {onToggleSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(song.id)}
              className="absolute top-3 left-3 w-5 h-5 text-purple-600 focus:ring-purple-500 rounded cursor-pointer z-10"
              title="Sélectionner pour enrichissement"
            />
          )}

          {/* Playable badge */}
          {isPlayable && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
              ✓ Jouable
            </div>
          )}

          {/* Title and Artist - centered */}
          <div className="text-center mt-6 mb-4">
            <div className="flex items-center justify-center mb-2">
              <Music className="w-5 h-5 mr-2 opacity-80" />
              <h3 className="font-bold text-lg line-clamp-2">{song.title}</h3>
            </div>
            <p className="text-sm opacity-90 line-clamp-1">{song.artist}</p>
          </div>

          {/* YouTube link */}
          {song.youtubeLink && (
            <a
              href={song.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition mx-auto w-fit"
            >
              <Youtube className="w-3 h-3 mr-1" />
              YouTube
            </a>
          )}
        </div>

        {/* Instruments section */}
        <div className="p-4 flex-1 flex flex-col">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Instruments</h4>

          <div className="space-y-3 mb-3">
            {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => {
              const slotParticipants = songParticipations.filter(p => p.slotId === slot.id);
              const assignedArtists = slotParticipants
                .map(p => {
                  if (p.artistId) {
                    return {
                      id: p.artistId,
                      name: artists.find(a => a.id === p.artistId)?.name || 'Artiste inconnu',
                      isArtist: true
                    };
                  }
                  return {
                    id: p.userId,
                    name: users.find(u => u.id === p.userId)?.username || 'Utilisateur inconnu',
                    isArtist: false
                  };
                })
                .filter(Boolean);

              return (
                <div key={slot.id} className="border rounded-lg p-2 bg-gray-50">
                  {/* Slot header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs font-semibold text-gray-700">
                      <span className="mr-1 text-base">{slot.icon}</span>
                      {slot.name}
                      {assignedArtists.length > 0 && (
                        <span className="ml-1 text-purple-600">({assignedArtists.length})</span>
                      )}
                    </div>
                    {/* Bouton pour ajouter un artiste */}
                    <button
                      onClick={() => handleOpenArtistSelector(slot.id)}
                      className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition"
                      title="Ajouter un artiste"
                    >
                      + Ajouter
                    </button>
                  </div>

                  {/* Liste des artistes assignés */}
                  {assignedArtists.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {assignedArtists.map(artist => (
                        <button
                          key={`${slot.id}-${artist.id}`}
                          onClick={() => {
                            if (artist.isArtist) {
                              onLeaveSlot(song.id, slot.id, artist.id);
                            } else {
                              onLeaveSlot(song.id, slot.id);
                            }
                          }}
                          className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full hover:bg-red-100 hover:text-red-800 transition flex items-center gap-1"
                          title={`Retirer ${artist.name}`}
                        >
                          <span>{artist.name}</span>
                          <span className="font-bold">×</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Aucun artiste assigné</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Participants list */}
          {songParticipations.length > 0 && (
            <div className="mt-auto">
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Participants</h4>
              <div className="text-xs text-gray-700 space-y-1 max-h-20 overflow-y-auto">
                {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => {
                  const slotParts = songParticipations.filter(p => p.slotId === slot.id);
                  if (slotParts.length === 0) return null;
                  return (
                    <div key={slot.id} className="flex items-start">
                      <span className="mr-1">{slot.icon}</span>
                      <span className="line-clamp-1">
                        {slotParts.map(p => {
                          if (p.artistId) {
                            return artists.find(a => a.id === p.artistId)?.name || 'Artiste inconnu';
                          }
                          return users.find(u => u.id === p.userId)?.username || 'Utilisateur inconnu';
                        }).join(', ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons at bottom */}
        <div className="p-3 bg-gray-50 border-t flex gap-2">
          {/* Bouton Setlist (si des setlists existent) */}
          {setlists.length > 0 && (
            <AddToSetlistButton
              songId={song.id}
              setlists={setlists}
              setlistSongs={setlistSongs}
            />
          )}

          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition font-medium text-sm flex items-center justify-center shadow-sm"
            title="Voir les détails"
          >
            <Info className="w-4 h-4 mr-1" />
            Détails
          </button>

          {canDelete() && onDeleteSong && (
            <button
              onClick={() => {
                if (window.confirm(`Supprimer "${song.title}" ?`)) {
                  onDeleteSong(song.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition font-medium text-sm flex items-center justify-center shadow-sm"
              title="Supprimer ce titre"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetails && (
        <SongDetails song={song} onClose={() => setShowDetails(false)} />
      )}

      {/* Modal de sélection d'artiste */}
      {showArtistSelector && selectedSlotId && (
        <ArtistSelector
          artists={artists}
          instrumentSlots={instrumentSlots}
          slotId={selectedSlotId}
          songId={song.id}
          participations={participations}
          onSelect={handleArtistSelected}
          onCancel={handleCancelArtistSelection}
        />
      )}
    </>
  );
};

export default SongCard;
