import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ events, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Adjust to start on Monday (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  // Generate calendar grid
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];

    const dateToCheck = new Date(year, month, day);

    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Get event color based on type
  const getEventColor = (type) => {
    switch (type) {
      case 'performance':
        return 'bg-purple-500';
      case 'meeting':
        return 'bg-yellow-500';
      case 'apero':
        return 'bg-orange-500';
      case 'installation':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Format month name
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition"
            >
              Aujourd'hui
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-white/20 rounded transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white/20 rounded transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border rounded-lg ${
                  day
                    ? isTodayDate
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 border-transparent'
                } transition`}
              >
                {day && (
                  <>
                    {/* Day number */}
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isTodayDate
                          ? 'text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => onEventClick && onEventClick(event)}
                          className={`w-full text-left px-2 py-1 rounded text-xs font-medium text-white ${getEventColor(
                            event.type
                          )} hover:opacity-80 transition truncate`}
                          title={event.title}
                        >
                          {new Date(event.dateTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          {event.title}
                        </button>
                      ))}

                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-600">Répétition</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-gray-600">Spectacle</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600">Réunion</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-600">Apéro</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-gray-600">Installation</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
