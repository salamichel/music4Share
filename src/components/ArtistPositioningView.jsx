import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Search, Music } from 'lucide-react';

const ArtistPositioningView = ({ artists, participations, songs, instrumentSlots }) => {
  const [expandedArtists, setExpandedArtists] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Calculer les données de positionnement pour chaque artiste
  const artistsWithPositioning = useMemo(() => {
    return artists.map(artist => {
      // Trouver toutes les participations de cet artiste
      const artistParticipations = participations.filter(p => p.artistId === artist.id);

      // Obtenir les chansons uniques sur lesquelles l'artiste est positionné
      const uniqueSongIds = [...new Set(artistParticipations.map(p => p.songId))];

      // Créer une map avec les détails pour chaque chanson
      const songDetails = uniqueSongIds.map(songId => {
        const song = songs.find(s => s.id === songId);
        if (!song) return null;

        // Trouver tous les instruments que l'artiste joue sur cette chanson
        const songParticipations = artistParticipations.filter(p => p.songId === songId);
        const instruments = songParticipations.map(p => {
          const slot = instrumentSlots.find(s => s.id === p.slotId);
          return slot ? { icon: slot.icon, name: slot.name, comment: p.comment } : null;
        }).filter(Boolean);

        return {
          song,
          instruments
        };
      }).filter(Boolean);

      return {
        artist,
        songCount: uniqueSongIds.length,
        songDetails: songDetails.sort((a, b) => a.song.title.localeCompare(b.song.title))
      };
    }).filter(item => item.songCount > 0); // Ne garder que les artistes avec des chansons
  }, [artists, participations, songs, instrumentSlots]);

  // Filtrer par recherche
  const filteredArtists = useMemo(() => {
    if (!searchTerm.trim()) {
      return artistsWithPositioning;
    }

    const search = searchTerm.toLowerCase();
    return artistsWithPositioning.filter(item =>
      item.artist.name.toLowerCase().includes(search) ||
      item.songDetails.some(sd => sd.song.title.toLowerCase().includes(search))
    );
  }, [artistsWithPositioning, searchTerm]);

  // Trier par nombre de chansons décroissant, puis par nom
  const sortedArtists = useMemo(() => {
    return [...filteredArtists].sort((a, b) => {
      if (b.songCount !== a.songCount) {
        return b.songCount - a.songCount;
      }
      return a.artist.name.localeCompare(b.artist.name);
    });
  }, [filteredArtists]);

  // Toggle l'état étendu d'un artiste
  const toggleArtist = (artistId) => {
    setExpandedArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  // Développer tous / Replier tous
  const expandAll = () => {
    setExpandedArtists(new Set(sortedArtists.map(item => item.artist.id)));
  };

  const collapseAll = () => {
    setExpandedArtists(new Set());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Positionnement des Artistes
            </h2>
            <p className="text-sm text-teal-100 mt-1">
              {sortedArtists.length} artiste{sortedArtists.length > 1 ? 's' : ''} positionné{sortedArtists.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm flex items-center"
              title="Tout développer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={collapseAll}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm flex items-center"
              title="Tout replier"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un artiste ou un titre..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des artistes */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedArtists.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Aucun artiste trouvé' : 'Aucun artiste positionné sur des chansons'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedArtists.map(({ artist, songCount, songDetails }) => {
              const isExpanded = expandedArtists.has(artist.id);

              return (
                <div
                  key={artist.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* En-tête de l'artiste */}
                  <button
                    onClick={() => toggleArtist(artist.id)}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{artist.name}</h3>
                        <p className="text-sm text-gray-600">
                          {songCount} chanson{songCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {artist.instruments.map(inst => {
                        const slot = instrumentSlots.find(s => s.id === inst.slotId);
                        return slot ? (
                          <span
                            key={inst.slotId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800"
                          >
                            <span className="mr-1">{slot.icon}</span>
                            {slot.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </button>

                  {/* Liste des chansons (dépliable) */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t">
                      <div className="space-y-3">
                        {songDetails.map(({ song, instruments }) => (
                          <div
                            key={song.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Music className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {song.title}
                              </h4>
                              {song.artist && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Artiste original : {song.artist}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {instruments.map((inst, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-800"
                                    title={inst.comment || ''}
                                  >
                                    <span className="mr-1">{inst.icon}</span>
                                    {inst.name}
                                    {inst.comment && (
                                      <span className="ml-1 text-teal-600">
                                        ({inst.comment})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistPositioningView;
