import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';

const ArtistsView = ({ artists, instrumentSlots, onAddArtist, onUpdateArtist, onDeleteArtist }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    selectedInstruments: []
  });

  const handleOpenForm = (artist = null) => {
    if (artist) {
      setEditingArtist(artist);
      setFormData({
        name: artist.name,
        selectedInstruments: artist.instruments.map(inst => inst.slotId)
      });
    } else {
      setEditingArtist(null);
      setFormData({
        name: '',
        selectedInstruments: []
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingArtist(null);
    setFormData({
      name: '',
      selectedInstruments: []
    });
  };

  const handleToggleInstrument = (slotId) => {
    setFormData(prev => ({
      ...prev,
      selectedInstruments: prev.selectedInstruments.includes(slotId)
        ? prev.selectedInstruments.filter(id => id !== slotId)
        : [...prev.selectedInstruments, slotId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom de l\'artiste est requis');
      return;
    }

    if (formData.selectedInstruments.length === 0) {
      alert('Veuillez sélectionner au moins un instrument');
      return;
    }

    const artistData = {
      name: formData.name.trim(),
      instruments: formData.selectedInstruments.map(slotId => ({ slotId })),
      updatedAt: new Date().toISOString()
    };

    if (editingArtist) {
      await onUpdateArtist(editingArtist.id, artistData);
    } else {
      await onAddArtist({
        ...artistData,
        id: `artist_${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }

    handleCloseForm();
  };

  const handleDelete = async (artistId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet artiste ?')) {
      await onDeleteArtist(artistId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Artistes
            </h2>
            <p className="text-sm text-purple-100 mt-1">
              {artists.length} artiste{artists.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des artistes */}
      <div className="flex-1 overflow-y-auto p-4">
        {artists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucun artiste enregistré</p>
            <button
              onClick={() => handleOpenForm()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Ajouter mon premier artiste
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map(artist => (
              <div
                key={artist.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{artist.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenForm(artist)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(artist.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {artist.instruments.map(inst => {
                    const slot = instrumentSlots.find(s => s.id === inst.slotId);
                    return slot ? (
                      <span
                        key={inst.slotId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                      >
                        <span className="mr-1">{slot.icon}</span>
                        {slot.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingArtist ? 'Modifier l\'artiste' : 'Nouvel artiste'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'artiste *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: John Doe"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruments *
                </label>
                <div className="space-y-2">
                  {instrumentSlots.map(slot => (
                    <label
                      key={slot.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedInstruments.includes(slot.id)}
                        onChange={() => handleToggleInstrument(slot.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="ml-3 flex items-center">
                        <span className="mr-2">{slot.icon}</span>
                        <span className="text-sm">{slot.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingArtist ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistsView;
