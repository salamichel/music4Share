import React from 'react';
import { Youtube } from 'lucide-react';
import { isSongPlayable } from '../utils/helpers';

const SongCard = ({ 
  song, 
  participations, 
  instrumentSlots, 
  users, 
  currentUser, 
  onJoinSlot, 
  onLeaveSlot 
}) => {
  const songParticipations = participations.filter(p => p.songId === song.id);
  const isPlayable = isSongPlayable(song.id, participations);
  
  return (
    <div className={`border-b last:border-b-0 py-3 px-2 ${isPlayable ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold">{song.title}</h4>
          <p className="text-sm text-gray-600">{song.artist}</p>
          {song.youtubeLink && (
            <a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-red-600 text-xs flex items-center mt-1 hover:underline">
              <Youtube className="w-3 h-3 mr-1" />
              YouTube
            </a>
          )}
        </div>
        {isPlayable && (
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">✓ Jouable</span>
        )}
      </div>
      
      {/* Emplacements d'instruments */}
      <div className="flex flex-wrap gap-2 mt-3">
        {instrumentSlots.map(slot => {
          const slotParticipants = songParticipations.filter(p => p.slotId === slot.id);
          const userInSlot = slotParticipants.find(p => p.userId === currentUser.id);
          
          return (
            <div key={slot.id} className="relative">
              <button
                onClick={() => {
                  if (userInSlot) {
                    onLeaveSlot(song.id, slot.id);
                  } else {
                    onJoinSlot(song.id, slot.id);
                  }
                }}
                className={`text-xs px-2 py-1 rounded-full border transition ${
                  userInSlot
                    ? 'bg-purple-600 text-white border-purple-600'
                    : slotParticipants.length > 0
                    ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
                title={slotParticipants.map(p => users.find(u => u.id === p.userId)?.username).join(', ') || 'Libre'}
              >
                <span className="mr-1">{slot.icon}</span>
                {slot.name}
                {slotParticipants.length > 0 && (
                  <span className="ml-1 font-semibold">({slotParticipants.length})</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Liste des participants */}
      {songParticipations.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {instrumentSlots.map(slot => {
            const slotParts = songParticipations.filter(p => p.slotId === slot.id);
            if (slotParts.length === 0) return null;
            return (
              <span key={slot.id} className="mr-3">
                {slot.icon} {slotParts.map(p => users.find(u => u.id === p.userId)?.username).join(', ')}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SongCard;
