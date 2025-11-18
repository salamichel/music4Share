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
  onSaveSong,
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
      {/* Elegant Minimalist Card */}
      <div
        className={`
          bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300
          flex flex-col h-full border-2
          ${isPlayable ? 'border-green-400' : 'border-gray-200'}
          ${isSelected ? 'ring-2 ring-copper-400 border-copper-400' : ''}
        `}
      >
        {/* Header with title and artist - Clean design */}
        <div className="bg-gradient-to-r from-white via-copper-50/30 to-white p-4 relative rounded-t-xl border-l-4 border-copper-500">
          {/* Checkbox de sélection */}
          {onToggleSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(song.id)}
              className="absolute top-3 left-3 w-4 h-4 text-copper-600 focus:ring-copper-500 rounded cursor-pointer z-10"
              title="Sélectionner pour enrichissement"
            />
          )}

          {/* Playable badge */}
          {isPlayable && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
              ✓
            </div>
          )}

          {/* Title and Artist - elegant */}
          <div className="text-left pl-6">
            <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{song.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{song.artist}</p>
          </div>

          {/* YouTube link */}
          {song.youtubeLink && (
            <a
              href={song.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-copper-600 hover:text-copper-700 mt-2 pl-6 font-medium"
            >
              <Youtube className="w-3.5 h-3.5 mr-1" />
              Voir sur YouTube
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
                    text-xs px-3 py-2 rounded-lg border-2 transition-all font-medium
                    ${assignedArtists.length > 0
                      ? 'bg-copper-50 text-copper-700 border-copper-400 hover:bg-copper-100'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-copper-300 hover:bg-gray-50'
                    }
                  `}
                  title={assignedArtists.map(a => a.name).join(', ') || 'Ajouter un artiste'}
                >
                  <span className="mr-1">{slot.icon}</span>
                  {slot.name}
                  {assignedArtists.length > 0 && (
                    <span className="ml-1 font-bold text-copper-600">({assignedArtists.length})</span>
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
                        className="text-xs bg-white border border-copper-300 text-copper-700 px-2 py-1 rounded-full hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition flex items-center gap-1"
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
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
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
            className="flex-1 bg-white border-2 border-copper-400 text-copper-700 hover:bg-copper-50 px-3 py-2 rounded-lg transition font-medium text-xs flex items-center justify-center"
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
              className="bg-white border-2 border-red-400 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition font-medium text-xs flex items-center justify-center"
              title="Supprimer ce titre"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetails && (
        <SongDetails
          song={song}
          onClose={() => setShowDetails(false)}
          onSave={onSaveSong}
        />
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
