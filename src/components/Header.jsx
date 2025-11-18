import React from 'react';
import { Music, LogOut, Search, Settings } from 'lucide-react';

const Header = ({ currentUser, onLogout, searchTerm, onSearchChange, onOpenSlotManager, onOpenUserSettings, instrumentSlots }) => {
  // Trouver le slot de l'utilisateur pour afficher le nom lisible
  const userSlot = instrumentSlots.find(slot => slot.id === currentUser.instrument);
  const instrumentDisplay = userSlot ? `${userSlot.icon} ${userSlot.name}` : currentUser.instrument;

  return (
    <div className="bg-white border-b-4 border-copper-500 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-center">
            <Music className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-copper-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Music4Chalemine</h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <button
              onClick={onOpenSlotManager}
              className="border-2 border-copper-400 text-copper-700 hover:bg-copper-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium"
              title="Emplacements"
            >
              <span className="hidden sm:inline">⚙️ Emplacements</span>
              <span className="sm:hidden">⚙️</span>
            </button>
            <button
              onClick={onOpenUserSettings}
              className="border-2 border-copper-400 text-copper-700 hover:bg-copper-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition flex items-center gap-1 sm:gap-2"
              title="Paramètres du profil"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden md:inline font-medium">Profil</span>
            </button>
            <span className="font-medium text-xs sm:text-sm text-gray-600 hidden lg:inline">{currentUser.username} ({instrumentDisplay})</span>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white hover:bg-red-600 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex items-center bg-gray-100 border-2 border-gray-300 focus-within:border-copper-400 rounded-lg px-3 sm:px-4 py-2 transition">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un titre ou artiste..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent flex-1 outline-none placeholder-gray-500 text-gray-800 text-sm sm:text-base"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
