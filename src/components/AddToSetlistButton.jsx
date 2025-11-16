import { useState, useRef, useEffect } from 'react';
import { addSetlistSong } from '../firebase/firebaseHelpers';
import { toast } from 'react-toastify';

const AddToSetlistButton = ({ songId, setlists, setlistSongs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddToSetlist = async (setlist) => {
    // Check if song already in setlist
    const existingSong = setlistSongs.find(
      ss => ss.setlistId === setlist.id && ss.songId === songId
    );

    if (existingSong) {
      toast.warning(`Ce titre est déjà dans "${setlist.name}"`);
      setIsOpen(false);
      return;
    }

    // Get next position
    const songsInSetlist = setlistSongs.filter(ss => ss.setlistId === setlist.id);
    const nextPosition = songsInSetlist.length;

    const newSetlistSong = {
      id: `${setlist.id}_${songId}_${Date.now()}`,
      setlistId: setlist.id,
      songId,
      position: nextPosition
    };

    try {
      await addSetlistSong(newSetlistSong);
      toast.success(`Ajouté à "${setlist.name}"`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout à la setlist');
      console.error(error);
    }
  };

  if (setlists.length === 0) {
    return null; // Don't show button if no setlists
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition text-sm flex items-center gap-1"
        title="Ajouter à une setlist"
      >
        <span>📋</span>
        <span>Setlist</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-48 max-h-64 overflow-y-auto">
          <div className="py-1">
            {setlists.map(setlist => {
              const isInSetlist = setlistSongs.some(
                ss => ss.setlistId === setlist.id && ss.songId === songId
              );

              return (
                <button
                  key={setlist.id}
                  onClick={() => handleAddToSetlist(setlist)}
                  disabled={isInSetlist}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    isInSetlist
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-purple-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{setlist.name}</div>
                  {isInSetlist && (
                    <div className="text-xs text-gray-500">✓ Déjà ajouté</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToSetlistButton;
