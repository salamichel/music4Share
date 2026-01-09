import { useState } from 'react';
import { Calendar, Clock, MapPin, Music, Plus, Trash2, Edit2, Users, CheckCircle, XCircle, AlertCircle, List, CalendarDays } from 'lucide-react';
import {
  addRehearsal,
  updateRehearsal,
  deleteRehearsal,
  updateRehearsalAttendance
} from '../firebase/firebaseHelpers';
import RehearsalForm from './RehearsalForm';
import RehearsalCard from './RehearsalCard';
import CalendarView from './CalendarView';

const RehearsalView = ({
  rehearsals,
  groups,
  users,
  setlists,
  songs,
  artists,
  instrumentSlots,
  currentUser
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, past, all
  const [displayMode, setDisplayMode] = useState('list'); // list, calendar

  // Get user's groups
  const userGroups = groups.filter(g =>
    g.memberIds?.includes(currentUser?.id) || g.creatorId === currentUser?.id
  );

  // Filter rehearsals
  const getFilteredRehearsals = () => {
    let filtered = rehearsals;

    // Filter by group
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(r => r.groupId === selectedGroup);
    } else {
      // Show only rehearsals from user's groups
      const userGroupIds = userGroups.map(g => g.id);
      filtered = filtered.filter(r => userGroupIds.includes(r.groupId));
    }

    // Filter by time
    const now = new Date();
    if (viewMode === 'upcoming') {
      filtered = filtered.filter(r => new Date(r.dateTime) >= now);
    } else if (viewMode === 'past') {
      filtered = filtered.filter(r => new Date(r.dateTime) < now);
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return viewMode === 'past' ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredRehearsals = getFilteredRehearsals();

  const handleCreateRehearsal = async (data) => {
    const newRehearsal = {
      id: Date.now().toString(),
      ...data,
      artistAttendees: {}, // Will be populated as artists are marked
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addRehearsal(newRehearsal);
    setShowForm(false);
  };

  const handleUpdateRehearsal = async (data) => {
    if (!editingRehearsal) return;

    await updateRehearsal(editingRehearsal.id, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    setEditingRehearsal(null);
    setShowForm(false);
  };

  const handleDeleteRehearsal = async (rehearsalId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette répétition ?')) return;
    await deleteRehearsal(rehearsalId);
  };

  const handleAttendanceUpdate = async (rehearsalId, userId, status, type = 'artist') => {
    await updateRehearsalAttendance(rehearsalId, userId, status, '', type);
  };

  const openEditForm = (rehearsal) => {
    setEditingRehearsal(rehearsal);
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingRehearsal(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRehearsal(null);
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Groupe inconnu';
  };

  const getSetlistName = (setlistId) => {
    if (!setlistId) return null;
    const setlist = setlists.find(s => s.id === setlistId);
    return setlist?.name;
  };

  const getAttendanceStats = (rehearsal) => {
    if (!rehearsal.attendees || typeof rehearsal.attendees !== 'object') {
      return { confirmed: 0, tentative: 0, declined: 0, pending: 0 };
    }

    const attendeesList = Object.values(rehearsal.attendees);
    return {
      confirmed: attendeesList.filter(a => a.status === 'confirmed').length,
      tentative: attendeesList.filter(a => a.status === 'tentative').length,
      declined: attendeesList.filter(a => a.status === 'declined').length,
      pending: 0 // Could calculate based on group members
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Gestion des événements
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos événements et suivez les présences</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDisplayMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                displayMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
            <button
              onClick={() => setDisplayMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                displayMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendrier
            </button>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Group filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupe
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous mes groupes</option>
              {userGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="upcoming">À venir</option>
              <option value="past">Passées</option>
              <option value="all">Toutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content - List or Calendar */}
      {displayMode === 'list' ? (
        <div className="space-y-4">
          {filteredRehearsals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {viewMode === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement trouvé'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Créez votre premier événement pour commencer
              </p>
              <button
                onClick={openCreateForm}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Créer un événement
              </button>
            </div>
          ) : (
            filteredRehearsals.map(rehearsal => (
              <RehearsalCard
                key={rehearsal.id}
                rehearsal={rehearsal}
                currentUser={currentUser}
                groups={groups}
                setlists={setlists}
                users={users}
                artists={artists}
                instrumentSlots={instrumentSlots}
                onEdit={openEditForm}
                onDelete={handleDeleteRehearsal}
                onAttendanceUpdate={handleAttendanceUpdate}
              />
            ))
          )}
        </div>
      ) : (
        <CalendarView
          events={filteredRehearsals}
          onEventClick={(event) => openEditForm(event)}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <RehearsalForm
          rehearsal={editingRehearsal}
          groups={userGroups}
          setlists={setlists}
          onSubmit={editingRehearsal ? handleUpdateRehearsal : handleCreateRehearsal}
          onClose={closeForm}
        />
      )}
    </div>
  );
};

export default RehearsalView;
