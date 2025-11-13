import React, { useState } from 'react';

const SlotManager = ({ instrumentSlots, onAddSlot, onDeleteSlot, onClose }) => {
  const [newSlot, setNewSlot] = useState({ name: '', icon: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSlot(newSlot);
    setNewSlot({ name: '', icon: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Gérer les emplacements d'instruments</h3>
        
        {/* Liste des emplacements actuels */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Emplacements disponibles</h4>
          <div className="space-y-2">
            {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{slot.icon}</span>
                  <span className="font-medium">{slot.name}</span>
                </div>
                {!['drums', 'vocals', 'bass', 'guitar', 'choir', 'piano'].includes(slot.id) && (
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ajouter un nouvel emplacement */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Ajouter un nouvel emplacement</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l'instrument</label>
              <input
                type="text"
                value={newSlot.name}
                onChange={(e) => setNewSlot({...newSlot, name: e.target.value})}
                placeholder="Ex: Saxophone, Violon..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emoji (optionnel)</label>
              <input
                type="text"
                value={newSlot.icon}
                onChange={(e) => setNewSlot({...newSlot, icon: e.target.value})}
                placeholder="Ex: 🎷, 🎻, 🎺"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength="2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Fermer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SlotManager;
