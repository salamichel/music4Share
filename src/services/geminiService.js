import { GoogleGenAI } from '@google/genai';

// Initialiser l'API Gemini avec la clé
const initGeminiAPI = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_GEMINI_API_KEY non définie. Les enrichissements de titres ne fonctionneront pas.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Enrichit les informations d'un titre musical via l'API Gemini
 * @param {string} title - Titre de la chanson
 * @param {string} artist - Artiste/Groupe (optionnel)
 * @returns {Promise<Object>} Objet contenant: artist, duration, chords, lyrics, genre
 */
export const enrichSongWithGemini = async (title, artist = '') => {
  try {
    const ai = initGeminiAPI();

    // Si pas de clé API, retourner des données vides
    if (!ai) {
      return {
        artist: artist || null,
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        enriched: false
      };
    }

    // Construire le prompt en fonction de si l'artiste est fourni ou non
    const songIdentifier = artist
      ? `la chanson "${title}" de "${artist}"`
      : `la chanson intitulée "${title}"`;

    const prompt = `
Tu es un assistant musical expert. Pour ${songIdentifier}, fournis les informations suivantes au format JSON strict :

{
  "artist": "${artist || 'nom de l\'artiste ou du groupe'}",
  "duration": "durée au format MM:SS (ex: 03:45)",
  "chords": "grille d'accords simplifiée (ex: Intro: Am-F-C-G | Couplet: C-G-Am-F | Refrain: F-C-G-Am)",
  "lyrics": "paroles complètes de la chanson",
  "genre": "genre musical principal (ex: Rock, Pop, Jazz, etc.)",
  "youtubeLink": "lien YouTube officiel ou populaire de la chanson (format: https://www.youtube.com/watch?v=VIDEO_ID)"
}

IMPORTANT:
${!artist ? '- Identifie d\'abord l\'artiste ou le groupe qui a interprété cette chanson' : ''}
- Si tu ne trouves pas la chanson, retourne null pour chaque champ
- Pour le lien YouTube, fournis le lien de la version officielle ou la plus populaire
- Pour les accords, donne une grille simplifiée avec les sections principales
- Pour les paroles, inclus les couplets et refrains
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire
`;

    // Utiliser le modèle Gemini 2.5 Flash (version stable et disponible)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    console.log('🔍 Réponse complète de Gemini:', JSON.stringify(response, null, 2));

    // Accéder au texte dans la structure de réponse
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('❌ Aucun texte dans la réponse Gemini');
      return {
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        enriched: false
      };
    }

    // Parser la réponse JSON
    // Nettoyer le texte en enlevant les balises markdown si présentes
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const songData = JSON.parse(cleanedText);

    return {
      artist: songData.artist || artist || null,
      duration: songData.duration || null,
      chords: songData.chords || null,
      lyrics: songData.lyrics || null,
      genre: songData.genre || null,
      youtubeLink: songData.youtubeLink || null,
      enriched: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement avec Gemini:', error);

    // En cas d'erreur, retourner des données vides
    return {
      artist: artist || null,
      duration: null,
      chords: null,
      lyrics: null,
      genre: null,
      youtubeLink: null,
      enriched: false,
      error: error.message
    };
  }
};

/**
 * Enrichit plusieurs titres en UNE SEULE requête (plus efficace)
 * @param {Array<{id: string, title: string, artist: string}>} songs - Liste des chansons à enrichir
 * @returns {Promise<Array>} Tableau des résultats enrichis avec les IDs
 */
