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
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-3 relative rounded-t-xl">
          {/* Checkbox de sélection */}
          {onToggleSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(song.id)}
              className="absolute top-2 left-2 w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer z-10"
              title="Sélectionner pour enrichissement"
            />
          )}

          {/* Playable badge */}
          {isPlayable && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-lg">
              ✓
            </div>
          )}

          {/* Title and Artist - compact */}
          <div className="text-center">
            <h3 className="font-bold text-base line-clamp-1">{song.title}</h3>
            <p className="text-xs opacity-90 line-clamp-1">{song.artist}</p>
          </div>

          {/* YouTube link */}
          {song.youtubeLink && (
            <a
              href={song.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition mx-auto w-fit mt-2"
            >
              <Youtube className="w-3 h-3 mr-1" />
              YouTube
            </a>
          )}
        </div>

        {/* Instruments section */}
        <div className="p-3 flex-1 flex flex-col">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Instruments</h4>

          {/* Grille de boutons d'instruments */}
          <div className="grid grid-cols-2 gap-2 mb-2">
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
                <button
                  key={slot.id}
                  onClick={() => handleOpenArtistSelector(slot.id)}
                  className={`
                    text-xs px-2 py-1.5 rounded-lg border transition-all font-medium
                    ${assignedArtists.length > 0
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md hover:bg-purple-700'
                      : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                    }
                  `}
                  title={assignedArtists.map(a => a.name).join(', ') || 'Ajouter un artiste'}
                >
                  <span className="mr-1">{slot.icon}</span>
                  {slot.name}
                  {assignedArtists.length > 0 && (
                    <span className="ml-1 font-bold">({assignedArtists.length})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Liste des artistes assignés - compact */}
          {songParticipations.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => {
                  const slotParticipants = songParticipations.filter(p => p.slotId === slot.id);
                  if (slotParticipants.length === 0) return null;

                  return slotParticipants.map(p => {
                    const artist = p.artistId
                      ? artists.find(a => a.id === p.artistId)
                      : users.find(u => u.id === p.userId);
                    const artistName = artist?.name || artist?.username || 'Inconnu';

                    return (
                      <button
                        key={`${slot.id}-${p.artistId || p.userId}`}
                        onClick={() => {
                          if (p.artistId) {
                            onLeaveSlot(song.id, slot.id, p.artistId);
                          } else {
                            onLeaveSlot(song.id, slot.id);
                          }
                        }}
                        className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full hover:bg-red-100 hover:text-red-800 transition flex items-center gap-1"
                        title={`${slot.icon} ${slot.name} - Retirer ${artistName}`}
                      >
                        <span>{slot.icon}</span>
                        <span>{artistName}</span>
                        <span className="font-bold">×</span>
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons at bottom */}
        <div className="p-2 bg-gray-50 border-t flex gap-2">
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
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 rounded-lg transition font-medium text-xs flex items-center justify-center shadow-sm"
            title="Voir les détails"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            Détails
          </button>

          {canDelete() && onDeleteSong && (
            <button
              onClick={() => {
                if (window.confirm(`Supprimer "${song.title}" ?`)) {
                  onDeleteSong(song.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg transition font-medium text-xs flex items-center justify-center shadow-sm"
              title="Supprimer ce titre"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
