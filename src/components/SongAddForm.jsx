import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const SongAddForm = ({ 
  groupId, 
  onAddSong, 
  onBulkImport, 
  showBulkImport, 
  onToggleBulkImport 
}) => {
  const [newSong, setNewSong] = useState({ title: '', artist: '', youtubeLink: '' });
  const [bulkText, setBulkText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSong(newSong, groupId);
    setNewSong({ title: '', artist: '', youtubeLink: '' });
  };

  const handleBulkImport = () => {
    onBulkImport(bulkText, groupId);
    setBulkText('');
  };

  return (
    <div className="p-4 bg-purple-50 border-b">
      {!showBulkImport ? (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Ajouter des titres</h3>
            <button
              onClick={onToggleBulkImport}
              className="text-sm text-purple-600 hover:underline"
            >
              Import en masse →
            </button>
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
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Import en masse</h3>
            <button
              onClick={onToggleBulkImport}
              className="text-sm text-purple-600 hover:underline"
            >
              ← Ajout simple
            </button>
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
                onToggleBulkImport();
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
