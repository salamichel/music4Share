import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportSetlistToPDF = (setlist, setlistSongs, allSongs, participations, instrumentSlots, users, artists) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(setlist.name, 14, 20);

  // Description
  if (setlist.description) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const splitDescription = doc.splitTextToSize(setlist.description, 180);
    doc.text(splitDescription, 14, 30);
  }

  // Sort songs by position
  const sortedSetlistSongs = [...setlistSongs]
    .filter(ss => ss.setlistId === setlist.id)
    .sort((a, b) => a.position - b.position);

  // Calculate total duration
  let totalSeconds = 0;

  // Prepare table data
  const tableData = sortedSetlistSongs.map((setlistSong, index) => {
    const song = allSongs.find(s => s.id === setlistSong.songId);
    if (!song) return null;

    // Calculate duration
    if (song.duration) {
      const parts = song.duration.split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Get participants
    const songParticipations = participations.filter(p => p.songId === song.id);
    const participantsList = [];

    // Group by slot
    const slotMap = {};
    songParticipations.forEach(participation => {
      const slot = instrumentSlots.find(s => s.id === participation.slotId);

      let participantName = null;
      if (participation.artistId) {
        const artist = artists.find(a => a.id === participation.artistId);
        if (artist) participantName = artist.name;
      } else if (participation.userId) {
        const user = users.find(u => u.id === participation.userId);
        if (user) participantName = user.username;
      }

      if (slot && participantName) {
        if (!slotMap[slot.id]) {
          slotMap[slot.id] = {
            slotName: slot.name,
            users: []
          };
        }
        slotMap[slot.id].users.push(participantName);
      }
    });

    Object.values(slotMap).forEach(({ slotName, users }) => {
      participantsList.push(`${slotName}: ${users.join(', ')}`);
    });

    return [
      index + 1,
      song.title || '',
      song.artist || '',
      song.duration || '-',
      participantsList.join('\n') || 'Aucun participant'
    ];
  }).filter(row => row !== null);

  // Format total duration
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalDuration = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Add total row
  tableData.push([
    { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    { content: totalDuration, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    { content: '', styles: { fillColor: [240, 240, 240] } }
  ]);

  // Create table using autoTable
  autoTable(doc, {
    startY: setlist.description ? 45 : 30,
    head: [['#', 'Titre', 'Artiste', 'Durée', 'Participants']],
    body: tableData,
    headStyles: {
      fillColor: [147, 51, 234], // purple-600
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 70 }
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        data.settings.margin.left,
        pageHeight - 10
      );

      // Add date
      const today = new Date().toLocaleDateString('fr-FR');
      doc.text(
        `Généré le ${today}`,
        pageSize.width - 50,
        pageHeight - 10
      );
    }
  });

  // Save the PDF
  const fileName = `${setlist.name.replace(/[^a-z0-9]/gi, '_')}_setlist.pdf`;
  doc.save(fileName);
};

export const exportArtistPositioningSheet = (songs, participations, artists, filterGroup, groups) => {
  // Create document in landscape orientation for wider matrix
  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  let title = 'Feuille de Positionnement des Artistes';

  // Add group filter info if applicable
  if (filterGroup && filterGroup !== 'all') {
    if (filterGroup === 'null') {
      title += ' - Personnel';
    } else {
      const group = groups.find(g => g.id === filterGroup);
      if (group) {
        title += ` - ${group.name}`;
      }
    }
  }

  doc.text(title, 14, 15);

  // Sort songs alphabetically
  const sortedSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));

  // Get all artists that have participations in these songs
  const artistIds = new Set();
  participations.forEach(p => {
    if (p.artistId && sortedSongs.some(s => s.id === p.songId)) {
      artistIds.add(p.artistId);
    }
  });

  // Filter and sort artists alphabetically
  const activeArtists = artists
    .filter(a => artistIds.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (activeArtists.length === 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Aucun artiste positionné sur ces titres.', 14, 30);
    doc.save('feuille_positionnement_artistes.pdf');
    return;
  }

  // Build table headers: ['Titre', ...artist names]
  const headers = ['Titre', ...activeArtists.map(a => a.name)];

  // Build table body: each row is [songTitle, ...marks for each artist]
  const tableData = sortedSongs.map(song => {
    const row = [song.title || 'Sans titre'];

    // For each artist, check if they have a participation in this song
    activeArtists.forEach(artist => {
      const hasParticipation = participations.some(
        p => p.songId === song.id && p.artistId === artist.id
      );
      row.push(hasParticipation ? 'X' : '');
    });

    return row;
  });

  // Create table using autoTable
  autoTable(doc, {
    startY: 25,
    head: [headers],
    body: tableData,
    headStyles: {
      fillColor: [20, 184, 166], // teal-600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', halign: 'left' }, // Titre column
      // All other columns (artists) will be auto-sized and centered
      ...Object.fromEntries(
        activeArtists.map((_, index) => [
          index + 1,
          { halign: 'center', cellWidth: 'auto' }
        ])
      )
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width || pageSize.getWidth();
      const pageHeight = pageSize.height || pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        data.settings.margin.left,
        pageHeight - 10
      );

      // Add date and song count
      const today = new Date().toLocaleDateString('fr-FR');
      const info = `${sortedSongs.length} titre${sortedSongs.length > 1 ? 's' : ''} · ${activeArtists.length} artiste${activeArtists.length > 1 ? 's' : ''} · ${today}`;
      doc.text(
        info,
        pageWidth - data.settings.margin.right - doc.getTextWidth(info),
        pageHeight - 10
      );
    }
  });

  // Save the PDF
  const fileName = filterGroup && filterGroup !== 'all'
    ? `feuille_positionnement_${filterGroup === 'null' ? 'personnel' : filterGroup}.pdf`
    : 'feuille_positionnement_artistes.pdf';

  doc.save(fileName);
};
