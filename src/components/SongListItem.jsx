import React, { useState } from 'react';
import { Youtube, Info, Trash2 } from 'lucide-react';
import { isSongPlayable } from '../utils/helpers';
import { useLocalAudio } from '../hooks/useLocalAudio';
import SongDetails from './SongDetails';
import AddToSetlistButton from './AddToSetlistButton';
import ArtistSelector from './ArtistSelector';

// Fonction pour extraire l'ID YouTube d'une URL
const getYouTubeVideoId = (url) => {
  if (!url) return null;

  // Gérer différents formats d'URL YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Fonction pour obtenir l'URL de la vignette YouTube
const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  // mqdefault = qualité moyenne (320x180)
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

const SongListItem = ({
  song,
  participations,
  instrumentSlots,
  users,
  currentUser,
  groups = [],
  artists = [],
  songPdfs = [],
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

  // Obtenir la vignette YouTube si disponible
  const youtubeThumbnail = getYouTubeThumbnail(song.youtubeLink);

  // Load local audio if needed
  const { audioUrl: actualAudioUrl } = useLocalAudio(song.audioUrl);

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
      {/* List Item - Horizontal Layout */}
      <div
        className={`
          bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300
          flex items-center gap-4 p-3
          ${isPlayable ? 'ring-2 ring-green-500' : ''}
          ${isSelected ? 'ring-2 ring-orange-500' : ''}
        `}
      >
        {/* Checkbox de sélection */}
        {onToggleSelection && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(song.id)}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer flex-shrink-0"
            title="Sélectionner pour enrichissement"
          />
        )}

        {/* Vignette YouTube */}
        {youtubeThumbnail && song.youtubeLink ? (
          <a
            href={song.youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block rounded overflow-hidden group flex-shrink-0"
          >
            <img
              src={youtubeThumbnail}
              alt={`Vignette ${song.title}`}
              className="w-20 h-12 object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <Youtube className="w-4 h-4 text-white" />
            </div>
          </a>
        ) : (
          <div className="w-20 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center flex-shrink-0">
            {song.youtubeLink && (
              <a
                href={song.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:scale-110 transition"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* Informations de la chanson */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{song.title}</h3>
            {isPlayable && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate">{song.artist}</p>

          {/* Audio Player - compact */}
          {song.audioUrl && actualAudioUrl && (
            <div className="mt-1">
              <audio
                controls
                className="w-full h-6"
                style={{ maxHeight: '24px' }}
                preload="metadata"
                key={actualAudioUrl}
              >
                <source src={actualAudioUrl} type="audio/mpeg" />
                <source src={actualAudioUrl} type="audio/wav" />
                <source src={actualAudioUrl} type="audio/ogg" />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}
        </div>

        {/* Instruments - Format horizontal compact */}
        <div className="flex items-center gap-2 flex-shrink-0">
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
                  text-xs px-2 py-1 rounded border transition-all font-medium
                  ${assignedArtists.length > 0
                    ? 'bg-purple-600 text-white border-purple-600 shadow hover:bg-purple-700'
                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                  }
                `}
                title={assignedArtists.map(a => a.name).join(', ') || 'Ajouter un artiste'}
              >
                <span className="mr-0.5">{slot.icon}</span>
                {assignedArtists.length > 0 && (
                  <span className="font-bold">({assignedArtists.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Artistes assignés - Tags horizontaux */}
        {songParticipations.length > 0 && (
          <div className="flex flex-wrap gap-1 max-w-xs">
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
                    <span className="truncate max-w-[80px]">{artistName}</span>
                    <span className="font-bold">×</span>
                  </button>
                );
              });
            })}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Bouton Setlist */}
          {setlists.length > 0 && (
            <AddToSetlistButton
              songId={song.id}
              setlists={setlists}
              setlistSongs={setlistSongs}
            />
          )}

          <button
            onClick={() => setShowDetails(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition font-medium text-xs flex items-center shadow-sm"
            title="Voir les détails"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {canDelete() && onDeleteSong && (
            <button
              onClick={() => {
                if (window.confirm(`Supprimer "${song.title}" ?`)) {
                  onDeleteSong(song.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition font-medium text-xs flex items-center shadow-sm"
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
          songPdfs={songPdfs}
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

export default SongListItem;
