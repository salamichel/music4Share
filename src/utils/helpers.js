export const isSongPlayable = (songId, participations) => {
  const songParticipations = participations.filter(p => p.songId === songId);
  const filledSlots = new Set(songParticipations.map(p => p.slotId));
  
  const hasDrums = filledSlots.has('drums');
  const hasString = filledSlots.has('guitar') || filledSlots.has('bass');
  const hasVocals = filledSlots.has('vocals');
  
  return hasDrums && hasString && hasVocals;
};

export const getFilteredSongs = (songs, groupId, searchTerm) => {
  let filtered = songs.filter(s => s.ownerGroupId === groupId);
  if (searchTerm) {
    filtered = filtered.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  return filtered;
};

export const parseBulkImportText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const songs = [];
  
  lines.forEach(line => {
    const separators = [' - ', ' | ', ' / '];
    let title = line.trim();
    let artist = 'Inconnu';

    for (const sep of separators) {
      if (line.includes(sep)) {
        const parts = line.split(sep);
        title = parts[0].trim();
        artist = parts.slice(1).join(sep).trim();
        break;
      }
    }

    if (title) {
      songs.push({ title, artist });
    }
  });

  return songs;
};
