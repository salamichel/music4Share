import React, { useState } from 'react';
import { X } from 'lucide-react';

const UserSettings = ({ currentUser, instrumentSlots, onUpdateInstrument, onClose }) => {
  const [selectedInstrument, setSelectedInstrument] = useState(currentUser.instrument);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedInstrument !== currentUser.instrument) {
      onUpdateInstrument(selectedInstrument);
    }
    onClose();
  };

  const currentSlot = instrumentSlots.find(slot => slot.id === currentUser.instrument);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Paramètres du profil</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom d'utilisateur (non modifiable) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Le nom d'utilisateur ne peut pas être modifié
            </p>
          </div>

          {/* Instrument actuel */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Instrument actuel
            </label>
            <div className="px-3 py-2 border rounded-lg bg-copper-50 text-copper-800 font-medium">
              {currentSlot ? `${currentSlot.icon} ${currentSlot.name}` : currentUser.instrument}
            </div>
          </div>

          {/* Nouvel instrument */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Changer d'instrument
            </label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-copper-500"
              required
            >
              {[...instrumentSlots].sort((a, b) => a.name.localeCompare(b.name)).map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.icon} {slot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-copper-600 text-white py-2 rounded-lg hover:bg-copper-700 transition"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;
