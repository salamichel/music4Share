/**
 * Service d'enrichissement multi-API
 * Combine plusieurs sources pour réduire la dépendance à Gemini
 *
 * APIs utilisées :
 * 1. MusicBrainz API - Métadonnées musicales (artiste, durée, genre) - GRATUIT
 * 2. Lyrics.ovh - Paroles - GRATUIT
 * 3. Gemini API - Fallback pour accords et enrichissement complet
 */

import { enrichSongWithGemini, enrichBatchSongs } from './geminiService';

// ============= MusicBrainz API =============
// Documentation: https://musicbrainz.org/doc/MusicBrainz_API
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const APP_NAME = 'Music4Chalemine';
const APP_VERSION = '1.0.0';
const CONTACT = 'contact@example.com';

/**
 * Recherche un titre sur MusicBrainz
 */
async function searchMusicBrainz(title, artist) {
  try {
    const query = artist
      ? `recording:"${title}" AND artist:"${artist}"`
      : `recording:"${title}"`;

    const url = `${MUSICBRAINZ_BASE_URL}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': `${APP_NAME}/${APP_VERSION} ( ${CONTACT} )`
      }
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.recordings && data.recordings.length > 0) {
      const recording = data.recordings[0];

      // Extraire les informations
      const artistName = recording['artist-credit']?.[0]?.name || artist || 'Artiste inconnu';
      const durationMs = recording.length;
      const duration = durationMs ? formatDuration(durationMs) : null;

      // Récupérer les tags/genres
      const tags = recording.tags?.slice(0, 3).map(t => t.name) || [];
      const genre = tags.length > 0 ? tags.join(', ') : null;

      return {
        artist: artistName,
        duration: duration,
        genre: genre,
        source: 'MusicBrainz'
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur MusicBrainz:', error);
    return null;
  }
}

/**
 * Formate la durée de millisecondes en MM:SS
 */
function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============= Lyrics.ovh API =============
// Documentation: https://lyricsovh.docs.apiary.io/
const LYRICS_OVH_BASE_URL = 'https://api.lyrics.ovh/v1';

/**
 * Récupère les paroles via Lyrics.ovh
 */
async function fetchLyrics(artist, title) {
  try {
    if (!artist || artist === 'Artiste inconnu') {
      return null;
    }

    const url = `${LYRICS_OVH_BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Lyrics.ovh error: ${response.status}`);
    }

    const data = await response.json();

    if (data.lyrics) {
      return {
        lyrics: data.lyrics.trim(),
        source: 'Lyrics.ovh'
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur Lyrics.ovh:', error);
    return null;
  }
}

// ============= Service d'enrichissement combiné =============

/**
 * Enrichit un titre avec plusieurs APIs
 * Stratégie : MusicBrainz + Lyrics.ovh, puis Gemini en fallback
 */
export async function enrichSongMultiAPI(title, artist) {
  const result = {
    artist: artist || 'Artiste inconnu',
    duration: null,
    chords: null,
    lyrics: null,
    genre: null,
    enriched: false,
    sources: []
  };

  try {
    // 1. Récupérer les métadonnées de MusicBrainz
    console.log(`🔍 Recherche MusicBrainz: "${title}"${artist ? ` - ${artist}` : ''}`);
    const musicBrainzData = await searchMusicBrainz(title, artist);

    if (musicBrainzData) {
      result.artist = musicBrainzData.artist;
      result.duration = musicBrainzData.duration;
      result.genre = musicBrainzData.genre;
      result.sources.push('MusicBrainz');
      console.log('✅ MusicBrainz:', musicBrainzData);
    }

    // 2. Récupérer les paroles de Lyrics.ovh
    console.log(`🎤 Recherche paroles: "${title}" - ${result.artist}`);
    const lyricsData = await fetchLyrics(result.artist, title);

    if (lyricsData) {
      result.lyrics = lyricsData.lyrics;
      result.sources.push('Lyrics.ovh');
      console.log('✅ Paroles trouvées');
    }

    // 3. Si on a au moins des métadonnées OU des paroles, on considère enrichi
    if (result.sources.length > 0) {
      result.enriched = true;
      console.log(`✅ Enrichi avec: ${result.sources.join(' + ')}`);
      return result;
    }

    // 4. Fallback Gemini si aucune donnée n'a été trouvée
    console.log('⚠️ Aucune donnée trouvée, fallback vers Gemini...');
    const geminiData = await enrichSongWithGemini(title, artist);

    if (geminiData && geminiData.enriched) {
      result.artist = geminiData.artist || result.artist;
      result.duration = geminiData.duration;
      result.chords = geminiData.chords;
      result.lyrics = geminiData.lyrics;
      result.genre = geminiData.genre;
      result.enriched = true;
      result.sources.push('Gemini');
      console.log('✅ Enrichi avec Gemini (fallback)');
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur enrichissement multi-API:', error);

    // Dernier fallback : essayer Gemini même en cas d'erreur
    try {
      const geminiData = await enrichSongWithGemini(title, artist);
      if (geminiData) {
        return { ...geminiData, sources: ['Gemini (fallback)'] };
      }
    } catch (geminiError) {
      console.error('❌ Gemini fallback échoué:', geminiError);
    }

    return result;
  }
}

/**
 * Enrichit plusieurs titres en batch
 * Utilise les APIs gratuites pour chaque titre individuellement
 * Gemini en batch uniquement pour les accords manquants
 */
export async function enrichBatchMultiAPI(songs) {
  const results = [];

  // Phase 1: Enrichir avec APIs gratuites
  console.log(`🔄 Enrichissement de ${songs.length} titres avec MusicBrainz + Lyrics.ovh...`);

  for (const song of songs) {
    const enrichedData = await enrichSongMultiAPI(song.title, song.artist);
    results.push({
      id: song.id,
      ...enrichedData
    });

    // Respect de la rate limit MusicBrainz (1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  // Phase 2: Pour les titres sans accords, essayer Gemini en batch
  const songsWithoutChords = results.filter(r => !r.chords);

  if (songsWithoutChords.length > 0) {
    console.log(`🎸 ${songsWithoutChords.length} titres sans accords, requête Gemini pour les accords...`);

    try {
      const geminiResults = await enrichBatchSongs(
        songsWithoutChords.map(r => ({
          id: r.id,
          title: songs.find(s => s.id === r.id).title,
          artist: r.artist
        }))
      );

      // Fusionner les résultats Gemini (accords uniquement)
      for (let i = 0; i < songsWithoutChords.length; i++) {
        const resultIndex = results.findIndex(r => r.id === songsWithoutChords[i].id);
        if (resultIndex !== -1 && geminiResults[i]?.chords) {
          results[resultIndex].chords = geminiResults[i].chords;
          results[resultIndex].sources.push('Gemini (accords)');
        }
      }
    } catch (error) {
      console.error('❌ Erreur batch Gemini pour accords:', error);
    }
  }

  return results;
}