export const enrichBatchSongs = async (songs) => {
  try {
    const ai = initGeminiAPI();

    // Si pas de clé API, retourner des données vides
    if (!ai || songs.length === 0) {
      return songs.map(song => ({
        id: song.id,
        artist: song.artist || null,
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        youtubeLink: null,
        enriched: false
      }));
    }

    console.log(`🎵 Enrichissement en masse de ${songs.length} titre(s)...`);

    // Construire une liste des chansons pour le prompt
    const songsList = songs.map((song, index) =>
      song.artist
        ? `${index + 1}. "${song.title}" de "${song.artist}"`
        : `${index + 1}. "${song.title}"`
    ).join('\n');

    const prompt = `
Tu es un assistant musical expert. Pour chaque chanson de la liste suivante, fournis les informations au format JSON strict.

CHANSONS :
${songsList}

Retourne un tableau JSON avec exactement ${songs.length} objets dans le même ordre, chaque objet ayant ce format :
{
  "artist": "(nom de l'artiste ou du groupe)",
  "duration": "(durée au format MM:SS (ex: 03:45))",
  "chords": "(grille d'accords simplifiée (ex: Intro: Am-F-C-G | Couplet: C-G-Am-F | Refrain: F-C-G-Am))",
  "lyrics": "(paroles complètes de la chanson)",
  "genre": "(genre musical principal (ex: Rock, Pop, Jazz, etc.))",
  "youtubeLink": "(lien YouTube officiel ou populaire de la chanson (format: https://www.youtube.com/watch?v=VIDEO_ID))"
}

IMPORTANT:
- Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou après
- Si l'artiste est déjà fourni dans la liste, utilise-le pour identifier la chanson
- Si l'artiste n'est pas fourni, identifie-le à partir du titre
- Si tu ne trouves pas une chanson, mets null pour tous ses champs
- Pour le lien YouTube, utilise l'artiste fourni pour trouver la version officielle ou la plus populaire
- Pour les accords, donne une grille simplifiée avec les sections principales
- Pour les paroles, inclus les couplets et refrains
- Respecte STRICTEMENT l'ordre de la liste
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    // Accéder au texte dans la structure de réponse
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('❌ Aucun texte dans la réponse Gemini');
      return songs.map(song => ({
        id: song.id,
        artist: song.artist || null,
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        youtubeLink: null,
        enriched: false
      }));
    }

    // Parser la réponse JSON
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const enrichedDataArray = JSON.parse(cleanedText);

    // Vérifier que c'est bien un tableau
    if (!Array.isArray(enrichedDataArray)) {
      console.error('❌ La réponse Gemini n\'est pas un tableau');
      throw new Error('Invalid response format');
    }

    // Combiner avec les IDs des chansons
    return songs.map((song, index) => {
      const enrichedData = enrichedDataArray[index] || {};
      return {
        id: song.id,
        artist: enrichedData.artist || song.artist || null,
        duration: enrichedData.duration || null,
        chords: enrichedData.chords || null,
        lyrics: enrichedData.lyrics || null,
        genre: enrichedData.genre || null,
        youtubeLink: enrichedData.youtubeLink || null,
        enriched: !!(enrichedData.artist || enrichedData.duration || enrichedData.lyrics)
      };
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement en masse:', error);

    // En cas d'erreur, retourner des données vides
    return songs.map(song => ({
      id: song.id,
      artist: song.artist || null,
      duration: null,
      chords: null,
      lyrics: null,
      genre: null,
      youtubeLink: null,
      enriched: false,
      error: error.message
    }));
  }
};

/**
 * Enrichit plusieurs titres en batch avec gestion de rate limiting (ANCIENNE VERSION - une requête par titre)
 * @param {Array<{title: string, artist: string}>} songs - Liste des chansons à enrichir
 * @param {number} delayMs - Délai entre chaque requête (défaut: 1000ms)
 * @returns {Promise<Array>} Tableau des résultats enrichis
 */
export const enrichMultipleSongs = async (songs, delayMs = 1000) => {
  const results = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`🎵 Enrichissement ${i + 1}/${songs.length}: ${song.title} - ${song.artist}`);

    const enrichedData = await enrichSongWithGemini(song.title, song.artist);
    results.push({
      ...song,
      ...enrichedData
    });

    // Attendre avant la prochaine requête (sauf pour la dernière)
    if (i < songs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
};
