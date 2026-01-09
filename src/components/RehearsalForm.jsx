import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Music, FileText, Users } from 'lucide-react';

const RehearsalForm = ({ rehearsal, groups, setlists, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    groupId: '',
    dateTime: '',
    location: '',
    duration: 120, // minutes
    type: 'practice',
    setlistId: '',
    notes: ''
  });

  useEffect(() => {
    if (rehearsal) {
      setFormData({
        title: rehearsal.title || '',
        description: rehearsal.description || '',
        groupId: rehearsal.groupId || '',
        dateTime: rehearsal.dateTime || '',
        location: rehearsal.location || '',
        duration: rehearsal.duration || 120,
        type: rehearsal.type || 'practice',
        setlistId: rehearsal.setlistId || '',
        notes: rehearsal.notes || ''
      });
    } else {
      // Set default group if only one available
      if (groups.length === 1) {
        setFormData(prev => ({ ...prev, groupId: groups[0].id }));
      }
    }
  }, [rehearsal, groups]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.groupId || !formData.dateTime) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get setlists for selected group
  const groupSetlists = setlists.filter(s => {
    // Assuming setlists might not have groupId, show all for now
    // You may want to add groupId to setlists in the future
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            {rehearsal ? 'Modifier la répétition' : 'Nouvelle répétition'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Répétition hebdomadaire"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupe <span className="text-red-500">*</span>
            </label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un groupe</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date et heure <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Lieu
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ex: Studio A, 123 rue de la musique"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de répétition
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="practice">Répétition</option>
              <option value="performance">Spectacle</option>
              <option value="meeting">Réunion</option>
            </select>
          </div>

          {/* Setlist */}
          {groupSetlists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Music className="w-4 h-4" />
                Setlist (optionnel)
              </label>
              <select
                name="setlistId"
                value={formData.setlistId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucune setlist</option>
                {groupSetlists.map(setlist => (
                  <option key={setlist.id} value={setlist.id}>
                    {setlist.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Décrivez l'objectif de cette répétition..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Notes supplémentaires, choses à préparer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              {rehearsal ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RehearsalForm;
