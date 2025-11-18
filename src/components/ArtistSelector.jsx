import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

const ArtistSelector = ({
  artists,
  instrumentSlots,
  slotId,
  songId,
  participations = [],
  onSelect,
  onCancel
}) => {
  const [selectedArtistId, setSelectedArtistId] = useState('');

  // Trouver les artistes déjà assignés à ce slot pour cette chanson
  const assignedArtistIds = participations
    .filter(p => p.songId === songId && p.slotId === slotId && p.artistId)
    .map(p => p.artistId);

  // Filtrer les artistes qui :
  // 1. ont l'instrument correspondant au slot
  // 2. ne sont pas déjà assignés à ce slot pour cette chanson
  const availableArtists = artists.filter(artist =>
    artist.instruments.some(inst => inst.slotId === slotId) &&
    !assignedArtistIds.includes(artist.id)
  );

  const currentSlot = instrumentSlots.find(s => s.id === slotId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedArtistId) {
      const artist = artists.find(a => a.id === selectedArtistId);
      onSelect(artist);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Sélectionner un artiste
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrument : {currentSlot?.icon} {currentSlot?.name}
            </label>
          </div>

          {availableArtists.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Aucun artiste disponible pour cet instrument
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Ajoutez des artistes dans la page "Artistes"
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artiste *
              </label>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">-- Sélectionner un artiste --</option>
                {availableArtists.map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            {availableArtists.length > 0 && (
              <button
                type="submit"
                disabled={!selectedArtistId}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Affecter
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtistSelector;
