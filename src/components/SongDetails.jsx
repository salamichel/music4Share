import React from 'react';
import { X, Clock, Music2, FileText, Tag } from 'lucide-react';

const SongDetails = ({ song, onClose }) => {
  if (!song) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{song.title}</h2>
              <p className="text-xl opacity-90">{song.artist}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-3 mt-4">
            {song.duration && (
              <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {song.duration}
              </div>
            )}
            {song.genre && (
              <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                <Tag className="w-4 h-4 mr-2" />
                {song.genre}
              </div>
            )}
            {song.enriched && (
              <div className="flex items-center bg-green-500 bg-opacity-90 px-3 py-1 rounded-full text-sm font-semibold">
                ✨ Enrichi par Gemini
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message si pas enrichi */}
          {!song.enriched && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-yellow-800">
                ℹ️ Ce titre n'a pas été enrichi automatiquement. Les informations détaillées ne sont pas disponibles.
              </p>
            </div>
          )}

          {/* Chords Section */}
          {song.chords && (
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Music2 className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-blue-900">Grille d'Accords</h3>
              </div>
              <div className="bg-white rounded p-4 font-mono text-sm whitespace-pre-wrap">
                {song.chords}
              </div>
            </div>
          )}

          {/* Lyrics Section */}
          {song.lyrics && (
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-purple-900">Paroles</h3>
              </div>
              <div className="bg-white rounded p-4 whitespace-pre-wrap text-gray-800 leading-relaxed">
                {song.lyrics}
              </div>
            </div>
          )}

          {/* YouTube Link */}
          {song.youtubeLink && (
            <div className="bg-red-50 rounded-lg p-4">
              <a
                href={song.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Voir sur YouTube
              </a>
            </div>
          )}

          {/* No enrichment data message */}
          {!song.chords && !song.lyrics && song.enriched === false && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Aucune donnée enrichie disponible pour ce titre.</p>
              <p className="text-sm mt-2">
                L'enrichissement automatique n'était pas disponible lors de l'ajout de ce titre.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
