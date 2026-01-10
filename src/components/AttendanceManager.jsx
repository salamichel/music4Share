import { useState, useEffect } from 'react';
import { X, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AttendanceManager = ({
  rehearsal,
  group,
  artists,
  instrumentSlots,
  onUpdateAttendance,
  onClose
}) => {
  // Local state to track attendance changes for immediate UI feedback
  const [localAttendance, setLocalAttendance] = useState({});

  // Initialize local attendance from rehearsal data
  useEffect(() => {
    if (rehearsal.artistAttendees) {
      setLocalAttendance(rehearsal.artistAttendees);
    }
  }, [rehearsal.artistAttendees]);

  // Get artists for this group
  const groupArtists = artists.filter(artist => {
    // If artists don't have groupIds, show all artists
    // You might want to add groupIds to artists in the future
    return true;
  });

  const getArtistStatus = (artistId) => {
    if (!localAttendance[artistId]) {
      return 'pending';
    }
    return localAttendance[artistId].status;
  };

  const handleStatusChange = async (artistId, status) => {
    // Update local state immediately for instant UI feedback
    setLocalAttendance(prev => ({
      ...prev,
      [artistId]: {
        userId: artistId,
        status,
        notes: '',
        updatedAt: new Date().toISOString()
      }
    }));

    // Update in Firebase
    await onUpdateAttendance(rehearsal.id, artistId, status, 'artist');
  };

  const getStatusStats = () => {
    if (!localAttendance || Object.keys(localAttendance).length === 0) {
      return { confirmed: 0, tentative: 0, declined: 0, pending: groupArtists.length };
    }

    const attendees = Object.values(localAttendance);
    const confirmed = attendees.filter(a => a.status === 'confirmed').length;
    const tentative = attendees.filter(a => a.status === 'tentative').length;
    const declined = attendees.filter(a => a.status === 'declined').length;
    const pending = groupArtists.length - attendees.length;

    return { confirmed, tentative, declined, pending };
  };

  const stats = getStatusStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gérer les présences
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {rehearsal.title} • {group?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">
                <span className="font-semibold">{stats.confirmed}</span> présent{stats.confirmed > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm">
                <span className="font-semibold">{stats.tentative}</span> peut-être
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm">
                <span className="font-semibold">{stats.declined}</span> absent{stats.declined > 1 ? 's' : ''}
              </span>
            </div>
            {stats.pending > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.pending}</span> en attente
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Artists List */}
        <div className="p-6">
          {groupArtists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Aucun artiste</p>
              <p className="text-gray-400 text-sm">
                Ajoutez des artistes dans l'onglet "Artistes"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupArtists.map(artist => {
                const status = getArtistStatus(artist.id);

                return (
                  <div
                    key={artist.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      {/* Artist Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {artist.name}
                        </h3>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(artist.id, 'confirmed')}
                          className={`p-2 rounded transition ${
                            status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                          title="Présent"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(artist.id, 'tentative')}
                          className={`p-2 rounded transition ${
                            status === 'tentative'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                          }`}
                          title="Peut-être"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(artist.id, 'declined')}
                          className={`p-2 rounded transition ${
                            status === 'declined'
                              ? 'bg-red-100 text-red-700'
                              : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title="Absent"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
