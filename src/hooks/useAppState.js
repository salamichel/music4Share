import { useState } from 'react';
import { DEFAULT_INSTRUMENT_SLOTS } from '../data/constants';

export const useAppState = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [songs, setSongs] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [instrumentSlots, setInstrumentSlots] = useState(DEFAULT_INSTRUMENT_SLOTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [showSlotManager, setShowSlotManager] = useState(false);

  return {
    currentUser,
    setCurrentUser,
    view,
    setView,
    users,
    setUsers,
    groups,
    setGroups,
    songs,
    setSongs,
    participations,
    setParticipations,
    instrumentSlots,
    setInstrumentSlots,
    searchTerm,
    setSearchTerm,
    bulkImportText,
    setBulkImportText,
    showBulkImport,
    setShowBulkImport,
    currentGroupId,
    setCurrentGroupId,
    showSlotManager,
    setShowSlotManager
  };
};
