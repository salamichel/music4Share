import React from 'react';
import { Music, LogOut, Search } from 'lucide-react';

const Header = ({ currentUser, onLogout, searchTerm, onSearchChange, onOpenSlotManager, instrumentSlots }) => {
  // Trouver le slot de l'utilisateur pour afficher le nom lisible
  const userSlot = instrumentSlots.find(slot => slot.id === currentUser.instrument);
  const instrumentDisplay = userSlot ? `${userSlot.icon} ${userSlot.name}` : currentUser.instrument;

  return (
    <div className="bg-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Music className="w-8 h-8 mr-2" />
            <h1 className="text-2xl font-bold">Music4Chalemine</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSlotManager}
              className="bg-purple-700 px-3 py-2 rounded-lg hover:bg-purple-800 text-sm"
            >
              ⚙️ Emplacements
            </button>
            <span className="font-medium">{currentUser.username} ({instrumentDisplay})</span>
            <button onClick={onLogout} className="bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Recherche */}
        <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
          <Search className="w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Rechercher un titre ou artiste..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent flex-1 outline-none placeholder-white/70 text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
