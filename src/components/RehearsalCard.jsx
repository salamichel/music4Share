import { useState } from 'react';
import { Calendar, Clock, MapPin, Music, FileText, Users, Edit2, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import AttendanceManager from './AttendanceManager';

const RehearsalCard = ({
  rehearsal,
  currentUser,
  groups,
  setlists,
  users,
  artists,
  instrumentSlots,
  onEdit,
  onDelete,
  onAttendanceUpdate
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Get group info
  const group = groups.find(g => g.id === rehearsal.groupId);

  // Get setlist info
  const setlist = setlists.find(s => s.id === rehearsal.setlistId);

  // Format date and time
  const rehearsalDate = new Date(rehearsal.dateTime);
  const isPast = rehearsalDate < new Date();

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h${mins}`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins} min`;
  };

  // Get user's attendance status
  const userAttendance = rehearsal.attendees?.[currentUser?.id];
  const userStatus = userAttendance?.status || 'pending';

  // Get attendance stats
  const getAttendanceStats = () => {
    if (!rehearsal.attendees || typeof rehearsal.attendees !== 'object') {
      return { confirmed: 0, tentative: 0, declined: 0 };
    }

    const attendeesList = Object.values(rehearsal.attendees);
    return {
      confirmed: attendeesList.filter(a => a.status === 'confirmed').length,
      tentative: attendeesList.filter(a => a.status === 'tentative').length,
      declined: attendeesList.filter(a => a.status === 'declined').length
    };
  };

  // Get artist attendance stats
  const getArtistAttendanceStats = () => {
    if (!rehearsal.artistAttendees || typeof rehearsal.artistAttendees !== 'object') {
      return { confirmed: 0, tentative: 0, declined: 0, total: 0 };
    }

    const attendeesList = Object.values(rehearsal.artistAttendees);
    return {
      confirmed: attendeesList.filter(a => a.status === 'confirmed').length,
      tentative: attendeesList.filter(a => a.status === 'tentative').length,
      declined: attendeesList.filter(a => a.status === 'declined').length,
      total: attendeesList.length
    };
  };

  const stats = getAttendanceStats();
  const artistStats = getArtistAttendanceStats();

  // Get type badge color
  const getTypeBadge = () => {
    switch (rehearsal.type) {
      case 'performance':
        return 'bg-purple-100 text-purple-800';
      case 'meeting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = () => {
    switch (rehearsal.type) {
      case 'performance':
        return 'Spectacle';
      case 'meeting':
        return 'Réunion';
      default:
        return 'Répétition';
    }
  };

  const handleAttendance = (status) => {
    onAttendanceUpdate(rehearsal.id, status, '');
    setShowAttendanceModal(false);
  };

  // Check if user can edit/delete
  const canModify = currentUser?.id === rehearsal.createdBy || currentUser?.id === group?.creatorId;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${isPast ? 'border-gray-200 opacity-75' : 'border-gray-300'} hover:shadow-md transition`}>
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Main info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge()}`}>
                {getTypeLabel()}
              </span>
              {isPast && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Terminée
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {rehearsal.title}
            </h3>

            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">{group?.name || 'Groupe inconnu'}</span>
            </div>

            {/* Date, Time, Location */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="capitalize">{formatDate(rehearsalDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(rehearsalDate)} • {formatDuration(rehearsal.duration)}</span>
              </div>
              {rehearsal.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{rehearsal.location}</span>
                </div>
              )}
              {setlist && (
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>Setlist: {setlist.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions and Attendance */}
          <div className="flex flex-col items-end gap-2">
            {/* Action buttons */}
            {canModify && (
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(rehearsal)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(rehearsal.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* User's attendance status */}
            {!isPast && (
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => handleAttendance('confirmed')}
                  className={`p-2 rounded transition ${
                    userStatus === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                  }`}
                  title="Je serai présent"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAttendance('tentative')}
                  className={`p-2 rounded transition ${
                    userStatus === 'tentative'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                  }`}
                  title="Peut-être"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAttendance('declined')}
                  className={`p-2 rounded transition ${
                    userStatus === 'declined'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                  }`}
                  title="Je ne serai pas là"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Attendance stats */}
            <div className="flex items-center gap-2 text-xs mt-2">
              {stats.confirmed > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  {stats.confirmed}
                </span>
              )}
              {stats.tentative > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="w-3 h-3" />
                  {stats.tentative}
                </span>
              )}
              {stats.declined > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-3 h-3" />
                  {stats.declined}
                </span>
              )}
            </div>

            {/* Artist Attendance Button */}
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm"
              title="Gérer les présences des artistes"
            >
              <UserCheck className="w-4 h-4" />
              <span>Présences artistes</span>
              {artistStats.total > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-purple-200 rounded-full text-xs font-medium">
                  {artistStats.confirmed}/{artistStats.total}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Description preview */}
        {rehearsal.description && !expanded && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {rehearsal.description}
          </p>
        )}

        {/* Expand/Collapse button */}
        {(rehearsal.description || rehearsal.notes) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Voir plus
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {rehearsal.description && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {rehearsal.description}
              </p>
            </div>
          )}

          {rehearsal.notes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Notes
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {rehearsal.notes}
              </p>
            </div>
          )}

          {/* Attendees list */}
          {rehearsal.attendees && Object.keys(rehearsal.attendees).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Présences utilisateurs</h4>
              <div className="space-y-1">
                {Object.values(rehearsal.attendees).map(attendee => {
                  const user = users.find(u => u.id === attendee.userId);
                  if (!user) return null;

                  return (
                    <div key={attendee.userId} className="flex items-center gap-2 text-sm">
                      {attendee.status === 'confirmed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {attendee.status === 'tentative' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      {attendee.status === 'declined' && <XCircle className="w-4 h-4 text-red-600" />}
                      <span className="text-gray-700">{user.username}</span>
                      {attendee.notes && (
                        <span className="text-gray-500 text-xs">• {attendee.notes}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artist Attendees list */}
          {rehearsal.artistAttendees && Object.keys(rehearsal.artistAttendees).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Présences artistes</h4>
              <div className="space-y-1">
                {Object.values(rehearsal.artistAttendees).map(attendee => {
                  const artist = artists.find(a => a.id === attendee.userId);
                  if (!artist) return null;

                  return (
                    <div key={attendee.userId} className="flex items-center gap-2 text-sm">
                      {attendee.status === 'confirmed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {attendee.status === 'tentative' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      {attendee.status === 'declined' && <XCircle className="w-4 h-4 text-red-600" />}
                      <span className="text-gray-700">{artist.name}</span>
                      {attendee.notes && (
                        <span className="text-gray-500 text-xs">• {attendee.notes}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Manager Modal */}
      {showAttendanceModal && (
        <AttendanceManager
          rehearsal={rehearsal}
          group={group}
          artists={artists}
          instrumentSlots={instrumentSlots}
          onUpdateAttendance={onAttendanceUpdate}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}
    </div>
  );
};

export default RehearsalCard;
