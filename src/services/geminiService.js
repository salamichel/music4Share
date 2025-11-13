import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialiser l'API Gemini avec la clé
const initGeminiAPI = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_GEMINI_API_KEY non définie. Les enrichissements de titres ne fonctionneront pas.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Enrichit les informations d'un titre musical via l'API Gemini
 * @param {string} title - Titre de la chanson
 * @param {string} artist - Artiste/Groupe
 * @returns {Promise<Object>} Objet contenant: duration, chords, lyrics, genre
 */
export const enrichSongWithGemini = async (title, artist) => {
  try {
    const genAI = initGeminiAPI();

    // Si pas de clé API, retourner des données vides
    if (!genAI) {
      return {
        duration: null,
        chords: null,
        lyrics: null,
        genre: null,
        enriched: false
      };
    }

    // Utiliser le modèle Gemini 1.5 Flash (rapide et économique)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Tu es un assistant musical expert. Pour la chanson "${title}" de "${artist}", fournis les informations suivantes au format JSON strict :

{
  "duration": "durée au format MM:SS (ex: 03:45)",
  "chords": "grille d'accords simplifiée (ex: Intro: Am-F-C-G | Couplet: C-G-Am-F | Refrain: F-C-G-Am)",
  "lyrics": "paroles complètes de la chanson",
  "genre": "genre musical principal (ex: Rock, Pop, Jazz, etc.)"
}

IMPORTANT:
- Si tu ne trouves pas la chanson, retourne null pour chaque champ
- Pour les accords, donne une grille simplifiée avec les sections principales
- Pour les paroles, inclus les couplets et refrains
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parser la réponse JSON
    // Nettoyer le texte en enlevant les balises markdown si présentes
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const songData = JSON.parse(cleanedText);

    return {
      duration: songData.duration || null,
      chords: songData.chords || null,
      lyrics: songData.lyrics || null,
      genre: songData.genre || null,
      enriched: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement avec Gemini:', error);

    // En cas d'erreur, retourner des données vides
    return {
      duration: null,
      chords: null,
      lyrics: null,
      genre: null,
      enriched: false,
      error: error.message
    };
  }
};

/**
 * Enrichit plusieurs titres en batch avec gestion de rate limiting
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
