import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex gap-2 bg-white rounded-lg shadow-md p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md transition-all font-medium text-sm
          ${viewMode === 'grid'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        title="Vue en grille"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grille</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md transition-all font-medium text-sm
          ${viewMode === 'list'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        title="Vue en liste"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Liste</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;
