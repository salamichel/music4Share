import React, { useState } from 'react';
import { Users, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import SongAddForm from './SongAddForm';
import SongCard from './SongCard';

const MyGroupsView = ({
  groups,
  songs,
  participations,
  instrumentSlots,
  users,
  currentUser,
  onJoinSlot,
  onLeaveSlot,
  onAddSong,
  onBulkImport,
  onCreateGroup,
  onReenrichSong,
  onDeleteSong,
  enrichingSongs
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Mes Groupes
            </h2>
            <p className="text-sm text-indigo-100 mt-1">
              {groups.length} groupe{groups.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onCreateGroup}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Créer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">Vous ne faites partie d'aucun groupe</p>
            <button
              onClick={onCreateGroup}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Créer mon premier groupe
            </button>
          </div>
        ) : (
          <div>
            {groups.map(group => {
              const groupSongs = songs.filter(s => s.ownerGroupId === group.id);
              const isExpanded = expandedGroupId === group.id;
              
              return (
                <div key={group.id} className="border-b last:border-b-0">
                  {/* En-tête du groupe */}
                  <div
                    onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.style}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {group.memberIds.length} membres · {groupSongs.length} titres
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Contenu du groupe déplié */}
                  {isExpanded && (
                    <div className="bg-gray-50">
                      {/* Formulaire d'ajout */}
                      <SongAddForm
                        groupId={group.id}
                        onAddSong={onAddSong}
                        onBulkImport={onBulkImport}
                        showBulkImport={showBulkImport}
                        onToggleBulkImport={() => setShowBulkImport(!showBulkImport)}
                      />

                      {/* Liste des titres du groupe */}
                      <div className="p-4">
                        {groupSongs.length === 0 ? (
                          <p className="text-gray-500 text-center py-4 text-sm">
                            Aucun titre dans ce groupe
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {groupSongs.map(song => (
                              <SongCard
                                key={song.id}
                                song={song}
                                participations={participations}
                                instrumentSlots={instrumentSlots}
                                users={users}
                                currentUser={currentUser}
                                groups={groups}
                                onJoinSlot={onJoinSlot}
                                onLeaveSlot={onLeaveSlot}
                                onReenrichSong={onReenrichSong}
                                onDeleteSong={onDeleteSong}
                                isEnriching={enrichingSongs.has(song.id)}
                              />
                            ))}
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

export default MyGroupsView;
