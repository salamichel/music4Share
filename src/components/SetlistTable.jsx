import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { calculateSetlistDuration } from '../firebase/firebaseHelpers';
import { isSongPlayable } from '../utils/helpers';

const SetlistTable = ({
  setlistSongs,
  allSongs,
  participations,
  instrumentSlots,
  users,
  onReorder,
  onRemoveSong
}) => {
  // Sort setlistSongs by position
  const sortedSetlistSongs = [...setlistSongs].sort((a, b) => a.position - b.position);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Create new array with reordered items
    const reordered = Array.from(sortedSetlistSongs);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    // Update positions
    const updates = reordered.map((item, index) => ({
      id: item.id,
      position: index
    }));

    onReorder(updates);
  };

  const getSongById = (songId) => {
    return allSongs.find(s => s.id === songId);
  };

  const getParticipantsForSong = (songId) => {
    const songParticipations = participations.filter(p => p.songId === songId);

    // Group by slot
    const slotMap = {};
    songParticipations.forEach(participation => {
      const slot = instrumentSlots.find(s => s.id === participation.slotId);
      const user = users.find(u => u.id === participation.userId);

      if (slot && user) {
        if (!slotMap[slot.id]) {
          slotMap[slot.id] = {
            slot,
            users: []
          };
        }
        slotMap[slot.id].users.push(user);
      }
    });

    return Object.values(slotMap);
  };

  const totalDuration = calculateSetlistDuration(sortedSetlistSongs, allSongs);

  if (sortedSetlistSongs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun titre dans cette setlist. Ajoutez des titres pour commencer.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-100 border-b-2 border-purple-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Titre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Artiste</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Durée</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Instruments / Participants</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <Droppable droppableId="setlist-songs">
            {(provided) => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {sortedSetlistSongs.map((setlistSong, index) => {
                  const song = getSongById(setlistSong.songId);
                  const participants = getParticipantsForSong(setlistSong.songId);
                  const isPlayable = isSongPlayable(setlistSong.songId, participations);

                  if (!song) return null;

                  return (
                    <Draggable
                      key={setlistSong.id}
                      draggableId={setlistSong.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`border-b border-gray-200 hover:bg-purple-50 transition ${
                            snapshot.isDragging ? 'bg-purple-100 shadow-lg' : 'bg-white'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">{song.title}</div>
                              {isPlayable && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                  ✓ Jouable
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {song.artist || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {song.duration || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {participants.length > 0 ? (
                                participants.map(({ slot, users }) => (
                                  <div
                                    key={slot.id}
                                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                                  >
                                    <span>{slot.icon}</span>
                                    <span className="text-gray-700">
                                      {users.map(u => u.username).join(', ')}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">Aucun participant</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => onRemoveSong(setlistSong.id)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Retirer de la setlist"
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>

          {/* Total row */}
          <tfoot>
            <tr className="bg-purple-50 font-semibold border-t-2 border-purple-200">
              <td className="px-4 py-3" colSpan="3">
                Total
              </td>
              <td className="px-4 py-3 text-sm">
                {totalDuration}
              </td>
              <td className="px-4 py-3" colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </DragDropContext>
    </div>
  );
};

export default SetlistTable;
