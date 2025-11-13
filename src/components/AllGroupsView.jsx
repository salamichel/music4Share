import React from 'react';
import { Users, UserPlus } from 'lucide-react';

const AllGroupsView = ({ 
  groups,
  songs,
  onJoinGroup
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Tous les Groupes
        </h2>
        <p className="text-sm text-green-100 mt-1">
          {groups.length} groupe{groups.length > 1 ? 's' : ''} disponible{groups.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {groups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun groupe disponible</p>
        ) : (
          <div className="grid gap-4">
            {groups.map(group => {
              const groupSongs = songs.filter(s => s.ownerGroupId === group.id);
              
              return (
                <div 
                  key={group.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.style}</p>
                    </div>
                    <button
                      onClick={() => onJoinGroup(group.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Rejoindre
                    </button>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>👥 {group.memberIds.length} membres</span>
                    <span>🎵 {groupSongs.length} titres</span>
                  </div>

                  {/* Preview des titres */}
                  {groupSongs.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Titres du répertoire :</p>
                      <div className="text-sm text-gray-700">
                        {groupSongs.slice(0, 3).map(song => (
                          <div key={song.id} className="truncate">
                            • {song.title} - {song.artist}
                          </div>
                        ))}
                        {groupSongs.length > 3 && (
                          <div className="text-gray-500 text-xs mt-1">
                            +{groupSongs.length - 3} autre{groupSongs.length - 3 > 1 ? 's' : ''}...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllGroupsView;
