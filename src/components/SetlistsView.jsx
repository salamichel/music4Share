import { useState } from 'react';
import SetlistForm from './SetlistForm';
import SetlistTable from './SetlistTable';
import {
  addSetlist,
  updateSetlist,
  deleteSetlist,
  addSetlistSong,
  deleteSetlistSong,
  updateSetlistSongPositions
} from '../firebase/firebaseHelpers';
import { exportSetlistToPDF } from '../utils/pdfExport';
import { isSongPlayable } from '../utils/helpers';

const SetlistsView = ({
  setlists,
  setlistSongs,
  songs,
  participations,
  instrumentSlots,
  users,
  artists,
  currentUser
}) => {
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState(null);

  const handleCreateSetlist = async (data) => {
    const newSetlist = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addSetlist(newSetlist);
    setShowForm(false);
  };

  const handleUpdateSetlist = async (data) => {
    if (!editingSetlist) return;

    await updateSetlist(editingSetlist.id, {
      name: data.name,
      description: data.description,
      updatedAt: new Date().toISOString()
    });

    setEditingSetlist(null);
    setShowForm(false);

    // Update selected setlist if it's the one being edited
    if (selectedSetlist?.id === editingSetlist.id) {
      setSelectedSetlist({
        ...selectedSetlist,
        name: data.name,
        description: data.description
      });
    }
  };

  const handleDeleteSetlist = async (setlistId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette setlist ?')) return;

    // Delete all songs in the setlist first
    const songsInSetlist = setlistSongs.filter(ss => ss.setlistId === setlistId);
    for (const setlistSong of songsInSetlist) {
      await deleteSetlistSong(setlistSong.id);
    }

    // Delete the setlist
    await deleteSetlist(setlistId);

    // Clear selection if deleted
    if (selectedSetlist?.id === setlistId) {
      setSelectedSetlist(null);
    }
  };

  const handleAddSongToSetlist = async (songId) => {
    if (!selectedSetlist) return;

    // Check if song already in setlist
    const existingSong = setlistSongs.find(
      ss => ss.setlistId === selectedSetlist.id && ss.songId === songId
    );
    if (existingSong) {
      alert('Ce titre est déjà dans la setlist');
      return;
    }

    // Get next position
    const songsInSetlist = setlistSongs.filter(ss => ss.setlistId === selectedSetlist.id);
    const nextPosition = songsInSetlist.length;

    const newSetlistSong = {
      id: `${selectedSetlist.id}_${songId}_${Date.now()}`,
      setlistId: selectedSetlist.id,
      songId,
      position: nextPosition
    };

    await addSetlistSong(newSetlistSong);
  };

  const handleRemoveSong = async (setlistSongId) => {
    await deleteSetlistSong(setlistSongId);

    // Reorder remaining songs
    const remainingSongs = setlistSongs
      .filter(ss => ss.setlistId === selectedSetlist.id && ss.id !== setlistSongId)
      .sort((a, b) => a.position - b.position);

    const updates = remainingSongs.map((song, index) => ({
      id: song.id,
      position: index
    }));

    if (updates.length > 0) {
      await updateSetlistSongPositions(updates);
    }
  };

  const handleReorder = async (positionUpdates) => {
    await updateSetlistSongPositions(positionUpdates);
  };

  const openEditForm = (setlist) => {
    setEditingSetlist(setlist);
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingSetlist(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSetlist(null);
  };

  const handleExportToPDF = () => {
    if (!selectedSetlist) return;
    exportSetlistToPDF(
      selectedSetlist,
      setlistSongs,
      songs,
      participations,
      instrumentSlots,
      users
    );
  };

  // Get songs for selected setlist
  const selectedSetlistSongs = selectedSetlist
    ? setlistSongs.filter(ss => ss.setlistId === selectedSetlist.id)
    : [];

  // Get available songs (songs not in current setlist)
  const availableSongs = selectedSetlist
    ? songs.filter(song =>
        !setlistSongs.some(ss => ss.setlistId === selectedSetlist.id && ss.songId === song.id)
      )
    : [];

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">📋 Setlists</h1>
              <p className="text-purple-100">Créez et gérez vos setlists de concert</p>
            </div>
            <button
              onClick={openCreateForm}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition shadow-lg"
            >
              + Nouvelle setlist
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setlists List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Mes setlists</h2>

              {setlists.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Aucune setlist créée
                </p>
              ) : (
                <div className="space-y-2">
                  {setlists.map(setlist => {
                    const songCount = setlistSongs.filter(ss => ss.setlistId === setlist.id).length;
                    const isSelected = selectedSetlist?.id === setlist.id;

                    return (
                      <div
                        key={setlist.id}
                        className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSetlist(setlist)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{setlist.name}</h3>
                            {setlist.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {setlist.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {songCount} titre{songCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(setlist);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm p-1"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSetlist(setlist.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm p-1"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Setlist Details */}
          <div className="lg:col-span-2">
            {selectedSetlist ? (
              <div className="bg-white rounded-lg shadow-lg">
                {/* Setlist Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedSetlist.name}</h2>
                      {selectedSetlist.description && (
                        <p className="text-gray-600 mt-2">{selectedSetlist.description}</p>
                      )}
                    </div>
                    <button
                      onClick={handleExportToPDF}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 ml-4"
                      title="Exporter en PDF"
                    >
                      <span>📄</span>
                      <span>Exporter PDF</span>
                    </button>
                  </div>
                </div>

                {/* Add Songs Section */}
                <div className="border-b border-gray-200 p-6 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Ajouter des titres</h3>

                  {availableSongs.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {availableSongs.slice(0, 20).map(song => {
                        const isPlayable = isSongPlayable(song.id, participations);
                        return (
                          <div
                            key={song.id}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900">{song.title}</div>
                                {isPlayable && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                    ✓ Jouable
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">{song.artist || '-'}</div>
                            </div>
                            <button
                              onClick={() => handleAddSongToSetlist(song.id)}
                              className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition text-sm"
                            >
                              + Ajouter
                            </button>
                          </div>
                        );
                      })}
                      {availableSongs.length > 20 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          ... et {availableSongs.length - 20} titre(s) de plus
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Tous les titres sont déjà dans cette setlist</p>
                  )}
                </div>

                {/* Setlist Table */}
                <div className="p-6">
                  <SetlistTable
                    setlistSongs={selectedSetlistSongs}
                    allSongs={songs}
                    participations={participations}
                    instrumentSlots={instrumentSlots}
                    users={users}
                    artists={artists}
                    onReorder={handleReorder}
                    onRemoveSong={handleRemoveSong}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Sélectionnez une setlist
                </h3>
                <p className="text-gray-500">
                  Choisissez une setlist dans la liste de gauche ou créez-en une nouvelle
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <SetlistForm
          onSubmit={editingSetlist ? handleUpdateSetlist : handleCreateSetlist}
          onClose={closeForm}
          initialSetlist={editingSetlist}
        />
      )}
    </div>
  );
};

export default SetlistsView;
