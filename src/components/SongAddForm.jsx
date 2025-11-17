import React, { useState } from 'react';
import { Plus, FileJson } from 'lucide-react';

const SongAddForm = ({
  groupId,
  onAddSong,
  onBulkImport,
  onJsonImport,
  showBulkImport,
  onToggleBulkImport
}) => {
  const [newSong, setNewSong] = useState({ title: '', artist: '', youtubeLink: '' });
  const [bulkText, setBulkText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [importMode, setImportMode] = useState('simple'); // 'simple', 'bulk', 'json'
  const [jsonError, setJsonError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSong(newSong, groupId);
    setNewSong({ title: '', artist: '', youtubeLink: '' });
  };

  const handleBulkImport = () => {
    onBulkImport(bulkText, groupId);
    setBulkText('');
  };

  const handleJsonImport = () => {
    setJsonError('');

    try {
      const parsed = JSON.parse(jsonText);
      const songsArray = Array.isArray(parsed) ? parsed : [parsed];

      // Valider la structure
      for (const song of songsArray) {
        if (!song.title) {
          throw new Error('Chaque titre doit avoir une propriété "title"');
        }
      }

      // Appeler la fonction d'import avec les données enrichies
      if (onJsonImport) {
        onJsonImport(songsArray, groupId);
        setJsonText('');
        setImportMode('simple');
      }
    } catch (error) {
      setJsonError(error.message);
    }
  };

  return (
    <div className="p-4 bg-purple-50 border-b">
      {importMode === 'simple' ? (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Ajouter des titres</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('bulk')}
                className="text-xs text-purple-600 hover:underline"
              >
                Import texte →
              </button>
              <button
                onClick={() => setImportMode('json')}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                <FileJson className="w-3 h-3" />
                Import JSON →
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Titre"
              value={newSong.title}
              onChange={(e) => setNewSong({...newSong, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Artiste (optionnel - sera détecté par Gemini)"
              value={newSong.artist}
              onChange={(e) => setNewSong({...newSong, artist: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="url"
              placeholder="Lien YouTube (optionnel)"
              value={newSong.youtubeLink}
              onChange={(e) => setNewSong({...newSong, youtubeLink: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm">
              <Plus className="w-4 h-4 inline mr-1" />
              Ajouter
            </button>
          </form>
        </>
      ) : importMode === 'bulk' ? (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Import texte en masse</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('simple')}
                className="text-xs text-purple-600 hover:underline"
              >
                ← Simple
              </button>
              <button
                onClick={() => setImportMode('json')}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                <FileJson className="w-3 h-3" />
                JSON →
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Un titre par ligne : "Titre - Artiste" ou "Titre | Artiste"
          </p>
          <textarea
            placeholder="Highway to Hell - AC/DC&#10;Smoke on the Water - Deep Purple"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="6"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleBulkImport}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              Importer
            </button>
            <button
              onClick={() => {
                setBulkText('');
                setImportMode('simple');
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Import JSON enrichi
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('simple')}
                className="text-xs text-purple-600 hover:underline"
              >
                ← Simple
              </button>
              <button
                onClick={() => setImportMode('bulk')}
                className="text-xs text-purple-600 hover:underline"
              >
                Texte →
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Collez un JSON avec vos titres enrichis (accords, paroles, etc.)
          </p>
          <details className="mb-2 text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-purple-600">Format JSON attendu</summary>
            <pre className="mt-2 bg-white p-2 rounded border overflow-x-auto">
{`[
  {
    "title": "Titre du morceau",
    "artist": "Nom de l'artiste",
    "chords": "Am C G F...",
    "lyrics": "Paroles...",
    "duration": "3:45",
    "genre": "Rock",
    "youtubeLink": "https://..."
  }
]`}
            </pre>
          </details>

          {jsonError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
              ❌ Erreur: {jsonError}
            </div>
          )}

          <textarea
            placeholder='[{"title": "Highway to Hell", "artist": "AC/DC", "chords": "...", "lyrics": "..."}]'
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError('');
            }}
            className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="8"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleJsonImport}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Importer et Enrichir
            </button>
            <button
              onClick={() => {
                setJsonText('');
                setJsonError('');
                setImportMode('simple');
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
            >
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SongAddForm;
