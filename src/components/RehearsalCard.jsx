import { useState } from 'react';
import { Calendar, Clock, MapPin, Music, FileText, Users, Edit2, Trash2, Copy, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, UserCheck } from 'lucide-react';
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
  onClone,
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

  const artistStats = getArtistAttendanceStats();

  // Get type badge color
  const getTypeBadge = () => {
    switch (rehearsal.type) {
      case 'performance':
        return 'bg-purple-100 text-purple-800';
      case 'meeting':
        return 'bg-yellow-100 text-yellow-800';
      case 'apero':
        return 'bg-orange-100 text-orange-800';
      case 'installation':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = () => {
    switch (rehearsal.type) {
      case 'performance':
        return '🎭 Spectacle';
      case 'meeting':
        return '💼 Réunion';
      case 'apero':
        return '🍻 Apéro';
      case 'installation':
        return '🔧 Installation';
      default:
        return '🎵 Répétition';
    }
  };

  // Check if user can edit/delete
  const canModify = currentUser?.id === rehearsal.createdBy || currentUser?.id === group?.creatorId;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${isPast ? 'border-gray-200 opacity-75' : 'border-gray-300'} hover:shadow-md transition`}>
      {/* Main Content */}
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Left side - Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
              <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-medium ${getTypeBadge()}`}>
                {getTypeLabel()}
              </span>
              {isPast && (
                <span className="px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-medium bg-gray-100 text-gray-600">
                  Terminée
                </span>
              )}
            </div>

            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 truncate">
              {rehearsal.title}
            </h3>

            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600 mb-1.5 md:mb-2">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-medium truncate">{group?.name || 'Groupe inconnu'}</span>
            </div>

            {/* Date, Time, Location */}
            <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="capitalize text-[11px] md:text-sm">{formatDate(rehearsalDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="text-[11px] md:text-sm">{formatTime(rehearsalDate)} • {formatDuration(rehearsal.duration)}</span>
              </div>
              {rehearsal.location && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="text-[11px] md:text-sm truncate">{rehearsal.location}</span>
                </div>
              )}
              {setlist && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Music className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="text-[11px] md:text-sm truncate">Setlist: {setlist.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions and Attendance */}
          <div className="flex flex-col items-end gap-1 md:gap-2">
            {/* Action buttons */}
            {canModify && (
              <div className="flex gap-0.5 md:gap-1">
                <button
                  onClick={() => onEdit(rehearsal)}
                  className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => onClone(rehearsal)}
                  className="p-1.5 md:p-2 text-green-600 hover:bg-green-50 rounded transition"
                  title="Cloner"
                >
                  <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => onDelete(rehearsal.id)}
                  className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            )}

            {/* Artist Attendance Button - Compact on mobile */}
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="mt-1 md:mt-3 flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-xs md:text-sm"
              title="Gérer les présences des artistes"
            >
              <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {/* Hide text on mobile, show only icon and badge */}
              <span className="hidden sm:inline">Présences</span>
              {artistStats.total > 0 && (
                <span className="px-1.5 py-0.5 md:px-2 bg-purple-200 rounded-full text-[10px] md:text-xs font-medium">
                  {artistStats.confirmed}/{artistStats.total}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Artist Attendance List - Always visible */}
        {rehearsal.artistAttendees && Object.keys(rehearsal.artistAttendees).length > 0 && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-100">
            <h4 className="text-[10px] md:text-xs font-medium text-gray-500 mb-1.5 md:mb-2 flex items-center gap-1">
              <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
              Présences
            </h4>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {Object.values(rehearsal.artistAttendees).map(attendee => {
                const artist = artists.find(a => a.id === attendee.userId);
                if (!artist) return null;

                return (
                  <div
                    key={attendee.userId}
                    className="flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs bg-gray-50 border border-gray-200"
                  >
                    {attendee.status === 'confirmed' && <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-600" />}
                    {attendee.status === 'tentative' && <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-600" />}
                    {attendee.status === 'declined' && <XCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-600" />}
                    <span className="text-gray-700">{artist.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description preview */}
        {rehearsal.description && !expanded && (
          <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 line-clamp-2">
            {rehearsal.description}
          </p>
        )}

        {/* Expand/Collapse button */}
        {(rehearsal.description || rehearsal.notes) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-700 mt-1.5 md:mt-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
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
